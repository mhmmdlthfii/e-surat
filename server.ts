import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync } from "fs";
import pg from "pg";
import mysql from "mysql2/promise";
import { MongoClient } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DBProvider {
  name: string;
  load(): Promise<any>;
  save(data: any): Promise<void>;
}

// 1. PostgreSQL DBProvider
class PGProvider implements DBProvider {
  name = "PostgreSQL";
  private client: any;

  constructor(private connectionString: string) {
    const ClientClass = pg.Client || (pg as any).default?.Client;
    this.client = new ClientClass({
      connectionString: this.connectionString,
      ssl: this.connectionString.includes("localhost") || this.connectionString.includes("127.0.0.1") ? false : { rejectUnauthorized: false }
    });
  }

  async init() {
    await this.client.connect();
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS simahat_db (
        id INT PRIMARY KEY,
        data TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const res = await this.client.query("SELECT id FROM simahat_db WHERE id = 1");
    if (res.rowCount === 0) {
      await this.client.query("INSERT INTO simahat_db (id, data) VALUES (1, '{}')");
    }
  }

  async load(): Promise<any> {
    const res = await this.client.query("SELECT data FROM simahat_db WHERE id = 1");
    if (res.rows && res.rows[0]) {
      return JSON.parse(res.rows[0].data);
    }
    return {};
  }

  async save(data: any): Promise<void> {
    const jsonStr = JSON.stringify(data);
    await this.client.query("UPDATE simahat_db SET data = $1, updated_at = NOW() WHERE id = 1", [jsonStr]);
  }
}

// 2. MySQL DBProvider
class MySQLProvider implements DBProvider {
  name = "MySQL";
  private connection: any = null;

  constructor(private connectionString: string) {}

  async init() {
    this.connection = await mysql.createConnection(this.connectionString);
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS simahat_db (
        id INT PRIMARY KEY,
        data LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    const [rows]: any = await this.connection.query("SELECT id FROM simahat_db WHERE id = 1");
    if (!rows || rows.length === 0) {
      await this.connection.query("INSERT INTO simahat_db (id, data) VALUES (1, '{}')");
    }
  }

  async load(): Promise<any> {
    const [rows]: any = await this.connection.query("SELECT data FROM simahat_db WHERE id = 1");
    if (rows && rows[0]) {
      const rowVal = rows[0].data;
      return typeof rowVal === "string" ? JSON.parse(rowVal) : rowVal;
    }
    return {};
  }

  async save(data: any): Promise<void> {
    const jsonStr = JSON.stringify(data);
    await this.connection.query("UPDATE simahat_db SET data = ? WHERE id = 1", [jsonStr]);
  }
}

// 3. MongoDB DBProvider
class MongoDBProvider implements DBProvider {
  name = "MongoDB";
  private client: MongoClient;
  private dbName = "simahat";

  constructor(private connectionString: string) {
    this.client = new MongoClient(this.connectionString);
  }

  async init() {
    await this.client.connect();
  }

  async load(): Promise<any> {
    const db = this.client.db(this.dbName);
    const collection = db.collection("state");
    const doc = await collection.findOne({ _id: "v1" as any });
    if (doc) {
      return doc.data || {};
    }
    return {};
  }

  async save(data: any): Promise<void> {
    const db = this.client.db(this.dbName);
    const collection = db.collection("state");
    await collection.updateOne(
      { _id: "v1" as any },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

// 4. Fallback FileProvider
class FileProvider implements DBProvider {
  name = "Local File (db.json)";
  constructor(private dbPath: string) {}

  async load(): Promise<any> {
    if (existsSync(this.dbPath)) {
      const fileData = await fs.readFile(this.dbPath, "utf-8");
      return JSON.parse(fileData);
    }
    return {};
  }

  async save(data: any): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2), "utf-8");
  }
}

function getDatabaseProvider(): DBProvider {
  const connStr = process.env.DATABASE_URL || 
                    process.env.MONGO_URI || 
                    process.env.MONGODB_URI || 
                    process.env.MYSQL_URL || 
                    process.env.POSTGRES_URL;

  if (!connStr) {
    console.log("No remote database URI environment variable found in .env. Falling back to local file storage.");
    return new FileProvider(path.join(process.cwd(), "db.json"));
  }

  try {
    if (connStr.startsWith("postgres://") || connStr.startsWith("postgresql://")) {
      return new PGProvider(connStr);
    } else if (connStr.startsWith("mysql://") || connStr.startsWith("mysqls://")) {
      return new MySQLProvider(connStr);
    } else if (connStr.startsWith("mongodb://") || connStr.startsWith("mongodb+srv://")) {
      return new MongoDBProvider(connStr);
    } else {
      console.warn(`Unrecognized DB connection string schema: "${connStr}". Falling back to local file storage.`);
    }
  } catch (error) {
    console.error("Failed to initialize remote DB provider:", error);
  }

  return new FileProvider(path.join(process.cwd(), "db.json"));
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Support JSON request body up to 50mb (for PDF/image base64 contents)
  app.use(express.json({ limit: "50mb" }));

  // Serve static public folder if it exists
  app.use(express.static(path.join(process.cwd(), "public")));

  let cachedDb: any = null;
  const dbProvider = getDatabaseProvider();
  console.log(`Selected Database Provider: ${dbProvider.name}`);

  // Load database on startup
  try {
    if (typeof (dbProvider as any).init === "function") {
      await (dbProvider as any).init();
    }
    cachedDb = await dbProvider.load();
    console.log(`Database loaded successfully using ${dbProvider.name} provider.`);
  } catch (err) {
    console.error(`Failed to load DB from remote provider (${dbProvider.name}), falling back to db.json:`, err);
    try {
      const fileFallback = new FileProvider(path.join(process.cwd(), "db.json"));
      cachedDb = await fileFallback.load();
      console.log("Fallback database loaded successfully from db.json file.");
    } catch (fallbackErr) {
      console.error("Failed to read fallback db.json file, initiating empty state:", fallbackErr);
      cachedDb = {};
    }
  }

  // API Router and endpoints
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      uptime: process.uptime(),
      dbType: dbProvider.name
    });
  });

  // GET db state
  app.get("/api/db", (req, res) => {
    res.json(cachedDb || {});
  });

  // POST update db state
  app.post("/api/db", async (req, res) => {
    try {
      cachedDb = req.body;
      
      try {
        await dbProvider.save(cachedDb);
      } catch (saveErr) {
        console.error(`Active database provider (${dbProvider.name}) failed on save, writing backup to db.json:`, saveErr);
        const fileFallback = new FileProvider(path.join(process.cwd(), "db.json"));
        await fileFallback.save(cachedDb);
      }
      
      res.json({ status: "success" });
    } catch (err) {
      console.error("Error writing database state:", err);
      res.status(500).json({ error: "Failed to write database state" });
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
