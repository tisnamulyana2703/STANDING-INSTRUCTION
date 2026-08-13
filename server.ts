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
      const { pdfBase64, fileName, targetMonth } = req.body;
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

      const fallbackMonth = targetMonth && targetMonth !== 'ALL' ? targetMonth : 'Januari';

      const prompt = `
Anda adalah sistem ekstraktor cerdas untuk dokumen PDF Rincian Belanja / Kertas Kerja BOSP (Bantuan Operasional Satuan Pendidikan) Indonesia.
Tugas Anda: Ekstrak seluruh baris data rincian belanja dari file PDF ini menjadi array JSON terstruktur.

PENTING TENTANG DETEKSI BULAN:
1. Periksa bagian header/kop dokumen seperti "Bulan : Januari 2026", "Bulan: Februari", "Juli 2026", atau tanggal tanda tangan bendahara.
2. Tentukan nama bulan dokumen dalam bahasa Indonesia standar: "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", atau "Desember".
3. Jika dokumen menyebutkan nama bulan tertentu, cantumkan nama bulan tersebut pada properti 'bulan' di setiap item.
4. Jika nama bulan tidak tercantum di dokumen, gunakan fallback: "${fallbackMonth}".

Setiap item dalam array JSON harus berformat objek dengan properti:
- kodeRekening: string (misal: "5.1.02.01.01.0024", atau "" jika baris header/kategori)
- kodeProgram: string (misal: "02. 06. 01.", atau "" jika tidak ada)
- uraian: string (nama kegiatan / barang / belanja, misal "Kertas HVS A4 80gr")
- volume: string (misal: "10", "1", atau "" jika header)
- satuan: string (misal: "rim", "boks", "kardus", "bulan", "orang", atau "" jika header)
- tarifHarga: number (harga satuan dalam angka murni, misal 55000, 0 jika header)
- jumlah: number (total jumlah dalam angka murni, misal 550000)
- isHeader: boolean (true jika merupakan baris judul/kategori/program yang tidak memiliki kode rekening spesifik, false jika detail item belanja)
- bulan: string (misal "Januari", "Februari", dst)
- tahun: string (misal "2026")

Kembalikan HANYA array JSON objek sesuai schema tanpa teks pembuka/penutup.
`;

      let text = '';
      // Use currently active, supported models per Google GenAI SDK standards
      const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
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

          if (response && response.text) {
            text = response.text;
            break; // Successfully got response
          }
        } catch (modelErr: any) {
          lastError = modelErr;
          console.warn(`Model ${modelName} encountered an error:`, modelErr?.message || modelErr);
          // Wait briefly before attempting fallback model
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      if (!text && lastError) {
        throw new Error(`Semua model AI sedang sibuk atau mengalami kendala: ${lastError?.message || '503 Unavailable'}. Silakan coba kembali sesaat lagi.`);
      }

      // Sanitize text JSON output
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      const parsedData = JSON.parse(jsonString);

      // Detect prominent month among parsed items
      let detectedMonth = fallbackMonth;
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const monthCounts: Record<string, number> = {};
        for (const item of parsedData) {
          if (item.bulan && typeof item.bulan === 'string') {
            const b = item.bulan.trim();
            monthCounts[b] = (monthCounts[b] || 0) + 1;
          }
        }
        let maxCount = 0;
        for (const [m, count] of Object.entries(monthCounts)) {
          if (count > maxCount) {
            maxCount = count;
            detectedMonth = m;
          }
        }
      }

      return res.json({
        success: true,
        detectedMonth,
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
