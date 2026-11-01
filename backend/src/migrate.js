import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(directory, '../migrations');

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const files = (await fs.readdir(migrationsDirectory)).filter(file => file.endsWith('.sql')).sort();
    for (const file of files) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (applied.rows.length) continue;
      const sql = await fs.readFile(path.join(migrationsDirectory, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(async () => { console.log('Database migrations completed.'); await pool.end(); })
    .catch(async error => { console.error('Database migration failed:', error.message); await pool.end(); process.exitCode = 1; });
}
