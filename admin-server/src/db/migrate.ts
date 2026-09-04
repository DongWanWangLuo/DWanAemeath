import { db } from './index';
import { join, dirname } from 'path';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function migrate() {
  const migrationsDir = join(__dirname, '../../migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    console.log('Applying migration:', file);
    db.exec(sql);
  }
  console.log('Migrations complete');
}
