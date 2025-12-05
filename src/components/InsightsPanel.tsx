import React from "react";

interface Player {
  Player: string;
  Damage: number;
  Healing: number;
  Assists: number;
  Kills: number;
  Deaths: number;
  KD: string;
  buildType: string;
}

interface InsightsPanelProps {
  players: Player[];
  buildColors: Record<string, string>;
}

export default function InsightsPanel({ players, buildColors }: InsightsPanelProps) {
  if (!players || players.length === 0) return null;

  const insightConfigs: [string, keyof Player | "KD"][] = [
    ["Top DPS", "Damage"],
    ["Top Healer", "Healing"],
    ["Top Assists", "Assists"],
    ["Best K/D", "KD"],
  ];

  const getTopPlayer = (stat: keyof Player | "KD") => {
    const sorted = [...players].sort((a, b) => {
      if (stat === "KD") {
        return parseFloat(b.KD) - parseFloat(a.KD);
      }
      return (b as any)[stat] - (a as any)[stat];
    });

    return sorted[0];
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {insightConfigs.map(([title, stat]) => {
        const p = getTopPlayer(stat);
        if (!p) return null;

        const value =
          stat === "KD"
            ? p.KD
            : (p as any)[stat]?.toLocaleString?.() ?? (p as any)[stat];

        return (
          <article key={title} className="nw-panel p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs text-nw-gold-soft uppercase tracking-widest">
                  {title}
                </h2>
                <p className="text-lg font-semibold">{p.Player}</p>
                <p className="text-[17px] text-nw-parchment-soft/85">
                  {stat}: {value}
                </p>
              </div>

              {/* Build badge */}
              <span
                className="px-2 py-0.5 rounded-full text-[15px] uppercase border"
                style={{
                  backgroundColor: buildColors[p.buildType] + "26",
                  color: buildColors[p.buildType],
                  borderColor: buildColors[p.buildType] + "66",
                }}
              >
                {p.buildType}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
