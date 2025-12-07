import React, { useMemo } from "react";
import { EnhancedPlayer } from "../../utils/csvParser";

interface Props {
  player: EnhancedPlayer;
  currentWar: string;
  allWars: string[];
  allPlayersByWar: Record<string, EnhancedPlayer[]>;
  fullWarsByWar: Record<string, EnhancedPlayer[]>;
  onSelectWar: (war: string) => void;
  onBack: () => void;
}

export default function PlayerProfilePage({
  player,
  currentWar,
  allWars,
  allPlayersByWar,
  fullWarsByWar,
  onSelectWar,
  onBack,
}: Props) {

  // ======================================================
  // A) WARS PLAYER WAS IN — ALL wars (Full yes/no irrelevant)
  // ======================================================
  const warsPlayerWasIn = useMemo(() => {
    return Object.keys(allPlayersByWar).filter((war) => {
      const list = allPlayersByWar[war];
      if (!list) return false;

      return list.some(
        (p) =>
          p.Player.trim().toLowerCase() ===
          player.Player.trim().toLowerCase()
      );
    });
  }, [allPlayersByWar, player.Player]);

  // ======================================================
  // B) LIFETIME AVERAGES — ONLY Full="yes" wars
  // ======================================================
  const lifetime = useMemo(() => {
    // find wars the player was in & also Full=yes
    const fullWarsPlayerWasIn = Object.keys(fullWarsByWar).filter((war) => {
      const list = fullWarsByWar[war];
      return list.some(
        (p) =>
          p.Player.trim().toLowerCase() ===
          player.Player.trim().toLowerCase()
      );
    });

    const relevant = fullWarsPlayerWasIn
      .map((w) => fullWarsByWar[w])
      .flat();

    const matches = relevant.filter(
      (p) =>
        p.Player.trim().toLowerCase() ===
        player.Player.trim().toLowerCase()
    );

    if (matches.length === 0) return null;

    const total = (key: keyof EnhancedPlayer) =>
      matches.reduce((a, b) => a + (b[key] as number), 0);

    return {
      warsPlayed: warsPlayerWasIn.length,   // ALL wars
      avgKills: total("Kills") / fullWarsPlayerWasIn.length,
      avgDeaths: total("Deaths") / fullWarsPlayerWasIn.length,
      avgAssists: total("Assists") / fullWarsPlayerWasIn.length,
      avgDamage: total("Damage") / fullWarsPlayerWasIn.length,
      avgHealing: total("Healing") / fullWarsPlayerWasIn.length,
      avgKP:
        matches.reduce((a, b) => a + b.KP, 0) / matches.length,
    };
  }, [allPlayersByWar, fullWarsByWar, player.Player, warsPlayerWasIn.length]);

  // ======================================================
  // UI
  // ======================================================
  return (
    <section className="nw-panel p-6 space-y-8">
      <button
        onClick={onBack}
        className="px-4 py-2 bg-nw-gold-soft/20 border border-nw-gold-soft 
                 rounded text-nw-gold-soft hover:bg-nw-gold-soft/30"
      >
        ← Back
      </button>

      <h2 className="nw-title text-nw-gold-soft text-3xl">{player.Player}</h2>

      {/* ======================================================
          LIFETIME (Corrected)
      ====================================================== */}
      {lifetime ? (
        <div className="space-y-3">
          <h3 className="text-xl text-nw-gold-soft">Lifetime (All Wars)</h3>

          <div className="w-full flex flex-nowrap justify-center gap-6 overflow-x-auto pb-2">
            <Stat label="Wars Played" value={lifetime.warsPlayed} />
            <Stat label="Avg Kills" value={lifetime.avgKills.toFixed(1)} />
            <Stat label="Avg Deaths" value={lifetime.avgDeaths.toFixed(1)} />
            <Stat label="Avg Assists" value={lifetime.avgAssists.toFixed(1)} />
            <Stat
              label="Avg Damage"
              value={Math.round(lifetime.avgDamage).toLocaleString()}
            />
            <Stat
              label="Avg Healing"
              value={Math.round(lifetime.avgHealing).toLocaleString()}
            />
            <Stat label="Avg KP%" value={lifetime.avgKP.toFixed(1) + "%"} />
          </div>
        </div>
      ) : (
        <p className="text-nw-parchment-soft opacity-70">
          Loading lifetime stats…
        </p>
      )}

      {/* ======================================================
          WAR SWITCHER
      ====================================================== */}
      <div className="space-y-3 mt-6">
        <label className="text-sm text-nw-parchment-soft block mb-1">
          View this player in another war:
        </label>

        <select
          value={currentWar}
          onChange={(e) => onSelectWar(e.target.value)}
          className="px-3 py-2 bg-[#1a1815] border border-nw-gold-soft/40 rounded text-nw-parchment-soft"
        >
          {warsPlayerWasIn.map((w) => (
            <option key={w} value={w}>
              {w.replace(".csv", "").replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* ======================================================
          THIS WAR
      ====================================================== */}
      <div className="space-y-3">
        <h3 className="text-xl text-nw-gold-soft">This War</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Stat label="Kills" value={player.Kills} />
          <Stat label="Deaths" value={player.Deaths} />
          <Stat label="Assists" value={player.Assists} />
          <Stat label="Damage" value={player.Damage.toLocaleString()} />
          <Stat label="Healing" value={player.Healing.toLocaleString()} />
          <Stat label="KP%" value={player.KP.toFixed(1) + "%"} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 bg-black/20 rounded text-center min-w-[120px]">
      <p className="text-nw-parchment-soft text-sm">{label}</p>
      <p className="text-xl">{value}</p>
    </div>
  );
}
