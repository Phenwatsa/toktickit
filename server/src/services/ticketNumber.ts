import { getPrisma } from "../prisma.js";

// ---------------------------------------------------------------------------
// Lab 2 — Official Ticket Number Generator (Atomic & Concurrency-Safe)
// Format: TKT-YYYY-NNNNNN (e.g. TKT-2026-000001)
// Uses PostgreSQL sequences with single initialization to guarantee 100%
// atomic, non-colliding sequential numbers across concurrent requests.
// ---------------------------------------------------------------------------

const initializedYears = new Set<number>();

export async function ensureSequenceInitialized(year: number): Promise<string> {
  const sequenceName = `ticket_seq_${year}`;
  if (initializedYears.has(year)) {
    return sequenceName;
  }

  const prisma = getPrisma();

  // 1. Create sequence if it does not exist
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${sequenceName}" START 1`);

  // 2. Initialize sequence to match max existing ticket only once during startup
  const maxTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: `TKT-${year}-`,
      },
    },
    orderBy: {
      ticketNumber: "desc",
    },
    select: {
      ticketNumber: true,
    },
  });

  if (maxTicket) {
    const parts = maxTicket.ticketNumber.split("-");
    const currentMax = parseInt(parts[2], 10);
    if (!isNaN(currentMax) && currentMax > 0) {
      await prisma.$executeRawUnsafe(
        `SELECT setval('"${sequenceName}"', GREATEST((SELECT last_value FROM "${sequenceName}"), ${currentMax}), true)`
      );
    }
  }

  initializedYears.add(year);
  return sequenceName;
}

export async function generateUniqueTicketNumber(): Promise<string> {
  const prisma = getPrisma();
  const currentYear = new Date().getFullYear();
  const sequenceName = await ensureSequenceInitialized(currentYear);

  // Pure atomic nextval call — completely concurrency-safe in PostgreSQL
  const result = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
    `SELECT nextval('"${sequenceName}"') as nextval`
  );

  const nextVal = Number(result[0].nextval);
  return `TKT-${currentYear}-${String(nextVal).padStart(6, "0")}`;
}
