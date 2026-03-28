import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/**
 * SQLite database with graceful fallback.
 *
 * On Vercel (read-only filesystem), better-sqlite3 can't create/write the
 * database file. Instead of crashing the entire app, we export `null` and
 * all consumers check `if (db)` before using it. This allows tools, the
 * converter, and the UI to work without auth/rate-limiting/history.
 */

let db: Database.Database | null = null;

try {
  const DB_PATH = path.join(process.cwd(), "data", "convertimg.db");
  const dataDir = path.dirname(DB_PATH);

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // Singleton for dev hot-reload
  const globalForDb = global as typeof globalThis & { _db?: Database.Database };
  db = globalForDb._db ?? new Database(DB_PATH);
  if (process.env.NODE_ENV !== "production") globalForDb._db = db;

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT,
      password_hash TEXT,
      plan          TEXT NOT NULL DEFAULT 'free',
      image         TEXT,
      is_admin      INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS conversions (
      id             TEXT PRIMARY KEY NOT NULL,
      user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename       TEXT NOT NULL,
      from_format    TEXT NOT NULL,
      to_format      TEXT NOT NULL,
      tool           TEXT NOT NULL DEFAULT 'converter',
      original_size  INTEGER NOT NULL DEFAULT 0,
      converted_size INTEGER NOT NULL DEFAULT 0,
      created_at     INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS daily_usage (
      user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date     TEXT NOT NULL,
      count    INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date)
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id                TEXT PRIMARY KEY NOT NULL,
      reference_number  TEXT UNIQUE NOT NULL,
      name              TEXT NOT NULL,
      email             TEXT NOT NULL,
      subject           TEXT NOT NULL,
      priority          TEXT NOT NULL DEFAULT 'medium',
      tool_related      TEXT,
      os_browser        TEXT,
      message           TEXT NOT NULL,
      screenshot_base64 TEXT,
      status            TEXT NOT NULL DEFAULT 'open',
      admin_notes       TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_notifications (
      id           TEXT PRIMARY KEY NOT NULL,
      type         TEXT NOT NULL,
      message      TEXT NOT NULL,
      reference_id TEXT,
      is_read      INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS download_stats (
      id           TEXT PRIMARY KEY NOT NULL,
      platform     TEXT NOT NULL,
      format       TEXT NOT NULL,
      success      INTEGER NOT NULL DEFAULT 0,
      error_type   TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS platform_blocklist (
      platform   TEXT PRIMARY KEY NOT NULL,
      disabled   INTEGER NOT NULL DEFAULT 0,
      reason     TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`);
  } catch { /* column already exists */ }

} catch (err) {
  console.warn("SQLite unavailable (likely Vercel/read-only FS):", (err as Error).message);
  db = null;
}

export default db;
