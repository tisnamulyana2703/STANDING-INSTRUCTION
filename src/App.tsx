import React, { useState, useEffect } from 'react';
import { Transaction, SchoolSettings, Vendor } from './types';
import { INITIAL_TRANSACTIONS } from './data/initialTransactions';
import { DEFAULT_SCHOOL_SETTINGS } from './data/defaultSettings';
import { DEFAULT_VENDORS } from './data/defaultVendors';
import { TransactionTable } from './components/TransactionTable';
import { StandingInstructionModal } from './components/StandingInstructionModal';
import { AddEditTransactionModal } from './components/AddEditTransactionModal';
import { SchoolSettingsModal } from './components/SchoolSettingsModal';
import { CategoryManagementModal, DEFAULT_CATEGORIES } from './components/CategoryManagementModal';
import { ImportExportModal } from './components/ImportExportModal';
import { ActivationModal } from './components/ActivationModal';
import { getStoredLicenseInfo, verifySerialNumber, getMachineId } from './utils/licenseUtils';
import { DashboardStats } from './components/DashboardStats';
import { LogoBandungBarat, LogoTutWuri } from './components/Logos';
import { Sun, Moon, Settings, Store, Cloud, KeyRound, ShieldCheck } from 'lucide-react';
import { sanitizeSchoolSettingsForSync, ensureTransactionIds } from './utils/googleAppsScript';

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

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // License Activation State
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    const info = getStoredLicenseInfo();
    const mid = getMachineId(schoolSettings?.namaSekolah || DEFAULT_SCHOOL_SETTINGS.namaSekolah, schoolSettings?.alamatSekolah || DEFAULT_SCHOOL_SETTINGS.alamatSekolah);
    return info.isActivated && verifySerialNumber(info.serialKey, mid);
  });
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  // Modal States
  const [isSiModalOpen, setIsSiModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'school' | 'vendors' | 'categories'>('school');
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('bosp_transactions_db', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bosp_school_settings', JSON.stringify(schoolSettings));
  }, [schoolSettings]);

  useEffect(() => {
    localStorage.setItem('bosp_vendors_db', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('bosp_categories', JSON.stringify(categories));
  }, [categories]);

  // Helper to push to Google Sheets automatically if URL exists
  const syncToGoogleSheets = async (
    txList: Transaction[],
    settings: SchoolSettings,
    vendorList: Vendor[]
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

    const safeTx: Transaction = {
      ...tx,
      id: targetId || (idx >= 0 && safePrev[idx]?.id ? String(safePrev[idx].id) : `tx-${tx.no || Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
      no: Number(tx.no) || (idx >= 0 ? safePrev[idx].no : safePrev.length + 1)
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

  const handleDeleteTransaction = (id: string | number) => {
    const strId = String(id || '').trim();
    if (!strId) {
      alert('Gagal menghapus: ID transaksi tidak valid.');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus data transaksi ini?')) {
      const safePrev = ensureTransactionIds(transactions);

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

      const updatedTxList = safePrev.filter((t) => {
        const idMatch = strSelected.includes(String(t.id).trim());
        const noMatch = strSelected.includes(String(t.no).trim());
        return !idMatch && !noMatch;
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
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sticky top-0 z-30">
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
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {schoolSettings.namaSekolah || 'SD NEGERI CIBURIAL'}
                </h1>
                <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                  isActivated
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isActivated ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  <span>{isActivated ? 'Lisensi Teraktivasi ✓' : 'Lisensi Belum Teraktivasi'}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Aplikasi Standing Instruction BOSP & Integrasi Database Spreadsheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsActivationModalOpen(true)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                isActivated
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border-amber-400 shadow-sm animate-bounce'
              }`}
              title="Status Aktivasi & Serial Number Application"
            >
              <KeyRound className="w-4 h-4" />
              <span className="hidden sm:inline">{isActivated ? 'Lisensi Aktif' : 'Aktivasi Serial'}</span>
            </button>

            <button
              onClick={() => setIsImportExportModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Integrasi Database Google Spreadsheet & Apps Script"
            >
              <Cloud className="w-4 h-4" />
              <span className="hidden sm:inline">Database Spreadsheet</span>
            </button>

            <button
              onClick={() => {
                setSettingsInitialTab('vendors');
                setIsSettingsModalOpen(true);
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              title="Kelola Master Vendor"
            >
              <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Kelola Vendor</span>
            </button>

            <button
              onClick={() => {
                setSettingsInitialTab('school');
                setIsSettingsModalOpen(true);
              }}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="Pengaturan Kop Surat & TTD"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="Ganti Tema Mode Gelap/Terang"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
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
          onAddNew={() => {
            setEditingTx(null);
            setIsAddEditModalOpen(true);
          }}
          onEdit={(tx) => {
            setEditingTx(tx);
            setIsAddEditModalOpen(true);
          }}
          onDelete={handleDeleteTransaction}
          onBulkDelete={handleBulkDeleteTransactions}
          onOpenImportExport={() => setIsImportExportModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
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
        nextNo={transactions.length > 0 ? Math.max(...transactions.map((t) => t.no || 0)) + 1 : 1}
        vendors={vendors}
        categories={categories}
        onOpenVendorSettings={() => {
          setSettingsInitialTab('vendors');
          setIsSettingsModalOpen(true);
        }}
        onOpenCategoryManagement={() => {
          setIsCategoryModalOpen(true);
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
        isOpen={!isActivated || isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        isLockScreen={!isActivated}
        schoolSettings={schoolSettings}
        onActivationSuccess={() => {
          setIsActivated(true);
          setIsActivationModalOpen(false);
        }}
      />
    </div>
  );
}
