"use strict";

/** Routes for companies */

const express = require("express");
const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const router = new express.Router();

/** GET /companies - get list of companies
 *    return '{companies: [company, ]}'
 *      with company as {code, name, description}
 */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name, description
            FROM companies`
  );
  const companies = results.rows;
  return res.json({ companies });
});

/** GET /companies/:code - get data about one company
 *    return '{company: {code, name, description} }'
 */
router.get("/:code", async function (req, res, next) {
  const code = req.params.code;
  const results = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
    [code]
  );
  const company = results.rows[0];
  if (!company) {
    throw new NotFoundError("No such company");
  }
  return res.json({ company });
});

module.exports = router;
