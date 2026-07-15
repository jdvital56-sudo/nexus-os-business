"use client";

import { useAuth } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import DashboardContent from "./dashboard/page";

export default function Home() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
