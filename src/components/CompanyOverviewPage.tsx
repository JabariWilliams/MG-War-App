import React, { useMemo } from "react";
import { EnhancedPlayer } from "../utils/csvParser";

interface Props {
  allPlayersByWar: Record<string, EnhancedPlayer[]>;
}

export default function CompanyOverviewPage({ allPlayersByWar }: Props) {
  const summary = useMemo(() => {
    if (!allPlayersByWar) return null;

    const warKeys = Object.keys(allPlayersByWar);
    if (warKeys.length === 0) return null;

    const validWars = warKeys.filter((w) => Array.isArray(allPlayersByWar[w]));
    if (validWars.length === 0) return null;

    const all = validWars.flatMap((w) => allPlayersByWar[w] || []);
    if (all.length === 0) return null;

    // Summed totals
    const totalKills = all.reduce((a, p) => a + (p.Kills || 0), 0);
    const totalDeaths = all.reduce((a, p) => a + (p.Deaths || 0), 0);
    const totalAssists = all.reduce((a, p) => a + (p.Assists || 0), 0);
    const totalDamage = all.reduce((a, p) => a + (p.Damage || 0), 0);
    const totalHealing = all.reduce((a, p) => a + (p.Healing || 0), 0);
    const avgKP = all.reduce((a, p) => a + (p.KP || 0), 0) / all.length;

    return {
      wars: validWars.length,
      avgKills: totalKills / validWars.length,
      avgDeaths: totalDeaths / validWars.length,
      avgAssists: totalAssists / validWars.length,
      avgDamage: totalDamage / validWars.length,
      avgHealing: totalHealing / validWars.length,
      avgKP,
    };
  }, [allPlayersByWar]);

  if (!summary) {
    return (
      <div className="nw-panel p-6">
        <p className="opacity-70">No war data available.</p>
      </div>
    );
  }

  return (
    <section className="nw-panel p-6 space-y-8">

      {/* LOGO */}
      <div className="flex justify-center mb-2">
        <img
          src="/assets/mercguards-logo.png"
          alt="Mercguards Crest"
          className="w-24 h-24 md:w-32 md:h-32 object-cover"
        />
      </div>

      {/* HEADERS */}
      <div className="text-center space-y-1">
        <h1 className="nw-title text-nw-gold-soft text-4xl">
          MERCGUARDS
        </h1>

        <h2 className="nw-title text-nw-gold-soft text-xl opacity-90">
          New World Season 10 Company Overview
        </h2>
      </div>

      {/* LIFETIME COMPANY STATS */}
      <div className="w-full flex justify-center flex-nowrap gap-6 overflow-x-auto pb-3">
        <Stat label="Wars Counted" value={summary.wars} />
        <Stat label="Avg Kills / War" value={summary.avgKills.toFixed(1)} />
        <Stat label="Avg Deaths / War" value={summary.avgDeaths.toFixed(1)} />
        <Stat label="Avg Assists / War" value={summary.avgAssists.toFixed(1)} />
        <Stat
          label="Avg Damage"
          value={Math.round(summary.avgDamage).toLocaleString()}
        />
        <Stat
          label="Avg Healing"
          value={Math.round(summary.avgHealing).toLocaleString()}
        />
        <Stat label="Avg KP%" value={summary.avgKP.toFixed(1) + "%"} />
      </div>

    </section>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 bg-black/20 rounded text-center min-w-[110px]">
      <p className="text-nw-parchment-soft text-sm">{label}</p>
      <p className="text-xl">{value}</p>
    </div>
  );
}
