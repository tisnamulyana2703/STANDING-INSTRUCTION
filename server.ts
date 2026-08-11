import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // API endpoint for parsing BOSP PDF rincian belanja using Gemini AI
  app.post('/api/parse-rincian-pdf', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { pdfBase64, fileName } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ success: false, error: 'Data PDF base64 tidak ditemukan' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({ 
          success: false, 
          error: 'GEMINI_API_KEY belum dikonfigurasi di lingkungan server' 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Clean base64 string
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

      const prompt = `
Anda adalah sistem ekstraktor PDF Rincian Belanja / Kertas Kerja BOSP (Bantuan Operasional Satuan Pendidikan).
Tugas Anda: Ekstrak seluruh baris data rincian belanja dari file PDF ini menjadi array JSON terstruktur.

Setiap item dalam array JSON harus berformat objek dengan properti:
- kodeRekening: string (misal: "5.1.02.01.01.0024", atau "" jika header)
- kodeProgram: string (misal: "06. 05. 08.", atau "" jika tidak ada)
- uraian: string (nama kegiatan / barang / belanja, misal "Kertas HVS A4 80gr")
- volume: string (misal: "10", "1", atau "" jika header)
- satuan: string (misal: "rim", "pck", "kardus", "bulan", atau "" jika header)
- tarifHarga: number (harga satuan dalam angka murni, misal 55000, 0 jika header)
- jumlah: number (total jumlah dalam angka murni, misal 550000)
- isHeader: boolean (true jika merupakan baris judul/kategori/program, false jika detail item belanja)
- bulan: string (nama bulan dokumen misal "Januari", "Agustus", dll)
- tahun: string (misal "2026")

Kembalikan HANYA array JSON objek sesuai schema tanpa teks pembuka/penutup.
`;

      let text = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  kodeRekening: { type: Type.STRING },
                  kodeProgram: { type: Type.STRING },
                  uraian: { type: Type.STRING },
                  volume: { type: Type.STRING },
                  satuan: { type: Type.STRING },
                  tarifHarga: { type: Type.NUMBER },
                  jumlah: { type: Type.NUMBER },
                  isHeader: { type: Type.BOOLEAN },
                  bulan: { type: Type.STRING },
                  tahun: { type: Type.STRING },
                },
                required: ['uraian', 'jumlah'],
              },
            },
          },
        });
        text = response.text || '[]';
      } catch (geminiErr: any) {
        console.warn('Gemini 2.5 flash failed, fallback to gemini-2.0-flash:', geminiErr?.message);
        const fallbackResp = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        });
        text = fallbackResp.text || '[]';
      }

      // Sanitize text JSON output
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      const parsedData = JSON.parse(jsonString);

      return res.json({
        success: true,
        items: Array.isArray(parsedData) ? parsedData : [],
      });
    } catch (err: any) {
      console.error('Error parsing PDF with Gemini:', err);
      return res.status(200).json({ 
        success: false, 
        error: err.message || 'Gagal mengekstraksi data PDF melalui AI' 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
