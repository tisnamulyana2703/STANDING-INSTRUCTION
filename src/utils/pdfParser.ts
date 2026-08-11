import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { RincianBelanjaItem } from '../types';

// Set worker source for PDF.js using bundled worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ExtractedPdfResult {
  success: boolean;
  items: RincianBelanjaItem[];
  detectedBulan?: string;
  detectedTahun?: string;
  detectedSekolah?: string;
  rawLineCount: number;
  message?: string;
}

/**
 * Clean numeric string e.g. "Rp. 1.200.000,00" -> 1200000
 */
function parseIndonesianNumber(val: string): number {
  if (!val) return 0;
  // Remove "Rp", dots (thousand separator), spaces
  const clean = val.replace(/Rp\.?/gi, '').replace(/\./g, '').replace(/,/g, '.').replace(/\s+/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Extracts structured Rincian Belanja items directly from PDF without using AI
 */
export async function extractRincianBelanjaFromPdf(file: File): Promise<ExtractedPdfResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let detectedBulan = 'Agustus';
    let detectedTahun = '2026';
    let detectedSekolah = '';

    const lines: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group text items by vertical position Y
      const itemsByY: { [yKey: number]: { x: number; text: string }[] } = {};

      for (const item of textContent.items as any[]) {
        if (!item.str || item.str.trim() === '') continue;

        // Round Y to nearest 3-4px to group words on the same text line
        const yKey = Math.round((item.transform[5] || 0) / 3) * 3;
        const x = item.transform[4] || 0;

        if (!itemsByY[yKey]) itemsByY[yKey] = [];
        itemsByY[yKey].push({ x, text: item.str });
      }

      // Sort lines top to bottom (Y descending in PDF coordinate space)
      const sortedYKeys = Object.keys(itemsByY)
        .map(Number)
        .sort((a, b) => b - a);

      for (const y of sortedYKeys) {
        // Sort items on the line left to right (X ascending)
        const lineItems = itemsByY[y].sort((a, b) => a.x - b.x);
        const lineText = lineItems.map(i => i.text).join(' ').replace(/\s+/g, ' ').trim();
        if (lineText.length > 0) {
          lines.push(lineText);
        }
      }
    }

    if (lines.length === 0) {
      return {
        success: false,
        items: [],
        rawLineCount: 0,
        message: 'Tidak dapat membaca teks dari file PDF. File mungkin berupa hasil scan gambar/foto.'
      };
    }

    // Attempt to detect Bulan & Tahun in document header
    const monthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    for (const line of lines.slice(0, 30)) {
      for (const m of monthsList) {
        if (line.toLowerCase().includes(m.toLowerCase())) {
          detectedBulan = m;
          break;
        }
      }
      const yearMatch = line.match(/202[4-9]/);
      if (yearMatch) {
        detectedTahun = yearMatch[0];
      }
      if (line.toLowerCase().includes('sd') || line.toLowerCase().includes('sekolah') || line.toLowerCase().includes('smp')) {
        detectedSekolah = line;
      }
    }

    // Parser State Machine
    const extractedItems: RincianBelanjaItem[] = [];
    let currentKodeProgram = '';
    let itemCounter = 1;

    const kodeRekeningRegex = /\b5\.\d\.\d{2}\.\d{2}\.\d{2}\.\d{4}\b|\b5\.\d\.\d{2}\.\d{2}\.\d{2}\b/i;
    const kodeProgramRegex = /^(\d{2}\.\s*\d{2}\.\s*\d{2}\.|\d{2}\.\s*\d{2}\.|\d{2}\.)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip document titles and boilerplate headers/footers
      if (
        line.toLowerCase().includes('kertas kerja') ||
        line.toLowerCase().includes('rincian belanja') ||
        line.toLowerCase().includes('halaman') ||
        line.toLowerCase().includes('sumber dana') ||
        line.toLowerCase().includes('nip.') ||
        line.toLowerCase().includes('kepala sekolah') ||
        line.toLowerCase().includes('bendahara')
      ) {
        continue;
      }

      // Check if line matches Kode Program (e.g. "02. 06. 01." or "02.")
      const progMatch = line.match(kodeProgramRegex);
      if (progMatch) {
        currentKodeProgram = progMatch[1].trim();
        const uraianHeader = line.replace(kodeProgramRegex, '').trim();

        if (uraianHeader.length > 0) {
          extractedItems.push({
            id: `rb-pdf-${Date.now()}-${itemCounter}`,
            noUrut: itemCounter++,
            kodeRekening: '',
            kodeProgram: currentKodeProgram,
            uraian: uraianHeader,
            volume: '',
            satuan: '',
            tarifHarga: 0,
            jumlah: 0,
            isHeader: true,
            bulan: detectedBulan,
            tahun: detectedTahun
          });
        }
        continue;
      }

      // Check if line matches Kode Rekening (e.g. "5.1.02.01.01.0055")
      const rekMatch = line.match(kodeRekeningRegex);
      if (rekMatch) {
        const kodeRek = rekMatch[0];
        let remainingText = line.replace(kodeRek, '').trim();

        // Extract numbers from line (volume, tarif, jumlah)
        // Find currency numbers e.g. "Rp 600.000" or numbers at the end
        const numbersMatch = remainingText.match(/(\d[\d\.\,]*)\s*([a-zA-Z]*)\s*(?:x|@)?\s*(\d[\d\.\,]*)\s*=\s*(\d[\d\.\,]*)/i);

        let volStr = '';
        let satuanStr = '';
        let tarifNum = 0;
        let jumlahNum = 0;
        let uraianStr = remainingText;

        if (numbersMatch) {
          volStr = numbersMatch[1];
          satuanStr = numbersMatch[2];
          tarifNum = parseIndonesianNumber(numbersMatch[3]);
          jumlahNum = parseIndonesianNumber(numbersMatch[4]);
          uraianStr = remainingText.substring(0, remainingText.indexOf(numbersMatch[0])).trim();
        } else {
          // Extract numbers at the end of line
          const tokens = remainingText.split(/\s+/);
          const numericTokens: { index: number; val: string; num: number }[] = [];

          tokens.forEach((tok, idx) => {
            const parsed = parseIndonesianNumber(tok);
            if (parsed > 0) {
              numericTokens.push({ index: idx, val: tok, num: parsed });
            }
          });

          if (numericTokens.length >= 2) {
            // Usually last token is Total Amount (jumlah), second last is Tarif/Harga
            jumlahNum = numericTokens[numericTokens.length - 1].num;
            tarifNum = numericTokens[numericTokens.length - 2].num;

            // Volume & Satuan might be before the numbers
            const cutIdx = numericTokens[numericTokens.length - 2].index;
            const textPart = tokens.slice(0, cutIdx).join(' ');

            // Find volume (digits) and unit (words)
            const volUnitMatch = textPart.match(/(\d+)\s*([a-zA-Z]+)$/);
            if (volUnitMatch) {
              volStr = volUnitMatch[1];
              satuanStr = volUnitMatch[2];
              uraianStr = textPart.replace(/(\d+)\s*([a-zA-Z]+)$/, '').trim();
            } else {
              uraianStr = textPart.trim();
            }
          }
        }

        if (uraianStr.length === 0) uraianStr = 'Belanja ' + kodeRek;

        extractedItems.push({
          id: `rb-pdf-${Date.now()}-${itemCounter}`,
          noUrut: itemCounter++,
          kodeRekening: kodeRek,
          kodeProgram: currentKodeProgram,
          uraian: uraianStr,
          volume: volStr || '1',
          satuan: satuanStr || 'paket',
          tarifHarga: tarifNum,
          jumlah: jumlahNum || (tarifNum * (parseFloat(volStr) || 1)),
          isHeader: false,
          bulan: detectedBulan,
          tahun: detectedTahun
        });
        continue;
      }

      // Check for standalone header lines or program section titles
      if (
        line.length > 5 &&
        !line.match(/\d{5,}/) &&
        !line.includes('Rp') &&
        (line.startsWith('Pengembangan') || line.startsWith('Kegiatan') || line.startsWith('Pelaksanaan') || line.startsWith('Pemeliharaan') || line.startsWith('Penyediaan'))
      ) {
        extractedItems.push({
          id: `rb-pdf-${Date.now()}-${itemCounter}`,
          noUrut: itemCounter++,
          kodeRekening: '',
          kodeProgram: currentKodeProgram,
          uraian: line.trim(),
          volume: '',
          satuan: '',
          tarifHarga: 0,
          jumlah: 0,
          isHeader: true,
          bulan: detectedBulan,
          tahun: detectedTahun
        });
      }
    }

    // Fallback: If structured extraction yields items, return them.
    // Otherwise parse general text lines into items.
    if (extractedItems.length === 0) {
      // General line fallback
      lines.forEach((line, idx) => {
        if (line.length > 3 && !line.toLowerCase().includes('halaman')) {
          const numbers = line.match(/[\d\.]+/g) || [];
          let amount = 0;
          for (const n of numbers) {
            const parsed = parseIndonesianNumber(n);
            if (parsed > 1000) {
              amount = parsed;
              break;
            }
          }

          extractedItems.push({
            id: `rb-pdf-${Date.now()}-${idx + 1}`,
            noUrut: idx + 1,
            kodeRekening: '',
            kodeProgram: '',
            uraian: line,
            volume: '1',
            satuan: 'kegiatan',
            tarifHarga: amount,
            jumlah: amount,
            isHeader: amount === 0,
            bulan: detectedBulan,
            tahun: detectedTahun
          });
        }
      });
    }

    return {
      success: extractedItems.length > 0,
      items: extractedItems,
      detectedBulan,
      detectedTahun,
      detectedSekolah,
      rawLineCount: lines.length,
      message: `Berhasil mengekstraksi ${extractedItems.length} item rincian belanja dari PDF.`
    };
  } catch (err: any) {
    console.error('PDF Client Parser Error:', err);
    return {
      success: false,
      items: [],
      rawLineCount: 0,
      message: 'Gagal memproses file PDF: ' + (err.message || 'Format PDF tidak dapat dibaca')
    };
  }
}
