"use client";

import { useAuth, useUI } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { AuthPage } from "@/components/auth-page";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { sidebarOpen } = useUI();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-1">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen bg-surface-1">
      <Sidebar />
      <main className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "ml-64" : "ml-[68px]")}>
        <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
