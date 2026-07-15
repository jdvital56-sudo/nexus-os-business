import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Typed helpers matching the old API ────────────────────────────

export const db = {
  users: {
    findMany: (filter?: any) => prisma.user.findMany({ where: filter }),
    findById: (id: string) => prisma.user.findUnique({ where: { id } }),
    findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
    create: (data: any) => prisma.user.create({ data }),
    update: (id: string, data: any) => prisma.user.update({ where: { id }, data }),
  },

  organizations: {
    findMany: () => prisma.organization.findMany(),
    findById: (id: string) => prisma.organization.findUnique({ where: { id } }),
    findBySlug: (slug: string) => prisma.organization.findUnique({ where: { slug } }),
    create: (data: any) => prisma.organization.create({ data }),
  },

  workspaces: {
    findMany: (filter?: any) => prisma.workspace.findMany({ where: filter }),
    findById: (id: string) => prisma.workspace.findUnique({ where: { id } }),
    create: (data: any) => prisma.workspace.create({ data }),
    update: (id: string, data: any) => prisma.workspace.update({ where: { id }, data }),
  },

  members: {
    findMany: (filter?: any) => prisma.member.findMany({ where: filter }),
    create: (data: any) => prisma.member.create({ data }),
    findByUserAndWorkspace: (userId: string, workspaceId: string) =>
      prisma.member.findFirst({ where: { userId, workspaceId } }),
  },

  subscriptions: {
    create: (data: any) => prisma.subscription.create({ data }),
  },

  crmEntities: {
    findMany: (filter?: any) => prisma.crmEntity.findMany({ where: filter, include: { _count: { select: { records: true } } } }),
    findById: (id: string) => prisma.crmEntity.findUnique({ where: { id } }),
    findByName: (workspaceId: string, name: string) =>
      prisma.crmEntity.findFirst({ where: { workspaceId, name } }),
    create: (data: any) => prisma.crmEntity.create({ data }),
    update: (id: string, data: any) => prisma.crmEntity.update({ where: { id }, data }),
    remove: (id: string) => prisma.crmEntity.delete({ where: { id } }),
  },

  crmRecords: {
    findMany: (filter?: any, opts?: { skip?: number; take?: number }) =>
      prisma.crmRecord.findMany({
        where: { ...filter, deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: opts?.skip,
        take: opts?.take,
      }),
    findById: (id: string) => prisma.crmRecord.findUnique({ where: { id } }),
    create: (data: any) => prisma.crmRecord.create({ data }),
    update: (id: string, data: any) => prisma.crmRecord.update({ where: { id }, data }),
    softDelete: (id: string) => prisma.crmRecord.update({ where: { id }, data: { deletedAt: new Date() } }),
    count: (filter?: any) => prisma.crmRecord.count({ where: { ...filter, deletedAt: null } }),
  },

  websites: {
    findMany: (filter?: any) => prisma.website.findMany({ where: filter }),
    findById: (id: string) => prisma.website.findUnique({ where: { id } }),
    create: (data: any) => prisma.website.create({ data }),
    update: (id: string, data: any) => prisma.website.update({ where: { id }, data }),
    remove: (id: string) => prisma.website.delete({ where: { id } }),
  },

  automations: {
    findMany: (filter?: any) => prisma.automation.findMany({ where: filter }),
    findById: (id: string) => prisma.automation.findUnique({ where: { id } }),
    create: (data: any) => prisma.automation.create({ data }),
    update: (id: string, data: any) => prisma.automation.update({ where: { id }, data }),
    remove: (id: string) => prisma.automation.delete({ where: { id } }),
  },

  aiBots: {
    findMany: (filter?: any) => prisma.aiBot.findMany({ where: filter }),
    findById: (id: string) => prisma.aiBot.findUnique({ where: { id } }),
    create: (data: any) => prisma.aiBot.create({ data }),
    update: (id: string, data: any) => prisma.aiBot.update({ where: { id }, data }),
    remove: (id: string) => prisma.aiBot.delete({ where: { id } }),
  },

  aiAgents: {
    findMany: (filter?: any) => prisma.aiAgent.findMany({ where: filter }),
    findById: (id: string) => prisma.aiAgent.findUnique({ where: { id } }),
    create: (data: any) => prisma.aiAgent.create({ data }),
    update: (id: string, data: any) => prisma.aiAgent.update({ where: { id }, data }),
    remove: (id: string) => prisma.aiAgent.delete({ where: { id } }),
  },

  marketplaceItems: {
    findMany: (filter?: any) => prisma.marketplaceItem.findMany({ where: filter }),
    findById: (id: string) => prisma.marketplaceItem.findUnique({ where: { id } }),
    create: (data: any) => prisma.marketplaceItem.create({ data }),
  },

  smartPackages: {
    findMany: (filter?: any) => prisma.smartPackage.findMany({ where: filter }),
    findById: (id: string) => prisma.smartPackage.findUnique({ where: { id } }),
    create: (data: any) => prisma.smartPackage.create({ data }),
  },

  auditLogs: {
    create: (data: any) => prisma.auditLog.create({ data }),
  },
};
