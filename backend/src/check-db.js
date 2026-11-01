import 'dotenv/config';
import { checkDatabaseConnection, pool } from './db.js';
import { initializeDatabase } from './migrate.js';

try {
  await initializeDatabase();
  const connection = await checkDatabaseConnection();
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log(`Connected to PostgreSQL database: ${connection.database}`);
  console.log(`Tables: ${tables.rows.map(row => row.table_name).join(', ')}`);
} finally {
  await pool.end();
}
