import { db } from './db.js';
import { nowIso } from './util/date.js';

export default function seedIfEmpty() {
  const c = db.prepare('SELECT COUNT(*) AS c FROM Posts').get().c;
  if (c > 0) return;

  const insPost = db.prepare('INSERT INTO Posts(title, body, created_at) VALUES (?, ?, ?)');
  const p1 = insPost.run('Pierwszy post', 'Witaj w blogu demo. Ten post ma komentarze (część w moderacji).', nowIso()).lastInsertRowid;
  const p2 = insPost.run('Drugi post', 'Drugi wpis demonstracyjny.', nowIso()).lastInsertRowid;

  const insCom = db.prepare('INSERT INTO Comments(post_id, author, body, created_at, approved) VALUES (?, ?, ?, ?, ?)');
  insCom.run(p1, 'Ala', 'Super!', nowIso(), 1);
  insCom.run(p1, 'Olek', 'To czeka na moderację.', nowIso(), 0);
  insCom.run(p2, 'Kasia', 'Komentarz zatwierdzony.', nowIso(), 1);
  insCom.run(p2, 'Anon', 'Proszę zatwierdzić.', nowIso(), 0);
}
