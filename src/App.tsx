/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getDB, 
  saveDB, 
  pushAuditLog, 
  pushNotification 
} from './db';
import { 
  UserRole, 
  User, 
  IncomingLetter, 
  OutgoingLetter, 
  LetterTemplate, 
  Notification 
} from './types';

// Importing sub components
import DashboardCharts from './components/DashboardCharts';
import SuratMasuk from './components/SuratMasuk';
import SuratKeluar from './components/SuratKeluar';
import TemplateSurat from './components/TemplateSurat';
import QRVerification from './components/QRVerification';
import ESignature from './components/ESignature';
import AuditLogView from './components/AuditLogView';
import SchoolSettings from './components/SchoolSettings';
import UserManagement from './components/UserManagement';

import { 
  LayoutDashboard, 
  Inbox, 
  Send, 
  FileSignature, 
  QrCode, 
  Lock, 
  History, 
  Settings, 
  Users, 
  Sun, 
  Moon, 
  Bell, 
  User as UserIcon, 
  ChevronRight, 
  FileText, 
  Printer, 
  LogOut, 
  ClipboardCheck, 
  AlertCircle,
  Eye,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [db, setDb] = useState(getDB());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incoming' | 'outgoing' | 'templates' | 'esign' | 'verify' | 'users' | 'audit' | 'settings'>('dashboard');
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('simahat_theme') as 'light' | 'dark') || 'light';
  });

  // Login authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('simahat_is_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('simahat_logged_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as User;
      } catch (_) {
        // Fallback
      }
    }
    return db.users[0]; // defaults to Muhammad Luthfi (the first user now)
  });

  // Login form field values
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Notification menu state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(db.notifications);

  // Verification redirect code
  const [verificationCodeInput, setVerificationCodeInput] = useState('');

  // Mobile menu open
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Printable layout document wrapper state
  const [printLetter, setPrintLetter] = useState<OutgoingLetter | null>(null);

  // Toast status alert
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'indigo' | 'error' } | null>(null);

  // Realtime clock in WIB format (UTC+7)
  const [timeStr, setTimeStr] = useState('WIB: --:--:-- (--/--/----)');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };

      const timeFmt = now.toLocaleTimeString('id-ID', options);
      const dateFmt = now.toLocaleDateString('id-ID', dateOptions);
      setTimeStr(`WIB: ${timeFmt} (${dateFmt})`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Sync current user with db if users updated
    const freshUsers = getDB().users;
    const synced = freshUsers.find(u => u.id === currentUser.id);
    if (synced) {
      setCurrentUser(synced);
    }
  }, [db.users]);

  // Sync tab favicon and document title with school settings dynamically (convert schools logo to tab icon)
  useEffect(() => {
    if (db.schoolSettings) {
      document.title = `${db.schoolSettings.name} | SIMAHAT`;
      
      const logoUrl = db.schoolSettings.logoUrl;
      const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = logoUrl || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=150";
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.type = 'image/x-icon';
        newFavicon.rel = 'shortcut icon';
        newFavicon.href = logoUrl || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=150";
        document.getElementsByTagName('head')[0].appendChild(newFavicon);
      }
    }
  }, [db.schoolSettings]);

  // Sync theme selection to document element for global Tailwind theme class-based selector toggles
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle Toast triggers
  const triggerToast = (msg: string, type: 'success' | 'indigo' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleSwitchTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!usernameInput.trim()) {
      setLoginError('Masukkan username Anda.');
      return;
    }

    if (!passwordInput) {
      setLoginError('Masukkan password Anda.');
      return;
    }

    // Attempt retrieval
    const matched = db.users.find(
      u => u.username.toLowerCase() === usernameInput.trim().toLowerCase()
    );

    if (!matched) {
      setLoginError('Username tidak terdaftar.');
      return;
    }

    if (matched.password === passwordInput) {
      if (!matched.isActive) {
        setLoginError('Akun ini telah dinonaktifkan oleh Administrator.');
        return;
      }

      // Authorize
      setCurrentUser(matched);
      setIsLoggedIn(true);
      localStorage.setItem('simahat_is_logged_in', 'true');
      localStorage.setItem('simahat_logged_user', JSON.stringify(matched));

      // Push audit
      pushAuditLog(matched.id, 'LOGIN_SUCCESS', `Berhasil masuk ke dashboard persuratan`, 'Autentikasi');
      triggerToast(`Selamat datang kembali, ${matched.name}!`, 'success');
      
      // Clear inputs
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError('Password yang Anda masukkan salah.');
    }
  };

  // Logout handler
  const handleLogout = () => {
    pushAuditLog(currentUser.id, 'LOGOUT_SUCCESS', `Keluar dari sistem secara aman`, 'Autentikasi');
    setIsLoggedIn(false);
    localStorage.removeItem('simahat_is_logged_in');
    localStorage.removeItem('simahat_logged_user');
    triggerToast('Anda telah sukses keluar dari sistem', 'indigo');
  };

  // Switch between user roles dynamically
  const handleSwitchUser = (userId: string) => {
    const targetUser = db.users.find(u => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('simahat_logged_user', JSON.stringify(targetUser));
      pushAuditLog(targetUser.id, 'PROFILE_SWITCHED', `Mengalihkan akses profil pengguna sebagai ${targetUser.name}`, 'Autentikasi');
      triggerToast(`Masuk sebagai ${targetUser.name} (${targetUser.role})`, 'indigo');
    }
    // Refresh
    setDb(getDB());
  };

  const markAllNotificationsAsRead = () => {
    const list = db.notifications.map(n => ({ ...n, isRead: true }));
    saveDB.notifications(list);
    setNotifications(list);
    triggerToast('Tandai semua notifikasi dibaca', 'indigo');
  };

  const clearNotifications = () => {
    saveDB.notifications([]);
    setNotifications([]);
    triggerToast('Membersihkan kotak notifikasi', 'success');
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('simahat_theme', newTheme);
    triggerToast(`Beralih ke mode ${newTheme === 'light' ? 'Terang' : 'Gelap'}`, 'indigo');
  };

  // Open QR verify routing
  const navigateToVerifyUniqueCode = (code: string) => {
    setVerificationCodeInput(code);
    setActiveTab('verify');
    triggerToast(`Memproses verifikasi kode surat: ${code}`, 'indigo');
  };

  // Fullscreen letter print handler
  const openPrintPreview = (letter: OutgoingLetter) => {
    setPrintLetter(letter);
  };

  // Math stats calculation helper
  const calculateStats = () => {
    const incomingCount = db.incomingLetters.length;
    const outgoingCount = db.outgoingLetters.length;
    
    const verifiedCount = db.outgoingLetters.filter(l => l.status === 'Terbit').length;
    const pendingReviewCount = db.outgoingLetters.filter(l => l.status === 'Menunggu Persetujuan').length;
    
    // Archives counting (status "Diarsipkan" on incoming, plus "Terbit" on outgoing)
    const archivesCount = db.incomingLetters.filter(l => l.status === 'Diarsipkan').length + verifiedCount;

    return {
      incomingCount,
      outgoingCount,
      totalCount: incomingCount + outgoingCount,
      verifiedCount,
      pendingReviewCount,
      archivesCount
    };
  };

  const stats = calculateStats();

  // Print Window Trigger
  const triggerNativeBrowserPrint = () => {
    window.print();
  };

  if (!isLoggedIn) {
    return (
      <div className={`${theme === 'dark' ? 'dark text-zinc-100 bg-zinc-950' : 'text-zinc-800 bg-zinc-50'} min-h-screen flex flex-col transition-colors duration-200 relative`}>
        <div className="mesh-bg"></div>

        {/* Global Toast Alerts in Login Page */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`fixed top-5 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
                toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400 backdrop-blur-md' : 
                toast.type === 'error' ? 'bg-red-500/90 text-white border-red-400 backdrop-blur-md' : 
                'bg-zinc-900/90 text-white border-blue-500/30 backdrop-blur-md'
              }`}
            >
              {toast.type === 'success' ? (
                <ClipboardCheck size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="font-medium">{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REUSED SKELETON WRAPPER */}
        <div className="min-h-screen flex flex-col justify-between transition-colors duration-200 lg:p-4">
          
          {/* HEADER TOP ROW ACTIONS */}
          <header className="liquid-glass lg:rounded-3xl p-4 px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-md mb-4 lg:mb-0">
            <div className="flex items-center gap-3">
              {/* Secondary school title breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-extrabold font-sans">
                <span className="truncate max-w-[200px] sm:max-w-none">{db.schoolSettings.name}</span>
                <ChevronRight size={12} className="text-zinc-500" />
                <span className="font-extrabold text-blue-600 dark:text-cyan-400">Autentikasi Masuk</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Realtime dynamic WIB Tick Indicator */}
              <div className="hidden md:flex items-center space-x-1.5 border border-zinc-250 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-950/20 px-2.5 py-1 rounded-full text-[10px] font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>{timeStr}</span>
              </div>

              {/* Theme Toggle Button */}
              <button 
                id="btn_toggle_theme_login"
                onClick={handleToggleTheme}
                className="p-2 border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 rounded-xl transition cursor-pointer text-zinc-700 dark:text-zinc-200"
                title="Silihkan Modus Warna"
              >
                {theme === 'light' ? (
                  <Moon size={16} />
                ) : (
                  <Sun size={16} className="text-yellow-400 animate-spin-slow" />
                )}
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-extrabold text-[10px] rounded-full">
                <span>STATUS: SECURE GATEWAY</span>
              </div>
            </div>
          </header>

          {/* MAIN LOGIN CARD CONTENT AREA */}
          <div className="flex-1 flex items-center justify-center py-8 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md liquid-glass rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

              {/* Header Brand */}
              <div className="text-center space-y-3 mb-8">
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-blue-500/20 mx-auto select-none">
                  SM
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white leading-tight">
                    Sistem Manajemen Surat (SIMAHAT)
                  </h2>
                  <p className="text-[10px] text-zinc-800 dark:text-zinc-200 font-extrabold uppercase tracking-widest mt-1">
                    SMP Islam Al Hikmah Mayong
                  </p>
                </div>
                <div className="h-[1px] w-12 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mt-4"></div>
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 font-bold">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">Username</label>
                  <input 
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    autoFocus
                    placeholder="Masukkan username (contoh: Luthfi)"
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 transition shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">Password</label>
                  <input 
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 transition shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 dark:from-blue-500 dark:to-cyan-400 dark:hover:from-blue-600 dark:hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer transform active:scale-98 transition duration-150 flex items-center justify-center gap-2 mt-2"
                >
                  <Lock size={13} />
                  <span>Masuk Sekarang</span>
                </button>
              </form>
            </motion.div>
          </div>

          {/* FOOTER */}
          <footer className="liquid-glass lg:rounded-t-3xl p-4 px-6 border-t border-zinc-200/50 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 select-none text-[10px] text-zinc-700 dark:text-zinc-300 font-mono text-center">
            <span>© 2026 SMP Islam Al Hikmah Mayong Jepara. Hak Cipta Dilindungi.</span>
            <span>
              Powered by <a href="https://educita.id" target="_blank" rel="noopener noreferrer" className="font-extrabold text-blue-600 dark:text-cyan-400 hover:underline">educita.id</a> -- <span className="font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300 font-serif">Muhammad Luthfi</span> v2026
            </span>
          </footer>

        </div>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'dark text-white' : 'text-zinc-800'}`}>
      <div className="mesh-bg"></div>
      
      {/* FULL A4 PRINT WRAPPER OVERLAY */}
      {printLetter && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/70 p-4 overflow-y-auto flex flex-col justify-start items-center print:bg-white print:p-0">
          
          {/* Printing Action Bar (Hidden during print) */}
          <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 text-white rounded-2xl w-full max-w-[210mm] p-4 mb-4 select-none shadow-2xl print:hidden">
            <div className="flex items-center gap-2">
              <Printer className="text-emerald-500 animate-pulse" size={20} />
              <div>
                <p className="font-bold text-sm">Dokumen Siap Cetak (A4 Standard)</p>
                <p className="text-[10px] text-zinc-400 font-mono">HASH: {printLetter.sha256Hash?.substring(0, 24)}...</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={triggerNativeBrowserPrint}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 px-4 py-2 text-xs font-bold rounded-xl text-white transform hover:-translate-y-0.5 active:translate-y-0 transition"
              >
                <Printer size={14} />
                <span>Cetak / Save PDF</span>
              </button>
              <button 
                onClick={() => setPrintLetter(null)}
                className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 text-xs font-bold rounded-xl text-zinc-300"
              >
                Kembali
              </button>
            </div>
          </div>

          {/* Letter PDF Canvas Sheet */}
          <div className="bg-white text-zinc-900 p-[20mm] shadow-2xl border border-zinc-100 w-full max-w-[210mm] min-h-[297mm] mx-auto print:border-none print:shadow-none print:p-0 flex flex-col relative overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
            
            {/* KOP SURAT */}
            <div className="flex items-center justify-center gap-4 border-b-4 border-double border-zinc-900 pb-4 mb-5 text-center">
              <img 
                src={db.schoolSettings.logoUrl} 
                alt="Logo Sekolah" 
                className="w-16 h-16 object-contain rounded-lg"
              />
              <div className="space-y-0.5">
                <h3 className="text-xs tracking-wider uppercase font-semibold text-zinc-500">YAYASAN AL HIKMAH MAYONG</h3>
                <h2 className="text-base font-extrabold tracking-tight text-zinc-900">SMP ISLAM AL HIKMAH MAYONG</h2>
                <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide">STATUS AKREDITASI A (SANGAT BAIK)</p>
                <p className="text-[8px] text-zinc-400 italic">
                  {db.schoolSettings.address} | Telp: {db.schoolSettings.phone}
                </p>
              </div>
            </div>

            {/* Nomor & Perihal */}
            <div className="space-y-4 text-xs leading-relaxed flex-1">
              <div className="text-center space-y-0.5">
                <h4 className="font-extrabold uppercase tracking-wider text-xs border-b border-zinc-300 w-max mx-auto pb-0.5">
                  {printLetter.category.toUpperCase()}
                </h4>
                <p className="text-[10px] font-mono text-zinc-500">Nomor: {printLetter.letterNumber}</p>
              </div>

              <div className="space-y-2 mt-4 text-[11px]">
                <div><b>Perihal:</b> {printLetter.subject}</div>
                <div><b>Tempat/Tujuan:</b> {printLetter.receiver}</div>
              </div>

              {/* Letter Paragraph Content */}
              <pre className="text-[11px] whitespace-pre-wrap leading-relaxed space-y-2 font-serif text-zinc-800 bg-zinc-50/20 p-4 rounded-xl border border-zinc-150 min-h-[220px] shadow-inner mt-4">
                {printLetter.fileContent}
              </pre>

              {/* Digital sign space */}
              <div className="mt-8 flex justify-end">
                <div className="w-56 text-center space-y-1 relative pr-4">
                  <p className="text-[10px]">Mayong, {printLetter.letterDate}</p>
                  <p className="text-[10px] font-bold">Kepala Sekolah,</p>
                  
                  {/* Stamp Overlay */}
                  <div className="relative h-20 w-44 mx-auto flex items-center justify-center">
                    <img 
                      src={db.signatureConfig.signatureImage} 
                      alt="Sign" 
                      className="absolute max-h-20 max-w-[120px] object-contain z-10"
                    />
                    <img 
                      src={db.signatureConfig.stempelImage} 
                      alt="Stamp" 
                      className="absolute max-h-20 max-w-[110px] object-contain select-none mix-blend-multiply opacity-85"
                      style={{ transform: 'translate(-12px, -22px)' }} // Replicates e-sign coordinates
                    />
                  </div>

                  <p className="text-[10px] font-bold underline leading-none">{db.schoolSettings.headmasterName}</p>
                  <p className="text-[8px] font-mono text-zinc-500">NIP. {db.schoolSettings.headmasterNip}</p>
                </div>
              </div>

              {/* QR validation footer */}
              <div className="mt-12 border-t border-zinc-200 pt-3 flex items-center gap-4 text-[10px] text-zinc-500">
                <div 
                  className="w-16 h-16 bg-white border border-zinc-200 p-0.5 rounded-lg flex-shrink-0"
                  dangerouslySetInnerHTML={{ __html: printLetter.qrCodeUrl ? printLetter.qrCodeUrl.replace('data:image/svg+xml;utf8,', '') : '' }}
                />
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-zinc-850">✓ DOKUMEN RESMI TERVERIFIKASI DIGITAL</p>
                  <p className="text-[7.5px] text-zinc-400">Verifikasi dokumen pemindaian QR ini valid terakreditasi lewat SIMAHAT SMP Islam Al Hikmah.</p>
                  <div className="font-mono text-[7px] truncate text-zinc-400 mt-0.5">
                    UUID: <b>{printLetter.uuid}</b> | HASH: <b>{printLetter.sha256Hash}</b>
                  </div>
                  <p className="text-[8px] text-blue-500 font-bold mt-0.5">
                    Kode Verifikasi: {printLetter.verificationCode}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SYSTEM NOTIFICATION FLOATER TOASTS */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className={`fixed bottom-6 right-6 z-55 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs max-w-sm ${
              toast.type === 'success' 
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/10' 
              : toast.type === 'indigo'
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/10' 
              : 'bg-red-500 text-white border-red-400 shadow-red-500/10'
            }`}
          >
            {toast.type === 'success' ? (
              <ClipboardCheck size={18} />
            ) : toast.type === 'indigo' ? (
              <Bell size={18} className="animate-bounce" />
            ) : (
              <AlertCircle size={18} />
            )}
            <span className="font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DASHBOARD CONTAINER SKELETON */}
      <div className="min-h-screen flex bg-transparent lg:p-4 lg:gap-4 transition-colors duration-200">
        
        {/* SIDEBAR NAVIGATION PANEL (HIDDEN ON MOBILE EXCEPT ACTIVE) */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 glass lg:rounded-3xl transform transition-transform duration-200
          lg:translate-x-0 lg:static lg:flex lg:flex-col lg:h-[calc(100vh-2rem)] flex-shrink-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Brand header */}
          <div className="p-5 border-b border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-base font-extrabold shadow-md shadow-blue-500/10 select-none">
                SM
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white leading-none">SIMAHAT</h1>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">SMP Al-Hikmah</span>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>

          {/* Current profile block */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/10 flex items-center gap-3">
            <img 
              src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=150"} 
              alt="Avatar Profile" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 object-cover rounded-full border border-zinc-200 dark:border-zinc-850"
            />
            <div className="min-w-0">
              <h4 className="font-bold text-xs truncate text-zinc-900 dark:text-white leading-tight">
                {currentUser.name.split(',')[0]}
              </h4>
              <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-purple-500 dark:text-purple-400 block mt-0.5">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-zinc-400 px-3 uppercase tracking-wider mb-2">Main Menu</div>
            
            <button 
              id="tab_dashboard"
              onClick={() => handleSwitchTab('dashboard')}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide sidebar-link ${activeTab === 'dashboard' ? 'active-link' : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard Pokok</span>
            </button>

            <button 
              id="tab_incoming"
              onClick={() => handleSwitchTab('incoming')}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide sidebar-link ${activeTab === 'incoming' ? 'active-link' : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Inbox size={16} />
              <span>Surat Masuk</span>
            </button>

            <button 
              id="tab_outgoing"
              onClick={() => handleSwitchTab('outgoing')}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide sidebar-link ${activeTab === 'outgoing' ? 'active-link' : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Send size={16} />
              <span>Surat Keluar</span>
            </button>

            <div className="text-[10px] font-bold text-zinc-400 px-3 uppercase tracking-wider pt-4 mb-2">Administrasi Verifikasi</div>

            <button 
              id="tab_templates"
              onClick={() => handleSwitchTab('templates')}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide sidebar-link ${activeTab === 'templates' ? 'active-link' : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <FileSignature size={16} />
              <span>Template Surat</span>
            </button>

            <button 
              id="tab_esign"
              onClick={() => handleSwitchTab('esign')}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide sidebar-link ${activeTab === 'esign' ? 'active-link' : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <FileText size={16} />
              <span>E-Signature Ttd</span>
            </button>

            <button 
              id="tab_verify"
              onClick={() => handleSwitchTab('verify')}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide sidebar-link ${activeTab === 'verify' ? 'active-link' : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <QrCode size={16} />
              <span>QR Verification</span>
            </button>

            <div className="text-[10px] font-bold text-zinc-400 px-3 uppercase tracking-wider pt-4 mb-2">Manajemen Lembaga</div>

            <button 
              id="tab_users"
              onClick={() => handleSwitchTab('users')}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide sidebar-link ${activeTab === 'users' ? 'active-link' : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Users size={16} />
              <span>Kelola Staf RBAC</span>
            </button>

            <button 
              id="tab_audit"
              onClick={() => handleSwitchTab('audit')}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide sidebar-link ${activeTab === 'audit' ? 'active-link' : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <History size={16} />
              <span>Audit Log Trail</span>
            </button>

            <button 
              id="tab_settings"
              onClick={() => handleSwitchTab('settings')}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide sidebar-link ${activeTab === 'settings' ? 'active-link' : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Settings size={16} />
              <span>Setting Sekolah</span>
            </button>
          </nav>

          <div className="p-3 border-t border-zinc-150 dark:border-zinc-850 bg-zinc-50/25 dark:bg-zinc-950/15 rounded-b-3xl flex justify-between items-center select-none">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono font-bold">SIMAHAT v1.0.3</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-150 cursor-pointer"
              title="Log Out dari Sistem"
            >
              <LogOut size={11} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile navigation drawer */}
        {isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-zinc-950/60 backdrop-blur-xs lg:hidden"
          ></div>
        )}

        {/* MAIN BODY SKELETON */}
        <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto lg:space-y-4">
          
          {/* HEADER TOP ROW ACTIONS */}
          <header className="liquid-glass lg:rounded-3xl p-4 px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-sm mb-4 lg:mb-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                <Menu size={18} />
              </button>
              
              {/* Secondary school title breadcrumb */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 font-medium font-sans">
                <span>{db.schoolSettings.name}</span>
                <ChevronRight size={12} />
                <span className="font-bold text-zinc-700 dark:text-white capitalize">{activeTab}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Realtime dynamic Jakarta / UTC Tick Indicator */}
              <div className="hidden md:flex items-center space-x-1.5 border border-zinc-200/50 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-950/20 px-2.5 py-1 rounded-full text-[10px] font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>{timeStr}</span>
              </div>

              {/* Theme Toggle Button */}
              <button 
                id="btn_toggle_theme"
                onClick={handleToggleTheme}
                className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                title="Silihkan Modus Warna"
              >
                {theme === 'light' ? (
                  <Moon size={16} className="text-zinc-650" />
                ) : (
                  <Sun size={16} className="text-yellow-400 animate-spin-slow" />
                )}
              </button>

              {/* Notifications bell floating tray menu */}
              <div className="relative">
                <button 
                  id="btn_notif_bell"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition relative"
                >
                  <Bell size={16} className="text-zinc-650" />
                  {db.notifications.some(n => !n.isRead) && (
                    <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotifOpen && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="absolute right-0 top-11 z-[50] w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden text-xs"
                    >
                      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20">
                        <span className="font-bold text-zinc-800 dark:text-zinc-300">Pemberitahuan Sistem</span>
                        <div className="flex gap-2">
                          <button onClick={markAllNotificationsAsRead} className="text-[9px] text-blue-500 font-bold hover:underline">Tandai Dibaca</button>
                          <button onClick={clearNotifications} className="text-[9px] text-zinc-400 hover:underline">Clear</button>
                        </div>
                      </div>

                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
                        {db.notifications.length === 0 ? (
                          <div className="p-8 text-center text-zinc-400 italic">
                            Kotak notifikasi kosong.
                          </div>
                        ) : (
                          db.notifications.map((not) => (
                            <div key={not.id} className={`p-3 space-y-1 transition ${not.isRead ? 'opacity-70' : 'bg-blue-500/5'}`}>
                              <div className="flex justify-between font-bold">
                                <span>{not.title}</span>
                                <span className="text-[8px] text-zinc-400 font-mono">{not.createdAt.split('T')[1].substring(0, 5)}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">{not.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mini Swapper Indicator */}
              <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] rounded-full">
                <span>RBAC:</span>
                <span className="uppercase text-[9px] tracking-wide">{currentUser.role}</span>
              </div>
            </div>
          </header>

          {/* MAIN DYNAMIC TAB CONTENT BODY AREA */}
          <div className="flex-1 p-6 space-y-6">
            
            {activeTab === 'dashboard' && (
              <div id="dashboard_tab_root" className="space-y-6">
                
                {/* School branding Banner (Glassmorphism) */}
                <div className="glass rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <img 
                    src={db.schoolSettings.logoUrl} 
                    alt="Logo Al Hikmah" 
                    className="w-20 h-20 object-contain rounded-2xl filter drop-shadow-md bg-white p-1 select-none"
                  />
                  <div className="space-y-1.5 flex-1 text-center md:text-left">
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                      Sistem Manajemen Surat (SIMAHAT)
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xl">
                      E-Office Otonom Resmi untuk tata kelola persuratan, draf referensi berkas dinas, tanda tangan elektronik ter-kualifikasi, disposisi terpusat, dan validasi luring QR Code bagi unit {db.schoolSettings.name}
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-[10px] text-zinc-400">
                      <span>NPSN: <b>20399120</b> (Akreditasi A)</span>
                      <span className="text-zinc-300">•</span>
                      <span>Kepala Sekolah: <b>{db.schoolSettings.headmasterName}</b></span>
                    </div>
                  </div>
                </div>

                {/* Stat Cards - Grid of 6 as specified */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Card 1 */}
                  <div 
                    onClick={() => setActiveTab('incoming')}
                    className="glass rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Surat Masuk</div>
                    <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-2 mb-1">{stats.incomingCount}</div>
                    <div className="text-[9px] text-blue-500 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full w-max">Logistik Inflow</div>
                  </div>
                  {/* Card 2 */}
                  <div 
                    onClick={() => setActiveTab('outgoing')}
                    className="glass rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Surat Keluar</div>
                    <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-2 mb-1">{stats.outgoingCount}</div>
                    <div className="text-[9px] text-indigo-500 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full w-max">Outflow</div>
                  </div>
                  {/* Card 3 */}
                  <div className="glass rounded-2xl p-4 shadow-sm">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Bulan Ini</div>
                    <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-2 mb-1">5 Surat</div>
                    <div className="text-[9px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full w-max">Mei 2026</div>
                  </div>
                  {/* Card 4 */}
                  <div className="glass rounded-2xl p-4 shadow-sm">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Menunggu Review</div>
                    <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-2 mb-1">{stats.pendingReviewCount}</div>
                    <div className="text-[9px] text-orange-500 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full w-max">Butuh Ttd</div>
                  </div>
                  {/* Card 5 */}
                  <div className="glass rounded-2xl p-4 shadow-sm">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Terverifikasi</div>
                    <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-2 mb-1">{stats.verifiedCount}</div>
                    <div className="text-[9px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full w-max">Aktif E-Sign</div>
                  </div>
                  {/* Card 6 */}
                  <div className="glass rounded-2xl p-4 shadow-sm">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Arsip Digital</div>
                    <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-2 mb-1">{stats.archivesCount}</div>
                    <div className="text-[9px] text-teal-500 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-full w-max">Secure Stored</div>
                  </div>
                </div>

                {/* Integration of dynamic custom Area Line SVG Charts */}
                <DashboardCharts />

                {/* Sub row with full width notifications list */}
                <div className="grid grid-cols-1 gap-6">

                  {/* Notification List Panel */}
                  <div className="glass rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-2">
                      <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-bold text-xs">
                        <Bell size={16} className="text-blue-500" />
                        <span>Aktivitas Sistem Terkini</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Total: {db.notifications.length} Info</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {db.notifications.map((not) => (
                        <div key={not.id} className="flex items-start gap-2.5 p-2.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/40 dark:border-zinc-850 rounded-xl">
                          <span className={`w-2 h-2 rounded-full mt-1.5 ${not.isRead ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-emerald-500 animate-pulse'}`}></span>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex justify-between text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                              <span>{not.title}</span>
                              <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-mono italic">{not.createdAt.split('T')[0]}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal truncate">{not.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {activeTab === 'incoming' && (
              <SuratMasuk 
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
                currentUserName={currentUser.name}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === 'outgoing' && (
              <SuratKeluar 
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
                currentUserName={currentUser.name}
                triggerToast={triggerToast}
                openPrintPreview={openPrintPreview}
              />
            )}

            {activeTab === 'templates' && (
              <TemplateSurat 
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
                currentUserName={currentUser.name}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === 'esign' && (
              <ESignature 
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === 'verify' && (
              <QRVerification 
                initialCode={verificationCodeInput}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === 'users' && (
              <UserManagement 
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
                switchActiveUser={handleSwitchUser}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogView 
                currentUserRole={currentUser.role}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === 'settings' && (
              <SchoolSettings 
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
                triggerToast={triggerToast}
              />
            )}

          </div>

          {/* Humble credit footer as requested: Architecture Honesty with liquid glass layout */}
          <footer className="liquid-glass lg:rounded-t-3xl sticky bottom-0 z-30 mt-auto p-4 px-6 border-t border-zinc-200/50 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 select-none text-[10px] text-zinc-700 dark:text-zinc-200 font-mono text-center">
            <span>© 2026 SMP Islam Al Hikmah Mayong Jepara. Hak Cipta Dilindungi.</span>
            <span>
              Powered by <a href="https://educita.id" target="_blank" rel="noopener noreferrer" className="font-extrabold text-blue-600 dark:text-cyan-400 hover:underline">educita.id</a> -- <span className="font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300 font-serif">Muhammad Luthfi</span> v2026
            </span>
          </footer>

        </main>

      </div>

    </div>
  );
}
