/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  User, 
  IncomingLetter, 
  Disposition, 
  OutgoingLetter, 
  LetterTemplate, 
  SchoolSettings, 
  ESignatureConfig, 
  AuditLog,
  Notification
} from './types';

// Default SVG Stamps and Signatures (rendered as Base64 strings for simulated transparent PNG files)
const DEFAULT_STEMPEL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="54" fill="none" stroke="%233b82f6" stroke-width="4" stroke-dasharray="1 1"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="%233b82f6" stroke-width="2"/>
  <circle cx="60" cy="60" r="32" fill="none" stroke="%233b82f6" stroke-width="1.5"/>
  <path d="M 18,60 A 42,42 0 0,1 102,60" fill="none" id="curve1" stroke="none" />
  <path d="M 18,60 A 42,42 0 0,0 102,60" fill="none" id="curve2" stroke="none" />
  <text fill="%233b82f6" font-family="'Poppins', sans-serif" font-size="7" font-weight="bold" letter-spacing="1">
    <textPath href="%23curve1" startOffset="50%" text-anchor="middle">YAYASAN AL HIKMAH MAYONG</textPath>
  </text>
  <text fill="%233b82f6" font-family="'Poppins', sans-serif" font-size="7" font-weight="bold" letter-spacing="1">
    <textPath href="%23curve2" startOffset="50%" text-anchor="middle">SMP ISLAM AL HIKMAH</textPath>
  </text>
  <g fill="%233b82f6" font-family="'Poppins', sans-serif" text-anchor="middle">
    <text x="60" y="55" font-size="8" font-weight="bold">* JEPARA *</text>
    <text x="60" y="66" font-size="6" font-weight="bold">AL-HIKMAH</text>
    <text x="60" y="74" font-size="5" letter-spacing="0.5">TERAKREDITASI A</text>
  </g>
</svg>`;

const DEFAULT_SIGNATURE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
  <path d="M 20,45 C 35,40 50,15 55,30 C 60,45 40,65 50,60 C 60,55 75,30 85,35 C 95,40 80,60 105,45" fill="none" stroke="%231e3a8a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="15" y1="52" x2="105" y2="48" stroke="%231e3a8a" stroke-width="1.5" stroke-linecap="round"/>
  <text x="50" y="72" fill="%231e3a8a" font-family="'Poppins', sans-serif" font-size="5.5" font-style="italic">M. Syafi'i, S.ThI</text>
</svg>`;

export const DB_KEYS = {
  USERS: 'simahat_users',
  INCOMING_LETTERS: 'simahat_incoming',
  DISPOSITIONS: 'simahat_dispositions',
  OUTGOING_LETTERS: 'simahat_outgoing',
  TEMPLATES: 'simahat_templates',
  SCHOOL_SETTINGS: 'simahat_settings',
  SIGNATURE_CONFIG: 'simahat_signature_config',
  AUDIT_LOGS: 'simahat_audit',
  NOTIFICATIONS: 'simahat_notifications'
};

const INITIAL_USERS: User[] = [
  {
    id: 'u-5',
    username: 'Luthfi',
    name: 'Muhammad Luthfi',
    email: 'luthfi@smpislamalhikmahmayong.sch.id',
    role: 'Super Admin',
    isActive: true,
    password: 'lthf23',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'u-1',
    username: 'admin',
    name: 'Achmad Fauzi, S.Pd.',
    email: 'achmad.fauzi@alhikmahmayong.sch.id',
    role: 'Super Admin',
    isActive: true,
    password: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'u-2',
    username: 'kepsek',
    name: "M. Syafi'i, S.ThI",
    email: 'syafii@alhikmahmayong.sch.id',
    role: 'Kepala Sekolah',
    isActive: true,
    password: 'kepsek',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'u-3',
    username: 'tatausaha',
    name: 'Lailatul Fitriyah, S.Ak.',
    email: 'lailatul.fitriyah@alhikmahmayong.sch.id',
    role: 'Tata Usaha',
    isActive: true,
    password: 'tatausaha',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'u-4',
    username: 'operator',
    name: 'Rizky Ramadhan',
    email: 'rizky.ramadhan@alhikmahmayong.sch.id',
    role: 'Operator',
    isActive: true,
    password: 'operator',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120'
  }
];

