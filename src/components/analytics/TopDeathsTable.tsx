import React from "react";

interface Player {
  Player: string;
  Deaths: number;
}

interface Props {
  players: Player[];
}

export default function TopDeathsTable({ players }: Props) {
  const rows = [...players]
    .map((p) => ({ Player: p.Player, Deaths: p.Deaths }))
    .sort((a, b) => b.Deaths - a.Deaths)
    .slice(0, 15);

  const max = rows[0]?.Deaths ?? 1;

  return (
    <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw mb-10">
      <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
        Top 15 Deaths
      </h2>

      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black/40">
            <tr>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-left">Deaths</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const pct = row.Deaths / max;
              const bg = `hsl(${(1 - pct) * 195}, 45%, ${
                29 + (1 - pct) * 15
              }%)`;

              return (
                <tr key={i} className="border-t border-nw-gold/10" style={{ backgroundColor: bg }}>
                  <td className="px-3 py-2 font-medium">{row.Player}</td>
                  <td className="px-3 py-2 font-semibold">{row.Deaths}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
