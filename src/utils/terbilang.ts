function konversiAngka(angka: number): string {
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  if (angka < 12) {
    return satuan[angka];
  } else if (angka < 20) {
    return konversiAngka(angka - 10) + ' Belas';
  } else if (angka < 100) {
    return konversiAngka(Math.floor(angka / 10)) + ' Puluh ' + konversiAngka(angka % 10);
  } else if (angka < 200) {
    return 'Seratus ' + konversiAngka(angka - 100);
  } else if (angka < 1000) {
    return konversiAngka(Math.floor(angka / 100)) + ' Ratus ' + konversiAngka(angka % 100);
  } else if (angka < 2000) {
    return 'Seribu ' + konversiAngka(angka - 1000);
  } else if (angka < 1000000) {
    return konversiAngka(Math.floor(angka / 1000)) + ' Ribu ' + konversiAngka(angka % 1000);
  } else if (angka < 1000000000) {
    return konversiAngka(Math.floor(angka / 1000000)) + ' Juta ' + konversiAngka(angka % 1000000);
  } else if (angka < 1000000000000) {
    return konversiAngka(Math.floor(angka / 1000000000)) + ' Milyar ' + konversiAngka(angka % 1000000000);
  } else if (angka < 1000000000000000) {
    return konversiAngka(Math.floor(angka / 1000000000000)) + ' Triliun ' + konversiAngka(angka % 1000000000000);
  }
  return '';
}

export function terbilangRupiah(jumlah: number): string {
  if (isNaN(jumlah) || jumlah === 0) return 'Nol Rupiah';
  
  const hasil = konversiAngka(Math.abs(Math.floor(jumlah)))
    .replace(/\s+/g, ' ')
    .trim();

  return (hasil ? hasil : 'Nol') + ' Rupiah';
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