const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  name: "SMP Islam Al Hikmah Mayong",
  logoUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=150",
  address: "Jl. Pancasila No. 12, Pelemkerep, Mayong, Kabupaten Jepara, Jawa Tengah 59465",
  email: "info@smpislamalhikmahmayong.sch.id",
  phone: "(0291) 4272111",
  website: "smpislamalhikmahmayong.sch.id",
  headmasterName: "M. Syafi'i, S.ThI",
  headmasterNip: "19740816 200212 1 003"
};

const INITIAL_SIGNATURE_CONFIG: ESignatureConfig = {
  headmasterId: 'u-2',
  signatureImage: DEFAULT_SIGNATURE,
  stempelImage: DEFAULT_STEMPEL,
  updatedAt: '2026-05-30T08:15:00Z'
};

const INITIAL_INCOMING_LETTERS: IncomingLetter[] = [
  {
    id: 'in-1',
    agendaNumber: '001/SM/SMPI-AH/2026',
    letterNumber: '421.3/218/2026',
    letterDate: '2026-05-15',
    receivedDate: '2026-05-17',
    sender: 'Dinas Pendidikan Kepemudaan dan Olahraga Kab. Jepara',
    subject: 'Sosialisasi Asesmen Nasional Berbasis Komputer (ANBK) Tingkat SMP',
    category: 'Kedinasan',
    attachment: '1 Berkas',
    fileUrl: '#p-1',
    fileContent: `KEPADA YTH. KEPALA SMP ISLAM AL HIKMAH MAYONG
Di Tempat

Dengan hormat, sehubungan dengan persiapan pelaksanaan Asesmen Nasional Berbasis Komputer (ANBK) tahun ajaran 2026/2027, kami mengundang perwakilan Sekolah (Kepala Sekolah & Operator Proktor) untuk mengikuti workshop teknis persiapan infrastruktur jaringan dan uji coba ANBK.

Hari/Tanggal: Rabu, 10 Juni 2026
Waktu: 09.00 WIB - Selesai
Tempat: Aula Binar Pendidikan Disdikpora Kab. Jepara
Agenda: Teknis ANBK, Instalasi VHD, dan Alokasi Gelombang.

Mohon hadir tepat waktu dan membawa laptop serta modem cadangan. Demikian atas perhatiannya diucapkan terima kasih.`,
    status: 'Didisposisikan',
    createdAt: '2026-05-17T09:00:00Z'
  },
  {
    id: 'in-2',
    agendaNumber: '002/SM/SMPI-AH/2026',
    letterNumber: '088/UND/PPS/V/2026',
    letterDate: '2026-05-20',
    receivedDate: '2026-05-21',
    sender: 'Puskesmas Mayong I, Jepara',
    subject: 'Undangan Penyuluhan Kesehatan Remaja dan Vaksinasi BIAS',
    category: 'Undangan Resmi',
    attachment: 'Nihil',
    fileUrl: '#p-2',
    fileContent: `YTH. KEPALA SMP ISLAM AL HIKMAH MAYONG
Di Tempat

Mengacu pada program rutin Posyandu Remaja dan Bulan Imunisasi Anak Sekolah (BIAS), kami bermaksud mengadakan penyuluhan pola hidup bersih dan sehat (PHBS) serta screening kesehatan gratis untuk siswa Kelas VII dan VIII.

Penyuluhan dilaksanakan pada:
Hari/Tanggal: Kamis, 4 Juni 2026
Waktu: 08.00 - 11.00 WIB
Tempat: Musholla SMP Islam Al Hikmah

Kami berharap kerja sama pihak sekolah untuk mempersiapkan ruang dan memobilisasi siswa. Terima kasih.`,
    status: 'Didisposisikan',
    createdAt: '2026-05-21T10:30:00Z'
  },
  {
    id: 'in-3',
    agendaNumber: '003/SM/SMPI-AH/2026',
    letterNumber: 'ST-041/BP/YAH/V/2026',
    letterDate: '2026-05-25',
    receivedDate: '2026-05-26',
    sender: 'Yayasan Al Hikmah Mayong',
    subject: 'Instruksi Rapat Koordinasi Tahunan Perkembangan Sarpras',
    category: 'Koordinasi Yayasan',
    attachment: '2 Lembar',
    fileUrl: '#p-3',
    fileContent: `KEPADA YTH. SELURUH KEPALA UNIT PENDIDIKAN YAYASAN AL HIKMAH

Diharapkan kehadirannya dalam Rapat Pleno Koordinasi Sarana dan Prasarana Sekolah menyongsong Penerimaan Peserta Didik Baru (PPDB) Tahun 2026/2027.

Hari: Sabtu, 6 Juni 2026
Tempat: Kantor Utama Yayasan Al Hikmah
Jam: 13.00 WIB

Harap membawa laporan inventaris sekolah terbaru dan kebutuhan pengadaan ruang kelas baru. Terima kasih atas disiplin kehadirannya.`,
    status: 'Diterima',
    createdAt: '2026-05-26T11:15:00Z'
  },
  {
    id: 'in-4',
    agendaNumber: '004/SM/SMPI-AH/2026',
    letterNumber: '425.2/097/2026',
    letterDate: '2026-05-28',
    receivedDate: '2026-05-29',
    sender: 'Kecamatan Mayong - Jepara',
    subject: 'Permohonan Delegasi Siswa untuk Upacara Hari Lahir Pancasila',
    category: 'Kedinasan',
    attachment: 'Nihil',
    fileUrl: '#p-4',
    fileContent: `YTH. KEPALA SEKOLAH SMP ISLAM AL HIKMAH MAYONG

Dalam rangka memperingati Hari Lahir Pancasila pada 1 Juni 2026, kami memohon pihak sekolah mengirimkan delegasi sebanyak 1 (satu) peleton beranggotakan 30 siswa berpakaian OSIS lengkap dengan guru pendamping untuk mengikuti upacara bendera tingkat kecamatan.

Pelaksanaan:
Hari: Senin, 1 Juni 2026
Waktu: 07.00 WIB s.d Selesai
Tempat: Lapangan Alun-Alun Mayong

Demikian surat permohonan ini dibuat atas kerjasamanya diucapkan terima kasih.`,
    status: 'Diarsipkan',
    createdAt: '2026-05-29T08:00:00Z'
  }
];

