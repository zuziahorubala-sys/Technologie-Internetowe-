import { db } from './db.js';

export default function seedIfEmpty() {
  const n = db.prepare('SELECT COUNT(*) AS c FROM Notes').get().c;
  if (n === 0) {
    const ins = db.prepare('INSERT INTO Notes(title, body) VALUES (?, ?)');
    ins.run('Plan na tydzień', 'Zadania: laby TI, zakupy, trening. Pamiętaj o terminach.');
    ins.run('Pomysł na projekt', 'Notatnik z tagami: work, home, uczelnia. Wyszukiwanie po frazach.');
    ins.run('Lista zakupów', 'Mleko, chleb, pomidory, makaron. Sprawdź promocje w sklepie.');
  }

  const t = db.prepare('SELECT COUNT(*) AS c FROM Tags').get().c;
  if (t === 0) {
    const insT = db.prepare('INSERT INTO Tags(name) VALUES (?)');
    ['work','home','uczelnia','todo'].forEach(x => insT.run(x));
  }

  // link a few tags
  const links = db.prepare(`
    INSERT OR IGNORE INTO Note_Tags(note_id, tag_id)
    VALUES (?, (SELECT id FROM Tags WHERE name=?))
  `);
  links.run(1, 'uczelnia');
  links.run(1, 'todo');
  links.run(2, 'work');
  links.run(2, 'uczelnia');
  links.run(3, 'home');
}
