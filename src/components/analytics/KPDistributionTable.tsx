import React from "react";

interface Player {
  Player: string;
  KP: number;
}

interface Props {
  players: Player[];
}

export default function KPDistributionTable({ players }: Props) {
  const sorted = [...players].sort((a, b) => b.KP - a.KP);

  const max = sorted[0]?.KP ?? 1;
  const min = sorted[sorted.length - 1]?.KP ?? 0;

  return (
    <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">
      <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
        KP% Distribution
      </h2>

      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black/40">
            <tr>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-left">KP%</th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((row, i) => {
              const pct = (row.KP - min) / Math.max(1, max - min);
              const bg = `hsl(${pct * 180}, 40%, ${20 + pct * 20}%)`;

              return (
                <tr key={i} className="border-t border-nw-gold/10" style={{ backgroundColor: bg }}>
                  <td className="px-3 py-2">{row.Player}</td>
                  <td className="px-3 py-2 font-semibold">
                    {row.KP.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
