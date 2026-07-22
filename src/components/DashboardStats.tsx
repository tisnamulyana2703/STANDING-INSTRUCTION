import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatRupiah } from '../utils/terbilang';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  BarChart3,
  Database,
  Store,
  PieChart,
  Filter,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface DashboardStatsProps {
  transactions: Transaction[];
  onSelectNoSurat?: (noSurat: string) => void;
}

const INDONESIAN_MONTHS = [
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

export function DashboardStats({ transactions }: DashboardStatsProps) {
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'kategori' | 'vendor'>('kategori');

  // Extract unique years from transactions
  const availableYears = useMemo(() => {
    const list = Array.from(
      new Set(transactions.map((t) => String(t.tahun || '').trim()).filter(Boolean))
    );
    return list.sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Compute filtered stats
  const stats = useMemo(() => {
    // Filter transactions by selected year & month
    const filtered = transactions.filter((tx) => {
      if (selectedYear !== 'ALL' && String(tx.tahun || '').trim() !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && String(tx.bulan || '').trim() !== selectedMonth) return false;
      return true;
    });

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let totalCount = filtered.length;

    const catMap: Record<string, { count: number; amount: number }> = {};
    const vendorMap: Record<string, { count: number; amount: number }> = {};
    const yearMap: Record<string, { count: number; amount: number }> = {};

    filtered.forEach((tx) => {
      const jenis = String(tx.jenisTransaksi || '').toUpperCase();
      const siplah = String(tx.siplah || '').toUpperCase();
      const vendorName = String(tx.vendor || '').toUpperCase().trim();
      const tipe = tx.tipeTransaksi;

      const isPemasukan =
        tipe === 'MASUK' ||
        jenis.includes('SALUR') ||
        jenis.includes('PEMASUKAN') ||
        siplah === 'BOS SALUR' ||
        vendorName === 'BOS SALUR';

      const amount = tx.netto || 0;

      if (isPemasukan) {
        totalPemasukan += amount;
      } else {
        totalPengeluaran += amount;

        // Group expense categories for Infografis
        let cat = String(tx.kategori || '').trim().toUpperCase();
        if (!cat) cat = 'JASA KANTOR';

        if (!catMap[cat]) catMap[cat] = { count: 0, amount: 0 };
        catMap[cat].count += 1;
        catMap[cat].amount += amount;

        // Group expense vendors for Infografis
        let vName = vendorName || 'NON SIPLAH';
        if (!vendorMap[vName]) vendorMap[vName] = { count: 0, amount: 0 };
        vendorMap[vName].count += 1;
        vendorMap[vName].amount += amount;
      }

      // Group years
      const yr = String(tx.tahun || '2024').trim();
      if (!yearMap[yr]) yearMap[yr] = { count: 0, amount: 0 };
      yearMap[yr].count += 1;
      yearMap[yr].amount += amount;
    });

    const sisaSaldo = totalPemasukan - totalPengeluaran;

    // Sort categories by amount descending
    const sortedCategories = Object.entries(catMap)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.amount - a.amount);

    // Sort vendors by amount descending
    const sortedVendors = Object.entries(vendorMap)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.amount - a.amount);

    const sortedYears = Object.entries(yearMap)
      .map(([year, val]) => ({ year, ...val }))
      .sort((a, b) => b.year.localeCompare(a.year));

    return {
      totalCount,
      totalPemasukan,
      totalPengeluaran,
      sisaSaldo,
      sortedCategories,
      sortedVendors,
      sortedYears,
    };
  }, [transactions, selectedYear, selectedMonth]);

  const hasFilterActive = selectedYear !== 'ALL' || selectedMonth !== 'ALL';

  return (
    <div className="space-y-6 mb-6">
      
      {/* 1. PEMASUKAN DAN PENGELUARAN (4 BENTO CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: TOTAL PEMASUKAN */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Total Pemasukan (BOSP Salur)
            </span>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              Rp {formatRupiah(stats.totalPemasukan)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {hasFilterActive ? 'Sesuai Filter Tahun / Bulan' : 'Total Dana Salur Masuk Rekening'}
            </p>
          </div>
        </div>

        {/* Card 2: TOTAL PENGELUARAN */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider text-rose-600 dark:text-rose-400 uppercase">
              Total Pengeluaran BOSP
            </span>
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              Rp {formatRupiah(stats.totalPengeluaran)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {hasFilterActive ? 'Sesuai Filter Tahun / Bulan' : 'Akumulasi Belanja & Transaksi Out'}
            </p>
          </div>
        </div>

        {/* Card 3: SISA SALDO BOSP */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
              Sisa Saldo Kas BOSP
            </span>
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className={`text-xl sm:text-2xl font-bold font-mono ${
              stats.sisaSaldo >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              Rp {formatRupiah(stats.sisaSaldo)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {hasFilterActive ? 'Selisih Pemasukan - Pengeluaran' : 'Estimasi Sisa Saldo Tersedia'}
            </p>
          </div>
        </div>

        {/* Card 4: TOTAL DATABASE TRANSAKSI */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Total Baris Database
            </span>
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {stats.totalCount} <span className="text-xs font-sans font-normal text-slate-400">Transaksi</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {hasFilterActive ? 'Item terpilih pada filter' : 'Tersimpan dalam sistem sekolah'}
            </p>
          </div>
        </div>

      </div>

      {/* 2. INFOGRAFIS STRUKTUR PENGELUARAN & ANGGARAN (REKAP KATEGORI & VENDOR) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Infografis Header & Filters */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                  Infografis Rekap Belanja BOSP
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Analisis struktur alokasi anggaran per kategori belanja dan per vendor penyedia
                </p>
              </div>
            </div>

            {/* Controls: Filters + Tabs */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Year Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-2xl shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Tahun</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-2xl shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Bulan:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Bulan</option>
                  {INDONESIAN_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filter Button */}
              {hasFilterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedYear('ALL');
                    setSelectedMonth('ALL');
                  }}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-xs font-bold flex items-center gap-1 hover:bg-rose-100 transition-colors"
                  title="Reset Filter"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

              {/* View Switcher Tabs (Per Kategori vs Per Vendor) */}
              <div className="bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1 border border-slate-300/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('kategori')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'kategori'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Rekap Per Kategori</span>
                  <span className="ml-0.5 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-[10px] rounded-md font-mono">
                    {stats.sortedCategories.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('vendor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'vendor'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Rekap Per Vendor</span>
                  <span className="ml-0.5 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-[10px] rounded-md font-mono">
                    {stats.sortedVendors.length}
                  </span>
                </button>
              </div>

            </div>
          </div>

          {/* Filter Status Badge */}
          {hasFilterActive && (
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 px-3 py-1 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                Filter Aktif: <strong>{selectedYear !== 'ALL' ? `Tahun ${selectedYear}` : 'Semua Tahun'}</strong>
                {' • '}
                <strong>{selectedMonth !== 'ALL' ? `Bulan ${selectedMonth}` : 'Semua Bulan'}</strong>
                {' ('}
                {stats.totalCount} transaksi ditemukan
                {')'}
              </span>
            </div>
          )}
        </div>

        {/* Infografis Content Grid */}
        <div className="p-6">
          {activeTab === 'kategori' ? (
            /* TAB 1: REKAP PER KATEGORI */
            stats.sortedCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                Tidak ada data pengeluaran kategori untuk filter terpilih.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stats.sortedCategories.map((cat) => {
                  const percentage =
                    stats.totalPengeluaran > 0
                      ? Math.round((cat.amount / stats.totalPengeluaran) * 100)
                      : 0;

                  return (
                    <div
                      key={cat.name}
                      className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 leading-snug break-words flex-1">
                            {cat.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                            {percentage}%
                          </span>
                        </div>

                        <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
                          Rp {formatRupiah(cat.amount)}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                          <span>{cat.count} Transaksi</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {stats.totalPengeluaran > 0
                              ? ((cat.amount / stats.totalPengeluaran) * 100).toFixed(1)
                              : 0}
                            %
                          </span>
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* TAB 2: REKAP PER VENDOR */
            stats.sortedVendors.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                Tidak ada data transaksi vendor untuk filter terpilih.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stats.sortedVendors.map((ven) => {
                  const percentage =
                    stats.totalPengeluaran > 0
                      ? Math.round((ven.amount / stats.totalPengeluaran) * 100)
                      : 0;

                  return (
                    <div
                      key={ven.name}
                      className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 leading-snug break-words flex-1">
                            {ven.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200/50 dark:border-emerald-800/50">
                            {percentage}%
                          </span>
                        </div>

                        <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
                          Rp {formatRupiah(ven.amount)}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                          <span>{ven.count} Transaksi</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {stats.totalPengeluaran > 0
                              ? ((ven.amount / stats.totalPengeluaran) * 100).toFixed(1)
                              : 0}
                            %
                          </span>
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

      </div>

    </div>
  );
}

