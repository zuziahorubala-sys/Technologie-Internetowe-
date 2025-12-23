import { db } from './db.js';
import { todayYMD, addDaysYMD } from './util/date.js';

const seedIfEmpty = () => {
  const membersCount = db.prepare('SELECT COUNT(*) AS c FROM Members').get().c;
  const booksCount = db.prepare('SELECT COUNT(*) AS c FROM Books').get().c;

  if (membersCount === 0) {
    const stmt = db.prepare('INSERT INTO Members(name, email) VALUES (?, ?)');
    stmt.run('Ala', 'ala@example.com');
    stmt.run('Ola', 'ola@example.com');
  }

  if (booksCount === 0) {
    const stmt = db.prepare('INSERT INTO Books(title, author, copies) VALUES (?, ?, ?)');
    stmt.run('Wiedźmin', 'Sapkowski', 3);
    stmt.run('Pan Tadeusz', 'Mickiewicz', 2);
    stmt.run('Lalka', 'Prus', 1);
  }

  const loansCount = db.prepare('SELECT COUNT(*) AS c FROM Loans').get().c;
  if (loansCount === 0) {
    const loanDate = todayYMD();
    const dueDate = addDaysYMD(loanDate, 14);
    db.prepare(`INSERT INTO Loans(member_id, book_id, loan_date, due_date, return_date)
                VALUES(1, 1, ?, ?, NULL)`).run(loanDate, dueDate);
  }
};

export default seedIfEmpty;
