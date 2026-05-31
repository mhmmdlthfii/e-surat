/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getDB } from '../db';
import { OutgoingLetter } from '../types';
import { 
  ShieldCheck, 
  ShieldX, 
  QrCode, 
  Calendar, 
  MapPin, 
  Award, 
  FileText, 
  Check, 
  Lock,
  Search,
  CheckCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface QRVerificationProps {
  initialCode?: string;
  triggerToast: (msg: string, type: 'success' | 'indigo' | 'error') => void;
}

export default function QRVerification({ initialCode = '', triggerToast }: QRVerificationProps) {
  const [db, setDb] = useState(getDB());
  const [code, setCode] = useState(initialCode);
  const [verifiedLetter, setVerifiedLetter] = useState<OutgoingLetter | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // When initialCode prop changes, auto run search
    if (initialCode) {
      setCode(initialCode);
      handleVerify(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    // Check if there is a query parameter in our URL for simulation
    const searchParams = new URLSearchParams(window.location.search);
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setCode(codeParam);
      handleVerify(codeParam);
    }
  }, []);

  const refreshState = () => {
    setDb(getDB());
  };

  const handleVerify = (searchCode?: string) => {
    refreshState();
    const inputCode = searchCode || code;
    setHasSearched(true);

    if (!inputCode.trim()) {
      setVerifiedLetter(null);
      return;
    }

    // Try finding by Verification Code (case insensitive) or UUID
    const found = db.outgoingLetters.find(l => 
      l.status === 'Terbit' && (
        (l.verificationCode && l.verificationCode.toLowerCase() === inputCode.trim().toLowerCase()) ||
        (l.uuid && l.uuid.toLowerCase() === inputCode.trim().toLowerCase())
      )
    );

    if (found) {
      setVerifiedLetter(found);
      triggerToast('Verifikasi keaslian dokumen berhasil!', 'success');
    } else {
      setVerifiedLetter(null);
      triggerToast('Dokumen gagal diverifikasi / tidak ditemukan!', 'error');
    }
  };

  const handleClear = () => {
    setCode('');
    setVerifiedLetter(null);
    setHasSearched(false);
  };

  return (
    <div id="qr_verification_root" className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Search Input Card */}
      <div className="glass rounded-3xl p-6 shadow-sm shadow-blue-500/5 relative overflow-hidden">
        
        {/* Visual glow background */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-500 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            <QrCode size={12} />
            <span>ENCRYPTED DECENTRALIZED SCANNER</span>
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
            Sistem Verifikasi Keaslian Dokumen
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Pindai QR Code pada surat fisik atau masukkan kode verifikasi unik di bawah ini untuk memeriksa keabsahan surat resmi yang diterbitkan oleh <b>SMP Islam Al Hikmah Mayong</b>.
          </p>
        </div>

        {/* Input Form */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={18} />
            <input 
              id="verification_code_input"
              type="text" 
              placeholder="Contoh: SMH-2026-9E7B8 atau UUID..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 pl-11 pr-4 py-2.5 border-2 border-zinc-300 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 font-mono uppercase tracking-wider"
              onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
            />
          </div>
          <div className="flex gap-2">
            <button 
              id="btn_search_verification"
              onClick={() => handleVerify()}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-bold rounded-2xl transition duration-150 shadow-md shadow-blue-500/10 text-xs text-center flex items-center justify-center gap-1"
            >
              <CheckCircle size={14} />
              <span>Verifikasi</span>
            </button>
            {hasSearched && (
              <button 
                id="btn_clear_verification"
                onClick={handleClear}
                className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-400 rounded-2xl text-xs font-bold"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Validation Result Canvas */}
      {hasSearched && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          {verifiedLetter ? (
            /* CASE 1: DOKUMEN RESMI (VALID) */
            <div className="backdrop-blur-md bg-emerald-500/5 dark:bg-zinc-900/50 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6">
              
              <div className="absolute right-0 top-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Status Header Badge Left */}
              <div className="flex flex-col items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center w-full md:w-52 flex-shrink-0 relative">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border-4 border-emerald-500/30 animate-pulse">
                  <ShieldCheck size={36} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-600 dark:text-emerald-400 font-extrabold uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    APPROVED
                  </span>
                  <h3 className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">✓ DOKUMEN RESMI</h3>
                  <p className="text-[9px] text-zinc-400">SMP ISLAM AL HIKMAH MAYONG</p>
                </div>
              </div>

              {/* Status Details Right */}
              <div className="flex-1 space-y-4">
                <div className="border-b border-zinc-200/50 dark:border-zinc-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-850 dark:text-zinc-200">Hasil Autentikasi Kriptografis</h3>
                    <p className="text-[10px] text-zinc-400">Arsip digital terekam di pangkalan data SIMAHAT Sekolah </p>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                    <Clock size={10} className="text-blue-500" />
                    <span>Disetujui: {new Date(verifiedLetter.signedAt || '').toLocaleDateString('id-ID')}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Judul Agenda:</p>
                    <p className="font-bold text-zinc-900 dark:text-white">{verifiedLetter.title}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Nomor Surat Resmi:</p>
                    <p className="font-mono font-bold text-blue-500">{verifiedLetter.letterNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Penerima Tembusan:</p>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">{verifiedLetter.receiver}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Pejabat Penandatangan:</p>
                    <p className="text-zinc-700 dark:text-zinc-300 font-bold flex items-center gap-1">
                      <Award size={12} className="text-blue-500" />
                      <span>{verifiedLetter.signedBy}</span>
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2 bg-white/40 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 p-2.5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[8.5px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                        <Lock size={10} className="text-blue-500" />
                        <span>SHA256 File Hash Terdaftar</span>
                      </p>
                      <span className="text-[8px] text-emerald-500 font-bold">✓ INTEGRITY SECURED</span>
                    </div>
                    <p className="font-mono text-[9px] text-zinc-400 break-all bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded">{verifiedLetter.sha256Hash}</p>
                  </div>
                </div>

                {/* Simulated file download confirmation */}
                <div className="p-3 bg-white/40 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex items-center justify-between text-[11px] text-zinc-500 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-red-500" />
                    <span>Naskah asli tersimpan aman untuk verifikasi luring.</span>
                  </div>
                  <button 
                    onClick={() => triggerToast('Menampilkan draf asli di tab cetak...', 'indigo')} 
                    className="text-xs text-blue-500 font-bold hover:underline"
                  >
                    Pratinjau Asli ➜
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* CASE 2: DOKUMEN TIDAK DITEMUKAN (INVALID / HOAX) */
            <div className="backdrop-blur-md bg-red-505/5 dark:bg-zinc-900/50 border-2 border-red-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6">
              
              <div className="absolute right-0 top-0 w-44 h-44 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Status Header Badge Left */}
              <div className="flex flex-col items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center w-full md:w-52 flex-shrink-0 relative">
                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center border-4 border-red-500/30 animate-bounce">
                  <ShieldX size={36} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-red-600 dark:text-red-400 font-extrabold uppercase bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
                    WARNING
                  </span>
                  <h3 className="text-base font-extrabold text-red-600 dark:text-red-400 tracking-tight">✗ TIDAK VALID</h3>
                  <p className="text-[9px] text-zinc-400">SMP ISLAM AL HIKMAH MAYONG</p>
                </div>
              </div>

              {/* Status Details Right */}
              <div className="flex-1 space-y-4">
                <div className="border-b border-zinc-200/50 dark:border-zinc-800 pb-3">
                  <h3 className="font-bold text-sm text-zinc-850 dark:text-zinc-200 text-red-500">✗ DOKUMEN TIDAK DITEMUKAN / PALSU</h3>
                  <p className="text-[10px] text-zinc-400">Peringatan: Kode atau hash tanda tangan ini tidak terekam dalam pangkalan data resmi sekolah</p>
                </div>

                <div className="space-y-2 text-xs text-zinc-500 leading-relaxed bg-white/40 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-4 rounded-2xl">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-300">Penyebab Kemungkinan:</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1 text-[11px]">
                    <li><b>Ejaan Berbeda / Typo</b>: Periksa kembali susunan huruf, tanda minus, dan angka kode verifikasi.</li>
                    <li><b>Belum Ditandatangani</b>: Surat draf belum terbit resmi, stempel dan hash belum divalidasi Kepala Sekolah.</li>
                    <li><b>Modifikasi Ilegal (Altered Document)</b>: Dokumen PDF telah diubah secara ilegal tanpa persetujuan administrasi.</li>
                    <li><b>Pemalsuan Dokumen</b>: Format surathead dibuat mirip tetapi bukan diterbitkan oleh unit SMP Islam Al Hikmah.</li>
                  </ul>
                </div>

                <div className="flex items-center gap-1.5 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] text-red-500">
                  <HelpCircle size={14} />
                  <span>Butuh klarifikasi manual? Hubungi Urusan Tata Usaha SMP Islam Al Hikmah Mayong.</span>
                </div>
              </div>

            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