const INITIAL_DISPOSITIONS: Disposition[] = [
  {
    id: 'disp-1',
    letterId: 'in-1',
    senderId: 'u-2',
    senderName: "M. Syafi'i, S.ThI",
    receiverRole: 'Operator',
    note: 'Mohon Operator (Rizky Ramadhan) segera menyiapkan kelengkapan VHD Komputer dan mendampingi saya ke acara workshop tersebut. Buatkan Surat Tugas delegasi sekalian.',
    date: '2026-05-18',
    status: 'Segera'
  },
  {
    id: 'disp-2',
    letterId: 'in-2',
    senderId: 'u-2',
    senderName: "M. Syafi'i, S.ThI",
    receiverRole: 'Wakasek Kesiswaan',
    note: 'Koordinasikan dengan wali kelas VII dan VIII untuk penjadwalan screening kesehatan anak-anak. Amankan sarana Musholla.',
    date: '2026-05-22',
    status: 'Penting'
  }
];

const INITIAL_OUTGOING_LETTERS: OutgoingLetter[] = [
  {
    id: 'out-1',
    letterNumber: '045/ST/SMPI-AH/V/2026',
    title: 'Surat Tugas Workshop ANBK Disdikpora',
    subject: 'Menugaskan Guru/Operator menghadiri Workshop ANBK 2026',
    letterDate: '2026-06-01',
    receiver: 'Rizky Ramadhan (Operator/Proktor ANBK)',
    responsiblePerson: "M. Syafi'i, S.ThI",
    category: 'Surat Tugas',
    status: 'Terbit',
    fileContent: `SURAT TUGAS\nNomor: 045/ST/SMPI-AH/V/2026\n\nMenimbang: Kelancaran pelaksanaan Asesmen Nasional Berbasis Komputer (ANBK) tahun 2026.\n\nDasar: Surat Dinas Pendidikan Pemuda dan Olahraga Kabupaten Jepara nomor 421.3/218/2026 perihal Sosialisasi ANBK.\n\nMEMERINTAHKAN:\nKepada: RIZKY RAMADHAN\nJabatan: Operator / Proktor IT SMP Islam Al Hikmah\n\nUntuk: Menghadiri Workshop Teknis Persiapan ANBK Tingkat SMP di Kabupaten Jepara pada hari Rabu, 10 Juni 2026.\n\nDemikian surat tugas ini dibuat untuk dilaksanakan dengan tanggung jawab penuh.`,
    uuid: '9e731b8a-ca45-4bb8-886d-0ccfbe8ff981',
    verificationCode: 'SMH-2026-9E7B8',
    sha256Hash: '4a6b288590bf886dc0ccfbe8ff981ff3a8b27341ea22bfd3810287e07aab5fd1',
    signedAt: '2026-05-31T09:20:00Z',
    signedBy: "M. Syafi'i, S.ThI",
    qrCodeUrl: '#qr-1'
  },
  {
    id: 'out-2',
    letterNumber: '098/UND/SMPI-AH/V/2026',
    title: 'Surat Undangan Rapat Pleno Komite Wali Murid',
    subject: 'Penyampaian Rencana Anggaran Pendapatan Sekolah (RAPBS) dan Laporan Semester',
    letterDate: '2026-06-05',
    receiver: 'Seluruh Orang Tua / Wali Murid Kelas IX',
    responsiblePerson: 'Komite Sekolah & Tata Usaha',
    category: 'Surat Undangan',
    status: 'Menunggu Persetujuan',
    fileContent: `SURAT UNDANGAN MURID\nNomor: 098/UND/SMPI-AH/V/2026\n\nKepada Seluruh Wali Murid Kelas IX\nDi Tempat\n\nDengan hormat, mengundang Bapak/Ibu Wali Murid Kelas IX untuk hadir dalam Rapat Pleno Koordinasi Kelulusan Siswa sekaligus sosialisasi kelanjutan pendidikan menengah yang akan dihadiri oleh Pengurus Komite Sekolah.\n\nHari/Tanggal: Sabtu, 6 Juni 2026\nWaktu: 08.00 WIB s.d Selesai\nTempat: Aula SMP Islam Al Hikmah Mayong\n\nKehadiran Bapak/Ibu sangat menentukan mufakat pembiayaan penunjang wisuda kelulusan. Terima kasih.`,
  },
  {
    id: 'out-3',
    letterNumber: '023/SK/SMPI-AH/V/2026',
    title: 'Surat Keputusan Panitia PPDB 2026/2027',
    subject: 'Pembentukan Susunan Panitia Pengarah dan Pelaksana PPDB Sekolah',
    letterDate: '2026-05-30',
    receiver: 'Lailatul Fitriyah, S.Ak. (Ketua Panitia PPDB)',
    responsiblePerson: "M. Syafi'i, S.ThI",
    category: 'Surat Keputusan',
    status: 'Disetujui',
    fileContent: `SURAT KEPUTUSAN KEPALA SMP ISLAM AL HIKMAH MAYONG\nNomor: 023/SK/SMPI-AH/V/2026\n\nTENTANG:\nSUSUNAN PANITIA PENERIMAAN PESERTA DIDIK BARU (PPDB) TAHUN AJARAN 2026/2027\n\nMenimbang:dst.\nMengingat:dst.\n\nMEMUTUSKAN:\nMenetapkan: \nSUSUNAN PANITIA PPDB SEPERTI MASUK PADA LAMPIRAN.\nKetua Panitia: LAILATUL FITRIYAH, S.Ak.\nSekretaris: RIZKY RAMADHAN\nBendahara: SRI WAHYUNI, S.Pd.\n\nKeputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan apabila di kemudian hari terdapat kekeliruan, akan dilakukan perbaikan sebagaimana mestinya.`
  },
  {
    id: 'out-4',
    letterNumber: '012/SK/SMPI-AH/IV/2026',
    title: 'Surat Keterangan Berkelakuan Baik Siswa Kakak Kelas',
    subject: 'Menerangkan perilaku berakhlak mulia siswa untuk masuk Aliyah',
    letterDate: '2026-05-10',
    receiver: 'Muhammad Nabil (Alumni Kelas IX)',
    responsiblePerson: 'Bimbingan Konseling (BK)',
    category: 'Surat Keterangan',
    status: 'Draft',
    fileContent: `SURAT KETERANGAN BERKELAKUAN BAIK\nNomor: 012/SK/SMPI-AH/IV/2026\n\nYang bertanda tangan di bawah ini menerangkan bahwa:\nNama: MUHAMMAD NABIL\nTempat, Tgl Lahir: Jepara, 12 April 2011\nNo Induk Siswa: 26039912\n\nAdalah benar siswa SMP Islam Al Hikmah Mayong Jepara yang bersangkutan memiliki catatan akhlak yang sangat baik, tidak pernah terlibat kasus kriminalitas/narkoba, dan berdisiplin tinggi.\n\nSurat keterangan ini diterbitkan guna melanjutkan studi ke Madrasah Aliyah Negeri.`
  },
  {
    id: 'out-5',
    letterNumber: '005/SP/SMPI-AH/V/2026',
    title: 'Surat Pemberitahuan Libur Penilaian Akhir Semester (PAS)',
    subject: 'Pemberitahuan kepada wali murid rincian jadwal PAS dan libur evaluasi raport',
    letterDate: '2026-05-24',
    receiver: 'Orang Tua / Wali Siswa Kelas VII-IX',
    responsiblePerson: 'Kurikulum Sekolah',
    category: 'Surat Pemberitahuan',
    status: 'Ditolak',
    rejectionNote: 'Format pembuka kurang formal, tolong masukkan landasan kalender akademik Disdikpora Mayong.',
    fileContent: `SURAT PEMBERITAHUAN LIBUR PAS\nNomor: 005/SP/SMPI-AH/V/2026\n\nBapak/Ibu yang kami hormati,\n\nDengan selesainya PAS Semester Genap, maka anak-anak akan belajar di rumah masing-masing selama guru melakukan imputasi nilai Raport digital.\n\nLibur berlangsung mulai 15 Juni sampai 28 Juni 2026.\nSiswa masuk kembali 29 Juni 2026.\n\nHarap dipantau belajarnya dirumah. Bye.`
  }
];

