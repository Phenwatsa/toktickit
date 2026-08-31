import { getPrisma } from "../prisma.js";

// ---------------------------------------------------------------------------
// Lab 2 — Official Ticket Number Generator
// Format: TKT-YYYY-NNNNNN (e.g. TKT-2026-000001)
// Guaranteed unique across all tickets.
// ---------------------------------------------------------------------------

export async function generateUniqueTicketNumber(): Promise<string> {
  const prisma = getPrisma();
  const currentYear = new Date().getFullYear();
  const yearPrefix = `TKT-${currentYear}-`;

  // Count existing tickets for this year to determine the next sequential number
  const count = await prisma.ticket.count({
    where: {
      ticketNumber: {
        startsWith: yearPrefix,
      },
    },
  });

  let nextSeq = count + 1;
  let candidateNumber = `${yearPrefix}${String(nextSeq).padStart(6, "0")}`;

  // Double check uniqueness in case of race condition or deletions
  while (await prisma.ticket.findUnique({ where: { ticketNumber: candidateNumber } })) {
    nextSeq += 1;
    candidateNumber = `${yearPrefix}${String(nextSeq).padStart(6, "0")}`;
  }

  return candidateNumber;
}
