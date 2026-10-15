import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Lab 4 — Issue 21: Database Migration Lifecycle & Recovery Tests
// Covers: MIG-01 (Deploy & Preserve), MIG-02 (Rollback Recovery Simulation), AC-21
// ---------------------------------------------------------------------------

describe("AC-21: Migration Deployment & Recovery Strategy (migration-recovery.test.ts)", { timeout: 30000 }, () => {
  const rootPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public",
      },
    },
  });

  const serverDir = path.resolve(__dirname, "../..");
  const baselineMigrations = [
    "20260814151754_init",
    "20260829071512_add_lab2_models",
    "20260917070000_add_lab3_auth_and_models",
  ];
  const pendingMigration = "20261012070000_add_lab4_actions_taken";

  const setupBaselineSchema = async (schemaName: string, tempFolder: string) => {
    // 1. Reset isolated schema
    await rootPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await rootPrisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}";`);

    // 2. Setup temporary folder with ONLY baseline migrations
    const tempMigDir = path.join(tempFolder, "migrations");
    fs.mkdirSync(tempMigDir, { recursive: true });
    for (const m of baselineMigrations) {
      fs.cpSync(path.join(serverDir, "prisma/migrations", m), path.join(tempMigDir, m), { recursive: true });
    }

    const tempSchema = path.join(tempFolder, "schema.prisma");
    fs.writeFileSync(
      tempSchema,
      `generator client {\n  provider = "prisma-client-js"\n}\ndatasource db {\n  provider = "postgresql"\n  url = env("ISOLATED_DB_URL")\n}\n`
    );

    const isolatedUrl = `postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=${schemaName}`;
    const relSchema = path.relative(serverDir, tempSchema);

    // Deploy baseline migrations
    execSync(`./node_modules/.bin/prisma migrate deploy --schema=${relSchema}`, {
      cwd: serverDir,
      env: { ...process.env, ISOLATED_DB_URL: isolatedUrl },
      stdio: "pipe",
    });

    // 3. Seed representative legacy records
    const isoPrisma = new PrismaClient({ datasources: { db: { url: isolatedUrl } } });
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const user = await isoPrisma.user.create({
      data: {
        name: "Legacy Requester",
        email: `legacy.req.${schemaName}@toktickit.local`,
        passwordHash,
        role: "REQUESTER",
        department: "Operations",
        isActive: true,
        mustChangePassword: false,
      },
    });

    const staff = await isoPrisma.user.create({
      data: {
        name: "Legacy Staff",
        email: `legacy.staff.${schemaName}@toktickit.local`,
        passwordHash,
        role: "IT_STAFF",
        department: "IT",
        isActive: true,
        mustChangePassword: false,
      },
    });

    const cat = await isoPrisma.category.create({
      data: { name: `Legacy Category ${schemaName}`, isActive: true },
    });

    const sys = await isoPrisma.relatedSystem.create({
      data: { name: `Legacy System ${schemaName}`, description: "Legacy system desc", isActive: true },
    });

    const ticket = await isoPrisma.ticket.create({
      data: {
        ticketNumber: `TKT-LEG-${schemaName.substring(0, 10).toUpperCase()}`,
        summary: "Legacy Ticket Pre-Migration",
        description: "Legacy ticket verification payload.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
        requesterId: user.id,
        ticketOwnerId: staff.id,
        categoryId: cat.id,
        relatedSystemId: sys.id,
      },
    });

    const comment = await isoPrisma.publicComment.create({
      data: {
        ticketId: ticket.id,
        authorId: staff.id,
        content: "Legacy comment before Lab 4 migration.",
      },
    });

    const note = await isoPrisma.internalNote.create({
      data: {
        ticketId: ticket.id,
        authorId: staff.id,
        content: "Legacy internal note before Lab 4 migration.",
      },
    });

    return { isolatedUrl, isoPrisma, user, staff, cat, sys, ticket, comment, note };
  };

  afterAll(async () => {
    await rootPrisma.$disconnect();
  });

  describe("MIG-01: Migration Deployment & Legacy Data Preservation", () => {
    const schemaName = "mig_test_deploy";
    const tempFolder = path.join(serverDir, "temp_mig_01");

    afterAll(async () => {
      await rootPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
      fs.rmSync(tempFolder, { recursive: true, force: true });
    });

    it("executes pending migration, adds ActionTaken model, and guarantees 100% legacy data preservation", async () => {
      // 1. Prepare baseline schema with legacy data
      const { isolatedUrl, isoPrisma, user, staff, ticket, comment, note } = await setupBaselineSchema(
        schemaName,
        tempFolder
      );

      // Verify baseline migration state (3 migrations)
      const initialMigrations: any[] = await isoPrisma.$queryRawUnsafe(
        `SELECT migration_name, finished_at FROM "${schemaName}"."_prisma_migrations" ORDER BY started_at ASC;`
      );
      expect(initialMigrations.length).toBe(3);
      expect(initialMigrations.every((m) => m.finished_at !== null)).toBe(true);

      // Verify ActionTaken table DOES NOT exist yet
      const tablesBefore: any[] = await isoPrisma.$queryRawUnsafe(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'ActionTaken';`,
        schemaName
      );
      expect(tablesBefore.length).toBe(0);

      // 2. Deploy pending migration using real schema
      const deployOut = execSync(`./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma`, {
        cwd: serverDir,
        env: { ...process.env, DATABASE_URL: isolatedUrl },
        encoding: "utf8",
      });
      expect(deployOut).toContain("All migrations have been successfully applied.");

      // 3. Verify ActionTaken table is created with all expected columns
      const columnsAfter: any[] = await isoPrisma.$queryRawUnsafe(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns 
         WHERE table_schema = $1 AND table_name = 'ActionTaken';`,
        schemaName
      );
      const colNames = columnsAfter.map((c) => c.column_name);
      const expectedCols = [
        "id",
        "ticketId",
        "actionDateTime",
        "actionDescription",
        "result",
        "performedById",
        "isFollowUpRequired",
        "followUpNote",
        "attachmentNotes",
        "createdAt",
        "updatedAt",
      ];
      for (const col of expectedCols) {
        expect(colNames).toContain(col);
      }

      // 4. Verify indexes are present
      const indexesAfter: any[] = await isoPrisma.$queryRawUnsafe(
        `SELECT indexname FROM pg_indexes WHERE schemaname = $1 AND tablename = 'ActionTaken';`,
        schemaName
      );
      const indexNames = indexesAfter.map((i) => i.indexname);
      expect(indexNames).toContain("ActionTaken_ticketId_idx");
      expect(indexNames).toContain("ActionTaken_performedById_idx");
      expect(indexNames).toContain("ActionTaken_actionDateTime_idx");

      // 5. Verify 100% of legacy data is preserved intact
      const legacyTicket = await isoPrisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      expect(legacyTicket.summary).toBe(ticket.summary);
      expect(legacyTicket.requesterId).toBe(user.id);
      expect(legacyTicket.ticketOwnerId).toBe(staff.id);
      expect(legacyTicket.currentStatus).toBe("IN_PROGRESS");

      const legacyComment = await isoPrisma.publicComment.findUniqueOrThrow({ where: { id: comment.id } });
      expect(legacyComment.content).toBe(comment.content);

      const legacyNote = await isoPrisma.internalNote.findUniqueOrThrow({ where: { id: note.id } });
      expect(legacyNote.content).toBe(note.content);

      // 6. Verify final migration history in _prisma_migrations
      const finalMigrations: any[] = await isoPrisma.$queryRawUnsafe(
        `SELECT migration_name, finished_at, rolled_back_at FROM "${schemaName}"."_prisma_migrations" ORDER BY started_at ASC;`
      );
      expect(finalMigrations.length).toBe(4);
      const latestMig = finalMigrations[3];
      expect(latestMig.migration_name).toBe(pendingMigration);
      expect(latestMig.finished_at).not.toBeNull();
      expect(latestMig.rolled_back_at).toBeNull();

      await isoPrisma.$disconnect();
    });
  });

  describe("MIG-02: Migration Failure Recovery Simulation", () => {
    const schemaName = "mig_test_recovery";
    const tempFolder = path.join(serverDir, "temp_mig_02");

    afterAll(async () => {
      await rootPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
      fs.rmSync(tempFolder, { recursive: true, force: true });
    });

    it("safely recovers from a simulated failed migration via compensatory cleanup and prisma migrate resolve", async () => {
      // 1. Setup baseline schema with legacy data
      const { isolatedUrl, isoPrisma, ticket } = await setupBaselineSchema(schemaName, tempFolder);

      // 2. Simulate failed migration state in _prisma_migrations (finished_at IS NULL)
      // and partial schema remnants (partially created table)
      await isoPrisma.$executeRawUnsafe(`
        INSERT INTO "${schemaName}"."_prisma_migrations" (
          id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
        ) VALUES (
          'simulated-failure-id',
          '93c92cf8b42e95621f5411b62959f9d9759ae46b0438ae88e62e4ec56e0223f2',
          NULL,
          '${pendingMigration}',
          'Simulated migration interruption or crash',
          NULL,
          NOW(),
          1
        );
      `);

      // Create partial dangling table remnant
      await isoPrisma.$executeRawUnsafe(`CREATE TABLE "${schemaName}"."ActionTaken" (id SERIAL PRIMARY KEY);`);

      // 3. Verify that running migrate deploy fails or detects failed migration
      let deployFailed = false;
      try {
        execSync(`./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma`, {
          cwd: serverDir,
          env: { ...process.env, DATABASE_URL: isolatedUrl },
          stdio: "pipe",
        });
      } catch (err: any) {
        deployFailed = true;
        const errText = err.stderr ? err.stderr.toString() : err.message;
        expect(errText).toContain(pendingMigration);
      }
      expect(deployFailed).toBe(true);

      // 4. Perform Compensatory Cleanup: Drop dangling remnants restoring clean baseline
      await isoPrisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${schemaName}"."ActionTaken" CASCADE;`);

      // 5. Reconcile migration state via prisma migrate resolve --rolled-back
      const resolveOut = execSync(
        `./node_modules/.bin/prisma migrate resolve --rolled-back ${pendingMigration} --schema=prisma/schema.prisma`,
        {
          cwd: serverDir,
          env: { ...process.env, DATABASE_URL: isolatedUrl },
          encoding: "utf8",
        }
      );
      expect(resolveOut).toContain(`Migration ${pendingMigration} marked as rolled back.`);

      // Verify migration record was updated to rolled back
      const migAfterResolve: any[] = await isoPrisma.$queryRawUnsafe(
        `SELECT migration_name, finished_at, rolled_back_at FROM "${schemaName}"."_prisma_migrations" 
         WHERE migration_name = $1;`,
        pendingMigration
      );
      expect(migAfterResolve[0].rolled_back_at).not.toBeNull();

      // 6. Re-apply migration deploy
      const redeployOut = execSync(`./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma`, {
        cwd: serverDir,
        env: { ...process.env, DATABASE_URL: isolatedUrl },
        encoding: "utf8",
      });
      expect(redeployOut).toContain("All migrations have been successfully applied.");

      // 7. Verify migration completes successfully and target schema is fully intact
      const cols: any[] = await isoPrisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = $1 AND table_name = 'ActionTaken';`,
        schemaName
      );
      expect(cols.length).toBeGreaterThanOrEqual(11);

      // Verify legacy ticket is still 100% intact
      const preservedTicket = await isoPrisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      expect(preservedTicket.summary).toBe(ticket.summary);

      await isoPrisma.$disconnect();
    });
  });
});
