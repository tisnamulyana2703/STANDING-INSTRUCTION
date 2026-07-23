import { Transaction } from '../types';

export const RAW_DATA_TEXT = ``;

export function parseRawData(text: string): Transaction[] {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split('\n');
  const result: Transaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length < 10) continue;

    const noStr = parts[0] || `${i}`;
    const tanggal = parts[1] || '';
    const jenisTransaksi = parts[2] || '';
    const noSurat = parts[3] || '';
    const namaPenerima = parts[4] || '';
    const noRekPenerima = parts[5] || '';
    const namaBank = parts[6] || '';
    const pph = parts[7] || '-';
    const ppn = parts[8] || '-';
    
    // Clean Netto string to number
    const rawNetto = (parts[9] || '0').replace(/[^0-9]/g, '');
    const netto = parseInt(rawNetto, 10) || 0;
    
    const siplah = parts[10] || '';
    const noPo = parts[11] || '';
    const keterangan = parts[12] || '';
    const vendor = parts[13] || '';
    const statusSi = parts[14] || '';
    const bulan = parts[15] || '';
    const tahun = parts[16] || '';
    const deskripsiFull = parts[17] || '';
    const kategori = parts[18] || '';

    result.push({
      id: `tx-${noStr}-${i}`,
      no: parseInt(noStr, 10) || i,
      tanggal,
      jenisTransaksi,
      noSurat,
      namaPenerima,
      noRekPenerima,
      namaBank,
      pph,
      ppn,
      netto,
      siplah,
      noPo,
      keterangan,
      vendor,
      statusSi,
      bulan,
      tahun,
      deskripsiFull,
      kategori,
    });
  }

  return result;
}

export const INITIAL_TRANSACTIONS: Transaction[] = [];
