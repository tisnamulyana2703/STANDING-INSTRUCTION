import React, { useState, useEffect } from 'react';
import { Transaction, Vendor, HonorRecipient } from '../types';
import { parseTaxAmount, calculateEffectiveNetto } from '../utils/taxCalculator';
import { X, Save, PlusCircle, Store, Settings, FolderPlus, UserCheck, Copy, AlertTriangle, CreditCard, Calculator } from 'lucide-react';
import { DEFAULT_CATEGORIES } from './CategoryManagementModal';

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  initialData?: Transaction | null;
  nextNo: number;
  vendors: Vendor[];
  categories?: string[];
  honorRecipients?: HonorRecipient[];
  onOpenVendorSettings?: () => void;
  onOpenCategoryManagement?: () => void;
  onOpenHonorSettings?: () => void;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const ROMAN_MONTHS_MAP: Record<string, string> = {
  Januari: 'I',
  Februari: 'II',
  Maret: 'III',
  April: 'IV',
  Mei: 'V',
  Juni: 'VI',
  Juli: 'VII',
  Agustus: 'VIII',
  September: 'IX',
  Oktober: 'X',
  November: 'XI',
  Desember: 'XII',
};

const ROMAN_MONTHS_ARRAY = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function generateNonSiplahNoPo(
  monthName?: string,
  yearStr?: string,
  isoDate?: string,
  existingXxxx?: string
): string {
  const random4 = existingXxxx || String(Math.floor(1000 + Math.random() * 9000));

  let roman = 'I';
  if (monthName && ROMAN_MONTHS_MAP[monthName]) {
    roman = ROMAN_MONTHS_MAP[monthName];
  } else if (isoDate) {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const idx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
      roman = ROMAN_MONTHS_ARRAY[idx] || 'I';
    }
  }

  let year = yearStr;
  if (!year && isoDate) {
    year = isoDate.split('-')[0];
  }
  if (!year) {
    year = `${new Date().getFullYear()}`;
  }

  return `trx/${random4}/${roman}/${year}`;
}

export const JENIS_TRANSAKSI_OPTIONS = [
  'Pembayaran Honor',
  'Pembelanjaan Siplah',
  'Pembayaran Workshop',
  'Pendaftaran Lomba',
  'Pembayaran Transport',
  'NON SIPLAH',
  'Transfer Tunai',
  'Tarik Tunai',
];

const KATEGORI_OPTIONS = [
  'HABIS PAKAI',
  'JASA KANTOR',
  'SEWA PERALATAN DAN MESIN',
  'SEWA GEDUNG DAN BANGUNAN',
  'KURSUS PELATIHAN / BIMTEK',
  'PEMELIHARAAN ALAT DAN MESIN',
  'PEMELIHARAAN GEDUNG DAN BANGUNAN',
  'PEMELIHARAAN JALAN, JARINGAN DAN IRIGASI',
  'PERJALANAN DINAS',
  'MODAL',
  'BUKU',
  'ATK / PENGGANDAAN',
];

function dmyToIso(dmy?: string): string {
  if (!dmy) return new Date().toISOString().split('T')[0];
  if (dmy.includes('-') && dmy.split('-')[0].length === 4) return dmy;
  const parts = dmy.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
}

function isoToDmy(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

function extractYearMonthFromIso(isoDate: string) {
  if (!isoDate) return { year: `${new Date().getFullYear()}`, month: 'Januari' };
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
    const monthName = INDONESIAN_MONTHS[monthIdx] || 'Januari';
    return { year, month: monthName };
  }
  return { year: `${new Date().getFullYear()}`, month: 'Januari' };
}

