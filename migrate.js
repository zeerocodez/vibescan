import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';

const sql = fs.readFileSync('migration.sql', 'utf8');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  console.log("Running migration manually...");
  await pool.query(sql);
  console.log("Migration complete!");
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
