"use strict";

/** Routes for companies */

const express = require("express");
const { route } = require("../app");
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
  const result = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
    [code]
  );
  const company = result.rows[0];
  if (!company) {
    throw new NotFoundError("No such company");
  }
  return res.json({ company });
});

/** POST /companies - create new company from data
 *    return '{company: {code, name, description}}'
 */
router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;

  if (!code || !name || !description) {
    throw new BadRequestError("Missing required data");
  }

  // TODO: throw error for duplicate

  const result = await db.query(
    `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
    [code, name, description]
  );
  const company = result.rows[0];
  console.log("result=", result);
  return res.status(201).json({ company });
});

module.exports = router;
