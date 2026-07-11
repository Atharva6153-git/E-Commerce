const { Pool } = require('pg');
require('dotenv').config();

// Prefer a single DATABASE_URL (used in production, e.g. Neon on Render).
// Fall back to individual DB_HOST/PORT/etc vars for local Docker development.
const isProduction = !!process.env.DATABASE_URL;

const pool = isProduction
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required for Neon's managed Postgres
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

pool.on('connect', () => {
  console.log(`Connected to auth_db (Postgres) [${isProduction ? 'Neon/production' : 'local Docker'}]`);
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(-1);
});

module.exports = pool;