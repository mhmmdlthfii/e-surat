/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Super Admin' | 'Kepala Sekolah' | 'Tata Usaha' | 'Operator';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: string;
  password?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  role: UserRole;
  action: string;
  details: string;
  module: string;
  ipAddress: string;
}

export interface IncomingLetter {
  id: string;
  agendaNumber: string;
  letterNumber: string;
  letterDate: string;
  receivedDate: string;
  sender: string;
  subject: string;
  category: string;
  attachment: string; // e.g., "3 Lembar"
  fileUrl?: string; // Simulated file url
  fileContent?: string; // Rich simulated content of PDF
  status: 'Diterima' | 'Didisposisikan' | 'Diarsipkan';
  createdAt: string;
}

export interface Disposition {
  id: string;
  letterId: string; // ID of IncomingLetter
  senderId: string;
  senderName: string;
  receiverRole: string; // e.g., "Wakasek", "Guru Bimbingan Konseling", "Operator"
  note: string;
  date: string;
  status: 'Penting' | 'Biasa' | 'Segera' | 'Rahasia';
}

export interface OutgoingLetter {
  id: string;
  letterNumber: string;
  title: string;
  subject: string;
  letterDate: string;
  receiver: string;
  responsiblePerson: string; // Penanggung Jawab
  category: string;
  status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak' | 'Terbit';
  rejectionNote?: string; // If status is Ditolak
  fileContent?: string; // Letter draft text
  uuid?: string;
  verificationCode?: string;
  sha256Hash?: string;
  signedAt?: string;
  signedBy?: string; // Name of Headmaster who signed
  qrCodeUrl?: string;
}

export interface LetterTemplate {
  id: string;
  name: string; // e.g., "Surat Tugas", "Surat Undangan"
  code: string; // e.g., "SURAT_TUGAS"
  content: string; // Markdown / styled template
  variables: string[]; // e.g., ["NOMOR", "NAMA", "TANGGAL", "KEPERLUAN"]
  updatedAt: string;
  updatedBy: string;
}

export interface SchoolSettings {
  name: string;
  logoUrl: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  headmasterName: string;
  headmasterNip: string;
}

export interface ESignatureConfig {
  headmasterId: string;
  signatureImage: string; // Base64 transparent PNG
  stempelImage: string; // Base64 transparent PNG
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}
