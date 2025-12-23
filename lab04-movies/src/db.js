import Database from 'better-sqlite3';
export const db = new Database('./movies.db');
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS Movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS Ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  FOREIGN KEY(movie_id) REFERENCES Movies(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS IX_Ratings_Movie ON Ratings(movie_id);
CREATE INDEX IF NOT EXISTS IX_Movies_Year ON Movies(year);
`);
