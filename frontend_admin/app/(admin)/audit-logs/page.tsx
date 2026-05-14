"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ScrollText, User, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { formatDatetime, slugToTitle } from "@/lib/utils";

export default function AuditLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => api.get("/api/admin/audit-logs").then((r) => r.data.data),
  });

  return (
    <>
      <TopBar title="Audit Logs" subtitle="All admin actions are recorded here" />
      <main className="flex-1 p-6 min-h-0">
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j}><div className="skeleton h-4 w-full max-w-[120px]" /></td>
                        ))}
                      </tr>
                    ))
                  : (logs || []).map((log: any, i: number) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                          {formatDatetime(log.created_at)}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-brand-500/15 text-brand-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {log.admin?.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm text-white">{log.admin?.full_name}</div>
                              <div className="text-xs text-slate-600">{log.admin?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm text-slate-200 font-medium">
                            {slugToTitle(log.action)}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500 capitalize">{log.target_type}</td>
                        <td>
                          <span className="font-mono text-xs text-slate-600 truncate block max-w-[120px]" title={log.target_id}>
                            {log.target_id?.slice(0, 12)}…
                          </span>
                        </td>
                        <td>
                          <code className="text-xs text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded block max-w-[220px] truncate">
                            {JSON.stringify(log.metadata)}
                          </code>
                        </td>
                      </motion.tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
