import { db } from './db.js';
export default function seedIfEmpty(){
  const c = db.prepare('SELECT COUNT(*) AS c FROM Movies').get().c;
  if (c>0) return;
  const insM = db.prepare('INSERT INTO Movies(title, year) VALUES (?,?)');
  const m1 = insM.run('Interstellar', 2014).lastInsertRowid;
  const m2 = insM.run('Incepcja', 2010).lastInsertRowid;
  const m3 = insM.run('Matrix', 1999).lastInsertRowid;
  const m4 = insM.run('Whiplash', 2014).lastInsertRowid;
  const insR = db.prepare('INSERT INTO Ratings(movie_id, score) VALUES (?,?)');
  [5,5,4,5].forEach(s=>insR.run(m1,s));
  [5,4,4].forEach(s=>insR.run(m2,s));
  [5,5,5,4,5].forEach(s=>insR.run(m3,s));
  [5,4].forEach(s=>insR.run(m4,s));
}
