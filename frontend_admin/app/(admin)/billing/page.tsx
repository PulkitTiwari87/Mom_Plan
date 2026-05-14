"use client";

import { motion } from "framer-motion";
import { CreditCard, TrendingUp, Users, DollarSign, RefreshCw } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/ui/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PlanBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

// Billing page uses static mock data; wire to /api/billing or Stripe API when available
const MRR_TREND = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  mrr: Math.round(4200 + Math.random() * 2800),
}));

const MOCK_SUBS = [
  { id: "s1", user: "Sarah M.", email: "sarah@example.com", plan: "navigator", amount: 49, status: "active", since: "2025-11-01" },
  { id: "s2", user: "Jessica L.", email: "jessica@example.com", plan: "family", amount: 19, status: "active", since: "2025-12-15" },
  { id: "s3", user: "Priya K.", email: "priya@example.com", plan: "navigator", amount: 49, status: "active", since: "2026-01-05" },
  { id: "s4", user: "Amanda R.", email: "amanda@example.com", plan: "free", amount: 0, status: "active", since: "2026-02-10" },
];

export default function BillingPage() {
  return (
    <>
      <TopBar title="Billing & Subscriptions" subtitle="Revenue and subscription management" />
      <main className="flex-1 p-6 space-y-6 min-h-0">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Monthly Revenue" value="$6,842" icon={DollarSign} change={14} color="green" />
          <StatCard label="Paid Subscribers" value="312" icon={Users} change={8} color="brand" />
          <StatCard label="Navigator Plan" value="187" icon={CreditCard} color="blue" />
          <StatCard label="Family Plan" value="125" icon={CreditCard} color="yellow" />
        </div>

        {/* MRR Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-sm font-bold text-white mb-1">Monthly Recurring Revenue</h3>
          <p className="text-xs text-slate-500 mb-5">Last 12 months</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MRR_TREND}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06d6a0" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06d6a0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e2130" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 10 }} width={50}
                  tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#151821", borderRadius: "10px", border: "1px solid #1e2130", color: "#e2e8f0", fontSize: 11 }}
                  formatter={(v: any) => [`$${v.toLocaleString()}`, "MRR"]}
                />
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#06d6a0" strokeWidth={2.5} fill="url(#mrrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Subscriptions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="table-wrapper"
        >
          <div className="px-5 py-4 border-b border-slate-800/60">
            <h3 className="text-sm font-bold text-white">Subscriptions</h3>
          </div>
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Amount/mo</th>
                <th>Status</th>
                <th>Since</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {MOCK_SUBS.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div className="font-medium text-white text-sm">{sub.user}</div>
                    <div className="text-xs text-slate-500">{sub.email}</div>
                  </td>
                  <td><PlanBadge plan={sub.plan} /></td>
                  <td className="text-sm text-slate-300">
                    {sub.amount === 0 ? <span className="text-slate-600">Free</span> : `$${sub.amount}`}
                  </td>
                  <td><span className="badge badge-green">Active</span></td>
                  <td className="text-xs text-slate-500">{formatDate(sub.since)}</td>
                  <td>
                    <div className="flex justify-end">
                      <button className="btn-ghost text-xs">Manage</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </main>
    </>
  );
}
