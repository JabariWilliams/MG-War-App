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

    // COUNT REAL (CSV) WARS
    const realWarCount = validWars.length;

    // ----------------------------------------------------
    // WIN / LOSS DETECTION (ONLY REAL WARS)
    // ----------------------------------------------------
    let winsReal = 0;
    let lossesReal = 0;

    for (const war of validWars) {
      const entries = allPlayersByWar[war];
      if (!entries || entries.length === 0) continue;

      const row = entries[0];
      const result =
        (row.Result || row.result || "").toString().trim().toLowerCase();

      if (result.includes("win")) winsReal++;
      else if (result.includes("loss")) lossesReal++;
    }

    // ----------------------------------------------------
    // LEGACY VALUES
    // ----------------------------------------------------
    const legacyWins = 1;
    const legacyLosses = 3;
    const legacyWars = 4; // 1 win + 3 losses

    // FINAL WIN / LOSS / WAR COUNT
    const totalWins = winsReal + legacyWins;
    const totalLosses = lossesReal + legacyLosses;
    const warsCounted = realWarCount + legacyWars;

    // ----------------------------------------------------
    // SUM TOTALS (REAL DATA ONLY)
    // ----------------------------------------------------
    const totalKills = all.reduce((a, p) => a + (p.Kills || 0), 0);
    const totalDeaths = all.reduce((a, p) => a + (p.Deaths || 0), 0);
    const totalDamage = all.reduce((a, p) => a + (p.Damage || 0), 0);
    const totalHealing = all.reduce((a, p) => a + (p.Healing || 0), 0);

    // ----------------------------------------------------
    // AVERAGES = REAL WARS ONLY ❗
    // (NOT INCLUDING LEGACY)
    // ----------------------------------------------------
    const avgKills = totalKills / realWarCount;
    const avgDeaths = totalDeaths / realWarCount;
    const avgDamage = totalDamage / realWarCount;
    const avgHealing = totalHealing / realWarCount;

    const avgKP = all.reduce((a, p) => a + (p.KP || 0), 0) / all.length;

    return {
      wars: warsCounted, // includes legacy
      wins: totalWins,
      losses: totalLosses,

      avgKills,
      avgDeaths,
      avgDamage,
      avgHealing,
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
        <h1 className="nw-title text-nw-gold-soft text-4xl">MERCGUARDS</h1>
        <h2 className="nw-title text-nw-gold-soft text-xl opacity-90">
          New World Season 10 Company Overview
        </h2>
      </div>

      {/* LIFETIME COMPANY STATS */}
      <div className="w-full flex justify-center flex-nowrap gap-6 overflow-x-auto pb-3">

        <Stat label="Wars Counted" value={summary.wars} />
        <Stat label="Wins" value={summary.wins} />
        <Stat label="Losses" value={summary.losses} />

        <Stat label="Avg Kills / War" value={summary.avgKills.toFixed(1)} />
        <Stat label="Avg Deaths / War" value={summary.avgDeaths.toFixed(1)} />
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