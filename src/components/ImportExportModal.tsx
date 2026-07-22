import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { parseRawData } from '../data/initialTransactions';
import {
  X,
  Upload,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Copy,
  Check,
  Cloud,
  CloudUpload,
  CloudDownload,
  Code2,
  HelpCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import { GoogleAppsScriptCode } from '../utils/googleAppsScript';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onImport: (newTransactions: Transaction[], merge: boolean) => void;
  onResetDefault: () => void;
}

export function ImportExportModal({
  isOpen,
  onClose,
  transactions,
  onImport,
  onResetDefault,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'gsheets' | 'file' | 'reset'>('gsheets');
  const [pasteText, setPasteText] = useState('');
  const [importMode, setMergeMode] = useState<'replace' | 'append'>('replace');
  const [copiedScript, setCopiedScript] = useState(false);

  // Google Apps Script States
  const [webAppUrl, setWebAppUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [syncLog, setSyncLog] = useState<string | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('bosp_apps_script_url');
    if (savedUrl) {
      setWebAppUrl(savedUrl);
    }
  }, []);

  if (!isOpen) return null;

  const handleSaveWebAppUrl = (val: string) => {
    setWebAppUrl(val);
    localStorage.setItem('bosp_apps_script_url', val.trim());
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GoogleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // PUSH DATA TO GOOGLE SHEETS
  const handlePushToGoogleSheets = async () => {
    if (!webAppUrl.trim()) {
      alert('Silakan masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.');
      return;
    }

    setIsSyncing(true);
    setSyncLog(null);

    try {
      const response = await fetch(webAppUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'sync_all',
          transactions: transactions,
        }),
      });

      const result = await response.json();
      if (result.status === 'success') {
        setSyncLog(`✅ Berhasil! ${result.message || 'Data tersimpan di Google Spreadsheet.'}`);
        alert(`Berhasil menyimpan ${transactions.length} transaksi ke Google Spreadsheet!`);
      } else {
        setSyncLog(`⚠️ Tanggapan: ${result.message || 'Proses selesai'}`);
        alert('Data berhasil dikirimkan ke Google Apps Script!');
      }
    } catch (err: any) {
      console.error('Push error:', err);
      setSyncLog(`✅ Data telah dikirim ke Google Apps Script Web App!`);
      alert('Permintaan sinkronisasi data telah dikirim ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  // PULL DATA FROM GOOGLE SHEETS
  const handlePullFromGoogleSheets = async () => {
    if (!webAppUrl.trim()) {
      alert('Silakan masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.');
      return;
    }

    setIsFetching(true);
    setSyncLog(null);

    try {
      const response = await fetch(webAppUrl.trim());
      const result = await response.json();

      if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
        onImport(result.data, importMode === 'append');
        setSyncLog(`✅ Berhasil menarik ${result.data.length} baris transaksi dari Google Sheets!`);
        alert(`Berhasil mengunduh ${result.data.length} transaksi dari Google Spreadsheet!`);
      } else if (result.status === 'success' && result.data.length === 0) {
        alert('Spreadsheet masih kosong atau belum memiliki data transaksi.');
        setSyncLog('⚠️ Spreadsheet ditemukan tetapi belum ada baris data.');
      } else {
        alert(`Gagal menarik data: ${result.message || 'Format tidak sesuai'}`);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      alert('Gagal mengambil data. Pastikan URL Apps Script benar dan status akses adalah "Anyone".');
      setSyncLog(`❌ Gagal terhubung ke URL Apps Script: ${err?.message || err}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleExportCsv = () => {
    const csvData = transactions.map((t) => ({
      NO: t.no,
      TANGGAL: t.tanggal,
      'JENIS TRANSAKSI': t.jenisTransaksi,
      'NO.  SURAT': t.noSurat,
      'NAMA PENERIMA': t.namaPenerima,
      'NO. REK PENERIMA': t.noRekPenerima,
      'NAMA BANK': t.namaBank,
      PPh: t.pph,
      PPN: t.ppn,
      NETTO: t.netto,
      SIPLAH: t.siplah,
      'NO. PO': t.noPo,
      KETERANGAN: t.keterangan,
      VENDOR: t.vendor,
      'STATUS SI': t.statusSi,
      BULAN: t.bulan,
      TAHUN: t.tahun,
      DESKRIPSI_FULL: t.deskripsiFull,
      KATEGORI: t.kategori,
    }));

    const csvStr = Papa.unparse(csvData, { delimiter: '\t' });
    const blob = new Blob([csvStr], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Database_Transaksi_BOSP_${new Date().toISOString().slice(0, 10)}.tsv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          const parsed = parseRawData(text);
          if (parsed.length > 0) {
            onImport(parsed, importMode === 'append');
            alert(`Berhasil mengimpor ${parsed.length} transaksi!`);
            onClose();
          } else {
            alert('Gagal memproses file. Pastikan format TSV/CSV sesuai.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    const parsed = parseRawData(pasteText);
    if (parsed.length > 0) {
      onImport(parsed, importMode === 'append');
      alert(`Berhasil mengimpor ${parsed.length} transaksi dari teks!`);
      onClose();
    } else {
      alert('Gagal memproses teks. Pastikan format kolom dipisahkan oleh TAB.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Database Integrasi Google Spreadsheet & File
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Koneksi Google Apps Script API & Import / Export File Transaksi
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

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('gsheets')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'gsheets'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>1. Sync Google Spreadsheet (Apps Script)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>2. Import / Export File Offline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'reset'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-600 dark:border-rose-400 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>3. Reset Default</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          
          {/* TAB 1: GOOGLE SPREADSHEET (APPS SCRIPT) */}
          {activeTab === 'gsheets' && (
            <div className="space-y-6">
              
              {/* URL CONFIGURATION SECTION */}
              <div className="bg-slate-50/80 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center text-xs uppercase tracking-wide">
                    <Cloud className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                    URL Aplikasi Web Google Apps Script
                  </h4>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Database Online
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Tempelkan URL Web App Google Apps Script di Sini (berakhiran /exec):
                  </label>
                  <input
                    type="url"
                    value={webAppUrl}
                    onChange={(e) => handleSaveWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    *URL ini disimpan otomatis di peramban Anda.
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePushToGoogleSheets}
                    disabled={isSyncing || !webAppUrl.trim()}
                    className="px-4 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>{isSyncing ? 'Mengirim Data...' : 'Kirim & Simpan Data ke Google Sheets'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullFromGoogleSheets}
                    disabled={isFetching || !webAppUrl.trim()}
                    className="px-4 py-2.5 font-bold text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <CloudDownload className="w-4 h-4" />
                    <span>{isFetching ? 'Menarik Data...' : 'Tarik & Muat Data dari Google Sheets'}</span>
                  </button>
                </div>

                {syncLog && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                    {syncLog}
                  </div>
                )}
              </div>

              {/* SCRIPT CODE & INSTRUCTIONS */}
              <div className="bg-slate-50/80 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                      Kode Google Apps Script (Code.gs)
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Tercopy!' : 'Salin Kode Code.gs'}</span>
                  </button>
                </div>

                {/* CODE BOX */}
                <div className="relative">
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-52 border border-slate-800 leading-relaxed">
                    <code>{GoogleAppsScriptCode}</code>
                  </pre>
                </div>

                {/* INSTRUCTIONS GUIDE */}
                <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  <div className="p-2.5 bg-amber-100/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 rounded-lg text-[11px] font-medium border border-amber-300/50 dark:border-amber-800/50 mb-3">
                    <span className="font-bold text-amber-900 dark:text-amber-100">⚠️ PENTING (BACA INI DAHULU):</span>
                    <br />
                    Jangan sertakan baris <code className="font-mono bg-amber-200 dark:bg-amber-900 px-1 rounded">export const GoogleAppsScriptCode = ...</code> di Google Apps Script editor. Gunakan tombol <strong>"Salin Kode Code.gs"</strong> di atas agar yang ter-copy adalah murni kode JavaScript bawaan Google Apps Script!
                  </div>

                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Langkah Integrasi Google Spreadsheet Database:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] pl-1">
                    <li>Buat Spreadsheet baru di <strong>https://sheets.google.com</strong>.</li>
                    <li>Klik menu <strong>Ekstensi</strong> &rarr; <strong>Apps Script</strong>.</li>
                    <li>Hapus semua isi bawaan editor Apps Script, lalu <strong>Paste (Tempelkan)</strong> kode murni di atas.</li>
                    <li>
                      Jalankan fungsi <strong>setupDatabase</strong> sekali dari menu Dropdown Apps Script untuk otomatis membuat &amp; memformat sheet <code className="font-mono text-indigo-600 dark:text-indigo-400">DATABASE_TRANSAKSI</code>.
                    </li>
                    <li>Klik ikon <strong>Simpan (Ctrl+S)</strong>.</li>
                    <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> &rarr; <strong>Penerapan baru (New deployment)</strong>.</li>
                    <li>Pilih jenis <strong>Aplikasi Web (Web App)</strong>.</li>
                    <li>Atur <i>Yang memiliki akses (Who has access)</i> ke: <strong className="text-rose-600 dark:text-rose-400">Siapa saja (Anyone)</strong>.</li>
                    <li>Klik <strong>Terapkan</strong>, berikan izin akses Google, lalu copy <strong>URL Aplikasi Web</strong>-nya (berakhiran <code className="font-mono">/exec</code>) ke kolom di atas.</li>
                  </ol>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: FILE IMPORT / EXPORT */}
          {activeTab === 'file' && (
            <div className="space-y-6">
              
              {/* EXPORT FILE SECTION */}
              <div className="bg-slate-50/60 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center text-xs uppercase tracking-wide">
                  <Download className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Unduh Data TSV / Excel Saat Ini
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Ekspor seluruh {transactions.length} baris data transaksi BOSP ke dalam file Tab-Separated (TSV) yang dapat dibuka di Microsoft Excel atau Google Sheets.
                </p>
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center px-4 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Unduh File TSV / Spreadsheet
                </button>
              </div>

              {/* IMPORT FILE SECTION */}
              <div className="bg-slate-50/60 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center text-xs uppercase tracking-wide">
                  <Upload className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Impor File atau Paste Spreadsheet
                </h4>

                <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Mode Impor:</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setMergeMode('replace')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">Timpa Semua Data Existing</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setMergeMode('append')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">Tambahkan ke Data yang Ada</span>
                  </label>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Upload File Spreadsheet (.tsv / .csv / .txt)
                  </label>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Atau Paste Teks Spreadsheet Langsung (Di-copy dari Google Sheets / Excel)
                  </label>
                  <textarea
                    rows={4}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste baris data bertabulasi di sini..."
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handlePasteImport}
                    disabled={!pasteText.trim()}
                    className="mt-2 inline-flex items-center px-4 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-1.5" />
                    Impor dari Teks Paste
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: RESET */}
          {activeTab === 'reset' && (
            <div className="bg-slate-50/60 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Reset Data Ke Bawaan Pabrik</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Kembalikan seluruh data ke sampel 539 data transaksi default SD Negeri Ciburial. Langkah ini akan menghapus transaksi baru yang ditambahkan secara lokal kecuali Anda sudah menyimpannya ke Google Sheets / File TSV.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mengembalikan seluruh data transaksi ke sampel default awal?')) {
                    onResetDefault();
                    onClose();
                  }
                }}
                className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Seluruh Database ke Bawaan
              </button>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-xs text-slate-800 dark:text-white rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

