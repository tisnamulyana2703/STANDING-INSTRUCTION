import React, { useState } from 'react';
import { Transaction, HonorRecipient, SchoolSettings } from '../types';
import { X, Save, UserCheck, CheckSquare, Square, Sparkles, AlertCircle, FileText, Calendar } from 'lucide-react';

interface BatchHonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  honorRecipients: HonorRecipient[];
  schoolSettings: SchoolSettings;
  nextNo: number;
  onSaveBatchTransactions: (txs: Transaction[]) => void;
  onOpenHonorSettings?: () => void;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function BatchHonorModal({
  isOpen,
  onClose,
  honorRecipients,
  schoolSettings,
  nextNo,
  onSaveBatchTransactions,
  onOpenHonorSettings,
}: BatchHonorModalProps) {
  const currentYear = `${new Date().getFullYear()}`;
  const todayIso = new Date().toISOString().split('T')[0];

  const [selectedIds, setSelectedIds] = useState<string[]>(() => honorRecipients.map((r) => r.id));
  const [bulan, setBulan] = useState('Januari');
  const [tahun, setTahun] = useState(currentYear);
  const [dateIso, setDateIso] = useState(todayIso);
  const [noSurat, setNoSurat] = useState(`900.3.5.5/001-SDN-CBL/I/${currentYear}`);
  const [jenisTransaksi, setJenisTransaksi] = useState('Pembayaran Honor');

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectedIds.length === honorRecipients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(honorRecipients.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  function isoToDmy(iso: string): string {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return iso;
  }

  const handleGenerateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('Pilih setidaknya satu penerima honor!');
      return;
    }

    const selectedRecipients = honorRecipients.filter((r) => selectedIds.includes(r.id));
    const formattedDate = isoToDmy(dateIso);

    const generatedTxs: Transaction[] = selectedRecipients.map((rec, idx) => {
      const txNo = nextNo + idx;
      const keteranganText = rec.keteranganDefault && rec.keteranganDefault.trim()
        ? `${rec.keteranganDefault.trim()} Bulan ${bulan} ${tahun}`
        : `Pembayaran Honorarium ${rec.namaPenerima} Bulan ${bulan} ${tahun}`;

      return {
        id: `tx-batch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        no: txNo,
        tanggal: formattedDate,
        tipeTransaksi: 'KELUAR',
        jenisTransaksi: jenisTransaksi || 'Pembayaran Honor',
        noSurat: noSurat || '',
        namaPenerima: rec.namaPenerima,
        noRekPenerima: rec.noRekPenerima || '-',
        namaBank: rec.namaBank || 'BJB',
        pph: rec.pph || '-',
        ppn: rec.ppn || '-',
        netto: Number(rec.netto) || 0,
        siplah: 'Non Siplah',
        noPo: '',
        keterangan: keteranganText,
        vendor: 'NON SIPLAH',
        vendorAddress: '-',
        vendorHp: '-',
        vendorNpwp: '-',
        statusSi: 'SUDAH',
        bulan: bulan,
        tahun: tahun,
        deskripsiFull: `${jenisTransaksi} ${keteranganText}`,
        kategori: rec.kategoriDefault || 'JASA KANTOR',
      };
    });

    onSaveBatchTransactions(generatedTxs);
    onClose();
  };

  const selectedRecipients = honorRecipients.filter((r) => selectedIds.includes(r.id));
  const totalNominal = selectedRecipients.reduce((sum, r) => sum + (r.netto || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* HEADER */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/80 rounded-xl text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Pencatatan Massal Honorarium Guru & Tendik
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-800">
                  {selectedIds.length} Terpilih
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih penerima honor dan buat seluruh transaksi bulanan secara otomatis sekaligus
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

        {/* CONTENT FORM */}
        <form onSubmit={handleGenerateBatch} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          
          {/* CONFIGURATION ROW */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" /> Pengaturan Transaksi Massal
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bulan
                </label>
                <select
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {INDONESIAN_MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tahun
                </label>
                <input
                  type="text"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={dateIso}
                  onChange={(e) => setDateIso(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No. Surat SI
                </label>
                <input
                  type="text"
                  placeholder="Misal: 900.3.5.5/001..."
                  value={noSurat}
                  onChange={(e) => setNoSurat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* RECIPIENT SELECTION TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {selectedIds.length === honorRecipients.length ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-amber-500" /> Batal Pilih Semua
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" /> Pilih Semua ({honorRecipients.length})
                    </>
                  )}
                </button>
              </div>

              {onOpenHonorSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenHonorSettings();
                  }}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ⚙️ Kelola Master Honor
                </button>
              )}
            </div>

            {honorRecipients.length === 0 ? (
              <div className="p-8 text-center bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Belum ada Master Penerima Honor</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Tambahkan daftar guru/tendik di menu Master Honorarium terlebih dahulu.
                </p>
                {onOpenHonorSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenHonorSettings();
                    }}
                    className="mt-2 px-4 py-2 font-bold text-xs bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    Tambah Master Honor Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 w-10 text-center">Pilih</th>
                      <th className="p-3">Nama Penerima & Jabatan</th>
                      <th className="p-3">Bank & No. Rekening</th>
                      <th className="p-3">Nominal Honor</th>
                      <th className="p-3">Keterangan yang Akan Dihasilkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {honorRecipients.map((rec) => {
                      const isSelected = selectedIds.includes(rec.id);
                      return (
                        <tr
                          key={rec.id}
                          onClick={() => toggleSelect(rec.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-50/60 dark:bg-amber-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by row click
                              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white">{rec.namaPenerima}</div>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{rec.jabatan || 'Guru / Staff'}</div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold mr-1 border border-slate-200 dark:border-slate-700">
                              {rec.namaBank}
                            </span>
                            {rec.noRekPenerima || '-'}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Rp {(rec.netto || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 italic">
                            {rec.keteranganDefault?.trim()
                              ? `${rec.keteranganDefault.trim()} Bulan ${bulan} ${tahun}`
                              : `Pembayaran Honorarium ${rec.namaPenerima} Bulan ${bulan} ${tahun}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SUMMARY BAR */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Total {selectedIds.length} Transaksi Ditambahkan:</span>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                Rp {totalNominal.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-bold text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={selectedIds.length === 0}
                className={`px-5 py-2 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedIds.length > 0
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Generate {selectedIds.length} Transaksi Honor Sekaligus
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
