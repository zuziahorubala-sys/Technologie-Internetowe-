import fs from 'fs';
const DB_FILE = './kanban.db';
if (fs.existsSync(DB_FILE)) fs.rmSync(DB_FILE);
console.log('Reset OK');
