import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.join(__dirname, 'dist');

// Check if production build exists to prevent Passenger 503 crashes
const hasBuild = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

if (!hasBuild) {
  app.get('*', (req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SIMAHAT - Setup Server Sukses</title>
        <style>
          body { 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            background: #f8fafc; 
            color: #1e293b; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            padding: 20px;
            box-sizing: border-box;
          }
          .card { 
            background: white; 
            padding: 2.5rem; 
            border-radius: 1.5rem; 
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.04); 
            max-width: 550px; 
            width: 100%;
            border: 1px solid #e2e8f0; 
            text-align: center;
          }
          .badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            font-size: 11px;
            font-weight: 700;
            padding: 6px 14px;
            border-radius: 9999px;
            text-transform: uppercase;
            margin-bottom: 1.5rem;
            letter-spacing: 0.05em;
          }
          h2 { 
            color: #1e3a8a; 
            margin-top: 0; 
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          p { 
            line-height: 1.6; 
            font-size: 14.5px; 
            color: #64748b; 
            margin-bottom: 1.5rem;
          }
          .alert {
            background: #fef3c7;
            border-left: 4px solid #d97706;
            color: #92400e;
            padding: 1rem;
            border-radius: 0.5rem;
            text-align: left;
            font-size: 13px;
            margin-bottom: 1.5rem;
            line-height: 1.5;
          }
          .instructions {
            text-align: left;
            background: #f1f5f9;
            padding: 1.2rem;
            border-radius: 0.75rem;
            font-size: 13.5px;
            color: #334155;
            border: 1px solid #e2e8f0;
          }
          ol {
            margin: 0;
            padding-left: 1.2rem;
          }
          li {
            margin-bottom: 0.5rem;
          }
          code { 
            background: #cbd5e1; 
            padding: 0.15rem 0.35rem; 
            border-radius: 0.25rem; 
            font-family: ui-monospace, monospace; 
            font-size: 12.5px; 
            color: #0f172a; 
            font-weight: bold;
          }
          .footer { 
            margin-top: 2rem; 
            font-size: 11px; 
            color: #94a3b8; 
            font-weight: 600;
            letter-spacing: 0.02em;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">Koneksi Berhasil</span>
          <h2>Koneksi Node.js Hostinger Berhasil!</h2>
          <p>Mesin web server Node.js SIMAHAT telah aktif dan mendengarkan permintaan di Hostinger. Namun, Anda melihat halaman ini karena berkas frontend produksi (HTML/React compilation) belum dibuat.</p>
          
          <div class="alert">
            <strong>Mengapa ini terjadi?</strong><br>
            Aplikasi Anda menggunakan build statis produksi di dalam folder <code>/dist</code>. Folder ini belum terisi karena perintah build perlahan belum dijalankan atau gagal akibat batas memori hosting.
          </div>

          <div class="instructions">
            <strong>Cara Menyelesaikan (Pilih salah satu):</strong>
            <ol style="margin-top: 0.5rem;">
              <li><strong>Unggah folder <code>/dist</code> hasil build lokal Anda:</strong><br> Jalankan <code>npm run build</code> di komputer Anda, lalu unggah seluruh berkas di dalam folder <code>dist/</code> tersebut langsung ke folder server Hostinger Anda menggunakan File Manager.</li>
              <li style="margin-top: 0.75rem;"><strong>Atau, Jalankan Build di Hosting:</strong><br> Masuk ke SSH / Terminal panel Hostinger, lalu ketik perintah:<br> <code>npm run build</code></li>
            </ol>
          </div>
          
          <div class="footer">SIMAHAT • SMP ISLAM AL HIKMAH MAYONG</div>
        </div>
      </body>
      </html>
    `);
  });
} else {
  // Serve the static build
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle Passenger termination gracefully
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated');
  });
});
