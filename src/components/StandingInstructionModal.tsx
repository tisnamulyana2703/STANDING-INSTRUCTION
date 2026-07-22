import React, { useState, useEffect } from 'react';
import { Transaction, SchoolSettings, StandingInstructionConfig } from '../types';
import { StandingInstructionDoc } from './StandingInstructionDoc';
import { exportToPdf, printDocument } from '../utils/pdfGenerator';
import { Download, Printer, X, Sliders, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

interface StandingInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Transaction[];
  settings: SchoolSettings;
}

export function StandingInstructionModal({
  isOpen,
  onClose,
  selectedItems,
  settings,
}: StandingInstructionModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  
  // Extract initial defaults from selected items
  const firstItem = selectedItems[0];
  const derivedNoSurat = firstItem?.noSurat || '900.3.5.5/001-SDN-CBL/I/2025';
  const derivedPurpose = firstItem?.jenisTransaksi || 'Pembayaran Honor';
  const derivedYear = firstItem?.tahun || '2026';

  const [config, setConfig] = useState<StandingInstructionConfig>({
    nomorSurat: derivedNoSurat,
    lampiran: '-',
    perihal: 'Permohonan Pemindah Bukuan',
    tujuanPenggunaan: derivedPurpose,
    tanggalSurat: firstItem?.tanggal || '22 Januari 2025',
    sumberDana: `BOSP REGULER ${derivedYear}`,
    notes: '',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 15,
    marginRight: 15,
    fontSizeScale: 'normal',
  });

  // Sync if selected items change
  useEffect(() => {
    if (selectedItems.length > 0) {
      const item = selectedItems[0];
      setConfig((prev) => ({
        ...prev,
        nomorSurat: item.noSurat || prev.nomorSurat,
        tujuanPenggunaan: item.jenisTransaksi || prev.tujuanPenggunaan,
        tanggalSurat: item.tanggal || prev.tanggalSurat,
        sumberDana: `BOSP REGULER ${item.tahun || '2026'}`,
      }));
    }
  }, [selectedItems]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const cleanSuratNum = config.nomorSurat.replace(/[\/\\]/g, '_');
      const filename = `Standing_Instruction_${cleanSuratNum}.pdf`;
      await exportToPdf('standing-instruction-document', filename, {
        marginTop: config.marginTop,
        marginBottom: config.marginBottom,
        marginLeft: config.marginLeft,
        marginRight: config.marginRight,
      });
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('Gagal mengunduh PDF. Silakan coba lagi atau gunakan tombol Cetak.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printDocument('standing-instruction-document', {
      marginTop: config.marginTop,
      marginBottom: config.marginBottom,
      marginLeft: config.marginLeft,
      marginRight: config.marginRight,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* TOP BAR */}
        <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Preview Standing Instruction
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  {selectedItems.length} Penerima
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dokumen resmi permohonan pemindahbukuan ke Bank BJB
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-print-si"
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Document
            </button>

            <button
              id="btn-download-pdf-si"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50 transition-colors"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5" />
                  Unduh PDF
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT SPLIT: LEFT FORM SETTINGS, RIGHT LIVE A4 DOCUMENT */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          
          {/* CONFIGURATION SIDEBAR - BENTO PANEL */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-fit">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pengaturan Parameter Surat
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Surat SI
                </label>
                <input
                  type="text"
                  value={config.nomorSurat}
                  onChange={(e) => setConfig({ ...config, nomorSurat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="Contoh: 900.3.5.5/001-SDN-CBL/I/2025"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Surat
                </label>
                <input
                  type="text"
                  value={config.tanggalSurat}
                  onChange={(e) => setConfig({ ...config, tanggalSurat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: 22 Januari 2025"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tujuan Penggunaan Dana
                </label>
                <input
                  type="text"
                  value={config.tujuanPenggunaan}
                  onChange={(e) => setConfig({ ...config, tujuanPenggunaan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Pembayaran Honor"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sumber Dana
                </label>
                <input
                  type="text"
                  value={config.sumberDana}
                  onChange={(e) => setConfig({ ...config, sumberDana: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: BOSP REGULER 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lampiran
                  </label>
                  <input
                    type="text"
                    value={config.lampiran}
                    onChange={(e) => setConfig({ ...config, lampiran: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Perihal
                  </label>
                  <input
                    type="text"
                    value={config.perihal}
                    onChange={(e) => setConfig({ ...config, perihal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* MARGIN & PRINT SETTINGS SECTION */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    📐 Pengaturan Margin Cetak (mm)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        marginTop: 10,
                        marginBottom: 10,
                        marginLeft: 15,
                        marginRight: 15,
                        fontSizeScale: 'normal',
                      })
                    }
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Reset Default
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Margin Atas (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={config.marginTop ?? 10}
                      onChange={(e) =>
                        setConfig({ ...config, marginTop: parseInt(e.target.value, 10) || 5 })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Margin Bawah (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={config.marginBottom ?? 10}
                      onChange={(e) =>
                        setConfig({ ...config, marginBottom: parseInt(e.target.value, 10) || 5 })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Margin Kiri (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={config.marginLeft ?? 15}
                      onChange={(e) =>
                        setConfig({ ...config, marginLeft: parseInt(e.target.value, 10) || 5 })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Margin Kanan (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={config.marginRight ?? 15}
                      onChange={(e) =>
                        setConfig({ ...config, marginRight: parseInt(e.target.value, 10) || 5 })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kepadatan Teks Dokumen
                  </label>
                  <select
                    value={config.fontSizeScale || 'normal'}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        fontSizeScale: e.target.value as 'compact' | 'normal' | 'large',
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                  >
                    <option value="compact">Ringkas (Banyak data / 1 Halaman)</option>
                    <option value="normal">Normal Standar A4</option>
                    <option value="large">Besar / Renggang</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 <strong>Info:</strong> Atur margin dan kepadatan teks agar dokumen tercetak pas dalam kertas tanpa terpotong. Data pejabat penandatangan diambil dari menu Pengaturan Sekolah.
                </p>
              </div>
            </div>
          </div>

          {/* LIVE A4 CANVAS PREVIEW */}
          <div className="lg:col-span-8 flex justify-center overflow-x-auto pb-6">
            <div className="transform scale-[0.82] sm:scale-90 origin-top shadow-xl">
              <StandingInstructionDoc
                settings={settings}
                config={config}
                items={selectedItems}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
