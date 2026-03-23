import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  const db = new Database("puzzlotrix.db");
  db.pragma("journal_mode = WAL");

  // Create Leaderboard table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      puzzle_type TEXT NOT NULL,
      grid_size INTEGER NOT NULL,
      time_ms INTEGER NOT NULL,
      moves INTEGER,
      seed INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.use(express.json());

  // API Routes
  app.get("/api/leaderboard", (req, res) => {
    const { type, size, limit } = req.query;
    const maxLimit = limit ? Math.min(100, parseInt(limit as string)) : 10;
    try {
      let stmt;
      if (type && size) {
        stmt = db.prepare("SELECT * FROM leaderboard WHERE puzzle_type = ? AND grid_size = ? ORDER BY time_ms ASC LIMIT ?");
        res.json(stmt.all(type, size, maxLimit));
      } else {
        stmt = db.prepare("SELECT * FROM leaderboard ORDER BY created_at DESC LIMIT 100");
        res.json(stmt.all());
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/leaderboard", (req, res) => {
    const { username, puzzle_type, grid_size, time_ms, moves, seed } = req.body;
    
    if (!username || !puzzle_type || !grid_size || !time_ms) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO leaderboard (username, puzzle_type, grid_size, time_ms, moves, seed)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(username, puzzle_type, grid_size, time_ms, moves, seed);
      res.json({ id: result.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
