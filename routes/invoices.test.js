"use strict";

const request = require("supertest");

const app = require("../app");
let db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async function () {
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");

  let resultsCompany = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('testco', 'Test Company', 'Writer of Tests')
    RETURNING code, name, description
    `);
  testCompany = resultsCompany.rows[0];

  let resultsInvoice = await db.query(`
    INSERT INTO invoices (comp_code, amt, paid, paid_date)
    VALUES ('testco', '100', FALSE, NULL)
    RETURNING id, comp_code, amt, paid, add_date, paid_date
    `);
  testInvoice = resultsInvoice.rows[0];
});

afterAll(async function () {
  await db.end();
});

/** GET /invoices - get data about many invoices
 *    return '{invoices: [invoice, ...]}'
 *        with invoice as {id, comp_code}
 */
describe("GET /invoices", function () {
  it("Gets a list of invoices", async function () {
    const resp = await request(app).get("/invoices");

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      // FIXME: expect random id, not testInvoice.id ????
      invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code }],
    });
  });
});

/** GET /invoices/:id - get data about one invoice
 *      return '{invoice: {id, amt, paid, add_date, paid_date,
 *          company: {code, name, description}}}'
 */
describe("GET /invoices/:id", function () {
  it("Gets a single invoice", async function () {
    const resp = await request(app).get(`/invoices/${testInvoice.id}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      invoice: { ...testInvoice, company: { ...testCompany } },
    });
  });

  it("Responds with 404 if id invalid", async function () {
    const resp = await request(app).get(`/invoices/5`);

    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      error: {
        message: "No such invoice",
        status: 404,
      },
    });
  });
});

/** POST /invoices - create new invoice from data
 *      return '{invoice: {id, comp_code, amt, paid, add_date, paid_date}}'
 */
describe("POST /invoices", function () {
  it("Creates a new invoice", async function () {
    const newInvoice = {
      comp_code: "testco",
      amt: 200,
      paid: FALSE,
      add_date: null,
    };
    const resp = await request(app).post("/invoices").send(newInvoice);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      // FIXME: need controlled id for newInvoice
      invoice: { ...newInvoice, id: 1, paid_date: null },
    });

    const getInvoiceResp = await request(app).get(`/invoices/${newInvoice.id}`);

    expect(getInvoiceResp.body).toEqual({
      // FIXME: need controlled id for newInvoice
      invoice: { ...newInvoice },
    });
  });

  it("Responds with 400 if invoice is a duplicate", async function () {
    const resp = await request(app).post("/invoices").send(testInvoice);

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      error: {
        message: "Invoice already exists",
        status: 400,
      },
    });
  });

  it("Responds with 400 if invoice is missing data", async function () {
    const invalidInvoice = {};
    const resp = await request(app).post("/invoices").send(invalidInvoice);

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      error: {
        message: "Missing required data",
        status: 400,
      },
    });
  });
});

/** PUT /invoices/:id - updates an existing invoice
 *    return '{invoice: {id, comp_code, amt, paid, add_date, paid_date}}'
 */
describe("PUT /invoices/:id", function () {
  it("Updates a single invoice", async function () {
    const updatedInvoice = {
      amt: 0,
    };
    const resp = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send(updatedInvoice);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      invoice: { ...updatedInvoice, id: testInvoice.id },
    });

    const getInvoiceResp = await request(app).get(
      `/invoices/${testInvoice.id}`
    );

    expect(getInvoiceResp.statusCode).toEqual(200);
    expect(getInvoiceResp.body).toEqual({
      invoice: { ...updatedInvoice, id: testInvoice.id },
    });
  });

  it("Responds with 404 if id invalid", async function () {
    const updatedInvoice = {
      amt: 0,
    };
    const resp = await request(app).put("/invoice/0").send(updatedInvoice);

    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      error: {
        message: "No such invoice",
        status: 404,
      },
    });
  });
});

/** DELETE /invoices/:id - deletes an invoice
 *    return '{status: "deleted"}'
 */
describe("DELETE /invoices/:id", function () {
  it("Deletes a single invoice", async function () {
    const resp = await request(app).delete(`/invoices/${testInvoice.id}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      status: "deleted",
    });

    const getInvoiceResp = await request(app).get(
      `/invoices/${testInvoice.id}`
    );

    expect(getInvoiceResp.statusCode).toEqual(404);
    expect(getInvoiceResp.body).toEqual({
      error: {
        message: "No such invoice",
        status: 404,
      },
    });
  });

  it("Responds with 404 if id invalid", async function () {
    const resp = await request(app).delete("/invoices/0");

    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      error: {
        message: "No such invoice",
        status: 404,
      },
    });
  });
});