const INITIAL_TEMPLATES: LetterTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Surat Tugas Standar',
    code: 'SURAT_TUGAS',
    content: `YAYASAN AL HIKMAH MAYONG
SMP ISLAM AL HIKMAH MAYONG
TERAKREDITASI A
Jl. Pancasila No. 12, Pelemkerep, Mayong, Jepara

----------------------------------------------------
SURAT TUGAS
Nomor: [NOMOR_SURAT]

Yang bertanda tangan di bawah ini, Kepala SMP Islam Al Hikmah Mayong menerjunkan dan menugaskan kepada personil berikut:

Nama: [NAMA_PENERIMA_TUGAS]
Jabatan/Peran: [JABATAN]

Untuk melaksanakan tugas sebagai:
[URAIAN_TUGAS]

Pada hari/tanggal: [TANGGAL_TUGAS]
Tempat Pelaksanaan: [LOKASI_TUGAS]

Demikian surat tugas ini diberikan kepada yang bersangkutan untuk dipergunakan secara sah dengan kewajiban berkoordinasi pasca-penugasan.

Ditetapkan di: Mayong, [TANGGAL_SURAT]
Kepala Sekolah,


M. Syafi'i, S.ThI`,
    variables: ['NOMOR_SURAT', 'NAMA_PENERIMA_TUGAS', 'JABATAN', 'URAIAN_TUGAS', 'TANGGAL_TUGAS', 'LOKASI_TUGAS', 'TANGGAL_SURAT'],
    updatedAt: '2026-05-29T10:00:00Z',
    updatedBy: 'Achmad Fauzi, S.Pd.'
  },
  {
    id: 'tpl-2',
    name: 'Surat Undangan Resmi',
    code: 'SURAT_UNDANGAN',
    content: `YAYASAN AL HIKMAH MAYONG
SMP ISLAM AL HIKMAH MAYONG
TERAKREDITASI A
Jl. Pancasila No. 12, Pelemkerep, Mayong, Jepara

----------------------------------------------------
Nomor: [NOMOR_SURAT]
Perihal: Undangan Rapat / Silaturahmi 
Lampiran: [LAMPIRAN]

Kepada Yth.
[NAMA_UNDANGAN]
Di Tempat

Assalamu'alaikum Wr. Wb.

Puji syukur kehadirat Allah SWT atas segala nikmat-Nya. Dengan ini kami mengharap kehadiran Bapak/Ibu/Saudara pada rapat yang akan kami selenggarakan pada:

Hari/Tgl: [TANGGAL_RAPAT]
Waktu: [WAKTU_RAPAT]
Tempat: [TEMPAT_RAPAT]
Acara: [ACARA_RAPAT]

Mengingat pentingnya koordinASI ini, kami mengharapkan kehadiran Bapak/Ibu tepat waktu. Atas perhatiannya kami haturkan terima kasih.

Wassalamu'alaikum Wr. Wb.

Mayong, [TANGGAL_SURAT]
Kepala Sekolah,


M. Syafi'i, S.ThI`,
    variables: ['NOMOR_SURAT', 'LAMPIRAN', 'NAMA_UNDANGAN', 'TANGGAL_RAPAT', 'WAKTU_RAPAT', 'TEMPAT_RAPAT', 'ACARA_RAPAT', 'TANGGAL_SURAT'],
    updatedAt: '2026-05-24T12:00:00Z',
    updatedBy: 'Lailatul Fitriyah, S.Ak.'
  },
  {
    id: 'tpl-3',
    name: 'Surat Keterangan Sekolah',
    code: 'SURAT_KETERANGAN',
    content: `SMP ISLAM AL HIKMAH MAYONG
KEDINASAN JEPARA / TERAKREDITASI A
Alamat: Pelemkerep, Mayong, Jepara

----------------------------------------------------
SURAT KETERANGAN
Nomor: [NOMOR_SURAT]

Kepala SMP Islam Al Hikmah Mayong Jepara, menerangkan dengan sebenarnya bahwa:

Nama Lengkap: [NAMA_SISWA]
NISN / NIS: [NOMOR_INDUK]
Kelas: [KELAS_SISWA]

Adalah benar-benar murid yang terdaftar aktif belajar di sekolah kami saat ini pada semester genap Tahun Ajaran 2026/2027.

Catatan Akhlak: Baik / Sangat Menunjang

Demikian surat keterangan berstatus aktif siswa ini dibuat dengan jujur agar bisa dipergunakan untuk keperluan: [PERUNTUKAN_SURAT]

Dikeluarkan di: Mayong
Pada Tanggal: [TANGGAL_SURAT]
Kepala Sekolah,


M. Syafi'i, S.ThI`,
    variables: ['NOMOR_SURAT', 'NAMA_SISWA', 'NOMOR_INDUK', 'KELAS_SISWA', 'PERUNTUKAN_SURAT', 'TANGGAL_SURAT'],
    updatedAt: '2026-05-20T14:30:00Z',
    updatedBy: 'Lailatul Fitriyah, S.Ak.'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-05-31T08:00:00Z',
    userId: 'u-1',
    username: 'admin',
    role: 'Super Admin',
    action: 'LOGIN_SUCCESS',
    details: 'Berhasil login ke sistem dari IP 192.168.1.10',
    module: 'Autentikasi',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'log-2',
    timestamp: '2026-05-31T08:15:00Z',
    userId: 'u-3',
    username: 'tatausaha',
    role: 'Tata Usaha',
    action: 'CREATE_SURAT_KELUAR',
    details: 'Membuat draf Surat Undangan Rapat Pleno Komite Wali Murid (out-2)',
    module: 'Surat Keluar',
    ipAddress: '192.168.1.12'
  },
  {
    id: 'log-3',
    timestamp: '2026-05-31T09:20:00Z',
    userId: 'u-2',
    username: 'kepsek',
    role: 'Kepala Sekolah',
    action: 'SIGN_SURAT_KELUAR',
    details: 'Menandatangani Surat Tugas Workshop ANBK (out-1) dan menempelkan stempel, QR verification diterbitkan',
    module: 'Signature & QR',
    ipAddress: '192.168.1.11'
  },
  {
    id: 'log-4',
    timestamp: '2026-05-31T10:10:00Z',
    userId: 'u-2',
    username: 'kepsek',
    role: 'Kepala Sekolah',
    action: 'REJECT_SURAT_KELUAR',
    details: 'Menolak draf Surat Pemberitahuan Libur 005/SP/SMPI-AH/V/2026 alasan perbaikan pembuka',
    module: 'Surat Keluar',
    ipAddress: '192.168.1.11'
  },
  {
    id: 'log-5',
    timestamp: '2026-05-31T11:00:00Z',
    userId: 'u-1',
    username: 'admin',
    role: 'Super Admin',
    action: 'UPDATE_SCHOOL_SETTINGS',
    details: 'Memperbarui alamat situs web sekolah di menu pengaturan',
    module: 'Pengaturan',
    ipAddress: '192.168.1.10'
  }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'not-1',
    title: 'Surat Masuk Baru',
    message: 'Dinas Pendidikan Jepara mengirimkan surat Asesmen ANBK (Segera disposisi).',
    type: 'warning',
    isRead: false,
    createdAt: '2026-05-30T10:00:00Z'
  },
  {
    id: 'not-2',
    title: 'Persetujuan Surat Diperlukan',
    message: 'TU mengajukan draf Undangan Rapat Komite Wali Murid untuk diperiksa Kepala Sekolah.',
    type: 'info',
    isRead: false,
    createdAt: '2026-05-31T08:20:00Z'
  },
  {
    id: 'not-3',
    title: 'Surat Tugas Sukses Diterbitkan',
    message: 'Surat Tugas Workshop ANBK telah ditandatangani digital oleh Kepala Sekolah.',
    type: 'success',
    isRead: true,
    createdAt: '2026-05-31T09:20:00Z'
  }
];

