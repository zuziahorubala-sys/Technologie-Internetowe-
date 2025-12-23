import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireJson } from '../middleware/validate.js';
import { todayYMD, addDaysYMD } from '../util/date.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT l.id, l.member_id, m.name AS member_name, l.book_id, b.title AS book_title,
           l.loan_date, l.due_date, l.return_date
    FROM Loans l
    JOIN Members m ON m.id = l.member_id
    JOIN Books b   ON b.id = l.book_id
    ORDER BY l.id DESC
  `).all();
  res.json(rows);
});

router.get('/overdue', (req, res) => {
  const today = todayYMD();
  const rows = db.prepare(`
    SELECT l.id, m.name AS member_name, b.title AS book_title, l.loan_date, l.due_date
    FROM Loans l
    JOIN Members m ON m.id = l.member_id
    JOIN Books b   ON b.id = l.book_id
    WHERE l.return_date IS NULL AND l.due_date < ?
    ORDER BY l.due_date ASC
  `).all(today);
  res.json(rows);
});

router.post('/borrow', requireJson, (req, res, next) => {
  const schema = z.object({
    member_id: z.number().int().positive(),
    book_id: z.number().int().positive(),
    days: z.number().int().positive().max(90)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  const { member_id, book_id, days } = parsed.data;

  const txn = db.transaction(() => {
    const book = db.prepare('SELECT id, copies FROM Books WHERE id = ?').get(book_id);
    if (!book) return { status: 404, message: 'Book not found' };

    const activeCount = db.prepare('SELECT COUNT(*) AS c FROM Loans WHERE book_id = ? AND return_date IS NULL').get(book_id).c;
    if (activeCount >= book.copies) return { status: 409, message: 'No copies available' };

    const member = db.prepare('SELECT id FROM Members WHERE id = ?').get(member_id);
    if (!member) return { status: 404, message: 'Member not found' };

    const loanDate = todayYMD();
    const dueDate = addDaysYMD(loanDate, days);

    const info = db.prepare(`
      INSERT INTO Loans(member_id, book_id, loan_date, due_date, return_date)
      VALUES (?, ?, ?, ?, NULL)
    `).run(member_id, book_id, loanDate, dueDate);

    return { status: 201, id: info.lastInsertRowid };
  });

  const result = txn();
  if (result.status !== 201) return res.status(result.status).json({ error: result.message });
  res.status(201).location(`/api/loans/${result.id}`).json({ id: result.id });
});

router.post('/return', requireJson, (req, res, next) => {
  const schema = z.object({ loan_id: z.number().int().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  const { loan_id } = parsed.data;

  const info = db.prepare('SELECT id, return_date FROM Loans WHERE id = ?').get(loan_id);
  if (!info) return res.status(404).json({ error: 'Loan not found' });
  if (info.return_date) return res.status(409).json({ error: 'Loan already returned' });

  db.prepare('UPDATE Loans SET return_date = ? WHERE id = ?').run(todayYMD(), loan_id);
  res.status(200).json({ ok: true });
});

export default router;
