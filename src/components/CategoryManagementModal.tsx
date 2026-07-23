import React, { useState } from 'react';
import { Transaction } from '../types';
import { X, Plus, Trash2, FolderPlus, RotateCcw, Search, CheckCircle2, AlertCircle } from 'lucide-react';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSaveCategories: (newCategories: string[]) => void;
  transactions?: Transaction[];
}

export const DEFAULT_CATEGORIES = [
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

export function CategoryManagementModal({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
  transactions = [],
}: CategoryManagementModalProps) {
  const [newCatInput, setNewCatInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Calculate usage count per category from transactions
  const usageCountMap: Record<string, number> = {};
  transactions.forEach((tx) => {
    const cat = String(tx.kategori || '').trim().toUpperCase();
    if (cat) {
      usageCountMap[cat] = (usageCountMap[cat] || 0) + 1;
    }
  });

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmed = newCatInput.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Nama kategori tidak boleh kosong.');
      return;
    }

    if (categories.some((c) => c.toUpperCase() === trimmed)) {
      setErrorMsg(`Kategori "${trimmed}" sudah ada dalam daftar.`);
      return;
    }

    const updated = [...categories, trimmed];
    onSaveCategories(updated);
    setNewCatInput('');
    setSuccessMsg(`Kategori "${trimmed}" berhasil ditambahkan.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    setErrorMsg('');
    setSuccessMsg('');

    const count = usageCountMap[catToDelete.toUpperCase()] || 0;
    const confirmText = count > 0
      ? `Kategori "${catToDelete}" digunakan oleh ${count} transaksi. Yakin ingin menghapus kategori ini dari daftar pilihan?`
      : `Yakin ingin menghapus kategori "${catToDelete}"?`;

    if (confirm(confirmText)) {
      const updated = categories.filter((c) => c !== catToDelete);
      onSaveCategories(updated);
      setSuccessMsg(`Kategori "${catToDelete}" telah dihapus.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan daftar kategori ke default standar BOSP?')) {
      const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));
      onSaveCategories(merged);
      setSuccessMsg('Daftar kategori berhasil disesuaikan dengan default standar.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kelola Kategori Transaksi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tambah atau kurangi opsi kategori belanja BOSP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Tambah Kategori Baru */}
          <form onSubmit={handleAddCategory} className="bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700/60 p-4 rounded-2xl space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-300">
              + Tambah Kategori Baru
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="Contoh: ATK KHUSUS, BEASISWA, PERALATAN OLAHRAGA..."
                className="flex-1 px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          </form>

          {/* Search & List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari kategori..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Reset ke daftar kategori standar BOSP"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Standar</span>
              </button>
            </div>

            {/* List Table/Grid */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCategories.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada kategori yang ditemukan.
                </div>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const usage = usageCountMap[cat.toUpperCase()] || 0;
                  return (
                    <div
                      key={`cat-${cat}-${idx}`}
                      className="p-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {cat}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {usage > 0 ? `Digunakan di ${usage} transaksi` : 'Belum ada transaksi'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title={`Hapus kategori ${cat}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total {categories.length} Kategori Aktif
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
