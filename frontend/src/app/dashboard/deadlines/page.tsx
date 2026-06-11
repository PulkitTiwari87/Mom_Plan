"use client";

import { useState } from "react";
import ProgramDeadlinesDashboard from "@/components/dashboard/ProgramDeadlinesDashboard";
import MyDeadlinesTab from "@/components/dashboard/MyDeadlinesTab";

type TabId = "renewals" | "my-deadlines";

export default function DeadlinesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("renewals");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
          Deadlines Dashboard
        </h1>
        <p className="text-sm text-on-surface-variant">
          View program renewal deadlines and manage your application due dates
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { id: "renewals" as const, label: "Program Renewals" },
          { id: "my-deadlines" as const, label: "My Application Deadlines" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              activeTab === tab.id
                ? "bg-primary-100 border-primary-200 text-primary-700 font-semibold"
                : "bg-white border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "renewals" ? <ProgramDeadlinesDashboard /> : <MyDeadlinesTab />}
    </div>
  );
}
