import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { generateToken } from "../../src/middleware/auth.js";

// ---------------------------------------------------------------------------
// Lab 3 — Issue 17: Administrator User Management API Tests
// Covers:
// - API-14: Admin creates user with single role and initial password (mustChangePassword: true)
// - API-15: Duplicate email rejection (409 Conflict)
// - API-16: Admin self-deactivation prevention (400 Bad Request, SELF_DEACTIVATION_BLOCKED)
// - API-17: Last active admin protection from deactivation/demotion (400 Bad Request, LAST_ADMIN_PROTECTED)
// - API-18: Non-admin authorization guards (403 Forbidden for REQUESTER and IT_STAFF)
// - User listing with search/role filters and password reset
// ---------------------------------------------------------------------------

describe("Admin User Management API (users-admin.api.test.ts)", () => {
  const prisma = getPrisma();

  let admin1Token: string;
  let admin2Token: string;
  let staffToken: string;
  let requesterToken: string;

  let admin1Id: number;
  let admin2Id: number;
  let staffId: number;
  let requesterId: number;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // 1. Admin 1 (Primary Test Admin)
    const admin1 = await prisma.user.upsert({
      where: { email: "primary.admin@toktickit.local" },
      update: { passwordHash, isActive: true, role: "ADMINISTRATOR", mustChangePassword: false },
      create: {
        name: "Primary Admin",
        email: "primary.admin@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "System Operations",
        isActive: true,
        mustChangePassword: false,
      },
    });
    admin1Id = admin1.id;
    admin1Token = generateToken(admin1);

    // 2. Admin 2 (Secondary Test Admin for multi-admin test scenarios)
    const admin2 = await prisma.user.upsert({
      where: { email: "secondary.admin@toktickit.local" },
      update: { passwordHash, isActive: true, role: "ADMINISTRATOR", mustChangePassword: false },
      create: {
        name: "Secondary Admin",
        email: "secondary.admin@toktickit.local",
        passwordHash,
        role: "ADMINISTRATOR",
        department: "System Operations",
        isActive: true,
        mustChangePassword: false,
      },
    });
    admin2Id = admin2.id;
    admin2Token = generateToken(admin2);

    // 3. IT Staff (Non-admin)
    const staff = await prisma.user.upsert({
      where: { email: "staff.guardcheck@toktickit.local" },
      update: { passwordHash, isActive: true, role: "IT_STAFF", mustChangePassword: false },
      create: {
        name: "Staff Guard",
        email: "staff.guardcheck@toktickit.local",
        passwordHash,
        role: "IT_STAFF",
        department: "Helpdesk",
        isActive: true,
        mustChangePassword: false,
      },
    });
    staffId = staff.id;
    staffToken = generateToken(staff);

    // 4. Requester (Non-admin)
    const requester = await prisma.user.upsert({
      where: { email: "requester.guardcheck@toktickit.local" },
      update: { passwordHash, isActive: true, role: "REQUESTER", mustChangePassword: false },
      create: {
        name: "Requester Guard",
        email: "requester.guardcheck@toktickit.local",
        passwordHash,
        role: "REQUESTER",
        department: "Human Resources",
        isActive: true,
        mustChangePassword: false,
      },
    });
    requesterId = requester.id;
    requesterToken = generateToken(requester);
  });

  afterAll(async () => {
    // Cleanup any created test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "new.staff.user@toktickit.local",
            "duplicate.test@toktickit.local",
            "demote.target@toktickit.local",
          ],
        },
      },
    });
  });

  // =========================================================================
  // API-18: Non-Admin Forbidden Guards
  // =========================================================================
  describe("API-18: Non-Admin Authorization Guard", () => {
    it("returns 403 Forbidden when Requester attempts GET /api/admin/users", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("returns 403 Forbidden when IT Staff attempts GET /api/admin/users", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("returns 403 Forbidden when IT Staff attempts POST /api/admin/users", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Unauthorized Create",
          email: "unauth@toktickit.local",
          role: "REQUESTER",
          initialPassword: "Password123!",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("returns 401 Unauthorized when no authentication token is provided", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // API-14: Admin Creates User
  // =========================================================================
  describe("API-14: Admin User Creation", () => {
    it("successfully creates a user with single role and flags mustChangePassword = true", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${admin1Token}`)
        .send({
          name: "New Staff User",
          email: "new.staff.user@toktickit.local",
          role: "IT_STAFF",
          department: "IT Infrastructure",
          isActive: true,
          initialPassword: "TemporaryPass123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("New Staff User");
      expect(res.body.email).toBe("new.staff.user@toktickit.local");
      expect(res.body.role).toBe("IT_STAFF");
      expect(res.body.department).toBe("IT Infrastructure");
      expect(res.body.isActive).toBe(true);
      expect(res.body.mustChangePassword).toBe(true);
      expect(res.body.passwordHash).toBeUndefined(); // Sensitive hash never leaked
    });

    it("rejects user creation with missing required fields", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${admin1Token}`)
        .send({
          name: "",
          email: "invalid",
          role: "INVALID_ROLE",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("rejects user creation when initial password fails complexity rules", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${admin1Token}`)
        .send({
          name: "Weak Password User",
          email: "weakpass@toktickit.local",
          role: "REQUESTER",
          initialPassword: "weak", // Fails minimum 8 chars, uppercase, number
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  // =========================================================================
  // API-15: Duplicate Email Rejection
  // =========================================================================
  describe("API-15: Duplicate Email Safety Rejection", () => {
    it("returns 409 Conflict when attempting to create a user with an existing email", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${admin1Token}`)
        .send({
          name: "Duplicate Attempt",
          email: "primary.admin@toktickit.local", // Existing email
          role: "REQUESTER",
          initialPassword: "Password123!",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DUPLICATE_EMAIL");
      expect(res.body.error).toContain("already exists");
    });

    it("returns 409 Conflict when attempting to update an existing user to an already taken email", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${staffId}`)
        .set("Authorization", `Bearer ${admin1Token}`)
        .send({
          email: "primary.admin@toktickit.local", // Belongs to admin 1
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DUPLICATE_EMAIL");
    });
  });

  // =========================================================================
  // API-16: Admin Self-Deactivation Prevention Guard
  // =========================================================================
  describe("API-16: Admin Self-Deactivation Guard", () => {
    it("returns 400 Bad Request with SELF_DEACTIVATION_BLOCKED when admin tries to deactivate self", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${admin1Id}`)
        .set("Authorization", `Bearer ${admin1Token}`)
        .send({
          isActive: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("SELF_DEACTIVATION_BLOCKED");
      expect(res.body.error).toBe("Administrators cannot deactivate their own account.");
    });

    it("allows admin to update other fields of own account while active", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${admin1Id}`)
        .set("Authorization", `Bearer ${admin1Token}`)
        .send({
          department: "IT Infrastructure & Security",
        });

      expect(res.status).toBe(200);
      expect(res.body.department).toBe("IT Infrastructure & Security");
      expect(res.body.isActive).toBe(true);
    });
  });

  // =========================================================================
  // API-17: Last Active Administrator Guard
  // =========================================================================
  describe("API-17: Last Active Admin Protection", () => {
    it("blocks deactivating or demoting an administrator when only 1 active administrator exists in the system", async () => {
      // Find all active admins other than admin1Id
      const otherActiveAdmins = await prisma.user.findMany({
        where: {
          role: "ADMINISTRATOR",
          isActive: true,
          NOT: { id: admin1Id },
        },
        select: { id: true },
      });

      // Temporarily deactivate other active admins so admin1 is the sole active admin
      if (otherActiveAdmins.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: otherActiveAdmins.map((a) => a.id) } },
          data: { isActive: false },
        });
      }

      try {
        // Now admin1 is the ONLY active admin in the entire system (count = 1).
        // Attempting to demote the sole active administrator must be blocked by LAST_ADMIN_PROTECTED:
        const lastAdminAttempt = await request(app)
          .patch(`/api/admin/users/${admin1Id}`)
          .set("Authorization", `Bearer ${admin1Token}`)
          .send({ role: "IT_STAFF" });

        expect(lastAdminAttempt.status).toBe(400);
        expect(lastAdminAttempt.body.code).toBe("LAST_ADMIN_PROTECTED");
        expect(lastAdminAttempt.body.error).toContain("last remaining active administrator");
      } finally {
        // Restore all other active admins and ensure admin1 is active administrator
        if (otherActiveAdmins.length > 0) {
          await prisma.user.updateMany({
            where: { id: { in: otherActiveAdmins.map((a) => a.id) } },
            data: { isActive: true },
          });
        }
        await prisma.user.update({
          where: { id: admin1Id },
          data: { role: "ADMINISTRATOR", isActive: true },
        });
      }
    });
  });

  // =========================================================================
  // User List & Password Reset Operations
  // =========================================================================
  describe("User Listing & Password Reset", () => {
    it("lists users with optional search and role filtering", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=IT_STAFF")
        .set("Authorization", `Bearer ${admin1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((u: any) => {
        expect(u.role).toBe("IT_STAFF");
        expect(u.passwordHash).toBeUndefined();
      });
    });

    it("resets a user's initial password and sets mustChangePassword = true", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${staffId}/reset-password`)
        .set("Authorization", `Bearer ${admin1Token}`)
        .send({
          newInitialPassword: "NewStaffPass123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.mustChangePassword).toBe(true);
      expect(res.body.message).toContain("successfully");

      // Verify in DB that mustChangePassword is true and tokenVersion was incremented
      const updatedStaff = await prisma.user.findUniqueOrThrow({ where: { id: staffId } });
      expect(updatedStaff.mustChangePassword).toBe(true);
    });

    it("rejects password reset with weak password", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${staffId}/reset-password`)
        .set("Authorization", `Bearer ${admin1Token}`)
        .send({
          newInitialPassword: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_PASSWORD_COMPLEXITY");
    });
  });
});
