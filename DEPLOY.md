# SIMAHAT — Panduan Deployment Resmi di Hostinger (Static SPA vs Node.js Server)

Aplikasi **SIMAHAT** (Sistem Manajemen Surat SMP Islam Al Hikmah Mayong) kini mendukung dua metode deployment di Hostinger. Anda bebas memilih metode mana yang paling sesuai dengan kebutuhan Anda.

---

## METODE A: Deployment sebagai HTML/CSS/JS Statis (SANGAT DIREKOMENDASIKAN 🌟)

Karena SIMAHAT adalah aplikasi React Single Page Application (SPA), metode ini merupakan metode yang **paling mudah, paling cepat, bebas lag, dan tidak membutuhkan resource server Node.js**.

### Langkah 1: Bangun Berkas Produksi (Lokal)
Di komputer lokal Anda, jalankan perintah berikut:
```bash
npm install
npm run build
```
Proses ini akan menghasilkan folder **`dist/`** yang berisi seluruh aset teroptimasi.

### Langkah 2: Unggah ke File Manager Hostinger
1. Masuk ke **hPanel Hostinger** -> **File Manager**.
2. Masuk ke direktori **`public_html`** milik domain/subdomain Anda.
3. Hapus berkas default bawaan Hostinger (seperti `default.php` jika ada).
4. Unggah **SELURUH ISI dari dalam folder `dist/`** (bukan folder `dist` itu sendiri) ke dalam `public_html`.
   * Berkas `index.html` harus berada langsung di dalam `public_html/index.html`.

### Langkah 3: Konfigurasi Berkas `.htaccess` (PENTING untuk Navigasi Web)
Buat berkas baru bernama **`.htaccess`** tepat di dalam folder `public_html/`, lalu isi dengan kode berikut:
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
*Skrip ini memastikan bahwa jika halaman di-refresh, pengguna tidak akan terkena error 404.*

---

## METODE B: Deployment sebagai Aplikasi Server Node.js / Express

Jika layanan hosting Anda (VPS atau panel Hostinger khusus) mengharuskan runtime Node.js aktif dan memvalidasi berkas entry-point `server.js`, kami telah menyiapkannya untuk Anda!

Kami telah menambahkan berkas **`/server.ts`** (sumber utama), **`/server.js`** (entri utama kompatibilitas), dan mengonfigurasi otomatis compile bundler **esbuild** di dalam `package.json`.

### Langkah 1: Buat dan Setup Node.js App di Hostinger hPanel
1. Buka **hPanel Hostinger** Anda dan cari **Node.js**.
2. Klik **Create Application** (Buat Aplikasi).
3. Isi parameter konfigurasi berikut:
   * **Node.js version**: Rekomendasi pilih versi terbaru (v18 ke atas)
   * **Application path**: Lokasi direktori aplikasi Anda (contoh: `public_html` atau folder khusus)
   * **Application URL**: Subdomain atau domain utama Anda
   * **Application startup file**: Isi dengan **`server.js`** (berkas ini telah kami buat di root directory!)
4. Klik **Create** untuk menyimpan.

### Langkah 2: Unggah Seluruh Source Code
1. Unggah seluruh berkas projek Anda (termasuk `package.json`, `server.js`, `server.ts`, folder `src/`, dan lainnya) ke direktori aplikasi yang Anda pilih di Langkah 1.
2. Anda **TIDAK PERLU** mengunggah folder `node_modules` guna mencegah proses transfer lambat.

### Langkah 3: Jalankan Instalasi & Build di Hostinger
Jika Hostinger Anda memiliki akses SSH atau tombol kontrol di hPanel:
1. Hubungkan SSH atau buka terminal di hPanel Node.js.
2. Jalankan instalasi dependensi:
   ```bash
   npm install
   ```
3. Bangun bundel server dan client statis serta file `server.cjs` yang tangguh:
   ```bash
   npm run build
   ```
   *Perintah ini akan secara otomatis memanggil compiler Vite untuk mem-build frontend ke folder `dist`, serta memanggil compiler `esbuild` bertenaga tinggi untuk membundel server TS Anda menjadi `dist/server.cjs` yang ramping.*
4. Nyalakan aplikasi melalui dashboard hPanel Hostinger Anda dengan mengeklik tombol **Start** atau **Restart App**.

Selesai! Sekarang aplikasi SIMAHAT Anda akan menyala menggunakan server Node.js/Express mandiri di Hostinger Anda.
