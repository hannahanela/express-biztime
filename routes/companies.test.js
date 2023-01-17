"use strict";

const request = require("supertest");

const app = require("../app");
let db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
  INSERT INTO companies (code, name, description)
  VALUES ('testco', 'Test Company', 'Writer of Tests')
  RETURNING code, name, description
  `);
  testCompany = result.rows[0];
});

afterAll(async function () {
  await db.end();
});

/** GET /companies - get data about many companies
 *    return '{companies: [company, ...]}'
 */
describe("GET /companies", function () {
  it("Gets a list of companies", async function () {
    const resp = await request(app).get("/companies");

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      companies: [testCompany],
    });
  });
});

// FIXME: UPDATE GET /companies/:code TO INCLUDE INVOICES [ID, ...]

/** GET /companies/:code - get data about one company
 *    return '{company: {code, name, description}}'
 */
describe("GET /companies/:code", function () {
  it("Gets a single company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: { ...testCompany },
    });
  });

  it("Responds with 404 if code invalid", async function () {
    const resp = await request(app).get(`/companies/noco`);

    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      error: {
        message: "No such company",
        status: 404,
      },
    });
  });
});

/** POST /companies/ - create new company from data
 *    return '{company: {code, name, description}}'
 */
describe("POST /companies", function () {
  it("Creates a new company", async function () {
    const newCo = {
      code: "newco",
      name: "New Company",
      description: "Maker of New Companies",
    };
    const resp = await request(app).post("/companies").send(newCo);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: newCo,
    });

    const getCompanyResp = await request(app).get(`/companies/${newCo.code}`);

    expect(getCompanyResp.body).toEqual({
      company: { ...newCo },
    });
  });

  it("Responds with 400 if company is a duplicate", async function () {
    const resp = await request(app).post("/companies").send(testCompany);

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      error: {
        message: "Company already exists",
        status: 400,
      },
    });
  });

  it("Responds with 400 if company is missing data", async function () {
    const invalidCo = {};
    const resp = await request(app).post("/companies").send(invalidCo);

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      error: {
        message: "Missing required data",
        status: 400,
      },
    });
  });
});

/** PUT /companies/:code - updates an existing company
 *    return '{company: {code, name, description}}'
 */
describe("PUT /companies/:code", function () {
  it("Updates a single company", async function () {
    const updatedCo = {
      name: "Update Test Company",
      description: "Updater of Companies",
    };
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send(updatedCo);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: { ...updatedCo, code: testCompany.code },
    });

    const getCompanyResp = await request(app).get(
      `/companies/${testCompany.code}`
    );

    expect(getCompanyResp.statusCode).toEqual(200);
    expect(getCompanyResp.body).toEqual({
      company: { ...updatedCo, code: testCompany.code },
    });
  });

  it("Responds with 404 if code invalid", async function () {
    const updatedCo = {
      name: "Update Test Company",
      description: "Updater of Companies",
    };
    const resp = await request(app).put("/companies/noco").send(updatedCo);

    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      error: {
        message: "No such company",
        status: 404,
      },
    });
  });
});

/** DELETE /companies/:code - deletes a company
 *    return '{status: "deleted"}'
 */
describe("DELETE /companies/:code", function () {
  it("Deletes a single company", async function () {
    const resp = await request(app).delete(`/companies/${testCompany.code}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      status: "deleted",
    });

    const getCompanyResp = await request(app).get(
      `/companies/${testCompany.code}`
    );

    expect(getCompanyResp.statusCode).toEqual(404);
    expect(getCompanyResp.body).toEqual({
      error: {
        message: "No such company",
        status: 404,
      },
    });
  });

  it("Responds with 404 if code invalid", async function () {
    const resp = await request(app).delete("/companies/noco");

    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({
      error: {
        message: "No such company",
        status: 404,
      },
    });
  });
});
