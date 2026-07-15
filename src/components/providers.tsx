"use client";

import { AuthProvider, UIProvider } from "@/lib/store";
import { Notifications } from "@/components/notifications";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        {children}
        <Notifications />
      </UIProvider>
    </AuthProvider>
  );
}
