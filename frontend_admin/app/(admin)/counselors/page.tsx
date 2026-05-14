"use client";

import { motion } from "framer-motion";
import { UserCircle2, Mail, Phone, Star, Plus } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";

// Mock counselors data — will be replaced by real API once counselor module is complete
const MOCK_COUNSELORS = [
  { id: "1", name: "Dr. Sarah Johnson", email: "sarah@momplan.com", phone: "+1 555-0101", specialization: "WIC & SNAP", clients: 24, rating: 4.9, active: true },
  { id: "2", name: "Maria Rodriguez", email: "maria@momplan.com", phone: "+1 555-0102", specialization: "Medicaid", clients: 18, rating: 4.7, active: true },
  { id: "3", name: "Jennifer Lee", email: "jen@momplan.com", phone: "+1 555-0103", specialization: "Housing Assistance", clients: 31, rating: 4.8, active: true },
  { id: "4", name: "Amanda Foster", email: "amanda@momplan.com", phone: "+1 555-0104", specialization: "Child Care", clients: 22, rating: 4.6, active: false },
];

export default function CounselorsPage() {
  return (
    <>
      <TopBar title="Counselors" subtitle="Manage counselor team and assignments" />
      <main className="flex-1 p-6 space-y-5 min-h-0">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">{MOCK_COUNSELORS.length} counselors on team</p>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Counselor
          </button>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {MOCK_COUNSELORS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card card-hover p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.specialization}</div>
                  </div>
                </div>
                <span className={`badge ${c.active ? "badge-green" : "badge-gray"} text-[10px]`}>
                  {c.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                  {c.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                  {c.phone}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{c.clients}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Clients</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-lg font-bold text-white">{c.rating}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Rating</div>
                </div>
                <button className="btn-secondary text-xs py-1.5">View Profile</button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </>
  );
}
