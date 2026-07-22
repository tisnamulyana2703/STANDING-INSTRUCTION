import React, { useState, useEffect } from 'react';
import { SchoolSettings, Vendor } from '../types';
import { X, Save, Building2, UserCheck, ShieldCheck, Store, Plus, Edit2, Trash2, Search, CheckCircle } from 'lucide-react';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  onSave: (newSettings: SchoolSettings) => void;
  vendors: Vendor[];
  onSaveVendors: (newVendors: Vendor[]) => void;
  initialTab?: 'school' | 'vendors';
}

export function SchoolSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  vendors,
  onSaveVendors,
  initialTab = 'school',
}: SchoolSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'school' | 'vendors'>(initialTab);
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [vendorList, setVendorList] = useState<Vendor[]>(vendors);
  
  // Vendor form state
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState({
    nama: '',
    hp: '',
    alamat: '',
    npwp: '',
  });
  const [vendorSearch, setVendorSearch] = useState('');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    setVendorList(vendors);
  }, [vendors]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSubmitSchool = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleLogoUpload = (
    field: 'logoKabupatenUrl' | 'logoSekolahUrl',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            [field]: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Vendor actions
  const handleSaveVendorForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.nama.trim()) {
      alert('Nama Vendor wajib diisi!');
      return;
    }

    let updated: Vendor[];
    if (editingVendorId) {
      updated = vendorList.map((v) =>
        v.id === editingVendorId
          ? {
              ...v,
              nama: vendorForm.nama.trim(),
              hp: vendorForm.hp.trim(),
              alamat: vendorForm.alamat.trim(),
              npwp: vendorForm.npwp.trim(),
            }
          : v
      );
    } else {
      const newV: Vendor = {
        id: `vendor-${Date.now()}`,
        nama: vendorForm.nama.trim(),
        hp: vendorForm.hp.trim(),
        alamat: vendorForm.alamat.trim(),
        npwp: vendorForm.npwp.trim(),
      };
      updated = [newV, ...vendorList];
    }

    setVendorList(updated);
    onSaveVendors(updated);
    
    // Reset form
    setEditingVendorId(null);
    setVendorForm({ nama: '', hp: '', alamat: '', npwp: '' });
  };

  const handleEditVendorClick = (v: Vendor) => {
    setEditingVendorId(v.id);
    setVendorForm({
      nama: v.nama || '',
      hp: v.hp || '',
      alamat: v.alamat || '',
      npwp: v.npwp || '',
    });
  };

  const handleDeleteVendorClick = (id: string) => {
    const updated = vendorList.filter((v) => v.id !== id);
    setVendorList(updated);
    onSaveVendors(updated);
    if (editingVendorId === id) {
      setEditingVendorId(null);
      setVendorForm({ nama: '', hp: '', alamat: '', npwp: '' });
    }
    setDeletingVendorId(null);
  };

  const handleCancelVendorEdit = () => {
    setEditingVendorId(null);
    setVendorForm({ nama: '', hp: '', alamat: '', npwp: '' });
  };

  const filteredVendors = vendorList.filter((v) =>
    v.nama.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    (v.alamat && v.alamat.toLowerCase().includes(vendorSearch.toLowerCase())) ||
    (v.npwp && v.npwp.toLowerCase().includes(vendorSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* HEADER */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              {activeTab === 'school' ? <Building2 className="w-5 h-5" /> : <Store className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Pengaturan Sistem & Database Vendor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola kop surat, pejabat penandatangan, serta database vendor penyedia BOSP
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

        {/* TAB NAVIGATION */}
        <div className="bg-slate-100/80 dark:bg-slate-800/40 px-6 border-b border-slate-200 dark:border-slate-800 flex gap-2 pt-2">
          <button
            onClick={() => setActiveTab('school')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'school'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Kop & Pejabat Sekolah</span>
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'vendors'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Database Vendor / Toko</span>
            <span className="ml-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[10px]">
              {vendorList.length}
            </span>
          </button>
        </div>

        {/* TAB 1: SCHOOL SETTINGS */}
        {activeTab === 'school' && (
          <form onSubmit={handleSubmitSchool} className="p-6 space-y-6 text-xs max-h-[70vh] overflow-y-auto">
            
            {/* SECTION 1: KOP SURAT */}
            <div className="bg-slate-50/60 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                <Building2 className="w-4 h-4 mr-2" /> 1. Informasi Sekolah & Kop Surat
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Instansi / Pemerintah
                  </label>
                  <input
                    type="text"
                    value={formData.pemerintah}
                    onChange={(e) => setFormData({ ...formData, pemerintah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="PEMERINTAH KABUPATEN BANDUNG BARAT"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Sekolah
                  </label>
                  <input
                    type="text"
                    value={formData.namaSekolah}
                    onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="SD NEGERI CIBURIAL"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap Sekolah
                </label>
                <textarea
                  rows={2}
                  value={formData.alamatSekolah}
                  onChange={(e) => setFormData({ ...formData, alamatSekolah: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Jl. Tangkuban Parahu Kp. Ciburial..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Logo Pemda / Kabupaten (Opsional Kustom Gambar)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload('logoKabupatenUrl', e)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Logo Sekolah / Tut Wuri (Opsional Kustom Gambar)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload('logoSekolahUrl', e)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: BANK & ACCOUNT INFO */}
            <div className="bg-slate-50/60 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                <ShieldCheck className="w-4 h-4 mr-2" /> 2. Rekening Utama & Bank
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bank Tujuan SI
                  </label>
                  <input
                    type="text"
                    value={formData.bankTarget}
                    onChange={(e) => setFormData({ ...formData, bankTarget: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="PT. Bank Pembangunan Daerah Jawa Barat & Banten, Tbk"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cabang Bank
                  </label>
                  <input
                    type="text"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Kantor Cabang Lembang"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kota Pembuat Surat
                  </label>
                  <input
                    type="text"
                    value={formData.kotaSurat}
                    onChange={(e) => setFormData({ ...formData, kotaSurat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Lembang"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    No. Rekening Utama Sekolah
                  </label>
                  <input
                    type="text"
                    value={formData.noRekeningUtama}
                    onChange={(e) => setFormData({ ...formData, noRekeningUtama: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0120015095100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Atas Nama Rekening
                  </label>
                  <input
                    type="text"
                    value={formData.atasNamaRekening}
                    onChange={(e) => setFormData({ ...formData, atasNamaRekening: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="20207938 SD NEGERI CIBURIAL"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: KEPALA SEKOLAH & BENDAHARA */}
            <div className="bg-slate-50/60 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                <UserCheck className="w-4 h-4 mr-2" /> 3. Data Pejabat Penandatangan
              </h4>

              {/* KEPALA SEKOLAH */}
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">Kepala Sekolah</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Nama & Gelar</label>
                    <input
                      type="text"
                      value={formData.kepalaSekolah.nama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kepalaSekolah: { ...formData.kepalaSekolah, nama: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">NIP</label>
                    <input
                      type="text"
                      value={formData.kepalaSekolah.nip}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kepalaSekolah: { ...formData.kepalaSekolah, nip: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">NIK & Alamat</label>
                    <input
                      type="text"
                      value={formData.kepalaSekolah.nik}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kepalaSekolah: { ...formData.kepalaSekolah, nik: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">No. Handphone</label>
                    <input
                      type="text"
                      value={formData.kepalaSekolah.hp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kepalaSekolah: { ...formData.kepalaSekolah, hp: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* BENDAHARA */}
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">Bendahara Sekolah</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Nama & Gelar</label>
                    <input
                      type="text"
                      value={formData.bendahara.nama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bendahara: { ...formData.bendahara, nama: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">NIP</label>
                    <input
                      type="text"
                      value={formData.bendahara.nip}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bendahara: { ...formData.bendahara, nip: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">NIK & Alamat</label>
                    <input
                      type="text"
                      value={formData.bendahara.nik}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bendahara: { ...formData.bendahara, nik: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">No. Handphone</label>
                    <input
                      type="text"
                      value={formData.bendahara.hp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bendahara: { ...formData.bendahara, hp: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Simpan Pengaturan
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: VENDOR DATABASE SETTINGS */}
        {activeTab === 'vendors' && (
          <div className="p-6 space-y-6 text-xs max-h-[70vh] overflow-y-auto">
            
            {/* VENDOR ADD/EDIT FORM */}
            <form onSubmit={handleSaveVendorForm} className="bg-indigo-50/50 dark:bg-slate-800/60 p-5 rounded-2xl border border-indigo-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-700 pb-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {editingVendorId ? 'Edit Data Vendor / Toko' : 'Tambah Vendor Baru'}
                </h4>
                {editingVendorId && (
                  <button
                    type="button"
                    onClick={handleCancelVendorEdit}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Vendor / Penyedia Toko <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendorForm.nama}
                    onChange={(e) => setVendorForm({ ...vendorForm, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="misal: CV. MEDIA SARANA EDUKASI / TOKO ATK SEJAHTERA"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    No. HP / Whatsapp Vendor
                  </label>
                  <input
                    type="text"
                    value={vendorForm.hp}
                    onChange={(e) => setVendorForm({ ...vendorForm, hp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Vendor
                  </label>
                  <input
                    type="text"
                    value={vendorForm.alamat}
                    onChange={(e) => setVendorForm({ ...vendorForm, alamat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Jl. Raya Lembang No. 120, Bandung Barat"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    NPWP Vendor
                  </label>
                  <input
                    type="text"
                    value={vendorForm.npwp}
                    onChange={(e) => setVendorForm({ ...vendorForm, npwp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="01.234.567.8-901.000"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  {editingVendorId ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Update Vendor
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Simpan Vendor Baru
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* VENDOR TABLE / LIST */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Daftar Master Vendor Tersimpan ({vendorList.length})
                </h4>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    placeholder="Cari vendor..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {filteredVendors.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Store className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Tidak ada vendor yang cocok.</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <th className="p-3">Nama Vendor</th>
                          <th className="p-3">No. HP</th>
                          <th className="p-3">Alamat</th>
                          <th className="p-3">NPWP</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {filteredVendors.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">
                              {v.nama}
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                              {v.hp || '-'}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                              {v.alamat || '-'}
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                              {v.npwp || '-'}
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              {deletingVendorId === v.id ? (
                                <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2 py-1 rounded-xl">
                                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Hapus?</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteVendorClick(v.id);
                                    }}
                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition-colors"
                                  >
                                    Ya
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDeletingVendorId(null);
                                    }}
                                    className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 font-bold rounded-lg text-[10px] transition-colors"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditVendorClick(v);
                                    }}
                                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                                    title="Edit Vendor"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDeletingVendorId(v.id);
                                    }}
                                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                                    title="Hapus Vendor"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
