import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 2 — Issue 9: Attachments Lifecycle API Tests
// ---------------------------------------------------------------------------

describe("Issue 9 — Attachments Lifecycle (Upload, Download & Soft-Removal)", () => {
  let requesterAId: number;
  let requesterBId: number;
  let ticketId: number;
  let createdAttachmentId: number;
  const tempTestDir = path.join(process.cwd(), "scratch_test_files");

  beforeAll(async () => {
    const prisma = getPrisma();

    // Create scratch test files
    if (!fs.existsSync(tempTestDir)) {
      fs.mkdirSync(tempTestDir, { recursive: true });
    }
    fs.writeFileSync(path.join(tempTestDir, "test-doc.pdf"), "%PDF-1.4 dummy pdf binary stream content");
    fs.writeFileSync(path.join(tempTestDir, "test-image.png"), "fake-png-binary-content");
    fs.writeFileSync(path.join(tempTestDir, "invalid-exec.exe"), "MZ dummy executable binary");

    // Create oversized file (> 5MB)
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, "a");
    fs.writeFileSync(path.join(tempTestDir, "large-file.pdf"), largeBuffer);

    // Get requesters
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      take: 2,
    });
    requesterAId = requesters[0].id;
    requesterBId = requesters[1].id;

    // Clean up test ticket and its attachments if exist
    await prisma.ticket.deleteMany({
      where: {
        ticketNumber: "TKT-2026-700001",
      },
    });

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Create test ticket for Requester A
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-700001",
        summary: "Attachment Lifecycle Test Ticket",
        description: "Testing upload, download restrictions, and soft-removal.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
        requesterId: requesterAId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
      },
    });
    ticketId = ticket.id;
  });

  // 1. Upload Tests
  it("allows uploading a valid attachment (PNG <= 5MB) and links to ticket", async () => {
    const filePath = path.join(tempTestDir, "test-image.png");

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("x-requester-id", String(requesterAId))
      .attach("file", filePath);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("ticketId", ticketId);
    expect(res.body).toHaveProperty("originalName", "test-image.png");
    expect(res.body).toHaveProperty("isRemoved", false);

    createdAttachmentId = res.body.id;
  });

  it("rejects oversized file attachment (> 5MB) with HTTP 413 or 400", async () => {
    const filePath = path.join(tempTestDir, "large-file.pdf");

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("x-requester-id", String(requesterAId))
      .attach("file", filePath);

    expect([400, 413]).toContain(res.status);
    expect(res.body).toHaveProperty("error");
  });

  it("rejects unsupported attachment file format (.exe) with HTTP 415 or 400", async () => {
    const filePath = path.join(tempTestDir, "invalid-exec.exe");

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("x-requester-id", String(requesterAId))
      .attach("file", filePath);

    expect([400, 415]).toContain(res.status);
    expect(res.body).toHaveProperty("error");
  });

  it("rejects attachment upload from another requester who does not own ticket (HTTP 403)", async () => {
    const filePath = path.join(tempTestDir, "test-doc.pdf");

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("x-requester-id", String(requesterBId))
      .attach("file", filePath);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "Forbidden");
  });

  // 2. Download Tests
  it("allows downloading an active attachment (HTTP 200)", async () => {
    const res = await request(app)
      .get(`/api/attachments/${createdAttachmentId}/download`)
      .set("x-requester-id", String(requesterAId));

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("attachment");
  });

  it("rejects attachment download by unauthorized requester (HTTP 403)", async () => {
    const res = await request(app)
      .get(`/api/attachments/${createdAttachmentId}/download`)
      .set("x-requester-id", String(requesterBId));

    expect(res.status).toBe(403);
  });

  // 3. Soft Removal Tests
  it("rejects soft-removal when removalReason is missing or too short (< 3 chars)", async () => {
    const res = await request(app)
      .delete(`/api/tickets/${ticketId}/attachments/${createdAttachmentId}`)
      .set("x-requester-id", String(requesterAId))
      .send({ removalReason: " " });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("successfully soft-removes attachment with valid reason (HTTP 200)", async () => {
    const res = await request(app)
      .delete(`/api/tickets/${ticketId}/attachments/${createdAttachmentId}`)
      .set("x-requester-id", String(requesterAId))
      .send({ removalReason: "Attached incorrect file by mistake." });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdAttachmentId);
    expect(res.body).toHaveProperty("isRemoved", true);
    expect(res.body).toHaveProperty("removedAt");
    expect(res.body).toHaveProperty("removalReason", "Attached incorrect file by mistake.");
  });

  it("permanently blocks download for soft-removed attachment (HTTP 410 Gone)", async () => {
    const res = await request(app)
      .get(`/api/attachments/${createdAttachmentId}/download`)
      .set("x-requester-id", String(requesterAId));

    expect(res.status).toBe(410);
    expect(res.body).toHaveProperty("error", "Gone");
  });
});
