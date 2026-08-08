import React, { useState } from 'react';
import { HonorRecipient } from '../types';
import { DEFAULT_HONOR_RECIPIENTS } from '../data/defaultHonorRecipients';
import { X, Save, UserCheck, Plus, Edit2, Trash2, Search, RotateCcw, Building2, CreditCard, DollarSign } from 'lucide-react';

interface HonorManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  honorRecipients: HonorRecipient[];
  onSaveHonorRecipients: (recipients: HonorRecipient[]) => void;
  onOpenBatchModal?: () => void;
}

export function HonorManagementModal({
  isOpen,
  onClose,
  honorRecipients,
  onSaveHonorRecipients,
  onOpenBatchModal,
}: HonorManagementModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<HonorRecipient>>({
    namaPenerima: '',
    jabatan: '',
    noRekPenerima: '',
    namaBank: 'BJB',
    netto: 0,
    pph: '-',
    ppn: '-',
    keteranganDefault: 'Pembayaran Honorarium Guru Bulan',
    kategoriDefault: 'JASA KANTOR',
  });

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaPenerima?.trim()) {
      alert('Nama Penerima wajib diisi!');
      return;
    }

    let updated: HonorRecipient[];
    if (editingId) {
      updated = honorRecipients.map((hr) =>
        hr.id === editingId
          ? {
              ...hr,
              namaPenerima: form.namaPenerima?.trim() || '',
              jabatan: form.jabatan?.trim() || 'Guru / Tendik',
              noRekPenerima: form.noRekPenerima?.trim() || '-',
              namaBank: form.namaBank?.trim() || 'BJB',
              netto: Number(form.netto) || 0,
              pph: form.pph?.trim() || '-',
              ppn: form.ppn?.trim() || '-',
              keteranganDefault: form.keteranganDefault?.trim() || 'Pembayaran Honorarium',
              kategoriDefault: form.kategoriDefault?.trim() || 'JASA KANTOR',
            }
          : hr
      );
    } else {
      const newHr: HonorRecipient = {
        id: `hr-${Date.now()}`,
        namaPenerima: form.namaPenerima?.trim() || '',
        jabatan: form.jabatan?.trim() || 'Guru / Tendik',
        noRekPenerima: form.noRekPenerima?.trim() || '-',
        namaBank: form.namaBank?.trim() || 'BJB',
        netto: Number(form.netto) || 0,
        pph: form.pph?.trim() || '-',
        ppn: form.ppn?.trim() || '-',
        keteranganDefault: form.keteranganDefault?.trim() || 'Pembayaran Honorarium',
        kategoriDefault: form.kategoriDefault?.trim() || 'JASA KANTOR',
      };
      updated = [newHr, ...honorRecipients];
    }

    onSaveHonorRecipients(updated);
    handleCancelEdit();
  };

  const handleEditClick = (hr: HonorRecipient) => {
    setEditingId(hr.id);
    setForm({
      namaPenerima: hr.namaPenerima || '',
      jabatan: hr.jabatan || '',
      noRekPenerima: hr.noRekPenerima || '',
      namaBank: hr.namaBank || 'BJB',
      netto: hr.netto || 0,
      pph: hr.pph || '-',
      ppn: hr.ppn || '-',
      keteranganDefault: hr.keteranganDefault || 'Pembayaran Honorarium',
      kategoriDefault: hr.kategoriDefault || 'JASA KANTOR',
    });
  };

  const handleDeleteClick = (id: string) => {
    const updated = honorRecipients.filter((hr) => hr.id !== id);
    onSaveHonorRecipients(updated);
    if (editingId === id) {
      handleCancelEdit();
    }
    setDeletingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      namaPenerima: '',
      jabatan: '',
      noRekPenerima: '',
      namaBank: 'BJB',
      netto: 0,
      pph: '-',
      ppn: '-',
      keteranganDefault: 'Pembayaran Honorarium Guru Bulan',
      kategoriDefault: 'JASA KANTOR',
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Muat ulang data sampel preset honorarium guru & tendik? Data yang ada akan dikombinasikan.')) {
      const existingNames = new Set(honorRecipients.map(r => r.namaPenerima.toLowerCase()));
      const newItems = DEFAULT_HONOR_RECIPIENTS.filter(r => !existingNames.has(r.namaPenerima.toLowerCase()));
      const merged = [...honorRecipients, ...newItems];
      onSaveHonorRecipients(merged.length > 0 ? merged : DEFAULT_HONOR_RECIPIENTS);
    }
  };

  const filtered = honorRecipients.filter(
    (hr) =>
      hr.namaPenerima.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hr.jabatan && hr.jabatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (hr.noRekPenerima && hr.noRekPenerima.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* HEADER */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/80 rounded-xl text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Master Data & Pengaturan Honorarium
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-800">
                  {honorRecipients.length} Penerima Saved
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola preset daftar Guru, Tendik, Operator & Penjaga untuk pengisian transaksi & pencatatan massal otomatis
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

        {/* CONTENT */}
        <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          
          {/* QUICK BATCH ENTRY BANNER */}
          {onOpenBatchModal && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-indigo-500/10 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-amber-200 flex items-center gap-1.5">
                  ⚡ Fitur Pencatatan Massal Honorarium
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Buat transaksi honor untuk seluruh atau sebagian penerima sekaligus dalam 1 klik!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBatchModal();
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <Plus className="w-4 h-4" />
                Input Massal Honor Guru
              </button>
            </div>
          )}

          {/* FORM TAMBAH / EDIT PENERIMA HONOR */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                {editingId ? <Edit2 className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-emerald-500" />}
                {editingId ? 'Edit Data Penerima Honor' : 'Tambah Penerima Honor / Guru / Tendik Baru'}
              </h4>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penerima Honor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: CARNIA, S.Pd"
                  value={form.namaPenerima}
                  onChange={(e) => setForm((prev) => ({ ...prev, namaPenerima: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan / Peran
                </label>
                <input
                  type="text"
                  placeholder="Misal: Guru Honorer / GTT"
                  value={form.jabatan}
                  onChange={(e) => setForm((prev) => ({ ...prev, jabatan: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Honor (Netto Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Misal: 1500000"
                  value={form.netto || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, netto: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Bank
                </label>
                <select
                  value={form.namaBank}
                  onChange={(e) => setForm((prev) => ({ ...prev, namaBank: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="BJB">BJB</option>
                  <option value="BRI">BRI</option>
                  <option value="MANDIRI">MANDIRI</option>
                  <option value="BCA">BCA</option>
                  <option value="BNI">BNI</option>
                  <option value="DANAMON">DANAMON</option>
                  <option value="BANK LAIN">BANK LAIN</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No. Rekening Penerima
                </label>
                <input
                  type="text"
                  placeholder="Misal: 3217016012710001"
                  value={form.noRekPenerima}
                  onChange={(e) => setForm((prev) => ({ ...prev, noRekPenerima: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Default
                </label>
                <input
                  type="text"
                  placeholder="Pembayaran Honorarium Guru GTT"
                  value={form.keteranganDefault}
                  onChange={(e) => setForm((prev) => ({ ...prev, keteranganDefault: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Simpan Perubahan' : 'Tambah ke Master Honor'}
                </button>
              </div>
            </form>
          </div>

          {/* LIST MASTER PENERIMA */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari penerima, jabatan, atau nomor rekening..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="Muat Sampel Data Preset Honor"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Muat Sampel Default
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Nama Penerima & Jabatan</th>
                    <th className="p-3">Bank & No. Rekening</th>
                    <th className="p-3">Nominal Honor (Netto)</th>
                    <th className="p-3">Keterangan Default</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Belum ada data penerima honor. Tambahkan di form di atas atau klik "Muat Sampel Default".
                      </td>
                    </tr>
                  ) : (
                    filtered.map((hr) => (
                      <tr key={hr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{hr.namaPenerima}</div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{hr.jabatan || 'Guru / Staff'}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                              {hr.namaBank}
                            </span>
                            <span>{hr.noRekPenerima || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rp {(hr.netto || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {hr.keteranganDefault || '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleEditClick(hr)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(hr.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            * Data master honorarium tersimpan otomatis dan siap dipakai di form transaksi
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Hapus Data Penerima Honor?</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus data penerima honor ini dari daftar master?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteClick(deletingId)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
