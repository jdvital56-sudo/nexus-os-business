// Lightweight JSON-file database for Nexus OS Business
// In production, replace with PostgreSQL + Prisma

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DB_DIR = join(process.cwd(), ".data");
const DB_FILE = join(DB_DIR, "db.json");

interface DB {
  users: any[];
  organizations: any[];
  workspaces: any[];
  members: any[];
  subscriptions: any[];
  crmEntities: any[];
  crmRecords: any[];
  crmViews: any[];
  websites: any[];
  automations: any[];
  automationRuns: any[];
  aiBots: any[];
  aiAgents: any[];
  marketplaceItems: any[];
  marketplaceReviews: any[];
  smartPackages: any[];
  auditLogs: any[];
}

function ensureDir() {
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
}

function loadDB(): DB {
  ensureDir();
  if (!existsSync(DB_FILE)) {
    const empty: DB = {
      users: [], organizations: [], workspaces: [], members: [], subscriptions: [],
      crmEntities: [], crmRecords: [], crmViews: [], websites: [],
      automations: [], automationRuns: [], aiBots: [], aiAgents: [],
      marketplaceItems: [], marketplaceReviews: [], smartPackages: [], auditLogs: [],
    };
    writeFileSync(DB_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(readFileSync(DB_FILE, "utf-8"));
}

function saveDB(db: DB) {
  ensureDir();
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function genId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ─── CRUD Helpers ──────────────────────────────────────────────────

type TableName = keyof DB;

function getAll<T = any>(table: TableName): T[] {
  return loadDB()[table] as T[];
}

function findById<T = any>(table: TableName, id: string): T | undefined {
  return getAll<T>(table).find((item: any) => item.id === id) as T | undefined;
}

function findMany<T = any>(table: TableName, filter: Partial<T>): T[] {
  return getAll<T>(table).filter((item: any) =>
    Object.entries(filter).every(([k, v]) => item[k] === v)
  ) as T[];
}

function create<T = any>(table: TableName, data: Partial<T>): T {
  const db = loadDB();
  const record = { id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data } as T;
  (db[table] as any[]).push(record);
  saveDB(db);
  return record;
}

function update<T = any>(table: TableName, id: string, data: Partial<T>): T | null {
  const db = loadDB();
  const idx = (db[table] as any[]).findIndex((item) => item.id === id);
  if (idx === -1) return null;
  (db[table] as any[])[idx] = { ...db[table][idx], ...data, updatedAt: new Date().toISOString() };
  saveDB(db);
  return (db[table] as any[])[idx] as T;
}

function remove(table: TableName, id: string): boolean {
  const db = loadDB();
  const idx = (db[table] as any[]).findIndex((item) => item.id === id);
  if (idx === -1) return false;
  (db[table] as any[]).splice(idx, 1);
  saveDB(db);
  return true;
}

function softDelete(table: TableName, id: string): boolean {
  return update(table, id, { deletedAt: new Date().toISOString() }) !== null;
}

function count(table: TableName, filter?: Record<string, any>): number {
  const items = getAll(table);
  if (!filter) return items.length;
  return items.filter((item: any) =>
    Object.entries(filter).every(([k, v]) => item[k] === v)
  ).length;
}

function findBy(table: TableName, field: string, value: any): any | undefined {
  return getAll(table).find((item: any) => item[field] === value);
}

// ─── Exported API ──────────────────────────────────────────────────

export const db = {
  load: loadDB,
  save: saveDB,
  genId,

  // Generic CRUD
  getAll,
  findById,
  findMany,
  create,
  update,
  remove,
  softDelete,
  count,
  findBy,

  // Typed shortcuts
  users: {
    findMany: (filter?: any) => filter ? findMany("users", filter) : getAll("users"),
    findById: (id: string) => findById("users", id),
    findByEmail: (email: string) => findBy("users", "email", email),
    create: (data: any) => create("users", data),
    update: (id: string, data: any) => update("users", id, data),
  },
  organizations: {
    findMany: () => getAll("organizations"),
    findById: (id: string) => findById("organizations", id),
    findBySlug: (slug: string) => findBy("organizations", "slug", slug),
    create: (data: any) => create("organizations", data),
  },
  workspaces: {
    findMany: (filter?: any) => filter ? findMany("workspaces", filter) : getAll("workspaces"),
    findById: (id: string) => findById("workspaces", id),
    create: (data: any) => create("workspaces", data),
    update: (id: string, data: any) => update("workspaces", id, data),
  },
  members: {
    findMany: (filter?: any) => filter ? findMany("members", filter) : getAll("members"),
    create: (data: any) => create("members", data),
    findByUserAndWorkspace: (userId: string, workspaceId: string) =>
      getAll("members").find((m: any) => m.userId === userId && m.workspaceId === workspaceId),
  },
  subscriptions: {
    create: (data: any) => create("subscriptions", data),
  },
  crmEntities: {
    findMany: (filter?: any) => filter ? findMany("crmEntities", filter) : getAll("crmEntities"),
    findById: (id: string) => findById("crmEntities", id),
    findByName: (workspaceId: string, name: string) =>
      getAll("crmEntities").find((e: any) => e.workspaceId === workspaceId && e.name === name),
    create: (data: any) => create("crmEntities", data),
    update: (id: string, data: any) => update("crmEntities", id, data),
    remove: (id: string) => remove("crmEntities", id),
    count: (filter?: any) => count("crmEntities", filter),
  },
  crmRecords: {
    findMany: (filter?: any, opts?: { skip?: number; take?: number }) => {
      let items = filter ? findMany("crmRecords", filter) : getAll("crmRecords");
      items = items.filter((r: any) => !r.deletedAt);
      if (opts?.skip) items = items.slice(opts.skip);
      if (opts?.take) items = items.slice(0, opts.take);
      return items;
    },
    findById: (id: string) => findById("crmRecords", id),
    create: (data: any) => create("crmRecords", data),
    update: (id: string, data: any) => update("crmRecords", id, data),
    softDelete: (id: string) => softDelete("crmRecords", id),
    count: (filter?: any) => {
      const items = filter ? findMany("crmRecords", filter) : getAll("crmRecords");
      return items.filter((r: any) => !r.deletedAt).length;
    },
  },
  websites: {
    findMany: (filter?: any) => filter ? findMany("websites", filter) : getAll("websites"),
    findById: (id: string) => findById("websites", id),
    create: (data: any) => create("websites", data),
    update: (id: string, data: any) => update("websites", id, data),
    remove: (id: string) => remove("websites", id),
  },
  automations: {
    findMany: (filter?: any) => filter ? findMany("automations", filter) : getAll("automations"),
    findById: (id: string) => findById("automations", id),
    create: (data: any) => create("automations", data),
    update: (id: string, data: any) => update("automations", id, data),
    remove: (id: string) => remove("automations", id),
  },
  aiBots: {
    findMany: (filter?: any) => filter ? findMany("aiBots", filter) : getAll("aiBots"),
    findById: (id: string) => findById("aiBots", id),
    create: (data: any) => create("aiBots", data),
    update: (id: string, data: any) => update("aiBots", id, data),
    remove: (id: string) => remove("aiBots", id),
  },
  aiAgents: {
    findMany: (filter?: any) => filter ? findMany("aiAgents", filter) : getAll("aiAgents"),
    findById: (id: string) => findById("aiAgents", id),
    create: (data: any) => create("aiAgents", data),
    update: (id: string, data: any) => update("aiAgents", id, data),
    remove: (id: string) => remove("aiAgents", id),
  },
  marketplaceItems: {
    findMany: (filter?: any) => filter ? findMany("marketplaceItems", filter) : getAll("marketplaceItems"),
    findById: (id: string) => findById("marketplaceItems", id),
    create: (data: any) => create("marketplaceItems", data),
    count: (filter?: any) => count("marketplaceItems", filter),
  },
  smartPackages: {
    findMany: (filter?: any) => filter ? findMany("smartPackages", filter) : getAll("smartPackages"),
    findById: (id: string) => findById("smartPackages", id),
    create: (data: any) => create("smartPackages", data),
  },
  auditLogs: {
    create: (data: any) => create("auditLogs", data),
  },
};
