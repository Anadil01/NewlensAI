const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../app");

test("GET /api/me/preferences requires authentication", async () => {
  const response = await request(app)
    .get("/api/me/preferences");

  assert.equal(response.status, 401);

  assert.equal(
    response.body.success,
    false
  );

  assert.equal(
    response.body.message,
    "Authentication required"
  );
});