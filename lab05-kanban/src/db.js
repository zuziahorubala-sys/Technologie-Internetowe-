import Database from 'better-sqlite3';

export const db = new Database('./kanban.db');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS Columns (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ord  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS Tasks (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  title  TEXT NOT NULL,
  col_id INTEGER NOT NULL,
  ord    INTEGER NOT NULL,
  FOREIGN KEY(col_id) REFERENCES Columns(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS UX_Columns_Ord ON Columns(ord);
CREATE INDEX IF NOT EXISTS IX_Tasks_ColOrd ON Tasks(col_id, ord);
`);
