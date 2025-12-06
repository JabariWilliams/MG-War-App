import React from "react";
import { EnhancedPlayer } from "../../utils/csvParser";

interface Props {
  players: EnhancedPlayer[];
}

// NOTE: We keep the name TopDPSChart exactly as-is.
// Internally it now functions as a Top 15 Kills panel.
export default function TopDPSChart({ players }: Props) {
  // Clean + sort
  const sorted = players
    .filter((p) => p.Player && !isNaN(p.Kills))
    .sort((a, b) => b.Kills - a.Kills)
    .slice(0, 15); // exactly 15 rows

  const killValues = sorted.map((p) => p.Kills);
  const min = Math.min(...killValues);
  const max = Math.max(...killValues);

  // Heatmap: high kills = dark rich green, low kills = muted red
const heat = (value: number) => {
  if (min === max) return "hsl(110, 40%, 28%)"; // fallback muted green

  const pct = (value - min) / (max - min); // 0 = low, 1 = high

  // flip direction — low kills = red, high kills = green
  const hue = pct * 110; // 0 = red, 110 = green

  return `hsl(${hue}, 40%, ${22 + pct * 15}%)`; 
};


  return (
    <section className="nw-panel p-5 rounded-xl shadow-nw h-full">
      <h2 className="nw-title text-nw-gold-soft text-lg mb-4">
        Top 15 Kills
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          
          <thead className="bg-black/40 border-b border-nw-gold/20">
            <tr>
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-left">Build</th>
              <th className="px-3 py-2 text-left">Kills</th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((p, i) => {
              const color = heat(p.Kills);

              return (
                <tr
                  key={i}
                  className="border-b border-nw-gold/10 last:border-b-0"
                  style={{ backgroundColor: color }} // full-row heatmap
                >
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{p.Player}</td>
                  <td className="px-3 py-2">{p.Build}</td>
                  <td className="px-3 py-2 font-semibold">{p.Kills}</td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </section>
  );
}
