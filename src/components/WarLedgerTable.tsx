import React from "react";
import { motion } from "framer-motion";
import { EnhancedPlayer } from "../utils/csvParser";

interface WarLedgerTableProps {
  players: EnhancedPlayer[];
  buildColors: Record<string, string>;
  onPlayerClick: (player: EnhancedPlayer) => void;
}

export default function WarLedgerTable({
  players,
  buildColors,
  onPlayerClick,
}: WarLedgerTableProps) {
  if (!players || players.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="nw-panel p-4"
    >
      <h2 className="nw-title text-nw-gold-soft text-lg mb-3">Ranking</h2>

      {/* ============================================================
          📱 MOBILE CARDS (visible < md)
      ============================================================ */}
      <div className="md:hidden space-y-3">
        {players.map((p) => (
          <div
            key={p.Player}
            onClick={() => onPlayerClick(p)}
            className="p-3 rounded-lg bg-black/30 border border-nw-gold-soft/20 cursor-pointer hover:bg-black/40 transition"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-nw-gold-soft font-semibold">{p.Player}</p>
                <p className="text-xs text-nw-parchment-soft/70">
                  Build: {p.buildType} • Group {p.Group}
                </p>
              </div>

              <div
                className="px-2 py-0.5 rounded-full text-[11px] uppercase border h-fit"
                style={{
                  backgroundColor: buildColors[p.buildType] + "26",
                  color: buildColors[p.buildType],
                  borderColor: buildColors[p.buildType] + "66",
                }}
              >
                {p.buildType}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm mt-2">
              <Stat label="Kills" value={p.Kills} />
              <Stat label="Deaths" value={p.Deaths} />
              <Stat label="Assists" value={p.Assists} />
              <Stat label="Damage" value={p.Damage.toLocaleString()} />
              <Stat label="Healing" value={p.Healing.toLocaleString()} />
              <Stat label="KP%" value={p.KP.toFixed(1) + "%"} />
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================
          🖥️ DESKTOP TABLE  (visible ≥ md)
      ============================================================ */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="min-w-full text-sm border-collapse">
          <thead className="nw-sticky-header text-left text-nw-gold-soft text-xs md:text-sm">
            <tr>
              <th className="py-2 pr-3">Rank</th>
              <th className="py-2 pr-3">Player</th>
              <th className="py-2 pr-3">Build</th>
              <th className="py-2 pr-3">Group</th>
              <th className="py-2 pr-3">Kills</th>
              <th className="py-2 pr-3">Deaths</th>
              <th className="py-2 pr-3">Assists</th>
              <th className="py-2 pr-3">Damage</th>
              <th className="py-2 pr-3">Healing</th>
              <th className="py-2 pr-3">KP%</th>
            </tr>
          </thead>

          <tbody>
            {players.map((p, i) => (
              <tr
                key={i}
                className="border-t border-nw-gold/10 hover:bg-white/5 cursor-pointer"
                onClick={() => onPlayerClick(p)}
              >
                <td className="px-3 py-2">{p.Rank}</td>
                <td className="px-3 py-2">{p.Player}</td>

                <td className="px-3 py-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] uppercase border"
                    style={{
                      backgroundColor: buildColors[p.buildType] + "26",
                      color: buildColors[p.buildType],
                      borderColor: buildColors[p.buildType] + "66",
                    }}
                  >
                    {p.buildType}
                  </span>
                </td>

                <td className="px-3 py-2">{p.Group}</td>
                <td className="px-3 py-2">{p.Kills}</td>
                <td className="px-3 py-2">{p.Deaths}</td>
                <td className="px-3 py-2">{p.Assists}</td>
                <td className="px-3 py-2">{p.Damage.toLocaleString()}</td>
                <td className="px-3 py-2">{p.Healing.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  {p.KP.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

/* ============================================================
    Small stat component for mobile card layout
============================================================ */
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-black/20 p-2 rounded text-center">
      <p className="text-xs text-nw-parchment-soft/70">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
