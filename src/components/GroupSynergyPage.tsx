import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EnhancedPlayer } from "../utils/csvParser";

type BuildColors = Record<string, string>;

interface Props {
  allPlayersByWar: Record<string, EnhancedPlayer[]>;
  fullWarsByWar: Record<string, EnhancedPlayer[]>;
  buildColors: BuildColors;

  /** ✅ If provided, Group Synergy will auto-load this war as baseline (if available). */
  initialWar?: string;
}

type Totals = {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  healing: number;
  avgKP: number;
};

type WarRow = {
  war: string;
  overlapCount: number;
  overlapPct: number;
  togetherCount: number;
  togetherPct: number;
  bestGroup: number | null;
  groupTotals: Totals | null;
};

type WarOutcome = "W" | "L" | "?";

// ✅ Toggle modes:
// - "full" = Full wars only
// - "all"  = Full + Partial (all wars available)
type WarMode = "full" | "all";

function normName(s: string) {
  return (s || "").trim().toLowerCase();
}

// -----------------------------
// SIDE-MENU-LIKE WAR LABEL HELPERS
// -----------------------------
function parseFileDate(file: string): Date | null {
  const base = (file || "").replace(".csv", "");
  const m = base.match(/(?:^|[_-])(\d{1,2})-(\d{1,2})-(\d{2})(?:$|[_-])/);
  if (!m) return null;

  const month = Number(m[1]);
  const day = Number(m[2]);
  const yy = Number(m[3]);
  const year = 2000 + yy;

  if (!month || month < 1 || month > 12 || !day || day < 1 || day > 31) return null;
  return new Date(year, month - 1, day);
}

