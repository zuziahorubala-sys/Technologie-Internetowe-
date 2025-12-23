import Database from 'better-sqlite3';

const DB_FILE = './library.db';
export const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS Members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  copies INTEGER NOT NULL CHECK (copies >= 0)
);

CREATE TABLE IF NOT EXISTS Loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  loan_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT,
  FOREIGN KEY(member_id) REFERENCES Members(id) ON DELETE CASCADE,
  FOREIGN KEY(book_id)  REFERENCES Books(id)   ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_Loans_Member ON Loans(member_id);
CREATE INDEX IF NOT EXISTS IX_Loans_BookReturn ON Loans(book_id, return_date);
`);
