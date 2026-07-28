import React from 'react';
import { Lock, KeyRound, Sparkles, AlertTriangle, ShieldCheck, ArrowRight, X } from 'lucide-react';

interface DemoLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenActivation: () => void;
  currentCount: number;
  maxLimit?: number;
}

export function DemoLimitModal({
  isOpen,
  onClose,
  onOpenActivation,
  currentCount,
  maxLimit = 3,
}: DemoLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Graphic Header */}
        <div className="p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-indigo-900 text-white relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-3 text-amber-200 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1">
            Batas Versi Demo
          </span>
          <h3 className="text-xl font-extrabold text-white tracking-tight leading-tight">
            Kuota {maxLimit} Transaksi Terpakai
          </h3>
          <p className="text-xs text-amber-100 font-medium mt-1">
            Mode Demo dibatasi maksimal {maxLimit} data transaksi.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950 dark:text-amber-200">
                Akses Terbatas ({currentCount}/{maxLimit} Transaksi)
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-300/80">
                Anda telah menggunakan batas maksimal {maxLimit} transaksi dalam Mode Demo. Untuk menambah transaksi baru tanpa batas, silakan beli dan aktivasi Serial Number lisensi resmi.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider">
              Keuntungan Lisensi Penuh:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Input & Simpan Transaksi BOSP tanpa batas</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Cetak & Export Dokumen Standing Instruction BJB PDF</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Integrasi Database Cloud Google Spreadsheet & Sheet Sync</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Lisensi Permanen Sekali Beli per Perangkat/Sekolah</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenActivation();
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-xs"
            >
              <KeyRound className="w-4 h-4" />
              <span>Aktivasi Serial Number Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer text-xs"
            >
              Tutup & Lanjutkan Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
