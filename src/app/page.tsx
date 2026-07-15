"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { DashboardPage } from "./dashboard/page";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
