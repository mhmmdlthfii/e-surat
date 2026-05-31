/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getDB, saveDB, pushAuditLog } from '../db';
import { SchoolSettings as SettingsType, UserRole } from '../types';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  User, 
  Award, 
  Save,
  Image as ImageIcon,
  Info 
} from 'lucide-react';

interface SchoolSettingsProps {
  currentUserId: string;
  currentUserRole: UserRole;
  triggerToast: (msg: string, type: 'success' | 'indigo' | 'error') => void;
}

export default function SchoolSettings({ currentUserId, currentUserRole, triggerToast }: SchoolSettingsProps) {
  const [db, setDb] = useState(getDB());
  
  // Settings Form State
  const [name, setName] = useState(db.schoolSettings.name);
  const [logoUrl, setLogoUrl] = useState(db.schoolSettings.logoUrl);
  const [address, setAddress] = useState(db.schoolSettings.address);
  const [email, setEmail] = useState(db.schoolSettings.email);
  const [phone, setPhone] = useState(db.schoolSettings.phone);
  const [website, setWebsite] = useState(db.schoolSettings.website);
  const [headmasterName, setHeadmasterName] = useState(db.schoolSettings.headmasterName);
  const [headmasterNip, setHeadmasterNip] = useState(db.schoolSettings.headmasterNip);

  const refreshState = () => {
    setDb(getDB());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole !== 'Super Admin' && currentUserRole !== 'Kepala Sekolah') {
      triggerToast('Akses dibatasi! Hanya Super Admin atau Kepala Sekolah yang berhak mengubah pengaturan.', 'error');
      return;
    }

    const updated: SettingsType = {
      name,
      logoUrl,
      address,
      email,
      phone,
      website,
      headmasterName,
      headmasterNip
    };

    saveDB.schoolSettings(updated);
    pushAuditLog(currentUserId, 'UPDATE_SCHOOL_SETTINGS', `Memperbarui setelan informasi pokok sekolah: ${name}`, 'Pengaturan');
    triggerToast('Informasi administrasi sekolah berhasil diperbarui!', 'success');
    refreshState();
  };

  return (
    <div id="school_settings_root" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Pengaturan Identitas Sekolah</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Sesuaikan profil identitas resmi sekolah, nomor kontak, email, website, kepala sekolah, dan logo KOP Surat</p>
        </div>
      </div>

      <div className="backdrop-blur-sm bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
        <div className="font-bold text-blue-600 flex items-center gap-1.5">
          <Info size={14} />
          <span>Informasi Identitas Lembaga:</span>
        </div>
        <p>Seluruh rincian isian di halaman ini akan otomatis muncul pada **KOP Surat Resmi** (Letterhead Header) dan tanda tangan otorisasi akhir semua berkas persuratan keluar.</p>
        <p>Hanya profil berperingkat <b>Super Admin</b> atau <b>Kepala Sekolah</b> yang diizinkan memodifikasi parameter ini.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Logo & Preview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-6 shadow-sm text-center space-y-4">
            <h3 className="font-bold text-sm text-zinc-850 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 pb-3">Logo KOP Surat Resmi</h3>
            
            <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl">
              <img 
                src={logoUrl} 
                alt="Logo Sekolah" 
                className="w-24 h-24 object-contain rounded-xl shadow-inner mb-3 filter drop-shadow-sm select-none"
              />
              <span className="text-[10px] text-zinc-400 font-mono">Pratinjau Khas SMP Al-Hikmah</span>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-420">URL Gambar/Logo</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" size={14} />
                <input 
                  id="input_school_logo"
                  type="text" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  disabled={currentUserRole !== 'Super Admin' && currentUserRole !== 'Kepala Sekolah'}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white dark:bg-zinc-950 pl-9 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-zinc-850 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 pb-3">Rincian Pokok Profil SMP Islam Al Hikmah</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-500">Nama Sekolah Resmi <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    id="input_school_name"
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={currentUserRole !== 'Super Admin' && currentUserRole !== 'Kepala Sekolah'}
                    className="w-full bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-500">Alamat Lengkap Kantor <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-zinc-400" size={14} />
                  <textarea 
                    id="input_school_address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={currentUserRole !== 'Super Admin' && currentUserRole !== 'Kepala Sekolah'}
                    className="w-full bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none leading-relaxed"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500">No. Telepon Instansi <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    id="input_school_telp"
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={currentUserRole !== 'Super Admin' && currentUserRole !== 'Kepala Sekolah'}
                    className="w-full bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500">E-mail Resmi <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    id="input_school_email"
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={currentUserRole !== 'Super Admin' && currentUserRole !== 'Kepala Sekolah'}
                    className="w-full bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500">Situs Web Sekolah</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    id="input_school_web"
                    type="text" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled={currentUserRole !== 'Super Admin' && currentUserRole !== 'Kepala Sekolah'}
                    className="w-full bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 block pt-5">Harap diisi sinkron dengan domain Hostinger/VPS.</span>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500">Nama Lengkap Kepala Sekolah <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    id="input_school_headmaster"
                    type="text" 
                    value={headmasterName}
                    onChange={(e) => setHeadmasterName(e.target.value)}
                    disabled={currentUserRole !== 'Super Admin' && currentUserRole !== 'Kepala Sekolah'}
                    className="w-full bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500">NIP Kepala Sekolah <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    id="input_school_nip"
                    type="text" 
                    value={headmasterNip}
                    onChange={(e) => setHeadmasterNip(e.target.value)}
                    disabled={currentUserRole !== 'Super Admin' && currentUserRole !== 'Kepala Sekolah'}
                    className="w-full bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

            </div>

            {(currentUserRole === 'Super Admin' || currentUserRole === 'Kepala Sekolah') && (
              <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  id="btn_save_school_settings"
                  type="submit"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10"
                >
                  <Save size={14} />
                  <span>Simpan Perubahan Identitas</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
