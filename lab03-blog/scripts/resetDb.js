import fs from 'fs';
const DB_FILE = './blog.db';
if (fs.existsSync(DB_FILE)) {
  fs.rmSync(DB_FILE);
  console.log('Removed', DB_FILE);
} else {
  console.log('No DB to remove.');
}
