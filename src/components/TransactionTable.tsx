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
  Printer,
  X,
  Copy,
  AlertTriangle,
  CreditCard
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
  onDuplicate: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: () => void;
  onOpenImportExport: () => void;
  onOpenSettings: () => void;
  onOpenNonSiplahProof?: (tx?: Transaction) => void;
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
  onDuplicate,
  onDelete,
  onBulkDelete,
  onOpenImportExport,
  onOpenSettings,
  onOpenNonSiplahProof,
}: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [jenisFilter, setJenisFilter] = useState('ALL');
  const [kategoriFilter, setKategoriFilter] = useState('ALL');
  const [noSuratFilter, setNoSuratFilter] = useState('ALL');
  const [noSuratSearch, setNoSuratSearch] = useState('');
  const [tipeFilter, setTipeFilter] = useState<'ALL' | 'KELUAR' | 'MASUK'>('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Helper to detect incoming transactions
  function checkIsMasuk(tx: Transaction): boolean {
    if (tx.tipeTransaksi === 'MASUK') return true;
    if (tx.tipeTransaksi === 'KELUAR') return false;
    const jenis = String(tx.jenisTransaksi || '').toUpperCase();
    const siplah = String(tx.siplah || '').toUpperCase();
    const vendor = String(tx.vendor || '').toUpperCase().trim();
    return (
      jenis.includes('SALUR') ||
      jenis.includes('PEMASUKAN') ||
      siplah === 'BOS SALUR' ||
      vendor === 'BOS SALUR'
    );
  }

  // Filter transactions based on active dropdowns & search terms (except tipeFilter)
  const baseFilteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (yearFilter !== 'ALL' && String(tx.tahun) !== yearFilter) return false;
      if (monthFilter !== 'ALL' && String(tx.bulan) !== monthFilter) return false;
      if (jenisFilter !== 'ALL' && String(tx.jenisTransaksi) !== jenisFilter) return false;
      if (kategoriFilter !== 'ALL' && String(tx.kategori || '').trim().toUpperCase() !== kategoriFilter.trim().toUpperCase()) return false;
      if (noSuratFilter !== 'ALL' && String(tx.noSurat) !== noSuratFilter) return false;
      if (noSuratSearch.trim() && !String(tx.noSurat || '').toLowerCase().includes(noSuratSearch.trim().toLowerCase())) return false;

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
  }, [transactions, yearFilter, monthFilter, jenisFilter, kategoriFilter, noSuratFilter, noSuratSearch, searchTerm]);

  // Compute counts and sums for Masuk vs Keluar on the current filtered dataset
  const filteredStats = useMemo(() => {
    let countMasuk = 0;
    let sumMasuk = 0;
    let countKeluar = 0;
    let sumKeluar = 0;

    baseFilteredTransactions.forEach((tx) => {
      const isMasuk = checkIsMasuk(tx);
      const amount = Number(tx.netto) || 0;
      if (isMasuk) {
        countMasuk += 1;
        sumMasuk += amount;
      } else {
        countKeluar += 1;
        sumKeluar += amount;
      }
    });

    return {
      countMasuk,
      sumMasuk,
      countKeluar,
      sumKeluar,
      countAll: baseFilteredTransactions.length,
      sisaSaldo: sumMasuk - sumKeluar,
    };
  }, [baseFilteredTransactions]);

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

  const kategoriList = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => String(t.kategori || '').trim()).filter(Boolean))).sort();
  }, [transactions]);

  const noSuratList = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => String(t.noSurat || '')).filter(Boolean))).sort();
  }, [transactions]);

  const filteredNoSuratList = useMemo(() => {
    if (!noSuratSearch.trim()) return noSuratList;
    const q = noSuratSearch.toLowerCase().trim();
    return noSuratList.filter((ns) => ns.toLowerCase().includes(q));
  }, [noSuratList, noSuratSearch]);

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

  // Final filtered & sorted transactions list (incorporating tipeFilter)
  const filteredTransactions = useMemo(() => {
    const list = baseFilteredTransactions.filter((tx) => {
      const isMasuk = checkIsMasuk(tx);
      if (tipeFilter === 'MASUK' && !isMasuk) return false;
      if (tipeFilter === 'KELUAR' && isMasuk) return false;
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
  }, [baseFilteredTransactions, tipeFilter]);

  // Count missing No. Rekening transactions for warning banner
  const missingNoRekCount = useMemo(() => {
    return filteredTransactions.filter((tx) => {
      const noRek = (tx.noRekPenerima || '').trim();
      return !noRek || noRek === '-';
    }).length;
  }, [filteredTransactions]);

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

  const resetFilters = () => {
    setSearchTerm('');
    setYearFilter('ALL');
    setMonthFilter('ALL');
    setJenisFilter('ALL');
    setKategoriFilter('ALL');
    setNoSuratFilter('ALL');
    setNoSuratSearch('');
    setTipeFilter('ALL');
    setCurrentPage(1);
  };

  const handlePrintTransactions = (itemsToPrint: Transaction[], title: string = 'LAPORAN DATABASE TRANSAKSI BOSP') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // If user has selected items and triggers a general print, default to printing selected items
    const selectedItemsList = transactions.filter((t) => selectedIds.includes(t.id) || selectedIds.includes(String(t.id)));
    const targetItems = (selectedIds.length > 0 && itemsToPrint === filteredTransactions) ? selectedItemsList : itemsToPrint;
    const targetTitle = (selectedIds.length > 0 && itemsToPrint === filteredTransactions) ? 'LAPORAN TRANSAKSI TERPILIH BOSP' : title;

    // Calculate incoming vs outgoing for print targets
    let printMasuk = 0;
    let printKeluar = 0;
    let countMasuk = 0;
    let countKeluar = 0;

    targetItems.forEach((tx) => {
      const isMasuk = checkIsMasuk(tx);
      const val = Number(tx.netto) || 0;
      if (isMasuk) {
        countMasuk++;
        printMasuk += val;
      } else {
        countKeluar++;
        printKeluar += val;
      }
    });

    const printSisaSaldo = printMasuk - printKeluar;

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
        (tx, idx) => {
          const isMasuk = checkIsMasuk(tx);
          const bgStyle = idx % 2 === 1 ? 'background-color: #f8fafc;' : '';
          const isMasukBadge = isMasuk
            ? '<span style="font-size: 9px; padding: 1px 5px; background-color: #dcfce7; color: #15803d; border-radius: 4px; font-weight: bold; margin-left: 4px;">MASUK</span>'
            : '';
          const textColor = isMasuk ? 'color: #16a34a;' : 'color: #0f172a;';

          return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${bgStyle}">
        <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px 8px; text-align: center; font-size: 10px;">${tx.tanggal || '-'}</td>
        <td style="padding: 6px 8px;">
          <div style="font-weight: 600; color: #0f172a;">${tx.jenisTransaksi || '-'}${isMasukBadge}</div>
          <div style="font-size: 10px; color: #64748b;">${tx.kategori || ''} ${tx.siplah ? `• ${tx.siplah}` : ''}</div>
        </td>
        <td style="padding: 6px 8px;">
          <div style="font-weight: 600;">${tx.namaPenerima || '-'}</div>
          <div style="font-size: 10px; color: #64748b;">Bank: ${tx.namaBank || 'BJB'} (${tx.noRekPenerima || '-'})</div>
        </td>
        <td style="padding: 6px 8px; font-size: 10px; font-family: monospace;">${tx.noSurat || '-'}</td>
        <td style="padding: 6px 8px;">${tx.keterangan || '-'}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 700; font-family: monospace; ${textColor}">
          ${isMasuk ? '+' : ''}Rp ${formatRupiah(tx.netto)}
        </td>
      </tr>
    `;
        }
      )
      .join('');

    let metaTotalHtml = '';
    let summaryRowsHtml = '';

    if (countMasuk > 0 && countKeluar > 0) {
      metaTotalHtml = `
        <div>
          <span>Pengeluaran: <strong style="font-family: monospace;">Rp ${formatRupiah(printKeluar)}</strong></span>
          <span style="margin-left: 8px; border-left: 1px solid #cbd5e1; padding-left: 8px;">
            Saldo: <strong style="font-family: monospace; color: ${printSisaSaldo >= 0 ? '#16a34a' : '#dc2626'};">Rp ${formatRupiah(printSisaSaldo)}</strong>
          </span>
        </div>
      `;
      summaryRowsHtml = `
        <tr>
          <td><strong>Total Items:</strong></td>
          <td class="right">${targetItems.length} Item (${countMasuk} Masuk, ${countKeluar} Keluar)</td>
        </tr>
        <tr>
          <td><strong>Total Pemasukan (BOS Salur):</strong></td>
          <td class="right" style="font-family: monospace; color: #16a34a; font-weight: 600;">Rp ${formatRupiah(printMasuk)}</td>
        </tr>
        <tr>
          <td><strong>Total Pengeluaran:</strong></td>
          <td class="right" style="font-family: monospace; color: #dc2626; font-weight: 600;">Rp ${formatRupiah(printKeluar)}</td>
        </tr>
        <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
          <td><strong>SISA SALDO BOSP:</strong></td>
          <td class="right" style="font-family: monospace; font-size: 13px; color: ${printSisaSaldo >= 0 ? '#0f172a' : '#dc2626'};">Rp ${formatRupiah(printSisaSaldo)}</td>
        </tr>
      `;
    } else if (countMasuk > 0) {
      metaTotalHtml = `<div><strong>Total Pemasukan:</strong> <span style="font-family: monospace; font-size: 13px; color: #16a34a;">Rp ${formatRupiah(printMasuk)}</span></div>`;
      summaryRowsHtml = `
        <tr>
          <td><strong>Total Transaksi:</strong></td>
          <td class="right">${targetItems.length} Item</td>
        </tr>
        <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
          <td><strong>TOTAL PEMASUKAN:</strong></td>
          <td class="right" style="font-family: monospace; font-size: 13px; color: #16a34a;">Rp ${formatRupiah(printMasuk)}</td>
        </tr>
      `;
    } else {
      metaTotalHtml = `<div><strong>Total Pengeluaran:</strong> <span style="font-family: monospace; font-size: 13px;">Rp ${formatRupiah(printKeluar)}</span></div>`;
      summaryRowsHtml = `
        <tr>
          <td><strong>Total Transaksi:</strong></td>
          <td class="right">${targetItems.length} Item</td>
        </tr>
        <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
          <td><strong>TOTAL PENGELUARAN:</strong></td>
          <td class="right" style="font-family: monospace; font-size: 13px; color: #0f172a;">Rp ${formatRupiah(printKeluar)}</td>
        </tr>
      `;
    }

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
            ${metaTotalHtml}
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
              ${summaryRowsHtml}
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
    <div id="database-transaksi-bosp" className="space-y-6">
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
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tipeFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Semua Transaksi</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              {filteredStats.countAll}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipeFilter('KELUAR');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tipeFilter === 'KELUAR'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 hover:bg-rose-100'
            }`}
          >
            <span>🔴 Transaksi Keluar (Pengeluaran)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-200/70 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200">
              {filteredStats.countKeluar} | Rp {formatRupiah(filteredStats.sumKeluar)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipeFilter('MASUK');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tipeFilter === 'MASUK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100'
            }`}
          >
            <span>🟢 Transaksi Masuk (BOSP Salur)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200">
              {filteredStats.countMasuk} | Rp {formatRupiah(filteredStats.sumMasuk)}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
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
              className="w-full py-2.5 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
              className="w-full py-2.5 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
              className="w-full py-2.5 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">Semua Jenis</option>
              {jenisList.map((j, idx) => (
                <option key={`jns-${j}-${idx}`} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Filter */}
          <div>
            <select
              value={kategoriFilter}
              onChange={(e) => {
                setKategoriFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">Semua Kategori</option>
              {kategoriList.map((k, idx) => (
                <option key={`ktg-${k}-${idx}`} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Line & Reset */}
        <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center font-medium shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1 text-indigo-500" /> Filter No. Surat:
            </span>

            {/* Input Pencarian Khusus No. Surat */}
            <div className="relative flex items-center min-w-[170px] sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari No. Surat..."
                value={noSuratSearch}
                onChange={(e) => {
                  setNoSuratSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {noSuratSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setNoSuratSearch('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                  title="Hapus pencarian No. Surat"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Select Dropdown No Surat */}
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
              className="py-1.5 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white max-w-xs truncate font-medium"
            >
              <option value="ALL">
                {noSuratSearch ? `-- Hasil Cari (${filteredNoSuratList.length}) --` : `-- Semua No Surat (${noSuratList.length}) --`}
              </option>
              {filteredNoSuratList.map((ns, idx) => (
                <option key={`ns-${ns}-${idx}`} value={ns}>
                  {ns}
                </option>
              ))}
            </select>

            {noSuratFilter !== 'ALL' && (
              <button
                id="btn-si-for-nosurat"
                onClick={() => onGenerateSIForNoSurat(noSuratFilter)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors shrink-0"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Cetak SI No. Surat Ini
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              {tipeFilter === 'MASUK' ? (
                <>
                  <span>Total Netto Pemasukan:</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    Rp {formatRupiah(filteredStats.sumMasuk)}
                  </strong>
                </>
              ) : tipeFilter === 'KELUAR' ? (
                <>
                  <span>Total Netto Pengeluaran:</span>
                  <strong className="font-mono text-slate-900 dark:text-white font-bold">
                    Rp {formatRupiah(filteredStats.sumKeluar)}
                  </strong>
                </>
              ) : filteredStats.countMasuk > 0 && filteredStats.countKeluar > 0 ? (
                <>
                  <span>Pengeluaran:</span>
                  <strong className="font-mono text-slate-900 dark:text-white font-bold mr-1">
                    Rp {formatRupiah(filteredStats.sumKeluar)}
                  </strong>
                  <span>| Saldo:</span>
                  <strong className={`font-mono font-bold ${
                    filteredStats.sisaSaldo >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    Rp {formatRupiah(filteredStats.sisaSaldo)}
                  </strong>
                </>
              ) : filteredStats.countMasuk > 0 ? (
                <>
                  <span>Total Netto Pemasukan:</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    Rp {formatRupiah(filteredStats.sumMasuk)}
                  </strong>
                </>
              ) : (
                <>
                  <span>Total Netto Pengeluaran:</span>
                  <strong className="font-mono text-slate-900 dark:text-white font-bold">
                    Rp {formatRupiah(filteredStats.sumKeluar)}
                  </strong>
                </>
              )}
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

            {(searchTerm || noSuratSearch || yearFilter !== 'ALL' || monthFilter !== 'ALL' || jenisFilter !== 'ALL' || kategoriFilter !== 'ALL' || noSuratFilter !== 'ALL' || tipeFilter !== 'ALL') && (
              <button
                id="btn-reset-filters"
                onClick={resetFilters}
                className="inline-flex items-center text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Items Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2 text-xs font-bold">
            <CheckSquare className="w-4 h-4 text-indigo-200" />
            <span>{selectedIds.length} transaksi terpilih</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold">
            {onBulkDelete && (
              <button
                onClick={onBulkDelete}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-2xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => onSelectAll([])}
              className="px-2.5 py-1.5 text-indigo-200 hover:text-white transition-colors"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* WARNING BANNER FOR MISSING NO REKENING */}
      {missingNoRekCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-2 border-amber-400 dark:border-amber-700 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl font-bold shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                ⚠️ INFORMASI KELENGKAPAN REKENING PENERIMA
              </h4>
              <p className="text-amber-900 dark:text-amber-200 font-semibold mt-0.5">
                Terdapat <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md font-black font-mono border border-amber-300 dark:border-amber-800">{missingNoRekCount} transaksi</span> yang Nomor Rekeningnya masih kosong. Transaksi tersimpan dengan aman, namun <strong className="text-rose-600 dark:text-rose-400">belum bisa dicetak (Surat Standing Instruction BJB)</strong> sebelum No. Rekening dilengkapi melalui tombol Edit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Container - Bento Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-2.5 py-3 w-9 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAllPageSelected) {
                        onSelectAll(selectedIds.filter((id) => !pageIds.includes(id)));
                      } else {
                        onSelectAll(Array.from(new Set([...selectedIds, ...pageIds])));
                      }
                    }}
                    className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                    title={isAllPageSelected ? 'Batal pilih halaman ini' : 'Pilih semua di halaman ini'}
                  >
                    {isAllPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-2 py-3 w-10 text-center">NO</th>
                <th className="px-2.5 py-3 whitespace-nowrap">TANGGAL</th>
                <th className="px-2.5 py-3 whitespace-nowrap">JENIS TRANSAKSI</th>
                <th className="px-2.5 py-3 whitespace-nowrap">NO. SURAT</th>
                <th className="px-2.5 py-3 min-w-[140px]">NAMA PENERIMA</th>
                <th className="px-2.5 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800 font-bold">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    NO. REK & BANK
                  </span>
                </th>
                <th className="px-2.5 py-3 text-right whitespace-nowrap">NETTO (RP)</th>
                <th className="px-2.5 py-3 min-w-[160px] max-w-xs">KETERANGAN / VENDOR</th>
                <th className="px-2.5 py-3 w-20 text-center whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                    Tidak ada transaksi yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                currentItems.map((tx, idx) => {
                  const txIdStr = String(tx.id || tx.no);
                  const isSelected = selectedIds.includes(txIdStr) || selectedIds.includes(tx.id as any);
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
                      <td className="px-2.5 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleSelect(txIdStr)}
                          className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-2 py-2.5 text-center font-mono text-slate-400 text-[11px]">{tx.no}</td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">{tx.tanggal}</td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-0.5">
                          {isMasuk ? (
                            <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                              🟢 MASUK
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800">
                              🔴 KELUAR
                            </span>
                          )}
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                            {tx.jenisTransaksi}
                          </span>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {tx.noSurat || '-'}
                          </span>
                          {tx.noSurat && (
                            <button
                              onClick={() => onSelectGroupNoSurat(tx.noSurat)}
                              className="text-[9px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 hover:bg-indigo-100 px-1.5 py-0.5 rounded-full font-bold transition ml-1"
                              title="Pilih Semua Transaksi dengan No. Surat ini"
                            >
                              Grup
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 font-bold text-slate-900 dark:text-white uppercase text-[11px] min-w-[140px] max-w-[200px] break-words">
                        {tx.namaPenerima}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap font-mono text-[11px]">
                        {(() => {
                          const noRekStr = (tx.noRekPenerima || '').trim();
                          const isMissing = !noRekStr || noRekStr === '-';
                          if (isMissing) {
                            return (
                              <button
                                type="button"
                                onClick={() => onEdit(tx)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs hover:bg-amber-200 dark:hover:bg-amber-900 transition-all cursor-pointer"
                                title="Klik untuk melengkapi Nomor Rekening"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>⚠️ KOSONG (EDIT)</span>
                              </button>
                            );
                          }
                          return (
                            <div className="inline-flex flex-col bg-amber-500/10 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 rounded-xl px-2 py-0.5 shadow-2xs">
                              <div className="font-mono text-[11px] font-black text-amber-950 dark:text-amber-200 tracking-wide flex items-center gap-1">
                                <CreditCard className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>{noRekStr}</span>
                              </div>
                              <div className="text-[9px] text-amber-800 dark:text-amber-400 font-sans font-bold">
                                🏦 {tx.namaBank || 'BJB'}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className={`px-2.5 py-2.5 text-right font-mono font-bold text-xs whitespace-nowrap ${
                        isMasuk ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {isMasuk ? `+ ${formatRupiah(tx.netto)}` : `${formatRupiah(tx.netto)}`}
                      </td>
                      <td className="px-2.5 py-2.5 min-w-[150px] max-w-xs">
                        <div className="line-clamp-2 text-slate-700 dark:text-slate-300 text-[11px]">
                          {tx.keterangan || tx.deskripsiFull}
                        </div>
                        {tx.vendor && tx.vendor !== 'NON SIPLAH' && (
                          <span className="text-[9px] text-slate-400 block italic mt-0.5">
                            Vendor: {tx.vendor}
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicate(tx)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                            title="Duplikat Transaksi (Tanggal & No. Surat Sama)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDelete(String(tx.id || tx.no))}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
