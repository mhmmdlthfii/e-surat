/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getDB, saveDB, pushAuditLog } from '../db';
import { UserRole } from '../types';
import { 
  Award, 
  Upload, 
  Trash2, 
  Check, 
  Info, 
  FileImage,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface ESignatureProps {
  currentUserId: string;
  currentUserRole: UserRole;
  triggerToast: (msg: string, type: 'success' | 'indigo' | 'error') => void;
}

export default function ESignature({ currentUserId, currentUserRole, triggerToast }: ESignatureProps) {
  const [db, setDb] = useState(getDB());
  const [signatureImage, setSignatureImage] = useState(db.signatureConfig.signatureImage);
  const [stempelImage, setStempelImage] = useState(db.signatureConfig.stempelImage);

  // Upload state
  const [isSignDragging, setIsSignDragging] = useState(false);
  const [isStampDragging, setIsStampDragging] = useState(false);

  const saveConfig = (newSign: string, newStamp: string) => {
    const updated = {
      ...db.signatureConfig,
      signatureImage: newSign,
      stempelImage: newStamp,
      updatedAt: new Date().toISOString()
    };
    saveDB.signatureConfig(updated);
    setDb(getDB());
  };

  const handleFile = (file: File, type: 'sign' | 'stamp') => {
    if (!file.type.includes('image/png') && !file.type.includes('image/svg')) {
      triggerToast('Unggah file berformat PNG transparan atau SVG!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      if (type === 'sign') {
        setSignatureImage(b64);
        saveConfig(b64, stempelImage);
        pushAuditLog(currentUserId, 'UPLOAD_SIGNATURE', 'Unggah file tanda tangan kepala sekolah baru', 'Verifikasi');
        triggerToast('Tanda Tangan Kepala Sekolah berhasil diperbarui!', 'success');
      } else {
        setStempelImage(b64);
        saveConfig(signatureImage, b64);
        pushAuditLog(currentUserId, 'UPLOAD_STEMPEL', 'Unggah stempel sekolah baru', 'Verifikasi');
        triggerToast('Stempel Sekolah berhasil diperbarui!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan tanda tangan & stempel ke setelan bawaan?')) {
      // Re-trigger defaults from db.ts constants by clearing storage config
      localStorage.removeItem('simahat_signature_config');
      const fresh = getDB();
      setSignatureImage(fresh.signatureConfig.signatureImage);
      setStempelImage(fresh.signatureConfig.stempelImage);
      setDb(fresh);
      pushAuditLog(currentUserId, 'RESET_SIGNATURE_CONFIG', 'Mengembalikan modul tanda tangan digital ke setelan awal', 'Verifikasi');
      triggerToast('Konfigurasi tanda tangan dan stempel di-reset!', 'success');
    }
  };

  return (
    <div id="esign_settings_root" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Pengaturan Tanda Tangan & Stempel</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Atur visualisasi otorisasi digital Kepala Sekolah dan validasi stempel unit SMP Islam Al Hikmah Mayong</p>
        </div>
        {currentUserRole === 'Kepala Sekolah' || currentUserRole === 'Super Admin' ? (
          <button 
            id="btn_reset_esign"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 font-semibold px-4 py-2 rounded-xl transition duration-150 shadow-sm text-xs bg-white dark:bg-zinc-900"
          >
            <RefreshCw size={14} />
            <span>Setelan Awal</span>
          </button>
        ) : null}
      </div>

      {/* Info Warning */}
      <div className="backdrop-blur-sm bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
        <div className="font-bold text-blue-600 flex items-center gap-1.5">
          <Info size={14} />
          <span>Informasi Hak Akses & Spesifikasi Asset:</span>
        </div>
        <p>Hanya <b>Kepala Sekolah</b> dan <b>Super Admin</b> yang berhak memperbarui tanda tangan digital ini untuk memastikan keamanan surat keluar sekolah.</p>
        <p>Untuk hasil terap terbaik pada dokumen cetak PDF, gunakan gambar dengan format <b>PNG Transparan (Transparent Background)</b> agar arsip stempel membaur elegan dengan tanda tangan dan tidak menutupi tulisan resmi di bawahnya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel 1: Tanda Tangan */}
        <div className="glass rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">1. Tanda Tangan Kepala Sekolah (PNG)</h3>
            <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono font-bold">STAMP_SIGN_V1</span>
          </div>

          {/* View Mockup Area */}
          <div className="border border-zinc-200/50 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/10 rounded-2xl p-4 h-44 flex items-center justify-center relative overflow-hidden">
            <img 
              src={signatureImage} 
              alt="Visual Ttd" 
              className="max-h-36 max-w-[200px] object-contain filter drop-shadow-sm select-none"
            />
            <div className="absolute bottom-2 inset-x-0 text-center text-[10px] font-mono tracking-wide text-zinc-400">
              Pratinjau Ttd: Prof. H. Slamet Riyadi, M.Pd.
            </div>
          </div>

          {/* Upload Drag and Drop zone for signature */}
          {(currentUserRole === 'Kepala Sekolah' || currentUserRole === 'Super Admin') ? (
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsSignDragging(true); }}
              onDragLeave={() => setIsSignDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsSignDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0], 'sign'); }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative ${isSignDragging ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/20'}`}
            >
              <input 
                id="sign_upload_ipt"
                type="file" 
                accept="image/png" 
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0], 'sign'); }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto text-zinc-400 mb-2" size={24} />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">
                Seret file PNG transparan tanda tangan ke sini
              </p>
              <p className="text-[9px] text-zinc-400 mt-0.5">Atau klik untuk browse dari device</p>
            </div>
          ) : (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-zinc-550 dark:text-zinc-400">
              Akses terkunci. Hanya Kepala Sekolah yang berwenang menunggah tanda tangan.
            </div>
          )}
        </div>

        {/* Panel 2: Stempel */}
        <div className="glass rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">2. Stempel Resmi SMP Islam Al Hikmah</h3>
            <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono font-bold">OFFICIAL_SEAL_V1</span>
          </div>

          {/* View Mockup Area */}
          <div className="border border-zinc-200/50 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/10 rounded-2xl p-4 h-44 flex items-center justify-center relative overflow-hidden">
            <img 
              src={stempelImage} 
              alt="Visual Stempel" 
              className="max-h-36 max-w-[140px] object-contain select-none"
            />
            <div className="absolute bottom-2 inset-x-0 text-center text-[10px] font-mono tracking-wide text-zinc-400">
              Pratinjau Stempel Kedinasan (Biru Yayasan)
            </div>
          </div>

          {/* Upload Drag and Drop zone for stempel */}
          {(currentUserRole === 'Kepala Sekolah' || currentUserRole === 'Super Admin') ? (
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsStampDragging(true); }}
              onDragLeave={() => setIsStampDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsStampDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0], 'stamp'); }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative ${isStampDragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/20'}`}
            >
              <input 
                id="stamp_upload_ipt"
                type="file" 
                accept="image/png" 
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0], 'stamp'); }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto text-zinc-400 mb-2" size={24} />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">
                Seret file PNG transparan stempel ke sini
              </p>
              <p className="text-[9px] text-zinc-400 mt-0.5">Atau klik untuk browse dari device</p>
            </div>
          ) : (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-zinc-550 dark:text-zinc-400">
              Akses terkunci. Hanya Kepala Sekolah / TU yang berwenang memperbarui stamp.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
