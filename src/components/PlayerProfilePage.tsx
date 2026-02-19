import React, { useMemo, useState, useEffect, useRef } from "react";
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

type WarOutcome = "W" | "L" | "?";

function normName(s: string) {
  return (s || "").trim().toLowerCase();
}

// -----------------------------
// SIDE-MENU-LIKE WAR LABEL HELPERS (same as Group Synergy)
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
    const target = normName(player.Player);
    return Object.keys(allPlayersByWar).filter((war) => {
      const list = allPlayersByWar[war];
      if (!list) return false;
      return list.some((p) => normName(p.Player) === target);
    });
  }, [allPlayersByWar, player.Player]);

  // ======================================================
  // A2) SORT warsPlayerWasIn newest -> oldest (matches side-menu vibe)
  // ======================================================
  const warsPlayerWasInSorted = useMemo(() => {
    const scored = warsPlayerWasIn.map((f) => ({ f, t: parseFileDate(f)?.getTime() ?? null }));
    scored.sort((a, b) => {
      if (a.t != null && b.t != null) return b.t - a.t;
      if (a.t != null && b.t == null) return -1;
      if (a.t == null && b.t != null) return 1;
      return b.f.localeCompare(a.f);
    });
    return scored.map((x) => x.f);
  }, [warsPlayerWasIn]);

  // ======================================================
  // A3) outcomeByWar for the picker (uses allPlayersByWar)
  // ======================================================
  const outcomeByWar = useMemo(() => {
    const map: Record<string, WarOutcome> = {};
    for (const w of warsPlayerWasInSorted) {
      map[w] = extractOutcomeFromPlayers(allPlayersByWar[w] || []);
    }
    return map;
  }, [warsPlayerWasInSorted, allPlayersByWar]);

  // ======================================================
  // B) LIFETIME AVERAGES — ONLY Full="yes" wars
  // ======================================================
  const lifetime = useMemo(() => {
    const target = normName(player.Player);

    const fullWarsPlayerWasIn = Object.keys(fullWarsByWar).filter((war) => {
      const list = fullWarsByWar[war] || [];
      return list.some((p) => normName(p.Player) === target);
    });

    const relevant = fullWarsPlayerWasIn.map((w) => fullWarsByWar[w]).flat();

    const matches = relevant.filter((p) => normName(p.Player) === target);

    if (matches.length === 0) return null;

    const total = (key: keyof EnhancedPlayer) =>
      matches.reduce((a, b) => a + (Number(b[key]) || 0), 0);

    return {
      warsPlayed: warsPlayerWasIn.length, // ALL wars
      avgKills: total("Kills") / Math.max(1, fullWarsPlayerWasIn.length),
      avgDeaths: total("Deaths") / Math.max(1, fullWarsPlayerWasIn.length),
      avgAssists: total("Assists") / Math.max(1, fullWarsPlayerWasIn.length),
      avgDamage: total("Damage") / Math.max(1, fullWarsPlayerWasIn.length),
      avgHealing: total("Healing") / Math.max(1, fullWarsPlayerWasIn.length),
      avgKP: matches.reduce((a, b) => a + (Number(b.KP) || 0), 0) / Math.max(1, matches.length),
    };
  }, [fullWarsByWar, player.Player, warsPlayerWasIn.length]);

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
            <Stat label="Avg Damage" value={Math.round(lifetime.avgDamage).toLocaleString()} />
            <Stat label="Avg Healing" value={Math.round(lifetime.avgHealing).toLocaleString()} />
            <Stat label="Avg KP%" value={lifetime.avgKP.toFixed(1) + "%"} />
          </div>
        </div>
      ) : (
        <p className="text-nw-parchment-soft opacity-70">Loading lifetime stats…</p>
      )}

      {/* ======================================================
          WAR SWITCHER (now matches Baseline War picker style)
      ====================================================== */}
      <div className="space-y-3 mt-6">
        <label className="text-sm text-nw-parchment-soft block mb-1">
          View this player in another war:
        </label>

        <WarPicker
          wars={warsPlayerWasInSorted}
          selectedWar={currentWar}
          onSelect={(w) => onSelectWar(w)}
          outcomeByWar={outcomeByWar}
          disabled={warsPlayerWasInSorted.length === 0}
        />
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
