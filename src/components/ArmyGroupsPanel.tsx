import React from "react";

interface Player {
  Player: string;
  Group: number;
  buildType: string;
  Kills: number;
  Deaths: number;
  Damage: number;
  Healing: number;
  KP: number;
}

interface ArmyGroupsPanelProps {
  players: Player[];
  buildColors: Record<string, string>;
  BUILD_PRIORITY: Record<string, number>;
}

export default function ArmyGroupsPanel({
  players,
  buildColors,
  BUILD_PRIORITY,
}: ArmyGroupsPanelProps) {
  if (!players || players.length === 0) return null;

  // ======================
  // SPLIT INTO GROUP LOGIC
  // ======================

  const qdpsPlayers = players.filter((p) => p.buildType === "QDPS");
  const nonQDPS = players.filter((p) => p.buildType !== "QDPS");

  const grouped = Object.values(
    nonQDPS.reduce((acc: any, p) => {
      if (!acc[p.Group]) acc[p.Group] = [];
      acc[p.Group].push(p);
      return acc;
    }, {})
  );

  grouped.forEach((g) =>
    g.sort(
      (a, b) =>
        (BUILD_PRIORITY[a.buildType] || 99) -
        (BUILD_PRIORITY[b.buildType] || 99)
    )
  );

  // ======================
  // QDPS TOTALS
  // ======================
  const qdpsTotals = {
    kills: qdpsPlayers.reduce((a, p) => a + p.Kills, 0),
    deaths: qdpsPlayers.reduce((a, p) => a + p.Deaths, 0),
    damage: qdpsPlayers.reduce((a, p) => a + p.Damage, 0),
    healing: qdpsPlayers.reduce((a, p) => a + p.Healing, 0),
    avgKP:
      qdpsPlayers.reduce((a, p) => a + p.KP, 0) /
      Math.max(1, qdpsPlayers.length),
  };

  return (
    <>
      {/* ================================
          ARMY GROUPS
         ================================= */}
      {grouped.length > 0 && (
        <section className="space-y-5 mb-10">
          <h2 className="nw-title text-nw-gold-soft text-lg">ARMY GROUPS</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
            {grouped.map((g, idx) => {
              const totalKills = g.reduce((a, p) => a + p.Kills, 0);
              const totalDeaths = g.reduce((a, p) => a + p.Deaths, 0);
              const totalDamage = g.reduce((a, p) => a + p.Damage, 0);
              const totalHealing = g.reduce((a, p) => a + p.Healing, 0);
              const avgKP =
                g.reduce((a, p) => a + p.KP, 0) /
                Math.max(1, g.length);

              const groupNum = g[0]?.Group ?? idx + 1;

              return (
                <article
                  key={idx}
                  className="nw-panel p-4 text-xs flex flex-col gap-3"
                >
                  <header className="flex justify-between items-start">
                    <h3 className="font-semibold text-nw-parchment-soft tracking-wide text-lg">
                      Group {groupNum}
                    </h3>

                    <div className="text-right text-[11px] px-3 py-1 rounded-full border border-nw-gold/40 bg-black/30 text-nw-parchment-soft/85 font-semibold">
                      Total K/D:{" "}
                      <span className="text-nw-gold-soft">
                        {totalKills}/{totalDeaths}
                      </span>
                    </div>
                  </header>

                  <div className="grid grid-cols-2 gap-y-1 text-[11px] text-nw-parchment-soft/85">
                    <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                      Total Damage
                    </div>
                    <div className="text-right">
                      {totalDamage.toLocaleString()}
                    </div>

                    <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                      Total Healing
                    </div>
                    <div className="text-right">
                      {totalHealing.toLocaleString()}
                    </div>

                    <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                      Avg KP
                    </div>
                    <div className="text-right">{avgKP.toFixed(1)}%</div>
                  </div>

                  <hr className="border-nw-gold/20 mt-2" />

                  <ul className="space-y-3">
                    {g.map((p) => (
                      <li key={p.Player} className="pb-2">
                        <div className="flex justify-between items-center w-full gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">
                              {p.Player}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] uppercase border flex-shrink-0"
                              style={{
                                backgroundColor:
                                  buildColors[p.buildType] + "26",
                                color: buildColors[p.buildType],
                                borderColor:
                                  buildColors[p.buildType] + "66",
                              }}
                            >
                              {p.buildType}
                            </span>
                          </div>

                          <span className="text-xs text-nw-gold-soft font-semibold flex-shrink-0">
                            {p.Kills}/{p.Deaths}
                          </span>
                        </div>

                        <div className="mt-0.5 grid grid-cols-[1fr_auto_1fr] text-[11px] text-nw-parchment-soft/90">
                          <span>DMG: {p.Damage.toLocaleString()}</span>
                          <span>HEALS: {p.Healing.toLocaleString()}</span>
                          <span className="text-right">
                            KP: {p.KP.toFixed(1)}%
                          </span>
                        </div>

                        <hr className="mt-2 border-nw-gold/10" />
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ================================
          QDPS SQUAD
         ================================= */}
      {qdpsPlayers.length > 0 && (
        <section className="space-y-5 mb-10">
          <h2 className="nw-title text-nw-gold-soft text-lg">QUAD DPS</h2>

          <div className="nw-panel p-4 text-xs flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-y-1 text-[11px] text-nw-parchment-soft/85 mb-3">
              <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                Total K/D
              </div>
              <div className="text-right text-nw-gold-soft">
                {qdpsTotals.kills}/{qdpsTotals.deaths}
              </div>

              <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                Total Damage
              </div>
              <div className="text-right">
                {qdpsTotals.damage.toLocaleString()}
              </div>

              <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                Total Healing
              </div>
              <div className="text-right">
                {qdpsTotals.healing.toLocaleString()}
              </div>

              <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                Avg KP
              </div>
              <div className="text-right">
                {qdpsTotals.avgKP.toFixed(1)}%
              </div>
            </div>

            <hr className="border-nw-gold/20 my-3" />

            <ul className="space-y-3">
              {qdpsPlayers.map((p) => (
                <li key={p.Player} className="pb-2">
                  <div className="flex justify-between items-center w-full gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{p.Player}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] uppercase border flex-shrink-0"
                        style={{
                          backgroundColor:
                            buildColors[p.buildType] + "26",
                          color: buildColors[p.buildType],
                          borderColor:
                            buildColors[p.buildType] + "66",
                        }}
                      >
                        {p.buildType}
                      </span>
                    </div>

                    <span className="text-xs text-nw-gold-soft font-semibold flex-shrink-0">
                      {p.Kills}/{p.Deaths}
                    </span>
                  </div>

                  <div className="mt-0.5 grid grid-cols-[1fr_auto_1fr] text-[11px] text-nw-parchment-soft/90">
                    <span>DMG: {p.Damage.toLocaleString()}</span>
                    <span>HEALS: {p.Healing.toLocaleString()}</span>
                    <span className="text-right">
                      KP: {p.KP.toFixed(1)}%
                    </span>
                  </div>

                  <hr className="mt-2 border-nw-gold/10" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
