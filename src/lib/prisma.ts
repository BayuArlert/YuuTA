import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Pastikan connection pool memiliki batas dan timeout toleran
const dbUrl = process.env.DATABASE_URL;
let datasourceUrl = dbUrl;
if (datasourceUrl && !datasourceUrl.includes("connection_limit=")) {
  datasourceUrl +=
    (datasourceUrl.includes("?") ? "&" : "?") +
    "connection_limit=20&pool_timeout=30";
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
