import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL || "";
  
  // Supabase PgBouncer (port 6543) requires SSL. The pg adapter ignores it unless specified.
  if (connectionString.includes("pooler.supabase.com") && !connectionString.includes("sslmode=")) {
    connectionString += (connectionString.includes("?") ? "&" : "?") + "sslmode=require";
  }

  const adapter = new PrismaPg({ connectionString });
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
