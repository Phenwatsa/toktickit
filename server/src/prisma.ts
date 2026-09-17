import { PrismaClient } from "@prisma/client";

// Module augmentation for Lab 2 backward compatibility
declare module "@prisma/client" {
  interface PrismaClient {
    requesterUser: any;
  }
}

// Lazy singleton: the client is created on first use, not at import time.
// This keeps route modules and tests that don't touch the DB (e.g. /api/health)
// free of database side effects.
let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!client) {
    const baseClient = new PrismaClient();
    const extended = baseClient.$extends({
      query: {
        ticket: {
          async create({ args, query }) {
            if (args.data && !(args.data as any).itPriority) {
              (args.data as any).itPriority = (args.data as any).requestedPriority || "MEDIUM";
            }
            return query(args);
          },
          async createMany({ args, query }) {
            if (Array.isArray(args.data)) {
              for (const item of args.data) {
                if (!(item as any).itPriority) {
                  (item as any).itPriority = (item as any).requestedPriority || "MEDIUM";
                }
              }
            } else if (args.data && !(args.data as any).itPriority) {
              (args.data as any).itPriority = (args.data as any).requestedPriority || "MEDIUM";
            }
            return query(args);
          },
        },
      },
    });

    Object.defineProperty(extended, "requesterUser", {
      get() {
        return (extended as any).user;
      },
    });

    client = extended as unknown as PrismaClient;
  }
  return client;
}
