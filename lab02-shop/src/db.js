import Database from 'better-sqlite3';

const DB_FILE = './shop.db';
export const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS Products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS CartItems (
  product_id INTEGER PRIMARY KEY,
  qty INTEGER NOT NULL CHECK (qty > 0),
  FOREIGN KEY(product_id) REFERENCES Products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS OrderItems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price REAL NOT NULL,
  FOREIGN KEY(order_id) REFERENCES Orders(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES Products(id)
);

CREATE INDEX IF NOT EXISTS IX_OrderItems_Order ON OrderItems(order_id);
`);
