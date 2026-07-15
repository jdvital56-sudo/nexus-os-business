"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

// ─── API Client ────────────────────────────────────────────────────

const API_BASE = "/api";

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("nexus_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body?: any) => apiFetch(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: (path: string, body: any) => apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: "DELETE" }),
  put: (path: string, body: any) => apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
};

// ─── Auth Context ──────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  name: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthState {
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, orgName?: string) => Promise<void>;
  logout: () => void;
  setWorkspace: (ws: Workspace) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("nexus_token");
    if (saved) {
      setToken(saved);
      api.get("/auth/me")
        .then((res) => {
          setUser(res.data);
          setWorkspaces(res.data.workspaces || []);
          const savedWs = localStorage.getItem("nexus_workspace");
          const ws = res.data.workspaces?.find((w: Workspace) => w.id === savedWs) || res.data.workspaces?.[0];
          if (ws) setCurrentWorkspace(ws);
        })
        .catch(() => { localStorage.removeItem("nexus_token"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("nexus_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    setWorkspaces(res.data.workspaces || []);
    if (res.data.workspaces?.[0]) {
      setCurrentWorkspace(res.data.workspaces[0]);
      localStorage.setItem("nexus_workspace", res.data.workspaces[0].id);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, orgName?: string) => {
    const res = await api.post("/auth/register", { email, password, name, organizationName: orgName });
    localStorage.setItem("nexus_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    setWorkspaces(res.data.workspaces || []);
    if (res.data.workspaces?.[0]) {
      setCurrentWorkspace(res.data.workspaces[0]);
      localStorage.setItem("nexus_workspace", res.data.workspaces[0].id);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_workspace");
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
    setToken(null);
  }, []);

  const setWorkspace = useCallback((ws: Workspace) => {
    setCurrentWorkspace(ws);
    localStorage.setItem("nexus_workspace", ws.id);
  }, []);

  return (
    <AuthContext.Provider value={{ user, workspaces, currentWorkspace, token, loading, login, register, logout, setWorkspace }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

// ─── UI Store ──────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  modal: string | null;
  modalData: any;
  openModal: (id: string, data?: any) => void;
  closeModal: () => void;
  notifications: { id: string; type: "success" | "error" | "info"; message: string }[];
  addNotification: (type: "success" | "error" | "info", message: string) => void;
  removeNotification: (id: string) => void;
}

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);
  const openModal = useCallback((id: string, data?: any) => { setModal(id); setModalData(data); }, []);
  const closeModal = useCallback(() => { setModal(null); setModalData(null); }, []);
  const addNotification = useCallback((type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((p) => [...p, { id, type, message }]);
    setTimeout(() => setNotifications((p) => p.filter((n) => n.id !== id)), 4000);
  }, []);
  const removeNotification = useCallback((id: string) => setNotifications((p) => p.filter((n) => n.id !== id)), []);

  return (
    <UIContext.Provider value={{ sidebarOpen, toggleSidebar, modal, modalData, openModal, closeModal, notifications, addNotification, removeNotification }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be inside UIProvider");
  return ctx;
}
