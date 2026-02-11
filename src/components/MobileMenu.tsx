import React, { useMemo } from "react";
import { motion } from "framer-motion";
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

    const realWarCount = validWars.length;

    // -----------------------------
    // WIN / LOSS ACROSS ALL WARS
    // -----------------------------
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

    // -----------------------------
    // LEGACY STATIC VALUES
    // -----------------------------
    const legacyWins = 1;
    const legacyLosses = 3;
    const legacyWars = 4;

    const totalWins = winsReal + legacyWins;
    const totalLosses = lossesReal + legacyLosses;
    const warsCounted = realWarCount + legacyWars;

    // -----------------------------
    // FULL WARS ONLY FOR AVERAGES
    // -----------------------------
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

    const fullRows = fullWarKeys.flatMap((w) => allPlayersByWar[w]);

    const totalKills = fullRows.reduce((a, p) => a + (p.Kills || 0), 0);
    const totalDeaths = fullRows.reduce((a, p) => a + (p.Deaths || 0), 0);
    const totalDamage = fullRows.reduce((a, p) => a + (p.Damage || 0), 0);
    const totalHealing = fullRows.reduce((a, p) => a + (p.Healing || 0), 0);
    const totalKP = fullRows.reduce((a, p) => a + (p.KP || 0), 0);

    const avgKills = totalKills / fullWarKeys.length;
    const avgDeaths = totalDeaths / fullWarKeys.length;
    const avgDamage = totalDamage / fullWarKeys.length;
    const avgHealing = totalHealing / fullWarKeys.length;
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
    <section className="nw-panel p-6 space-y-10 w-full">

      {/* ======================================================
            ANIMATED LOGO + TITLES
      ====================================================== */}
      <div className="flex flex-col items-center justify-center">

        <motion.img
          src="/assets/mercguards-logo.png"
          alt="Mercguards Crest"
          className="w-24 h-24 md:w-32 md:h-32 object-cover drop-shadow-[0_0_12px_rgba(255,215,128,0.35)]"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        <motion.h1
          className="nw-title text-nw-gold-soft text-4xl mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        >
          MERCGUARDS
        </motion.h1>

        <motion.h2
          className="nw-title text-nw-gold-soft text-xl opacity-90 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
        >
          New World Season 10 Company Overview
        </motion.h2>
      </div>

      {/* ======================================================
            COMPANY LIFETIME STATS
      ====================================================== */}
      <div className="w-full flex justify-center flex-nowrap gap-4 md:gap-6 overflow-x-auto pb-3 px-1 md:px-4">

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

      {/* ======================================================
            FOOTNOTE
      ====================================================== */}
      <div className="flex justify-end pr-2">
        <p className="text-xs text-nw-parchment-soft opacity-60 italic">
          * Legacy stats and short wars are excluded from averages for consistency.
        </p>
      </div>

    </section>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 bg-black/20 rounded text-center min-w-[110px]">
      <p className="text-nw-parchment-soft text-sm whitespace-nowrap">{label}</p>
      <p className="text-xl">{value}</p>
    </div>
  );
}