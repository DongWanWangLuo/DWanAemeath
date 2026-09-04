import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const db = new Database(join(__dirname, '../../data/firedre.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
