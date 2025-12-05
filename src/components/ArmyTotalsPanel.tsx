import React from "react";

interface Player {
  Kills: number;
  Deaths: number;
  Assists: number;
  Damage: number;
  Healing: number;
  KP: number;
}

interface ArmyTotalsPanelProps {
  players: Player[];
}

export default function ArmyTotalsPanel({ players }: ArmyTotalsPanelProps) {
  if (!players || players.length === 0) return null;

  const totalKills = players.reduce((a, p) => a + p.Kills, 0);
  const totalDeaths = players.reduce((a, p) => a + p.Deaths, 0);
  const totalDamage = players.reduce((a, p) => a + p.Damage, 0);
  const totalHealing = players.reduce((a, p) => a + p.Healing, 0);
  const avgKP = players.reduce((a, p) => a + p.KP, 0) / players.length;
  const kdr = totalKills / Math.max(1, totalDeaths);

  return (
    <section className="nw-panel p-4 mb-4 space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 text-center text-sm text-nw-parchment-soft/90 divide-x divide-nw-gold/20">
        <div className="px-2">
          <div className="uppercase text-[28px] text-nw-parchment-soft/60">
            Kills
          </div>
          <div className="text-nw-gold-soft font-semibold text-lg">
            {totalKills}
          </div>
        </div>

        <div className="px-2">
          <div className="uppercase text-[28px] text-nw-parchment-soft/60">
            Deaths
          </div>
          <div className="text-nw-gold-soft font-semibold text-lg">
            {totalDeaths}
          </div>
        </div>

        <div className="px-2">
          <div className="uppercase text-[28px] text-nw-parchment-soft/60">
            KDR
          </div>
          <div className="text-nw-gold-soft font-semibold text-lg">
            {kdr.toFixed(2)}
          </div>
        </div>

        <div className="px-2">
          <div className="uppercase text-[28px] text-nw-parchment-soft/60">
            Avg KP
          </div>
          <div className="text-nw-gold-soft font-semibold text-lg">
            {avgKP.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="border-t border-nw-gold/20"></div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 text-center text-sm text-nw-parchment-soft/90 divide-x divide-nw-gold/20">
        <div className="px-2">
          <div className="uppercase text-[28px] text-nw-parchment-soft/60">
            Damage
          </div>
          <div className="text-nw-gold-soft font-semibold text-lg">
            {totalDamage.toLocaleString()}
          </div>
        </div>

        <div className="px-2">
          <div className="uppercase text-[28px] text-nw-parchment-soft/60">
            Healing
          </div>
          <div className="text-nw-gold-soft font-semibold text-lg">
            {totalHealing.toLocaleString()}
          </div>
        </div>
      </div>
    </section>
  );
}
