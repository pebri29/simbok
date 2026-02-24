import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import cors from "cors";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Database Setup (Simulating Cloudflare D1)
const dbPath = process.env.DB_PATH || path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    color TEXT,
    icon TEXT,
    parentId TEXT
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    date TEXT,
    status TEXT,
    size TEXT,
    letterNumber TEXT,
    classification TEXT,
    description TEXT,
    fileUrl TEXT,
    fileType TEXT,
    storagePath TEXT
  );
`);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(storageDir));

// Multer for local file storage
const storageDir = path.join(__dirname, "uploads");
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  }
});

const upload = multer({ storage: storageConfig });

// --- API Routes ---

// Categories
app.get("/api/categories", (req, res) => {
  const categories = db.prepare("SELECT * FROM categories").all();
  res.json(categories);
});

app.post("/api/categories", (req, res) => {
  const { id, name, color, icon, parentId } = req.body;
  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  
  if (existing) {
    db.prepare("UPDATE categories SET name = ?, color = ?, icon = ?, parentId = ? WHERE id = ?")
      .run(name, color, icon, parentId, id);
  } else {
    db.prepare("INSERT INTO categories (id, name, color, icon, parentId) VALUES (?, ?, ?, ?, ?)")
      .run(id || Date.now().toString(), name, color, icon, parentId);
  }
  res.json({ success: true });
});

app.delete("/api/categories/:id", (req, res) => {
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Documents
app.get("/api/documents", (req, res) => {
  const documents = db.prepare("SELECT * FROM documents").all();
  res.json(documents);
});

app.post("/api/documents", upload.single("file"), async (req, res) => {
  try {
    const docData = JSON.parse(req.body.document);
    let { fileUrl, storagePath } = docData;

    if (req.file) {
      storagePath = req.file.filename;
      // We use a relative URL so it works on any domain
      fileUrl = `/uploads/${storagePath}`;
    }

    const id = docData.id || Date.now().toString();
    const existing = db.prepare("SELECT * FROM documents WHERE id = ?").get(id);

    const params = [
      docData.name, docData.category, docData.date, docData.status, 
      docData.size, docData.letterNumber, docData.classification, 
      docData.description, fileUrl, docData.fileType, storagePath, id
    ];

    if (existing) {
      db.prepare(`
        UPDATE documents SET 
          name = ?, category = ?, date = ?, status = ?, 
          size = ?, letterNumber = ?, classification = ?, 
          description = ?, fileUrl = ?, fileType = ?, storagePath = ? 
        WHERE id = ?
      `).run(...params);
    } else {
      db.prepare(`
        INSERT INTO documents (
          name, category, date, status, size, letterNumber, 
          classification, description, fileUrl, fileType, storagePath, id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(...params);
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to save document" });
  }
});

app.delete("/api/documents/:id", async (req, res) => {
  const docData = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
  
  if (docData && docData.storagePath) {
    const filePath = path.join(storageDir, docData.storagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Vite Middleware for Frontend
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
