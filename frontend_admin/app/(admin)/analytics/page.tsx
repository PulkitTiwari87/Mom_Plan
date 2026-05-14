"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { Users, ClipboardList, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/ui/StatCard";
import { slugToTitle } from "@/lib/utils";

const COLORS = ["#6d47fc", "#8b72ff", "#06d6a0", "#fbbf24", "#fb7185", "#60a5fa"];

export default function AnalyticsPage() {
  const { data: overview } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api.get("/api/admin/analytics/overview").then((r) => r.data.data),
  });

  const { data: usersTimeseries } = useQuery({
    queryKey: ["admin-users-timeseries"],
    queryFn: () => api.get("/api/admin/analytics/users").then((r) => r.data.data),
  });

  const { data: appsTimeseries } = useQuery({
    queryKey: ["admin-apps-timeseries"],
    queryFn: () => api.get("/api/admin/analytics/applications").then((r) => r.data.data),
  });

  const { data: programsData } = useQuery({
    queryKey: ["admin-programs-analytics"],
    queryFn: () => api.get("/api/admin/analytics/programs").then((r) => r.data.data),
  });

  const stats = [
    { label: "Total Users", value: overview?.totalUsers ?? "—", icon: Users, color: "brand" as const, change: 12 },
    { label: "Total Applications", value: overview?.totalApplications ?? "—", icon: ClipboardList, color: "blue" as const, change: 8 },
    { label: "Pending Reviews", value: overview?.pendingReviews ?? "—", icon: Clock, color: "yellow" as const },
    { label: "Verified Docs", value: overview?.verifiedDocuments ?? "—", icon: CheckCircle, color: "green" as const, change: 5 },
  ];

  return (
    <>
      <TopBar title="Analytics" subtitle="Platform-wide performance metrics" />
      <main className="flex-1 p-6 space-y-6 min-h-0">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <StatCard {...s} />
            </motion.div>
          ))}
        </div>

        {/* User Growth */}
        <div className="grid lg:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h3 className="text-sm font-bold text-white mb-1">User Growth</h3>
            <p className="text-xs text-slate-500 mb-5">New registrations — last 30 days</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usersTimeseries || []}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6d47fc" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6d47fc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e2130" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false}
                    tick={{ fill: "#475569", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={4} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 10 }} width={25} />
                  <Tooltip contentStyle={{ backgroundColor: "#151821", borderRadius: "10px", border: "1px solid #1e2130", color: "#e2e8f0", fontSize: 11 }} />
                  <Area type="monotone" dataKey="count" name="New Users" stroke="#6d47fc" strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Application Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-6"
          >
            <h3 className="text-sm font-bold text-white mb-1">Application Submissions</h3>
            <p className="text-xs text-slate-500 mb-5">Daily submissions — last 30 days</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appsTimeseries || []}>
                  <CartesianGrid stroke="#1e2130" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false}
                    tick={{ fill: "#475569", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={4} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 10 }} width={25} />
                  <Tooltip contentStyle={{ backgroundColor: "#151821", borderRadius: "10px", border: "1px solid #1e2130", color: "#e2e8f0", fontSize: 11 }} />
                  <Bar dataKey="count" name="Submissions" fill="#8b72ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Program Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="text-sm font-bold text-white mb-1">Benefit Program Distribution</h3>
          <p className="text-xs text-slate-500 mb-6">Programs by type</p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={programsData || []} innerRadius={65} outerRadius={100}
                    paddingAngle={3} dataKey="count" nameKey="program_type">
                    {(programsData || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#151821", borderRadius: "10px", border: "1px solid #1e2130", color: "#e2e8f0", fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {(programsData || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-slate-300 capitalize">{slugToTitle(item.program_type)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{item.count}</span>
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${((item.count / (programsData || []).reduce((a: number, p: any) => a + p.count, 0)) * 100).toFixed(1)}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
