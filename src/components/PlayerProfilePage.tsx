import React, { useMemo } from "react";
import { EnhancedPlayer } from "../../utils/csvParser";

interface Props {
  player: EnhancedPlayer;
  currentWar: string;
  allWars: string[];
  allPlayersByWar: Record<string, EnhancedPlayer[]>;
  onSelectWar: (war: string) => void;
  onBack: () => void;
}

export default function PlayerProfilePage({
  player,
  currentWar,
  allWars,
  allPlayersByWar,
  onSelectWar,
  onBack
}: Props) {

  // ======================================================
  //  SAFELY BUILD LIFETIME (ALL-WAR) STATS
  // ======================================================
const lifetime = useMemo(() => {
  if (!allPlayersByWar || Object.keys(allPlayersByWar).length === 0) return null;

  // flatten all wars into 1 big list
  const all = Object.values(allPlayersByWar).flat();

  // filter for this player
  const matches = all.filter(
    (p) => p.Player.trim().toLowerCase() === player.Player.toLowerCase()
  );

  if (matches.length === 0) return null;

  const total = (key: keyof EnhancedPlayer) =>
    matches.reduce((a, b) => a + (b[key] as number), 0);

  return {
    wars: matches.length,
    kills: total("Kills"),
    deaths: total("Deaths"),
    assists: total("Assists"),
    damage: total("Damage"),
    healing: total("Healing"),
    kp: matches.reduce((a, b) => a + b.KP, 0) / matches.length,
  };
}, [allPlayersByWar, player.Player]);

  // ======================================================
  //  GUI
  // ======================================================
  return (
    <section className="nw-panel p-6 space-y-8">

      {/* Back button */}
      <button
        onClick={onBack}
        className="px-4 py-2 bg-nw-gold-soft/20 border border-nw-gold-soft 
                   rounded text-nw-gold-soft hover:bg-nw-gold-soft/30">
        ← Back
      </button>

      {/* Player Name */}
      <h2 className="nw-title text-nw-gold-soft text-3xl">
        {player.Player}
      </h2>

      {/* ======================================================
           LIFETIME / ALL WAR AVERAGE SECTION
      ====================================================== */}
      {lifetime ? (
        <div className="space-y-3">
          <h3 className="text-xl text-nw-gold-soft">Lifetime (All Wars)</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Stat label="Wars Played" value={lifetime.wars} />
            <Stat label="Avg Kills" value={(lifetime.kills / lifetime.wars).toFixed(1)} />
            <Stat label="Avg Assists" value={(lifetime.assists / lifetime.wars).toFixed(1)} />
            <Stat label="Avg Damage" value={Math.round(lifetime.damage / lifetime.wars).toLocaleString()} />
            <Stat label="Avg Healing" value={Math.round(lifetime.healing / lifetime.wars).toLocaleString()} />
            <Stat label="Avg KP%" value={lifetime.kp.toFixed(1) + "%"} />
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

          {allWars.map((w) => (
            <option key={w} value={w}>
              {w.replace(".csv", "").replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* ======================================================
           CURRENT WAR SECTION
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

// Reusable stat card
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 bg-black/20 rounded text-center">
      <p className="text-nw-parchment-soft text-sm">{label}</p>
      <p className="text-xl">{value}</p>
    </div>
  );
}
