import { db } from './db.js';

export default function seedIfEmpty() {
  const c = db.prepare('SELECT COUNT(*) AS c FROM Products').get().c;
  if (c === 0) {
    const ins = db.prepare('INSERT INTO Products(name, price) VALUES (?, ?)');
    ins.run('Klawiatura', 129.99);
    ins.run('Mysz', 79.90);
    ins.run('Monitor', 899.00);
    ins.run('Słuchawki', 199.00);
  }
}
