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

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function toProperCase(name?: string): string {
  if (!name || !name.trim()) return '-';
  const str = name.trim();
  
  // Convert words to Title/Proper Case while preserving academic degrees properly
  const formatted = str
    .toLowerCase()
    .replace(/(?:^|\s|\/|\(|\)|\.|,|-)[a-z]/g, (match) => match.toUpperCase())
    .replace(/\bS\.pd\b/gi, 'S.Pd')
    .replace(/\bM\.pd\b/gi, 'M.Pd')
    .replace(/\bS\.ag\b/gi, 'S.Ag')
    .replace(/\bS\.e\b/gi, 'S.E')
    .replace(/\bS\.st\b/gi, 'S.ST')
    .replace(/\bM\.m\b/gi, 'M.M')
    .replace(/\bS\.kom\b/gi, 'S.Kom')
    .replace(/\bS\.sos\b/gi, 'S.Sos')
    .replace(/\bS\.si\b/gi, 'S.Si')
    .replace(/\bH\.j\b/gi, 'Hj.');

  return formatted;
}

export function formatTitimangsa(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) {
    const now = new Date();
    return `${now.getDate()} ${MONTH_NAMES_ID[now.getMonth()]} ${now.getFullYear()}`;
  }

  const str = dateStr.trim();

  // 1. Check if it's already in "DD MMMM YYYY" format
  const mmmmRegex = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/;
  const matchMmmm = str.match(mmmmRegex);
  if (matchMmmm) {
    const day = parseInt(matchMmmm[1], 10);
    const monthText = matchMmmm[2].toLowerCase();
    const year = matchMmmm[3];

    const monthIndex = MONTH_NAMES_ID.findIndex((m) =>
      m.toLowerCase().startsWith(monthText.substring(0, 3))
    );

    if (monthIndex !== -1) {
      return `${day} ${MONTH_NAMES_ID[monthIndex]} ${year}`;
    }
  }

  // 2. Format DD/MM/YYYY or DD-MM-YYYY
  const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const matchDmy = str.match(dmyRegex);
  if (matchDmy) {
    const day = parseInt(matchDmy[1], 10);
    const month = parseInt(matchDmy[2], 10) - 1;
    const year = matchDmy[3];
    if (month >= 0 && month < 12) {
      return `${day} ${MONTH_NAMES_ID[month]} ${year}`;
    }
  }

  // 3. Format YYYY-MM-DD
  const ymdRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
  const matchYmd = str.match(ymdRegex);
  if (matchYmd) {
    const year = matchYmd[1];
    const month = parseInt(matchYmd[2], 10) - 1;
    const day = parseInt(matchYmd[3], 10);
    if (month >= 0 && month < 12) {
      return `${day} ${MONTH_NAMES_ID[month]} ${year}`;
    }
  }

  // 4. Try JS Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return `${parsed.getDate()} ${MONTH_NAMES_ID[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  return str;
}

