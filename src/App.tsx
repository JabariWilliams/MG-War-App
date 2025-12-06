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
import { EnhancedPlayer } from "./utils/csvParser";
import PlayerProfilePage from "./components/PlayerProfilePage";
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

export default function App() {
  const [view, setView] = useState<"dashboard" | "analytics" | "player">(
    "dashboard"
  );
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

  // ======================================================
  // FIX: Re-sync selected player when players[] updates
  // ======================================================
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

      <motion.main
        key={selectedCSV} // important: triggers animation on war change
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="md:ml-56 ml-0 max-w-[1800px] mx-auto px-4 py-5 space-y-6"
      >
        {selectedCSV === "__none__" && (
          <div className="text-center py-20 opacity-70">
            <h2 className="text-3xl mb-3 font-semibold">
              Welcome to the Mercguards War Ledger
            </h2>
            <p className="text-lg">Please select a war report from the menu.</p>
          </div>
        )}

        {view === "dashboard" && players.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <MatchupPanel
                attackers={attackers}
                defenders={defenders}
                result={result}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ArmyTotalsPanel players={players} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <InsightsPanel players={players} buildColors={buildColors} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <WarLedgerTable
                players={players}
                buildColors={buildColors}
                onPlayerClick={(player) => {
                  setSelectedPlayer(player);
                  setView("player");
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ArmyGroupsPanel
                players={players}
                buildColors={buildColors}
                BUILD_PRIORITY={BUILD_PRIORITY}
              />
            </motion.div>
          </>
        )}

        {view === "analytics" && players.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <MatchupPanel
                attackers={attackers}
                defenders={defenders}
                result={result}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <AnalyticsPanel players={players} />
            </motion.div>
          </>
        )}

        {view === "player" && selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <PlayerProfilePage
              player={selectedPlayer}
              currentWar={selectedCSV}
              allWars={csvFiles}
              allPlayersByWar={allPlayersByWar}
              onBack={() => setView("dashboard")}
              onSelectWar={async (war) => {
                // FIX: do NOT try to update selectedPlayer here (stale players)
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
