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

      <div className="overflow-x-auto w-full">
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
