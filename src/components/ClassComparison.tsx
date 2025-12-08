import React, { useState } from "react";

interface Player {
  Player: string;
  Kills: number;
  Deaths: number;
  Assists: number;
  Healing: number;
  Damage: number;
  KP: number;
  buildType: string;
}

interface ClassComparisonProps {
  players: Player[];
}

export default function ClassComparison({ players }: ClassComparisonProps) {
  const [selectedClass, setSelectedClass] = useState("BRUISER");

  const classOptions = [
    "BRUISER",
    "QDPS",
    "DISRUPTOR",
    "DEX",
    "VGIG",
    "FSX",
    "BBX",
    "CW",
    "HEALS",
    "TANK",
    "FLAIL",
    "UNKNOWN",
  ];

  const primaryStat =
    selectedClass === "HEALS" || selectedClass === "TANK"
      ? "Healing"
      : "Damage";

  const filtered = players
    .filter((p) => p.buildType === selectedClass)
    .sort((a, b) => b[primaryStat] - a[primaryStat]);

  const kills = filtered.map((p) => p.Kills);
  const deaths = filtered.map((p) => p.Deaths);
  const assists = filtered.map((p) => p.Assists);
  const dmg = filtered.map((p) => p.Damage);
  const healing = filtered.map((p) => p.Healing);
  const kp = filtered.map((p) => p.KP);

  const colMinMax = {
    Kills: [Math.min(...kills), Math.max(...kills)],
    Deaths: [Math.min(...deaths), Math.max(...deaths)],
    Assists: [Math.min(...assists), Math.max(...assists)],
    Damage: [Math.min(...dmg), Math.max(...dmg)],
    Healing: [Math.min(...healing), Math.max(...healing)],
    KP: [Math.min(...kp), Math.max(...kp)],
  };

  // ==========================================================
  // NORMAL HEAT SCALE (green = high, red = low)
  // ==========================================================
  const heat = (v: number, [min, max]: [number, number]) => {
    if (min === max) return "hsl(0, 0%, 20%)";
    const pct = (v - min) / (max - min);
    return `hsl(${pct * 120}, 40%, 28%)`; // green → red
  };

  // ==========================================================
  // REVERSED HEAT SCALE FOR DEATHS (green = low, red = high) 🔥 UPDATED
  // ==========================================================
  const heatReversed = (v: number, [min, max]: [number, number]) => {
    if (min === max) return "hsl(0, 0%, 20%)";
    const pct = 1 - (v - min) / (max - min); // reverse pct
    return `hsl(${pct * 120}, 40%, 28%)`; // red → green
  };

  const totals = {
    Kills: kills.reduce((a, b) => a + b, 0),
    Deaths: deaths.reduce((a, b) => a + b, 0),
    Assists: assists.reduce((a, b) => a + b, 0),
    Damage: dmg.reduce((a, b) => a + b, 0),
    Healing: healing.reduce((a, b) => a + b, 0),
    KP: kp.length ? kp.reduce((a, b) => a + b, 0) / kp.length : 0,
  };

  return (
    <section className="nw-panel p-4 mt-8">
      <h2 className="nw-title text-nw-gold-soft text-lg mb-4">
        Class Comparison (Sorted by {primaryStat})
      </h2>

      {/* CLASS DROPDOWN */}
      <div className="mb-4 flex gap-4 items-center">
        <label className="text-sm text-nw-parchment-soft/85">Select Class:</label>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 text-sm rounded border border-nw-gold/60 bg-[#2a2620] text-nw-parchment-soft/90"
        >
          {classOptions.map((cls) => (
            <option
              key={cls}
              value={cls}
              className="bg-[#1a1815] text-nw-parchment-soft"
            >
              {cls}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black/40">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Kills</th>
              <th className="px-3 py-2 text-left">Deaths</th>
              <th className="px-3 py-2 text-left">Assists</th>
              <th className="px-3 py-2 text-left">Damage</th>
              <th className="px-3 py-2 text-left">Healing</th>
              <th className="px-3 py-2 text-left">KP%</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p, i) => (
              <tr key={i} className="border-t border-nw-gold/10">
                <td className="px-3 py-2">{p.Player}</td>

                {/* NORMAL HEAT */}
                <td className="px-3 py-2" style={{ backgroundColor: heat(p.Kills, colMinMax.Kills) }}>
                  {p.Kills}
                </td>

                {/* REVERSED DEATH HEAT 🔥 UPDATED */}
                <td className="px-3 py-2" style={{ backgroundColor: heatReversed(p.Deaths, colMinMax.Deaths) }}>
                  {p.Deaths}
                </td>

                {/* NORMAL HEAT */}
                <td className="px-3 py-2" style={{ backgroundColor: heat(p.Assists, colMinMax.Assists) }}>
                  {p.Assists}
                </td>

                <td className="px-3 py-2" style={{ backgroundColor: heat(p.Damage, colMinMax.Damage) }}>
                  {p.Damage.toLocaleString()}
                </td>

                <td className="px-3 py-2" style={{ backgroundColor: heat(p.Healing, colMinMax.Healing) }}>
                  {p.Healing.toLocaleString()}
                </td>

                <td className="px-3 py-2" style={{ backgroundColor: heat(p.KP, colMinMax.KP) }}>
                  {p.KP.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-nw-gold/20 bg-black/40 font-bold">
              <td className="px-3 py-2">TOTAL</td>
              <td className="px-3 py-2">{totals.Kills}</td>
              <td className="px-3 py-2">{totals.Deaths}</td>
              <td className="px-3 py-2">{totals.Assists}</td>
              <td className="px-3 py-2">{totals.Damage.toLocaleString()}</td>
              <td className="px-3 py-2">{totals.Healing.toLocaleString()}</td>
              <td className="px-3 py-2">{totals.KP.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