function formatReadableDate(file: string) {
  const d = parseFileDate(file);
  if (!d) return "";
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNamesShort[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function parseOpponentFromFile(file: string) {
  const base = (file || "").replace(".csv", "");
  const m = base.match(/^MGv([^_]+)[_-]/i);
  return m ? m[1] : "Unknown";
}

function normalizeOutcomeText(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\r/g, "")
    .replace(/"/g, "")
    .trim();
}

function extractOutcomeFromPlayers(players: EnhancedPlayer[]): WarOutcome {
  for (const p of players || []) {
    const raw =
      (p as any)?.Result ??
      (p as any)?.result ??
      (p as any)?.Outcome ??
      (p as any)?.outcome ??
      "";

    const text = normalizeOutcomeText(String(raw));
    if (!text) continue;

    if (text.includes("win") || text.includes("victory") || text.includes("won")) return "W";
    if (text.includes("loss") || text.includes("defeat") || text.includes("lost")) return "L";
  }

  const blob = normalizeOutcomeText(
    (players || [])
      .slice(0, 10)
      .map((p) => String((p as any)?.Result ?? (p as any)?.Outcome ?? ""))
      .join(" ")
  );

  const hasWin = /\b(win|victory|won)\b/.test(blob);
  const hasLoss = /\b(loss|defeat|lost)\b/.test(blob);

  if (hasWin && !hasLoss) return "W";
  if (hasLoss && !hasWin) return "L";
  return "?";
}

function WarLabel({ war, outcome }: { war: string; outcome: WarOutcome }) {
  const opponent = parseOpponentFromFile(war);
  const date = formatReadableDate(war);

  const badge =
    outcome === "W" ? (
      <span className="text-[10px] font-bold text-green-300">W</span>
    ) : outcome === "L" ? (
      <span className="text-[10px] font-bold text-red-300">L</span>
    ) : (
      <span className="text-[10px] font-bold text-nw-parchment-soft/40">•</span>
    );

  return (
    <div className="w-full">
      <div
        className="
          flex items-center gap-2 whitespace-nowrap
          overflow-x-auto
          [-ms-overflow-style:none] [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        <span className="inline-flex w-4 justify-center shrink-0">{badge}</span>
        <span className="text-[12px] font-semibold shrink-0">MG</span>
        <span className="text-[12px] opacity-80 shrink-0">vs</span>
        <span className="text-[12px] font-semibold shrink-0">{opponent}</span>
      </div>

      {date && <div className="text-[10px] opacity-70 pl-6 leading-tight">{date}</div>}
    </div>
  );
}

function WarPicker({
  wars,
  selectedWar,
  onSelect,
  outcomeByWar,
  disabled,
}: {
  wars: string[];
  selectedWar: string;
  onSelect: (w: string) => void;
  outcomeByWar: Record<string, WarOutcome>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [panelRect, setPanelRect] = useState<{ left: number; top: number; width: number } | null>(null);

  const selectedOutcome = outcomeByWar[selectedWar] || "?";

  const recalc = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelRect({
      left: r.left,
      top: r.bottom + 8,
      width: r.width,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;

    recalc();

    const onScroll = () => recalc();
    const onResize = () => recalc();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`
          w-full text-left px-3 py-2 rounded border
          bg-[#1a1815] text-nw-parchment-soft
          border-nw-gold-soft/40
          ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-black/25"}
        `}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <WarLabel war={selectedWar || "—"} outcome={selectedOutcome} />
          </div>
          <span className="text-nw-parchment-soft/60 text-xs shrink-0">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && !disabled && panelRect && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[9998] cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close war picker"
          />

          <div
            className="
              fixed z-[9999]
              rounded-lg border border-nw-gold/20
              bg-[#141210] shadow-xl
              max-h-[320px] overflow-y-auto
            "
            style={{
              left: panelRect.left,
              top: panelRect.top,
              width: panelRect.width,
            }}
          >
            {wars.map((w) => {
              const active = w === selectedWar;
              const outcome = outcomeByWar[w] || "?";

              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    onSelect(w);
                    setOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-2
                    border-b border-nw-gold/10 last:border-b-0
                    ${active ? "bg-[rgba(198,155,91,0.18)]" : "bg-transparent hover:bg-white/5"}
                  `}
                >
                  <WarLabel war={w} outcome={outcome} />
                </button>
              );
            })}

            {wars.length === 0 && (
              <div className="px-3 py-3 text-sm text-nw-parchment-soft/70">No wars available.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// -----------------------------
// SYNERGY HELPERS
// -----------------------------
function computeTotals(players: EnhancedPlayer[]): Totals {
  const kills = players.reduce((a, p) => a + ((p as any).Kills || 0), 0);
  const deaths = players.reduce((a, p) => a + ((p as any).Deaths || 0), 0);
  const assists = players.reduce((a, p) => a + ((p as any).Assists || 0), 0);
  const damage = players.reduce((a, p) => a + ((p as any).Damage || 0), 0);
  const healing = players.reduce((a, p) => a + ((p as any).Healing || 0), 0);
  const avgKP = players.reduce((a, p) => a + ((p as any).KP || 0), 0) / Math.max(1, players.length);
  return { kills, deaths, assists, damage, healing, avgKP };
}

function groupMap(players: EnhancedPlayer[]) {
  const map = new Map<number, EnhancedPlayer[]>();
  for (const p of players) {
    const g = Number((p as any).Group || 0);
    if (!g) continue;
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(p);
  }
  return map;
}

function pickBestMatchingGroup(
  warPlayers: EnhancedPlayer[],
  baselineNames: Set<string>
): { group: number | null; togetherCount: number; groupPlayers: EnhancedPlayer[] } {
  const gm = groupMap(warPlayers);

  let bestGroup: number | null = null;
  let bestTogether = 0;
  let bestGroupPlayers: EnhancedPlayer[] = [];

  for (const [gnum, gplayers] of gm.entries()) {
    const togetherCount = gplayers.reduce((a, p) => a + (baselineNames.has(normName((p as any).Player)) ? 1 : 0), 0);

    if (togetherCount > bestTogether) {
      bestTogether = togetherCount;
      bestGroup = gnum;
      bestGroupPlayers = gplayers;
    }
  }

  return { group: bestGroup, togetherCount: bestTogether, groupPlayers: bestGroupPlayers };
}

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] uppercase border flex-shrink-0"
      style={{
        backgroundColor: color ? color + "26" : "rgba(255,255,255,0.06)",
        color: color || "rgba(255,255,255,0.85)",
        borderColor: color ? color + "66" : "rgba(255,255,255,0.18)",
      }}
    >
      {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 bg-black/20 rounded text-center min-w-[140px]">
      <p className="text-nw-parchment-soft/80 text-sm">{label}</p>
      <p className="text-xl text-nw-parchment-soft">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-black/20 p-3 rounded text-center border border-nw-gold/10">
      <p className="text-xs text-nw-parchment-soft/60 uppercase">{label}</p>
      <p className="text-lg text-nw-parchment-soft font-semibold mt-1">{value}</p>
    </div>
  );
}

function PlayerWarStatsGrid({
  title,
  subtitle,
  playerName,
  buildType,
  buildColors,
  stats,
  showHealingStat = true,
}: {
  title: string;
  subtitle?: string;
  playerName: string;
  buildType?: string;
  buildColors: BuildColors;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
    healing: number;
    kp: number;
  } | null;
  showHealingStat?: boolean;
}) {
  const bt = buildType || "UNKNOWN";
  const color = buildColors[bt] || "rgba(255,255,255,0.25)";

  return (
    <div className="p-4 rounded-lg bg-black/20 border border-nw-gold/20">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-[180px]">
          <p className="text-nw-parchment-soft/60 text-xs uppercase">{title}</p>
          {subtitle ? <p className="text-nw-parchment-soft/60 text-xs">{subtitle}</p> : null}
          <p className="text-nw-gold-soft font-semibold text-lg leading-tight">{playerName || "—"}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge label={bt} color={color} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MiniStat label="DMG" value={stats ? Math.round(stats.damage).toLocaleString() : "—"} />
        {showHealingStat ? <MiniStat label="HEALS" value={stats ? Math.round(stats.healing).toLocaleString() : "—"} /> : null}
        <MiniStat label="KP" value={stats ? `${stats.kp.toFixed(1)}%` : "—"} />
        <MiniStat label="Kills" value={stats ? stats.kills.toLocaleString() : "—"} />
        <MiniStat label="Deaths" value={stats ? stats.deaths.toLocaleString() : "—"} />
        <MiniStat label="Assists" value={stats ? stats.assists.toLocaleString() : "—"} />
      </div>
    </div>
  );
}

/** ✅ Shared pill component (reuse in both places) */
function WarModePill({
  warMode,
  setWarMode,
  sticky = false,
}: {
  warMode: WarMode;
  setWarMode: (m: WarMode) => void;
  sticky?: boolean;
}) {
  return (
    <div className={sticky ? "mt-4 sticky top-3 z-[50]" : "mt-3"}>
      <div className="inline-flex rounded-full border border-nw-gold/20 bg-black/25 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => setWarMode("full")}
          className={`
            px-4 py-1.5 rounded-full text-xs font-semibold transition
            ${
              warMode === "full"
                ? "bg-[rgba(198,155,91,0.25)] text-nw-gold-soft border border-nw-gold-soft/40"
                : "text-nw-parchment-soft/80 hover:bg-white/5"
            }
          `}
        >
          Full Only
        </button>

        <button
          type="button"
          onClick={() => setWarMode("all")}
          className={`
            px-4 py-1.5 rounded-full text-xs font-semibold transition
            ${
              warMode === "all"
                ? "bg-[rgba(198,155,91,0.25)] text-nw-gold-soft border border-nw-gold-soft/40"
                : "text-nw-parchment-soft/80 hover:bg-white/5"
            }
          `}
        >
          Full + Partial
        </button>
      </div>
    </div>
  );
}

export default function GroupSynergyPage({ allPlayersByWar, fullWarsByWar, buildColors, initialWar }: Props) {
  // ✅ Toggle state: Full only vs Full+Partial (shared for BOTH pills)
  const [warMode, setWarMode] = useState<WarMode>("full");

  // Full war set (used only when warMode==="full")
  const fullWarSet = useMemo(() => new Set(Object.keys(fullWarsByWar || {})), [fullWarsByWar]);

  // ✅ Visible wars depends on toggle:
  // - full: only wars that exist in fullWarsByWar
  // - all: all wars (full + partial) from allPlayersByWar
  const visibleWars = useMemo(() => {
    const all = Object.keys(allPlayersByWar || {});
    const list = warMode === "full" ? all.filter((w) => fullWarSet.has(w)) : all;

    const scored = list.map((f) => ({ f, t: parseFileDate(f)?.getTime() ?? null }));
    scored.sort((a, b) => {
      if (a.t != null && b.t != null) return b.t - a.t;
      if (a.t != null && b.t == null) return -1;
      if (a.t == null && b.t != null) return 1;
      return b.f.localeCompare(a.f);
    });

    return scored.map((x) => x.f);
  }, [allPlayersByWar, fullWarSet, warMode]);

  const [baselineWar, setBaselineWar] = useState<string>("");

  // ✅ Auto-load baseline war from initialWar (Dashboard-selected war), if valid.
  // Also keep baseline war valid when mode changes or wars change.
  useEffect(() => {
    const candidate = (initialWar || "").trim();

    if (candidate && visibleWars.includes(candidate)) {
      if (baselineWar !== candidate) setBaselineWar(candidate);
      return;
    }

    if (!baselineWar) {
      if (visibleWars[0]) setBaselineWar(visibleWars[0]);
      return;
    }

    if (visibleWars.length > 0 && !visibleWars.includes(baselineWar)) {
      setBaselineWar(visibleWars[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWar, warMode, visibleWars.join("|")]);

  const outcomeByWar = useMemo(() => {
    const map: Record<string, WarOutcome> = {};
    for (const w of visibleWars) {
      map[w] = extractOutcomeFromPlayers(allPlayersByWar[w] || []);
    }
    return map;
  }, [visibleWars, allPlayersByWar]);

  const baselinePlayers = useMemo(() => (baselineWar ? allPlayersByWar[baselineWar] || [] : []), [allPlayersByWar, baselineWar]);

  const baselineGroups = useMemo(() => {
    const gm = groupMap(baselinePlayers);
    return [...gm.keys()].sort((a, b) => a - b);
  }, [baselinePlayers]);

  const [baselineGroupNum, setBaselineGroupNum] = useState<number>(baselineGroups[0] || 1);

  useEffect(() => {
    if (baselineGroups.length === 0) return;
    if (!baselineGroups.includes(baselineGroupNum)) setBaselineGroupNum(baselineGroups[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineWar, baselineGroups.join(",")]);

  const baselineGroupPlayers = useMemo(() => {
    const gm = groupMap(baselinePlayers);
    return gm.get(baselineGroupNum) || [];
  }, [baselinePlayers, baselineGroupNum]);

  const baselineNames = useMemo(() => new Set(baselineGroupPlayers.map((p) => normName((p as any).Player))), [baselineGroupPlayers]);

  const baselineTotals = useMemo(() => (baselineGroupPlayers.length ? computeTotals(baselineGroupPlayers) : null), [baselineGroupPlayers]);

  const baselineRosterNames = useMemo(() => {
    return baselineGroupPlayers
      .map((p) => (p as any).Player as string)
      .sort((a, b) => a.localeCompare(b));
  }, [baselineGroupPlayers]);

  const [focusPlayerA, setFocusPlayerA] = useState<string>(baselineRosterNames[0] || "");
  const [focusPlayerB, setFocusPlayerB] = useState<string>(baselineRosterNames[1] || baselineRosterNames[0] || "");

  useEffect(() => {
    setFocusPlayerA(baselineRosterNames[0] || "");
    setFocusPlayerB(baselineRosterNames[1] || baselineRosterNames[0] || "");
  }, [baselineRosterNames.join("|")]);

  const warRows = useMemo<WarRow[]>(() => {
    if (!baselineWar || baselineGroupPlayers.length === 0) return [];

    const baselineSize = baselineGroupPlayers.length;

    const kd = (t: Totals | null) => {
      if (!t) return -1;
      const deaths = Number(t.deaths || 0);
      const kills = Number(t.kills || 0);
      // If deaths is 0, treat as "perfect" — rank highest.
      if (deaths <= 0) return kills > 0 ? Number.POSITIVE_INFINITY : 0;
      return kills / deaths;
    };

    const rows = visibleWars
      .filter((w) => w !== baselineWar)
      .map((w) => {
        const list = allPlayersByWar[w] || [];

        const overlapCount = list.reduce((a, p) => a + (baselineNames.has(normName((p as any).Player)) ? 1 : 0), 0);

        const best = pickBestMatchingGroup(list, baselineNames);
        const groupTotals = best.groupPlayers.length ? computeTotals(best.groupPlayers) : null;

        return {
          war: w,
          overlapCount,
          overlapPct: baselineSize ? overlapCount / baselineSize : 0,
          togetherCount: best.togetherCount,
          togetherPct: baselineSize ? best.togetherCount / baselineSize : 0,
          bestGroup: best.group,
          groupTotals,
        };
      })
      .filter((r) => r.overlapCount > 0)
      // ✅ Sort by Group K/D best → worst (top to bottom)
      .sort((a, b) => {
        const akd = kd(a.groupTotals);
        const bkd = kd(b.groupTotals);
        if (bkd !== akd) return bkd - akd;

        // tie-breakers (keep it stable-ish and intuitive)
        if (b.togetherCount !== a.togetherCount) return b.togetherCount - a.togetherCount;
        if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount;

        const ta = parseFileDate(a.war)?.getTime() ?? 0;
        const tb = parseFileDate(b.war)?.getTime() ?? 0;
        return tb - ta;
      });

    return rows;
  }, [allPlayersByWar, baselineNames, baselineGroupPlayers.length, baselineWar, visibleWars]);

  const findPlayerInWar = (war: string, nameNorm: string) =>
    (allPlayersByWar[war] || []).find((p) => normName((p as any).Player) === nameNorm) as EnhancedPlayer | undefined;

  const buildTypeForName = (name: string) => {
    const nn = normName(name);
    const found = baselineGroupPlayers.find((p) => normName((p as any).Player) === nn) as any;
    return (found?.buildType as string) || "UNKNOWN";
  };

  // ✅ Healer build should always be HEALS (not derived from baseline group)
  const healerBuildType = () => "HEALS";

  type OneWarPerf = {
    war: string;
    stats: {
      kills: number;
      deaths: number;
      assists: number;
      damage: number;
      healing: number;
      kp: number;
    };
    score: number;
  };

  const bestPerformanceFor = (warList: string[], playerNorm: string): OneWarPerf | null => {
    let best: OneWarPerf | null = null;

    for (const w of warList) {
      const p = findPlayerInWar(w, playerNorm) as any;
      if (!p) continue;

      const stats = {
        kills: Number(p?.Kills || 0),
        deaths: Number(p?.Deaths || 0),
        assists: Number(p?.Assists || 0),
        damage: Number(p?.Damage || 0),
        healing: Number(p?.Healing || 0),
        kp: Number(p?.KP || 0),
      };

      // ✅ Simple, role-agnostic “best” metric:
      // prioritize impact volume (DMG + HEALS), then KP, then Kills, then fewer deaths.
      const score =
        stats.damage +
        stats.healing +
        stats.kp * 1000 +
        stats.kills * 250 +
        stats.assists * 50 -
        stats.deaths * 150;

      const perf: OneWarPerf = { war: w, stats, score };

      if (!best) {
        best = perf;
      } else if (perf.score > best.score) {
        best = perf;
      }
    }

    return best;
  };

  const pairSummary = useMemo(() => {
    const aNorm = normName(focusPlayerA);
    const bNorm = normName(focusPlayerB);
    if (!aNorm || !bNorm || aNorm === bNorm) return null;

    const togetherWars: string[] = [];
    const notTogetherWars: string[] = [];

    for (const w of visibleWars) {
      const pa = findPlayerInWar(w, aNorm);
      const pb = findPlayerInWar(w, bNorm);
      if (!pa || !pb) continue;

      const ga = Number((pa as any).Group || 0);
      const gb = Number((pb as any).Group || 0);

      if (ga && gb && ga === gb) togetherWars.push(w);
      else notTogetherWars.push(w);
    }

    const avgFromWars = (warList: string[]) => {
      if (warList.length === 0) return null;

      const get = (nameNorm: string, w: string) => findPlayerInWar(w, nameNorm);

      const samplesA = warList.map((w) => get(aNorm, w)).filter(Boolean) as EnhancedPlayer[];
      const samplesB = warList.map((w) => get(bNorm, w)).filter(Boolean) as EnhancedPlayer[];

      const avg = (arr: EnhancedPlayer[], key: string) =>
        arr.reduce((s, p) => s + Number((p as any)?.[key] || 0), 0) / Math.max(1, arr.length);

      return {
        wars: warList.length,
        a: {
          avgKills: avg(samplesA, "Kills"),
          avgDeaths: avg(samplesA, "Deaths"),
          avgAssists: avg(samplesA, "Assists"),
          avgDamage: avg(samplesA, "Damage"),
          avgHealing: avg(samplesA, "Healing"),
          avgKP: avg(samplesA, "KP"),
        },
        b: {
          avgKills: avg(samplesB, "Kills"),
          avgDeaths: avg(samplesB, "Deaths"),
          avgAssists: avg(samplesB, "Assists"),
          avgDamage: avg(samplesB, "Damage"),
          avgHealing: avg(samplesB, "Healing"),
          avgKP: avg(samplesB, "KP"),
        },
      };
    };

    const togetherBestA = bestPerformanceFor(togetherWars, aNorm);
    const togetherBestB = bestPerformanceFor(togetherWars, bNorm);
    const notTogetherBestA = bestPerformanceFor(notTogetherWars, aNorm);
    const notTogetherBestB = bestPerformanceFor(notTogetherWars, bNorm);

    return {
      togetherWars,
      notTogetherWars,
      togetherAvg: avgFromWars(togetherWars),
      notTogetherAvg: avgFromWars(notTogetherWars),
      togetherBestA,
      togetherBestB,
      notTogetherBestA,
      notTogetherBestB,
    };
  }, [focusPlayerA, focusPlayerB, visibleWars, allPlayersByWar]);

  const togetherWarCards = useMemo(() => {
    const aNorm = normName(focusPlayerA);
    const bNorm = normName(focusPlayerB);
    if (!aNorm || !bNorm || aNorm === bNorm) return [];

    const cards: Array<{
      war: string;
      group: number;
      leftName: string;
      rightName: string;
      healerName: string;
      leftStats: any;
      rightStats: any;
      healerStats: any;
    }> = [];

    const statsFrom = (p: any) => ({
      kills: Number(p?.Kills || 0),
      deaths: Number(p?.Deaths || 0),
      assists: Number(p?.Assists || 0),
      damage: Number(p?.Damage || 0),
      healing: Number(p?.Healing || 0),
      kp: Number(p?.KP || 0),
    });

    for (const w of visibleWars) {
      const warPlayers = allPlayersByWar[w] || [];
      const pa = warPlayers.find((p) => normName((p as any).Player) === aNorm) as any;
      const pb = warPlayers.find((p) => normName((p as any).Player) === bNorm) as any;
      if (!pa || !pb) continue;

      const ga = Number(pa.Group || 0);
      const gb = Number(pb.Group || 0);
      if (!ga || !gb || ga !== gb) continue;

      const groupNum = ga;
      const groupPlayers = warPlayers.filter((p) => Number((p as any).Group || 0) === groupNum) as any[];
      if (groupPlayers.length === 0) continue;

      let healer = groupPlayers[0];
      let bestHeals = Number(healer?.Healing || 0);
      for (const gp of groupPlayers) {
        const heals = Number(gp?.Healing || 0);
        if (heals > bestHeals) {
          bestHeals = heals;
          healer = gp;
        }
      }

      cards.push({
        war: w,
        group: groupNum,
        leftName: focusPlayerA,
        rightName: focusPlayerB,
        healerName: String(healer?.Player || "—"),
        leftStats: statsFrom(pa),
        rightStats: statsFrom(pb),
        healerStats: statsFrom(healer),
      });
    }

    return cards.sort((x, y) => {
      const tx = parseFileDate(x.war)?.getTime() ?? 0;
      const ty = parseFileDate(y.war)?.getTime() ?? 0;
      return ty - tx;
    });
  }, [visibleWars, focusPlayerA, focusPlayerB, allPlayersByWar]);

  const fmtAvg = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "X");
  const fmtInt = (n: number) => (Number.isFinite(n) ? Math.round(n).toLocaleString() : "X");

  const PerfBlock = ({
    title,
    perf,
  }: {
    title: string;
    perf: OneWarPerf | null | undefined;
  }) => {
    if (!perf) return <div className="text-nw-parchment-soft/70">—</div>;

    return (
      <div className="p-3 rounded bg-black/15 border border-nw-gold/10">
        <p className="text-xs text-nw-parchment-soft/60 uppercase">{title}</p>
        <div className="mt-2">
          <WarLabel war={perf.war} outcome={outcomeByWar[perf.war] || "?"} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="text-nw-parchment-soft/80">
            DMG: <span className="text-nw-parchment-soft">{fmtInt(perf.stats.damage)}</span>
          </div>
          <div className="text-nw-parchment-soft/80">
            HEALS: <span className="text-nw-parchment-soft">{fmtInt(perf.stats.healing)}</span>
          </div>
          <div className="text-nw-parchment-soft/80">
            KP: <span className="text-nw-parchment-soft">{Number.isFinite(perf.stats.kp) ? `${perf.stats.kp.toFixed(1)}%` : "—"}</span>
          </div>
          <div className="text-nw-parchment-soft/80">
            K/D/A:{" "}
            <span className="text-nw-parchment-soft">
              {perf.stats.kills}/{perf.stats.deaths}/{perf.stats.assists}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.section
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* TOP PANEL */}
      <div className="nw-panel p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="nw-title text-nw-gold-soft text-2xl">Group Synergy</h2>
            <p className="text-nw-parchment-soft/80 text-sm">
              Toggle war scope: <span className="text-nw-gold-soft font-semibold">Full only</span> vs{" "}
              <span className="text-nw-gold-soft font-semibold">Full + Partial</span>. Compare a baseline group against other wars.
            </p>
            <p className="text-nw-parchment-soft/60 text-xs mt-1">Some wars are missing due to no stats provided.</p>
          </div>

          <div className="text-xs text-nw-parchment-soft/60 flex items-center gap-3">
            <span>
              Showing <span className="text-nw-gold-soft font-semibold">{visibleWars.length}</span>{" "}
              {warMode === "full" ? "full wars" : "wars (full + partial)"}
            </span>
          </div>
        </div>

        {/* ✅ Sticky scrolling pill toggle (shared state) */}
        <WarModePill warMode={warMode} setWarMode={setWarMode} sticky />

        {/* ✅ Smooth transition when warMode changes */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`top-${warMode}`}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase text-nw-parchment-soft/60">War</label>
                <WarPicker
                  wars={visibleWars}
                  selectedWar={baselineWar}
                  onSelect={(w) => setBaselineWar(w)}
                  outcomeByWar={outcomeByWar}
                  disabled={visibleWars.length === 0}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase text-nw-parchment-soft/60">Group</label>
                <select
                  value={baselineGroupNum}
                  onChange={(e) => setBaselineGroupNum(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1a1815] border border-nw-gold-soft/40 rounded text-nw-parchment-soft"
                >
                  {baselineGroups.map((g) => (
                    <option key={g} value={g}>
                      Group {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase text-nw-parchment-soft/60">Roster</label>
                <div className="flex flex-wrap gap-2 p-2 rounded border border-nw-gold/20 bg-black/20">
                  {baselineGroupPlayers.map((p: any) => (
                    <div key={p.Player} className="flex items-center gap-2">
                      <span className="text-sm text-nw-parchment-soft">{p.Player}</span>
                      <Badge label={p.buildType || "UNKNOWN"} color={buildColors[p.buildType || "UNKNOWN"]} />
                    </div>
                  ))}
                  {baselineGroupPlayers.length === 0 && (
                    <span className="text-sm text-nw-parchment-soft/70">No players found in this group.</span>
                  )}
                </div>
              </div>
            </div>

            {baselineTotals && (
              <div className="mt-5 overflow-x-auto">
                <div className="flex gap-3 flex-nowrap pb-2">
                  <StatCard label="Baseline K/D" value={`${baselineTotals.kills}/${baselineTotals.deaths}`} />
                  <StatCard label="Baseline Assists" value={baselineTotals.assists.toLocaleString()} />
                  <StatCard label="Baseline Damage" value={baselineTotals.damage.toLocaleString()} />
                  <StatCard label="Baseline Healing" value={baselineTotals.healing.toLocaleString()} />
                  <StatCard label="Baseline Avg KP%" value={baselineTotals.avgKP.toFixed(1) + "%"} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* GROUP HISTORY */}
      <div className="nw-panel p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="nw-title text-nw-gold-soft text-lg">Group History (Best Match per War)</h3>
          <p className="text-sm text-nw-parchment-soft/70">
            “Together” = how many baseline members landed in the same best-matching group that war.
          </p>
        </div>

        {/* ✅ Animate table/cards when warMode flips */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`history-${warMode}`}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="hidden md:block overflow-x-auto mt-3">
              <table className="min-w-full text-sm border-collapse">
                <thead className="nw-sticky-header text-left text-nw-gold-soft text-xs md:text-sm">
                  <tr>
                    <th className="py-2 pr-3">War</th>
                    <th className="py-2 pr-3">Overlap</th>
                    <th className="py-2 pr-3">Together</th>
                    <th className="py-2 pr-3">Group K/D</th>
                    <th className="py-2 pr-3">Group DMG</th>
                    <th className="py-2 pr-3">Group HEALS</th>
                    <th className="py-2 pr-3">Avg KP</th>
                  </tr>
                </thead>

                <tbody>
                  {warRows.map((r) => (
                    <tr key={r.war} className="border-t border-nw-gold/10 hover:bg-white/5">
                      <td className="px-3 py-2">{r.war.replace(".csv", "").replace(/_/g, " ")}</td>
                      <td className="px-3 py-2">
                        {r.overlapCount} ({Math.round(r.overlapPct * 100)}%)
                      </td>
                      <td className="px-3 py-2 text-nw-gold-soft font-semibold">
                        {r.togetherCount} ({Math.round(r.togetherPct * 100)}%)
                      </td>
                      <td className="px-3 py-2">{r.groupTotals ? `${r.groupTotals.kills}/${r.groupTotals.deaths}` : "—"}</td>
                      <td className="px-3 py-2">{r.groupTotals ? r.groupTotals.damage.toLocaleString() : "—"}</td>
                      <td className="px-3 py-2">{r.groupTotals ? r.groupTotals.healing.toLocaleString() : "—"}</td>
                      <td className="px-3 py-2">{r.groupTotals ? r.groupTotals.avgKP.toFixed(1) + "%" : "—"}</td>
                    </tr>
                  ))}

                  {warRows.length === 0 && (
                    <tr className="border-t border-nw-gold/10">
                      <td className="px-3 py-4 text-nw-parchment-soft/70" colSpan={7}>
                        No comparable wars found for this baseline group.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3 mt-3">
              {warRows.map((r) => (
                <div key={r.war} className="p-3 rounded-lg bg-black/30 border border-nw-gold-soft/20">
                  <p className="text-nw-gold-soft font-semibold truncate">{r.war.replace(".csv", "").replace(/_/g, " ")}</p>
                  <p className="text-xs text-nw-parchment-soft/70 mt-1">
                    Overlap: {r.overlapCount} • Together:{" "}
                    <span className="text-nw-gold-soft font-semibold">{r.togetherCount}</span>
                  </p>

                  {r.groupTotals && (
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div className="bg-black/20 p-2 rounded text-center">
                        <p className="text-xs text-nw-parchment-soft/70">K/D</p>
                        <p className="text-sm font-semibold">
                          {r.groupTotals.kills}/{r.groupTotals.deaths}
                        </p>
                      </div>
                      <div className="bg-black/20 p-2 rounded text-center">
                        <p className="text-xs text-nw-parchment-soft/70">Avg KP</p>
                        <p className="text-sm font-semibold">{r.groupTotals.avgKP.toFixed(1)}%</p>
                      </div>
                      <div className="bg-black/20 p-2 rounded text-center">
                        <p className="text-xs text-nw-parchment-soft/70">DMG</p>
                        <p className="text-sm font-semibold">{r.groupTotals.damage.toLocaleString()}</p>
                      </div>
                      <div className="bg-black/20 p-2 rounded text-center">
                        <p className="text-xs text-nw-parchment-soft/70">HEALS</p>
                        <p className="text-sm font-semibold">{r.groupTotals.healing.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {warRows.length === 0 && (
                <div className="p-3 rounded-lg bg-black/30 border border-nw-gold-soft/20 text-nw-parchment-soft/70">
                  No comparable wars found for this baseline group.
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* PLAYER PAIR */}
      <div className="nw-panel p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h3 className="nw-title text-nw-gold-soft text-lg">Player Pair: Together vs Not Together</h3>

          {/* ✅ Second pill (same shared state) */}
          <WarModePill warMode={warMode} setWarMode={setWarMode} />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`pair-${warMode}-${focusPlayerA}-${focusPlayerB}`}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="space-y-2">
                <label className="text-xs uppercase text-nw-parchment-soft/60">Player A</label>
                <select
                  value={focusPlayerA}
                  onChange={(e) => setFocusPlayerA(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1815] border border-nw-gold-soft/40 rounded text-nw-parchment-soft"
                >
                  {baselineRosterNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase text-nw-parchment-soft/60">Player B</label>
                <select
                  value={focusPlayerB}
                  onChange={(e) => setFocusPlayerB(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1815] border border-nw-gold-soft/40 rounded text-nw-parchment-soft"
                >
                  {baselineRosterNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {pairSummary ? (
              <div className="mt-5 space-y-6">
                <div className="flex flex-wrap gap-3">
                  <StatCard label="Together Wars" value={pairSummary.togetherWars.length} />
                  <StatCard
                    label="Not Together Wars"
                    value={pairSummary.notTogetherWars.length === 0 ? "X" : pairSummary.notTogetherWars.length}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="p-4 rounded-lg bg-black/20 border border-nw-gold/20">
                    <p className="text-nw-gold-soft font-semibold mb-3">Together (avg)</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-nw-parchment-soft/60 uppercase">{focusPlayerA}</p>
                        <p className="text-sm text-nw-parchment-soft/80">
                          Avg DMG: {pairSummary.togetherAvg ? fmtInt(pairSummary.togetherAvg.a.avgDamage) : "—"}
                        </p>
                        <p className="text-sm text-nw-parchment-soft/80">
                          Avg HEALS: {pairSummary.togetherAvg ? fmtInt(pairSummary.togetherAvg.a.avgHealing) : "—"}
                        </p>
                        <p className="text-sm text-nw-parchment-soft/80">
                          Avg KP: {pairSummary.togetherAvg ? `${fmtAvg(pairSummary.togetherAvg.a.avgKP)}%` : "—"}
                        </p>
                        <p className="text-sm text-nw-parchment-soft/80">
                          Avg K/D/A:{" "}
                          {pairSummary.togetherAvg
                            ? `${fmtAvg(pairSummary.togetherAvg.a.avgKills)}/${fmtAvg(pairSummary.togetherAvg.a.avgDeaths)}/${fmtAvg(
                                pairSummary.togetherAvg.a.avgAssists
                              )}`
                            : "—"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-nw-parchment-soft/60 uppercase">{focusPlayerB}</p>
                        <p className="text-sm text-nw-parchment-soft/80">
                          Avg DMG: {pairSummary.togetherAvg ? fmtInt(pairSummary.togetherAvg.b.avgDamage) : "—"}
                        </p>
                        <p className="text-sm text-nw-parchment-soft/80">
                          Avg HEALS: {pairSummary.togetherAvg ? fmtInt(pairSummary.togetherAvg.b.avgHealing) : "—"}
                        </p>
                        <p className="text-sm text-nw-parchment-soft/80">
                          Avg KP: {pairSummary.togetherAvg ? `${fmtAvg(pairSummary.togetherAvg.b.avgKP)}%` : "—"}
                        </p>
                        <p className="text-sm text-nw-parchment-soft/80">
                          Avg K/D/A:{" "}
                          {pairSummary.togetherAvg
                            ? `${fmtAvg(pairSummary.togetherAvg.b.avgKills)}/${fmtAvg(pairSummary.togetherAvg.b.avgDeaths)}/${fmtAvg(
                                pairSummary.togetherAvg.b.avgAssists
                              )}`
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {/* ✅ Best performances (Together) */}
                    <div className="mt-4 pt-4 border-t border-nw-gold/10">
                      <p className="text-nw-parchment-soft/70 text-xs uppercase mb-2">Best (single war) while together</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <PerfBlock title={`Best – ${focusPlayerA}`} perf={pairSummary.togetherBestA} />
                        <PerfBlock title={`Best – ${focusPlayerB}`} perf={pairSummary.togetherBestB} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-black/20 border border-nw-gold/20">
                    <p className="text-nw-gold-soft font-semibold mb-3">Not Together (avg)</p>

                    {pairSummary.notTogetherWars.length === 0 || !pairSummary.notTogetherAvg ? (
                      <div className="text-nw-parchment-soft/70">X</div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-nw-parchment-soft/60 uppercase">{focusPlayerA}</p>
                            <p className="text-sm text-nw-parchment-soft/80">Avg DMG: {fmtInt(pairSummary.notTogetherAvg.a.avgDamage)}</p>
                            <p className="text-sm text-nw-parchment-soft/80">Avg HEALS: {fmtInt(pairSummary.notTogetherAvg.a.avgHealing)}</p>
                            <p className="text-sm text-nw-parchment-soft/80">Avg KP: {`${fmtAvg(pairSummary.notTogetherAvg.a.avgKP)}%`}</p>
                            <p className="text-sm text-nw-parchment-soft/80">
                              Avg K/D/A:{" "}
                              {`${fmtAvg(pairSummary.notTogetherAvg.a.avgKills)}/${fmtAvg(pairSummary.notTogetherAvg.a.avgDeaths)}/${fmtAvg(
                                pairSummary.notTogetherAvg.a.avgAssists
                              )}`}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-nw-parchment-soft/60 uppercase">{focusPlayerB}</p>
                            <p className="text-sm text-nw-parchment-soft/80">Avg DMG: {fmtInt(pairSummary.notTogetherAvg.b.avgDamage)}</p>
                            <p className="text-sm text-nw-parchment-soft/80">Avg HEALS: {fmtInt(pairSummary.notTogetherAvg.b.avgHealing)}</p>
                            <p className="text-sm text-nw-parchment-soft/80">Avg KP: {`${fmtAvg(pairSummary.notTogetherAvg.b.avgKP)}%`}</p>
                            <p className="text-sm text-nw-parchment-soft/80">
                              Avg K/D/A:{" "}
                              {`${fmtAvg(pairSummary.notTogetherAvg.b.avgKills)}/${fmtAvg(pairSummary.notTogetherAvg.b.avgDeaths)}/${fmtAvg(
                                pairSummary.notTogetherAvg.b.avgAssists
                              )}`}
                            </p>
                          </div>
                        </div>

                        {/* ✅ Best performances (Not Together) */}
                        <div className="mt-4 pt-4 border-t border-nw-gold/10">
                          <p className="text-nw-parchment-soft/70 text-xs uppercase mb-2">Best (single war) while NOT together</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <PerfBlock title={`Best – ${focusPlayerA}`} perf={pairSummary.notTogetherBestA} />
                            <PerfBlock title={`Best – ${focusPlayerB}`} perf={pairSummary.notTogetherBestB} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between flex-wrap gap-2">
                    <h4 className="text-nw-gold-soft font-semibold">Together – Individual Wars (newest → oldest)</h4>
                    <p className="text-xs text-nw-parchment-soft/60">Middle panel = highest healing player in the shared group for that war.</p>
                  </div>

                  {togetherWarCards.length === 0 ? (
                    <div className="text-nw-parchment-soft/70">No wars found where these two were in the same group.</div>
                  ) : (
                    <div className="space-y-6">
                      {togetherWarCards.map((card) => {
                        const healerBt = healerBuildType(); // ✅ always HEALS
                        const leftBt = buildTypeForName(card.leftName);
                        const rightBt = buildTypeForName(card.rightName);

                        return (
                          <div key={card.war} className="p-4 rounded-lg border border-nw-gold/20 bg-black/10">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                              <div className="min-w-0">
                                <WarLabel war={card.war} outcome={outcomeByWar[card.war] || "?"} />
                              </div>
                              <div className="text-xs text-nw-parchment-soft/60">
                                Group <span className="text-nw-gold-soft font-semibold">{card.group}</span> •{" "}
                                <span className="text-nw-gold-soft font-semibold">{card.healerName}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              <PlayerWarStatsGrid
                                title="Player A"
                                subtitle="This war"
                                playerName={card.leftName}
                                buildType={leftBt}
                                buildColors={buildColors}
                                stats={card.leftStats}
                                showHealingStat={true}
                              />

                              <PlayerWarStatsGrid
                                title="Healer"
                                subtitle="Group top heals"
                                playerName={card.healerName}
                                buildType={healerBt}
                                buildColors={buildColors}
                                stats={card.healerStats}
                                showHealingStat={true}
                              />

                              <PlayerWarStatsGrid
                                title="Player B"
                                subtitle="This war"
                                playerName={card.rightName}
                                buildType={rightBt}
                                buildColors={buildColors}
                                stats={card.rightStats}
                                showHealingStat={true}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="text-xs text-nw-parchment-soft/60">
                  Together requires both players have Group &gt; 0 and match group number in that war.
                </div>
              </div>
            ) : (
              <div className="mt-4 text-nw-parchment-soft/70">Select two different players to compare.</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

