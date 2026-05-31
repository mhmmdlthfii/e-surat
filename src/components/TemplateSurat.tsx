/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LetterTemplate, UserRole } from '../types';
import { getDB, saveDB, pushAuditLog } from '../db';
import { 
  FileText, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Check, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TemplateSuratProps {
  currentUserId: string;
  currentUserRole: UserRole;
  currentUserName: string;
  triggerToast: (msg: string, type: 'success' | 'indigo' | 'error') => void;
}

export default function TemplateSurat({ currentUserId, currentUserRole, currentUserName, triggerToast }: TemplateSuratProps) {
  const [db, setDb] = useState(getDB());
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  
  // Edit Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [content, setContent] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const refreshState = () => {
    setDb(getDB());
  };

  const handleEdit = (tpl: LetterTemplate) => {
    setSelectedTemplate(tpl);
    setName(tpl.name);
    setCode(tpl.code);
    setContent(tpl.content);
    setIsNew(false);
    setIsEditOpen(true);
  };

  const handleOpenNew = () => {
    setSelectedTemplate(null);
    setName('');
    setCode('');
    setContent(`YAYASAN AL HIKMAH MAYONG
SMP ISLAM AL HIKMAH MAYONG
TERAKREDITASI A
Jl. Pancasila No. 12, Pelemkerep, Mayong, Jepara

----------------------------------------------------
[JENIS_SURAT]
Nomor: [NOMOR_SURAT]

Kepala SMP Islam Al Hikmah Mayong menerangkan bahwa:
Nama: [NAMA]
Jabatan / Peran: [JABATAN_PERAN]

Isi surat Anda di sini...

Mayong, [TANGGAL_SURAT]
Kepala Sekolah,


H. Slamet Riyadi, M.Pd.`);
    setIsNew(true);
    setIsEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !content) {
      triggerToast('Seluruh kolom holds data wajib diisi!', 'error');
      return;
    }

    const cleanedCode = code.toUpperCase().replace(/\s+/g, '_');
    const existingTemplates = [...db.templates];

    if (isNew) {
      // Check duplicated code
      if (existingTemplates.some(t => t.code === cleanedCode)) {
        triggerToast('Kode template sudah terdaftar!', 'error');
        return;
      }
      
      const newTpl: LetterTemplate = {
        id: `tpl-${Date.now()}`,
        name,
        code: cleanedCode,
        content,
        variables: extractVariables(content),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserName
      };

      const updated = [...existingTemplates, newTpl];
      saveDB.templates(updated);
      pushAuditLog(currentUserId, 'CREATE_TEMPLATE', `Membuat pola template surat baru: ${name}`, 'Referensi Surat');
      triggerToast('Template baru berhasil ditambahkan!', 'success');
    } else if (selectedTemplate) {
      const idx = existingTemplates.findIndex(t => t.id === selectedTemplate.id);
      if (idx !== -1) {
        existingTemplates[idx] = {
          ...existingTemplates[idx],
          name,
          code: cleanedCode,
          content,
          variables: extractVariables(content),
          updatedAt: new Date().toISOString(),
          updatedBy: currentUserName
        };
        saveDB.templates(existingTemplates);
        pushAuditLog(currentUserId, 'UPDATE_TEMPLATE', `Mengubah pola template surat: ${name}`, 'Referensi Surat');
        triggerToast('Template surat berhasil disimpan!', 'success');
      }
    }

    setIsEditOpen(false);
    refreshState();
  };

  const handleDelete = (id: string, templateName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus template "${templateName}"?`)) {
      const filtered = db.templates.filter(t => t.id !== id);
      saveDB.templates(filtered);
      pushAuditLog(currentUserId, 'DELETE_TEMPLATE', `Menghapus template: ${templateName}`, 'Referensi Surat');
      triggerToast('Template berhasil dihapus!', 'error');
      refreshState();
    }
  };

  const extractVariables = (txt: string): string[] => {
    const rx = /\[([A-Z0-9_]+)\]/g;
    const matches = new Set<string>();
    let m;
    while ((m = rx.exec(txt)) !== null) {
      matches.add(m[1]);
    }
    return Array.from(matches);
  };

  return (
    <div id="template_root" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Tata Kelola Template Surat</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Atur draf pola pembuka, penutup, dan variabel pengetikan konvensional untuk menghemat waktu penulisan surat</p>
        </div>
        {(currentUserRole === 'Super Admin' || currentUserRole === 'Tata Usaha' || currentUserRole === 'Operator') && (
          <button 
            id="btn_add_template"
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-medium px-4 py-2 rounded-xl transition duration-150 shadow-sm text-sm"
          >
            <Plus size={18} />
            <span>Tambah Desain Template</span>
          </button>
        )}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.templates.length === 0 ? (
          <div className="col-span-full text-center py-12 glass text-zinc-400">
            <Layers size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Format template belum didesain</p>
            <p className="text-xs">Klik tombol Tambah Desain Template di atas</p>
          </div>
        ) : (
          db.templates.map((tpl) => (
            <div 
              key={tpl.id} 
              className="glass p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-150 rounded-2xl"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{tpl.name}</h3>
                      <p className="text-[10px] text-zinc-400 font-mono tracking-wide">{tpl.code}</p>
                    </div>
                  </div>
                  {(currentUserRole === 'Super Admin' || currentUserRole === 'Tata Usaha') && (
                    <button 
                      onClick={() => handleDelete(tpl.id, tpl.name)}
                      className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition"
                      title="Hapus Pola"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="text-xs text-zinc-500 border border-zinc-200/50 dark:border-zinc-850 p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 max-h-32 overflow-hidden relative">
                  <pre className="font-mono text-[9px] whitespace-pre-wrap leading-relaxed select-none">
                    {tpl.content}
                  </pre>
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/80 dark:from-zinc-900/80 to-transparent pointer-events-none"></div>
                </div>

                {/* Detected variables */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                    <Sparkles size={10} className="text-yellow-500" />
                    <span>Variabel Deteksi Otomatis ({tpl.variables.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tpl.variables.map((v, i) => (
                      <span key={i} className="text-[8.5px] font-mono font-bold bg-blue-500/10 text-blue-500 dark:text-cyan-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                        [{v}]
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-3 flex items-center justify-between text-[10px] text-zinc-400">
                <div>
                  <p>Oleh: <b>{tpl.updatedBy || 'Sistem'}</b></p>
                  <p className="mt-0.5">{new Date(tpl.updatedAt).toLocaleDateString()}</p>
                </div>
                {(currentUserRole === 'Super Admin' || currentUserRole === 'Tata Usaha' || currentUserRole === 'Operator') && (
                  <button 
                    onClick={() => handleEdit(tpl)}
                    className="flex items-center gap-1 bg-white hover:bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg font-semibold"
                  >
                    <Edit3 size={12} />
                    <span>Ubah Pola</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT TEMPLATE MODAL */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-500" />
                  <span className="font-bold text-base">{isNew ? 'Tambah Template Penulisan' : 'Edit Redaksi Template Surat'}</span>
                </div>
                <button onClick={() => setIsEditOpen(false)} className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-550">Judul Penemu Template <span className="text-red-500">*</span></label>
                    <input 
                      id="input_tpl_name"
                      type="text" 
                      placeholder="Contoh: Surat Tugas Sederhana"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-550">Kode Referensi Template ID <span className="text-red-500">*</span></label>
                    <input 
                      id="input_tpl_code"
                      type="text" 
                      placeholder="Contoh: SURAT_TUGAS (Otomatis Kapital)"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="backdrop-blur-sm bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                  <div className="font-bold text-blue-600 flex items-center gap-1.5">
                    <Info size={14} />
                    <span>Panduan Penggunaan Token Variabel:</span>
                  </div>
                  <p>Anda dapat mengapit variabel custom dengan kurung siku kapital seperti <code className="font-mono bg-blue-100 dark:bg-blue-950 text-blue-500 rounded px-1">[NOMOR_SURAT]</code>, <code className="font-mono bg-blue-100 dark:bg-blue-950 text-blue-500 rounded px-1">[NAMA_SISWA]</code>, atau <code className="font-mono bg-blue-100 dark:bg-blue-950 text-blue-500 rounded px-1">[TANGGAL_TUGAS]</code>.</p>
                  <p>Variabel penampung ini akan otomatis terdeteksi oleh sistem untuk membantu autofill input penulisan di halaman draf Surat Keluar secara instan.</p>
                </div>

                {/* Content draft editor */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-550">Struktur Formulasi Kerangka Template <span className="text-red-500">*</span></label>
                  <textarea 
                    id="input_tpl_content"
                    rows={12}
                    placeholder="Ketik draf formulasi template di sini..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsEditOpen(false)}
                    className="border border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10"
                  >
                    <span>Simpan Template</span>
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
