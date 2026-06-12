"use client";

import { useState } from "react";
import ProgramDeadlinesDashboard from "@/components/dashboard/ProgramDeadlinesDashboard";
import MyDeadlinesTab from "@/components/dashboard/MyDeadlinesTab";

type TabId = "renewals" | "my-deadlines";

export default function DeadlinesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("renewals");

  return (
    <div className="-mx-6 lg:-mx-8 -my-6 lg:-my-8 min-h-full px-6 lg:px-8 py-10 lg:py-12 bg-[#F3E5F5]">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="text-2xl mb-3" aria-hidden>
            🌸
          </div>
          <h1 className="font-display font-bold text-2xl lg:text-[1.75rem] text-[#4A148C] mb-2">
            Benefits Program Tracker
          </h1>
          <p className="text-sm lg:text-base text-[#7E57C2]">
            Keeping your family covered — stay ahead of every deadline 💜
          </p>
        </header>

        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {([
            { id: "renewals" as const, label: "Program Renewals" },
            { id: "my-deadlines" as const, label: "My Application Deadlines" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
                activeTab === tab.id
                  ? "bg-[#7E57C2] border-[#7E57C2] text-white font-semibold shadow-sm"
                  : "bg-white/80 border-[#D1C4E9] text-[#6A1B9A] hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "renewals" ? <ProgramDeadlinesDashboard /> : <MyDeadlinesTab />}

        <footer className="text-center mt-10">
          <p className="text-sm lg:text-base text-[#7E57C2] font-medium">
            💜 You&apos;ve got this, mama — every deadline met is a win for your family! 💜
          </p>
        </footer>
      </div>
    </div>
  );
}
