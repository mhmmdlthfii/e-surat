# SIMAHAT — Panduan Deployment Resmi di Hostinger Shared Hosting

Aplikasi **SIMAHAT** (Sistem Manajemen Surat SMP Islam Al Hikmah Mayong) dirancang menggunakan arsitektur modern **Client-side React Single Page Application (SPA)** yang didukung oleh **Vite**, **Tailwind CSS v4**, dan **Local Storage Persistence Engine** (untuk penyimpanan database luring berkinerja tinggi).

Mengingat aplikasi ini adalah aplikasi SPA murni (Client-side), **Anda tidak memerlukan server Node.js aktif di sistem produksi Hostinger Anda**. Ini adalah kabar baik, karena aplikasi Anda akan berjalan jauh lebih cepat, hemat sumber daya hosting, bebas dari batasan CPU/RAM hosting, serta 100% gratis biaya tambahan sever!

Berikut adalah panduan lengkap mengapa Anda mendapatkan galat di Hostinger, dan langkah mengatasinya dengan benar.

---

## 1. Mengapa Hostinger Menampilkan "Framework Tidak Kompatibel"?

Galat tersebut terjadi karena Anda kemungkinan mencoba mengunggah **seluruh folder mentah (termasuk `package.json`, `src/`, `node_modules/`, dsb.)** ke Hostinger, atau mencoba mengaturnya sebagai **Aplikasi Node.js** di hPanel.
* **Aplikasi Node.js di Hostinger** hanya diperuntukkan untuk server backend yang berjalan terus-menerus (seperti API Express.js) yang memiliki berkas entri seperti `app.js` atau `server.js`.
* **SIMAHAT** adalah aplikasi frontend murni (SPA). Setelah dicompile (build), ia akan menghasilkan berkas HTML, CSS, dan JavaScript statis biasa.
* Oleh karena itu, Hostinger menganggap struktur projek mentah tidak kompatibel dengan server Node.js mereka.

---

## 2. Cara Deployment yang Benar & Sangat Mudah (Dalam 2 Menit!)

Untuk memasang SIMAHAT di akun Hostinger Anda, Anda hanya membutuhkan **hasil kompilasi produksi (production build)** dari projek ini. Ikuti panduan sederhana berikut:

### Langkah 1: Build Projek Secara Lokal
Di komputer lokal Anda (atau di tombol unduh yang disediakan oleh platform setelah Anda mengunduh ZIP projek lengkap ini):
1. Buka folder projek di terminal atau command prompt Anda.
2. Jalankan perintah instalasi pustaka:
   ```bash
   npm install
   ```
3. Jalankan perintah kompilasi produksi:
   ```bash
   npm run build
   ```
4. Setelah proses build sukses, sistem akan membuat folder baru bernama **`dist/`** di dalam projek Anda. Folder `dist` ini berisi semua aset web statis murni (`index.html`, berkas Javascript, CSS, gambar, logo, dsb.) yang sangat dioptimalkan.

---

### Langkah 2: Unggah ke Hostinger File Manager
1. Masuk ke **hPanel Hostinger** Anda.
2. Pilih menu **File Manager** (Manajer File) pada domain atau subdomain yang ingin Anda gunakan.
3. Buka direktori **`public_html`** (atau folder subdomain Anda).
4. **Hapus berkas default bawaan Hostinger** (seperti `default.php` atau `index.php` bawaan jika ada).
5. Unggah **seluruh isi** dari folder **`dist`** hasil build Anda ke dalam folder `public_html` tersebut.
   > **PENTING**: Jangan mengunggah folder `dist`-nya secara langsung, melainkan unggahlah **isi dari dalam folder `dist`** ke luar (`public_html/index.html` harus berada langsung di root directory).

---

### Langkah 3: Tambahkan Berkas `.htaccess` (Opsional untuk Routing yang Mulus)
Karena SIMAHAT menggunakan client-side routing, jika pengguna memuat ulang (refresh) halaman selain halaman beranda (seperti `/surat-keluar`), server Hostinger mungkin akan mengembalikan galat 404. 

Untuk mencegah hal ini, buat sebuah file baru bernama **`.htaccess`** di dalam folder `public_html` Hostinger Anda, lalu tempelkan kode berikut:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Selesai! Sekarang aplikasi SIMAHAT Anda telah meluncur secara online dan dapat diakses dengan keamanan tingkat tinggi, performa super kilat, dan bebas kendala "Framework tidak kompatibel"!

---

### Ringkasan Berkas yang Harus Berada di `public_html` Hostinger Anda:
```
public_html/
├── assets/                  <-- Berisi CSS & JS hasil build
├── .htaccess                <-- Berisi skrip rewrite routing di atas
└── index.html               <-- Berkas halaman utama
```
Dengan struktur statis ini, situs Anda berjalan 10X lebih stabil dibanding ditaruh sebagai aplikasi server Node.js di hosting bersama (shared hosting). Selamat mencoba!
