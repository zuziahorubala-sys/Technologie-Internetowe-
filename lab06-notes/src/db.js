import Database from 'better-sqlite3';

export const db = new Database('./notes.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS Notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS Tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Note_Tags (
  note_id INTEGER NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY(note_id) REFERENCES Notes(id) ON DELETE CASCADE,
  FOREIGN KEY(tag_id)  REFERENCES Tags(id)  ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_Notes_Created ON Notes(created_at);
CREATE INDEX IF NOT EXISTS IX_NoteTags_Tag ON Note_Tags(tag_id);
`);
