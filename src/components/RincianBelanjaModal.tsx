import React, { useState, useMemo, useRef } from 'react';
import { RincianBelanjaItem, SchoolSettings, Vendor, Transaction, HonorRecipient } from '../types';
import { formatRupiah } from '../utils/terbilang';
import { exportToPdf } from '../utils/pdfGenerator';
import { DEFAULT_RINCIAN_BELANJA } from '../data/rincianBelanjaData';
import { DEFAULT_CATEGORIES } from './CategoryManagementModal';
import { JENIS_TRANSAKSI_OPTIONS } from './AddEditTransactionModal';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  Search, 
  CloudUpload, 
  RotateCcw, 
  FileSpreadsheet,
  Eye,
  SlidersHorizontal,
  Upload,
  Zap,
  CheckSquare,
  Square,
  Check,
  AlertCircle,
  Store,
  Calendar,
  DollarSign,
  Layers,
  ArrowRight,
  Info,
  Tag,
  UserCheck
} from 'lucide-react';

interface RincianBelanjaModalProps {
  isOpen: boolean;
  onClose: () => void;
  rincianList: RincianBelanjaItem[];
  onSaveList: (updatedList: RincianBelanjaItem[]) => void;
  settings: SchoolSettings;
  scriptUrl?: string;
  onSyncToGoogleSheets?: (customRincian?: RincianBelanjaItem[]) => Promise<any>;
  vendors?: Vendor[];
  categories?: string[];
  honorRecipients?: HonorRecipient[];
  existingTransactions?: Transaction[];
  onAddBatchTransactions?: (newTxs: Transaction[]) => void;
}

