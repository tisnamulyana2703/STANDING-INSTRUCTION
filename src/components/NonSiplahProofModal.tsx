import React, { useState, useEffect, useRef } from 'react';
import { Transaction, SchoolSettings, Vendor } from '../types';
import { formatRupiah, terbilangRupiah, formatTitimangsa } from '../utils/terbilang';
import { LogoBandungBarat, LogoTutWuri } from './Logos';
import { exportToPdf } from '../utils/pdfGenerator';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Sliders,
  Utensils,
  Receipt,
  GraduationCap,
  PackageCheck,
  Plus,
  Trash2,
  Save
} from 'lucide-react';

interface NonSiplahProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  settings: SchoolSettings;
  vendors?: Vendor[];
  onSaveTransaction?: (updatedTx: Transaction) => void;
}

export type ActivityType = 'HONOR' | 'KONSUMSI' | 'BARANG_JASA';

interface Participant {
  id: string;
  nama: string;
  jabatan: string;
}

export function NonSiplahProofModal({
  isOpen,
  onClose,
  transactions,
  settings,
  vendors = [],
  onSaveTransaction,
}: NonSiplahProofModalProps) {
  const [activeTxIdx, setActiveTxIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'ALL' | string>('ALL');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  
  // Custom document settings
  const [activityType, setActivityType] = useState<ActivityType>('BARANG_JASA');
  const [noUndangan, setNoUndangan] = useState('');
  const [noBast, setNoBast] = useState('');
  const [noKwitansi, setNoKwitansi] = useState('');
  const [noBkk, setNoBkk] = useState('');
  const [tanggalDokumen, setTanggalDokumen] = useState('');
  const [tempatAcara, setTempatAcara] = useState('');
  const [agendaRapat, setAgendaRapat] = useState('');
  const [namaPenyedia, setNamaPenyedia] = useState('');
  const [alamatPenyedia, setAlamatPenyedia] = useState('');
  const [hpPenyedia, setHpPenyedia] = useState('');
  const [jabatanPenerima, setJabatanPenerima] = useState('');

  // Rapat Participants
  const [participants, setParticipants] = useState<Participant[]>([]);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const currentTx = transactions[activeTxIdx] || transactions[0];

  // Helper: Detect activity type automatically from description
  const detectActivityType = (tx: Transaction): ActivityType => {
    if (!tx) return 'BARANG_JASA';
    if (tx.activityType) return tx.activityType;
    const ket = (tx.keterangan || tx.deskripsiFull || tx.jenisTransaksi || '').toLowerCase();
    if (
      ket.includes('honor') || 
      ket.includes('gaji') || 
      ket.includes('insentif') || 
      ket.includes('ekstra') || 
      ket.includes('gtt') || 
      ket.includes('ptt') || 
      ket.includes('tamsil')
    ) {
      return 'HONOR';
    }
    if (
      ket.includes('konsumsi') || 
      ket.includes('makan') || 
      ket.includes('minum') || 
      ket.includes('snack') || 
      ket.includes('rapat') ||
      ket.includes('snak')
    ) {
      return 'KONSUMSI';
    }
    return 'BARANG_JASA';
  };

  // Sync state when transaction index changes or modal opens
  useEffect(() => {
    if (isOpen && currentTx) {
      // Check if saved data exists in localStorage
      const storageKey = `bosp_proof_data_${currentTx.id || currentTx.no}`;
      const savedRaw = localStorage.getItem(storageKey);

      const kepsekNama = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nama : 'Kepala Sekolah';
      const bendaharaNama = typeof settings?.bendahara === 'object' ? settings.bendahara.nama : 'Bendahara Sekolah';
      const defaultParticipants: Participant[] = [
        { id: '1', nama: kepsekNama, jabatan: 'Kepala Sekolah' },
        { id: '2', nama: bendaharaNama, jabatan: 'Bendahara BOSP' },
        { id: '3', nama: currentTx.namaPenerima || 'Guru Kelas', jabatan: 'Guru / Tenaga Pendidik' },
        { id: '4', nama: 'Siti Rukmah, S.Pd.SD', jabatan: 'Guru Kelas / Anggota' },
        { id: '5', nama: 'Epiliani Kinasih, S.Pd', jabatan: 'Guru Kelas / Anggota' },
        { id: '6', nama: 'Zaidan Muhammad Z, S.Pd', jabatan: 'Guru PJOK / Anggota' },
      ];

      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw);
          setActivityType(saved.activityType || detectActivityType(currentTx));
          setNoUndangan(saved.noUndangan || '');
          setNoBast(saved.noBast || '');
          setNoKwitansi(saved.noKwitansi || '');
          setNoBkk(saved.noBkk || '');
          setTanggalDokumen(saved.tanggalDokumen || currentTx.tanggal || '');
          setTempatAcara(saved.tempatAcara || `Ruang Rapat ${settings?.namaSekolah || 'SD Negeri Ciburial'}`);
          setAgendaRapat(saved.agendaRapat || currentTx.keterangan || currentTx.deskripsiFull || 'Rapat Evaluasi & Pelaksanaan BOSP');
          setNamaPenyedia(saved.namaPenyedia || currentTx.vendor || 'Catering / Toko Mitra BOSP');
          setAlamatPenyedia(saved.alamatPenyedia || currentTx.vendorAddress || settings?.kotaSurat || 'Lembang, Bandung Barat');
          setHpPenyedia(saved.hpPenyedia || currentTx.vendorHp || '-');
          setJabatanPenerima(saved.jabatanPenerima || 'Guru / Tenaga Pendidik');
          setParticipants(Array.isArray(saved.participants) && saved.participants.length > 0 ? saved.participants : defaultParticipants);
          setActiveTab('ALL');
          return;
        } catch (e) {
          console.warn('Failed to parse saved proof data:', e);
        }
      }

      // Default values if no saved storage
      const detected = detectActivityType(currentTx);
      setActivityType(detected);

      // Extract details
      const cleanNoSurat = (currentTx.noSurat || '400.3.5.5/001').replace(/[/\\?%*:|"<>]/g, '/');
      setNoUndangan(currentTx.noUndangan || `005/${cleanNoSurat}/UND/${currentTx.tahun || '2026'}`);
      setNoBast(currentTx.noBast || `027/${cleanNoSurat}/BAST/${currentTx.tahun || '2026'}`);
      setNoKwitansi(currentTx.noKwitansi || `KW/${currentTx.no || '001'}/BOSP/${currentTx.tahun || '2026'}`);
      setNoBkk(currentTx.noBkk || `BKK/${currentTx.no || '001'}/BOSP/${currentTx.tahun || '2026'}`);

      setTanggalDokumen(currentTx.tanggal || '');
      setTempatAcara(currentTx.tempatAcara || `Ruang Rapat ${settings?.namaSekolah || 'SD Negeri Ciburial'}`);
      setAgendaRapat(currentTx.agendaRapat || currentTx.keterangan || currentTx.deskripsiFull || 'Rapat Evaluasi & Pelaksanaan BOSP');

      // Vendor Info
      const vName = currentTx.vendor && currentTx.vendor !== 'NON SIPLAH' && currentTx.vendor !== '-'
        ? currentTx.vendor
        : 'Catering / Toko Mitra BOSP';
      setNamaPenyedia(vName);

      // Search match in master vendors
      const matchedVendor = vendors.find((v) => v.nama.toLowerCase() === vName.toLowerCase());
      setAlamatPenyedia(currentTx.vendorAddress || matchedVendor?.alamat || settings?.kotaSurat || 'Lembang, Bandung Barat');
      setHpPenyedia(currentTx.vendorHp || matchedVendor?.hp || '-');

      setJabatanPenerima('Guru / Tenaga Pendidik');

      setParticipants(defaultParticipants);

      setActiveTab('ALL');
    }
  }, [isOpen, activeTxIdx, currentTx, settings]);

  // Handler: Save proof data
  const handleSaveProofData = () => {
    if (!currentTx) return;

    const payload = {
      activityType,
      noUndangan,
      noBast,
      noKwitansi,
      noBkk,
      tanggalDokumen,
      tempatAcara,
      agendaRapat,
      namaPenyedia,
      alamatPenyedia,
      hpPenyedia,
      jabatanPenerima,
      participants,
    };

    // Save to LocalStorage
    const storageKey = `bosp_proof_data_${currentTx.id || currentTx.no}`;
    localStorage.setItem(storageKey, JSON.stringify(payload));

    // Update transaction state in App
    const updatedTx: Transaction = {
      ...currentTx,
      activityType,
      noUndangan,
      noBast,
      noKwitansi,
      noBkk,
      tempatAcara,
      agendaRapat,
      vendor: namaPenyedia,
      vendorAddress: alamatPenyedia,
      vendorHp: hpPenyedia,
    };

    if (onSaveTransaction) {
      onSaveTransaction(updatedTx);
    }

    setSaveSuccessMsg(`✓ Perubahan Data Bukti Fisik Transaksi #${currentTx.no} Berhasil Disimpan!`);
    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 4000);
  };

  if (!isOpen || !currentTx) return null;

  const kepsekNama = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nama : (settings?.kepalaSekolah || 'NAMA KEPALA SEKOLAH');
  const kepsekNip = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nip : '-';
  const bendaharaNama = typeof settings?.bendahara === 'object' ? settings.bendahara.nama : (settings?.bendahara || 'NAMA BENDAHARA');
  const bendaharaNip = typeof settings?.bendahara === 'object' ? settings.bendahara.nip : '-';

  const nettoAmount = Number(currentTx.netto) || 0;
  const pphVal = currentTx.pph || '-';
  const ppnVal = currentTx.ppn || '-';

  // Handle printing
  const handlePrint = () => {
    const content = document.getElementById('bukti-fisik-print-area');
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up dibolehkan di browser.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bukti Fisik Non-SIPLAH - ${currentTx.namaPenerima || 'Transaksi'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
            .no-print {
              display: none !important;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              font-size: 11px;
            }
            .kop-header {
              border-bottom: 3px double #000;
              padding-bottom: 6px;
              margin-bottom: 12px;
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div>${content.innerHTML}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPdf = async () => {
    try {
      await exportToPdf('bukti-fisik-print-area', `Bukti_Fisik_NonSIPLAH_${currentTx.no}_${currentTx.namaPenerima.replace(/\s+/g, '_')}`);
    } catch (e) {
      console.error(e);
      alert('Gagal mengeksport PDF. Menggunakan opsi Print.');
      handlePrint();
    }
  };

  const addParticipant = () => {
    const newId = String(Date.now());
    setParticipants([...participants, { id: newId, nama: 'Nama Anggota / Guru', jabatan: 'Peserta Rapat' }]);
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const updateParticipant = (id: string, field: 'nama' | 'jabatan', val: string) => {
    setParticipants(participants.map((p) => p.id === id ? { ...p, [field]: val } : p));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                📄 DOKUMEN BUKTI FISIK TRANSAKSI NON-SIPLAH
              </h3>
              <p className="text-xs text-slate-400">
                Penyusunan berkas bukti pertanggungjawaban fisik lengkap BOSP (Non-SIPLAH)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveProofData}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md border border-emerald-500/50 hover:scale-102 active:scale-98"
              title="Simpan Perubahan No. Dokumen, Agenda, Peserta & Penyedia ke Database"
            >
              <Save className="w-4 h-4 text-emerald-100" />
              <span>Simpan Data</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Berkas (Print)</span>
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
          <div className="bg-emerald-500 text-slate-950 font-black text-xs px-6 py-2 flex items-center justify-between shrink-0 shadow-inner animate-in slide-in-from-top-2">
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

        {/* TOP BAR: MULTI-TRANSACTION SELECTOR & ACTIVITY CATEGORY */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Transaction Pagination / Picker */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Transaksi ({activeTxIdx + 1} dari {transactions.length}):
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={activeTxIdx === 0}
                onClick={() => setActiveTxIdx((prev) => prev - 1)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={activeTxIdx}
                onChange={(e) => setActiveTxIdx(Number(e.target.value))}
                className="py-1 px-2.5 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 max-w-[280px] truncate"
              >
                {transactions.map((tx, i) => (
                  <option key={`opt-tx-${i}`} value={i}>
                    #{tx.no} - {tx.namaPenerima} (Rp {formatRupiah(tx.netto)})
                  </option>
                ))}
              </select>
              <button
                disabled={activeTxIdx === transactions.length - 1}
                onClick={() => setActiveTxIdx((prev) => prev + 1)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Activity Category Switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-200/70 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-300/60 dark:border-slate-700">
            <button
              onClick={() => {
                setActivityType('HONOR');
                setActiveTab('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                activityType === 'HONOR'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>1. Pembayaran Honor (Slip Gaji)</span>
            </button>

            <button
              onClick={() => {
                setActivityType('KONSUMSI');
                setActiveTab('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                activityType === 'KONSUMSI'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>2. Konsumsi Rapat</span>
            </button>

            <button
              onClick={() => {
                setActivityType('BARANG_JASA');
                setActiveTab('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                activityType === 'BARANG_JASA'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>3. Barang / Jasa Umum</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY: LEFT FORM / CONTROL PANEL + RIGHT LIVE PRINT PREVIEW */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* LEFT SIDEBAR: CUSTOMIZE METADATA (4 COLUMNS) */}
          <div className="lg:col-span-4 p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Pengaturan Isian Dokumen</span>
              </h4>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-full">
                {activityType === 'HONOR' ? 'Honor / Gaji' : activityType === 'KONSUMSI' ? 'Konsumsi Rapat' : 'Barang / Jasa'}
              </span>
            </div>

            {/* Document Numbers */}
            <div className="space-y-3">
              {activityType === 'KONSUMSI' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Surat Undangan Rapat
                  </label>
                  <input
                    type="text"
                    value={noUndangan}
                    onChange={(e) => setNoUndangan(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              )}

              {(activityType === 'KONSUMSI' || activityType === 'BARANG_JASA') && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Berita Acara (BAST)
                  </label>
                  <input
                    type="text"
                    value={noBast}
                    onChange={(e) => setNoBast(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Kwitansi
                  </label>
                  <input
                    type="text"
                    value={noKwitansi}
                    onChange={(e) => setNoKwitansi(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Bukti Kas (BKK)
                  </label>
                  <input
                    type="text"
                    value={noBkk}
                    onChange={(e) => setNoBkk(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Transaksi / Dokumen
                </label>
                <input
                  type="text"
                  value={tanggalDokumen}
                  onChange={(e) => setTanggalDokumen(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="DD/MM/YYYY"
                />
              </div>

              {activityType === 'KONSUMSI' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempat Rapat
                    </label>
                    <input
                      type="text"
                      value={tempatAcara}
                      onChange={(e) => setTempatAcara(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Agenda / Topik Rapat
                    </label>
                    <textarea
                      rows={2}
                      value={agendaRapat}
                      onChange={(e) => setAgendaRapat(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </>
              )}

              {(activityType === 'KONSUMSI' || activityType === 'BARANG_JASA') && (
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <span className="text-[11px] font-black uppercase text-amber-900 dark:text-amber-300 block">
                    🏪 Data Penyedia / Toko / Catering
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Nama Penyedia / Toko
                    </label>
                    <input
                      type="text"
                      value={namaPenyedia}
                      onChange={(e) => setNamaPenyedia(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Alamat Toko / Penyedia
                    </label>
                    <input
                      type="text"
                      value={alamatPenyedia}
                      onChange={(e) => setAlamatPenyedia(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {activityType === 'HONOR' && (
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                  <span className="text-[11px] font-black uppercase text-indigo-900 dark:text-indigo-300 block">
                    🎓 Data Penerima Honor
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Nama Penerima
                    </label>
                    <input
                      type="text"
                      value={currentTx.namaPenerima}
                      readOnly
                      className="w-full px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Jabatan Penerima
                    </label>
                    <input
                      type="text"
                      value={jabatanPenerima}
                      onChange={(e) => setJabatanPenerima(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Participants list for Rapat */}
              {activityType === 'KONSUMSI' && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase">
                      Daftar Peserta Hadir Rapat ({participants.length})
                    </label>
                    <button
                      type="button"
                      onClick={addParticipant}
                      className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-md hover:bg-indigo-500 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Tambah
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {participants.map((p, pIdx) => (
                      <div key={p.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-mono text-slate-400 w-4 text-center">{pIdx + 1}</span>
                        <input
                          type="text"
                          value={p.nama}
                          onChange={(e) => updateParticipant(p.id, 'nama', e.target.value)}
                          className="flex-1 px-1.5 py-0.5 text-[10px] bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none"
                          placeholder="Nama Peserta"
                        />
                        <input
                          type="text"
                          value={p.jabatan}
                          onChange={(e) => updateParticipant(p.id, 'jabatan', e.target.value)}
                          className="w-24 px-1 py-0.5 text-[9px] bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none text-slate-500"
                          placeholder="Jabatan"
                        />
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PREVIEW & PRINT AREA (8 COLUMNS) */}
          <div className="lg:col-span-8 p-6 bg-slate-200/60 dark:bg-slate-950 flex flex-col overflow-y-auto">
            
            {/* DOCUMENT TABS */}
            <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-slate-300 dark:border-slate-800 mb-4 shrink-0">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>🖨️ Paket Lengkap ({activityType === 'HONOR' ? '1 Dokumen' : '4 Dokumen'})</span>
              </button>

              {activityType === 'HONOR' && (
                <button
                  onClick={() => setActiveTab('SLIP')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'SLIP'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  📄 Slip Gaji / Honorarium
                </button>
              )}

              {activityType === 'KONSUMSI' && (
                <>
                  <button
                    onClick={() => setActiveTab('UNDANGAN')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'UNDANGAN'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    1. Undangan Rapat
                  </button>
                  <button
                    onClick={() => setActiveTab('HADIR')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'HADIR'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    2. Daftar Hadir
                  </button>
                  <button
                    onClick={() => setActiveTab('BAST')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'BAST'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    3. BAST Konsumsi
                  </button>
                  <button
                    onClick={() => setActiveTab('KWITANSI')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'KWITANSI'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    4. Kwitansi
                  </button>
                </>
              )}

              {activityType === 'BARANG_JASA' && (
                <>
                  <button
                    onClick={() => setActiveTab('KWITANSI')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'KWITANSI'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    1. Kwitansi Pembayaran
                  </button>
                  <button
                    onClick={() => setActiveTab('BAST')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'BAST'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    2. BAST Barang / Jasa
                  </button>
                  <button
                    onClick={() => setActiveTab('NOTA')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'NOTA'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    3. Nota / Faktur Toko
                  </button>
                  <button
                    onClick={() => setActiveTab('BKK')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'BKK'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    4. Bukti Kas Keluar (BKK)
                  </button>
                </>
              )}
            </div>

            {/* PRINT CONTAINER / SHEET VIEW */}
            <div className="flex-1 overflow-y-auto flex justify-center py-2">
              <div
                ref={printAreaRef}
                id="bukti-fisik-print-area"
                className="bg-white text-black shadow-xl rounded-sm p-8 sm:p-10 border border-slate-300 font-sans text-xs space-y-10"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  boxSizing: 'border-box',
                }}
              >
                
                {/* ========================================================= */}
                {/* 1. DOKUMEN: SLIP GAJI / HONOR (For Activity: HONOR) */}
                {/* ========================================================= */}
                {(activityType === 'HONOR' && (activeTab === 'ALL' || activeTab === 'SLIP')) && (
                  <div className="doc-page space-y-4 font-serif">
                    {/* Kop Sekolah */}
                    <KopSekolahHeader settings={settings} />

                    <div className="text-center my-3">
                      <h3 className="font-sans font-extrabold text-sm uppercase underline tracking-wider">
                        SLIP GAJI / HONORARIUM GURU & TENAGA KEPENDIDIKAN
                      </h3>
                      <p className="font-mono text-[10px] text-gray-700 mt-0.5">
                        Tahun Anggaran {currentTx.tahun || '2026'} - Sumber Dana BOSP
                      </p>
                    </div>

                    <table className="w-full text-xs font-sans border-collapse my-3">
                      <tbody>
                        <tr>
                          <td className="py-1 w-36 font-semibold">Nama Penerima</td>
                          <td className="py-1 w-4">:</td>
                          <td className="py-1 font-bold uppercase">{currentTx.namaPenerima}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold">Jabatan / Tugas</td>
                          <td className="py-1">:</td>
                          <td className="py-1">{jabatanPenerima}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold">No. Rekening & Bank</td>
                          <td className="py-1">:</td>
                          <td className="py-1 font-mono font-bold">{currentTx.noRekPenerima || '-'} ({currentTx.namaBank || 'BJB'})</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold">Uraian Pembayaran</td>
                          <td className="py-1">:</td>
                          <td className="py-1">{currentTx.keterangan || currentTx.deskripsiFull}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold">Tanggal Pembayaran</td>
                          <td className="py-1">:</td>
                          <td className="py-1">{formatTitimangsa(tanggalDokumen)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="my-4 border border-black p-3 rounded-xs bg-gray-50/50">
                      <h4 className="font-bold text-xs uppercase mb-2 border-b border-black pb-1">
                        RINCIAN PENERIMAAN HONORARIUM
                      </h4>
                      <table className="w-full text-xs">
                        <tbody>
                          <tr>
                            <td className="py-1 font-medium">Honorarium Gross / Kotor</td>
                            <td className="py-1 text-right font-mono">Rp {formatRupiah(nettoAmount)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-medium text-gray-700">Potongan PPh</td>
                            <td className="py-1 text-right font-mono text-gray-700">{pphVal}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-medium text-gray-700">Potongan PPN</td>
                            <td className="py-1 text-right font-mono text-gray-700">{ppnVal}</td>
                          </tr>
                          <tr className="border-t-2 border-black font-bold text-sm">
                            <td className="pt-2 uppercase">TOTAL DITERIMA (NETTO)</td>
                            <td className="pt-2 text-right font-mono text-indigo-900">
                              Rp {formatRupiah(nettoAmount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-2.5 bg-gray-100 border border-black text-xs font-sans">
                      <span className="font-bold italic">Terbilang : </span>
                      <span className="font-semibold">{terbilangRupiah(nettoAmount)}</span>
                    </div>

                    {/* Signatures */}
                    <div className="pt-8 grid grid-cols-3 gap-2 text-center text-xs font-sans">
                      <div>
                        <p>Mengetahui,</p>
                        <p className="font-bold">Kepala Sekolah</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{kepsekNama}</p>
                        <p className="text-[10px]">NIP. {kepsekNip}</p>
                      </div>

                      <div>
                        <p>Disetujui Oleh,</p>
                        <p className="font-bold">Bendahara Sekolah</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{bendaharaNama}</p>
                        <p className="text-[10px]">NIP. {bendaharaNip}</p>
                      </div>

                      <div>
                        <p>{settings?.kotaSurat || 'Lembang'}, {formatTitimangsa(tanggalDokumen)}</p>
                        <p className="font-bold">Penerima Honor</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{currentTx.namaPenerima}</p>
                        <p className="text-[10px]">Guru / Tenaga Pendidik</p>
                      </div>
                    </div>
                  </div>
                )}


                {/* ========================================================= */}
                {/* 2. DOKUMEN: KONSUMSI RAPAT (Activity: KONSUMSI) */}
                {/* ========================================================= */}
                {activityType === 'KONSUMSI' && (
                  <>
                    {/* DOKUMEN 2.1: UNDANGAN RAPAT */}
                    {(activeTab === 'ALL' || activeTab === 'UNDANGAN') && (
                      <div className="doc-page space-y-4 font-serif">
                        <KopSekolahHeader settings={settings} />

                        <div className="grid grid-cols-12 text-xs font-sans mb-3">
                          <div className="col-span-8 space-y-1">
                            <p><span className="w-20 inline-block font-semibold">Nomor</span>: {noUndangan}</p>
                            <p><span className="w-20 inline-block font-semibold">Sifat</span>: Penting</p>
                            <p><span className="w-20 inline-block font-semibold">Lampiran</span>: -</p>
                            <p><span className="w-20 inline-block font-semibold">Perihal</span>: <strong>Undangan Rapat Pelaksanaan Program BOSP</strong></p>
                          </div>
                          <div className="col-span-4 text-right">
                            <p>{settings?.kotaSurat || 'Lembang'}, {formatTitimangsa(tanggalDokumen)}</p>
                          </div>
                        </div>

                        <div className="text-xs font-sans space-y-2 leading-relaxed">
                          <p>Kepada Yth.</p>
                          <p className="font-bold">Bapak / Ibu Guru & Staf Pegawai {settings?.namaSekolah || 'SD Negeri Ciburial'}</p>
                          <p>di Tempat</p>

                          <p className="pt-2">Dengan hormat,</p>
                          <p className="text-justify">
                            Sehubungan dengan pelaksanaan program kegiatan Bantuan Operasional Satuan Pendidikan (BOSP) tahun anggaran {currentTx.tahun || '2026'}, kami mengundang Bapak/Ibu untuk dapat hadir dalam rapat koordinasi yang akan dilaksanakan pada:
                          </p>

                          <div className="pl-6 space-y-1.5 py-1">
                            <p><span className="w-28 inline-block font-semibold">Hari / Tanggal</span>: {formatTitimangsa(tanggalDokumen)}</p>
                            <p><span className="w-28 inline-block font-semibold">Waktu</span>: 09:00 WIB s.d Selesai</p>
                            <p><span className="w-28 inline-block font-semibold">Tempat</span>: {tempatAcara}</p>
                            <p><span className="w-28 inline-block font-semibold">Agenda Rapat</span>: {agendaRapat}</p>
                          </div>

                          <p className="pt-2 text-justify">
                            Mengingat pentingnya acara tersebut, kami memohon kehadiran Bapak/Ibu tepat pada waktunya. Demikian surat undangan ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.
                          </p>
                        </div>

                        <div className="pt-8 flex justify-end text-center text-xs font-sans">
                          <div className="w-64">
                            <p>Kepala {settings?.namaSekolah || 'SD Negeri Ciburial'}</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline">{kepsekNama}</p>
                            <p className="text-[10px]">NIP. {kepsekNip}</p>
                          </div>
                        </div>

                        {activeTab === 'ALL' && <div className="page-break border-b-2 border-dashed border-gray-300 my-6"></div>}
                      </div>
                    )}

                    {/* DOKUMEN 2.2: DAFTAR HADIR RAPAT */}
                    {(activeTab === 'ALL' || activeTab === 'HADIR') && (
                      <div className="doc-page space-y-4 font-serif">
                        <KopSekolahHeader settings={settings} />

                        <div className="text-center my-2">
                          <h3 className="font-sans font-extrabold text-sm uppercase underline tracking-wider">
                            DAFTAR HADIR RAPAT
                          </h3>
                        </div>

                        <div className="text-xs font-sans space-y-1 mb-3">
                          <p><span className="w-28 inline-block font-semibold">Hari / Tanggal</span>: {formatTitimangsa(tanggalDokumen)}</p>
                          <p><span className="w-28 inline-block font-semibold">Tempat</span>: {tempatAcara}</p>
                          <p><span className="w-28 inline-block font-semibold">Agenda Rapat</span>: {agendaRapat}</p>
                        </div>

                        <table className="w-full text-xs font-sans border-collapse border border-black">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black text-center font-bold">
                              <th className="p-2 border-r border-black w-8">NO</th>
                              <th className="p-2 border-r border-black">NAMA PESERTA</th>
                              <th className="p-2 border-r border-black w-36">JABATAN</th>
                              <th className="p-2 w-32" colSpan={2}>TANDA TANGAN</th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants.map((p, idx) => (
                              <tr key={`hadir-${idx}`} className="border-b border-black">
                                <td className="p-2 text-center border-r border-black font-mono">{idx + 1}</td>
                                <td className="p-2 border-r border-black font-semibold">{p.nama}</td>
                                <td className="p-2 border-r border-black">{p.jabatan}</td>
                                <td className="p-2 border-r border-black text-[10px] w-16 h-8 text-left align-top">
                                  {idx % 2 === 0 ? `${idx + 1}. .........` : ''}
                                </td>
                                <td className="p-2 text-[10px] w-16 h-8 text-left align-top">
                                  {idx % 2 !== 0 ? `${idx + 1}. .........` : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs font-sans">
                          <div>
                            <p>Notulis / Bendahara,</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline">{bendaharaNama}</p>
                            <p className="text-[10px]">NIP. {bendaharaNip}</p>
                          </div>

                          <div>
                            <p>Mengetahui,<br />Kepala Sekolah</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline">{kepsekNama}</p>
                            <p className="text-[10px]">NIP. {kepsekNip}</p>
                          </div>
                        </div>

                        {activeTab === 'ALL' && <div className="page-break border-b-2 border-dashed border-gray-300 my-6"></div>}
                      </div>
                    )}

                    {/* DOKUMEN 2.3: BAST KONSUMSI */}
                    {(activeTab === 'ALL' || activeTab === 'BAST') && (
                      <div className="doc-page space-y-4 font-serif">
                        <KopSekolahHeader settings={settings} />

                        <div className="text-center my-2">
                          <h3 className="font-sans font-extrabold text-sm uppercase underline tracking-wider">
                            BERITA ACARA SERAH TERIMA (BAST) KONSUMSI
                          </h3>
                          <p className="font-mono text-[10px]">Nomor: {noBast}</p>
                        </div>

                        <div className="text-xs font-sans leading-relaxed space-y-2">
                          <p>
                            Pada hari ini, <strong>{formatTitimangsa(tanggalDokumen)}</strong>, kami yang bertanda tangan di bawah ini:
                          </p>

                          <div className="pl-4 space-y-1">
                            <p><strong>1. Nama Penyedia / Catering</strong>: {namaPenyedia}</p>
                            <p>   Alamat: {alamatPenyedia}</p>
                            <p>   Selanjutnya disebut sebagai <strong>PIHAK PERTAMA (Penyedia)</strong>.</p>
                          </div>

                          <div className="pl-4 space-y-1 pt-1">
                            <p><strong>2. Nama Bendahara</strong>: {bendaharaNama}</p>
                            <p>   Jabatan: Bendahara BOSP {settings?.namaSekolah}</p>
                            <p>   Selanjutnya disebut sebagai <strong>PIHAK KEDUA (Penerima)</strong>.</p>
                          </div>

                          <p className="pt-2">
                            PIHAK PERTAMA menyerahkan hasil pesanan konsumsi rapat kepada PIHAK KEDUA, dan PIHAK KEDUA menyatakan telah menerima konsumsi rapat dalam kondisi baik dan lengkap sesuai pesanan sebagai berikut:
                          </p>
                        </div>

                        <table className="w-full text-xs font-sans border-collapse border border-black my-2">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black text-center font-bold">
                              <th className="p-2 border-r border-black w-8">NO</th>
                              <th className="p-2 border-r border-black">URAIAN PESANAN KONSUMSI</th>
                              <th className="p-2 border-r border-black w-20">JUMLAH</th>
                              <th className="p-2 border-r border-black w-28">HARGA SATUAN</th>
                              <th className="p-2 w-32">TOTAL (RP)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-black">
                              <td className="p-2 text-center border-r border-black font-mono">1</td>
                              <td className="p-2 border-r border-black">{currentTx.keterangan || currentTx.deskripsiFull}</td>
                              <td className="p-2 border-r border-black text-center font-mono">1 Paket</td>
                              <td className="p-2 border-r border-black text-right font-mono">Rp {formatRupiah(nettoAmount)}</td>
                              <td className="p-2 text-right font-mono font-bold">Rp {formatRupiah(nettoAmount)}</td>
                            </tr>
                            <tr className="font-bold bg-gray-50">
                              <td colSpan={4} className="p-2 border-r border-black text-center uppercase">TOTAL KESELURUHAN</td>
                              <td className="p-2 text-right font-mono">Rp {formatRupiah(nettoAmount)}</td>
                            </tr>
                          </tbody>
                        </table>

                        <p className="text-xs font-sans">
                          Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
                        </p>

                        <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs font-sans">
                          <div>
                            <p>PIHAK PERTAMA<br />(Penyedia / Catering)</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline">{namaPenyedia}</p>
                          </div>

                          <div>
                            <p>PIHAK KEDUA<br />(Bendahara BOSP)</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline">{bendaharaNama}</p>
                            <p className="text-[10px]">NIP. {bendaharaNip}</p>
                          </div>
                        </div>

                        <div className="text-center pt-2 text-xs font-sans">
                          <p>Mengetahui,<br />Kepala Sekolah</p>
                          <div className="h-14"></div>
                          <p className="font-bold underline">{kepsekNama}</p>
                          <p className="text-[10px]">NIP. {kepsekNip}</p>
                        </div>

                        {activeTab === 'ALL' && <div className="page-break border-b-2 border-dashed border-gray-300 my-6"></div>}
                      </div>
                    )}

                    {/* DOKUMEN 2.4: KWITANSI KONSUMSI */}
                    {(activeTab === 'ALL' || activeTab === 'KWITANSI') && (
                      <div className="doc-page font-serif">
                        <KwitansiDoc
                          settings={settings}
                          currentTx={currentTx}
                          noKwitansi={noKwitansi}
                          tanggalDokumen={tanggalDokumen}
                          namaPenyedia={namaPenyedia}
                          bendaharaNama={bendaharaNama}
                          bendaharaNip={bendaharaNip}
                          kepsekNama={kepsekNama}
                          kepsekNip={kepsekNip}
                        />
                      </div>
                    )}
                  </>
                )}


                {/* ========================================================= */}
                {/* 3. DOKUMEN: BARANG & JASA (Activity: BARANG_JASA) */}
                {/* ========================================================= */}
                {activityType === 'BARANG_JASA' && (
                  <>
                    {/* DOKUMEN 3.1: KWITANSI PEMBAYARAN */}
                    {(activeTab === 'ALL' || activeTab === 'KWITANSI') && (
                      <div className="doc-page font-serif mb-6">
                        <KwitansiDoc
                          settings={settings}
                          currentTx={currentTx}
                          noKwitansi={noKwitansi}
                          tanggalDokumen={tanggalDokumen}
                          namaPenyedia={namaPenyedia}
                          bendaharaNama={bendaharaNama}
                          bendaharaNip={bendaharaNip}
                          kepsekNama={kepsekNama}
                          kepsekNip={kepsekNip}
                        />
                        {activeTab === 'ALL' && <div className="page-break border-b-2 border-dashed border-gray-300 my-6"></div>}
                      </div>
                    )}

                    {/* DOKUMEN 3.2: BAST BARANG / JASA */}
                    {(activeTab === 'ALL' || activeTab === 'BAST') && (
                      <div className="doc-page space-y-4 font-serif">
                        <KopSekolahHeader settings={settings} />

                        <div className="text-center my-2">
                          <h3 className="font-sans font-extrabold text-sm uppercase underline tracking-wider">
                            BERITA ACARA SERAH TERIMA BARANG / PEKERJAAN
                          </h3>
                          <p className="font-mono text-[10px]">Nomor: {noBast}</p>
                        </div>

                        <div className="text-xs font-sans leading-relaxed space-y-2">
                          <p>
                            Pada hari ini, <strong>{formatTitimangsa(tanggalDokumen)}</strong>, yang bertanda tangan di bawah ini:
                          </p>

                          <div className="pl-4 space-y-1">
                            <p><strong>1. Nama Penyedia / Toko</strong>: {namaPenyedia}</p>
                            <p>   Alamat: {alamatPenyedia}</p>
                            <p>   Selanjutnya disebut <strong>PIHAK PERTAMA (Penyedia)</strong>.</p>
                          </div>

                          <div className="pl-4 space-y-1 pt-1">
                            <p><strong>2. Nama Bendahara</strong>: {bendaharaNama}</p>
                            <p>   Jabatan: Bendahara BOSP {settings?.namaSekolah}</p>
                            <p>   Selanjutnya disebut <strong>PIHAK KEDUA (Penerima)</strong>.</p>
                          </div>

                          <p className="pt-2">
                            PIHAK PERTAMA telah menyerahkan barang/pekerjaan kepada PIHAK KEDUA, dan PIHAK KEDUA telah memeriksa serta menerima barang/pekerjaan tersebut dengan kondisi 100% baik dan sesuai spesifikasi:
                          </p>
                        </div>

                        <table className="w-full text-xs font-sans border-collapse border border-black my-2">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black text-center font-bold">
                              <th className="p-2 border-r border-black w-8">NO</th>
                              <th className="p-2 border-r border-black">NAMA BARANG / PEKERJAAN</th>
                              <th className="p-2 border-r border-black w-20">VOL</th>
                              <th className="p-2 border-r border-black w-28">HARGA SATUAN</th>
                              <th className="p-2 w-32">TOTAL (RP)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-black">
                              <td className="p-2 text-center border-r border-black font-mono">1</td>
                              <td className="p-2 border-r border-black">{currentTx.keterangan || currentTx.deskripsiFull}</td>
                              <td className="p-2 border-r border-black text-center font-mono">1 Paket</td>
                              <td className="p-2 border-r border-black text-right font-mono">Rp {formatRupiah(nettoAmount)}</td>
                              <td className="p-2 text-right font-mono font-bold">Rp {formatRupiah(nettoAmount)}</td>
                            </tr>
                            <tr className="font-bold bg-gray-50">
                              <td colSpan={4} className="p-2 border-r border-black text-center uppercase">TOTAL VALUE</td>
                              <td className="p-2 text-right font-mono">Rp {formatRupiah(nettoAmount)}</td>
                            </tr>
                          </tbody>
                        </table>

                        <p className="text-xs font-sans">
                          Demikian Berita Acara Serah Terima Barang/Pekerjaan ini dibuat untuk dipergunakan sebagaimana mestinya.
                        </p>

                        <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs font-sans">
                          <div>
                            <p>PIHAK PERTAMA<br />(Penyedia / Toko)</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline">{namaPenyedia}</p>
                          </div>

                          <div>
                            <p>PIHAK KEDUA<br />(Bendahara BOSP)</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline">{bendaharaNama}</p>
                            <p className="text-[10px]">NIP. {bendaharaNip}</p>
                          </div>
                        </div>

                        <div className="text-center pt-2 text-xs font-sans">
                          <p>Mengetahui,<br />Kepala Sekolah</p>
                          <div className="h-14"></div>
                          <p className="font-bold underline">{kepsekNama}</p>
                          <p className="text-[10px]">NIP. {kepsekNip}</p>
                        </div>

                        {activeTab === 'ALL' && <div className="page-break border-b-2 border-dashed border-gray-300 my-6"></div>}
                      </div>
                    )}

                    {/* DOKUMEN 3.3: NOTA / FAKTUR TOKO */}
                    {(activeTab === 'ALL' || activeTab === 'NOTA') && (
                      <div className="doc-page space-y-4 font-serif">
                        {/* Header Toko */}
                        <div className="border-b-2 border-black pb-2 text-center font-sans">
                          <h2 className="text-base font-extrabold uppercase">{namaPenyedia}</h2>
                          <p className="text-xs text-gray-700">{alamatPenyedia} | Telp/HP: {hpPenyedia}</p>
                        </div>

                        <div className="flex items-center justify-between font-sans text-xs my-2">
                          <div>
                            <p><strong>Kepada Yth:</strong> {settings?.namaSekolah}</p>
                            <p>Alamat: {settings?.alamatSekolah}</p>
                          </div>
                          <div className="text-right">
                            <p><strong>NOTA / FAKTUR PEMBELIAN</strong></p>
                            <p className="font-mono text-[10px]">Tanggal: {formatTitimangsa(tanggalDokumen)}</p>
                          </div>
                        </div>

                        <table className="w-full text-xs font-sans border-collapse border border-black">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black text-center font-bold">
                              <th className="p-2 border-r border-black w-8">NO</th>
                              <th className="p-2 border-r border-black">NAMA BARANG / DESKRIPSI</th>
                              <th className="p-2 border-r border-black w-16">QTY</th>
                              <th className="p-2 border-r border-black w-28">HARGA (RP)</th>
                              <th className="p-2 w-32">JUMLAH (RP)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-black">
                              <td className="p-2 text-center border-r border-black font-mono">1</td>
                              <td className="p-2 border-r border-black">{currentTx.keterangan || currentTx.deskripsiFull}</td>
                              <td className="p-2 border-r border-black text-center font-mono">1</td>
                              <td className="p-2 border-r border-black text-right font-mono">Rp {formatRupiah(nettoAmount)}</td>
                              <td className="p-2 text-right font-mono font-bold">Rp {formatRupiah(nettoAmount)}</td>
                            </tr>
                            <tr className="font-bold bg-gray-50">
                              <td colSpan={4} className="p-2 border-r border-black text-right uppercase">JUMLAH TOTAL</td>
                              <td className="p-2 text-right font-mono">Rp {formatRupiah(nettoAmount)}</td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="p-2 bg-gray-100 border border-black text-xs font-sans">
                          <span className="font-bold italic">Terbilang : </span>
                          <span>{terbilangRupiah(nettoAmount)}</span>
                        </div>

                        <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs font-sans">
                          <div>
                            <p>Penerima Barang,</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline">{bendaharaNama}</p>
                            <p className="text-[10px]">NIP. {bendaharaNip}</p>
                          </div>

                          <div>
                            <p>Toko / Penyedia,</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline">{namaPenyedia}</p>
                          </div>
                        </div>

                        {activeTab === 'ALL' && <div className="page-break border-b-2 border-dashed border-gray-300 my-6"></div>}
                      </div>
                    )}

                    {/* DOKUMEN 3.4: BUKTI KAS KELUAR (BKK) */}
                    {(activeTab === 'ALL' || activeTab === 'BKK') && (
                      <div className="doc-page space-y-4 font-serif">
                        <KopSekolahHeader settings={settings} />

                        <div className="border-2 border-black p-4 space-y-4 font-sans text-xs">
                          <div className="text-center border-b-2 border-black pb-2">
                            <h3 className="font-extrabold text-sm uppercase tracking-wide">BUKTI KAS KELUAR (BKK)</h3>
                            <p className="font-mono text-[10px]">Nomor BKK: {noBkk} | Tanggal: {formatTitimangsa(tanggalDokumen)}</p>
                          </div>

                          <table className="w-full">
                            <tbody>
                              <tr>
                                <td className="py-1 w-36 font-semibold">Dibayarkan Kepada</td>
                                <td className="py-1 w-4">:</td>
                                <td className="py-1 font-bold uppercase">{namaPenyedia} ({currentTx.namaPenerima})</td>
                              </tr>
                              <tr>
                                <td className="py-1 font-semibold">Jumlah Uang</td>
                                <td className="py-1">:</td>
                                <td className="py-1 font-mono font-bold text-sm">Rp {formatRupiah(nettoAmount)}</td>
                              </tr>
                              <tr>
                                <td className="py-1 font-semibold">Terbilang</td>
                                <td className="py-1">:</td>
                                <td className="py-1 font-semibold italic bg-gray-100 p-1.5 border border-gray-300">{terbilangRupiah(nettoAmount)}</td>
                              </tr>
                              <tr>
                                <td className="py-1 font-semibold">Untuk Pembayaran</td>
                                <td className="py-1">:</td>
                                <td className="py-1">{currentTx.keterangan || currentTx.deskripsiFull}</td>
                              </tr>
                              <tr>
                                <td className="py-1 font-semibold">Program / Kode Rek</td>
                                <td className="py-1">:</td>
                                <td className="py-1 font-mono">BOSP REGULER / {currentTx.kategori || 'OPERASIONAL'}</td>
                              </tr>
                            </tbody>
                          </table>

                          <div className="pt-6 grid grid-cols-3 gap-2 text-center text-[11px]">
                            <div>
                              <p>Mengetahui,</p>
                              <p className="font-bold">Kepala Sekolah</p>
                              <div className="h-16"></div>
                              <p className="font-bold underline">{kepsekNama}</p>
                              <p className="text-[9px]">NIP. {kepsekNip}</p>
                            </div>

                            <div>
                              <p>Disetujui Oleh,</p>
                              <p className="font-bold">Bendahara Sekolah</p>
                              <div className="h-16"></div>
                              <p className="font-bold underline">{bendaharaNama}</p>
                              <p className="text-[9px]">NIP. {bendaharaNip}</p>
                            </div>

                            <div>
                              <p>Diterima Oleh,</p>
                              <p className="font-bold">Penerima / Penyedia</p>
                              <div className="h-16"></div>
                              <p className="font-bold underline">{currentTx.namaPenerima || namaPenyedia}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// HELPER COMPONENT: KOP SEKOLAH
// ----------------------------------------------------------------------
function KopSekolahHeader({ settings }: { settings: SchoolSettings }) {
  return (
    <div className="kop-header flex items-center justify-between pb-2 mb-2 border-b-2 border-black relative">
      <div className="w-16 flex justify-center items-center">
        {settings?.logoKabupatenUrl ? (
          <img src={settings.logoKabupatenUrl} alt="Logo Pemkab" className="w-14 h-16 object-contain" />
        ) : (
          <LogoBandungBarat className="w-14 h-16" />
        )}
      </div>

      <div className="text-center flex-1 px-2">
        <h2 className="text-xs font-bold tracking-wide uppercase leading-tight font-sans">
          {settings?.pemerintah || 'PEMERINTAH KABUPATEN BANDUNG BARAT'}
        </h2>
        <h1 className="text-base font-extrabold tracking-wider uppercase my-0.5 leading-tight font-sans">
          {settings?.namaSekolah || 'SD NEGERI CIBURIAL'}
        </h1>
        <p className="text-[9px] leading-tight font-sans text-gray-800">
          Alamat : {settings?.alamatSekolah}
        </p>
      </div>

      <div className="w-16 flex justify-center items-center">
        {settings?.logoSekolahUrl ? (
          <img src={settings.logoSekolahUrl} alt="Logo Sekolah" className="w-14 h-16 object-contain" />
        ) : (
          <LogoTutWuri className="w-14 h-16" />
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// HELPER COMPONENT: KWITANSI DOCUMENT
// ----------------------------------------------------------------------
function KwitansiDoc({
  settings,
  currentTx,
  noKwitansi,
  tanggalDokumen,
  namaPenyedia,
  bendaharaNama,
  bendaharaNip,
  kepsekNama,
  kepsekNip,
}: {
  settings: SchoolSettings;
  currentTx: Transaction;
  noKwitansi: string;
  tanggalDokumen: string;
  namaPenyedia: string;
  bendaharaNama: string;
  bendaharaNip: string;
  kepsekNama: string;
  kepsekNip: string;
}) {
  const nettoAmount = Number(currentTx.netto) || 0;

  return (
    <div className="border-4 border-double border-black p-4 rounded-xs font-sans space-y-4">
      {/* Kwitansi Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div>
          <h2 className="font-extrabold text-sm uppercase">{settings?.namaSekolah || 'SD NEGERI CIBURIAL'}</h2>
          <p className="text-[10px] text-gray-700">{settings?.alamatSekolah}</p>
        </div>
        <div className="text-right">
          <h3 className="font-black text-base tracking-widest uppercase text-indigo-900">KWITANSI</h3>
          <p className="font-mono text-[10px]">No: {noKwitansi}</p>
        </div>
      </div>

      {/* Kwitansi Body */}
      <table className="w-full text-xs font-sans space-y-2">
        <tbody>
          <tr>
            <td className="py-1.5 w-36 font-semibold">Telah Terima Dari</td>
            <td className="py-1.5 w-4">:</td>
            <td className="py-1.5 font-bold">Bendahara BOSP {settings?.namaSekolah}</td>
          </tr>
          <tr>
            <td className="py-1.5 font-semibold">Uang Sejumlah</td>
            <td className="py-1.5">:</td>
            <td className="py-1.5 font-bold italic bg-gray-100 p-2 border border-black">
              {terbilangRupiah(nettoAmount)}
            </td>
          </tr>
          <tr>
            <td className="py-1.5 font-semibold">Untuk Pembayaran</td>
            <td className="py-1.5">:</td>
            <td className="py-1.5">{currentTx.keterangan || currentTx.deskripsiFull}</td>
          </tr>
        </tbody>
      </table>

      {/* Kwitansi Footer & Nominal */}
      <div className="pt-2 flex items-center justify-between border-t border-black">
        <div className="p-2 bg-gray-200 border-2 border-black text-sm font-black font-mono">
          Rp {formatRupiah(nettoAmount)}
        </div>
        <div className="text-right text-xs">
          <p>{settings?.kotaSurat || 'Lembang'}, {formatTitimangsa(tanggalDokumen)}</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p>Setuju Dibayar,<br />Kepala Sekolah</p>
          <div className="h-14"></div>
          <p className="font-bold underline">{kepsekNama}</p>
          <p className="text-[9px]">NIP. {kepsekNip}</p>
        </div>

        <div>
          <p>Lunas Dibayar,<br />Bendahara Sekolah</p>
          <div className="h-14"></div>
          <p className="font-bold underline">{bendaharaNama}</p>
          <p className="text-[9px]">NIP. {bendaharaNip}</p>
        </div>

        <div>
          <p>Penerima Uang /<br />Penyedia</p>
          <div className="h-14"></div>
          <p className="font-bold underline">{currentTx.namaPenerima || namaPenyedia}</p>
        </div>
      </div>
    </div>
  );
}
