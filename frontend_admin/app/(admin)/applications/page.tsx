"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  MessageSquare, ArrowUpDown, Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "action_required", label: "Action Required" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const PRIORITIES = [
  { value: "", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function ApplicationsPage() {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin-applications", status, priority],
    queryFn: () => {
      const params = new URLSearchParams({
        ...(status && { status }),
        ...(priority && { priority }),
      });
      return api.get(`/api/admin/applications?${params}`).then((r) => r.data.data);
    },
  });

  const updateApp = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/api/admin/applications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      setEditingId(null);
    },
  });

  return (
    <>
      <TopBar
        title="Applications"
        subtitle={`${(applications || []).length} total applications`}
      />
      <main className="flex-1 p-6 space-y-5 min-h-0">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select w-48"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="select w-44"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th>Applicant</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Last Updated</th>
                  <th>Notes</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j}><div className="skeleton h-4 w-full max-w-[120px]" /></td>
                        ))}
                      </tr>
                    ))
                  : (applications || []).map((app: any) => (
                      <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td>
                          <div className="font-medium text-white text-sm">{app.user?.full_name}</div>
                          <div className="text-xs text-slate-500">{app.user?.email}</div>
                        </td>
                        <td>
                          <div className="text-sm text-slate-300 max-w-[160px] truncate">{app.program?.name}</div>
                          <div className="text-xs text-slate-600">{app.program?.agency}</div>
                        </td>
                        <td>
                          <select
                            value={app.status}
                            onChange={(e) =>
                              updateApp.mutate({ id: app.id, data: { status: e.target.value } })
                            }
                            className="bg-transparent border-none text-xs p-0 focus:outline-none cursor-pointer"
                          >
                            {STATUSES.slice(1).map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <StatusBadge status={app.status} />
                        </td>
                        <td>
                          {app.priority ? <PriorityBadge priority={app.priority} /> : "—"}
                        </td>
                        <td className="text-xs text-slate-500">
                          {formatDate(app.last_updated_at)}
                        </td>
                        <td className="max-w-[200px]">
                          {editingId === app.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                className="input text-xs py-1.5"
                                placeholder="Add note…"
                                autoFocus
                              />
                              <button
                                onClick={() => updateApp.mutate({ id: app.id, data: { notes: notesValue } })}
                                className="text-brand-400 hover:text-brand-300 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 truncate block">
                              {app.notes || <span className="text-slate-700 italic">No notes</span>}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingId(app.id);
                                setNotesValue(app.notes || "");
                              }}
                              title="Add Note"
                              className="w-8 h-8 rounded-lg hover:bg-brand-500/15 text-slate-500 hover:text-brand-400 flex items-center justify-center transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateApp.mutate({ id: app.id, data: { status: "approved" } })}
                              title="Approve"
                              className="w-8 h-8 rounded-lg hover:bg-emerald-500/15 text-slate-500 hover:text-emerald-400 flex items-center justify-center transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateApp.mutate({ id: app.id, data: { status: "rejected" } })}
                              title="Reject"
                              className="w-8 h-8 rounded-lg hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
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
