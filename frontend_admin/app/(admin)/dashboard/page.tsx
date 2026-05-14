"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users, ClipboardList, CheckCircle, BarChart3,
  ArrowUpRight, AlertCircle, Clock, TrendingUp,
  Activity, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { TopBar } from "@/components/layout/TopBar";
import { formatRelativeDate, formatDate, slugToTitle } from "@/lib/utils";

const PIE_COLORS = ["#6d47fc", "#8b72ff", "#ab9fff", "#06d6a0", "#fbbf24", "#fb7185"];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" },
  }),
};

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api.get("/api/admin/analytics/overview").then((r) => r.data.data),
  });

  const { data: usersTimeseries } = useQuery({
    queryKey: ["admin-users-timeseries"],
    queryFn: () => api.get("/api/admin/analytics/users").then((r) => r.data.data),
  });

  const { data: applicationsTimeseries } = useQuery({
    queryKey: ["admin-apps-timeseries"],
    queryFn: () => api.get("/api/admin/analytics/applications").then((r) => r.data.data),
  });

  const { data: programsAnalytics } = useQuery({
    queryKey: ["admin-programs-analytics"],
    queryFn: () => api.get("/api/admin/analytics/programs").then((r) => r.data.data),
  });

  const { data: recentUsers } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: () =>
      api.get("/api/admin/users?limit=5&page=1").then((r) => r.data.data),
  });

  const { data: recentApplications } = useQuery({
    queryKey: ["admin-recent-apps"],
    queryFn: () =>
      api.get("/api/admin/applications?limit=5").then((r) => r.data.data),
  });

  const { data: auditLogs } = useQuery({
    queryKey: ["admin-audit-logs-recent"],
    queryFn: () => api.get("/api/admin/audit-logs").then((r) => r.data.data?.slice(0, 5)),
  });

  const stats = [
    {
      label: "Total Users",
      value: overview?.totalUsers ?? "—",
      icon: Users,
      change: 12,
      changeLabel: "vs. last month",
      color: "brand" as const,
    },
    {
      label: "Total Applications",
      value: overview?.totalApplications ?? "—",
      icon: ClipboardList,
      change: 8,
      changeLabel: "vs. last month",
      color: "blue" as const,
    },
    {
      label: "Pending Reviews",
      value: overview?.pendingReviews ?? "—",
      icon: Clock,
      color: "yellow" as const,
    },
    {
      label: "Verified Documents",
      value: overview?.verifiedDocuments ?? "—",
      icon: CheckCircle,
      change: 5,
      changeLabel: "vs. last month",
      color: "green" as const,
    },
  ];

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={`Last updated: ${formatDate(new Date())}`}
      />
      <main className="flex-1 p-6 space-y-6 min-h-0">
        {/* KPI Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <StatCard {...stat} loading={overviewLoading} />
            </motion.div>
          ))}
        </section>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card lg:col-span-2 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white font-display">Platform Activity</h3>
                <p className="text-xs text-slate-500 mt-0.5">New users per day — last 30 days</p>
              </div>
              <button className="btn-ghost text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usersTimeseries || []}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6d47fc" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6d47fc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#1e2130" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#475569", fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(v) => v.slice(5)}
                    interval={4}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#475569", fontSize: 10, fontWeight: 600 }}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#151821",
                      borderRadius: "12px",
                      border: "1px solid #1e2130",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                      color: "#e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="New Users"
                    stroke="#6d47fc"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Program Mix Pie */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="card p-6 flex flex-col"
          >
            <h3 className="text-base font-bold text-white font-display mb-1">Benefit Types</h3>
            <p className="text-xs text-slate-500 mb-5">Program mix breakdown</p>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={programsAnalytics || []}
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="program_type"
                    >
                      {(programsAnalytics || []).map((_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#151821",
                        borderRadius: "10px",
                        border: "1px solid #1e2130",
                        color: "#e2e8f0",
                        fontSize: 11,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white">
                    {(programsAnalytics || []).reduce((a: number, p: any) => a + p.count, 0)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                    Programs
                  </span>
                </div>
              </div>
              <div className="mt-4 w-full space-y-2">
                {(programsAnalytics || []).slice(0, 4).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-xs text-slate-400 capitalize">
                        {slugToTitle(item.program_type)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-300">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Applications Timeseries */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white font-display">Application Submissions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daily submissions — last 30 days</p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationsTimeseries || []}>
                <CartesianGrid vertical={false} stroke="#1e2130" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(v) => v.slice(5)}
                  interval={4}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10, fontWeight: 600 }}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#151821",
                    borderRadius: "12px",
                    border: "1px solid #1e2130",
                    color: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Submissions" fill="#6d47fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bottom Row: Recent Users & Recent Applications & Audit */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Recent Sign-ups</h3>
              <a href="/users" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <ul className="space-y-3">
              {(recentUsers || []).map((u: any) => (
                <li key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {u.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{u.full_name}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <StatusBadge status={u.status} />
                </li>
              ))}
              {!recentUsers &&
                Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="skeleton w-8 h-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3.5 w-28" />
                      <div className="skeleton h-3 w-36" />
                    </div>
                  </li>
                ))}
            </ul>
          </motion.div>

          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Recent Applications</h3>
              <a href="/applications" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <ul className="space-y-3">
              {(recentApplications || []).map((app: any) => (
                <li key={app.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {app.user?.full_name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{app.program?.name}</div>
                  </div>
                  <StatusBadge status={app.status} />
                </li>
              ))}
              {!recentApplications &&
                Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="skeleton w-8 h-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3.5 w-28" />
                      <div className="skeleton h-3 w-36" />
                    </div>
                  </li>
                ))}
            </ul>
          </motion.div>

          {/* Audit Log Preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Recent Activity</h3>
              <a href="/audit-logs" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <ul className="space-y-3">
              {(auditLogs || []).map((log: any) => (
                <li key={log.id} className="text-xs">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-slate-300 font-medium">
                        {slugToTitle(log.action)}
                      </span>
                      <div className="text-slate-600 mt-0.5">{formatRelativeDate(log.created_at)}</div>
                    </div>
                  </div>
                </li>
              ))}
              {!auditLogs &&
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="skeleton w-1.5 h-1.5 rounded-full mt-1.5" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-full" />
                      <div className="skeleton h-2.5 w-20" />
                    </div>
                  </li>
                ))}
            </ul>
          </motion.div>
        </div>

        {/* Action Items */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <div className="card p-5 border-rose-500/20 bg-rose-500/5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4.5 h-4.5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-300 mb-1">Policy Update Required</h4>
                <p className="text-xs text-rose-400/70 leading-relaxed">
                  SNAP income threshold changed in 5 states. Update program metadata to maintain accuracy.
                </p>
                <a href="/programs" className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-rose-400 hover:text-rose-300 uppercase tracking-wider transition-colors">
                  Update Programs <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="card p-5 border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-300 mb-1">
                  {overview?.pendingReviews || "—"} Applications Pending Review
                </h4>
                <p className="text-xs text-amber-400/70 leading-relaxed">
                  Applications awaiting admin review. Process them to keep response times low.
                </p>
                <a href="/applications" className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-amber-400 hover:text-amber-300 uppercase tracking-wider transition-colors">
                  Review Now <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
