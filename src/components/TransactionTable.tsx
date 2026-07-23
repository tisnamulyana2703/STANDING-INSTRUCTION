import React, { useState, useMemo } from 'react';
import { Transaction, SchoolSettings } from '../types';
import { formatRupiah } from '../utils/terbilang';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Building2,
  SlidersHorizontal,
  RefreshCw,
  Download,
  Cloud,
  Printer
} from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedIds: string[];
  settings?: SchoolSettings;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onSelectGroupNoSurat: (noSurat: string) => void;
  onGenerateSIForSelected: () => void;
  onGenerateSIForNoSurat: (noSurat: string) => void;
  onAddNew: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenImportExport: () => void;
  onOpenSettings: () => void;
}

export function TransactionTable({
  transactions,
  selectedIds,
  settings,
  onToggleSelect,
  onSelectAll,
  onSelectGroupNoSurat,
  onGenerateSIForSelected,
  onGenerateSIForNoSurat,
  onAddNew,
  onEdit,
  onDelete,
  onOpenImportExport,
  onOpenSettings,
}: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [jenisFilter, setJenisFilter] = useState('ALL');
  const [noSuratFilter, setNoSuratFilter] = useState('ALL');
  const [tipeFilter, setTipeFilter] = useState<'ALL' | 'KELUAR' | 'MASUK'>('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Extract counts and sums for Masuk vs Keluar
  const typeCounts = useMemo(() => {
    let countMasuk = 0;
    let sumMasuk = 0;
    let countKeluar = 0;
    let sumKeluar = 0;

    transactions.forEach((tx) => {
      const isMasuk =
        tx.tipeTransaksi === 'MASUK' ||
        (tx.jenisTransaksi || '').toUpperCase().includes('SALUR') ||
        (tx.jenisTransaksi || '').toUpperCase().includes('PEMASUKAN') ||
        tx.siplah === 'BOS SALUR';

      if (isMasuk) {
        countMasuk += 1;
        sumMasuk += tx.netto || 0;
      } else {
        countKeluar += 1;
        sumKeluar += tx.netto || 0;
      }
    });

    return {
      countMasuk,
      sumMasuk,
      countKeluar,
      sumKeluar,
      countAll: transactions.length,
    };
  }, [transactions]);

  // Extract unique filter options
  const years = useMemo(() => {
    const list = Array.from(new Set(transactions.map((t) => String(t.tahun || '')).filter(Boolean)));
    return list.sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const months = useMemo(() => {
    return [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
  }, []);

  const jenisList = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => String(t.jenisTransaksi || '')).filter(Boolean))).sort();
  }, [transactions]);

  const noSuratList = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => String(t.noSurat || '')).filter(Boolean))).sort();
  }, [transactions]);

  // Helper to parse DD/MM/YYYY date strings
  function parseIndonesianDate(dmy: string): number {
    if (!dmy) return 0;
    const parts = dmy.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day).getTime();
    }
    return new Date(dmy).getTime() || 0;
  }

  // Filter & sort transactions (newest on top)
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((tx) => {
      const isMasuk =
        tx.tipeTransaksi === 'MASUK' ||
        String(tx.jenisTransaksi || '').toUpperCase().includes('SALUR') ||
        String(tx.jenisTransaksi || '').toUpperCase().includes('PEMASUKAN') ||
        tx.siplah === 'BOS SALUR';

      if (tipeFilter === 'MASUK' && !isMasuk) return false;
      if (tipeFilter === 'KELUAR' && isMasuk) return false;

      if (yearFilter !== 'ALL' && String(tx.tahun) !== yearFilter) return false;
      if (monthFilter !== 'ALL' && String(tx.bulan) !== monthFilter) return false;
      if (jenisFilter !== 'ALL' && String(tx.jenisTransaksi) !== jenisFilter) return false;
      if (noSuratFilter !== 'ALL' && String(tx.noSurat) !== noSuratFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          String(tx.namaPenerima || '').toLowerCase().includes(q) ||
          String(tx.noSurat || '').toLowerCase().includes(q) ||
          String(tx.noRekPenerima || '').toLowerCase().includes(q) ||
          String(tx.keterangan || '').toLowerCase().includes(q) ||
          String(tx.vendor || '').toLowerCase().includes(q) ||
          String(tx.noPo || '').toLowerCase().includes(q) ||
          String(tx.kategori || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    // Display newest transactions at the top
    return list.sort((a, b) => {
      const timeA = parseIndonesianDate(a.tanggal);
      const timeB = parseIndonesianDate(b.tanggal);
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return (b.no || 0) - (a.no || 0);
    });
  }, [transactions, tipeFilter, yearFilter, monthFilter, jenisFilter, noSuratFilter, searchTerm]);

  // Total pages & pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const pageIds = useMemo(() => currentItems.map((i) => i.id), [currentItems]);
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => acc + (curr.netto || 0), 0);
  }, [filteredTransactions]);

  const totalSelectedAmount = useMemo(() => {
    return transactions
      .filter((t) => selectedIds.includes(t.id) || selectedIds.includes(String(t.id)))
      .reduce((acc, curr) => acc + (curr.netto || 0), 0);
  }, [transactions, selectedIds]);

  const resetFilters = () => {
    setSearchTerm('');
    setYearFilter('ALL');
    setMonthFilter('ALL');
    setJenisFilter('ALL');
    setNoSuratFilter('ALL');
    setCurrentPage(1);
  };

  const handlePrintTransactions = (itemsToPrint: Transaction[], title: string = 'LAPORAN DATABASE TRANSAKSI BOSP') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // If user has selected items and triggers a general print, default to printing selected items
    const selectedItemsList = transactions.filter((t) => selectedIds.includes(t.id) || selectedIds.includes(String(t.id)));
    const targetItems = (selectedIds.length > 0 && itemsToPrint === filteredTransactions) ? selectedItemsList : itemsToPrint;
    const targetTitle = (selectedIds.length > 0 && itemsToPrint === filteredTransactions) ? 'LAPORAN TRANSAKSI TERPILIH BOSP' : title;

    const totalAmount = targetItems.reduce((acc, curr) => acc + (curr.netto || 0), 0);

    const namaSekolah = settings?.namaSekolah || 'SD NEGERI CIBORANG';
    const kepsek = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nama : (settings?.kepalaSekolah || 'NAMA KEPALA SEKOLAH');
    const nipKepsek = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nip : '-';
    const bendahara = typeof settings?.bendahara === 'object' ? settings.bendahara.nama : (settings?.bendahara || 'NAMA BENDAHARA');
    const nipBendahara = typeof settings?.bendahara === 'object' ? settings.bendahara.nip : '-';

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const tableRows = targetItems
      .map(
        (tx, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px 8px; text-align: center; font-size: 10px;">${tx.tanggal || '-'}</td>
        <td style="padding: 6px 8px;">
          <div style="font-weight: 600; color: #0f172a;">${tx.jenisTransaksi || '-'}</div>
          <div style="font-size: 10px; color: #64748b;">${tx.kategori || ''} ${tx.siplah ? `• ${tx.siplah}` : ''}</div>
        </td>
        <td style="padding: 6px 8px;">
          <div style="font-weight: 600;">${tx.namaPenerima || '-'}</div>
          <div style="font-size: 10px; color: #64748b;">Bank: ${tx.namaBank || 'BJB'} (${tx.noRekPenerima || '-'})</div>
        </td>
        <td style="padding: 6px 8px; font-size: 10px; font-family: monospace;">${tx.noSurat || '-'}</td>
        <td style="padding: 6px 8px;">${tx.keterangan || '-'}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 700; font-family: monospace;">Rp ${formatRupiah(tx.netto)}</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${targetTitle} - ${namaSekolah}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 12mm 12mm 12mm 12mm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              color: #1e293b;
              margin: 0;
              padding: 10px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              text-transform: uppercase;
              color: #0f172a;
            }
            .header h2 {
              margin: 4px 0 0 0;
              font-size: 14px;
              color: #334155;
              font-weight: 600;
            }
            .header p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #64748b;
            }
            .meta-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 11px;
              background: #f1f5f9;
              padding: 8px 12px;
              border-radius: 6px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #1e293b;
              color: #ffffff;
              padding: 8px;
              font-size: 11px;
              text-align: left;
              text-transform: uppercase;
            }
            th.right, td.right {
              text-align: right;
            }
            th.center, td.center {
              text-align: center;
            }
            .summary-box {
              display: flex;
              justify-content: flex-end;
              margin-top: 10px;
              margin-bottom: 25px;
            }
            .summary-table {
              width: 320px;
              border: 1px solid #cbd5e1;
            }
            .summary-table td {
              padding: 6px 10px;
              border-bottom: 1px solid #e2e8f0;
            }
            .signatures {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 260px;
            }
            .sig-space {
              height: 60px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${targetTitle}</h1>
            <h2>${namaSekolah}</h2>
            <p>Dicetak pada: ${dateStr} | Total ${targetItems.length} Transaksi</p>
          </div>

          <div class="meta-info">
            <div>
              <strong>Filter Terpasang:</strong> 
              ${tipeFilter !== 'ALL' ? `Tipe: ${tipeFilter} | ` : ''}
              ${yearFilter !== 'ALL' ? `Tahun: ${yearFilter} | ` : ''}
              ${monthFilter !== 'ALL' ? `Bulan: ${monthFilter} | ` : ''}
              ${jenisFilter !== 'ALL' ? `Jenis: ${jenisFilter} | ` : ''}
              ${noSuratFilter !== 'ALL' ? `No Surat: ${noSuratFilter}` : 'Semua Data'}
            </div>
            <div><strong>Total Nominal:</strong> <span style="font-family: monospace; font-size: 13px;">Rp ${formatRupiah(totalAmount)}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="center" style="width: 30px;">NO</th>
                <th class="center" style="width: 80px;">TANGGAL</th>
                <th style="width: 160px;">JENIS / KATEGORI</th>
                <th style="width: 220px;">PENERIMA / VENDOR</th>
                <th style="width: 150px;">NO. SURAT</th>
                <th>KETERANGAN</th>
                <th class="right" style="width: 130px;">NOMINAL NETTO</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="summary-box">
            <table class="summary-table">
              <tr>
                <td><strong>Total Transaksi:</strong></td>
                <td class="right">${targetItems.length} Item</td>
              </tr>
              <tr style="background-color: #f8fafc; font-weight: bold;">
                <td><strong>TOTAL NETTO:</strong></td>
                <td class="right" style="font-family: monospace; font-size: 13px; color: #0f172a;">Rp ${formatRupiah(totalAmount)}</td>
              </tr>
            </table>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <p>Mengetahui,<br><strong>Kepala ${namaSekolah}</strong></p>
              <div class="sig-space"></div>
              <p style="text-decoration: underline; font-weight: bold; margin: 0;">${kepsek}</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #475569;">NIP. ${nipKepsek}</p>
            </div>
            <div class="sig-box">
              <p>Lembang, ${dateStr}<br><strong>Bendahara BOSP</strong></p>
              <div class="sig-space"></div>
              <p style="text-decoration: underline; font-weight: bold; margin: 0;">${bendahara}</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #475569;">NIP. ${nipBendahara}</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls - Bento Style */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/80 rounded-2xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Database Transaksi BOSP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Total {filteredTransactions.length} dari {transactions.length} data transaksi terdaftar
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-open-standing-instruction"
            onClick={() => {
              if (noSuratFilter !== 'ALL') {
                onGenerateSIForNoSurat(noSuratFilter);
              } else if (selectedIds.length > 0) {
                onGenerateSIForSelected();
              } else if (filteredTransactions.length > 0) {
                const firstNoSurat = filteredTransactions.find((t) => t.noSurat)?.noSurat;
                if (firstNoSurat) {
                  onGenerateSIForNoSurat(firstNoSurat);
                } else {
                  onGenerateSIForSelected();
                }
              } else {
                alert('Tidak ada data transaksi untuk dibuatkan Standing Instruction.');
              }
            }}
            className="inline-flex items-center px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Cetak / Preview Standing Instruction BOSP"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Standing Instruction
          </button>

          <button
            id="btn-school-settings"
            onClick={onOpenSettings}
            className="inline-flex items-center px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80"
          >
            <Building2 className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
            Kop & TTD
          </button>

          <button
            id="btn-import-export"
            onClick={onOpenImportExport}
            className="inline-flex items-center px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
          >
            <Cloud className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
            Database / Google Sheets
          </button>

          <button
            id="btn-add-transaction"
            onClick={onAddNew}
            className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Selected Items Floating Notification / Action bar */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center space-x-3.5">
            <span className="bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold font-mono border border-indigo-400/30">
              {selectedIds.length} item dipilih
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Total Netto: <strong className="font-mono text-white text-sm ml-1">Rp {formatRupiah(totalSelectedAmount)}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-print-selected"
              onClick={() => {
                const selectedList = transactions.filter((t) => selectedIds.includes(t.id));
                handlePrintTransactions(selectedList, 'LAPORAN TRANSAKSI TERPILIH BOSP');
              }}
              className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5 text-indigo-400" />
              Print Pilihan ({selectedIds.length})
            </button>

            <button
              id="btn-clear-selected"
              onClick={() => onSelectAll([])}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
            >
              Batalkan Pilihan
            </button>

            <button
              id="btn-generate-selected-si"
              onClick={onGenerateSIForSelected}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition-all"
            >
              <FileText className="w-4 h-4 mr-1.5 text-slate-900" />
              Buat Standing Instruction ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        
        {/* TABS PEMISAH TRANSAKSI MASUK & KELUAR */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTipeFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              tipeFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Semua Transaksi</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              {typeCounts.countAll}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipeFilter('KELUAR');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              tipeFilter === 'KELUAR'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 hover:bg-rose-100'
            }`}
          >
            <span>🔴 Transaksi Keluar (Pengeluaran)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-200/70 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200">
              {typeCounts.countKeluar} | Rp {formatRupiah(typeCounts.sumKeluar)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipeFilter('MASUK');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              tipeFilter === 'MASUK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100'
            }`}
          >
            <span>🟢 Transaksi Masuk (BOSP Salur)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200">
              {typeCounts.countMasuk} | Rp {formatRupiah(typeCounts.sumMasuk)}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Penerima, No Rekening, PO, Keterangan, Vendor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Tahun</option>
              {years.map((y, idx) => (
                <option key={`yr-${y}-${idx}`} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Bulan</option>
              {months.map((m, idx) => (
                <option key={`mth-${m}-${idx}`} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Transaksi Filter */}
          <div>
            <select
              value={jenisFilter}
              onChange={(e) => {
                setJenisFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Jenis Transaksi</option>
              {jenisList.map((j, idx) => (
                <option key={`jns-${j}-${idx}`} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Line & Reset */}
        <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center font-medium">
              <Filter className="w-3.5 h-3.5 mr-1 text-indigo-500" /> Filter No. Surat:
            </span>
            <select
              value={noSuratFilter}
              onChange={(e) => {
                const selectedNoSurat = e.target.value;
                setNoSuratFilter(selectedNoSurat);
                setCurrentPage(1);
                if (selectedNoSurat !== 'ALL') {
                  onSelectGroupNoSurat(selectedNoSurat);
                } else {
                  onSelectAll([]);
                }
              }}
              className="py-1.5 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white max-w-xs truncate"
            >
              <option value="ALL">-- Semua No Surat --</option>
              {noSuratList.map((ns, idx) => (
                <option key={`ns-${ns}-${idx}`} value={ns}>
                  {ns}
                </option>
              ))}
            </select>

            {noSuratFilter !== 'ALL' && (
              <button
                id="btn-si-for-nosurat"
                onClick={() => onGenerateSIForNoSurat(noSuratFilter)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Cetak SI No. Surat Ini
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-500">
              Total Filter Netto:{' '}
              <strong className="font-mono text-slate-900 dark:text-white font-bold">
                Rp {formatRupiah(totalFilteredAmount)}
              </strong>
            </span>

            <button
              id="btn-print-filtered"
              onClick={() => handlePrintTransactions(filteredTransactions, 'LAPORAN TRANSAKSI BOSP (HASIL FILTER)')}
              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Print Hasil Filter Transaksi Ini"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
              Print Hasil Filter ({filteredTransactions.length})
            </button>

            {(searchTerm || yearFilter !== 'ALL' || monthFilter !== 'ALL' || jenisFilter !== 'ALL' || noSuratFilter !== 'ALL') && (
              <button
                id="btn-reset-filters"
                onClick={resetFilters}
                className="inline-flex items-center text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold hover:underline"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container - Bento Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5 w-12 text-center">NO</th>
                <th className="p-3.5">TANGGAL</th>
                <th className="p-3.5">JENIS TRANSAKSI</th>
                <th className="p-3.5">NO. SURAT</th>
                <th className="p-3.5">NAMA PENERIMA</th>
                <th className="p-3.5">NO. REK & BANK</th>
                <th className="p-3.5 text-right">NETTO (RP)</th>
                <th className="p-3.5">KETERANGAN / VENDOR</th>
                <th className="p-3.5 w-24 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                    Tidak ada transaksi yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                currentItems.map((tx, idx) => {
                  const isSelected = selectedIds.includes(tx.id);
                  const isMasuk =
                    tx.tipeTransaksi === 'MASUK' ||
                    String(tx.jenisTransaksi || '').toUpperCase().includes('SALUR') ||
                    String(tx.jenisTransaksi || '').toUpperCase().includes('PEMASUKAN') ||
                    tx.siplah === 'BOS SALUR';

                  return (
                    <tr
                      key={tx.id ? `tx-${tx.id}-${idx}` : `tx-row-${idx}`}
                      className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors ${
                        isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center font-mono text-slate-400">{tx.no}</td>
                      <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">{tx.tanggal}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          {isMasuk ? (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                              🟢 MASUK
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800">
                              🔴 KELUAR
                            </span>
                          )}
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                            {tx.jenisTransaksi}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {tx.noSurat || '-'}
                          </span>
                          {tx.noSurat && (
                            <button
                              onClick={() => onSelectGroupNoSurat(tx.noSurat)}
                              className="text-[9px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 hover:bg-indigo-100 px-2 py-0.5 rounded-full font-bold transition ml-1"
                              title="Pilih Semua Transaksi dengan No. Surat ini"
                            >
                              Grup
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white uppercase">
                        {tx.namaPenerima}
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-mono text-[11px]">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{tx.noRekPenerima || '-'}</div>
                        <div className="text-[10px] text-slate-400 font-sans font-bold">{tx.namaBank || 'BJB'}</div>
                      </td>
                      <td className={`p-3.5 text-right font-mono font-bold text-xs whitespace-nowrap ${
                        isMasuk ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {isMasuk ? `+ ${formatRupiah(tx.netto)}` : `${formatRupiah(tx.netto)}`}
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="line-clamp-2 text-slate-700 dark:text-slate-300 text-[11px]">
                          {tx.keterangan || tx.deskripsiFull}
                        </div>
                        {tx.vendor && tx.vendor !== 'NON SIPLAH' && (
                          <span className="text-[10px] text-slate-400 block italic mt-0.5">
                            Vendor: {tx.vendor}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDelete(tx.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Hapus Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per halaman</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="font-medium">
              Halaman {currentPage} dari {totalPages} ({filteredTransactions.length} item)
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
