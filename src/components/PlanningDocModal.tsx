import React, { useState, useEffect, useRef } from 'react';
import { Transaction, SchoolSettings, Vendor } from '../types';
import { formatRupiah, formatTitimangsa } from '../utils/terbilang';
import { exportToPdf } from '../utils/pdfGenerator';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Save,
  Sliders,
  Building,
  UserCheck,
  Calendar,
  MapPin,
  Tag,
  Package
} from 'lucide-react';

interface PlanningDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  settings: SchoolSettings;
  vendors?: Vendor[];
  onSaveTransaction?: (updatedTx: Transaction) => void;
}

export function PlanningDocModal({
  isOpen,
  onClose,
  transactions,
  settings,
  vendors = [],
  onSaveTransaction,
}: PlanningDocModalProps) {
  // Filter for outgoing transactions if present, else fallback to all
  const outgoingTxs = transactions.filter(t => !t.tipeTransaksi || t.tipeTransaksi === 'KELUAR');
  const targetTxs = outgoingTxs.length > 0 ? outgoingTxs : transactions;

  const [activeTxIdx, setActiveTxIdx] = useState(0);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Editable Planning Document Fields
  const [noPesanan, setNoPesanan] = useState('');
  const [kategoriBarang, setKategoriBarang] = useState('');
  const [spesifikasiBarang, setSpesifikasiBarang] = useState('');
  const [waktuSerahTerima, setWaktuSerahTerima] = useState('');
  const [lokasiSerahTerima, setLokasiSerahTerima] = useState('');
  const [alokasiAnggaran, setAlokasiAnggaran] = useState('');
  const [identitasPenyedia, setIdentitasPenyedia] = useState('');
  const [npwpPenyedia, setNpwpPenyedia] = useState('');
  const [pelaksanaNama, setPelaksanaNama] = useState('');
  const [pelaksanaNip, setPelaksanaNip] = useState('');
  const [tanggalDokumen, setTanggalDokumen] = useState('');

  const currentTx = targetTxs[activeTxIdx] || targetTxs[0];

  // Load / initialize fields whenever activeTxIdx or currentTx changes
  useEffect(() => {
    if (currentTx) {
      const storageKey = `bosp_planning_doc_${currentTx.id || currentTx.no}`;
      const savedDataRaw = localStorage.getItem(storageKey);

      const matchedVendor = vendors.find(v => v.nama.toLowerCase() === (currentTx.vendor || '').toLowerCase());
      const vendorName = currentTx.vendor && currentTx.vendor !== '-' && currentTx.vendor !== 'NON SIPLAH' 
        ? currentTx.vendor 
        : 'PENYEDIA MITRA BOSP';
      const vendorNpwp = currentTx.vendorNpwp || matchedVendor?.npwp || '694191347404000';

      const kepsekNama = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nama : (settings?.kepalaSekolah || 'CARNIA, S.Pd');
      const kepsekNip = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nip : '197112201997032002';

      if (savedDataRaw) {
        try {
          const parsed = JSON.parse(savedDataRaw);
          setNoPesanan(parsed.noPesanan || `PO${currentTx.no ? String(currentTx.no).padStart(3, '0') : '001'}A78247054FFF`);
          setKategoriBarang(parsed.kategoriBarang || currentTx.kategori || '(*) -');
          setSpesifikasiBarang(parsed.spesifikasiBarang || currentTx.keterangan || currentTx.deskripsiFull || 'Pengadaan Barang / Jasa Kegiatan Operasional Satuan Pendidikan');
          setWaktuSerahTerima(parsed.waktuSerahTerima || formatTitimangsa(currentTx.tanggal));
          setLokasiSerahTerima(parsed.lokasiSerahTerima || settings?.alamatSekolah || 'Alamat Satuan Pendidikan');
          setAlokasiAnggaran(parsed.alokasiAnggaran || `${settings?.sumberDana || 'BOS REGULER'} ${currentTx.tahun || '2026'}`);
          setIdentitasPenyedia(parsed.identitasPenyedia || vendorName);
          setNpwpPenyedia(parsed.npwpPenyedia || vendorNpwp);
          setPelaksanaNama(parsed.pelaksanaNama || kepsekNama);
          setPelaksanaNip(parsed.pelaksanaNip || kepsekNip);
          setTanggalDokumen(parsed.tanggalDokumen || currentTx.tanggal || '');
          return;
        } catch (e) {
          console.error('Error parsing saved planning doc data:', e);
        }
      }

      // Default values from transaction & school settings
      setNoPesanan(currentTx.noPo || `PO${currentTx.no ? String(currentTx.no).padStart(3, '0') : '001'}A78247054FFF`);
      setKategoriBarang(currentTx.kategori ? `(*) ${currentTx.kategori}` : '(*) -');
      setSpesifikasiBarang(currentTx.keterangan || currentTx.deskripsiFull || currentTx.jenisTransaksi || 'Pengadaan Barang / Jasa Kegiatan Operasional Satuan Pendidikan');
      setWaktuSerahTerima(formatTitimangsa(currentTx.tanggal));
      setLokasiSerahTerima(settings?.alamatSekolah || 'Alamat Satuan Pendidikan');
      setAlokasiAnggaran(`${settings?.sumberDana || 'BOS REGULER'} ${currentTx.tahun || '2026'}`);
      setIdentitasPenyedia(vendorName);
      setNpwpPenyedia(vendorNpwp);
      setPelaksanaNama(kepsekNama);
      setPelaksanaNip(kepsekNip);
      setTanggalDokumen(currentTx.tanggal || '');
    }
  }, [isOpen, activeTxIdx, currentTx, settings, vendors]);

  const handleSaveData = () => {
    if (!currentTx) return;

    const payload = {
      noPesanan,
      kategoriBarang,
      spesifikasiBarang,
      waktuSerahTerima,
      lokasiSerahTerima,
      alokasiAnggaran,
      identitasPenyedia,
      npwpPenyedia,
      pelaksanaNama,
      pelaksanaNip,
      tanggalDokumen,
    };

    const storageKey = `bosp_planning_doc_${currentTx.id || currentTx.no}`;
    localStorage.setItem(storageKey, JSON.stringify(payload));

    if (onSaveTransaction) {
      onSaveTransaction({
        ...currentTx,
        noPo: noPesanan,
        vendor: identitasPenyedia,
        vendorNpwp: npwpPenyedia,
      });
    }

    setSaveSuccessMsg(`✓ Perubahan Dokumen Perencanaan Transaksi #${currentTx.no} Berhasil Disimpan!`);
    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!currentTx) return;
    try {
      const cleanNo = currentTx.no ? `_Tx${currentTx.no}` : '';
      await exportToPdf('planning-doc-paper-view', `Dokumen_Perencanaan_BOSP${cleanNo}`);
    } catch (err) {
      alert('Gagal mengekspor PDF: ' + String(err));
    }
  };

  if (!isOpen || !currentTx) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      {/* Printable CSS style injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #planning-doc-paper-view, #planning-doc-paper-view * {
            visibility: visible;
          }
          #planning-doc-paper-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                📋 DOKUMEN PERENCANAAN TRANSAKSI BOSP
              </h3>
              <p className="text-xs text-slate-400">
                Penyusunan berkas perencanaan kebutuhan pengadaan barang/jasa BOSP
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                showConfigPanel 
                  ? 'bg-indigo-600 text-white border-indigo-500' 
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{showConfigPanel ? 'Sembunyikan Form Edit' : 'Edit Isi Dokumen'}</span>
            </button>
            <button
              onClick={handleSaveData}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md border border-emerald-500/50 hover:scale-102 active:scale-98"
              title="Simpan Perubahan Rincian Perencanaan"
            >
              <Save className="w-4 h-4 text-emerald-100" />
              <span>Simpan Data</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak (Print)</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SAVE SUCCESS BANNER */}
        {saveSuccessMsg && (
          <div className="bg-emerald-500 text-slate-950 font-black text-xs px-6 py-2 flex items-center justify-between shrink-0 shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button 
              onClick={() => setSaveSuccessMsg('')} 
              className="text-slate-900 hover:text-black text-xs font-bold underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* TOP BAR: MULTI-TRANSACTION SELECTOR */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Pilih Transaksi Keluar ({activeTxIdx + 1} dari {targetTxs.length}):
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={activeTxIdx === 0}
                onClick={() => setActiveTxIdx((prev) => prev - 1)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={activeTxIdx}
                onChange={(e) => setActiveTxIdx(Number(e.target.value))}
                className="py-1 px-2.5 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 max-w-[320px] truncate cursor-pointer"
              >
                {targetTxs.map((tx, i) => (
                  <option key={`opt-tx-${i}`} value={i}>
                    #{tx.no} - {tx.keterangan || tx.jenisTransaksi || 'Transaksi'} (Rp {formatRupiah(tx.netto)})
                  </option>
                ))}
              </select>
              <button
                disabled={activeTxIdx === targetTxs.length - 1}
                onClick={() => setActiveTxIdx((prev) => prev + 1)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tanggal: <strong className="text-slate-800 dark:text-slate-200">{formatTitimangsa(currentTx.tanggal)}</strong> | Penerima/Vendor: <strong className="text-indigo-600 dark:text-indigo-400">{currentTx.vendor || currentTx.namaPenerima || '-'}</strong>
          </div>
        </div>

        {/* EDIT CONFIG FORM PANEL (OPTIONAL / EXPANDABLE) */}
        {showConfigPanel && (
          <div className="p-4 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs shrink-0 overflow-y-auto max-h-60">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">No Pesanan / PO:</label>
              <input
                type="text"
                value={noPesanan}
                onChange={(e) => setNoPesanan(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-slate-800 dark:text-slate-100"
                placeholder="PO6A78247054FFF"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Kategori Barang/Jasa:</label>
              <input
                type="text"
                value={kategoriBarang}
                onChange={(e) => setKategoriBarang(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                placeholder="(*) Pengadaan Buku / Alat Tulis"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Spesifikasi / Ruang Lingkup:</label>
              <input
                type="text"
                value={spesifikasiBarang}
                onChange={(e) => setSpesifikasiBarang(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                placeholder="Deskripsi spesifikasi barang..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Waktu Serah Terima:</label>
              <input
                type="text"
                value={waktuSerahTerima}
                onChange={(e) => setWaktuSerahTerima(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                placeholder="Senin, 10 Agustus 2026"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Lokasi Serah Terima:</label>
              <input
                type="text"
                value={lokasiSerahTerima}
                onChange={(e) => setLokasiSerahTerima(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                placeholder="Alamat sekolah / tempat penerimaan"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Alokasi Anggaran:</label>
              <input
                type="text"
                value={alokasiAnggaran}
                onChange={(e) => setAlokasiAnggaran(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                placeholder="BOS REGULER 2026"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Identitas Penyedia / Vendor:</label>
              <input
                type="text"
                value={identitasPenyedia}
                onChange={(e) => setIdentitasPenyedia(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                placeholder="Nama Toko / Vendor"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">NPWP Penyedia:</label>
              <input
                type="text"
                value={npwpPenyedia}
                onChange={(e) => setNpwpPenyedia(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-slate-800 dark:text-slate-100"
                placeholder="694191347404000"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nama Pelaksana Kegiatan:</label>
              <input
                type="text"
                value={pelaksanaNama}
                onChange={(e) => setPelaksanaNama(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                placeholder="Nama Pelaksana / Kepala Sekolah"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">NIP Pelaksana:</label>
              <input
                type="text"
                value={pelaksanaNip}
                onChange={(e) => setPelaksanaNip(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-slate-800 dark:text-slate-100"
                placeholder="197112201997032002"
              />
            </div>
          </div>
        )}

        {/* PAPER PREVIEW AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200 dark:bg-slate-950 flex justify-center">
          
          <div 
            id="planning-doc-paper-view"
            className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-8 sm:p-10 shadow-2xl rounded-sm font-sans flex flex-col justify-between text-xs leading-normal select-text relative border border-slate-300"
          >
            <div>
              {/* Top Gray Bar */}
              <div className="w-full h-3.5 bg-[#808080] mb-3"></div>

              {/* Order / PO Number top right */}
              <div className="text-right text-[11px] font-bold text-slate-900 mb-4">
                No Pesanan : <span className="font-mono">{noPesanan}</span>
              </div>

              {/* TITLE */}
              <h1 className="text-center text-base sm:text-lg font-extrabold uppercase tracking-wide text-black mb-6 mt-2">
                DOKUMEN PERENCANAAN
              </h1>

              {/* SCHOOL & CATEGORY HEADER INFO */}
              <div className="space-y-1.5 mb-6 text-xs text-black">
                <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">Nama Satuan Pendidikan</span>
                  <span className="text-center font-bold">:</span>
                  <span className="font-bold uppercase">{settings?.namaSekolah || 'SD NEGERI CIBURIAL'}</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">Alamat Satuan Pendidikan</span>
                  <span className="text-center font-bold">:</span>
                  <span>{settings?.alamatSekolah || 'Jl. Tangkuban Parahu Kp. Ciburial RT 02 RW 04 Desa Cibogo Kecamatan Lembang Kabupaten Bandung Barat Kode Pos 40391'}</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr] items-start pt-2">
                  <span className="font-bold">Kategori Barang/Jasa</span>
                  <span className="text-center font-bold">:</span>
                  <span>{kategoriBarang}</span>
                </div>
              </div>

              {/* MAIN PLANNING TABLE */}
              <table className="w-full border-collapse border border-black text-xs text-black mb-8">
                <thead>
                  <tr className="bg-[#d9d9d9]">
                    <th className="border border-black px-2 py-2 text-center font-bold w-[45px]">No</th>
                    <th className="border border-black px-3 py-2 text-center font-bold w-[220px]">Jenis</th>
                    <th className="border border-black px-3 py-2 text-center font-bold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Jumlah barang/jasa */}
                  <tr>
                    <td className="border border-black px-2 py-2 text-center align-top">1</td>
                    <td className="border border-black px-3 py-2 font-medium align-top">Jumlah barang/jasa</td>
                    <td className="border border-black px-3 py-2 font-semibold align-top">
                      Rp {formatRupiah(currentTx.netto)},00
                    </td>
                  </tr>

                  {/* Row 2: Spesifikasi/ruang lingkup */}
                  <tr>
                    <td className="border border-black px-2 py-2 text-center align-top">2</td>
                    <td className="border border-black px-3 py-2 font-medium align-top">Spesifikasi/ruang lingkup barang/jasa</td>
                    <td className="border border-black px-3 py-2 font-bold align-top">
                      {spesifikasiBarang}
                    </td>
                  </tr>

                  {/* Row 3: Waktu serah terima */}
                  <tr>
                    <td className="border border-black px-2 py-2 text-center align-top">3</td>
                    <td className="border border-black px-3 py-2 font-medium align-top">Waktu serah terima</td>
                    <td className="border border-black px-3 py-2 align-top">
                      {waktuSerahTerima}
                    </td>
                  </tr>

                  {/* Row 4: Lokasi serah terima */}
                  <tr>
                    <td className="border border-black px-2 py-2 text-center align-top">4</td>
                    <td className="border border-black px-3 py-2 font-medium align-top">Lokasi serah terima</td>
                    <td className="border border-black px-3 py-2 align-top">
                      {lokasiSerahTerima}
                    </td>
                  </tr>

                  {/* Row 5: Alokasi anggaran */}
                  <tr>
                    <td className="border border-black px-2 py-2 text-center align-top">5</td>
                    <td className="border border-black px-3 py-2 font-medium align-top">Alokasi anggaran</td>
                    <td className="border border-black px-3 py-2 font-bold align-top">
                      {alokasiAnggaran}
                    </td>
                  </tr>

                  {/* Row 6: Persyaratan Penyedia */}
                  <tr>
                    <td className="border border-black px-2 py-2 text-center align-top">6</td>
                    <td className="border border-black px-3 py-2 font-medium align-top">Persyaratan Penyedia</td>
                    <td className="border border-black px-3 py-2 align-top space-y-1">
                      <p>Perorangan/Badan Usaha Memenuhi syarat sebagai berikut :</p>
                      <p className="font-bold">a. Identitas Penyedia : {identitasPenyedia}</p>
                      <p className="font-bold">b. NPWP : {npwpPenyedia}</p>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* SIGNATURE BLOCK */}
              <div className="mt-12 flex justify-end text-xs text-black">
                <div className="text-center w-64 space-y-1">
                  <p>{settings?.kotaSurat || 'Kab. Bandung Barat'}, {formatTitimangsa(tanggalDokumen || currentTx.tanggal)}</p>
                  <p className="font-bold">Pelaksana</p>
                  
                  <div className="h-20"></div>

                  <p className="font-bold uppercase text-black">{pelaksanaNama}</p>
                  <p className="text-[11px]">NIP. {pelaksanaNip}</p>
                </div>
              </div>
            </div>

            {/* FOOTNOTE AT BOTTOM */}
            <div className="mt-12 pt-4 border-t border-slate-200 text-[9px] text-slate-700 italic leading-snug">
              (*) Misalnya Buku Teks Utama/Buku Teks Pendamping/Buku Nonteks/Kebutuhan dan Perlengkapan Satuan Pendidikan/Alat Peraga Pendidikan/Komputer dan Aksesoris/Elektronik/Jasa lainnya.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