export function AddEditTransactionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  nextNo,
  vendors,
  categories = DEFAULT_CATEGORIES,
  honorRecipients = [],
  onOpenVendorSettings,
  onOpenCategoryManagement,
  onOpenHonorSettings,
}: AddEditTransactionModalProps) {
  const [dateIso, setDateIso] = useState('');
  const [formData, setFormData] = useState<Partial<Transaction>>({
    no: nextNo,
    tanggal: '',
    jenisTransaksi: 'Pembayaran Honor',
    noSurat: '',
    namaPenerima: '',
    noRekPenerima: '',
    namaBank: 'BJB',
    pph: '-',
    ppn: '-',
    netto: 0,
    siplah: 'Non Siplah',
    noPo: '',
    keterangan: '',
    vendor: 'NON SIPLAH',
    vendorAddress: '-',
    vendorHp: '-',
    vendorNpwp: '-',
    statusSi: 'SUDAH',
    bulan: 'Januari',
    tahun: `${new Date().getFullYear()}`,
    deskripsiFull: '',
    kategori: 'JASA KANTOR',
  });

  useEffect(() => {
    if (initialData) {
      const iso = dmyToIso(initialData.tanggal);
      setDateIso(iso);
      const { year, month } = extractYearMonthFromIso(iso);
      const isPemasukan =
        initialData?.tipeTransaksi === 'MASUK' ||
        (initialData?.jenisTransaksi || '').toUpperCase().includes('SALUR') ||
        (initialData?.jenisTransaksi || '').toUpperCase().includes('PEMASUKAN') ||
        initialData?.siplah === 'BOS SALUR';

      const currentSiplah = initialData?.siplah || 'Non Siplah';
      let autoNoPo = initialData?.noPo || '';
      if (currentSiplah === 'Non Siplah' && (!autoNoPo || autoNoPo.trim() === '')) {
        autoNoPo = generateNonSiplahNoPo(month, year, iso);
      }

      setFormData({
        ...initialData,
        id: initialData.id,
        tipeTransaksi: isPemasukan ? 'MASUK' : 'KELUAR',
        tahun: initialData?.tahun || year,
        bulan: initialData?.bulan || month,
        vendor: initialData?.vendor || 'NON SIPLAH',
        noPo: autoNoPo,
      });
    } else {
      const todayIso = new Date().toISOString().split('T')[0];
      setDateIso(todayIso);
      const todayDmy = isoToDmy(todayIso);
      const { year, month } = extractYearMonthFromIso(todayIso);

      const defaultVendor = vendors.find((v) => v.nama === 'NON SIPLAH') || vendors[0];
      const defaultNoPo = generateNonSiplahNoPo(month, year, todayIso);

      setFormData({
        no: nextNo,
        tanggal: todayDmy,
        tipeTransaksi: 'KELUAR',
        jenisTransaksi: 'Pembayaran Honor',
        noSurat: `900.3.5.5/001-SDN-CBL/I/${year}`,
        namaPenerima: '',
        noRekPenerima: '',
        namaBank: 'BJB',
        pph: '-',
        ppn: '-',
        netto: 0,
        siplah: 'Non Siplah',
        noPo: defaultNoPo,
        keterangan: '',
        vendor: defaultVendor ? defaultVendor.nama : 'NON SIPLAH',
        vendorAddress: defaultVendor ? defaultVendor.alamat : '-',
        vendorHp: defaultVendor ? defaultVendor.hp : '-',
        vendorNpwp: defaultVendor ? defaultVendor.npwp : '-',
        statusSi: 'SUDAH',
        bulan: month,
        tahun: year,
        deskripsiFull: '',
        kategori: 'JASA KANTOR',
      });
    }
  }, [initialData, nextNo, isOpen, vendors]);

  if (!isOpen) return null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIso = e.target.value;
    setDateIso(newIso);
    const formattedDmy = isoToDmy(newIso);
    const { year, month } = extractYearMonthFromIso(newIso);

    setFormData((prev) => {
      let updatedNoPo = prev.noPo || '';
      if (prev.siplah === 'Non Siplah') {
        const match = updatedNoPo.match(/^trx\/(\d{4})\//);
        const existingXxxx = match ? match[1] : undefined;
        updatedNoPo = generateNonSiplahNoPo(month, year, newIso, existingXxxx);
      }
      return {
        ...prev,
        tanggal: formattedDmy,
        tahun: year,
        bulan: month,
        noPo: updatedNoPo,
      };
    });
  };

  const handleVendorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVendorName = e.target.value;
    const foundVendor = vendors.find((v) => v.nama === selectedVendorName);
    const isSiplahVendor = selectedVendorName.toLowerCase().includes('siplah');

    setFormData((prev) => {
      const newSiplah = isSiplahVendor ? 'Siplah' : prev.siplah;
      let updatedNoPo = prev.noPo || '';
      if (newSiplah === 'Non Siplah') {
        if (!updatedNoPo || !updatedNoPo.startsWith('trx/')) {
          updatedNoPo = generateNonSiplahNoPo(prev.bulan, prev.tahun, dateIso);
        }
      } else if (newSiplah === 'Siplah') {
        if (updatedNoPo.startsWith('trx/')) {
          updatedNoPo = '';
        }
      }

      return {
        ...prev,
        vendor: selectedVendorName,
        vendorAddress: foundVendor?.alamat || prev.vendorAddress || '-',
        vendorHp: foundVendor?.hp || prev.vendorHp || '-',
        vendorNpwp: foundVendor?.npwp || prev.vendorNpwp || '-',
        siplah: newSiplah,
        noPo: updatedNoPo,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPenerima || !formData.netto) {
      alert('Mohon isi Nama Penerima dan Nominal Netto!');
      return;
    }

    const isPemasukan =
      formData.tipeTransaksi === 'MASUK' ||
      (formData.jenisTransaksi || '').toUpperCase().includes('SALUR') ||
      (formData.jenisTransaksi || '').toUpperCase().includes('PEMASUKAN') ||
      formData.siplah === 'BOS SALUR';

    const savedTx: Transaction = {
      id: formData.id || initialData?.id || (formData.no ? `tx-${formData.no}` : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
      no: Number(formData.no) || nextNo,
      tanggal: formData.tanggal || isoToDmy(dateIso),
      tipeTransaksi: isPemasukan ? 'MASUK' : 'KELUAR',
      jenisTransaksi: formData.jenisTransaksi || 'Pembayaran Honor',
      noSurat: formData.noSurat || '',
      namaPenerima: formData.namaPenerima || '',
      noRekPenerima: formData.noRekPenerima || '',
      namaBank: formData.namaBank || 'BJB',
      pph: formData.pph || '-',
      ppn: formData.ppn || '-',
      netto: Number(formData.netto) || 0,
      siplah: formData.siplah || 'Non Siplah',
      noPo: formData.noPo || '',
      keterangan: formData.keterangan || '',
      vendor: formData.vendor || 'NON SIPLAH',
      vendorAddress: formData.vendorAddress || '-',
      vendorHp: formData.vendorHp || '-',
      vendorNpwp: formData.vendorNpwp || '-',
      statusSi: formData.statusSi || 'SUDAH',
      bulan: formData.bulan || 'Januari',
      tahun: formData.tahun || `${new Date().getFullYear()}`,
      deskripsiFull: formData.deskripsiFull || `${formData.jenisTransaksi} ${formData.keterangan}`,
      kategori: formData.kategori || 'JASA KANTOR',
    };

    onSave(savedTx);
    onClose();
  };

  const isDuplicate = Boolean(initialData && !initialData.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* HEADER */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isDuplicate
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'
            }`}>
              {isDuplicate ? <Copy className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {initialData?.id
                  ? 'Edit Data Transaksi'
                  : isDuplicate
                  ? 'Duplikat Transaksi (Data Baru)'
                  : 'Tambah Transaksi Baru (Form Landscape)'}
                {isDuplicate && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-800">
                    Salin Tanggal & No. Surat
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDuplicate
                  ? 'Membuat transaksi baru dengan Tanggal & No. Surat yang disamakan dari transaksi asal'
                  : 'Isi rincian transaksi BOSP untuk dimasukkan ke database & Standing Instruction'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* DUPLICATE BANNER */}
          {isDuplicate && (
            <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-700/80 rounded-xl p-3 flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs shadow-2xs">
              <Copy className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">Mode Duplikat Transaksi:</span> Tanggal (<strong>{formData.tanggal}</strong>) dan No. Surat (<strong>{formData.noSurat || '-'}</strong>) secara otomatis disamakan. Sesuaikan penerima atau nominal jika diperlukan.
              </div>
            </div>
          )}

          {/* TIPE TRANSAKSI SELECTOR (TRANSAKSI MASUK vs TRANSAKSI KELUAR) */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  tipeTransaksi: 'KELUAR',
                  jenisTransaksi: prev.jenisTransaksi === 'BOSP SALUR' ? 'Pembayaran Honor' : prev.jenisTransaksi,
                  siplah: prev.siplah === 'BOS SALUR' ? 'Non Siplah' : prev.siplah,
                }));
              }}
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                formData.tipeTransaksi !== 'MASUK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
              🔴 Transaksi Keluar (Pengeluaran BOSP)
            </button>

            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  tipeTransaksi: 'MASUK',
                  jenisTransaksi: 'BOSP SALUR',
                  siplah: 'BOS SALUR',
                  vendor: 'BOS SALUR',
                  namaPenerima: prev.namaPenerima || 'REKENING KAS BOSP SEKOLAH',
                  namaBank: 'BJB',
                  kategori: 'PEMASUKAN / DANA SALUR',
                  keterangan: prev.keterangan || 'Penyaluran Dana BOSP Salur Tahap',
                }));
              }}
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                formData.tipeTransaksi === 'MASUK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
              🟢 Transaksi Masuk (Pemasukan / BOSP Salur)
            </button>
          </div>

          {/* LANDSCAPE 2-COLUMN CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            
            {/* COLUMN 1 (SISI KIRI: DATA TRANSAKSI & NOMINAL KEUANGAN) */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <span>Rincian Surat &amp; Rekening Penerima</span>
              </h4>

              {/* ROW 1: NO URUT (AUTOMATIC), TANGGAL, NO SURAT SI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>No. Urut</span>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
                      Otomatis
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.no}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    value={dateIso}
                    onChange={handleDateChange}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    No. Surat SI
                  </label>
                  <input
                    type="text"
                    value={formData.noSurat || ''}
                    onChange={(e) => setFormData({ ...formData, noSurat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="900.3.5.5/001-SDN-CBL/I/2026"
                  />
                </div>
              </div>

              {/* ROW 2: JENIS TRANSAKSI & NAMA PENERIMA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Transaksi
                  </label>
                  <select
                    value={formData.jenisTransaksi || 'Pembayaran Honor'}
                    onChange={(e) => setFormData({ ...formData, jenisTransaksi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                  >
                    {JENIS_TRANSAKSI_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    {formData.jenisTransaksi && !JENIS_TRANSAKSI_OPTIONS.includes(formData.jenisTransaksi) && (
                      <option value={formData.jenisTransaksi}>{formData.jenisTransaksi}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Penerima
                  </label>
                  <input
                    type="text"
                    value={formData.namaPenerima || ''}
                    onChange={(e) => setFormData({ ...formData, namaPenerima: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    placeholder="Nama Guru / Pegawai / Vendor"
                    required
                  />
                </div>
              </div>

              {/* ROW 3: REKENING & BANK */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      No. Rekening Penerima
                    </span>
                    {(!formData.noRekPenerima || formData.noRekPenerima.trim() === '' || formData.noRekPenerima.trim() === '-') ? (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        Kosong (Diperlukan saat cetak SI)
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                        ✓ Terisi
                      </span>
                    )}
                  </label>
                  <div className={`rounded-xl p-0.5 transition-all ${
                    (!formData.noRekPenerima || formData.noRekPenerima.trim() === '' || formData.noRekPenerima.trim() === '-')
                      ? 'border-2 border-amber-300 dark:border-amber-700 bg-amber-500/5 dark:bg-amber-950/20'
                      : 'border-2 border-amber-400 dark:border-amber-600 bg-amber-500/10 dark:bg-amber-950/40'
                  }`}>
                    <input
                      type="text"
                      value={formData.noRekPenerima || ''}
                      onChange={(e) => setFormData({ ...formData, noRekPenerima: e.target.value })}
                      className="w-full px-2.5 py-1.5 border-0 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                      placeholder="0122211231101 (Boleh dikosongkan)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bank Penerima
                  </label>
                  <input
                    type="text"
                    value={formData.namaBank || ''}
                    onChange={(e) => setFormData({ ...formData, namaBank: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="BJB / BRI / Mandiri"
                  />
                </div>
              </div>

              {/* ROW 4: FINANCIAL & TAX (NETTO, PPH, PPN) */}
              <div className="bg-slate-100/70 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Nominal Belanja / Bruto (Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.netto || ''}
                      onChange={(e) => setFormData({ ...formData, netto: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      placeholder="1500000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>PPh</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Untuk SI</span>
                    </label>
                    <input
                      type="text"
                      value={formData.pph || ''}
                      onChange={(e) => setFormData({ ...formData, pph: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      placeholder="Contoh: 100000 atau 5%"
                    />
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {['-', '1.5%', '2%', '5%', '15%', '21%'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, pph: preset }))}
                          className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                            formData.pph === preset
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>PPN</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Untuk SI</span>
                    </label>
                    <input
                      type="text"
                      value={formData.ppn || ''}
                      onChange={(e) => setFormData({ ...formData, ppn: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      placeholder="Contoh: 220000 atau 11%"
                    />
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {['-', '11%', '12%'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, ppn: preset }))}
                          className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                            formData.ppn === preset
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LIVE CALCULATION PREVIEW FOR STANDING INSTRUCTION */}
                {(() => {
                  const baseVal = Number(formData.netto) || 0;
                  const pphAmt = parseTaxAmount(formData.pph, baseVal);
                  const ppnAmt = parseTaxAmount(formData.ppn, baseVal);
                  const effectiveNettoVal = Math.max(0, baseVal - pphAmt - ppnAmt);
                  const hasTax = pphAmt > 0 || ppnAmt > 0;

                  return (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                        <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Kalkulasi Standing Instruction:</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        {hasTax && (
                          <span className="text-rose-600 dark:text-rose-400">
                            Potongan: -Rp {(pphAmt + ppnAmt).toLocaleString('id-ID')}
                          </span>
                        )}
                        <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md font-black border border-emerald-300 dark:border-emerald-800">
                          Netto SI: Rp {effectiveNettoVal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* COLUMN 2 (SISI KANAN: URAIAN, MASTER HONOR LIST, KATEGORI & VENDOR) */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                <Store className="w-4 h-4 text-amber-500" />
                <span>Uraian Belanja, Master Honor &amp; Vendor</span>
              </h4>

              {/* MASTER HONOR SELECTION & SUGGESTIONS */}
              {(formData.jenisTransaksi || '').toLowerCase().includes('honor') && honorRecipients.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-700/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1">
                      <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      List Nama Master Honorarium:
                    </span>
                    {onOpenHonorSettings && (
                      <button
                        type="button"
                        onClick={onOpenHonorSettings}
                        className="text-[10px] text-amber-800 dark:text-amber-300 font-bold underline hover:text-amber-900"
                      >
                        ⚙️ Kelola Honor
                      </button>
                    )}
                  </div>
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const found = honorRecipients.find((r) => r.id === selectedId);
                      if (found) {
                        const defaultKet = found.keteranganDefault?.trim()
                          ? `${found.keteranganDefault.trim()} Bulan ${formData.bulan || 'Januari'} ${formData.tahun || new Date().getFullYear()}`
                          : `Pembayaran Honorarium ${found.namaPenerima} Bulan ${formData.bulan || 'Januari'} ${formData.tahun || new Date().getFullYear()}`;

                        setFormData((prev) => ({
                          ...prev,
                          keterangan: defaultKet,
                          namaPenerima: found.namaPenerima,
                          noRekPenerima: found.noRekPenerima || '-',
                          namaBank: found.namaBank || 'BJB',
                          netto: found.netto || prev.netto || 0,
                          pph: found.pph || prev.pph || '-',
                          ppn: found.ppn || prev.ppn || '-',
                          kategori: found.kategoriDefault || 'JASA KANTOR',
                        }));
                      }
                    }}
                    defaultValue=""
                    className="w-full px-2.5 py-1.5 text-xs font-bold border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Nama dari List Master Honor --</option>
                    {honorRecipients.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.namaPenerima} ({rec.jabatan || 'Penerima Honor'}) - Rp {(rec.netto || 0).toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* URAIAN BELANJA */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Uraian Belanja (Keterangan)</span>
                  {(formData.jenisTransaksi || '').toLowerCase().includes('honor') && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      💡 Menggunakan List Nama Master Honor
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  list="honor-recipients-datalist"
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                  placeholder={(formData.jenisTransaksi || '').toLowerCase().includes('honor') ? "Ketik nama penerima honor atau uraian..." : "Uraian rincian belanja BOSP..."}
                />
                
                {/* DATALIST UNTUK SUGGESTION NAMA HONOR */}
                <datalist id="honor-recipients-datalist">
                  {honorRecipients.map((rec) => (
                    <React.Fragment key={rec.id}>
                      <option value={`Pembayaran Honorarium ${rec.namaPenerima} (${rec.jabatan || 'Honor'}) Bulan ${formData.bulan || 'Januari'} ${formData.tahun || new Date().getFullYear()}`} />
                      <option value={`Pembayaran Honor ${rec.namaPenerima}`} />
                      <option value={rec.namaPenerima} />
                    </React.Fragment>
                  ))}
                </datalist>
              </div>

              {/* KATEGORI BELANJA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-slate-300">
                    Kategori Belanja
                  </label>
                  {onOpenCategoryManagement && (
                    <button
                      type="button"
                      onClick={onOpenCategoryManagement}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3" />
                      + Kelola Kategori
                    </button>
                  )}
                </div>
                <select
                  value={formData.kategori || 'JASA KANTOR'}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {formData.kategori && !categories.includes(formData.kategori) && (
                    <option value={formData.kategori}>{formData.kategori}</option>
                  )}
                </select>
              </div>

              {/* VENDOR & SIPLAH SECTION */}
              <div className="border-t border-slate-200 dark:border-slate-700/60 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                      Penyedia / Vendor &amp; Siplah
                    </h5>
                  </div>
                  {onOpenVendorSettings && (
                    <button
                      type="button"
                      onClick={onOpenVendorSettings}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900"
                    >
                      <Settings className="w-3 h-3" />
                      + Master Vendor
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. VENDOR DROPDOWN */}
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Pilih Vendor / Toko
                    </label>
                    <select
                      value={formData.vendor || 'NON SIPLAH'}
                      onChange={handleVendorSelect}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer text-xs"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.nama}>
                          {v.nama}
                        </option>
                      ))}
                      {formData.vendor && !vendors.some((v) => v.nama === formData.vendor) && (
                        <option value={formData.vendor}>{formData.vendor}</option>
                      )}
                    </select>
                  </div>

                  {/* 2. NO PO */}
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>No. PO</span>
                      {formData.siplah === 'Non Siplah' && (
                        <button
                          type="button"
                          onClick={() => {
                            const freshNoPo = generateNonSiplahNoPo(formData.bulan, formData.tahun, dateIso);
                            setFormData((prev) => ({ ...prev, noPo: freshNoPo }));
                          }}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          title="Acak Ulang No. PO Non Siplah"
                        >
                          <span>🎲 Acak</span>
                        </button>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.noPo || ''}
                      onChange={(e) => setFormData({ ...formData, noPo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      placeholder={formData.siplah === 'Non Siplah' ? 'trx/xxxx/I/2026' : 'PO65AF1A4418431'}
                    />
                  </div>

                  {/* 3. STATUS SIPLAH */}
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Status Siplah
                    </label>
                    <select
                      value={formData.siplah || 'Non Siplah'}
                      onChange={(e) => {
                        const newSiplah = e.target.value;
                        setFormData((prev) => {
                          let updatedNoPo = prev.noPo || '';
                          if (newSiplah === 'Non Siplah') {
                            if (!updatedNoPo || !updatedNoPo.startsWith('trx/')) {
                              updatedNoPo = generateNonSiplahNoPo(prev.bulan, prev.tahun, dateIso);
                            }
                          } else if (newSiplah === 'Siplah') {
                            if (updatedNoPo.startsWith('trx/')) {
                              updatedNoPo = '';
                            }
                          }
                          return {
                            ...prev,
                            siplah: newSiplah,
                            noPo: updatedNoPo,
                          };
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium text-xs"
                    >
                      <option value="Non Siplah">Non Siplah</option>
                      <option value="Siplah">Siplah</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Simpan Data Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
