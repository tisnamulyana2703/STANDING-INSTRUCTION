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
  Trash2,
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
  UserCheck,
  FileUp,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const MONTHS_LIST = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

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
  onDeleteTransaction?: (id: string | number, skipConfirm?: boolean) => void;
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
  onAddBatchTransactions,
  onDeleteTransaction
}: RincianBelanjaModalProps) {
  const [activeTab, setActiveTab] = useState<'table' | 'paper'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNREALIZED' | 'REALIZED'>('ALL');
  const [filterBulan, setFilterBulan] = useState<string>(() => {
    const match = rincianList.find(i => !i.isHeader && i.bulan);
    if (match && match.bulan) {
      const found = MONTHS_LIST.find(m => match.bulan!.toLowerCase().includes(m.toLowerCase()));
      if (found) return found;
    }
    return 'Agustus';
  });

  // PDF Upload & Parser State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  // Interactive PDF Import Confirmation Dialog State
  const [isPdfImportPreviewOpen, setIsPdfImportPreviewOpen] = useState(false);
  const [pendingImportItems, setPendingImportItems] = useState<RincianBelanjaItem[]>([]);
  const [pendingImportMonth, setPendingImportMonth] = useState<string>('Januari');
  const [pendingImportFileName, setPendingImportFileName] = useState<string>('');
  const [mergeStrategy, setMergeStrategy] = useState<'replace_month' | 'append_month' | 'replace_all'>('replace_month');

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

  // Calculate item counts and total per month
  const monthlyStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number; realizedCount: number }> = {};
    for (const m of MONTHS_LIST) {
      stats[m] = { count: 0, total: 0, realizedCount: 0 };
    }
    
    for (const item of rincianList) {
      const itemBulan = (item.bulan || '').trim();
      for (const m of MONTHS_LIST) {
        if (itemBulan.toLowerCase().includes(m.toLowerCase())) {
          if (!item.isHeader && item.jumlah > 0) {
            stats[m].count += 1;
            stats[m].total += item.jumlah;
            if (item.isRealized) stats[m].realizedCount += 1;
          }
        }
      }
    }
    return stats;
  }, [rincianList]);

  // Dynamic Program Options for Filtering Kode Program
  const programOptions = useMemo(() => {
    const map = new Map<string, string>();

    // Standard SNP 8 Standar
    map.set('01.', '01 - Standar Kelulusan');
    map.set('02.', '02 - Standar Isi');
    map.set('03.', '03 - Standar Proses');
    map.set('04.', '04 - Standar Tenaga Kependidikan');
    map.set('05.', '05 - Standar Sarana Prasarana');
    map.set('06.', '06 - Standar Pengelolaan');
    map.set('07.', '07 - Standar Pembiayaan');
    map.set('08.', '08 - Standar Penilaian');

    // Extract all unique Kode Program present in rincianList
    const uniqueCodes = Array.from(
      new Set(rincianList.map(item => (item.kodeProgram || '').trim()).filter(Boolean))
    ).sort();

    uniqueCodes.forEach((code) => {
      if (!map.has(code)) {
        const headerMatch = rincianList.find(i => (i.kodeProgram || '').trim() === code && i.isHeader && i.uraian);
        const label = headerMatch ? `${code} - ${headerMatch.uraian.slice(0, 35)}...` : `Kode: ${code}`;
        map.set(code, label);
      }
    });

    return Array.from(map.entries());
  }, [rincianList]);

  // Filtered List based on active month, search, program, and realization status
  const filteredList = useMemo(() => {
    return rincianList.filter(item => {
      const matchSearch = 
        item.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kodeRekening.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kodeProgram.toLowerCase().includes(searchTerm.toLowerCase());
      
      const itemKp = (item.kodeProgram || '').trim();
      const matchProg = filterProgram === 'ALL' || itemKp === filterProgram || itemKp.startsWith(filterProgram) || itemKp.includes(filterProgram);

      let matchStatus = true;
      if (filterStatus === 'REALIZED') matchStatus = !!item.isRealized;
      if (filterStatus === 'UNREALIZED') matchStatus = !item.isRealized;

      let matchBulan = true;
      if (filterBulan !== 'ALL') {
        const itemBulan = (item.bulan || '').trim().toLowerCase();
        const targetBulan = filterBulan.trim().toLowerCase();
        if (item.isHeader) {
          matchBulan = !itemBulan || itemBulan.includes(targetBulan);
        } else {
          matchBulan = itemBulan.includes(targetBulan);
        }
      }

      return matchSearch && matchProg && matchStatus && matchBulan;
    });
  }, [rincianList, searchTerm, filterProgram, filterStatus, filterBulan]);

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

  // Total expenditure sum of current active month view
  const calculatedTotalBelanja = useMemo(() => {
    const detailSum = filteredList
      .filter(i => !i.isHeader && i.jumlah > 0)
      .reduce((acc, curr) => acc + curr.jumlah, 0);
    
    if (detailSum > 0) return detailSum;
    return filteredList.reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [filteredList]);

  const totalRealizedAmount = useMemo(() => {
    return filteredList
      .filter(i => !i.isHeader && i.isRealized && i.jumlah > 0)
      .reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [filteredList]);

  const sisaAnggaran = totalPenerimaan - calculatedTotalBelanja;

  if (!isOpen) return null;

  // Month Tab Switcher Handler
  const handleSelectMonthTab = (selectedM: string) => {
    setFilterBulan(selectedM);
    setBulan(`${selectedM} 2026`);
  };

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

  // PDF Upload Handler via Gemini AI Backend
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
              fileName: file.name,
              targetMonth: filterBulan !== 'ALL' ? filterBulan : 'Januari'
            })
          });

          let data: any = null;
          const rawText = await res.text().catch(() => '');

          try {
            data = JSON.parse(rawText);
          } catch {
            console.warn('Backend endpoint returned non-JSON:', res.status, rawText.slice(0, 100));
            data = {
              success: false,
              error: 'Server tidak mengembalikan format JSON (Kemungkinan file PDF terlalu besar atau kunci API AI belum aktif)'
            };
          }

          if (data && data.success && Array.isArray(data.items) && data.items.length > 0) {
            const detectedM = data.detectedMonth || (filterBulan !== 'ALL' ? filterBulan : 'Januari');

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
              bulan: item.bulan || detectedM,
              tahun: item.tahun || '2026'
            }));

            // Open the interactive confirmation modal instead of standard confirm()
            setPendingImportItems(formattedItems);
            setPendingImportMonth(detectedM);
            setPendingImportFileName(file.name);
            setMergeStrategy('replace_month');
            setIsPdfImportPreviewOpen(true);

          } else {
            const errorReason = data?.error || 'Ekstraksi PDF tidak mengembalikan data Rincian Belanja.';
            alert(`Info Ekstraksi PDF:\n\n${errorReason}\n\nSistem tetap mempertahankan data Rincian Belanja saat ini.`);
          }
        } catch (apiErr: any) {
          console.warn('Backend Gemini API error:', apiErr);
          alert(`Info Ekstraksi PDF: Gagal memproses file PDF (${apiErr?.message || 'Error koneksi'}). Data tetap menggunakan rincian belanja saat ini.`);
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

  // Confirm PDF Import with selected merge strategy
  const handleApplyPdfImport = () => {
    if (pendingImportItems.length === 0) return;

    const chosenMonth = pendingImportMonth.trim();
    const chosenMonthLower = chosenMonth.toLowerCase();

    // Ensure all items are assigned to chosenMonth
    const preparedItems = pendingImportItems.map((item, idx) => ({
      ...item,
      bulan: chosenMonth,
      noUrut: idx + 1
    }));

    let updatedList: RincianBelanjaItem[] = [];

    if (mergeStrategy === 'replace_month') {
      // 1. Keep all items from OTHER months untouched!
      const otherMonthsItems = rincianList.filter(item => {
        const itemBulan = (item.bulan || '').trim().toLowerCase();
        return !itemBulan.includes(chosenMonthLower);
      });

      // 2. Combine with new items for chosenMonth
      updatedList = [...otherMonthsItems, ...preparedItems];

    } else if (mergeStrategy === 'append_month') {
      // Append to existing items
      const existingCount = rincianList.length;
      const renumbered = preparedItems.map((it, idx) => ({
        ...it,
        noUrut: existingCount + idx + 1
      }));
      updatedList = [...rincianList, ...renumbered];

    } else if (mergeStrategy === 'replace_all') {
      // Full replacement
      updatedList = preparedItems;
    }

    // Save and switch tab to the imported month
    onSaveList(updatedList);
    setFilterBulan(chosenMonth);
    setBulan(`${chosenMonth} 2026`);
    setIsPdfImportPreviewOpen(false);

    // Auto sync to Google Sheets if connected
    if (onSyncToGoogleSheets) {
      onSyncToGoogleSheets(updatedList);
    }

    setSyncStatusMsg(`✅ Berhasil memuat ${preparedItems.length} item Rincian Belanja ke Bulan "${chosenMonth}" dari file PDF! Data bulan lain tetap aman.`);
    setTimeout(() => setSyncStatusMsg(''), 7000);
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

    // Calculate sequential transaction No. Urut
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

  // Cancel Realization for an item and automatically delete the associated transaction
  const handleCancelRealization = (itemToCancel: RincianBelanjaItem) => {
    if (!itemToCancel.isRealized) return;

    if (!confirm(`Apakah Anda yakin ingin membatalkan status realisasi untuk item "${itemToCancel.uraian}"?\n\nItem ini akan dikembalikan ke status "Belum Realisasi" dan transaksi terkait akan otomatis terhapus dari Tabel Transaksi.`)) {
      return;
    }

    const txIdToDelete = itemToCancel.realizedTxId;

    // 1. Delete associated transaction if ID is found
    if (txIdToDelete && onDeleteTransaction) {
      onDeleteTransaction(txIdToDelete, true);
    } else if (onDeleteTransaction && itemToCancel.uraian) {
      const matchTx = (existingTransactions || []).find(t => 
        t.keterangan === itemToCancel.uraian || 
        (t.deskripsiFull && t.deskripsiFull.includes(itemToCancel.uraian))
      );
      if (matchTx) {
        onDeleteTransaction(matchTx.id, true);
      }
    }

    // 2. Unmark realization in rincianList
    const updatedRincianList = rincianList.map(item => {
      const isSameTx = txIdToDelete && item.realizedTxId === txIdToDelete;
      const isSameItem = item.id === itemToCancel.id;
      if (isSameTx || isSameItem) {
        return {
          ...item,
          isRealized: false,
          realizedVendor: undefined,
          realizedJenis: undefined,
          realizedDate: undefined,
          realizedTxId: undefined
        };
      }
      return item;
    });

    onSaveList(updatedRincianList);

    setSyncStatusMsg(`🔄 Realisasi dibatalkan untuk "${itemToCancel.uraian}". Status dikembalikan ke "Belum" & transaksi terkait telah terhapus.`);
    setTimeout(() => setSyncStatusMsg(''), 5000);
  };

  // Delete all items of active month only
  const handleDeleteMonthRincian = () => {
    const targetMonth = filterBulan || (bulan ? bulan.split(' ')[0] : 'Agustus');
    const targetBulanLower = targetMonth.toLowerCase();

    // Find items belonging to targetMonth
    const itemsToDelete = rincianList.filter(item => {
      if (item.isHeader) return false;
      const itemBulan = (item.bulan || '').trim().toLowerCase();
      return itemBulan.includes(targetBulanLower);
    });

    if (itemsToDelete.length === 0) {
      alert(`Tidak ditemukan data rincian belanja untuk Bulan "${targetMonth}".`);
      return;
    }

    if (confirm(`Apakah Anda yakin ingin MENGHAPUS SELURUH ${itemsToDelete.length} item rincian belanja untuk Bulan ${targetMonth}?\n\nPerhatian: Jika ada item yang sudah direalisasikan, transaksinya juga akan otomatis terhapus dari Tabel Transaksi.\n\nData bulan lainnya TIDAK akan terpengaruh.`)) {
      // Clean up realized transactions if any
      itemsToDelete.forEach(item => {
        if (item.isRealized && item.realizedTxId && onDeleteTransaction) {
          onDeleteTransaction(item.realizedTxId, true);
        }
      });

      // Filter out items belonging to targetMonth
      const updatedList = rincianList.filter(item => {
        if (item.isHeader) return true;
        const itemBulan = (item.bulan || '').trim().toLowerCase();
        return !itemBulan.includes(targetBulanLower);
      });

      onSaveList(updatedList);
      setSelectedIds([]);
      setSyncStatusMsg(`🗑️ Berhasil menghapus ${itemsToDelete.length} item rincian belanja Bulan ${targetMonth}.`);
      setTimeout(() => setSyncStatusMsg(''), 5000);
    }
  };

  const handleSyncToSheets = async () => {
    if (!scriptUrl) {
      alert('URL Google Apps Script belum dikonfigurasi. Sila buka menu Integrasi Database untuk memasukkan URL Web App Spreadsheet.');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('Sedang menyinkronkan data Rincian Belanja ke Sheet "RINCIAN_BELANJA" & 12 Sheet Bulanan...');
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
      setSyncStatusMsg('✅ Data Rincian Belanja Berhasil Tersimpan di Spreadsheet (Master & 12 Sheet Bulanan)!');
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
      const fileName = filterBulan !== 'ALL'
        ? `Rincian_Kertas_Kerja_BOSP_${filterBulan}_2026`
        : 'Rincian_Kertas_Kerja_Perbulan_BOSP_2026';
      await exportToPdf('rincian-kertas-kerja-paper-view', fileName);
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
                Data Kertas Kerja Ekstraksi PDF BOSP Bulanan {bulan}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* UPLOAD PDF BUTTON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPdf}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md hover:scale-102 active:scale-98 disabled:opacity-50 border border-indigo-400/30"
              title="Unggah file PDF Rincian Belanja bulanan (Januari s.d. Desember) - AI akan mengekstraksi dan menyimpannya tanpa menghapus bulan lain"
            >
              <Upload className={`w-4 h-4 ${isUploadingPdf ? 'animate-spin' : ''}`} />
              <span>{isUploadingPdf ? 'Menganalisis PDF...' : 'Upload PDF Rincian Belanja'}</span>
            </button>

            <button
              onClick={handleSyncToSheets}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md border border-emerald-500/50 hover:scale-102 active:scale-98 disabled:opacity-50"
              title="Simpan & Sinkronkan Data ke Google Spreadsheet Sheet 'RINCIAN_BELANJA' & 12 Sheet Bulanan"
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
              onClick={handleDeleteMonthRincian}
              className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-rose-800 shadow-sm"
              title={`Hapus Seluruh Rincian Belanja Bulan ${filterBulan}`}
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">
                Hapus Bulan {filterBulan}
              </span>
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
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
              B. Total Belanja (Bulan {filterBulan})
            </span>
            <span className="font-black text-sm text-rose-600 dark:text-rose-400 font-mono">
              Rp {formatRupiah(calculatedTotalBelanja)}
            </span>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
              Realisasi Transaksi (Bulan {filterBulan})
            </span>
            <span className="font-black text-sm text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1">
              <span>Rp {formatRupiah(totalRealizedAmount)}</span>
            </span>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span>NPSN: <strong>20207938</strong></span>
              <span>Bulan Aktif: <strong className="text-indigo-600 dark:text-indigo-400">{filterBulan}</strong></span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-semibold">
              {settings?.namaSekolah || 'SD NEGERI CIBURIAL'}
            </div>
          </div>
        </div>

        {/* 12 MONTHLY TABS BAR (JANUARI - DESEMBER) */}
        <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0 flex items-center gap-1.5 scrollbar-thin">
          <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-2 pr-1 shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Pilih Bulan:</span>
          </span>

          {/* 12 Individual Monthly Tabs */}
          {MONTHS_LIST.map((mName) => {
            const stat = monthlyStats[mName] || { count: 0, total: 0, realizedCount: 0 };
            const isActive = filterBulan === mName;
            const hasData = stat.count > 0;

            return (
              <button
                key={mName}
                type="button"
                onClick={() => handleSelectMonthTab(mName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-102 font-black'
                    : hasData
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
                      : 'bg-slate-200/60 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent'
                }`}
                title={`Bulan ${mName}: ${stat.count} item (Total Rp ${formatRupiah(stat.total)})`}
              >
                {/* Indicator dot */}
                <span className={`w-2 h-2 rounded-full ${
                  isActive 
                    ? 'bg-white ring-2 ring-white/40' 
                    : hasData 
                      ? 'bg-emerald-500' 
                      : 'bg-slate-300 dark:bg-slate-600'
                }`} />

                <span>{mName}</span>

                {/* Badge count */}
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-white/25 text-white font-bold'
                    : hasData
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}>
                  {stat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* BATCH REALIZATION ACTION BAR (WHEN ITEMS SELECTED) */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-2 shrink-0">
            <span className="font-semibold text-indigo-700 dark:text-indigo-300">
              {selectedIds.length} Item Terpilih (Total Rp {formatRupiah(totalSelectedAmount)})
            </span>
            <button
              onClick={handleOpenRealizeBatch}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
              <span>Realisasikan ke Tabel Transaksi Keluar</span>
            </button>
          </div>
        )}

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
              <span>Pratonton Cetak Kertas Kerja A4 ({filterBulan === 'ALL' ? 'Semua Bulan' : filterBulan})</span>
            </button>
          </div>

          {/* Search, Program & Realization Status Filter */}
          {activeTab === 'table' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari uraian, kode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filter Kode Program */}
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[220px]"
                title="Filter berdasarkan Kode Program / Standar BOSP"
              >
                <option value="ALL">Semua Kode Program</option>
                {programOptions.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Status Realisasi</option>
                <option value="UNREALIZED">Belum Direalisasikan</option>
                <option value="REALIZED">Sudah Direalisasikan</option>
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
                      <th className="px-4 py-2.5">Uraian Kegiatan / Belanja</th>
                      <th className="px-2.5 py-2.5 text-center w-16">Vol</th>
                      <th className="px-2.5 py-2.5 text-center w-20">Satuan</th>
                      <th className="px-3 py-2.5 text-right w-28">Tarif Harga</th>
                      <th className="px-3 py-2.5 text-right w-32">Jumlah (Rp)</th>
                      <th className="px-2.5 py-2.5 text-center w-24">Bulan</th>
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

                          {/* Bulan Tab indicator badge */}
                          <td className="px-2.5 py-2 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {item.bulan || 'Agustus'}
                            </span>
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
                                <button
                                  type="button"
                                  onClick={() => handleCancelRealization(item)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900/90 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-800 shadow-2xs w-full"
                                  title="Batalkan realisasi item ini dan otomatis hapus transaksi terkait dari Tabel Transaksi"
                                >
                                  <RotateCcw className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  <span>Batalkan</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
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
                        <td colSpan={12} className="py-12 text-center text-slate-400 italic">
                          <p className="font-bold text-sm text-slate-500 mb-1">
                            {filterBulan !== 'ALL' 
                              ? `Belum ada data rincian belanja untuk Bulan ${filterBulan}.` 
                              : 'Tidak ada data rincian belanja yang sesuai filter.'}
                          </p>
                          <p className="text-xs">
                            Gunakan tombol "Upload PDF Rincian Belanja" di atas untuk memuat data dari PDF BOSP {filterBulan !== 'ALL' ? `Bulan ${filterBulan}` : ''}.
                          </p>
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
                        <span className="font-bold">{filterBulan === 'ALL' ? bulan : `${filterBulan} 2026`}</span>
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
                        {filteredList.map((item) => {
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

      {/* MODAL 1: INTERACTIVE PDF IMPORT PREVIEW & MERGE CONFIRMATION */}
      {isPdfImportPreviewOpen && (
        <div className="fixed inset-0 z-70 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-150">
            
            {/* PREVIEW HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-xl shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Pratinjau &amp; Konfirmasi Impor PDF Rincian Belanja</span>
                    <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Gemini AI Extracted
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    File: <strong className="text-slate-700 dark:text-slate-300">{pendingImportFileName}</strong> • {pendingImportItems.length} baris rincian terbaca
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsPdfImportPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PREVIEW BODY */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              
              {/* TARGET MONTH & MERGE OPTIONS SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                
                {/* 1. Target Month Selector */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Target Tab Bulan Penyimpanan:</span>
                  </label>
                  <select
                    value={pendingImportMonth}
                    onChange={(e) => setPendingImportMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                  >
                    {MONTHS_LIST.map((m) => (
                      <option key={m} value={m}>
                        Bulan: {m} 2026
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    *Pilih bulan yang sesuai dengan dokumen PDF yang baru Anda unggah.
                  </p>
                </div>

                {/* 2. Merge Strategy Selection */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5 text-xs">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span>Metode Penggabungan / Penyimpanan:</span>
                  </label>

                  <div className="space-y-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      mergeStrategy === 'replace_month'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="merge_opt"
                        checked={mergeStrategy === 'replace_month'}
                        onChange={() => setMergeStrategy('replace_month')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-extrabold block text-xs">
                          🌟 Gantikan Hanya Bulan {pendingImportMonth} (Rekomendasi)
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Hanya memperbarui rincian belanja Bulan {pendingImportMonth}. Seluruh 11 bulan lainnya tetap utuh dan tidak terhapus!
                        </span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      mergeStrategy === 'append_month'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="merge_opt"
                        checked={mergeStrategy === 'append_month'}
                        onChange={() => setMergeStrategy('append_month')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-extrabold block text-xs">
                          ➕ Tambahkan ke Bulan {pendingImportMonth}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Menambahkan baris baru ini ke rincian belanja Bulan {pendingImportMonth} yang sudah ada.
                        </span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition ${
                      mergeStrategy === 'replace_all'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="merge_opt"
                        checked={mergeStrategy === 'replace_all'}
                        onChange={() => setMergeStrategy('replace_all')}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold block text-xs text-rose-700 dark:text-rose-300">
                          ⚠️ Timpa Seluruh Data (Semua 12 Bulan)
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Hanya pilih jika Anda ingin mereset seluruh tahunan dan menggantinya hanya dengan isi dokumen ini.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              {/* EXTRACTED ITEMS PREVIEW TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>Daftar {pendingImportItems.length} Baris Rincian Terbaca:</span>
                  </span>
                  <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                    Total Belanja: Rp {formatRupiah(pendingImportItems.reduce((acc, c) => acc + (c.jumlah || 0), 0))}
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-center w-8">No</th>
                        <th className="px-2 py-1.5 w-24">Kode Rek</th>
                        <th className="px-3 py-1.5">Uraian</th>
                        <th className="px-2 py-1.5 text-center w-12">Vol</th>
                        <th className="px-2 py-1.5 text-center w-14">Satuan</th>
                        <th className="px-2 py-1.5 text-right w-24">Tarif</th>
                        <th className="px-2.5 py-1.5 text-right w-28">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {pendingImportItems.map((item, idx) => (
                        <tr key={idx} className={item.isHeader ? 'bg-slate-50 dark:bg-slate-800/60 font-bold' : ''}>
                          <td className="px-2 py-1 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="px-2 py-1 font-mono text-slate-600 dark:text-slate-400">{item.kodeRekening || '-'}</td>
                          <td className="px-3 py-1 font-medium">{item.uraian}</td>
                          <td className="px-2 py-1 text-center font-mono">{item.volume || '-'}</td>
                          <td className="px-2 py-1 text-center">{item.satuan || '-'}</td>
                          <td className="px-2 py-1 text-right font-mono">{item.tarifHarga > 0 ? formatRupiah(item.tarifHarga) : '-'}</td>
                          <td className="px-2.5 py-1 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            Rp {formatRupiah(item.jumlah)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* PREVIEW FOOTER */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsPdfImportPreviewOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleApplyPdfImport}
                className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan &amp; Terapkan ke Bulan {pendingImportMonth}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: REALIZATION MODAL (REALISASIKAN KE TRANSAKSI KELUAR) - LANDSCAPE LAYOUT */}
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
                        <span className="text-[10px] text-slate-500 block font-mono">Kode Rek: {item.kodeRekening || '-'} | Vol: {item.volume} {item.satuan} @ Rp {formatRupiah(item.tarifHarga)} | Bulan: {item.bulan || '-'}</span>
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

                  {/* 1. JENIS TRANSAKSI / PENGADAAN */}
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
                        <option value="">-- Pilih Guru / Tenaga Pendidik --</option>
                        {honorRecipients.map((rec) => (
                          <option key={rec.id} value={rec.id}>
                            {rec.namaPenerima} ({rec.jabatan || rec.kategoriDefault || 'Pendidik'}) - {rec.namaBank} {rec.noRekPenerima}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* URAIAN TRANSAKSI KELUAR */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Keterangan Transaksi:</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={realizeUraian}
                      onChange={(e) => setRealizeUraian(e.target.value)}
                      placeholder="Uraian ringkas belanja..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs text-xs"
                    />
                  </div>

                  {/* VENDOR SELECTION */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Penyedia / Toko / Vendor:</span>
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedVendorId(val);
                        if (val !== 'CUSTOM') {
                          const v = vendors.find(item => item.id === val);
                          if (v) {
                            setCustomVendorName(v.nama);
                            setCustomVendorAddress(v.alamat || '');
                            setCustomVendorNpwp(v.npwp || '');
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs mb-2"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nama} {v.alamat ? `(${v.alamat})` : ''}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Masukkan Nama Toko / Penerima Manual</option>
                    </select>

                    {selectedVendorId === 'CUSTOM' && (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          required
                          placeholder="Nama Toko / Penyedia / Penerima..."
                          value={customVendorName}
                          onChange={(e) => setCustomVendorName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Alamat Toko / Penyedia..."
                          value={customVendorAddress}
                          onChange={(e) => setCustomVendorAddress(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs"
                        />
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <span className="text-xs text-slate-500">
                Total Realisasi: <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">Rp {formatRupiah(totalSelectedAmount)}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRealizeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan ke Transaksi Keluar</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
