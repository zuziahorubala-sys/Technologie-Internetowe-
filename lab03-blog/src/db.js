import Database from 'better-sqlite3';

const DB_FILE = './blog.db';
export const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS Posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(post_id) REFERENCES Posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_Comments_Post ON Comments(post_id);
CREATE INDEX IF NOT EXISTS IX_Comments_PostApproved ON Comments(post_id, approved, created_at);
`);
