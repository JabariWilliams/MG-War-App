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

    // ----------------------------------------------------
    // VALID WARS (Any non-empty array)
    // ----------------------------------------------------
    const validWars = warKeys.filter((w) => Array.isArray(allPlayersByWar[w]));
    if (validWars.length === 0) return null;

    // ----------------------------------------------------
    // REAL WAR COUNT (all CSV wars)
    // ----------------------------------------------------
    const realWarCount = validWars.length;

    // ----------------------------------------------------
    // WIN / LOSS — ALL WARS INCLUDED
    // ----------------------------------------------------
    let winsReal = 0;
    let lossesReal = 0;

    for (const war of validWars) {
      const entries = allPlayersByWar[war];
      if (!entries || entries.length === 0) continue;

      const result =
        (entries[0].Result || entries[0].result || "")
          .toString()
          .trim()
          .toLowerCase();

      if (result.includes("win")) winsReal++;
      else if (result.includes("loss")) lossesReal++;
    }

    // ----------------------------------------------------
    // LEGACY STATIC VALUES
    // ----------------------------------------------------
    const legacyWins = 1;
    const legacyLosses = 3;
    const legacyWars = 4;

    const totalWins = winsReal + legacyWins;
    const totalLosses = lossesReal + legacyLosses;
    const warsCounted = realWarCount + legacyWars;

    // ----------------------------------------------------------
    // FULL WARS FOR AVERAGES ONLY
    // A war counts as FULL ONLY IF EVERY row has Full === "yes"
    // ----------------------------------------------------------
    const fullWarKeys = validWars.filter((war) => {
      const rows = allPlayersByWar[war];
      return rows.length > 0 && rows.every((p) => p.Full === "yes");
    });

    if (fullWarKeys.length === 0) {
      return {
        wars: warsCounted,
        wins: totalWins,
        losses: totalLosses,
        avgKills: 0,
        avgDeaths: 0,
        avgDamage: 0,
        avgHealing: 0,
        avgKP: 0,
      };
    }

    // Flatten only FULL=yes wars
    const fullRows = fullWarKeys.flatMap((w) => allPlayersByWar[w]);

    // ----------------------------------------------------
    // TOTALS FOR FULL WARS ONLY (NOT ALL WARS)
    // ----------------------------------------------------
    const totalKills = fullRows.reduce((a, p) => a + (p.Kills || 0), 0);
    const totalDeaths = fullRows.reduce((a, p) => a + (p.Deaths || 0), 0);
    const totalDamage = fullRows.reduce((a, p) => a + (p.Damage || 0), 0);
    const totalHealing = fullRows.reduce((a, p) => a + (p.Healing || 0), 0);
    const totalKP = fullRows.reduce((a, p) => a + (p.KP || 0), 0);

    // ----------------------------------------------------
    // AVERAGES DIVIDE BY FULL WAR COUNT ONLY
    // ----------------------------------------------------
    const fullWarCount = fullWarKeys.length;

    const avgKills = totalKills / fullWarCount;
    const avgDeaths = totalDeaths / fullWarCount;
    const avgDamage = totalDamage / fullWarCount;
    const avgHealing = totalHealing / fullWarCount;
    const avgKP = totalKP / fullRows.length;

    return {
      wars: warsCounted,
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

      {/* COMPANY STATS */}
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
	  <div className="flex justify-end pr-2">
  <p className="text-xs text-nw-parchment-soft opacity-60 italic">
    * Legacy stats and Wars under the cutoff time are excluded from averages due to compatibility
  </p>
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
