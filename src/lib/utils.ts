import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function truncate(text: string, length: number) {
  return text.length > length ? text.slice(0, length) + "…" : text;
}

export function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export const FIELD_TYPE_ICONS: Record<string, string> = {
  text: "type", number: "hash", boolean: "toggle-left", date: "calendar", datetime: "clock",
  email: "mail", phone: "phone", url: "link", select: "list", multiselect: "list-checks",
  textarea: "align-left", richtext: "file-text", currency: "dollar-sign", percent: "percent",
  relation: "link", file: "file", image: "image", formula: "calculator", ai: "sparkles",
  rating: "star", json: "braces",
};

export const INDUSTRY_COLORS: Record<string, string> = {
  dental: "#10b981", restaurant: "#ef4444", ecommerce: "#3b82f6", fitness: "#f59e0b",
  realestate: "#8b5cf6", spa: "#ec4899", legal: "#1e40af", general: "#6366f1",
};
