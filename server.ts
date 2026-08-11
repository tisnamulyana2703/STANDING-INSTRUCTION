import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API endpoint for parsing BOSP PDF rincian belanja using Gemini AI
  app.post('/api/parse-rincian-pdf', async (req, res) => {
    try {
      const { pdfBase64, fileName } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: 'Base64 PDF data is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing' });
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
Anda adalah sistem parser dokumen Kertas Kerja Perbulan / Rincian Belanja BOSP (Bantuan Operasional Satuan Pendidikan).
Ekstrak seluruh baris data rincian belanja dari file PDF ini menjadi array JSON terstruktur.

Setiap item harus memiliki field:
- kodeRekening: string (misal: "5.1.02.01.01.0024", atau "" jika header)
- kodeProgram: string (misal: "06. 05. 08.", atau "" jika tidak ada)
- uraian: string (nama kegiatan / barang / belanja, misal "Kertas HVS A4 80gr")
- volume: string (misal: "10", "1", atau "" jika header)
- satuan: string (misal: "rim", "pck", "kardus", "bulan", atau "" jika header)
- tarifHarga: number (harga satuan dalam angka murni, misal 55000, 0 jika header)
- jumlah: number (total jumlah dalam angka murni, misal 550000)
- isHeader: boolean (true jika merupakan baris judul standar/program/subkategori, false jika detail item belanja)
- bulan: string (misal "Agustus" atau bulan dari dokumen)
- tahun: string (misal "2026")

Kembalikan HANYA array JSON objek sesuai schema.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
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

      const text = response.text || '[]';
      const parsedData = JSON.parse(text);

      return res.json({
        success: true,
        items: parsedData,
      });
    } catch (err: any) {
      console.error('Error parsing PDF with Gemini:', err);
      return res.status(500).json({ error: err.message || 'Gagal mengekstraksi data PDF' });
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
