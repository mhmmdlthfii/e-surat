/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getDB, saveDB } from '../db';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  HardDriveDownload,
  Info
} from 'lucide-react';

interface AuditLogViewProps {
  currentUserRole: string;
  triggerToast: (msg: string, type: 'success' | 'indigo' | 'error') => void;
}

export default function AuditLogView({ currentUserRole, triggerToast }: AuditLogViewProps) {
  const [db, setDb] = useState(getDB());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('Semua');

  const refreshState = () => {
    setDb(getDB());
  };

  const clearLogs = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh logs audit sistem? Tindakan ini tidak dapat dibatalkan!')) {
      saveDB.auditLogs([]);
      refreshState();
      triggerToast('Seluruh log audit sistem berhasil dibersihkan!', 'success');
    }
  };

  const exportLogs = () => {
    triggerToast('Mengunduh laporan excel audit logs...', 'indigo');
    // Simulated Download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db.auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AUDIT_LOG_SIMAHAT_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const modules = ['Semua', 'Autentikasi', 'Surat Masuk', 'Surat Keluar', 'Disposisi', 'Signature & QR', 'Referensi Surat', 'Pengaturan'];

  const filteredLogs = db.auditLogs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = filterModule === 'Semua' || log.module === filterModule;

    return matchesSearch && matchesModule;
  });

  const getActionColor = (action: string) => {
    if (action.includes('ERROR') || action.includes('FAILED') || action.includes('DELETE')) {
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
    if (action.includes('SUCCESS') || action.includes('SIGN') || action.includes('PUBLISH')) {
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
    if (action.includes('CREATE') || action.includes('UPDATE')) {
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
    return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
  };

  return (
    <div id="auditlog_root" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Log Aktivitas Sistem (Audit Trail)</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Arsip kronologis pengoperasian sistem persuratan untuk pemantauan keamanan (Super Admin)</p>
        </div>
        <div className="flex gap-2">
          <button 
            id="btn_export_audit"
            onClick={exportLogs}
            className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl transition font-semibold text-xs bg-white dark:bg-zinc-900"
          >
            <HardDriveDownload size={14} />
            <span>Ekspor Logs</span>
          </button>
          {currentUserRole === 'Super Admin' && (
            <button 
              id="btn_clear_audit"
              onClick={clearLogs}
              className="flex items-center gap-1.5 border border-red-200 hover:bg-red-500/15 text-red-500 dark:border-red-900 px-4 py-2 rounded-xl transition font-bold text-xs"
            >
              <Trash2 size={14} />
              <span>Bersihkan Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and search bars */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={18} />
            <input 
              id="search_audit_input"
              type="text" 
              placeholder="Cari user, status aksi, rincian aktivitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 pl-10 pr-4 py-2 border-2 border-zinc-300 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Module */}
            <div className="flex items-center space-x-1 border-2 border-zinc-300 dark:border-zinc-800 rounded-xl px-2.5 py-1 bg-zinc-50 dark:bg-zinc-950 text-xs">
              <Filter size={14} className="text-zinc-500 dark:text-zinc-400" />
              <select 
                id="select_audit_module"
                value={filterModule} 
                onChange={(e) => setFilterModule(e.target.value)}
                className="bg-transparent border-none text-zinc-950 dark:text-zinc-150 focus:outline-none font-bold cursor-pointer py-1"
              >
                {modules.map((m, idx) => (
                  <option key={idx} value={m} className="bg-white text-zinc-950 dark:bg-zinc-900 dark:text-white">{m === 'Semua' ? 'Semua Modul' : m}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={refreshState}
              title="Refresh Data"
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-500"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table logs */}
      <div className="glass rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-50/50 dark:bg-zinc-950/20">
                <th className="py-3 px-4">Waktu Kejadian</th>
                <th className="py-3 px-4">Staf Pelaksana</th>
                <th className="py-3 px-4">Modul Urusan</th>
                <th className="py-3 px-4">Aksi / Keyword</th>
                <th className="py-3 px-4">Deskripsi Aktivitas</th>
                <th className="py-3 px-4">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-350">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <ShieldAlert size={36} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
                    <p className="font-semibold text-sm">Tidak ditemukan rekam log aktivitas</p>
                    <p className="text-[11px]">Silakan sesuaikan filter kata kunci Anda</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-950/5 cursor-default transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-zinc-400" />
                        <span>{new Date(log.timestamp).toLocaleDateString('id-ID')} {new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-800 dark:text-zinc-200">{log.username}</div>
                      <div className="text-[10px] text-zinc-400">{log.role}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700 font-bold px-2 py-0.5 rounded">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-mono font-bold tracking-wide ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-800 dark:text-zinc-300 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-950/20 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between font-mono">
          <span>Total Logs Dilacak: {filteredLogs.length} Aktivitas</span>
          <span>Security Secured 💻</span>
        </div>
      </div>
    </div>
  );
}
