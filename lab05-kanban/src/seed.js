import { db } from './db.js';

export default function seedIfEmpty() {
  const colCount = db.prepare('SELECT COUNT(*) AS c FROM Columns').get().c;
  if (colCount === 0) {
    const ins = db.prepare('INSERT INTO Columns(name, ord) VALUES (?, ?)');
    ins.run('Todo', 1);
    ins.run('Doing', 2);
    ins.run('Done', 3);
  }

  const taskCount = db.prepare('SELECT COUNT(*) AS c FROM Tasks').get().c;
  if (taskCount === 0) {
    const cols = db.prepare('SELECT id, name FROM Columns ORDER BY ord').all();
    const byName = Object.fromEntries(cols.map(c => [c.name, c.id]));
    const insT = db.prepare('INSERT INTO Tasks(title, col_id, ord) VALUES (?, ?, ?)');
    insT.run('Zaprojektować API', byName['Todo'], 1);
    insT.run('Zrobić UI tablicy', byName['Todo'], 2);
    insT.run('Dodać walidację', byName['Doing'], 1);
    insT.run('Sprawdzić testy REST', byName['Done'], 1);
  }
}
