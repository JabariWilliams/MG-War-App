// Mercguards War Dashboard – Consolidated & Mobile-Safe Version

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

import HeaderBar from "./components/layout/HeaderBar";
import SideMenu from "./components/SideMenu";
import MobileMenu from "./components/MobileMenu";

import MatchupPanel from "./components/MatchupPanel";
import InsightsPanel from "./components/InsightsPanel";
import ArmyTotalsPanel from "./components/ArmyTotalsPanel";
import WarLedgerTable from "./components/WarLedgerTable";
import ArmyGroupsPanel from "./components/ArmyGroupsPanel";
import AnalyticsPanel from "./components/analytics/AnalyticsPanel";

import PlayerProfilePage from "./components/PlayerProfilePage";
import CompanyOverviewPage from "./components/CompanyOverviewPage";
import LegacyStatsPage from "./components/LegacyStatsPage";

import { EnhancedPlayer } from "./utils/csvParser";
import { BUILD_PRIORITY, buildColors } from "./config/buildConfig";

import useMatchup from "./hooks/useMatchup";
import useCSVLoader from "./hooks/useCSVLoader";

// recharts imports stay
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

export default function App() {
  const [view, setView] = useState<
    "overview" | "dashboard" | "analytics" | "player" | "legacy"
  >("overview");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<EnhancedPlayer | null>(
    null
  );

  const {
    players,
    groups,
    loadingCSV,
    csvFiles,
    selectedCSV,
    setSelectedCSV,
    loadPublicCSV,
    handleCSV,
    currentWar,
    allPlayersByWar,
  } = useCSVLoader();

  const { attackers, defenders, result } = useMatchup(players);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // Fix selected player when switching wars
  useEffect(() => {
    if (view === "player" && selectedPlayer) {
      const updated = players.find(
        (p) =>
          p.Player.trim().toLowerCase() ===
          selectedPlayer.Player.trim().toLowerCase()
      );
      if (updated) setSelectedPlayer(updated);
    }
  }, [players]);

  return (
    <div className="min-h-screen bg-nw-obsidian text-nw-parchment-soft nw-bg font-body">
      {/* LOADING OVERLAY */}
      {loadingCSV && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center animate-fadeIn">
            <div className="w-12 h-12 border-4 border-nw-gold-soft border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-nw-parchment-soft text-lg">
              Loading War Report…
            </p>
          </div>
        </div>
      )}

      {/* MENU SYSTEM */}
      <SideMenu
        csvFiles={csvFiles}
        selectedCSV={selectedCSV}
        setSelectedCSV={setSelectedCSV}
        loadPublicCSV={loadPublicCSV}
        view={view}
        setView={setView}
      />

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

      <HeaderBar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        selectedCSV={selectedCSV}
      />

      {/* ============================================
          MAIN CONTENT
      ============================================ */}
      <motion.main
        key={selectedCSV + view}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="md:ml-56 ml-0 max-w-[1800px] mx-auto px-4 py-5 space-y-6"
      >

        {/* OVERVIEW PAGE */}
        {view === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <CompanyOverviewPage allPlayersByWar={allPlayersByWar} />
          </motion.div>
        )}

        {/* LEGACY STATS PAGE */}
        {view === "legacy" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <LegacyStatsPage />
          </motion.div>
        )}

        {/* DASHBOARD PAGE */}
        {view === "dashboard" &&
          selectedCSV !== "__none__" &&
          players.length > 0 && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <MatchupPanel
                  attackers={attackers}
                  defenders={defenders}
                  result={result}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ArmyTotalsPanel players={players} />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <InsightsPanel players={players} buildColors={buildColors} />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <WarLedgerTable
                  players={players}
                  buildColors={buildColors}
                  onPlayerClick={(player) => {
                    setSelectedPlayer(player);
                    setView("player");
                  }}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ArmyGroupsPanel
                  players={players}
                  buildColors={buildColors}
                  BUILD_PRIORITY={BUILD_PRIORITY}
                />
              </motion.div>
            </>
          )}

        {/* ANALYTICS PAGE */}
        {view === "analytics" &&
          selectedCSV !== "__none__" &&
          players.length > 0 && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <MatchupPanel
                  attackers={attackers}
                  defenders={defenders}
                  result={result}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AnalyticsPanel players={players} />
              </motion.div>
            </>
          )}

        {/* PLAYER PAGE */}
        {view === "player" && selectedPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PlayerProfilePage
              player={selectedPlayer}
              currentWar={selectedCSV}
              allWars={csvFiles}
              allPlayersByWar={allPlayersByWar}
              onBack={() => setView("dashboard")}
              onSelectWar={async (war) => {
                setSelectedCSV(war);
                await loadPublicCSV(war);
                setView("player");
              }}
            />
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
