"use client";

import { useUI } from "@/lib/store";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const icons = { success: CheckCircle, error: AlertCircle, info: Info };
const colors = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function Notifications() {
  const { notifications, removeNotification } = useUI();
  if (!notifications.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {notifications.map((n) => {
        const Icon = icons[n.type];
        return (
          <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slideIn ${colors[n.type]}`}>
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm flex-1">{n.message}</p>
            <button onClick={() => removeNotification(n.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
