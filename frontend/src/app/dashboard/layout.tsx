"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { api } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated, isInitializing, updateUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated || isInitializing) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    api
      .get("/api/user/profile")
      .then((res) => {
        if (res.data?.data) {
          updateUser(res.data.data);
        }
      })
      .catch(() => {
        // Profile sync failures are handled by the API refresh interceptor
      });
  }, [isHydrated, isInitializing, isAuthenticated, router, updateUser]);

  if (!isHydrated || isInitializing || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface-container-low/40">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
