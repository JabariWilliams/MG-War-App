import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Player {
  Player: string;
  KD: string;
}

interface Props {
  players: Player[];
}

export default function KDTrendChart({ players }: Props) {
  const data = [...players]
    .map((p) => ({ Player: p.Player, KD: parseFloat(p.KD) }))
    .sort((a, b) => b.KD - a.KD);

  return (
    <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">
      <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
        K/D Curve
      </h2>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4a473d" />

            <XAxis
              dataKey="Player"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={90}
              tick={{ fontSize: 10, fill: "#f8f3e6" }}
            />

            <YAxis tick={{ fill: "#f8f3e6" }} domain={[0, "dataMax + 1"]} />

            <Tooltip
              formatter={(v: any) => v.toFixed(2)}
              contentStyle={{
                background: "#1d1b16",
                border: "1px solid #c6a675",
                borderRadius: "0.5rem",
                color: "#f8f3e6",
              }}
              labelStyle={{ color: "#f8f3e6" }}
            />

            <Line
              type="monotone"
              dataKey="KD"
              stroke="#d7b56d"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "#f6d190",
                stroke: "#3a2a14",
                strokeWidth: 1,
              }}
              activeDot={{ r: 6, fill: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
