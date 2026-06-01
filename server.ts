import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Support JSON request body up to 50mb (for PDF/image base64 contents)
  app.use(express.json({ limit: "50mb" }));

  // Serve static public folder if it exists
  app.use(express.static(path.join(process.cwd(), "public")));

  let cachedDb: any = null;
  const dbPath = path.join(process.cwd(), "db.json");

  // Load database on startup if exists
  try {
    if (existsSync(dbPath)) {
      const fileData = await fs.readFile(dbPath, "utf-8");
      cachedDb = JSON.parse(fileData);
      console.log("Database loaded from db.json");
    }
  } catch (err) {
    console.error("Failed to load db.json, starting empty:", err);
  }

  // API Router and endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // GET db state
  app.get("/api/db", (req, res) => {
    res.json(cachedDb || {});
  });

  // POST update db state
  app.post("/api/db", async (req, res) => {
    try {
      cachedDb = req.body;
      await fs.writeFile(dbPath, JSON.stringify(cachedDb, null, 2), "utf-8");
      res.json({ status: "success" });
    } catch (err) {
      console.error("Error writing to db.json:", err);
      res.status(500).json({ error: "Failed to write database file" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
