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
import DocQRCode from './components/DocQRCode';

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
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
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

  // Listen for scanned QR verification routes or deep links in URL
  useEffect(() => {
    const checkUrlForCode = () => {
      const searchParams = new URLSearchParams(window.location.search);
      let code = searchParams.get('code');
      if (!code && window.location.hash) {
        const questionIdx = window.location.hash.indexOf('?');
        if (questionIdx !== -1) {
          const hashParams = new URLSearchParams(window.location.hash.substring(questionIdx));
          code = hashParams.get('code');
        }
      }
      if (code) {
        const cleanedCode = code.trim().toUpperCase();
        setVerificationCodeInput(cleanedCode);
        setActiveTab('verify');
        triggerToast(`Membuka Verifikasi Kode: ${cleanedCode}`, 'indigo');
      }
    };
    checkUrlForCode();
    window.addEventListener('hashchange', checkUrlForCode);
    return () => window.removeEventListener('hashchange', checkUrlForCode);
  }, []);

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
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
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
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-350 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 transition shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">Password</label>
                  <input 
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-350 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 transition shadow-sm"
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
    <div className={`${theme === 'dark' ? 'dark text-zinc-100 bg-zinc-950' : 'text-zinc-800 bg-zinc-50'} min-h-screen flex flex-col transition-colors duration-200 relative`}>
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
                <DocQRCode 
                  value={`${window.location.origin}/#verify?code=${printLetter.verificationCode}`} 
                  size={64} 
                  className="border border-zinc-200"
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
            
            {activeTab === 'dashboard' && currentUser.role === 'Kepala Sekolah' && (
              <div id="dashboard_tab_kepsek" className="space-y-6">
                
                {/* Branding Banner with Signature Status */}
                <div className="glass rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-6 border border-zinc-250 dark:border-zinc-800">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <img 
                    src={db.schoolSettings.logoUrl} 
                    alt="Logo Al Hikmah" 
                    className="w-20 h-20 object-contain rounded-2xl filter drop-shadow-md bg-white p-1"
                  />
                  <div className="space-y-2 flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <span className="text-xs bg-orange-500/15 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full font-extrabold w-max mx-auto md:mx-0">Sertifikat Digital Aktif</span>
                      <span className="text-xs bg-zinc-150 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-3 py-1 rounded-full font-extrabold w-max mx-auto md:mx-0 font-mono">NIP: {db.schoolSettings.headmasterNip}</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                      Selamat Datang Kembali, {db.schoolSettings.headmasterName}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-xl">
                      Anda berada di Portal Komando Kepala Sekolah. Di sini Anda dapat memverifikasi draf surat dinas sebelum dibubuhi tanda tangan elektronik (TTE) sah, menerbitkan QR code unik, serta melacak disposisi surat masuk.
                    </p>
                  </div>
                </div>

                {/* Dashboard Stats tailored for Kepala Sekolah */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div 
                    onClick={() => setActiveTab('esign')}
                    className="glass rounded-2xl p-5 hover:shadow-md transition cursor-pointer border border-zinc-200 dark:border-zinc-800/80 hover:border-orange-500/30"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Menunggu TTE</span>
                      <Clock size={16} className="text-orange-500" />
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white mt-3">{stats.pendingReviewCount}</div>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500">Surat keluar butuh paraf/tandatangan</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('incoming')}
                    className="glass rounded-2xl p-5 hover:shadow-md transition cursor-pointer border border-zinc-200 dark:border-zinc-800/80 hover:border-blue-500/30"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Surat Masuk Baru</span>
                      <Inbox size={16} className="text-blue-500" />
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white mt-3">
                      {db.incomingLetters.filter(l => l.status === 'Diterima').length}
                    </div>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500">Belum dididposisikan ke staf</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('outgoing')}
                    className="glass rounded-2xl p-5 hover:shadow-md transition cursor-pointer border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest">TTE Sukses Terbit</span>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white mt-3">{stats.verifiedCount}</div>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500">Arsip surat keluar ttd digital aktif</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('audit')}
                    className="glass rounded-2xl p-5 hover:shadow-md transition cursor-pointer border border-zinc-200 dark:border-zinc-800/80 hover:border-indigo-500/30"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Log Aktivitas</span>
                      <History size={16} className="text-indigo-500" />
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white mt-3">
                      {db.auditLogs.filter(l => l.role === 'Kepala Sekolah').length}
                    </div>
                    <span className="text-[10px] text-zinc-455 dark:text-zinc-495">Tindakan Anda dalam sistem</span>
                  </div>
                </div>

                {/* Main Work Queues */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Queue 1: Letters awaiting Digital Signature */}
                  <div className="glass rounded-3xl p-5 border border-zinc-250 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg">
                          <FileSignature size={15} />
                        </span>
                        <div>
                          <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white">Butuh Tanda Tangan Elektronik (TTE)</h3>
                          <p className="text-[9px] text-zinc-500">Tinjau draf materi surat dan bubuhkan tanda tangan digital Anda</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-full font-mono">
                        {db.outgoingLetters.filter(l => l.status === 'Menunggu Persetujuan').length} Berkas
                      </span>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1 flex-1">
                      {db.outgoingLetters.filter(l => l.status === 'Menunggu Persetujuan').length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                          <CheckCircle2 size={36} className="text-emerald-500 mx-auto animate-pulse" />
                          <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Seluruh Berkas Telah Tuntas!</p>
                          <p className="text-[10px] text-zinc-500">Tidak ada pengajuan surat keluar baru yang butuh persetujuan Anda saat ini.</p>
                        </div>
                      ) : (
                        db.outgoingLetters.filter(l => l.status === 'Menunggu Persetujuan').map(letter => (
                          <div 
                            key={letter.id} 
                            className="p-3 bg-zinc-50/50 dark:bg-zinc-1000/25 border border-zinc-200 dark:border-zinc-850 rounded-xl hover:border-orange-500/20 transition flex justify-between items-center gap-4"
                          >
                            <div className="min-w-0 space-y-1 flex-1">
                              <div className="text-[9px] font-mono bg-zinc-200/50 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-650 dark:text-zinc-400 w-max truncate">
                                No: {letter.letterNumber}
                              </div>
                              <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate">{letter.title}</h4>
                              <p className="text-[10px] text-zinc-500 truncate">Hal: {letter.subject}</p>
                            </div>
                            <button 
                              onClick={() => {
                                setActiveTab('esign');
                                triggerToast(`Tinjau draf surat: ${letter.title}`, 'indigo');
                              }}
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition"
                            >
                              <span>Tinjau</span>
                              <ChevronRight size={10} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Queue 2: Incoming Letters needing Disposition */}
                  <div className="glass rounded-3xl p-5 border border-zinc-250 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                          <Inbox size={15} />
                        </span>
                        <div>
                          <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white">Surat Masuk Belum Didisposisikan</h3>
                          <p className="text-[9px] text-zinc-500">Buat disposisi delegasi instruksi kepada jajaran staf / TU</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-mono">
                        {db.incomingLetters.filter(l => l.status === 'Diterima').length} Berkas
                      </span>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1 flex-1">
                      {db.incomingLetters.filter(l => l.status === 'Diterima').length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                          <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                          <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Disposisi Selesai!</p>
                          <p className="text-[10px] text-zinc-500">Semua surat masuk telah Anda evaluasi dan didisposisikan dengan aman.</p>
                        </div>
                      ) : (
                        db.incomingLetters.filter(l => l.status === 'Diterima').map(letter => (
                          <div 
                            key={letter.id} 
                            className="p-3 bg-zinc-50/50 dark:bg-zinc-1000/25 border border-zinc-200 dark:border-zinc-850 rounded-xl hover:border-blue-500/20 transition flex justify-between items-center gap-4"
                          >
                            <div className="min-w-0 space-y-1 flex-1">
                              <div className="text-[9px] text-blue-500 dark:text-blue-400 font-extrabold tracking-wide uppercase">{letter.category}</div>
                              <h4 className="font-bold text-xs text-zinc-850 dark:text-zinc-200 truncate">{letter.subject}</h4>
                              <p className="text-[10px] text-zinc-500 truncate font-mono">Dari: {letter.sender}</p>
                            </div>
                            <button 
                              onClick={() => {
                                setActiveTab('incoming');
                                triggerToast(`Membuka Lembar Disposisi Surat Masuk`, 'indigo');
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition"
                            >
                              <span>Disposisi</span>
                              <ChevronRight size={10} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Principal Quick Actions Tray */}
                <div className="glass rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-[10px] font-bold text-zinc-400 mb-3 uppercase tracking-wider block">Jalan Pintas Aksi Cepat</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
                    <button 
                      onClick={() => setActiveTab('esign')}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl hover:border-orange-500/40 hover:bg-orange-500/5 transition cursor-pointer flex flex-col items-center gap-1 w-full"
                    >
                      <FileSignature size={18} className="text-orange-500" />
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">Editor E-Signature TTE</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('incoming')}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl hover:border-blue-500/40 hover:bg-blue-500/5 transition cursor-pointer flex flex-col items-center gap-1 w-full"
                    >
                      <Inbox size={18} className="text-blue-500" />
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">Buka Lembar Disposisi</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('verify')}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl hover:border-emerald-500/40 hover:bg-emerald-500/5 transition cursor-pointer flex flex-col items-center gap-1 w-full"
                    >
                      <QrCode size={18} className="text-emerald-500" />
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">Pindai Verifikasi QR</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl hover:border-indigo-500/40 hover:bg-indigo-500/5 transition cursor-pointer flex flex-col items-center gap-1 w-full"
                    >
                      <Settings size={18} className="text-indigo-500" />
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">Kop & Identitas Sekolah</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'dashboard' && currentUser.role === 'Tata Usaha' && (
              <div id="dashboard_tab_tatausaha" className="space-y-6">
                
                {/* Branding Banner for TU */}
                <div className="glass rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-6 border border-zinc-250 dark:border-zinc-800">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <img 
                    src={db.schoolSettings.logoUrl} 
                    alt="Logo Al Hikmah" 
                    className="w-20 h-20 object-contain rounded-2xl filter drop-shadow-md bg-white p-1"
                  />
                  <div className="space-y-2 flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <span className="text-xs bg-purple-500/15 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full font-extrabold w-max mx-auto md:mx-0">Kaur Administrasi Tata Usaha</span>
                      <span className="text-xs bg-zinc-150 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-3 py-1 rounded-full font-extrabold w-max mx-auto md:mx-0 font-mono">Ruang TU SIMAHAT</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                      Selamat Kerja Administrasi, {currentUser.name}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-xl">
                      Anda berada di Ruang Pusat Kemudi Tata Usaha. Kelola nomor urut agenda, draf naskah keluar dari ribuan template siap pakai, kearsipan logistik berkas masuk, serta kirim permohonan tanda tangan elektronik langsung ke Kepala Sekolah.
                    </p>
                  </div>
                </div>

                {/* Dashboard Stats tailored for Tata Usaha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div 
                    onClick={() => setActiveTab('outgoing')}
                    className="glass rounded-2xl p-5 hover:shadow-md transition cursor-pointer border border-zinc-200 dark:border-zinc-800/80 hover:border-purple-500/30"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Draf Sedang Direvisi</span>
                      <FileText size={16} className="text-purple-500" />
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white mt-3">
                      {db.outgoingLetters.filter(l => l.status === 'Draft' || l.status === 'Ditolak').length}
                    </div>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500">Draf surat keluar internal TU</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('outgoing')}
                    className="glass rounded-2xl p-5 hover:shadow-md transition cursor-pointer border border-zinc-200 dark:border-zinc-800/80 hover:border-amber-500/30"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Diajukan ke Kepsek</span>
                      <Clock size={16} className="text-amber-500" />
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white mt-3">{stats.pendingReviewCount}</div>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500">Surat menunggu persetujuan (TTE)</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('templates')}
                    className="glass rounded-2xl p-5 hover:shadow-md transition cursor-pointer border border-zinc-200 dark:border-zinc-800/80 hover:border-blue-500/30"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Template Tersedia</span>
                      <FileSignature size={16} className="text-blue-500" />
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white mt-3">{db.templates.length}</div>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500">Format surat baku dinas aktif</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('incoming')}
                    className="glass rounded-2xl p-5 hover:shadow-md transition cursor-pointer border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Buku Agenda Surat</span>
                      <Inbox size={16} className="text-emerald-500" />
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white mt-3">{stats.incomingCount}</div>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500">Total surat masuk terdaftar</span>
                  </div>
                </div>

                {/* Main TU Queues */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Column 1: TU Active / Rejected Drafts */}
                  <div className="glass rounded-3xl p-5 border border-zinc-250 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg">
                          <FileText size={15} />
                        </span>
                        <div>
                          <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white">Kelola Draf & Revisi Surat</h3>
                          <p className="text-[9px] text-zinc-500">Ajukan draf surat baru untuk ditandatangani Kepala Sekolah</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full font-mono">
                        {db.outgoingLetters.filter(l => l.status === 'Draft' || l.status === 'Ditolak').length} Berkas
                      </span>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1 flex-1">
                      {db.outgoingLetters.filter(l => l.status === 'Draft' || l.status === 'Ditolak').length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                          <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                          <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Draf Selesai Diajukan!</p>
                          <p className="text-[10px] text-zinc-500">Tidak ada draf yang mangkrak atau ditolak. Semua surat keluar siap terbit.</p>
                          <button 
                            onClick={() => {
                              setActiveTab('outgoing');
                              triggerToast('Membuka tab administrasi surat keluar baru!', 'indigo');
                            }}
                            className="text-xs text-blue-500 font-extrabold hover:underline"
                          >
                            + Buat Draf Baru
                          </button>
                        </div>
                      ) : (
                        db.outgoingLetters.filter(l => l.status === 'Draft' || l.status === 'Ditolak').map(letter => (
                          <div 
                            key={letter.id} 
                            className={`p-3 border rounded-xl transition flex justify-between items-center gap-4 ${letter.status === 'Ditolak' ? 'bg-red-500/5 border-red-500/20' : 'bg-zinc-50/50 dark:bg-zinc-1000/25 border-zinc-200/50 dark:border-zinc-850'}`}
                          >
                            <div className="min-w-0 space-y-1 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${letter.status === 'Ditolak' ? 'bg-red-500/10 text-red-650' : 'bg-purple-500/10 text-purple-650'}`}>
                                  {letter.status}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono">ID: {letter.id}</span>
                              </div>
                              <h4 className="font-bold text-xs text-zinc-850 dark:text-zinc-200 truncate">{letter.title}</h4>
                              {letter.rejectionNote && (
                                <p className="text-[10px] text-red-600 dark:text-red-400 italic truncate">Alasan: {letter.rejectionNote}</p>
                              )}
                            </div>
                            <button 
                              onClick={() => {
                                setActiveTab('outgoing');
                                triggerToast(`Memulai edit draf surat: ${letter.title}`, 'indigo');
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition"
                            >
                              <span>Edit Draf</span>
                              <ChevronRight size={10} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 2: Quick Template Usage */}
                  <div className="glass rounded-3xl p-5 border border-zinc-250 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                          <FileSignature size={15} />
                        </span>
                        <div>
                          <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white">Gunakan Template Baku</h3>
                          <p className="text-[9px] text-zinc-500">Pilih format kop & naskah untuk pendaftaran instant</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-mono">
                        {db.templates.length} Pilihan
                      </span>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1 flex-1">
                      {db.templates.map(tpl => (
                        <div 
                          key={tpl.id} 
                          className="p-3 bg-zinc-50/50 dark:bg-zinc-1000/25 border border-zinc-200 dark:border-zinc-850 rounded-xl hover:border-blue-500/25 transition space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">
                              {tpl.code}
                            </span>
                            <span className="text-[8px] text-zinc-400">Pembaruan: {tpl.updatedBy.split(',')[0]}</span>
                          </div>
                          <div className="font-bold text-xs text-zinc-850 dark:text-zinc-200">{tpl.name}</div>
                          <button 
                            onClick={() => {
                              setActiveTab('templates');
                              triggerToast(`Memuat template: ${tpl.name}`, 'indigo');
                            }}
                            className="w-full py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-extrabold text-zinc-700 dark:text-zinc-300 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Gunakan Format Ini</span>
                            <ChevronRight size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Tata Usaha Quick Actions Tray */}
                <div className="glass rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-[10px] font-bold text-zinc-400 mb-3 uppercase tracking-wider block">Jalan Pintas Administrasi Fast-Track</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
                    <button 
                      onClick={() => setActiveTab('outgoing')}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl hover:border-purple-500/40 hover:bg-purple-500/5 transition cursor-pointer flex flex-col items-center gap-1 w-full"
                    >
                      <Send size={18} className="text-purple-500" />
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">Kirim Permohonan TTE</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('incoming')}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl hover:border-emerald-500/40 hover:bg-emerald-500/5 transition cursor-pointer flex flex-col items-center gap-1 w-full"
                    >
                      <Inbox size={18} className="text-emerald-500" />
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">Catat Agenda Surat Masuk</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('templates')}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl hover:border-blue-500/40 hover:bg-blue-500/5 transition cursor-pointer flex flex-col items-center gap-1 w-full"
                    >
                      <FileSignature size={18} className="text-blue-500" />
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">Kelola Template Surat</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('verify')}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl hover:border-zinc-500/40 hover:bg-zinc-500/5 transition cursor-pointer flex flex-col items-center gap-1 w-full"
                    >
                      <QrCode size={18} className="text-zinc-500" />
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">Pindai Verifikasi QR</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'dashboard' && (currentUser.role === 'Super Admin' || currentUser.role === 'Operator') && (
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
                onDatabaseUpdate={() => setDb(getDB())}
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
