const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const app = require("../app");
const config = require("../config/env");

const generateTestToken = (userId = "user-1") => {
  return jwt.sign(
    {
      sub: userId
    },
    config.jwtSecret,
    {
      algorithm: "HS256",
      expiresIn: "1h",
      issuer: config.jwtIssuer,
      audience: config.jwtAudience
    }
  );
};

const token = generateTestToken();

test("GET /api/me/source-preferences requires authentication", async () => {
  const response = await request(app)
    .get("/api/me/source-preferences");

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

test("POST /api/sources/:sourceId/follow rejects invalid source ID", async () => {
  const response = await request(app)
    .post("/api/sources/not-a-uuid/follow")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 400);

  assert.equal(
    response.body.success,
    false
  );

  assert.equal(
    response.body.message,
    "Validation failed"
  );
});

test("DELETE /api/sources/:sourceId/follow rejects invalid source ID", async () => {
  const response = await request(app)
    .delete("/api/sources/not-a-uuid/follow")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 400);

  assert.equal(
    response.body.success,
    false
  );

  assert.equal(
    response.body.message,
    "Validation failed"
  );
});