// Helper to load or initialize database
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error loading state for ${key}`, error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving state for ${key}`, error);
  }
}

export const getDB = () => {
  const users = getStorageItem<User[]>(DB_KEYS.USERS, INITIAL_USERS);
  // Ensure Luthfi admin is introduced to prevent stale localStorage issues
  const hasLuthfi = users.some(u => u.username.toLowerCase() === 'luthfi');
  if (!hasLuthfi) {
    const luthfiUser = INITIAL_USERS.find(u => u.username.toLowerCase() === 'luthfi');
    if (luthfiUser) {
      users.unshift(luthfiUser);
      setStorageItem(DB_KEYS.USERS, users);
    }
  }
  return {
    users,
    incomingLetters: getStorageItem<IncomingLetter[]>(DB_KEYS.INCOMING_LETTERS, INITIAL_INCOMING_LETTERS),
    dispositions: getStorageItem<Disposition[]>(DB_KEYS.DISPOSITIONS, INITIAL_DISPOSITIONS),
    outgoingLetters: getStorageItem<OutgoingLetter[]>(DB_KEYS.OUTGOING_LETTERS, INITIAL_OUTGOING_LETTERS),
    templates: getStorageItem<LetterTemplate[]>(DB_KEYS.TEMPLATES, INITIAL_TEMPLATES),
    schoolSettings: getStorageItem<SchoolSettings>(DB_KEYS.SCHOOL_SETTINGS, INITIAL_SCHOOL_SETTINGS),
    signatureConfig: getStorageItem<ESignatureConfig>(DB_KEYS.SIGNATURE_CONFIG, INITIAL_SIGNATURE_CONFIG),
    auditLogs: getStorageItem<AuditLog[]>(DB_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
    notifications: getStorageItem<Notification[]>(DB_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  };
};

export const saveDB = {
  users: (data: User[]) => setStorageItem(DB_KEYS.USERS, data),
  incomingLetters: (data: IncomingLetter[]) => setStorageItem(DB_KEYS.INCOMING_LETTERS, data),
  dispositions: (data: Disposition[]) => setStorageItem(DB_KEYS.DISPOSITIONS, data),
  outgoingLetters: (data: OutgoingLetter[]) => setStorageItem(DB_KEYS.OUTGOING_LETTERS, data),
  templates: (data: LetterTemplate[]) => setStorageItem(DB_KEYS.TEMPLATES, data),
  schoolSettings: (data: SchoolSettings) => setStorageItem(DB_KEYS.SCHOOL_SETTINGS, data),
  signatureConfig: (data: ESignatureConfig) => setStorageItem(DB_KEYS.SIGNATURE_CONFIG, data),
  auditLogs: (data: AuditLog[]) => setStorageItem(DB_KEYS.AUDIT_LOGS, data),
  notifications: (data: Notification[]) => setStorageItem(DB_KEYS.NOTIFICATIONS, data)
};

// Log action helper
export const pushAuditLog = (userId: string, action: string, details: string, module: string) => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId) || INITIAL_USERS[0];
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: user.id,
    username: user.username,
    role: user.role,
    action,
    details,
    module,
    ipAddress: '192.168.1.' + Math.floor(Math.random() * 20 + 10)
  };
  const updatedLogs = [newLog, ...db.auditLogs];
  saveDB.auditLogs(updatedLogs);
  return updatedLogs;
};

// Add Notification Helper
export const pushNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
  const db = getDB();
  const newNot: Notification = {
    id: `not-${Date.now()}`,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  const updated = [newNot, ...db.notifications];
  saveDB.notifications(updated);
  return updated;
};
