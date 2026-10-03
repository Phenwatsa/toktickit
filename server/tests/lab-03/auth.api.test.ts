import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 13: Authentication API Tests
// Covers: API-01, API-02, API-03, API-04, API-05, API-19, API-20
// ---------------------------------------------------------------------------

describe("Lab 3 Auth REST API (auth.api.test.ts)", () => {
  const prisma = getPrisma();

  const testRequesterEmail = "jennifer.a@toktickit.local";
  const testPassword = "Password123!";
  const inactiveUserEmail = "alex.w@toktickit.local";
  const mustChangeUserEmail = "firstlogin.req@toktickit.local";
  const logoutUserEmail = "michael.b@toktickit.local";

  beforeAll(async () => {
    // Ensure test user states are initialized
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // Active user with mustChangePassword = false
    await prisma.user.upsert({
      where: { email: testRequesterEmail },
      update: { passwordHash, isActive: true, mustChangePassword: false, tokenVersion: 1 },
      create: {
        name: "Jennifer Anderson",
        email: testRequesterEmail,
        passwordHash,
        role: "REQUESTER",
        department: "Human Resources",
        isActive: true,
        mustChangePassword: false,
        tokenVersion: 1,
      },
    });

    // Dedicated user for logout testing to prevent tokenVersion mutation race conditions with other test suites
    await prisma.user.upsert({
      where: { email: logoutUserEmail },
      update: { passwordHash, isActive: true, mustChangePassword: false, tokenVersion: 1 },
      create: {
        name: "Michael Brown",
        email: logoutUserEmail,
        passwordHash,
        role: "REQUESTER",
        department: "Marketing",
        isActive: true,
        mustChangePassword: false,
        tokenVersion: 1,
      },
    });

    // Inactive user
    await prisma.user.upsert({
      where: { email: inactiveUserEmail },
      update: { passwordHash, isActive: false, mustChangePassword: false },
      create: {
        name: "Alex Wilson",
        email: inactiveUserEmail,
        passwordHash,
        role: "REQUESTER",
        department: "Contractor",
        isActive: false,
        mustChangePassword: false,
      },
    });

    // Active user requiring password change
    await prisma.user.upsert({
      where: { email: mustChangeUserEmail },
      update: { passwordHash, isActive: true, mustChangePassword: true },
      create: {
        name: "First Login Requester",
        email: mustChangeUserEmail,
        passwordHash,
        role: "REQUESTER",
        department: "Sales",
        isActive: true,
        mustChangePassword: true,
      },
    });
  });

  afterAll(async () => {
    // Restore mustChangePassword test user so manual testing and seeds remain valid
    const passwordHash = await bcrypt.hash(testPassword, 10);
    await prisma.user.update({
      where: { email: mustChangeUserEmail },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });
    // Restore logoutUserEmail tokenVersion and active status
    await prisma.user.update({
      where: { email: logoutUserEmail },
      data: {
        tokenVersion: 1,
        isActive: true,
      },
    });
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // API-01: Valid user login
  // -------------------------------------------------------------------------
  it("API-01: Valid user login returns HTTP 200, JWT token, and safe profile without passwordHash", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body).toHaveProperty("user");

    const { user } = res.body;
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("name", "Jennifer Anderson");
    expect(user).toHaveProperty("email", testRequesterEmail);
    expect(user).toHaveProperty("role", "REQUESTER");
    expect(user).toHaveProperty("mustChangePassword", false);
    expect(user).toHaveProperty("isActive", true);
    // Security check: passwordHash must NEVER be returned to client
    expect(user).not.toHaveProperty("passwordHash");
  });

  // -------------------------------------------------------------------------
  // API-02: Incorrect password
  // -------------------------------------------------------------------------
  it("API-02: Login attempt with incorrect password returns HTTP 401 with generic safe error", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: "WrongPassword999!",
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid email or password");
    expect(res.body).toHaveProperty("code", "INVALID_CREDENTIALS");
    expect(res.body).not.toHaveProperty("token");
  });

  // -------------------------------------------------------------------------
  // API-03: Deactivated account
  // -------------------------------------------------------------------------
  it("API-03: Login attempt with deactivated account returns HTTP 401 with generic safe error", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: inactiveUserEmail,
        password: testPassword,
      });

    expect(res.status).toBe(401);
    // Generic error prevents account enumeration / discovery
    expect(res.body).toHaveProperty("error", "Invalid email or password");
    expect(res.body).toHaveProperty("code", "INVALID_CREDENTIALS");
    expect(res.body).not.toHaveProperty("token");
  });

  // -------------------------------------------------------------------------
  // Validation: Missing fields
  // -------------------------------------------------------------------------
  it("Login returns HTTP 400 when email or password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid input data");
    expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
  });

  // -------------------------------------------------------------------------
  // API-19: Profile retrieval via GET /api/auth/me
  // -------------------------------------------------------------------------
  it("API-19: Authenticated user retrieves profile via GET /api/auth/me, rejects unauthenticated", async () => {
    // 1. Unauthenticated request without token returns 401
    const unauthRes = await request(app).get("/api/auth/me");
    expect(unauthRes.status).toBe(401);
    expect(unauthRes.body).toHaveProperty("code", "UNAUTHORIZED");

    // 2. Request with invalid token returns 401
    const invalidTokenRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-jwt-string");
    expect(invalidTokenRes.status).toBe(401);

    // 3. Authenticated request returns user profile
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testRequesterEmail, password: testPassword });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toHaveProperty("user");
    expect(meRes.body.user.email).toBe(testRequesterEmail);
    expect(meRes.body.user.role).toBe("REQUESTER");
    expect(meRes.body.user).not.toHaveProperty("passwordHash");
  });

  // -------------------------------------------------------------------------
  // API-05: Password change fails on complexity violation or mismatch
  // -------------------------------------------------------------------------
  it("API-05: Password change fails if new password violates complexity rules or does not match confirm", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: mustChangeUserEmail, password: testPassword });

    const token = loginRes.body.token;

    // Fails on mismatch
    const mismatchRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: testPassword,
        newPassword: "NewPassword123!",
        confirmPassword: "DifferentPassword123!",
      });

    expect(mismatchRes.status).toBe(400);
    expect(mismatchRes.body).toHaveProperty("code", "PASSWORD_POLICY_ERROR");

    // Fails on complexity rules (e.g. no number, < 8 chars)
    const weakRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: testPassword,
        newPassword: "weak",
        confirmPassword: "weak",
      });

    expect(weakRes.status).toBe(400);
    expect(weakRes.body).toHaveProperty("code", "PASSWORD_POLICY_ERROR");

    // Fails on incorrect current password
    const wrongCurrentRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "IncorrectCurrentPassword123!",
        newPassword: "ValidNewPassword456!",
        confirmPassword: "ValidNewPassword456!",
      });

    expect(wrongCurrentRes.status).toBe(401);
    expect(wrongCurrentRes.body).toHaveProperty("code", "INVALID_CURRENT_PASSWORD");
  });

  // -------------------------------------------------------------------------
  // API-04: Successful password change clears mustChangePassword
  // -------------------------------------------------------------------------
  it("API-04: User with mustChangePassword = true changes password, updating hash and clearing flag", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: mustChangeUserEmail, password: testPassword });

    expect(loginRes.body.user.mustChangePassword).toBe(true);
    const token = loginRes.body.token;
    const newPassword = "BrandNewPassword2026!";

    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: testPassword,
        newPassword,
        confirmPassword: newPassword,
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body).toHaveProperty("message", "Password changed successfully");
    expect(changeRes.body).toHaveProperty("mustChangePassword", false);

    // Verify flag is cleared in DB
    const updatedUser = await prisma.user.findUnique({
      where: { email: mustChangeUserEmail },
    });
    expect(updatedUser?.mustChangePassword).toBe(false);

    // Verify user can now log in with the new password
    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: mustChangeUserEmail, password: newPassword });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.user.mustChangePassword).toBe(false);

    // Old password no longer works
    const oldLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: mustChangeUserEmail, password: testPassword });

    expect(oldLoginRes.status).toBe(401);
  });

  // -------------------------------------------------------------------------
  // API-20: Logout and token revocation via tokenVersion
  // -------------------------------------------------------------------------
  it("API-20: User logs out via POST /api/auth/logout, immediately revoking previous token", async () => {
    // 1. Log in and get token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: logoutUserEmail, password: testPassword });

    const activeToken = loginRes.body.token;

    // 2. Verify token works on GET /api/auth/me
    const beforeLogoutRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${activeToken}`);

    expect(beforeLogoutRes.status).toBe(200);

    // 3. Perform logout
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${activeToken}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toHaveProperty("message", "Logged out successfully");

    // 4. Verify the old token is now REVOKED (tokenVersion mismatch)
    const afterLogoutRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${activeToken}`);

    expect(afterLogoutRes.status).toBe(401);
    expect(afterLogoutRes.body).toHaveProperty("code", "UNAUTHORIZED");

    // 5. Logging in again produces a fresh token with updated tokenVersion
    const freshLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: logoutUserEmail, password: testPassword });

    expect(freshLoginRes.status).toBe(200);
    const freshToken = freshLoginRes.body.token;

    const freshMeRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${freshToken}`);

    expect(freshMeRes.status).toBe(200);
  });
});
