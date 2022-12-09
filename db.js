/** Database setup for BizTime. */

const { Client } = require("pg");
require("dotenv").config();

/** Setup for Windows environment. */
const DB_URI = process.env.NODE_ENV === "test"
  ? process.env.DATABASE_TEST
  : process.env.DATABASE;

/** MAC setup. */
// const DB_URI = process.env.NODE_ENV === "test"
//   ? "postgresql:///biztime_2_test"
//   : "postgresql:///biztime_2";

let db = new Client({
  connectionString: DB_URI
});

db.connect();

module.exports = db;