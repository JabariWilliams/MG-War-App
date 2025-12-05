import React from "react";

interface Player {
  Rank: number;
  Group: number;
  Player: string;
  buildType: string;
  Kills: number;
  Deaths: number;
  Assists: number;
  Healing: number;
  Damage: number;
  KD: string;
  KP: number;
}

interface WarLedgerTableProps {
  players: Player[];
  buildColors: Record<string, string>;
}

export default function WarLedgerTable({ players, buildColors }: WarLedgerTableProps) {
  if (!players || players.length === 0) return null;

  return (
    <section className="nw-panel p-4">
      <h2 className="nw-title text-nw-gold-soft text-lg mb-3">Ranking</h2>

      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black/40">
            <tr>
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-left">Group</th>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-left">Build</th>
              <th className="px-3 py-2 text-left">Kills</th>
              <th className="px-3 py-2 text-left">Deaths</th>
              <th className="px-3 py-2 text-left">Assists</th>
              <th className="px-3 py-2 text-left">Healing</th>
              <th className="px-3 py-2 text-left">Damage</th>
              <th className="px-3 py-2 text-right">K/D</th>
              <th className="px-3 py-2 text-right">KP%</th>
            </tr>
          </thead>

          <tbody>
            {players.map((p, i) => (
              <tr
                key={i}
                className="border-t border-nw-gold/10 hover:bg-white/5"
              >
                <td className="px-3 py-2">{p.Rank}</td>
                <td className="px-3 py-2">{p.Group}</td>
                <td className="px-3 py-2 whitespace-nowrap">{p.Player}</td>
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
                <td className="px-3 py-2">{p.Kills}</td>
                <td className="px-3 py-2">{p.Deaths}</td>
                <td className="px-3 py-2">{p.Assists}</td>
                <td className="px-3 py-2">{p.Healing.toLocaleString()}</td>
                <td className="px-3 py-2">{p.Damage.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{p.KD}</td>
                <td className="px-3 py-2 text-right">{p.KP.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
