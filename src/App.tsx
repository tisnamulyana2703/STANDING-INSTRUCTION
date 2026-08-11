import React, { useState, useEffect } from 'react';
import { Transaction, SchoolSettings, Vendor, HonorRecipient, RincianBelanjaItem } from './types';
import { INITIAL_TRANSACTIONS } from './data/initialTransactions';
import { DEFAULT_SCHOOL_SETTINGS } from './data/defaultSettings';
import { DEFAULT_VENDORS } from './data/defaultVendors';
import { DEFAULT_HONOR_RECIPIENTS } from './data/defaultHonorRecipients';
import { DEFAULT_RINCIAN_BELANJA } from './data/rincianBelanjaData';
import { TransactionTable } from './components/TransactionTable';
import { StandingInstructionModal } from './components/StandingInstructionModal';
import { AddEditTransactionModal } from './components/AddEditTransactionModal';
import { SchoolSettingsModal } from './components/SchoolSettingsModal';
import { CategoryManagementModal, DEFAULT_CATEGORIES } from './components/CategoryManagementModal';
import { HonorManagementModal } from './components/HonorManagementModal';
import { BatchHonorModal } from './components/BatchHonorModal';
import { ImportExportModal } from './components/ImportExportModal';
import { NonSiplahProofModal } from './components/NonSiplahProofModal';
import { PlanningDocModal } from './components/PlanningDocModal';
import { RincianBelanjaModal } from './components/RincianBelanjaModal';
import { ActivationModal } from './components/ActivationModal';
import { DemoLimitModal } from './components/DemoLimitModal';
import { getStoredLicenseInfo, verifySerialNumber, getMachineId } from './utils/licenseUtils';
import { DashboardStats } from './components/DashboardStats';
import { LogoBandungBarat, LogoTutWuri } from './components/Logos';
import { Sun, Moon, Settings, Store, Cloud, KeyRound, ShieldCheck, Sparkles, UserCheck, FileSpreadsheet, Database, Plus, FileText, ClipboardList, Receipt } from 'lucide-react';
import { sanitizeSchoolSettingsForSync, ensureTransactionIds, getNextTransactionNo, renumberTransactionsSequentially } from './utils/googleAppsScript';

