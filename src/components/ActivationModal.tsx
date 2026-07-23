import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Copy, Check, Lock, AlertCircle, PhoneCall, Sparkles, RefreshCw, LogOut } from 'lucide-react';
import { getMachineId, verifySerialNumber, generateSerialNumber, saveLicenseInfo, LicenseInfo } from '../utils/licenseUtils';
import { SchoolSettings } from '../types';

interface ActivationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isLockScreen?: boolean; // If true, cannot close modal until activated
  schoolSettings: SchoolSettings;
  onActivationSuccess: () => void;
}

export function ActivationModal({
  isOpen,
  onClose,
  isLockScreen = false,
  schoolSettings,
  onActivationSuccess,
}: ActivationModalProps) {
  const machineId = getMachineId(schoolSettings.namaSekolah, schoolSettings.alamatSekolah);
  const [inputSerial, setInputSerial] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Admin key generator state
  const [showAdminTool, setShowAdminTool] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [targetMachineId, setTargetMachineId] = useState(machineId);
  const [generatedSerial, setGeneratedSerial] = useState('');
  const [copiedGenerated, setCopiedGenerated] = useState(false);

  if (!isOpen) return null;

  const handleCopyMachineId = () => {
    navigator.clipboard.writeText(machineId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!inputSerial.trim()) {
      setErrorMessage('Silakan masukkan Serial Number aktivasi.');
      return;
    }

    const isValid = verifySerialNumber(inputSerial, machineId);
    if (isValid) {
      const licenseData: LicenseInfo = {
        isActivated: true,
        serialKey: inputSerial.trim().toUpperCase(),
        activatedAt: new Date().toISOString(),
        activatedForSchool: schoolSettings.namaSekolah,
      };
      saveLicenseInfo(licenseData);
      setSuccessMessage('Aktivasi Berhasil! Lisensi aplikasi BOSP telah terverifikasi.');
      setTimeout(() => {
        onActivationSuccess();
        if (onClose && !isLockScreen) onClose();
      }, 1000);
    } else {
      setErrorMessage('Serial Number tidak valid! Periksa kembali atau hubungi penyedia aplikasi.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Master Admin PIN for app developer
    if (adminPin.trim() === '2703' || adminPin.trim() === '123456' || adminPin.trim() === 'ADMIN') {
      setIsAdminAuthenticated(true);
      setTargetMachineId(machineId);
      setGeneratedSerial(generateSerialNumber(machineId));
    } else {
      alert('PIN Admin Salah!');
    }
  };

  const handleGenerateSerial = () => {
    if (!targetMachineId.trim()) return;
    const serial = generateSerialNumber(targetMachineId.trim());
    setGeneratedSerial(serial);
  };

  const waMessage = encodeURIComponent(
    `Halo Admin Aplikasi BOSP, saya ingin aktivasi Serial Number Aplikasi untuk:\n\nNama Sekolah: ${schoolSettings.namaSekolah || '-'}\nAlamat: ${schoolSettings.alamatSekolah || '-'}\nID Perangkat: ${machineId}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white relative">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
              <KeyRound className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                Aktivasi Lisensi BOSP
                {isLockScreen && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full">
                    Aplikasi Terkunci
                  </span>
                )}
              </h3>
              <p className="text-xs text-indigo-100 font-medium">
                Sistem Perlindungan Hardware & Serial Number Resmi
              </p>
            </div>
          </div>

          {!isLockScreen && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Notification Info */}
          <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 p-4 rounded-2xl flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-indigo-950 dark:text-indigo-200">
                Aktivasi Sekali untuk Setiap Perangkat / Sekolah
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Kirimkan <strong className="text-slate-900 dark:text-slate-200">ID Perangkat</strong> di bawah ini kepada penyedia / pembuat aplikasi untuk mendapatkan Serial Number resmi milik sekolah Anda.
              </p>
            </div>
          </div>

          {/* Machine ID Box */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
              ID Perangkat / ID Sekolah Anda:
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100 text-xs tracking-wide select-all overflow-x-auto whitespace-nowrap">
                {machineId}
              </div>
              <button
                type="button"
                onClick={handleCopyMachineId}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId ? 'Tersalin' : 'Salin ID'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Activation Request Link */}
          <a
            href={`https://wa.me/?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs text-xs"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Minta Serial Number via WhatsApp</span>
          </a>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <label className="block font-bold text-slate-800 dark:text-slate-200">
                Masukkan Serial Number Aktivasi:
              </label>
              <input
                type="text"
                value={inputSerial}
                onChange={(e) => setInputSerial(e.target.value.toUpperCase())}
                placeholder="Contoh: BOSP-XXXX-XXXX-XXXX-XXXX"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm tracking-widest font-bold text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Aktivasi Sekarang</span>
            </button>
          </form>

          {/* Generator Serial Khusus Pembuat / Admin */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdminTool(!showAdminTool)}
              className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showAdminTool ? 'Sembunyikan Generator Admin' : 'Panel Pembuat Aplikasi / Generator Serial'}</span>
            </button>

            {showAdminTool && (
              <div className="mt-3 p-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                {!isAdminAuthenticated ? (
                  <form onSubmit={handleAdminLogin} className="space-y-2">
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      Masukkan PIN Pengembang / Pemilik Aplikasi:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        placeholder="PIN Master..."
                        className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Masuk
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px] uppercase">
                        ✓ Mode Generator Admin Aktif
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAdminAuthenticated(false)}
                        className="text-[10px] text-slate-400 hover:text-rose-500 font-bold underline"
                      >
                        Keluar Mode Admin
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        ID Perangkat Pembeli:
                      </label>
                      <input
                        type="text"
                        value={targetMachineId}
                        onChange={(e) => setTargetMachineId(e.target.value)}
                        placeholder="Masukkan ID Perangkat Pembeli..."
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs font-bold"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateSerial}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Buat Serial Number Kunci</span>
                    </button>

                    {generatedSerial && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1">
                        <span className="block text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                          Hasil Serial Number Resmi:
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-black text-amber-950 dark:text-amber-100 text-sm tracking-wider select-all">
                            {generatedSerial}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedSerial);
                              setInputSerial(generatedSerial);
                              setCopiedGenerated(true);
                              setTimeout(() => setCopiedGenerated(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg text-[10px] shrink-0 cursor-pointer hover:bg-amber-700"
                          >
                            {copiedGenerated ? 'Tersalin!' : 'Salin & Pasang'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Aplikasi Keuangan BOSP v2.6 - Security Lock</span>
          {isLockScreen && (
            <span className="font-semibold text-rose-500">
              Isi Serial Number untuk Membuka
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
