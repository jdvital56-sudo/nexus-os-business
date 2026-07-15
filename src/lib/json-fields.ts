// Helper to serialize/deserialize JSON stored as String in SQLite
export function toJson(value: any): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value || {});
}

export function fromJson<T = any>(value: string | null | undefined): T {
  if (!value) return {} as T;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(value); } catch { return {} as T; }
}

export function toJsonArray(value: any[]): string {
  return JSON.stringify(value || []);
}

export function fromJsonArray<T = any>(value: string | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  try { return JSON.parse(value); } catch { return []; }
}
