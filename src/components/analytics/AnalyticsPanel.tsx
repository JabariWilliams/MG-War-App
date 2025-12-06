import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedPlayer } from "../../utils/csvParser";

import DamageByPlayerChart from "./DamageByPlayerChart";
import KDTrendChart from "./KDTrendChart";
import KPDistributionTable from "./KPDistributionTable";
import TopDeathsTable from "./TopDeathsTable";
import TopDPSChart from "./TopDPSChart";

import ClassComparison from "../ClassComparison";
import GroupComparisonPage from "./GroupComparisonPage";

type AnalyticsTab = "overview" | "class" | "groups" | "topdps";

interface AnalyticsPanelProps {
  players: EnhancedPlayer[];
}

export default function AnalyticsPanel({ players }: AnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");

  const tabs = [
    { id: "overview", label: "Top Stats" },
    { id: "class", label: "Class Comparison" },
    { id: "groups", label: "Group Comparison" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* TAB HEADERS */}
      <div className="flex flex-wrap gap-2 pb-2 mb-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm md:text-base rounded-t-lg border-b-2 transition-all
                ${
                  isActive
                    ? "border-nw-gold-soft text-nw-gold-soft bg-black/40 shadow-[0_0_10px_rgba(0,0,0,0.7)]"
                    : "border-transparent text-nw-parchment-soft/70 hover:text-nw-gold-soft/90 hover:border-nw-gold-soft/50"
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT WITH ANIMATION */}
      <div className="relative min-h-[300px] flex flex-col">
        <AnimatePresence mode="wait">
          {/* =============================
              OVERVIEW TAB (NEW LAYOUT)
           ============================= */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >

              {/* Row 1 – Top DPS + Top Deaths */}
              <div className="grid gap-6 lg:grid-cols-2">
                  <TopDPSChart players={players} />

                  <TopDeathsTable players={players} />

              </div>

              {/* Row 2 – Full-width KP Distribution */}
                <KPDistributionTable players={players} />

            </motion.div>
          )}

          {/* =============================
              CLASS COMPARISON TAB
           ============================= */}
          {activeTab === "class" && (
            <motion.div
              key="class"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <p className="text-sm text-nw-parchment-soft/80 mb-2">
                Compare classes by total damage, healing, and KP contribution.
              </p>
              <ClassComparison players={players} />
            </motion.div>
          )}

          {/* =============================
              GROUP COMPARISON TAB
           ============================= */}
          {activeTab === "groups" && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="space-y-4 pt-3"
            >
              <div className="min-h-[400px]">
                <GroupComparisonPage players={players} />
              </div>
            </motion.div>
          )}
          )
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
