/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { getDB, saveDB, pushAuditLog } from '../db';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  KeyRound, 
  Check, 
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserManagementProps {
  currentUserId: string;
  currentUserRole: UserRole;
  switchActiveUser: (userId: string) => void;
  triggerToast: (msg: string, type: 'success' | 'indigo' | 'error') => void;
}

export default function UserManagement({ currentUserId, currentUserRole, switchActiveUser, triggerToast }: UserManagementProps) {
  const [db, setDb] = useState(getDB());
  const [isNewOpen, setIsNewOpen] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Operator');

  const refreshState = () => {
    setDb(getDB());
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name || !email) {
      triggerToast('Seluruh kolom holds data wajib diisi!', 'error');
      return;
    }

    const currentUsers = [...db.users];

    // Check duplicate
    if (currentUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      triggerToast('Username sudah terdaftar!', 'error');
      return;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      username: username.toLowerCase().replace(/\s+/g, ''),
      name,
      email,
      role,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'
    };

    const updated = [...currentUsers, newUser];
    saveDB.users(updated);
    pushAuditLog(currentUserId, 'CREATE_USER', `Mendaftarkan staf operator baru: ${name} (${role})`, 'Pengguna');
    triggerToast('Akun staf baru berhasil dibuat!', 'success');

    setIsNewOpen(false);
    setUsername('');
    setName('');
    setEmail('');
    setRole('Operator');
    refreshState();
  };

  const toggleUserStatus = (userId: string, userName: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      triggerToast('Anda tidak dapat menonaktifkan akun sendiri!', 'error');
      return;
    }

    const currentUsers = [...db.users];
    const idx = currentUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      currentUsers[idx].isActive = !currentStatus;
      saveDB.users(currentUsers);
      pushAuditLog(currentUserId, currentStatus ? 'DEACTIVATE_USER' : 'ACTIVATE_USER', `Mengubah status keaktifan akun ${userName}`, 'Pengguna');
      triggerToast(`Akun ${userName} telah ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}!`, 'success');
      refreshState();
    }
  };

  const handleResetPassword = (userName: string) => {
    pushAuditLog(currentUserId, 'RESET_PASSWORD', `Menerbitkan reset password default untuk akun ${userName}`, 'Pengguna');
    alert(`[RESET_PASSWORD SUCCESS]\nKata sandi default untuk akun "${userName}" berhasil di-reset menjadi:\n\nsmpislam1234\n\nStaf silakan memperbarui saat pertama login kali.`);
    triggerToast(`Sandi akun ${userName} berhasil di-reset!`, 'success');
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUserId) {
      triggerToast('Anda tidak dapat menghapus akun sendiri!', 'error');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun staf "${userName}"? Seluruh kredensial akan dihapus secara permanen.`)) {
      const filtered = db.users.filter(u => u.id !== userId);
      saveDB.users(filtered);
      pushAuditLog(currentUserId, 'DELETE_USER', `Menghapus akun staf ${userName}`, 'Pengguna');
      triggerToast('Akun berhasil dihapus permanen!', 'error');
      refreshState();
    }
  };

  const getRoleColor = (userRole: UserRole) => {
    switch (userRole) {
      case 'Super Admin': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Kepala Sekolah': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Tata Usaha': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Operator': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <div id="userman_settings_root" className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Tata Kelola Pengguna (RBAC)</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Atur akun staf sekolah, reset kata sandi default, dan pantau pembagian hak akses terintegrasi</p>
        </div>
        {currentUserRole === 'Super Admin' && (
          <button 
            id="btn_add_user"
            onClick={() => setIsNewOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-medium px-4 py-2 rounded-xl transition duration-150 shadow-sm text-xs"
          >
            <UserPlus size={16} />
            <span>Tambah Akun Staf</span>
          </button>
        )}
      </div>

      {/* Main Table Account */}
      <div className="glass rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-50/50 dark:bg-zinc-950/20">
                <th className="py-3 px-4">Nama Staf Lengkap</th>
                <th className="py-3 px-4">Kontak / E-mail</th>
                <th className="py-3 px-4">Hak Akses (Role)</th>
                <th className="py-3 px-4">Status Akun</th>
                {currentUserRole === 'Super Admin' && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
              {db.users.map((staf) => (
                <tr key={staf.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-950/5 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={staf.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'} 
                        alt="Avatar" 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-850"
                      />
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <span>{staf.name}</span>
                          {staf.id === currentUserId && (
                            <span className="text-[8px] bg-indigo-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Anda</span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">@{staf.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-zinc-500">
                    {staf.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold tracking-wide ${getRoleColor(staf.role)}`}>
                      {staf.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button 
                      onClick={() => currentUserRole === 'Super Admin' && toggleUserStatus(staf.id, staf.name, staf.isActive)}
                      disabled={currentUserRole !== 'Super Admin'}
                      className="focus:outline-none disabled:opacity-85 cursor-pointer"
                    >
                      {staf.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                          <ToggleRight size={24} />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-zinc-400">
                          <ToggleLeft size={24} />
                          <span>Mati</span>
                        </span>
                      )}
                    </button>
                  </td>
                  {currentUserRole === 'Super Admin' && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleResetPassword(staf.username)}
                          title="Reset Password Default"
                          className="p-1.5 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                        >
                          <KeyRound size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(staf.id, staf.name)}
                          title="Hapus Akun Permanen"
                          className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW USER DIALOG */}
      <AnimatePresence>
        {isNewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20">
                <div className="flex items-center gap-2">
                  <UserPlus className="text-blue-500" />
                  <span className="font-bold text-base">Registrasi Akun Staf Baru</span>
                </div>
                <button onClick={() => setIsNewOpen(false)} className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <label className="text-xs font-bold text-zinc-420">Username Unik <span className="text-red-500">*</span></label>
                  <input 
                    id="input_reg_username"
                    type="text" 
                    placeholder="Contoh: wahyudisaputra (Tanpa spasi)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-xs font-bold text-zinc-420">Nama Lengkap & Gelar Akademik <span className="text-red-500">*</span></label>
                  <input 
                    id="input_reg_name"
                    type="text" 
                    placeholder="Contoh: Drs. Wahyudi Saputra"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-xs font-bold text-zinc-420">Alamat E-mail Aliansi Sekolah <span className="text-red-500">*</span></label>
                  <input 
                    id="input_reg_email"
                    type="email" 
                    placeholder="Contoh: wahyudi@alhikmahmayong.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-xs font-bold text-zinc-420">Hak Akses Sistem (Role)</label>
                  <select 
                    id="select_reg_role"
                    value={role} 
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Operator">Operator (Pembuat Draf)</option>
                    <option value="Tata Usaha">Tata Usaha (Pencatat Masuk/Keluar)</option>
                    <option value="Kepala Sekolah">Kepala Sekolah (Tanda Tangan & Disposisi)</option>
                    <option value="Super Admin">Super Admin (Urusan Inti Lembaga)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsNewOpen(false)}
                    className="border border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10"
                  >
                    <span>Buat Akun</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
