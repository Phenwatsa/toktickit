-- 1. Create Role Enum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- 2. Update TicketStatus Enum safely inside transaction
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED');
ALTER TABLE "Ticket" ALTER COLUMN "currentStatus" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "currentStatus" TYPE "TicketStatus" USING (
  CASE "currentStatus"::text
    WHEN 'PENDING' THEN 'WAITING_FOR_REQUESTER'::"TicketStatus"
    ELSE "currentStatus"::text::"TicketStatus"
  END
);
ALTER TABLE "Ticket" ALTER COLUMN "currentStatus" SET DEFAULT 'NEW';
DROP TYPE "TicketStatus_old";

-- 3. Rename RequesterUser table to User and preserve all rows
ALTER TABLE "RequesterUser" RENAME TO "User";

-- Rename sequence if exists
ALTER SEQUENCE IF EXISTS "RequesterUser_id_seq" RENAME TO "User_id_seq";

-- Rename primary key constraint
ALTER TABLE "User" RENAME CONSTRAINT "RequesterUser_pkey" TO "User_pkey";

-- Drop old index and create new ones
DROP INDEX IF EXISTS "RequesterUser_email_key";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- 4. Add new columns to User table and relax department constraint
ALTER TABLE "User" ALTER COLUMN "department" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'REQUESTER';
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Backfill existing migrated users:
-- Set initial password hash for 'Password123!'
-- Explicitly backfill mustChangePassword = true for all existing users as required
UPDATE "User" SET 
  "passwordHash" = '$2a$10$YFM5cCrfTzXKdMJqMYdKwef2eP16HYUPht8JPByEaTqNmUTrNms4C',
  "mustChangePassword" = true,
  "role" = 'REQUESTER'
WHERE "passwordHash" IS NULL;

-- Enforce NOT NULL on passwordHash
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- Create indexes on User
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

-- 5. Update Ticket foreign key constraint for requester
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_requesterId_fkey";
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Backfill itPriority from requestedPriority and enforce NOT NULL (column already exists from Lab 2)
UPDATE "Ticket" SET "itPriority" = "requestedPriority" WHERE "itPriority" IS NULL;
ALTER TABLE "Ticket" ALTER COLUMN "itPriority" SET NOT NULL;

-- 7. Add problemAppearsResolved, ticketOwnerId, backfill ticketOwnerId from legacy ticketOwner, and remove old ticketOwner string column
ALTER TABLE "Ticket" ADD COLUMN "problemAppearsResolved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Ticket" ADD COLUMN "ticketOwnerId" INTEGER;

-- Backfill ticketOwnerId from legacy ticketOwner text before dropping the column.
-- Matches against User.name or User.email (case-insensitive).
-- Any legacy tickets without a matching user safely retain NULL ticketOwnerId without data loss.
UPDATE "Ticket" t
SET "ticketOwnerId" = u."id"
FROM "User" u
WHERE t."ticketOwner" IS NOT NULL
  AND (LOWER(TRIM(t."ticketOwner")) = LOWER(TRIM(u."name")) OR LOWER(TRIM(t."ticketOwner")) = LOWER(TRIM(u."email")));

ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "ticketOwner";

-- Add foreign key and index for ticketOwnerId
CREATE INDEX "Ticket_ticketOwnerId_idx" ON "Ticket"("ticketOwnerId");
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketOwnerId_fkey" FOREIGN KEY ("ticketOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Create PublicComment Table
CREATE TABLE "PublicComment" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicComment_ticketId_idx" ON "PublicComment"("ticketId");

ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Create InternalNote Table
CREATE TABLE "InternalNote" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalNote_ticketId_idx" ON "InternalNote"("ticketId");

ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
