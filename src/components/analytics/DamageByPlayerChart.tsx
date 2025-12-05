import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface Player {
  Player: string;
  Damage: number;
  buildType: string;
}

interface Props {
  players: Player[];
}

export default function DamageByPlayerChart({ players }: Props) {
  const data = [...players]
    .filter((p) => p.buildType !== "HEALS")
    .sort((a, b) => b.Damage - a.Damage);

  return (
    <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">
      <header className="flex items-baseline justify-between mb-2">
        <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft">
          DAMAGE BY PLAYER
        </h2>
        <p className="text-[11px] text-nw-parchment-soft/85">
          Sorted highest to lowest. Healers removed.
        </p>
      </header>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
          >
            <defs>
              <linearGradient id="damageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f6d190" />
                <stop offset="60%" stopColor="#d79a32" />
                <stop offset="100%" stopColor="#8a5a18" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="Player"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={90}
              tick={{ fontSize: 10, fill: "#f8f3e6" }}
            />
            <YAxis
              tickFormatter={(v) => v.toLocaleString()}
              tick={{ fontSize: 11, fill: "#f8f3e6" }}
            />
            <Tooltip
              formatter={(v: any) => v.toLocaleString()}
              contentStyle={{
                background: "#1d1b16",
                border: "1px solid #c6a675",
                borderRadius: "0.5rem",
                color: "#f8f3e6",
              }}
              labelStyle={{ color: "#f8f3e6" }}
            />
            <Bar
              dataKey="Damage"
              fill="url(#damageGrad)"
              stroke="#3a2a14"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
