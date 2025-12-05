// Mercguards War Dashboard – Consolidated & Mobile-Safe Version

import { useState, useRef } from "react";

import HeaderBar from "./components/layout/HeaderBar";
import SideMenu from "./components/SideMenu";
import MobileMenu from "./components/MobileMenu";
import MatchupPanel from "./components/MatchupPanel";
import InsightsPanel from "./components/InsightsPanel";
import ArmyTotalsPanel from "./components/ArmyTotalsPanel";
import WarLedgerTable from "./components/WarLedgerTable";
import ArmyGroupsPanel from "./components/ArmyGroupsPanel";
import AnalyticsPanel from "./components/analytics/AnalyticsPanel";
import ClassComparison from "./components/ClassComparison";

import { BUILD_PRIORITY, buildColors } from "./config/buildConfig";
import useMatchup from "./hooks/useMatchup";
import useCSVLoader from "./hooks/useCSVLoader";

// recharts imports stay — even if unused
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";


//////////////////////////////////////////////////////////////
// APP COMPONENT
//////////////////////////////////////////////////////////////
export default function App() {
  const [view, setView] = useState<"dashboard" | "analytics">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // CSV + player states (from custom hook)
  const {
    players,
    groups,
    loadingCSV,
    csvFiles,
    selectedCSV,
    setSelectedCSV,
    loadPublicCSV,
    handleCSV,
  } = useCSVLoader();

  // matchup hook (cleaned logic extracted out)
  const { attackers, defenders, result } = useMatchup(players);

  const exportRef = useRef<HTMLDivElement | null>(null);


  //////////////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////////////
  return (
    <div className="min-h-screen bg-nw-obsidian text-nw-parchment-soft nw-bg font-body">

      {/* LOADING OVERLAY */}
      {loadingCSV && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center animate-fadeIn">
            <div className="w-12 h-12 border-4 border-nw-gold-soft border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-nw-parchment-soft text-lg">Loading War Report…</p>
          </div>
        </div>
      )}

      {/* DESKTOP MENU */}
      <SideMenu
        csvFiles={csvFiles}
        selectedCSV={selectedCSV}
        setSelectedCSV={setSelectedCSV}
        loadPublicCSV={loadPublicCSV}
        view={view}
        setView={setView}
      />

      {/* MOBILE MENU */}
      <MobileMenu
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        csvFiles={csvFiles}
        selectedCSV={selectedCSV}
        setSelectedCSV={setSelectedCSV}
        loadPublicCSV={loadPublicCSV}
        view={view}
        setView={setView}
      />

      {/* HEADER BAR */}
      <HeaderBar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        selectedCSV={selectedCSV}
      />


      {/* MAIN CONTENT */}
      <main
        ref={exportRef}
        className="md:ml-56 ml-0 max-w-[1800px] mx-auto px-4 py-5 space-y-6"
      >

        {/* LANDING PAGE */}
        {selectedCSV === "__none__" && (
          <div className="text-center py-20 opacity-70">
            <h2 className="text-3xl mb-3 font-semibold">
              Welcome to the Mercguards War Ledger
            </h2>
            <p className="text-lg">Please select a war report from the menu.</p>
          </div>
        )}


        {/* ============================
            DASHBOARD VIEW
        ============================ */}
        {view === "dashboard" && players.length > 0 && (
          <>
            <MatchupPanel
              attackers={attackers}
              defenders={defenders}
              result={result}
            />

            <ArmyTotalsPanel players={players} />

            <InsightsPanel
              players={players}
              buildColors={buildColors}
            />

            <WarLedgerTable
              players={players}
              buildColors={buildColors}
            />

            <ArmyGroupsPanel
              players={players}
              buildColors={buildColors}
              BUILD_PRIORITY={BUILD_PRIORITY}
            />
          </>
        )}


        {/* ============================
            ANALYTICS VIEW
        ============================ */}
        {view === "analytics" && players.length > 0 ? (
          <>
            <ClassComparison players={players} />
            <AnalyticsPanel players={players} />
          </>
        ) : null}

      </main>
    </div>
  );
}
