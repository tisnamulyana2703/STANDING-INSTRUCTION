import React, { useState, useEffect } from 'react';
import { Transaction, Vendor } from '../types';
import { X, Save, PlusCircle, Store, Settings } from 'lucide-react';

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  initialData?: Transaction | null;
  nextNo: number;
  vendors: Vendor[];
  onOpenVendorSettings?: () => void;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const JENIS_TRANSAKSI_OPTIONS = [
  'Pembayaran Honor',
  'Pembelanjaan Siplah',
  'Pembayaran Workshop',
  'Pendaftaran Lomba',
  'Pembayaran Transport',
  'BOSP SALUR',
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
  onOpenVendorSettings,
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

      setFormData({
        ...initialData,
        tipeTransaksi: isPemasukan ? 'MASUK' : 'KELUAR',
        tahun: initialData?.tahun || year,
        bulan: initialData?.bulan || month,
        vendor: initialData?.vendor || 'NON SIPLAH',
      });
    } else {
      const todayIso = new Date().toISOString().split('T')[0];
      setDateIso(todayIso);
      const todayDmy = isoToDmy(todayIso);
      const { year, month } = extractYearMonthFromIso(todayIso);

      const defaultVendor = vendors.find((v) => v.nama === 'NON SIPLAH') || vendors[0];

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
        noPo: '',
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

    setFormData((prev) => ({
      ...prev,
      tanggal: formattedDmy,
      tahun: year,
      bulan: month,
    }));
  };

  const handleVendorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVendorName = e.target.value;
    const foundVendor = vendors.find((v) => v.nama === selectedVendorName);

    setFormData((prev) => ({
      ...prev,
      vendor: selectedVendorName,
      vendorAddress: foundVendor?.alamat || prev.vendorAddress || '-',
      vendorHp: foundVendor?.hp || prev.vendorHp || '-',
      vendorNpwp: foundVendor?.npwp || prev.vendorNpwp || '-',
      // Auto toggle Siplah status if Siplah is in vendor name or selected
      siplah: selectedVendorName.toLowerCase().includes('siplah') ? 'Siplah' : prev.siplah,
    }));
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
      id: formData.id || `tx-${Date.now()}`,
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* HEADER */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {initialData ? 'Edit Data Transaksi' : 'Tambah Transaksi Baru'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Isi rincian transaksi BOSP untuk dimasukkan ke database & Standing Instruction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
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
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
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
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                formData.tipeTransaksi === 'MASUK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
              🟢 Transaksi Masuk (Pemasukan / BOSP Salur)
            </button>
          </div>

          <div className="bg-slate-50/60 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            {/* ROW 1: NO URUT (AUTOMATIC), TANGGAL (PICKER), NO SURAT SI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>No. Urut</span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-200 dark:border-indigo-800">
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

            {/* ROW 2: JENIS TRANSAKSI (DROPDOWN), NAMA PENERIMA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                  placeholder="Nama Guru / Pegawai / Penerima Dana"
                  required
                />
              </div>
            </div>

            {/* ROW 3: REKENING, BANK, NETTO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No. Rekening Penerima
                </label>
                <input
                  type="text"
                  value={formData.noRekPenerima || ''}
                  onChange={(e) => setFormData({ ...formData, noRekPenerima: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0122211231101"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Bank Penerima
                </label>
                <input
                  type="text"
                  value={formData.namaBank || ''}
                  onChange={(e) => setFormData({ ...formData, namaBank: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="BJB / BRI / Mandiri"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Netto (Rp)
                </label>
                <input
                  type="number"
                  value={formData.netto || ''}
                  onChange={(e) => setFormData({ ...formData, netto: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="2500000"
                  required
                />
              </div>
            </div>

            {/* ROW 4: URAIAN BELANJA (KETERANGAN), KATEGORI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Uraian Belanja
                </label>
                <input
                  type="text"
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Uraian rincian belanja BOSP..."
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Belanja
                </label>
                <select
                  value={formData.kategori || 'JASA KANTOR'}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                >
                  {KATEGORI_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {formData.kategori && !KATEGORI_OPTIONS.includes(formData.kategori) && (
                    <option value={formData.kategori}>{formData.kategori}</option>
                  )}
                </select>
              </div>
            </div>

            {/* ROW 5: VENDOR DROPDOWN, NO PO, STATUS SIPLAH (ONLY THESE THREE FOR VENDOR) */}
            <div className="border-t border-slate-200 dark:border-slate-700/60 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    Informasi Vendor & Siplah
                  </h4>
                </div>
                {onOpenVendorSettings && (
                  <button
                    type="button"
                    onClick={onOpenVendorSettings}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900"
                  >
                    <Settings className="w-3 h-3" />
                    + Kelola Master Vendor
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. VENDOR DROPDOWN */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Vendor / Toko
                  </label>
                  <select
                    value={formData.vendor || 'NON SIPLAH'}
                    onChange={handleVendorSelect}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.nama}>
                        {v.nama}
                      </option>
                    ))}
                    {/* Fallback if current tx has custom vendor not in list */}
                    {formData.vendor && !vendors.some((v) => v.nama === formData.vendor) && (
                      <option value={formData.vendor}>{formData.vendor}</option>
                    )}
                  </select>
                </div>

                {/* 2. NO PO */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    No. PO (Jika Siplah)
                  </label>
                  <input
                    type="text"
                    value={formData.noPo || ''}
                    onChange={(e) => setFormData({ ...formData, noPo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="PO65AF1A4418431"
                  />
                </div>

                {/* 3. STATUS SIPLAH */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Siplah
                  </label>
                  <select
                    value={formData.siplah || 'Non Siplah'}
                    onChange={(e) => setFormData({ ...formData, siplah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                  >
                    <option value="Non Siplah">Non Siplah</option>
                    <option value="Siplah">Siplah</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
