const { Pool } = require('pg');
require('dotenv').config();

// This pool manages connections to the auth-db Postgres container.
// Notice DB_PORT is 5433 (the HOST port from docker-compose.yml),
// NOT 5432 -- that's the port INSIDE the container.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('Connected to auth_db (Postgres)');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(-1);
});

module.exports = pool;