export function RincianBelanjaModal({
  isOpen,
  onClose,
  rincianList,
  onSaveList,
  settings,
  scriptUrl,
  onSyncToGoogleSheets,
  vendors = [],
  categories = [],
  honorRecipients = [],
  existingTransactions = [],
  onAddBatchTransactions
}: RincianBelanjaModalProps) {
  const [activeTab, setActiveTab] = useState<'table' | 'paper'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNREALIZED' | 'REALIZED'>('ALL');

  // PDF Upload & Parser State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  // Selection & Realization State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRealizeModalOpen, setIsRealizeModalOpen] = useState(false);

  // Realization Form Fields
  const [realizeJenis, setRealizeJenis] = useState<string>('Pembelanjaan Siplah');
  const [realizeNoSurat, setRealizeNoSurat] = useState<string>('900.3.5.5/001-SDN-CBL/I/2026');
  const [realizeUraian, setRealizeUraian] = useState<string>('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [customVendorName, setCustomVendorName] = useState<string>('');
  const [customVendorAddress, setCustomVendorAddress] = useState<string>('');
  const [customVendorNpwp, setCustomVendorNpwp] = useState<string>('');
  const [realizeDate, setRealizeDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [realizeCategory, setRealizeCategory] = useState<string>('ATK / PENGGANDAAN');

  // Available Category Options (Kategori BOSP = Kategori Belanja)
  const categoryOptions = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    return DEFAULT_CATEGORIES;
  }, [categories]);

  // Header Meta State
  const [bulan, setBulan] = useState('Agustus 2026');
  const [sumberDana, setSumberDana] = useState('BOSP Reguler');
  const [totalPenerimaan, setTotalPenerimaan] = useState(313920000);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Filtered List
  const filteredList = useMemo(() => {
    return rincianList.filter(item => {
      const matchSearch = 
        item.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kodeRekening.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kodeProgram.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchProg = filterProgram === 'ALL' || item.kodeProgram.startsWith(filterProgram);

      let matchStatus = true;
      if (filterStatus === 'REALIZED') matchStatus = !!item.isRealized;
      if (filterStatus === 'UNREALIZED') matchStatus = !item.isRealized;

      return matchSearch && matchProg && matchStatus;
    });
  }, [rincianList, searchTerm, filterProgram, filterStatus]);

  // Non-header selectable items (only unrealized items can be selected)
  const selectableItems = useMemo(() => {
    return filteredList.filter(item => !item.isHeader && item.jumlah > 0 && !item.isRealized);
  }, [filteredList]);

  // Selected items objects
  const selectedItemsList = useMemo(() => {
    return rincianList.filter(item => selectedIds.includes(item.id));
  }, [rincianList, selectedIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedItemsList.reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [selectedItemsList]);

  // Total expenditure sum
  const calculatedTotalBelanja = useMemo(() => {
    const detailSum = rincianList
      .filter(i => !i.isHeader && i.jumlah > 0)
      .reduce((acc, curr) => acc + curr.jumlah, 0);
    
    if (detailSum > 0) return detailSum;
    return rincianList.reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [rincianList]);

  const totalRealizedAmount = useMemo(() => {
    return rincianList
      .filter(i => !i.isHeader && i.isRealized && i.jumlah > 0)
      .reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [rincianList]);

  const sisaAnggaran = totalPenerimaan - calculatedTotalBelanja;

  if (!isOpen) return null;

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === selectableItems.length && selectableItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableItems.map(item => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    const targetItem = rincianList.find(i => i.id === id);
    if (targetItem?.isRealized) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleOpenRealizeSingle = (item: RincianBelanjaItem) => {
    setSelectedIds([item.id]);
    const defaultNo = `900.3.5.5/00${Math.floor(Math.random() * 89 + 10)}-SDN-CBL/I/${new Date().getFullYear()}`;
    setRealizeNoSurat(defaultNo);
    setRealizeUraian(item.uraian);
    if (!categoryOptions.includes(realizeCategory) && categoryOptions.length > 0) {
      setRealizeCategory(categoryOptions[0]);
    }
    if (vendors && vendors.length > 0 && (!selectedVendorId || selectedVendorId === '')) {
      setSelectedVendorId(vendors[0].id);
      setCustomVendorName(vendors[0].nama);
      setCustomVendorAddress(vendors[0].alamat || '');
      setCustomVendorNpwp(vendors[0].npwp || '');
    }
    setIsRealizeModalOpen(true);
  };

  const handleOpenRealizeBatch = () => {
    if (selectedIds.length === 0) {
      alert('Sila pilih minimal 1 item Rincian Belanja yang akan direalisasikan!');
      return;
    }
    const items = rincianList.filter(item => selectedIds.includes(item.id));
    const defaultNo = `900.3.5.5/00${Math.floor(Math.random() * 89 + 10)}-SDN-CBL/I/${new Date().getFullYear()}`;
    setRealizeNoSurat(defaultNo);
    if (items.length === 1) {
      setRealizeUraian(items[0].uraian);
    } else if (items.length > 1) {
      setRealizeUraian(items.map((it, idx) => `${idx + 1}. ${it.uraian}`).join('; '));
    }
    if (!categoryOptions.includes(realizeCategory) && categoryOptions.length > 0) {
      setRealizeCategory(categoryOptions[0]);
    }
    if (vendors && vendors.length > 0 && (!selectedVendorId || selectedVendorId === '')) {
      setSelectedVendorId(vendors[0].id);
      setCustomVendorName(vendors[0].nama);
      setCustomVendorAddress(vendors[0].alamat || '');
      setCustomVendorNpwp(vendors[0].npwp || '');
    }
    setIsRealizeModalOpen(true);
  };

  // PDF Upload Handler via Gemini AI Backend / Parser
  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('File harus berformat PDF (.pdf)');
      return;
    }

    setIsUploadingPdf(true);
    setUploadProgressMsg(`Membaca file "${file.name}" & menganalisis Rincian Belanja dengan Gemini AI...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;

        try {
          const res = await fetch('/api/parse-rincian-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfBase64: base64String,
              fileName: file.name
            })
          });

          const data = await res.json();

          if (data.success && Array.isArray(data.items) && data.items.length > 0) {
            const formattedItems: RincianBelanjaItem[] = data.items.map((item: any, idx: number) => ({
              id: `rb-pdf-${Date.now()}-${idx}`,
              noUrut: idx + 1,
              kodeRekening: item.kodeRekening || '',
              kodeProgram: item.kodeProgram || '',
              uraian: item.uraian || 'Tanpa Uraian',
              volume: String(item.volume || ''),
              satuan: item.satuan || '',
              tarifHarga: Number(item.tarifHarga) || 0,
              jumlah: Number(item.jumlah) || 0,
              isHeader: !!item.isHeader,
              bulan: item.bulan || 'Agustus',
              tahun: item.tahun || '2026'
            }));

            // Ask option to replace or append
            const shouldReplace = confirm(
              `Gemini AI berhasil mengekstraksi ${formattedItems.length} item rincian belanja dari file PDF!\n\n` +
              `• Klik [OK] untuk MENGGANTIKAN data rincian belanja saat ini.\n` +
              `• Klik [Batal] untuk MENAMBAHKAN item ke daftar yang sudah ada.`
            );

            let newList: RincianBelanjaItem[] = [];
            if (shouldReplace) {
              newList = formattedItems;
            } else {
              newList = [
                ...rincianList,
                ...formattedItems.map((item, idx) => ({ ...item, noUrut: rincianList.length + idx + 1 }))
              ];
            }

            onSaveList(newList);
            setSyncStatusMsg(`✅ Berhasil memuat ${formattedItems.length} item Rincian Belanja dari PDF!`);
          } else {
            throw new Error(data.error || 'Respons ekstraksi tidak berisi data Rincian Belanja yang valid');
          }
        } catch (apiErr: any) {
          console.warn('Backend Gemini API error, applying fallback:', apiErr);
          alert(`Info Ekstraksi PDF: ${apiErr.message || 'Menggunakan data Rincian Standar'}`);
        } finally {
          setIsUploadingPdf(false);
          setUploadProgressMsg('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Gagal membaca file PDF: ' + err.message);
      setIsUploadingPdf(false);
      setUploadProgressMsg('');
    }
  };

  // Submit Realization & Automatically Create ONE Grouped Outgoing Transaction
  const handleConfirmRealization = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItemsList.length === 0) {
      alert('Tidak ada item yang dipilih!');
      return;
    }

    // Resolve Vendor Info
    let vendorName = customVendorName;
    let vendorAddr = customVendorAddress;
    let vendorHp = '';
    let vendorNpwp = customVendorNpwp;

    if (selectedVendorId && selectedVendorId !== 'CUSTOM') {
      const v = vendors.find(item => item.id === selectedVendorId);
      if (v) {
        vendorName = v.nama;
        vendorAddr = v.alamat || '';
        vendorHp = v.hp || '';
        vendorNpwp = v.npwp || '';
      }
    }

    if (!vendorName.trim()) {
      alert('Sila pilih atau masukkan nama Vendor / Toko / Penerima!');
      return;
    }

    // Parse date info
    const txDate = realizeDate || new Date().toISOString().split('T')[0];
    const dateObj = new Date(txDate);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthStr = monthNames[dateObj.getMonth()] || 'Agustus';
    const yearStr = String(dateObj.getFullYear()) || '2026';

    const totalNetto = selectedItemsList.reduce((acc, curr) => acc + curr.jumlah, 0);

    // Build combined description & detailed breakdown
    let combinedKeterangan = '';
    let combinedDeskripsi = '';

    if (selectedItemsList.length === 1) {
      const item = selectedItemsList[0];
      combinedKeterangan = item.uraian;
      combinedDeskripsi = `[${item.kodeProgram || 'BOSP'}] ${item.uraian} (${item.volume || '1'} ${item.satuan || 'kegiatan'} @ Rp ${formatRupiah(item.tarifHarga)})`;
    } else {
      combinedKeterangan = selectedItemsList.map((item, idx) => `${idx + 1}. ${item.uraian}`).join('; ');
      if (combinedKeterangan.length > 200) {
        combinedKeterangan = `Realisasi ${selectedItemsList.length} Item Rincian Belanja BOSP (${selectedItemsList[0].uraian}, dll)`;
      }
      combinedDeskripsi = `[BOSP] Realisasi ${selectedItemsList.length} Item Rincian Belanja:\n` +
        selectedItemsList.map((item, idx) => `${idx + 1}. ${item.uraian} (${item.volume || '1'} ${item.satuan || 'kegiatan'} @ Rp ${formatRupiah(item.tarifHarga)})`).join('\n');
    }

    const isSiplah = realizeJenis === 'SIPLAH';
    const isHonor = realizeJenis === 'HONOR';
    const finalNoSurat = realizeNoSurat.trim() || `900.3.5.5/001-SDN-CBL/I/${yearStr}`;
    const finalKeterangan = realizeUraian.trim() || combinedKeterangan;

    // Calculate sequential transaction No. Urut (filtering out any timestamp values > 100000)
    const validExistingNos = (existingTransactions || [])
      .map(t => Number(t.no))
      .filter(n => !isNaN(n) && n > 0 && n < 100000);
    const nextTxNo = validExistingNos.length > 0 ? Math.max(...validExistingNos) + 1 : 1;

    // Create 1 grouped Transaction
    const singleTransaction: Transaction = {
      id: `tx-realize-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      no: nextTxNo,
      tanggal: txDate,
      jenisTransaksi: realizeJenis,
      noSurat: finalNoSurat,
      namaPenerima: vendorName,
      noRekPenerima: '-',
      namaBank: 'Bank BJB',
      pph: '0',
      ppn: '0',
      netto: totalNetto,
      siplah: isSiplah ? 'Ya' : 'Tidak',
      noPo: isSiplah ? `SIPLAH-PO-${Date.now().toString().slice(-6)}` : '-',
      keterangan: finalKeterangan,
      vendor: vendorName,
      vendorAddress: vendorAddr,
      vendorHp: vendorHp,
      vendorNpwp: vendorNpwp,
      statusSi: 'SELESAI',
      bulan: monthStr,
      tahun: yearStr,
      deskripsiFull: combinedDeskripsi,
      kategori: realizeCategory,
      tipeTransaksi: 'KELUAR',
      activityType: isHonor ? 'HONOR' : (finalKeterangan.toLowerCase().includes('makan') || finalKeterangan.toLowerCase().includes('konsumsi') ? 'KONSUMSI' : 'BARANG_JASA')
    };

    // 1. Trigger callback to add single grouped transaction to main Transaction Table
    if (onAddBatchTransactions) {
      onAddBatchTransactions([singleTransaction]);
    }

    // 2. Mark selected items in rincianList as realized
    const updatedRincianList = rincianList.map(item => {
      if (selectedIds.includes(item.id)) {
        return {
          ...item,
          isRealized: true,
          realizedVendor: vendorName,
          realizedJenis: realizeJenis,
          realizedDate: txDate,
          realizedTxId: singleTransaction.id
        };
      }
      return item;
    });

    onSaveList(updatedRincianList);

    // 3. Reset state & notify
    setSelectedIds([]);
    setIsRealizeModalOpen(false);
    setSyncStatusMsg(`⚡ Realisasi ${selectedItemsList.length} item Rincian Belanja berhasil dikelompokkan menjadi 1 Transaksi Keluar (No. Surat: ${finalNoSurat}, Total: Rp ${formatRupiah(totalNetto)})!`);
    setTimeout(() => setSyncStatusMsg(''), 6000);
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan data rincian belanja ke hasil ekstraksi PDF standar 2026 (79 Item)?')) {
      onSaveList(DEFAULT_RINCIAN_BELANJA);
      setSelectedIds([]);
      setSyncStatusMsg('Data berhasil direset ke standar ekstraksi PDF!');
      setTimeout(() => setSyncStatusMsg(''), 4000);
    }
  };

  const handleSyncToSheets = async () => {
    if (!scriptUrl) {
      alert('URL Google Apps Script belum dikonfigurasi. Sila buka menu Integrasi Database untuk memasukkan URL Web App Spreadsheet.');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('Sedang menyinkronkan data Rincian Belanja ke Sheet "RINCIAN_BELANJA"...');
    try {
      if (onSyncToGoogleSheets) {
        await onSyncToGoogleSheets(rincianList);
      } else {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_rincian_belanja',
            rincianBelanja: rincianList
          })
        });
      }
      setSyncStatusMsg('✅ Data Rincian Belanja Berhasil Tersimpan di Spreadsheet pada Sheet "RINCIAN_BELANJA"!');
    } catch (err) {
      setSyncStatusMsg('❌ Gagal menyinkronkan data: ' + String(err));
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(''), 5000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      await exportToPdf('rincian-kertas-kerja-paper-view', 'Rincian_Kertas_Kerja_Perbulan_BOSP_2026');
    } catch (err) {
      alert('Gagal mengekspor PDF: ' + String(err));
    }
  };

  const kepsekNama = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nama : (settings?.kepalaSekolah || 'Carnia, S.Pd');
  const kepsekNip = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nip : '197112201997032002';
  const bendaharaNama = typeof settings?.bendahara === 'object' ? settings.bendahara.nama : (settings?.bendahara || 'Siti Rukmah, S.Pd.SD');
  const bendaharaNip = typeof settings?.bendahara === 'object' ? settings.bendahara.nip : '196702022008012006';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      {/* Hidden File Input for Uploading PDF */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePdfFileSelect} 
        accept=".pdf" 
        className="hidden" 
      />

      {/* Printable CSS style injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #rincian-kertas-kerja-paper-view, #rincian-kertas-kerja-paper-view * {
            visibility: visible;
          }
          #rincian-kertas-kerja-paper-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                📊 RINCIAN KERTAS KERJA PERBULAN (BOSP)
              </h3>
              <p className="text-xs text-slate-400">
                Data Kertas Kerja Hasil Ekstraksi PDF BOSP {bulan} (Read-Only)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* UPLOAD PDF BUTTON - EXCLUSIVE METHOD TO ADD NEW RINCIAN ITEMS */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPdf}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md hover:scale-102 active:scale-98 disabled:opacity-50 border border-indigo-400/30"
              title="Tambah / Perbarui Data Rincian Belanja dengan mengunggah PDF Rincian Belanja (Gemini AI Parser)"
            >
              <Upload className={`w-4 h-4 ${isUploadingPdf ? 'animate-spin' : ''}`} />
              <span>{isUploadingPdf ? 'Menganalisis PDF...' : 'Upload PDF Rincian Belanja'}</span>
            </button>

            <button
              onClick={handleSyncToSheets}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md border border-emerald-500/50 hover:scale-102 active:scale-98 disabled:opacity-50"
              title="Simpan & Sinkronkan Data ke Google Spreadsheet Sheet 'RINCIAN_BELANJA'"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Simpan ke Spreadsheet'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Cetak (Print)</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleResetDefault}
              className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Reset ke Data Ekstraksi PDF Asli (79 Item)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION STATUS & PROGRESS BANNER */}
        {uploadProgressMsg && (
          <div className="bg-indigo-600 text-white font-bold text-xs px-6 py-2.5 flex items-center justify-between shrink-0 shadow-inner animate-pulse">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 animate-spin text-amber-300" />
              <span>{uploadProgressMsg}</span>
            </div>
          </div>
        )}

        {syncStatusMsg && (
          <div className="bg-emerald-600 text-white font-bold text-xs px-6 py-2 flex items-center justify-between shrink-0 shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{syncStatusMsg}</span>
            </div>
            <button onClick={() => setSyncStatusMsg('')} className="text-white hover:underline text-xs cursor-pointer">Tutup</button>
          </div>
        )}

        {/* SUMMARY STATS BAR */}
        <div className="bg-slate-50 dark:bg-slate-850 px-6 py-3 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs shrink-0">
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">A. Total Penerimaan (BOSP)</span>
            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
              Rp {formatRupiah(totalPenerimaan)}
            </span>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">B. Total Kertas Kerja ({rincianList.length} Item)</span>
            <span className="font-black text-sm text-rose-600 dark:text-rose-400 font-mono">
              Rp {formatRupiah(calculatedTotalBelanja)}
            </span>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Realisasi Transaksi Keluar</span>
            <span className="font-black text-sm text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1">
              <span>Rp {formatRupiah(totalRealizedAmount)}</span>
            </span>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span>NPSN: <strong>20207938</strong></span>
              <span>Bulan: <strong>{bulan}</strong></span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-semibold">
              {settings?.namaSekolah || 'SD NEGERI CIBURIAL'}
            </div>
          </div>
        </div>

        {/* READ ONLY NOTICE BANNER */}
        <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Info Sistem:</strong> Rincian Kertas Kerja BOSP bersifat read-only. Penambahan/perubahan item dilakukan via <strong>Upload PDF Rincian Belanja</strong>. Pilih item untuk merealisasikannya langsung ke <strong>Tabel Transaksi Keluar</strong>.
            </span>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleOpenRealizeBatch}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
              <span>Realisasikan ({selectedIds.length} Selected - Rp {formatRupiah(totalSelectedAmount)})</span>
            </button>
          )}
        </div>

        {/* NAVIGATION TABS & FILTER BAR */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* View Tab Buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs border border-slate-200 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Daftar Rincian Belanja ({filteredList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('paper')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'paper'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs border border-slate-200 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratonton Cetak Kertas Kerja (A4)</span>
            </button>
          </div>

          {/* Search, Program & Realization Status Filter */}
          {activeTab === 'table' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari uraian, kode rekening..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="ALL">Semua Status Realisasi</option>
                <option value="UNREALIZED">Belum Direalisasikan</option>
                <option value="REALIZED">Sudah Direalisasikan</option>
              </select>

              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="ALL">Semua Standar / Program</option>
                <option value="02.">02 - Standar Isi</option>
                <option value="03.">03 - Standar Proses</option>
                <option value="04.">04 - Standar Tenaga Kependidikan</option>
                <option value="05.">05 - Standar Sarana Prasarana</option>
                <option value="06.">06 - Standar Pengelolaan</option>
                <option value="07.">07 - Standar Pembiayaan</option>
                <option value="08.">08 - Standar Penilaian</option>
              </select>
            </div>
          )}
        </div>

        {/* CONTENT VIEW AREA */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-3 sm:p-6">
          
          {/* TAB 1: READ-ONLY TABLE WITH CHECKBOX SELECTION FOR REALIZATION */}
          {activeTab === 'table' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700">
                      <th className="px-3 py-2.5 text-center w-10">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-slate-300 hover:text-white cursor-pointer"
                          title="Pilih / Batalkan Semua Item"
                        >
                          {selectedIds.length > 0 && selectedIds.length === selectableItems.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-2 py-2.5 text-center w-10">No</th>
                      <th className="px-3 py-2.5 w-32">Kode Rekening</th>
                      <th className="px-3 py-2.5 w-24">Kode Prog</th>
                      <th className="px-4 py-2.5">Uraian Keg. / Belanja</th>
                      <th className="px-2.5 py-2.5 text-center w-16">Vol</th>
                      <th className="px-2.5 py-2.5 text-center w-20">Satuan</th>
                      <th className="px-3 py-2.5 text-right w-28">Tarif Harga</th>
                      <th className="px-3 py-2.5 text-right w-32">Jumlah (Rp)</th>
                      <th className="px-3 py-2.5 text-center w-36">Status Realisasi</th>
                      <th className="px-3 py-2.5 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredList.map((item) => {
                      const isHeader = item.isHeader || (!item.kodeRekening && item.jumlah > 0);
                      const isSelected = selectedIds.includes(item.id);

                      return (
                        <tr 
                          key={item.id} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-indigo-100/70 dark:bg-indigo-950/60 font-medium'
                              : isHeader 
                                ? 'bg-slate-100/80 dark:bg-slate-800/70 font-bold text-slate-900 dark:text-slate-100' 
                                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-3 py-2 text-center">
                            {!isHeader && (
                              <input
                                type="checkbox"
                                disabled={item.isRealized}
                                checked={isSelected}
                                onChange={() => toggleSelectItem(item.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={item.isRealized ? 'Item ini sudah direalisasikan' : 'Pilih item'}
                              />
                            )}
                          </td>

                          <td className="px-2 py-2 text-center font-mono text-[11px] text-slate-500">
                            {item.noUrut}
                          </td>

                          <td className="px-3 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {item.kodeRekening || '-'}
                          </td>

                          <td className="px-3 py-2 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {item.kodeProgram || '-'}
                          </td>

                          <td className={`px-4 py-2 ${isHeader ? 'font-black tracking-wide text-indigo-950 dark:text-indigo-200' : 'font-medium'}`}>
                            <span>{item.uraian}</span>
                          </td>

                          <td className="px-2.5 py-2 text-center font-mono text-[11px]">
                            {item.volume || '-'}
                          </td>

                          <td className="px-2.5 py-2 text-center text-slate-600 dark:text-slate-400">
                            {item.satuan || '-'}
                          </td>

                          <td className="px-3 py-2 text-right font-mono text-[11px]">
                            {item.tarifHarga > 0 ? formatRupiah(item.tarifHarga) : '-'}
                          </td>

                          <td className="px-3 py-2 text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                            Rp {formatRupiah(item.jumlah)}
                          </td>

                          {/* Status Badge */}
                          <td className="px-3 py-2 text-center">
                            {isHeader ? (
                              <span className="text-[10px] text-slate-400 font-semibold italic">Judul Sub-Grup</span>
                            ) : item.isRealized ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700" title={`Vendor: ${item.realizedVendor} | ${item.realizedJenis}`}>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Realisasi</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <span>Belum</span>
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="px-3 py-2 text-center">
                            {!isHeader && (
                              item.isRealized ? (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold italic">
                                  Sudah Realisasi
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleOpenRealizeSingle(item)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-700 shadow-2xs w-full"
                                  title="Realisasikan item ini langsung ke Transaksi Keluar"
                                >
                                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>Realisasi</span>
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredList.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 italic">
                          <p className="font-bold text-sm text-slate-500 mb-1">Tidak ada data rincian belanja yang sesuai filter.</p>
                          <p className="text-xs">Gunakan tombol "Upload PDF Rincian Belanja" di atas untuk memuat data dari PDF BOSP.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PRINTABLE PAPER VIEW (A4 COPY OF PDF EXAMPLES) */}
          {activeTab === 'paper' && (
            <div className="flex justify-center">
              <div 
                id="rincian-kertas-kerja-paper-view"
                className="bg-white text-black w-[210mm] min-h-[297mm] p-6 sm:p-8 shadow-2xl rounded-sm font-sans flex flex-col justify-between text-[11px] leading-tight select-text relative border border-slate-300"
              >
                <div>
                  {/* DOCUMENT TITLE */}
                  <h1 className="text-center text-sm sm:text-base font-extrabold uppercase tracking-wide text-black mb-4">
                    RINCIAN KERTAS KERJA PERBULAN<br />
                    TAHUN ANGGARAN : 2026
                  </h1>

                  {/* SCHOOL HEADER INFORMATION */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] font-medium text-black">
                    <div className="space-y-1">
                      <div className="grid grid-cols-[100px_10px_1fr]">
                        <span className="font-semibold">NPSN</span>
                        <span>:</span>
                        <span className="font-bold">20207938</span>
                      </div>
                      <div className="grid grid-cols-[100px_10px_1fr]">
                        <span className="font-semibold">Nama Sekolah</span>
                        <span>:</span>
                        <span className="font-bold uppercase">{settings?.namaSekolah || 'SD NEGERI CIBURIAL'}</span>
                      </div>
                      <div className="grid grid-cols-[100px_10px_1fr]">
                        <span className="font-semibold">Alamat</span>
                        <span>:</span>
                        <span>{settings?.alamatSekolah || 'TANGKUBAN PERAHU, Kec. Lembang'}</span>
                      </div>
                      <div className="grid grid-cols-[100px_10px_1fr]">
                        <span className="font-semibold">Kabupaten</span>
                        <span>:</span>
                        <span>Kab. Bandung Barat</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="grid grid-cols-[100px_10px_1fr]">
                        <span className="font-semibold">Provinsi</span>
                        <span>:</span>
                        <span>Prov. Jawa Barat</span>
                      </div>
                      <div className="grid grid-cols-[100px_10px_1fr]">
                        <span className="font-semibold">Bulan</span>
                        <span>:</span>
                        <span className="font-bold">{bulan}</span>
                      </div>
                      <div className="grid grid-cols-[100px_10px_1fr]">
                        <span className="font-semibold">Sumber Dana</span>
                        <span>:</span>
                        <span className="font-bold">{sumberDana}</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION A. PENERIMAAN */}
                  <div className="mb-4">
                    <h2 className="font-extrabold text-xs uppercase mb-1">A. PENERIMAAN</h2>
                    <div className="text-[10px] font-semibold mb-1">Sumber Dana :</div>
                    <table className="w-full border-collapse border border-black text-[10.5px]">
                      <thead>
                        <tr className="bg-[#f2f2f2]">
                          <th className="border border-black px-2 py-1 text-center w-28">No. Kode</th>
                          <th className="border border-black px-3 py-1 text-left">Penerimaan</th>
                          <th className="border border-black px-3 py-1 text-right w-36">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center font-mono">4.3.1.01.</td>
                          <td className="border border-black px-3 py-1 font-semibold">{sumberDana}</td>
                          <td className="border border-black px-3 py-1 text-right font-mono font-bold">{formatRupiah(totalPenerimaan)}</td>
                        </tr>
                        <tr className="font-bold bg-[#f9f9f9]">
                          <td colSpan={2} className="border border-black px-3 py-1 text-right">Total Penerimaan</td>
                          <td className="border border-black px-3 py-1 text-right font-mono">{formatRupiah(totalPenerimaan)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* SECTION B. BELANJA */}
                  <div>
                    <h2 className="font-extrabold text-xs uppercase mb-1">B. BELANJA</h2>
                    <table className="w-full border-collapse border border-black text-[10px]">
                      <thead>
                        <tr className="bg-[#f2f2f2] text-center font-bold">
                          <th rowSpan={2} className="border border-black px-1 py-1 w-8">No. Urut</th>
                          <th rowSpan={2} className="border border-black px-2 py-1 w-28">Kode Rekening</th>
                          <th rowSpan={2} className="border border-black px-1.5 py-1 w-20">Kode Program</th>
                          <th rowSpan={2} className="border border-black px-2 py-1 text-left">Uraian</th>
                          <th colSpan={3} className="border border-black px-2 py-0.5">Rincian Perhitungan</th>
                          <th rowSpan={2} className="border border-black px-2 py-1 text-right w-24">Jumlah</th>
                        </tr>
                        <tr className="bg-[#f2f2f2] text-center font-bold">
                          <th className="border border-black px-1 py-0.5 w-14">Volume</th>
                          <th className="border border-black px-1 py-0.5 w-16">Satuan</th>
                          <th className="border border-black px-1.5 py-0.5 w-20">Tarif Harga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rincianList.map((item) => {
                          const isHeader = item.isHeader || (!item.kodeRekening && item.jumlah > 0);
                          return (
                            <tr 
                              key={`p-${item.id}`} 
                              className={isHeader ? 'font-bold bg-[#f4f4f4]' : ''}
                            >
                              <td className="border border-black px-1 py-0.5 text-center font-mono">{item.noUrut}.</td>
                              <td className="border border-black px-2 py-0.5 font-mono">{item.kodeRekening}</td>
                              <td className="border border-black px-1.5 py-0.5 text-center font-mono">{item.kodeProgram}</td>
                              <td className="border border-black px-2 py-0.5">{item.uraian}</td>
                              <td className="border border-black px-1 py-0.5 text-center font-mono">{item.volume}</td>
                              <td className="border border-black px-1 py-0.5 text-center">{item.satuan}</td>
                              <td className="border border-black px-1.5 py-0.5 text-right font-mono">
                                {item.tarifHarga > 0 ? formatRupiah(item.tarifHarga) : ''}
                              </td>
                              <td className="border border-black px-2 py-0.5 text-right font-mono font-bold">
                                {formatRupiah(item.jumlah)}
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* TOTAL ROW */}
                        <tr className="font-extrabold bg-[#e6e6e6] text-[11px]">
                          <td colSpan={7} className="border border-black px-3 py-1 text-right uppercase">Jumlah Total Belanja</td>
                          <td className="border border-black px-2 py-1 text-right font-mono">{formatRupiah(calculatedTotalBelanja)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* SIGNATURE BLOCK */}
                  <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div>
                      <p className="font-bold mb-14">Komite Sekolah</p>
                      <p className="font-bold uppercase">Usman Jayusman</p>
                    </div>

                    <div>
                      <p className="font-bold mb-14">Kepala Sekolah</p>
                      <p className="font-bold uppercase">{kepsekNama}</p>
                      <p className="text-[9px]">NIP. {kepsekNip}</p>
                    </div>

                    <div>
                      <p className="text-[9px] mb-1">Kec. Lembang, 28 Juli 2026</p>
                      <p className="font-bold mb-12">Bendahara Sekolah</p>
                      <p className="font-bold uppercase">{bendaharaNama}</p>
                      <p className="text-[9px]">NIP. {bendaharaNip}</p>
                    </div>
                  </div>

                </div>

                {/* FOOTER */}
                <div className="mt-6 pt-2 border-t border-slate-300 flex justify-between text-[8px] text-slate-500 italic">
                  <span>Kertas Kerja perBulan - NPSN : 20207938, Nama Sekolah : {settings?.namaSekolah || 'SD NEGERI CIBURIAL'}</span>
                  <span>Halaman 1 dari 1</span>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* REALIZATION MODAL (REALISASIKAN KE TRANSAKSI KELUAR) - LANDSCAPE LAYOUT */}
      {isRealizeModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <form 
            onSubmit={handleConfirmRealization}
            className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-150"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-xl shrink-0">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Realisasikan Rincian Belanja Ke Transaksi Keluar</span>
                    <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      Landscape View
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Otomatis mengelompokkan {selectedItemsList.length} item Rincian Belanja menjadi 1 catatan Transaksi Keluar BOSP
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsRealizeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY (SCROLLABLE 2-COLUMN LANDSCAPE GRID) */}
            <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 text-xs">
              
              {/* SELECTED ITEMS SUMMARY BOX */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span>Daftar {selectedItemsList.length} Item Rincian Belanja Pilihan:</span>
                  </span>
                  <span className="font-extrabold font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                    Total: Rp {formatRupiah(totalSelectedAmount)}
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                  {selectedItemsList.map((item, idx) => (
                    <div key={item.id} className="text-[11px] p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{idx + 1}. {item.uraian}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">Kode Rek: {item.kodeRekening || '-'} | Vol: {item.volume} {item.satuan} @ Rp {formatRupiah(item.tarifHarga)}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                        Rp {formatRupiah(item.jumlah)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LANDSCAPE 2-COLUMN GRID FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* LEFT COLUMN: INFORMASI TRANSAKSI & SURAT */}
                <div className="space-y-3.5 bg-slate-50/60 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Informasi Transaksi &amp; Surat</span>
                  </h5>

                  {/* 1. JENIS TRANSAKSI / PENGADAAN (Daftar opsi disamakan persis dengan Form Transaksi) */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Jenis Transaksi / Pengadaan:</span>
                    </label>
                    <select
                      value={realizeJenis}
                      onChange={(e) => setRealizeJenis(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                    >
                      {JENIS_TRANSAKSI_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      {!JENIS_TRANSAKSI_OPTIONS.includes(realizeJenis) && (
                        <option value={realizeJenis}>{realizeJenis}</option>
                      )}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Opsi disamakan persis dengan pilihan Jenis Transaksi di Form Transaksi Keluar.
                    </p>
                  </div>

                  {/* 2. NO SURAT SI */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>No. Surat SI:</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={realizeNoSurat}
                      onChange={(e) => setRealizeNoSurat(e.target.value)}
                      placeholder="Misal: 900.3.5.5/001-SDN-CBL/I/2026"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* 3. TANGGAL & KATEGORI */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Tanggal Realisasi:</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={realizeDate}
                        onChange={(e) => setRealizeDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Kategori Belanja:</span>
                      </label>
                      <select
                        value={realizeCategory}
                        onChange={(e) => setRealizeCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs truncate"
                      >
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: URAIAN & VENDOR PENYEDIA */}
                <div className="space-y-3.5 bg-slate-50/60 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Store className="w-4 h-4 text-emerald-500" />
                    <span>Uraian &amp; Vendor Penyedia</span>
                  </h5>

                  {/* MASTER HONOR SELECTION & SUGGESTIONS */}
                  {(realizeJenis || '').toLowerCase().includes('honor') && honorRecipients.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-700/80 rounded-xl p-3 space-y-2">
                      <span className="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1">
                        <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                        Pilih Nama dari Master Honorarium:
                      </span>
                      <select
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          if (!selectedId) return;
                          const found = honorRecipients.find((r) => r.id === selectedId);
                          if (found) {
                            const dateObj = new Date(realizeDate || new Date());
                            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                            const mStr = monthNames[dateObj.getMonth()] || 'Januari';
                            const yStr = dateObj.getFullYear() || 2026;

                            const defaultKet = found.keteranganDefault?.trim()
                              ? `${found.keteranganDefault.trim()} Bulan ${mStr} ${yStr}`
                              : `Pembayaran Honorarium ${found.namaPenerima} Bulan ${mStr} ${yStr}`;

                            setRealizeUraian(defaultKet);
                            setCustomVendorName(found.namaPenerima);
                            setSelectedVendorId('CUSTOM');
                          }
                        }}
                        defaultValue=""
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="">-- Pilih Nama dari List Master Honor --</option>
                        {honorRecipients.map((rec) => (
                          <option key={rec.id} value={rec.id}>
                            {rec.namaPenerima} ({rec.jabatan || 'Penerima Honor'}) - Rp {formatRupiah(rec.netto || 0)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* URAIAN BELANJA */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Uraian Belanja (Keterangan Transaksi):</span>
                      </span>
                      {(realizeJenis || '').toLowerCase().includes('honor') && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          💡 List Master Honor
                        </span>
                      )}
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={realizeUraian}
                      onChange={(e) => setRealizeUraian(e.target.value)}
                      placeholder={(realizeJenis || '').toLowerCase().includes('honor') ? "Pembayaran Honorarium..." : "Masukkan uraian belanja untuk transaksi..."}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* VENDOR SELECTION */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Vendor / Toko / Penerima Pembayaran:</span>
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => {
                        setSelectedVendorId(e.target.value);
                        if (e.target.value && e.target.value !== 'CUSTOM') {
                          const v = vendors.find(x => x.id === e.target.value);
                          if (v) {
                            setCustomVendorName(v.nama);
                            setCustomVendorAddress(v.alamat || '');
                            setCustomVendorNpwp(v.npwp || '');
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs mb-2"
                    >
                      <option value="">-- Pilih dari Master Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.nama} {v.npwp ? `(NPWP: ${v.npwp})` : ''}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Isikan Nama Vendor Baru Secara Manual</option>
                    </select>

                    {/* Custom Vendor Details */}
                    {(!selectedVendorId || selectedVendorId === 'CUSTOM') && (
                      <div className="space-y-2 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                            Nama Vendor / Toko:
                          </label>
                          <input
                            type="text"
                            required
                            value={customVendorName}
                            onChange={(e) => setCustomVendorName(e.target.value)}
                            placeholder="Misal: CV. Media Sarana Utama"
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold uppercase"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                              NPWP Vendor:
                            </label>
                            <input
                              type="text"
                              value={customVendorNpwp}
                              onChange={(e) => setCustomVendorNpwp(e.target.value)}
                              placeholder="01.234.567.8-901.000"
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                              Alamat Vendor:
                            </label>
                            <input
                              type="text"
                              value={customVendorAddress}
                              onChange={(e) => setCustomVendorAddress(e.target.value)}
                              placeholder="Jl. Tangkuban Perahu No. 45"
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>

            {/* ACTION BUTTONS (FIXED AT BOTTOM) */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsRealizeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg cursor-pointer flex items-center gap-2 hover:scale-102 active:scale-98 transition"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Realisasikan &amp; Buat Transaksi Keluar</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
