"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { formatRelativeDate } from "@/lib/utils";

export default function NotificationsPage() {
  // Admins can view all notifications via admin API — using user notifications as proxy
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.get("/api/notifications?limit=50").then((r) => r.data.data || []),
  });

  return (
    <>
      <TopBar title="Notifications" subtitle="System notifications sent to users" />
      <main className="flex-1 p-6 space-y-5 min-h-0">
        <div className="card divide-y divide-slate-800/60">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-5">
                  <div className="skeleton w-9 h-9 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-48" />
                    <div className="skeleton h-3 w-full max-w-[400px]" />
                  </div>
                </div>
              ))
            : (notifications || []).map((n: any) => (
                <div key={n.id} className="flex items-start gap-4 p-5 hover:bg-slate-800/20 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    n.type === "status_update" ? "bg-blue-500/15 text-blue-400" :
                    n.type === "deadline" ? "bg-amber-500/15 text-amber-400" :
                    "bg-brand-500/15 text-brand-400"
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                      <span className="text-xs text-slate-600 whitespace-nowrap shrink-0">
                        {formatRelativeDate(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-600 mt-1.5 inline-block uppercase tracking-wider">{n.type}</span>
                  </div>
                </div>
              ))}
          {!isLoading && (notifications || []).length === 0 && (
            <div className="py-16 text-center">
              <CheckCheck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No notifications found</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
