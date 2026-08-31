import { getPrisma } from "../prisma.js";

// ---------------------------------------------------------------------------
// Lab 2 — Official Ticket Number Generator (100% Atomic & Concurrency-Safe)
// Format: TKT-YYYY-NNNNNN (e.g. TKT-2026-000001)
// Uses PostgreSQL sequences with transaction-level advisory locks to guarantee
// 100% safe initialization and atomic, non-colliding sequential numbers.
// ---------------------------------------------------------------------------

const initializedYears = new Set<number>();

export async function ensureSequenceInitialized(year: number): Promise<string> {
  const sequenceName = `ticket_seq_${year}`;
  if (initializedYears.has(year)) {
    return sequenceName;
  }

  const prisma = getPrisma();

  // Use a transaction with a PostgreSQL advisory lock based on the sequence name hash
  // to ensure that even concurrent cold-start requests initialize safely without racing.
  await prisma.$transaction(async (tx) => {
    // 1. Acquire transaction advisory lock for this sequence name
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext('${sequenceName}'))`);

    // 2. Create sequence if it does not exist
    await tx.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${sequenceName}" START 1`);

    // 3. Initialize sequence to match max existing ticket only if not synced
    const maxTicket = await tx.ticket.findFirst({
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
        await tx.$executeRawUnsafe(
          `SELECT setval('"${sequenceName}"', GREATEST((SELECT last_value FROM "${sequenceName}"), ${currentMax}), true)`
        );
      }
    }
  });

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
