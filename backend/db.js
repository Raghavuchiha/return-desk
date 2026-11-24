const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Check backend/.env.");
}

const pool = new Pool({
  connectionString,
  max: 2,
  connectionTimeoutMillis: 5000,
});

module.exports = pool;