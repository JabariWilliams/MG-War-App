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

  const max = Math.max(...rows.map((r) => r.Deaths));
  const min = Math.min(...rows.map((r) => r.Deaths));

const heat = (value: number) => {
  if (min === max) return "hsl(0, 0%, 20%)";

  const pct = (value - min) / (max - min);
  const inverted = 1 - pct;

  const hue = 95 * inverted;        // match DPS scale, eliminates lime
  const sat = 40;
  const light = 24 + inverted * 16; // same brightness scale

  return `hsl(${hue}, ${sat}%, ${light}%)`;
};



  return (
    <section className="nw-panel p-5 rounded-xl shadow-nw h-full">
      <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
        Top 15 Deaths
      </h2>

      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black/40 border-b border-nw-gold/20">
            <tr>
              <th className="px-3 py-2 text-left ps-4">Player</th>
              <th className="px-3 py-2 text-left">Deaths</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => {
              const color = heat(r.Deaths);

              return (
                <tr
                  key={i}
                  className="border-b border-nw-gold/10 last:border-b-0"
                >
                  <td
                    className="px-3 py-2 ps-4"
                    style={{ backgroundColor: color }}
                  >
                    {r.Player}
                  </td>

                  <td
                    className="px-3 py-2 font-semibold"
                    style={{ backgroundColor: color }}
                  >
                    {r.Deaths}
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
