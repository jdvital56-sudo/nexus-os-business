import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Convenience db helpers
export const db = {
  crmEntities: {
    findMany: (filter?: any) => prisma.crmEntity.findMany({ where: filter, include: { _count: { select: { records: true } } } }),
    findById: (id: string) => prisma.crmEntity.findUnique({ where: { id } }),
    create: (data: any) => prisma.crmEntity.create({ data }),
  },
  crmRecords: {
    findMany: (filter?: any) => prisma.crmRecord.findMany({ where: { ...filter, deletedAt: null }, orderBy: { createdAt: "desc" } }),
    create: (data: any) => prisma.crmRecord.create({ data }),
  },
};