const MAX_DEMO_TRANSACTIONS = 3;

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Local Storage initialized state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bosp_transactions_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return ensureTransactionIds(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved transactions:', e);
      }
    }
    return [];
  });

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    const saved = localStorage.getItem('bosp_school_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse school settings:', e);
      }
    }
    return DEFAULT_SCHOOL_SETTINGS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('bosp_vendors_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse vendors:', e);
      }
    }
    return DEFAULT_VENDORS;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('bosp_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse categories:', e);
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const [honorRecipients, setHonorRecipients] = useState<HonorRecipient[]>(() => {
    const saved = localStorage.getItem('bosp_honor_recipients_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse honor recipients:', e);
      }
    }
    return DEFAULT_HONOR_RECIPIENTS;
  });

  const [rincianList, setRincianList] = useState<RincianBelanjaItem[]>(() => {
    const saved = localStorage.getItem('bosp_rincian_belanja_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse rincian belanja:', e);
      }
    }
    return DEFAULT_RINCIAN_BELANJA;
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // License Activation State
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    const info = getStoredLicenseInfo();
    const mid = getMachineId(schoolSettings?.namaSekolah || DEFAULT_SCHOOL_SETTINGS.namaSekolah, schoolSettings?.alamatSekolah || DEFAULT_SCHOOL_SETTINGS.alamatSekolah);
    return info.isActivated && verifySerialNumber(info.serialKey, mid);
  });
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isDemoLimitModalOpen, setIsDemoLimitModalOpen] = useState(false);

  // Modal States
  const [isSiModalOpen, setIsSiModalOpen] = useState(false);
  const [isNonSiplahModalOpen, setIsNonSiplahModalOpen] = useState(false);
  const [nonSiplahTargetTx, setNonSiplahTargetTx] = useState<Transaction[]>([]);
  const [isPlanningDocModalOpen, setIsPlanningDocModalOpen] = useState(false);
  const [planningDocTargetTx, setPlanningDocTargetTx] = useState<Transaction[]>([]);
  const [isRincianModalOpen, setIsRincianModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isHonorSettingsModalOpen, setIsHonorSettingsModalOpen] = useState(false);
  const [isBatchHonorModalOpen, setIsBatchHonorModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'school' | 'vendors' | 'categories'>('school');
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('bosp_transactions_db', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bosp_rincian_belanja_db', JSON.stringify(rincianList));
  }, [rincianList]);

  useEffect(() => {
    localStorage.setItem('bosp_school_settings', JSON.stringify(schoolSettings));
  }, [schoolSettings]);

  useEffect(() => {
    localStorage.setItem('bosp_vendors_db', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('bosp_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('bosp_honor_recipients_db', JSON.stringify(honorRecipients));
  }, [honorRecipients]);

  // Helper to push to Google Sheets automatically if URL exists
  const syncToGoogleSheets = async (
    txList: Transaction[],
    settings: SchoolSettings,
    vendorList: Vendor[],
    customRincian?: RincianBelanjaItem[]
  ) => {
    const scriptUrl = localStorage.getItem('bosp_apps_script_url');
    if (!scriptUrl) return;
    try {
      await fetch(scriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync_all',
          transactions: txList,
          schoolSettings: sanitizeSchoolSettingsForSync(settings),
          vendors: vendorList,
          rincianBelanja: customRincian || rincianList,
        }),
      });
    } catch (e) {
      console.warn('Background sync to Google Sheets warning:', e);
    }
  };

  // Auto pull from Google Sheets on app startup if URL is configured
  useEffect(() => {
    const scriptUrl = localStorage.getItem('bosp_apps_script_url');
    if (!scriptUrl) return;

    fetch(scriptUrl.trim())
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success') {
          // 1. Transactions
          const txList = Array.isArray(result.transactions)
            ? result.transactions
            : Array.isArray(result.data)
            ? result.data
            : [];
          if (txList.length > 0) {
            setTransactions(ensureTransactionIds(txList));
          }

          // 2. School Settings
          if (
            result.schoolSettings &&
            typeof result.schoolSettings === 'object' &&
            Object.keys(result.schoolSettings).length > 0
          ) {
            setSchoolSettings(result.schoolSettings);
          }

          // 3. Vendors
          if (Array.isArray(result.vendors) && result.vendors.length > 0) {
            setVendors(result.vendors);
          }

          // 4. Rincian Belanja
          if (Array.isArray(result.rincianBelanja) && result.rincianBelanja.length > 0) {
            setRincianList(result.rincianBelanja);
          }
        }
      })
      .catch((err) => {
        console.warn('Startup fetch from Google Sheets warning:', err);
      });
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Handlers for transaction selection
  const handleToggleSelect = (id: string | number) => {
    const strId = String(id);
    setSelectedIds((prev) =>
      prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId]
    );
  };

  const handleSelectAll = (ids: (string | number)[]) => {
    setSelectedIds(ids.map(String));
  };

  const handleSelectGroupNoSurat = (noSurat: string) => {
    const target = String(noSurat || '').trim();
    if (!target || target === 'ALL') return;
    const matches = transactions
      .filter((t) => String(t.noSurat || '').trim().toLowerCase() === target.toLowerCase())
      .map((t) => String(t.id));
    setSelectedIds(matches);
  };

  const handleGenerateSIForNoSurat = (noSurat: string) => {
    handleSelectGroupNoSurat(noSurat);
    setIsSiModalOpen(true);
  };

  const handleGenerateSIForSelected = () => {
    if (selectedIds.length === 0) {
      alert('Pilih minimal 1 data transaksi terlebih dahulu.');
      return;
    }
    setIsSiModalOpen(true);
  };

  const handleOpenNonSiplahProof = (targetTx?: Transaction) => {
    if (targetTx) {
      setNonSiplahTargetTx([targetTx]);
    } else if (selectedIds.length > 0) {
      const selectedList = transactions.filter(
        (t) => selectedIds.includes(String(t.id)) || selectedIds.includes(String(t.no))
      );
      if (selectedList.length > 0) {
        setNonSiplahTargetTx(selectedList);
      } else {
        setNonSiplahTargetTx(transactions);
      }
    } else {
      const nonSiplahList = transactions.filter(
        (t) =>
          t.siplah === 'Non Siplah' ||
          t.siplah === 'NON SIPLAH' ||
          t.vendor === 'NON SIPLAH' ||
          (t.vendor || '').toUpperCase().includes('NON')
      );
      setNonSiplahTargetTx(nonSiplahList.length > 0 ? nonSiplahList : transactions);
    }
    setIsNonSiplahModalOpen(true);
  };

  const handleOpenPlanningDoc = (targetTx?: Transaction) => {
    if (targetTx) {
      setPlanningDocTargetTx([targetTx]);
    } else if (selectedIds.length > 0) {
      const selectedList = transactions.filter(
        (t) => selectedIds.includes(String(t.id)) || selectedIds.includes(String(t.no))
      );
      const outgoingSelected = selectedList.filter((t) => !t.tipeTransaksi || t.tipeTransaksi === 'KELUAR');
      setPlanningDocTargetTx(outgoingSelected.length > 0 ? outgoingSelected : selectedList);
    } else {
      const outgoing = transactions.filter((t) => !t.tipeTransaksi || t.tipeTransaksi === 'KELUAR');
      setPlanningDocTargetTx(outgoing.length > 0 ? outgoing : transactions);
    }
    setIsPlanningDocModalOpen(true);
  };

  const handleAddNewTransaction = () => {
    if (!isActivated && transactions.length >= MAX_DEMO_TRANSACTIONS) {
      setIsDemoLimitModalOpen(true);
      return;
    }
    setEditingTx(null);
    setIsAddEditModalOpen(true);
  };

  // Save/Update transaction
  const handleSaveTransaction = (tx: Transaction) => {
    const safePrev = ensureTransactionIds(transactions);
    const targetId = tx.id ? String(tx.id).trim() : '';

    // Find by ID first, or fallback to matching 'no'
    let idx = -1;
    if (targetId) {
      idx = safePrev.findIndex((t) => String(t.id).trim() === targetId);
    }
    if (idx === -1 && tx.no !== undefined && tx.no !== null) {
      idx = safePrev.findIndex((t) => Number(t.no) === Number(tx.no));
    }

    const isAddingNew = idx === -1;
    if (!isActivated && isAddingNew && safePrev.length >= MAX_DEMO_TRANSACTIONS) {
      setIsAddEditModalOpen(false);
      setIsDemoLimitModalOpen(true);
      return;
    }

    const safeTxNo = Number(tx.no) && Number(tx.no) < 100000 
      ? Number(tx.no) 
      : (idx >= 0 && Number(safePrev[idx]?.no) < 100000 ? Number(safePrev[idx].no) : getNextTransactionNo(safePrev));

    const safeTx: Transaction = {
      ...tx,
      id: targetId || (idx >= 0 && safePrev[idx]?.id ? String(safePrev[idx].id) : `tx-${safeTxNo}-${Math.random().toString(36).substring(2, 7)}`),
      no: safeTxNo
    };

    let updatedTxList: Transaction[] = [];
    if (idx >= 0) {
      updatedTxList = [...safePrev];
      updatedTxList[idx] = safeTx;
    } else {
      updatedTxList = [safeTx, ...safePrev];
    }

    setTransactions(updatedTxList);
    syncToGoogleSheets(updatedTxList, schoolSettings, vendors);
  };

  const handleSaveBatchTransactions = (newTxs: Transaction[]) => {
    const safePrev = ensureTransactionIds(transactions);
    let currentNextNo = getNextTransactionNo(safePrev);

    const processedNewTxs = newTxs.map((tx) => {
      const txNo = tx.no && Number(tx.no) < 100000 ? Number(tx.no) : currentNextNo++;
      return {
        ...tx,
        no: txNo,
      };
    });

    let updatedTxList = [...processedNewTxs, ...safePrev];

    if (!isActivated && updatedTxList.length > MAX_DEMO_TRANSACTIONS) {
      updatedTxList = updatedTxList.slice(0, MAX_DEMO_TRANSACTIONS);
      setTransactions(updatedTxList);
      syncToGoogleSheets(updatedTxList, schoolSettings, vendors);
      setIsDemoLimitModalOpen(true);
      return;
    }

    setTransactions(updatedTxList);
    syncToGoogleSheets(updatedTxList, schoolSettings, vendors);
  };

  const handleRenumberTransactions = () => {
    const safePrev = ensureTransactionIds(transactions);
    const renumbered = renumberTransactionsSequentially(safePrev);
    setTransactions(renumbered);
    syncToGoogleSheets(renumbered, schoolSettings, vendors);
  };

  const handleDeleteTransaction = (id: string | number, skipConfirm = false) => {
    const strId = String(id || '').trim();
    if (!strId) {
      alert('Gagal menghapus: ID transaksi tidak valid.');
      return;
    }

    if (skipConfirm || confirm('Apakah Anda yakin ingin menghapus data transaksi ini?')) {
      const safePrev = ensureTransactionIds(transactions);

      // Find deleted target transaction
      const targetTx = safePrev.find(t => String(t.id).trim() === strId || String(t.no).trim() === strId);
      const deletedTxId = targetTx?.id ? String(targetTx.id).trim() : strId;

      // Filter out matching item by ID or No
      const updatedTxList = safePrev.filter((t) => {
        const matchId = String(t.id).trim() === strId;
        const matchNo = String(t.no).trim() === strId;
        return !matchId && !matchNo;
      });

      if (updatedTxList.length === safePrev.length) {
        alert('Data transaksi tidak ditemukan.');
        return;
      }

      // Revert realization status in rincianList for items linked to this transaction
      setRincianList((prevRincian) => {
        const updated = prevRincian.map((item) => {
          if (
            item.realizedTxId &&
            (item.realizedTxId === deletedTxId || item.realizedTxId === strId)
          ) {
            return {
              ...item,
              isRealized: false,
              realizedVendor: undefined,
              realizedJenis: undefined,
              realizedDate: undefined,
              realizedTxId: undefined,
            };
          }
          return item;
        });
        localStorage.setItem('bosp_rincian_belanja_db', JSON.stringify(updated));
        return updated;
      });

      setTransactions(updatedTxList);
      setSelectedIds((prev) => prev.filter((i) => String(i) !== strId));
      syncToGoogleSheets(updatedTxList, schoolSettings, vendors);
    }
  };

  const handleBulkDeleteTransactions = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data transaksi terpilih?`)) {
      const safePrev = ensureTransactionIds(transactions);
      const strSelected = selectedIds.map((s) => String(s).trim());

      const deletedTxs = safePrev.filter((t) => {
        const idMatch = strSelected.includes(String(t.id).trim());
        const noMatch = strSelected.includes(String(t.no).trim());
        return idMatch || noMatch;
      });

      const deletedTxIds = deletedTxs.map((t) => String(t.id).trim());

      const updatedTxList = safePrev.filter((t) => {
        const idMatch = strSelected.includes(String(t.id).trim());
        const noMatch = strSelected.includes(String(t.no).trim());
        return !idMatch && !noMatch;
      });

      // Revert realization status in rincianList
      setRincianList((prevRincian) => {
        const updated = prevRincian.map((item) => {
          if (
            item.realizedTxId &&
            (deletedTxIds.includes(item.realizedTxId) || strSelected.includes(item.realizedTxId))
          ) {
            return {
              ...item,
              isRealized: false,
              realizedVendor: undefined,
              realizedJenis: undefined,
              realizedDate: undefined,
              realizedTxId: undefined,
            };
          }
          return item;
        });
        localStorage.setItem('bosp_rincian_belanja_db', JSON.stringify(updated));
        return updated;
      });

      setTransactions(updatedTxList);
      setSelectedIds([]);
      syncToGoogleSheets(updatedTxList, schoolSettings, vendors);
    }
  };

  // Import / Reset dataset
  const handleImportTransactions = (newItems: Transaction[], append: boolean) => {
    let updated: Transaction[] = [];
    const safeNew = ensureTransactionIds(newItems);
    if (append) {
      updated = [...safeNew, ...ensureTransactionIds(transactions)];
    } else {
      updated = safeNew;
    }

    if (!isActivated && updated.length > MAX_DEMO_TRANSACTIONS) {
      updated = updated.slice(0, MAX_DEMO_TRANSACTIONS);
      setTransactions(updated);
      syncToGoogleSheets(updated, schoolSettings, vendors);
      setIsDemoLimitModalOpen(true);
      return;
    }

    setTransactions(updated);
    syncToGoogleSheets(updated, schoolSettings, vendors);
  };

  const handleResetDefault = () => {
    setTransactions([]);
    setSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
    setVendors(DEFAULT_VENDORS);
    setSelectedIds([]);
  };

  // Items currently selected for Standing Instruction Modal
  const selectedItems = transactions.filter((t) =>
    selectedIds.includes(String(t.id)) || selectedIds.includes(t.id as any)
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 pb-16">
      
      {/* HEADER SECTION - BENTO STYLE */}
      <header className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 pt-4 sticky top-0 z-30">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
              {schoolSettings.logoSekolahUrl ? (
                <img
                  src={schoolSettings.logoSekolahUrl}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain"
                />
              ) : (
                <LogoTutWuri className="w-7 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {schoolSettings.namaSekolah || 'SD NEGERI CIBURIAL'}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/90 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase tracking-wide">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  DATABASE TRANSAKSI BOSP
                </span>
                <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                  isActivated
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isActivated ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></div>
                  <span>{isActivated ? 'Lisensi Teraktivasi ✓' : `Versi Demo (${transactions.length}/${MAX_DEMO_TRANSACTIONS} Transaksi)`}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Aplikasi Standing Instruction BOSP & Integrasi Database Spreadsheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {/* 1. PRIMARY ACTION: TAMBAH TRANSAKSI */}
            <button
              onClick={handleAddNewTransaction}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Tambah Transaksi BOSP Baru"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Transaksi</span>
            </button>

            {/* 2. DOKUMEN & DATABASE GROUP */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 gap-1 shrink-0">
              <button
                onClick={() => setIsRincianModalOpen(true)}
                className="px-2.5 py-1.5 text-xs font-extrabold text-indigo-950 dark:text-indigo-100 bg-indigo-100 dark:bg-indigo-900/80 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-indigo-200 dark:border-indigo-700"
                title="Panel Rincian Kertas Kerja Perbulan / Rincian Belanja (Hasil Ekstraksi PDF)"
              >
                <Receipt className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Rincian Belanja</span>
              </button>

              <button
                onClick={() => handleOpenPlanningDoc()}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-slate-200 dark:border-slate-600"
                title="Cetak & Kelola Dokumen Perencanaan Pengadaan Barang/Jasa BOSP"
              >
                <ClipboardList className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Dokumen Perencanaan</span>
              </button>

              <button
                onClick={() => handleOpenNonSiplahProof()}
                className="px-2.5 py-1.5 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Cetak & Kelola Berkas Bukti Fisik Transaksi Non-SIPLAH"
              >
                <FileText className="w-3.5 h-3.5 text-slate-950" />
                <span>Bukti Fisik Non-SIPLAH</span>
              </button>

              <button
                onClick={() => setIsImportExportModalOpen(true)}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Kelola Database Transaksi BOSP & Integrasi Google Spreadsheet"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Database Spreadsheet</span>
              </button>
            </div>

            {/* 3. HONORARIUM GROUP */}
            <div className="flex items-center p-1 bg-amber-500/10 dark:bg-amber-950/30 rounded-xl border border-amber-300/60 dark:border-amber-800/60 gap-1 shrink-0">
              <button
                onClick={() => setIsBatchHonorModalOpen(true)}
                className="px-2.5 py-1.5 text-xs font-bold text-amber-950 dark:text-amber-100 bg-amber-400 hover:bg-amber-300 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Input Massal Honor Guru & Staff Sekaligus"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950 dark:text-white" />
                <span>Input Massal Honor</span>
              </button>

              <button
                onClick={() => setIsHonorSettingsModalOpen(true)}
                className="px-2.5 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-200/60 dark:hover:bg-amber-900/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Pengaturan Master Data Honorarium Guru & Tendik"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Master Honor</span>
              </button>
            </div>

            {/* 4. MASTER VENDOR & SETTINGS GROUP */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 gap-0.5 shrink-0">
              <button
                onClick={() => {
                  setSettingsInitialTab('vendors');
                  setIsSettingsModalOpen(true);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Kelola Master Vendor / Toko"
              >
                <Store className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden lg:inline">Kelola Vendor</span>
              </button>

              <button
                onClick={() => {
                  setSettingsInitialTab('school');
                  setIsSettingsModalOpen(true);
                }}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Pengaturan Kop Surat & TTD Sekolah"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* 5. SYSTEM: LISENSI & TEMA */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsActivationModalOpen(true)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isActivated
                    ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black border-amber-400 shadow-2xs'
                }`}
                title="Status Aktivasi & Serial Number Aplikasi"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isActivated ? 'Lisensi' : 'Aktivasi'}</span>
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
                title="Ganti Tema Mode Gelap/Terang"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* DEMO MODE BANNER (Shown if not activated) */}
        {!isActivated && (
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 border border-amber-300 dark:border-amber-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-extrabold shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-amber-200">
                    Aplikasi Berjalan Dalam Mode Demo
                  </h3>
                  <span className="bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                    {transactions.length}/{MAX_DEMO_TRANSACTIONS} Transaksi Terpakai
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Anda dapat mencoba menambah hingga {MAX_DEMO_TRANSACTIONS} data transaksi. Aktivasi lisensi untuk kapasitas transaksi unlimited.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsActivationModalOpen(true)}
              className="px-4 py-2 text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Beli / Aktivasi Lisensi
            </button>
          </div>
        )}

        {/* STATS OVERVIEW & SHORTCUTS */}
        <DashboardStats
          transactions={transactions}
          onSelectNoSurat={handleGenerateSIForNoSurat}
        />

        {/* MAIN TRANSACTION DATA GRID */}
        <TransactionTable
          transactions={transactions}
          selectedIds={selectedIds}
          settings={schoolSettings}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onSelectGroupNoSurat={handleSelectGroupNoSurat}
          onGenerateSIForSelected={handleGenerateSIForSelected}
          onGenerateSIForNoSurat={handleGenerateSIForNoSurat}
          onAddNew={handleAddNewTransaction}
          onEdit={(tx) => {
            setEditingTx(tx);
            setIsAddEditModalOpen(true);
          }}
          onDuplicate={(tx) => {
            if (!isActivated && transactions.length >= MAX_DEMO_TRANSACTIONS) {
              setIsDemoLimitModalOpen(true);
              return;
            }
            const nextNumber = getNextTransactionNo(transactions);
            const duplicateTx: Transaction = {
              ...tx,
              id: '', // Strip ID so it creates a new entry
              no: nextNumber, // Auto assign next available sequence number
            };
            setEditingTx(duplicateTx);
            setIsAddEditModalOpen(true);
          }}
          onDelete={handleDeleteTransaction}
          onBulkDelete={handleBulkDeleteTransactions}
          onRenumberTransactions={handleRenumberTransactions}
          onOpenImportExport={() => setIsImportExportModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenNonSiplahProof={handleOpenNonSiplahProof}
          onOpenPlanningDoc={handleOpenPlanningDoc}
          onOpenRincian={() => setIsRincianModalOpen(true)}
        />
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1">
          Aplikasi Standing Instruction BOSP &copy; {new Date().getFullYear()} {schoolSettings.namaSekolah}. Format resmi Bank BJB Lembang.
        </p>
      </footer>

      {/* MODALS */}
      {/* 1. STANDING INSTRUCTION GENERATOR & PDF PREVIEW MODAL */}
      <StandingInstructionModal
        isOpen={isSiModalOpen}
        onClose={() => setIsSiModalOpen(false)}
        selectedItems={selectedItems}
        allTransactions={transactions}
        settings={schoolSettings}
      />

      {/* 2. ADD / EDIT TRANSACTION MODAL */}
      <AddEditTransactionModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveTransaction}
        initialData={editingTx}
        nextNo={getNextTransactionNo(transactions)}
        vendors={vendors}
        categories={categories}
        honorRecipients={honorRecipients}
        onOpenVendorSettings={() => {
          setSettingsInitialTab('vendors');
          setIsSettingsModalOpen(true);
        }}
        onOpenCategoryManagement={() => {
          setIsCategoryModalOpen(true);
        }}
        onOpenHonorSettings={() => {
          setIsHonorSettingsModalOpen(true);
        }}
      />

      {/* 3. SCHOOL HEADER, VENDOR & CATEGORY SETTINGS MODAL */}
      <SchoolSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={schoolSettings}
        onSave={(newSettings) => {
          setSchoolSettings(newSettings);
          syncToGoogleSheets(transactions, newSettings, vendors);
        }}
        vendors={vendors}
        onSaveVendors={(newVendors) => {
          setVendors(newVendors);
          syncToGoogleSheets(transactions, schoolSettings, newVendors);
        }}
        categories={categories}
        onSaveCategories={(newCategories) => {
          setCategories(newCategories);
        }}
        transactions={transactions}
        initialTab={settingsInitialTab}
      />

      {/* 4. CATEGORY MANAGEMENT MODAL */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onSaveCategories={(newCategories) => {
          setCategories(newCategories);
        }}
        transactions={transactions}
      />

      {/* 5. IMPORT / EXPORT MODAL */}
      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        transactions={transactions}
        schoolSettings={schoolSettings}
        vendors={vendors}
        onImport={handleImportTransactions}
        onImportSchoolSettings={(newSettings) => {
          setSchoolSettings(newSettings);
          syncToGoogleSheets(transactions, newSettings, vendors);
        }}
        onImportVendors={(newVendors) => {
          setVendors(newVendors);
          syncToGoogleSheets(transactions, schoolSettings, newVendors);
        }}
        onResetDefault={handleResetDefault}
      />

      {/* 6. ACTIVATION / SERIAL NUMBER MODAL */}
      <ActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        isLockScreen={false}
        schoolSettings={schoolSettings}
        onActivationSuccess={() => {
          setIsActivated(true);
          setIsActivationModalOpen(false);
        }}
      />

      {/* 7. DEMO LIMIT WARNING MODAL */}
      <DemoLimitModal
        isOpen={isDemoLimitModalOpen}
        onClose={() => setIsDemoLimitModalOpen(false)}
        onOpenActivation={() => {
          setIsDemoLimitModalOpen(false);
          setIsActivationModalOpen(true);
        }}
        currentCount={transactions.length}
        maxLimit={MAX_DEMO_TRANSACTIONS}
      />

      {/* 8. MASTER HONOR MANAGEMENT MODAL */}
      <HonorManagementModal
        isOpen={isHonorSettingsModalOpen}
        onClose={() => setIsHonorSettingsModalOpen(false)}
        honorRecipients={honorRecipients}
        onSaveHonorRecipients={(newRecipients) => {
          setHonorRecipients(newRecipients);
        }}
        onOpenBatchModal={() => setIsBatchHonorModalOpen(true)}
      />

      {/* 9. BATCH HONOR TRANSACTIONS ENTRY MODAL */}
      <BatchHonorModal
        isOpen={isBatchHonorModalOpen}
        onClose={() => setIsBatchHonorModalOpen(false)}
        honorRecipients={honorRecipients}
        schoolSettings={schoolSettings}
        nextNo={getNextTransactionNo(transactions)}
        onSaveBatchTransactions={handleSaveBatchTransactions}
        onOpenHonorSettings={() => setIsHonorSettingsModalOpen(true)}
      />

      {/* 10. NON-SIPLAH PHYSICAL PROOF DOCUMENTS MODAL */}
      <NonSiplahProofModal
        isOpen={isNonSiplahModalOpen}
        onClose={() => setIsNonSiplahModalOpen(false)}
        transactions={nonSiplahTargetTx}
        settings={schoolSettings}
        vendors={vendors}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* 11. PLANNING DOCUMENTS (DOKUMEN PERENCANAAN) MODAL */}
      <PlanningDocModal
        isOpen={isPlanningDocModalOpen}
        onClose={() => setIsPlanningDocModalOpen(false)}
        transactions={planningDocTargetTx}
        settings={schoolSettings}
        vendors={vendors}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* 12. RINCIAN BELANJA (KERTAS KERJA PERBULAN) MODAL */}
      <RincianBelanjaModal
        isOpen={isRincianModalOpen}
        onClose={() => setIsRincianModalOpen(false)}
        rincianList={rincianList}
        onSaveList={(newList) => {
          setRincianList(newList);
          syncToGoogleSheets(transactions, schoolSettings, vendors, newList);
        }}
        settings={schoolSettings}
        scriptUrl={localStorage.getItem('bosp_apps_script_url') || ''}
        onSyncToGoogleSheets={async (customRincian) => {
          await syncToGoogleSheets(transactions, schoolSettings, vendors, customRincian || rincianList);
        }}
        vendors={vendors}
        categories={categories}
        honorRecipients={honorRecipients}
        existingTransactions={transactions}
        onAddBatchTransactions={handleSaveBatchTransactions}
        onDeleteTransaction={handleDeleteTransaction}
      />
    </div>
  );
}
