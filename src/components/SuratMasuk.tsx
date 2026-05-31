/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  IncomingLetter, 
  Disposition, 
  UserRole 
} from '../types';
import { 
  getDB, 
  saveDB, 
  pushAuditLog, 
  pushNotification 
} from '../db';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Download, 
  Send, 
  Trash2, 
  Edit3, 
  X, 
  Clock, 
  Briefcase, 
  Paperclip,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuratMasukProps {
  currentUserId: string;
  currentUserRole: UserRole;
  currentUserName: string;
  triggerToast: (msg: string, type: 'success' | 'indigo' | 'error') => void;
}

export default function SuratMasuk({ currentUserId, currentUserRole, currentUserName, triggerToast }: SuratMasukProps) {
  const [db, setDb] = useState(getDB());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDispOpen, setIsDispOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<IncomingLetter | null>(null);

  // Form State
  const [agendaNumber, setAgendaNumber] = useState('');
  const [letterNumber, setLetterNumber] = useState('');
  const [letterDate, setLetterDate] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Kedinasan');
  const [attachment, setAttachment] = useState('Nihil');
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');

  // Disposition Form State
  const [dispReceiver, setDispReceiver] = useState('Wakaseks / Urusan Kurikulum');
  const [dispNote, setDispNote] = useState('');
  const [dispStatus, setDispStatus] = useState<'Penting' | 'Biasa' | 'Segera' | 'Rahasia'>('Segera');

  // Drag and drop or upload file state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const refreshState = () => {
    setDb(getDB());
  };

  const categories = ['Semua', 'Kedinasan', 'Undangan Resmi', 'Koordinasi Yayasan', 'Organisasi Siswa', 'Lain-lain'];
  const statusOptions = ['Semua', 'Diterima', 'Didisposisikan', 'Diarsipkan'];

  // Handle Create or Update
  const handleSaveLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterNumber || !sender || !subject) {
      triggerToast('Lengkapi nomor surat, pengirim, dan perihal!', 'error');
      return;
    }

    const currentLetters = [...db.incomingLetters];

    if (isEditing) {
      const index = currentLetters.findIndex(l => l.id === editId);
      if (index !== -1) {
        const updated = {
          ...currentLetters[index],
          agendaNumber,
          letterNumber,
          letterDate,
          receivedDate,
          sender,
          subject,
          category,
          attachment,
          fileContent: fileContent || currentLetters[index].fileContent
        };
        currentLetters[index] = updated;
        saveDB.incomingLetters(currentLetters);
        pushAuditLog(currentUserId, 'UPDATE_SURAT_MASUK', `Memperbarui surat masuk no. ${letterNumber}`, 'Surat Masuk');
        triggerToast('Surat masuk berhasil diperbarui!', 'success');
      }
    } else {
      const generatedAgenda = agendaNumber || `${String(currentLetters.length + 1).padStart(3, '0')}/SM/SMPI-AH/${new Date().getFullYear()}`;
      const newLetter: IncomingLetter = {
        id: `in-${Date.now()}`,
        agendaNumber: generatedAgenda,
        letterNumber,
        letterDate: letterDate || new Date().toISOString().split('T')[0],
        receivedDate: receivedDate || new Date().toISOString().split('T')[0],
        sender,
        subject,
        category,
        attachment,
        fileContent: fileContent || 'Dokumen lampiran teks korespondensi dinas resmi.',
        status: 'Diterima',
        createdAt: new Date().toISOString()
      };
      const updated = [newLetter, ...currentLetters];
      saveDB.incomingLetters(updated);
      pushAuditLog(currentUserId, 'CREATE_SURAT_MASUK', `Mencatat surat masuk baru no. ${letterNumber}`, 'Surat Masuk');
      pushNotification('Surat Masuk Baru', `Surat dari ${sender} perihal ${subject} telah dicatatkan.`, 'info');
      triggerToast('Surat masuk baru berhasil ditambahkan!', 'success');
    }

    resetForm();
    setIsAddOpen(false);
    refreshState();
  };

  const resetForm = () => {
    setAgendaNumber('');
    setLetterNumber('');
    setLetterDate('');
    setReceivedDate('');
    setSender('');
    setSubject('');
    setCategory('Kedinasan');
    setAttachment('Nihil');
    setFileContent('');
    setIsEditing(false);
    setEditId('');
    setUploadedFileName('');
    setUploadProgress(null);
  };

  const openEdit = (letter: IncomingLetter) => {
    setAgendaNumber(letter.agendaNumber);
    setLetterNumber(letter.letterNumber);
    setLetterDate(letter.letterDate);
    setReceivedDate(letter.receivedDate);
    setSender(letter.sender);
    setSubject(letter.subject);
    setCategory(letter.category);
    setAttachment(letter.attachment);
    setFileContent(letter.fileContent || '');
    setIsEditing(true);
    setEditId(letter.id);
    setIsAddOpen(true);
  };

  const handleDelete = (id: string, number: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus surat masuk no. ${number}?`)) {
      const filtered = db.incomingLetters.filter(l => l.id !== id);
      saveDB.incomingLetters(filtered);
      
      // Clean up depositions associated
      const filteredDisp = db.dispositions.filter(d => d.letterId !== id);
      saveDB.dispositions(filteredDisp);

      pushAuditLog(currentUserId, 'DELETE_SURAT_MASUK', `Menghapus catatan surat masuk no. ${number}`, 'Surat Masuk');
      triggerToast('Surat masuk berhasil dihapus!', 'error');
      refreshState();
    }
  };

  const handleArchive = (letter: IncomingLetter) => {
    const currentLetters = [...db.incomingLetters];
    const index = currentLetters.findIndex(l => l.id === letter.id);
    if (index !== -1) {
      currentLetters[index].status = 'Diarsipkan';
      saveDB.incomingLetters(currentLetters);
      pushAuditLog(currentUserId, 'ARCHIVE_SURAT_MASUK', `Mengarsipkan surat masuk no. ${letter.letterNumber}`, 'Surat Masuk');
      triggerToast('Surat dialihkan ke Arsip Digital.', 'success');
      refreshState();
    }
  };

  // Drag and Drop simulated file upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateUpload(files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateUpload(files[0].name);
    }
  };

  const simulateUpload = (name: string) => {
    setUploadedFileName(name);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p === null) return p;
        if (p >= 100) {
          clearInterval(interval);
          triggerToast(`File PDF ${name} berhasil diunggah!`, 'success');
          // Dummy text extraction
          setFileContent(`[EKSTRAKSI SISTEM OCR - DOKUMEN ${name.toUpperCase()}]\n---------------------------------------\nSurat kedinasan resmi mengenai agenda koordinasi internal SMP Islam Al Hikmah Mayong. Semua butir poin agenda harap diperiksa oleh unit tata usaha dan diproses segera sejalan kebijakan instansi.`);
          return 100;
        }
        return p + 30;
      });
    }, 200);
  };

  // Submit Disposition
  const handleSaveDisposition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter) return;

    const newDisp: Disposition = {
      id: `disp-${Date.now()}`,
      letterId: selectedLetter.id,
      senderId: currentUserId,
      senderName: currentUserName,
      receiverRole: dispReceiver,
      note: dispNote || 'Mohon ditindaklanjuti segera sebagaimana perihal surat terkait.',
      date: new Date().toISOString().split('T')[0],
      status: dispStatus
    };

    const currentDisps = [...db.dispositions];
    saveDB.dispositions([newDisp, ...currentDisps]);

    // Update Letter status to "Didisposisikan"
    const currentLetters = [...db.incomingLetters];
    const index = currentLetters.findIndex(l => l.id === selectedLetter.id);
    if (index !== -1) {
      currentLetters[index].status = 'Didisposisikan';
      saveDB.incomingLetters(currentLetters);
    }

    pushAuditLog(currentUserId, 'DISPOSITION_SURAT_MASUK', `Menerbitkan instruksi disposisi surat no. ${selectedLetter.letterNumber} ke ${dispReceiver}`, 'Disposisi');
    pushNotification('Instruksi Disposisi', `Disposisi surat dari ${selectedLetter.sender} didelegasikan ke ${dispReceiver}.`, 'warning');
    
    triggerToast('Tembusan disposisi berhasil terkirim!', 'success');
    setIsDispOpen(false);
    setDispNote('');
    refreshState();
    
    // Close detail too
    setIsDetailOpen(false);
  };

  // Filters
  const filteredLetters = db.incomingLetters.filter(l => {
    const matchesSearch = 
      l.letterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.agendaNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'Semua' || l.category === filterCategory;
    const matchesStatus = filterStatus === 'Semua' || l.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Diterima': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Didisposisikan': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Diarsipkan': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Segera': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Penting': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Biasa': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Rahasia': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div id="suratmasuk_root" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Daftar Surat Masuk</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Kelola arsip logistik persuratan eksternal yang masuk ke SMP Islam Al Hikmah Mayong</p>
        </div>
        {(currentUserRole === 'Super Admin' || currentUserRole === 'Tata Usaha' || currentUserRole === 'Operator') && (
          <button 
            id="btn_add_suratmasuk"
            onClick={() => { resetForm(); setIsAddOpen(true); }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-medium px-4 py-2 rounded-xl transition duration-150 shadow-sm text-sm"
          >
            <Plus size={18} />
            <span>Registrasi Surat</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={18} />
            <input 
              id="search_suratmasuk"
              type="text" 
              placeholder="Cari agenda, no. surat, pengirim, atau isi perihal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 pl-10 pr-4 py-2 border-2 border-zinc-300 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Category */}
            <div className="flex items-center space-x-1 border-2 border-zinc-300 dark:border-zinc-800 rounded-xl px-2.5 py-1 bg-zinc-50 dark:bg-zinc-950 text-xs">
              <Filter size={14} className="text-zinc-500 dark:text-zinc-400" />
              <select 
                id="select_filter_category"
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent border-none text-zinc-950 dark:text-zinc-150 focus:outline-none font-bold cursor-pointer py-1"
              >
                {categories.map((c, idx) => (
                  <option key={idx} value={c} className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-white">{c === 'Semua' ? 'Semua Kategori' : c}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center space-x-1 border-2 border-zinc-300 dark:border-zinc-800 rounded-xl px-2.5 py-1 bg-zinc-50 dark:bg-zinc-950 text-xs">
              <Clock size={14} className="text-zinc-500 dark:text-zinc-400" />
              <select 
                id="select_filter_status"
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none text-zinc-950 dark:text-zinc-150 focus:outline-none font-bold cursor-pointer py-1"
              >
                {statusOptions.map((s, idx) => (
                  <option key={idx} value={s} className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-white">{s === 'Semua' ? 'Semua Status' : s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Main Table */}
      <div className="glass rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-50/50 dark:bg-zinc-950/20">
                <th className="py-3 px-4">No. Agenda / Tgl Terima</th>
                <th className="py-3 px-4">Informasi Surat</th>
                <th className="py-3 px-4">Pengirim</th>
                <th className="py-3 px-4">Kategori / Lampiran</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-sm">Tidak ada data surat masuk ditemukan</p>
                    <p className="text-xs">Ubah filter kata kunci atau buat pencatatan surat baru</p>
                  </td>
                </tr>
              ) : (
                filteredLetters.map((letter) => (
                  <tr 
                    key={letter.id} 
                    className="hover:bg-zinc-50/40 dark:hover:bg-zinc-950/10 cursor-pointer transition-colors duration-100"
                    onClick={() => { setSelectedLetter(letter); setIsDetailOpen(true); }}
                  >
                    <td className="py-4 px-4 font-mono">
                      <div className="font-bold text-xs text-blue-500 dark:text-blue-400">{letter.agendaNumber}</div>
                      <div className="text-zinc-400 text-xs mt-1">Diterima: {letter.receivedDate}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-white max-w-xs truncate" title={letter.subject}>
                        {letter.subject}
                      </div>
                      <div className="text-zinc-400 text-xs mt-1">No: {letter.letterNumber}</div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {letter.sender}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50 mb-1">
                        {letter.category}
                      </span>
                      <div className="text-zinc-400 text-[10px] flex items-center gap-1">
                        <Paperclip size={10} />
                        <span>{letter.attachment}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(letter.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>
                        {letter.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => { setSelectedLetter(letter); setIsDetailOpen(true); }}
                          title="Lihat Detail & Disposisi"
                          className="p-1.5 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition duration-150"
                        >
                          <Eye size={16} />
                        </button>
                        {(currentUserRole === 'Super Admin' || currentUserRole === 'Tata Usaha' || currentUserRole === 'Operator') && (
                          <>
                            <button 
                              onClick={() => openEdit(letter)}
                              title="Edit Surat"
                              className="p-1.5 text-zinc-500 hover:text-cyan-500 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/20 rounded-lg transition duration-150"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(letter.id, letter.letterNumber)}
                              title="Hapus Surat"
                              className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition duration-150"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <span>Menampilkan <b>{filteredLetters.length}</b> dari total {db.incomingLetters.length} Surat Masuk</span>
          <span className="font-mono">SIMAHAT v1.0.0</span>
        </div>
      </div>

      {/* DETAIL MODAL WITH DISPOSITION HISTORY */}
      <AnimatePresence>
        {isDetailOpen && selectedLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/30">
                <div className="flex items-center gap-1.5">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white">Detail Surat Masuk</h2>
                    <p className="text-[11px] text-zinc-400 font-mono italic">ID: {selectedLetter.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Meta details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 pb-4 md:pb-0 md:pr-4">
                    <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Administrasi Surat</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-zinc-400">No. Agenda:</div>
                      <div className="col-span-2 font-mono font-bold text-blue-500">{selectedLetter.agendaNumber}</div>

                      <div className="text-zinc-400">No. Surat:</div>
                      <div className="col-span-2 font-semibold text-zinc-800 dark:text-white">{selectedLetter.letterNumber}</div>

                      <div className="text-zinc-400">Tgl Surat:</div>
                      <div className="col-span-2 font-medium">{selectedLetter.letterDate}</div>

                      <div className="text-zinc-400">Tgl Terima:</div>
                      <div className="col-span-2 font-medium">{selectedLetter.receivedDate}</div>

                      <div className="text-zinc-400">Kategori:</div>
                      <div className="col-span-2 font-semibold text-zinc-800 dark:text-white">✓ {selectedLetter.category}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Konten & Pengirim</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-zinc-400">Pengirim:</div>
                      <div className="col-span-2 font-semibold text-zinc-800 dark:text-white">{selectedLetter.sender}</div>

                      <div className="text-zinc-400">Perihal:</div>
                      <div className="col-span-2 font-semibold text-blue-500 dark:text-cyan-400 italic">“{selectedLetter.subject}”</div>

                      <div className="text-zinc-400">Lampiran:</div>
                      <div className="col-span-2 font-bold flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-max text-[10px]">
                        <Paperclip size={10} />
                        {selectedLetter.attachment}
                      </div>

                      <div className="text-zinc-400">Status:</div>
                      <div className="col-span-2 font-semibold text-zinc-800 dark:text-white">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClass(selectedLetter.status)}`}>
                          {selectedLetter.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF PREVIEW CONTAINER */}
                <div className="border border-zinc-205 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 p-4 relative">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <FileText size={14} className="text-red-500" />
                      <span className="font-mono">Lampiran_Digital_Arsip.pdf ({selectedLetter.attachment === 'Nihil' ? '3.5 KB' : '1.2 MB'})</span>
                    </div>
                    <button 
                      onClick={() => triggerToast('Simulasi mengunduh PDF berkas...', 'indigo')}
                      className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold rounded"
                    >
                      <Download size={10} />
                      <span>Unduh PDF</span>
                    </button>
                  </div>
                  <pre className="text-zinc-650 dark:text-zinc-350 font-sans text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-white dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-850">
                    {selectedLetter.fileContent || 'Tidak ada ekstraksi teks digital.'}
                  </pre>
                </div>

                {/* DISPOSITION TRAIL */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Riwayat Catatan Disposisial</h3>
                    {currentUserRole === 'Kepala Sekolah' && (
                      <button 
                        onClick={() => setIsDispOpen(true)}
                        className="flex items-center gap-1.5 bg-orange-500 text-white hover:opacity-90 font-semibold px-2.5 py-1 rounded text-xs transition duration-150"
                      >
                        <Send size={12} />
                        <span>Keluarkan Disposisi</span>
                      </button>
                    )}
                  </div>

                  {db.dispositions.filter(d => d.letterId === selectedLetter.id).length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-400">
                      <AlertCircle size={20} className="mx-auto mb-1.5 opacity-40 text-orange-400 animate-bounce" />
                      <span>Surat belum memiliki instruksi disposisi Kepala Sekolah.</span>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-orange-500/30 pl-5 space-y-4 font-sans text-xs">
                      {db.dispositions.filter(d => d.letterId === selectedLetter.id).map((disp) => (
                        <div key={disp.id} className="relative">
                          {/* Dot */}
                          <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-white dark:border-zinc-900"></span>
                          <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800 p-3 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-zinc-800 dark:text-zinc-300">
                                Disposisi oleh {disp.senderName}
                              </span>
                              <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(disp.status)}`}>
                                {disp.status}
                              </span>
                            </div>
                            <div className="text-zinc-500 dark:text-zinc-400">
                              <b>Urusan Delegasi:</b> <span className="text-zinc-850 dark:text-zinc-200 font-medium">To: {disp.receiverRole}</span>
                            </div>
                            <div className="italic text-zinc-650 bg-white dark:bg-zinc-950 p-2 rounded border border-zinc-100 dark:border-zinc-850 leading-relaxed font-mono">
                              &ldquo; {disp.note} &rdquo;
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono text-right">
                              Tanggal instruksi: {disp.date}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50 dark:bg-zinc-950/20">
                {selectedLetter.status !== 'Diarsipkan' && (currentUserRole === 'Super Admin' || currentUserRole === 'Tata Usaha') && (
                  <button 
                    onClick={() => { handleArchive(selectedLetter); setIsDetailOpen(false); }}
                    className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>Alihkan ke Arsip Digital</span>
                  </button>
                )}
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="bg-zinc-900 dark:bg-zinc-800 text-white hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISPOSISI SETUP MODAL (EXCLUSIV KEPALA SEKOLAH) */}
      <AnimatePresence>
        {isDispOpen && selectedLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <div className="flex items-center gap-2">
                  <Send size={18} />
                  <span className="font-bold text-sm">Terbitkan Disposisi Kepala Sekolah</span>
                </div>
                <button onClick={() => setIsDispOpen(false)} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveDisposition} className="p-6 space-y-4">
                <div className="text-xs text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  Menginstruksikan tindaklanjut Surat No: <b className="text-zinc-800 dark:text-white font-mono">{selectedLetter.letterNumber}</b> perihal {selectedLetter.subject}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Tujuan Delegasi Disposisi</label>
                  <select 
                    id="select_disp_receiver"
                    value={dispReceiver} 
                    onChange={(e) => setDispReceiver(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Wakaseks / Urusan Kurikulum">Wakaseks / Urusan Kurikulum</option>
                    <option value="Wakaseks / Urusan Kesiswaan">Wakaseks / Urusan Kesiswaan</option>
                    <option value="Wakaseks / Urusan Sarpras">Wakaseks / Urusan Sarpras</option>
                    <option value="Tata Usaha / Lailatul Fitriyah">Tata Usaha (Lailatul Fitriyah)</option>
                    <option value="Operator IT / Rizky Ramadhan">Operator IT (Rizky Ramadhan)</option>
                    <option value="Bimbingan Konseling (BK)">Bimbingan Konseling (BK)</option>
                    <option value="Kepala Perpustakaan / Lab">Kepala Perpustakaan / Lab</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Status Darurat</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Biasa', 'Penting', 'Segera', 'Rahasia'] as const).map((st) => (
                      <button
                        id={`btn_disp_status_${st}`}
                        key={st}
                        type="button"
                        onClick={() => setDispStatus(st)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold border transition duration-150 ${dispStatus === st ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Memo / Instruksi Catatan Kepala Sekolah</label>
                  <textarea 
                    id="input_disp_note"
                    rows={4}
                    placeholder="Tuliskan catatan disposisi instruksi detail di sini..."
                    value={dispNote}
                    onChange={(e) => setDispNote(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsDispOpen(false)}
                    className="border border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="bg-orange-500 hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-orange-500/10"
                  >
                    Terbitkan Disposisi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD / EDIT SURAT MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-500" />
                  <span className="font-bold text-base">{isEditing ? 'Edit Registrasi Surat Masuk' : 'Registrasi Agenda Surat Masuk'}</span>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveLetter} className="overflow-y-auto p-6 space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Nomor Agenda (Auto / Manual)</label>
                    <input 
                      id="input_agenda_number"
                      type="text" 
                      placeholder="Contoh: 004/SM/SMPI-AH/2026"
                      value={agendaNumber}
                      onChange={(e) => setAgendaNumber(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-505 dark:text-zinc-400">Nomor Surat Resmi <span className="text-red-500">*</span></label>
                    <input 
                      id="input_letter_number"
                      type="text" 
                      placeholder="Contoh: 421.3/218/2026"
                      value={letterNumber}
                      onChange={(e) => setLetterNumber(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Tanggal Tertera di Surat</label>
                    <input 
                      id="input_letter_date"
                      type="date" 
                      value={letterDate}
                      onChange={(e) => setLetterDate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Tanggal Diterima Sekolah</label>
                    <input 
                      id="input_received_date"
                      type="date" 
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Instansi / Nama Pengirim <span className="text-red-500">*</span></label>
                    <input 
                      id="input_sender"
                      type="text" 
                      placeholder="Contoh: Dinas Pendidikan Pemuda dan Olahraga Kec. Mayong"
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Perihal / Perkara Surat <span className="text-red-500">*</span></label>
                    <input 
                      id="input_subject"
                      type="text" 
                      placeholder="Contoh: Undangan Koordinasi Akreditasi Sekolah Swasta"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Kategori Persuratan</label>
                    <select 
                      id="select_category"
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {categories.slice(1).map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Kompensasi / Lampiran</label>
                    <input 
                      id="input_attachment"
                      type="text" 
                      placeholder="Contoh: 1 Berkas / 3 Lembar / Nihil"
                      value={attachment}
                      onChange={(e) => setAttachment(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* PDF DRAG & DROP SIMULATION & PREVIEW */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Unggah Berkas Fisik Digital (PDF)</label>
                  <div 
                    id="dropzone_pdf"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center hover:bg-zinc-50 dark:hover:bg-zinc-950/20 cursor-pointer transition relative"
                  >
                    <input 
                      id="file_pdf_input"
                      type="file" 
                      accept=".pdf" 
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <FileText className="mx-auto mb-2 text-zinc-400" size={32} />
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {uploadedFileName ? `File Terpilih: ${uploadedFileName}` : 'Drag & Drop PDF di sini, atau klik untuk browse.'}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">Dibatasi file format .pdf maksimal 10MB</p>
                    {uploadProgress !== null && (
                      <div className="mt-3 w-48 mx-auto bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Ekstraksi Hasil Isian / Memo Surat</label>
                  <textarea 
                    id="input_file_content"
                    rows={4}
                    placeholder="Sisipkan salinan teks surat dari pindaian korespondensi untuk kemudahan pengarsipan digital..."
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsAddOpen(false)}
                    className="border border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10"
                  >
                    {isEditing ? 'Simpan Pembaruan' : 'Simpan Surat'}
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
