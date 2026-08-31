import { getPrisma } from "../prisma.js";

// ---------------------------------------------------------------------------
// Lab 2 — Official Ticket Number Generator (Atomic & Concurrency-Safe)
// Format: TKT-YYYY-NNNNNN (e.g. TKT-2026-000001)
// Uses PostgreSQL sequences to guarantee atomic, non-colliding sequential numbers.
// ---------------------------------------------------------------------------

export async function generateUniqueTicketNumber(): Promise<string> {
  const prisma = getPrisma();
  const currentYear = new Date().getFullYear();
  const sequenceName = `ticket_seq_${currentYear}`;

  // 1. Ensure the PostgreSQL sequence exists for the current year
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${sequenceName}" START 1`);

  // 2. Fetch the max existing sequence for the current year to sync the sequence if needed
  const maxTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: `TKT-${currentYear}-`,
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
      // Ensure sequence is at least currentMax so nextval will be currentMax + 1
      await prisma.$executeRawUnsafe(
        `SELECT setval('"${sequenceName}"', GREATEST((SELECT last_value FROM "${sequenceName}"), ${currentMax}), true)`
      );
    }
  }

  // 3. Atomically advance and fetch the next sequence value
  const result = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
    `SELECT nextval('"${sequenceName}"') as nextval`
  );

  const nextVal = Number(result[0].nextval);
  return `TKT-${currentYear}-${String(nextVal).padStart(6, "0")}`;
}
