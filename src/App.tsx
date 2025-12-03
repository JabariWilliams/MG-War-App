// Mercguards War Dashboard – New World Theme (Corrected CSV Parser)
// This version fixes:
// - Column explosion (Player_1, Kills_1, ...)
// - Whitelists proper CSV columns
// - Correct build handling
// - Correct KP % handling
// - Authoritative Group column
// - No duplicate or malformed columns
// - Improved readability

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

// Allowed columns – everything else is ignored
const VALID_COLUMNS = [
  "Rank",
  "Group",
  "Build",
  "Player",
  "Kills",
  "Deaths",
  "Assists",
  "Healing",
  "Damage",
  "KP %",
  "KP%",
  "Defender",
  "Attacker",
];

type Build =
  | "FLAIL"
  | "QDPS"
  | "BRUISER"
  | "DISRUPTOR"
  | "BBX"
  | "VGIG"
  | "FSX"
  | "DEX"
  | "CW"
  | "HEALS"
  | "TANK"
  | "UNKNOWN";

interface Player {
  Rank: number;
  Group: number;
  Build: string;
  Player: string;
  Kills: number;
  Deaths: number;
  Assists: number;
  Healing: number;
  Damage: number;
  KP: number;
  Defender?: string;
  Attacker?: string;
}

interface EnhancedPlayer extends Player {
  KD: string;
  buildType: Build;
}

// Authoritative build ordering for group rows
const BUILD_PRIORITY: Record<string, number> = {
  BRUISER: 1,
  DISRUPTOR: 2,
  QDPS: 3,
  DEX: 4,
  VGIG: 5,
  FSX: 6,
  BBX: 7,
  CW: 8,
  TANK: 9,
  HEALS: 10,
  UNKNOWN: 11,
};

// Color theme for builds
const buildColors: Record<Build, string> = {
  FLAIL: "#c4a26a",
  QDPS: "#ff4d4d",
  BRUISER: "#ff6a3d",
  DISRUPTOR: "#e89d24",
  BBX: "#e0a840",
  VGIG: "#f5cf42",
  FSX: "#f38b3b",
  DEX: "#3b82f6",
  CW: "#6366f1",
  HEALS: "#4ade80",
  TANK: "#22c1d6",
  UNKNOWN: "#9ca3af",
};

//////////////////////////////////////////////////////////////
// BUILD DETECTION
//////////////////////////////////////////////////////////////
const detectBuild = (raw: string): Build => {
  if (!raw) return "UNKNOWN";

  const s = raw.toLowerCase();

  if (s.includes("flail")) return "FLAIL";
  if (s.includes("qdps")) return "QDPS";
  if (s.includes("bruis")) return "BRUISER";
  if (s.includes("disr")) return "DISRUPTOR";
  if (s.includes("bb") || s.includes("blunder")) return "BBX";
  if (s.includes("vg") || s.includes("void") || s.includes("ig")) return "VGIG";
  if (s.includes("fs") || s.includes("fire")) return "FSX";
  if (s.includes("dex") || s.includes("bow") || s.includes("musket")) return "DEX";
  if (s.includes("cw") || s.includes("crescent wave")) return "CW";
  if (s.includes("heal")) return "HEALS";
  if (s.includes("tank")) return "TANK";

  return "UNKNOWN";
};

//////////////////////////////////////////////////////////////
// CSV PARSER – CLEAN & STRICT
//////////////////////////////////////////////////////////////
const normalizeCSVRow = (row: any): Player | null => {
  // The CSV may include garbage keys; keep only whitelist
  const cleaned: any = {};

  for (const key of Object.keys(row)) {
    const normalized = key.trim();
    if (VALID_COLUMNS.includes(normalized)) {
      cleaned[normalized] = row[key];
    }
  }

  // Must have player name
  if (!cleaned.Player) return null;

  // Parse numeric values safely
  const num = (v: any) =>
    Number(String(v || "0").replace(/,/g, "").replace("%", "")) || 0;

 const p: Player = {
  Rank: num(cleaned.Rank),
  Group: num(cleaned.Group),
  Build: String(cleaned.Build || "").trim(),
  Player: String(cleaned.Player || "").trim(),
  Kills: num(cleaned.Kills),
  Deaths: num(cleaned.Deaths),
  Assists: num(cleaned.Assists),
  Healing: num(cleaned.Healing),
  Damage: num(cleaned.Damage),
  KP: num(cleaned["KP %"] ?? cleaned["KP%"] ?? 0),
  Defender: cleaned.Defender ? String(cleaned.Defender).trim() : "",
  Attacker: cleaned.Attacker ? String(cleaned.Attacker).trim() : "",
};


  return p;
};

//////////////////////////////////////////////////////////////
// APP
//////////////////////////////////////////////////////////////
export default function App() {
  const [players, setPlayers] = useState<EnhancedPlayer[]>([]);
  const [groups, setGroups] = useState<EnhancedPlayer[][]>([]);
  const [view, setView] = useState<"dashboard" | "analytics">("dashboard");
const [loadingCSV, setLoadingCSV] = useState(false);
{loadingCSV && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center animate-fadeIn">
      <div className="w-12 h-12 border-4 border-nw-gold-soft border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-nw-parchment-soft text-lg tracking-wide">
        Loading War Report…
      </p>
    </div>
  </div>
)}

  const exportRef = useRef<HTMLDivElement | null>(null);
const formatCSVName = (file: string) => {
  return file
    .replace(".csv", "")     // remove .csv
    .replace(/_/g, " ")      // replace underscores
    .replace(/-/g, " ")      // replace hyphens
    .replace(/\s+/g, " ")    // normalize spacing
    .replace(/\b\w/g, c => c.toUpperCase()); // capitalize words
};

  //////////////////////////////////////////////////////////////
  // CSV UPLOAD
  //////////////////////////////////////////////////////////////
  const loadPublicCSV = (filename: string) => {
	  setLoadingCSV(true);
  fetch(`/${filename}`)
    .then((res) => res.text())
    .then((csvText) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: ({ data }) => {
          const parsed: EnhancedPlayer[] = [];

          for (const row of data as any[]) {
            const normalized = normalizeCSVRow(row);
            if (!normalized) continue;

            parsed.push({
              ...normalized,
              KD: (normalized.Kills / Math.max(1, normalized.Deaths)).toFixed(2),
              buildType: detectBuild(normalized.Build),
            });
          }

          setPlayers(parsed.sort((a, b) => a.Rank - b.Rank));
		  setLoadingCSV(false);
        },
      });
    });
};

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const parsed: EnhancedPlayer[] = [];

        for (const row of data as any[]) {
          const normalized = normalizeCSVRow(row);
          if (!normalized) continue;

          parsed.push({
            ...normalized,
            KD: (normalized.Kills / Math.max(1, normalized.Deaths)).toFixed(2),
            buildType: detectBuild(normalized.Build),
          });
        }

        setPlayers(
          parsed.sort((a, b) => a.Rank - b.Rank) // ensure correct ordering
        );
      },
    });
  };

  //////////////////////////////////////////////////////////////
  // GROUP BUILDING (Authoritative Group column)
  //////////////////////////////////////////////////////////////
  useEffect(() => {
    if (players.length === 0) return;

    const byGroup: Record<number, EnhancedPlayer[]> = {};

    for (const p of players) {
      if (!byGroup[p.Group]) byGroup[p.Group] = [];
      byGroup[p.Group].push(p);
    }

    const sortedGroups = Object.keys(byGroup)
      .map((g) => Number(g))
      .sort((a, b) => a - b)
      .map((g) => byGroup[g]);

    setGroups(sortedGroups);
  }, [players]);

// ============================
// COMPONENT: CLASS COMPARISON (WITH HEATMAP)
// ============================
function ClassComparison({ players }) {
  const [selectedClass, setSelectedClass] = useState("BRUISER");

  const classOptions = [
    "BRUISER",
    "QDPS",
    "DISRUPTOR",
    "DEX",
    "VGIG",
    "FSX",
    "BBX",
    "CW",
    "HEALS",
    "TANK",
    "FLAIL",
    "UNKNOWN",
  ];

  const filtered = players
    .filter((p) => p.buildType === selectedClass)
    .sort((a, b) => b.Damage - a.Damage);

  // Column extract helpers
  const kills = filtered.map((p) => p.Kills);
  const deaths = filtered.map((p) => p.Deaths);
  const assists = filtered.map((p) => p.Assists);
  const dmg = filtered.map((p) => p.Damage);
  const kp = filtered.map((p) => p.KP);

  // get min/max for each stat inside the selected class
  const colMinMax = {
    Kills: [Math.min(...kills), Math.max(...kills)],
    Deaths: [Math.min(...deaths), Math.max(...deaths)],
    Assists: [Math.min(...assists), Math.max(...assists)],
    Damage: [Math.min(...dmg), Math.max(...dmg)],
    KP: [Math.min(...kp), Math.max(...kp)],
  };

  // function to convert stat value → heat color
  const heat = (value, [min, max]) => {
    if (max === min) return "hsl(0, 0%, 25%)"; // flat values
    const pct = (value - min) / (max - min);
    return `hsl(${pct * 120}, 55%, 30%)`; // softened red→green

  };

  return (
    <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">

      <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
        Class Comparison
      </h2>

      {/* SELECTOR */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm text-nw-parchment-soft/85">
          Select Class:
        </label>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 text-sm rounded border border-nw-gold/60"
          style={{
            backgroundColor: "#2a2620",
            color: "#f8f3e6",
          }}
        >
          {classOptions.map((c) => (
            <option
              key={c}
              value={c}
              style={{
                backgroundColor: "#1a1815",
                color: "#f8f3e6",
              }}
            >
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black/40">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Kills</th>
              <th className="px-3 py-2 text-left">Deaths</th>
              <th className="px-3 py-2 text-left">Assists</th>
              <th className="px-3 py-2 text-left">Damage</th>
              <th className="px-3 py-2 text-left">KP%</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p, i) => (
              <tr key={i} className="border-t border-nw-gold/10 hover:bg-white/5">

                <td className="px-3 py-2 font-medium">{p.Player}</td>

                {/* KILLS */}
                <td
                  className="px-3 py-2 font-semibold"
                  style={{ backgroundColor: heat(p.Kills, colMinMax.Kills) }}
                >
                  {p.Kills}
                </td>

                {/* DEATHS (lower is better → invert the scale) */}
                <td
                  className="px-3 py-2 font-semibold"
                  style={{
                    backgroundColor: heat(
                      colMinMax.Deaths[1] - (p.Deaths - colMinMax.Deaths[0]),
                      [0, colMinMax.Deaths[1] - colMinMax.Deaths[0]]
                    ),
                  }}
                >
                  {p.Deaths}
                </td>

                {/* ASSISTS */}
                <td
                  className="px-3 py-2 font-semibold"
                  style={{ backgroundColor: heat(p.Assists, colMinMax.Assists) }}
                >
                  {p.Assists}
                </td>

                {/* DAMAGE */}
                <td
                  className="px-3 py-2 font-semibold"
                  style={{ backgroundColor: heat(p.Damage, colMinMax.Damage) }}
                >
                  {p.Damage.toLocaleString()}
                </td>

                {/* KP% */}
                <td
                  className="px-3 py-2 font-semibold"
                  style={{ backgroundColor: heat(p.KP, colMinMax.KP) }}
                >
                  {p.KP.toFixed(1)}%
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const [csvFiles, setCsvFiles] = useState<string[]>([]);

// Load manifest at startup
useEffect(() => {
  fetch("/csv-manifest.json")
    .then((res) => res.json())
    .then((list) => setCsvFiles(list))
    .catch(() => setCsvFiles([])); // fallback
}, []);
const [selectedCSV, setSelectedCSV] = useState("__none__");

  //////////////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////////////
  return (
    <div className="min-h-screen bg-nw-obsidian text-nw-parchment-soft nw-bg font-body">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur border-b border-nw-gold/40 px-4 py-3 flex justify-between">
        <h1 className="nw-title text-nw-gold-soft text-xl">Mercguards War Ledger</h1>

        <div className="flex gap-2 text-xs items-center">
          <select
  className="nw-panel px-2 py-1 cursor-pointer text-xs border border-nw-gold/40"
  value={selectedCSV}
  onChange={(e) => {
    const file = e.target.value;
    if (file === "__none__") {
      setPlayers([]);        // Clear data
      setSelectedCSV("__none__");
      return;
    }
    setSelectedCSV(file);
    loadPublicCSV(file);
  }}
  style={{ backgroundColor: "#2a2620", color: "#f8f3e6" }}
>
  <option value="__none__">None</option>

  {csvFiles.map((file) => (
    <option
      key={file}
      value={file}
      style={{ backgroundColor: "#1a1815", color: "#f8f3e6" }}
    >
      {formatCSVName(file)}
    </option>
  ))}
</select>



          <button
            onClick={() => setView("dashboard")}
            className={`px-3 py-1 border ${
              view === "dashboard" ? "border-nw-gold text-nw-gold-soft" : "border-nw-gold/40"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setView("analytics")}
            className={`px-3 py-1 border ${
              view === "analytics" ? "border-nw-gold text-nw-gold-soft" : "border-nw-gold/40"
            }`}
          >
            Analytics
          </button>

        </div>
      </header>

      <main ref={exportRef} className="max-w-[1800px] mx-auto px-4 py-5 space-y-6">
        {/* ----------------------------------------------------
        DASHBOARD
        ---------------------------------------------------- */}
        {view === "dashboard" && (
          <>

{/* ----------------------------------------------------
TEAM MATCHUP — DEFENDER VS ATTACKER
---------------------------------------------------- */}
{players.length > 0 && (
  <section className="nw-panel p-4 mb-6 mx-auto flex justify-center items-center text-center">

    <div className="text-center">


      {(() => {
        // Explicitly read from Defender / Attacker CSV columns
const defenderTeam =
  players.find((p) => p.Defender && p.Defender.trim().length > 0)?.Defender ||
  "Defenders";

const attackerTeam =
  players.find((p) => p.Attacker && p.Attacker.trim().length > 0)?.Attacker ||
  "Attackers";


        return (
          <div className="flex justify-center items-center gap-6 text-xl font-semibold">
            <span className="text-nw-parchment-soft">{defenderTeam}</span>

            <span className="text-nw-gold-soft text-3xl font-bold">
              VS
            </span>

            <span className="text-nw-parchment-soft">{attackerTeam}</span>
          </div>
        );
      })()}
    </div>
  </section>
)}


{/* ----------------------------------------------------
ARMY TOTALS — FULL WAR STATS
---------------------------------------------------- */}
{players.length > 0 && (
  <section className="nw-panel p-4 mb-4 space-y-6">

    {/* Row 1 */}
    <div className="
      grid grid-cols-4 text-center text-sm text-nw-parchment-soft/90
      divide-x divide-nw-gold/20
    ">
      <div className="px-2">
        <div className="uppercase text-[28px] text-nw-parchment-soft/60">Kills</div>
        <div className="text-nw-gold-soft font-semibold text-lg">
          {players.reduce((a, p) => a + p.Kills, 0)}
        </div>
      </div>

      <div className="px-2">
        <div className="uppercase text-[28px] text-nw-parchment-soft/60">Deaths</div>
        <div className="text-nw-gold-soft font-semibold text-lg">
          {players.reduce((a, p) => a + p.Deaths, 0)}
        </div>
      </div>

      <div className="px-2">
        <div className="uppercase text-[28px] text-nw-parchment-soft/60">KDR</div>
        <div className="text-nw-gold-soft font-semibold text-lg">
          {(
            players.reduce((a, p) => a + p.Kills, 0) /
            Math.max(1, players.reduce((a, p) => a + p.Deaths, 0))
          ).toFixed(2)}
        </div>
      </div>

      <div className="px-2">
        <div className="uppercase text-[28px] text-nw-parchment-soft/60">Avg KP</div>
        <div className="text-nw-gold-soft font-semibold text-lg">
          {(
            players.reduce((a, p) => a + p.KP, 0) / players.length
          ).toFixed(1)}%
        </div>
      </div>
    </div>
<div className="border-t border-nw-gold/20"></div>

    {/* Row 2 */}
    <div className="
      grid grid-cols-2 text-center text-sm text-nw-parchment-soft/90
      divide-x divide-nw-gold/20
    ">
      <div className="px-2">
        <div className="uppercase text-[28px] text-nw-parchment-soft/60">Damage</div>
        <div className="text-nw-gold-soft font-semibold text-lg">
          {players.reduce((a, p) => a + p.Damage, 0).toLocaleString()}
        </div>
      </div>

      <div className="px-2">
        <div className="uppercase text-[28px] text-nw-parchment-soft/60">Healing</div>
        <div className="text-nw-gold-soft font-semibold text-lg">
          {players.reduce((a, p) => a + p.Healing, 0).toLocaleString()}
        </div>
      </div>
    </div>

  </section>
)}


{/* Insights */}
{players.length > 0 && (
  <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[
      ["Top DPS", "Damage"],
      ["Top Healer", "Healing"],
      ["Top Assists", "Assists"],
      ["Best K/D", "KD"],
    ].map(([title, stat]) => {
      const sorted = [...players].sort((a, b) => {
        if (stat === "KD") return parseFloat(b.KD) - parseFloat(a.KD);
        return (b as any)[stat] - (a as any)[stat];
      });

      const p = sorted[0];
      if (!p) return null;

      const value =
        stat === "KD" ? p.KD : (p as any)[stat].toLocaleString();

      const miniData =
        stat === "KD"
          ? [{ name: "KD", value: parseFloat(p.KD) }]
          : [{ name: stat, value: (p as any)[stat] }];

      return (
        <article key={title} className="nw-panel p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs text-nw-gold-soft uppercase tracking-widest">
                {title}
              </h2>
              <p className="text-lg font-semibold">{p.Player}</p>
              <p className="text-[17px] text-nw-parchment-soft/85">
                {stat}: {value}
              </p>
            </div>

            {/* Build chip */}
            <span
              className="px-2 py-0.5 rounded-full text-[15px] uppercase border"
              style={{
                backgroundColor: buildColors[p.buildType] + "26",
                color: buildColors[p.buildType],
                borderColor: buildColors[p.buildType] + "66",
              }}
            >
              {p.buildType}
            </span>
          </div>

          
        </article>
      );
    })}
  </section>
)}





            {/* War Ledger */}
            {players.length > 0 && (
              <section className="nw-panel p-4">
                <h2 className="nw-title text-nw-gold-soft text-lg mb-3">
                  Ranking
                </h2>

                <div className="overflow-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-black/40">
                      <tr>
                        <th className="px-3 py-2 text-left text-[13px]">
Rank</th>
                        <th className="px-3 py-2 text-left text-[13px]">
Group</th>
                        <th className="px-3 py-2 text-left text-[13px]">
Player</th>
                        <th className="px-3 py-2 text-left text-[13px]">
Build</th>
                        <th className="px-3 py-2 text-left text-[13px]">
Kills</th>
                        <th className="px-3 py-2 text-left text-[13px]">
Deaths</th>
                        <th className="px-3 py-2 text-left text-[13px]">
Assists</th>
                        <th className="px-3 py-2 text-left text-[13px]">
Healing</th>
                        <th className="px-3 py-2 text-left text-[13px]">
Damage</th>
                        <th className="px-3 py-2 text-right">K/D</th>
                        <th className="px-3 py-2 text-right">KP%</th>
                      </tr>
                    </thead>

                    <tbody>
                      {players.map((p, idx) => (
                        <tr key={idx} className="border-t border-nw-gold/10 hover:bg-white/5">
                          <td className="px-3 py-2">{p.Rank}</td>
                          <td className="px-3 py-2">{p.Group}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{p.Player}</td>
                          <td className="px-3 py-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] uppercase"

                              style={{
                                backgroundColor: buildColors[p.buildType] + "26",
                                color: buildColors[p.buildType],
                                border: `1px solid ${buildColors[p.buildType]}66`,
                              }}
                            >
                              {p.buildType}
                            </span>
                          </td>
                          <td className="px-3 py-2">{p.Kills}</td>
                          <td className="px-3 py-2">{p.Deaths}</td>
                          <td className="px-3 py-2">{p.Assists}</td>
                          <td className="px-3 py-2">{p.Healing.toLocaleString()}</td>
                          <td className="px-3 py-2">{p.Damage.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{p.KD}</td>
                          <td className="px-3 py-2 text-right">{p.KP.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

{/* ============================
     ARMY GROUPS  (NON-QDPS FIRST)
   ============================ */}

{players.length > 0 && (
  <>
    {(() => {
      // Pull QDPS
      const qdpsPlayers = players.filter((p) => p.buildType === "QDPS");

      // Everything else goes into normal groups
      const nonQDPS = players.filter((p) => p.buildType !== "QDPS");

      // Rebuild groups
      const cleanedGroups: EnhancedPlayer[][] = Object.values(
        nonQDPS.reduce((acc: any, p: EnhancedPlayer) => {
          if (!acc[p.Group]) acc[p.Group] = [];
          acc[p.Group].push(p);
          return acc;
        }, {})
      );

      // Sort inside groups by build priority
      cleanedGroups.forEach((g) =>
        g.sort(
          (a, b) =>
            (BUILD_PRIORITY[a.buildType] || 99) -
            (BUILD_PRIORITY[b.buildType] || 99)
        )
      );

      // QDPS totals
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

          {/* ============================
               ARMY GROUPS SHOWN FIRST
             ============================ */}
          {cleanedGroups.length > 0 && (
            <section className="space-y-5 mb-10">
              <h2 className="nw-title text-nw-gold-soft text-lg">
                ARMY GROUPS
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {cleanedGroups.map((g, idx) => {
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
										  
                      <header className="flex justify-between items-start gap-3">
                        <h3 className="font-semibold text-nw-parchment-soft tracking-wide text-lg">
                          Group {groupNum}
                        </h3>

                        <div className="text-right text-[11px] px-3 py-1 rounded-full border border-nw-gold/40 bg-black/30 text-nw-parchment-soft/85 font-semibold tracking-wide">
                          Total K/D:{" "}
                          <span className="text-nw-gold-soft">
                            {totalKills}/{totalDeaths}
                          </span>
                        </div>
                      </header>

                      {/* Totals */}
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
                        <div className="text-right">
                          {avgKP.toFixed(1)}%
                        </div>
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

                            <div className="mt-0.5 grid grid-cols-[1fr_auto_1fr] text-[11px] text-nw-parchment-soft/90 tracking-tight">
                              <span className="text-left">
                                DMG: {p.Damage.toLocaleString()}
                              </span>
                              <span className="text-center">
                                HEALS: {p.Healing.toLocaleString()}
                              </span>
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

          {/* ============================
               DPS SQUAD (QDPS) BELOW GROUPS
             ============================ */}
          {qdpsPlayers.length > 0 && (
  <section className="space-y-5 mb-10">
    <h2 className="nw-title text-nw-gold-soft text-lg">
      QUAD DPS
    </h2>
<div className="nw-panel p-4 text-xs flex flex-col gap-3">
              {/* Totals */}
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
                            backgroundColor: buildColors[p.buildType] + "26",
                            color: buildColors[p.buildType],
                            borderColor: buildColors[p.buildType] + "66",
                          }}
                        >
                          {p.buildType}
                        </span>
                      </div>

                      <span className="text-xs text-nw-gold-soft font-semibold flex-shrink-0">
                        {p.Kills}/{p.Deaths}
                      </span>
                    </div>

                    <div className="mt-0.5 grid grid-cols-[1fr_auto_1fr] text-[11px] text-nw-parchment-soft/90 tracking-tight">
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
    })()}
  </>
)}

          </>
        )}
		
		


{/* ============================
    CLASS COMPARISON SECTION
============================ */}
{view === "analytics" && players.length > 0 && (
  <ClassComparison players={players} />
)}


{/* ============================
    ANALYTICS — DAMAGE BY PLAYER
============================ */}
{players.length > 0 && view === "analytics" && (
  <>
    {/* DAMAGE BY PLAYER */}
    <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">
      <header className="flex items-baseline justify-between mb-2">
        <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft">
          DAMAGE BY PLAYER
        </h2>
        <p className="text-[11px] text-nw-parchment-soft/85">
          Sorted highest to lowest. Healers removed.
        </p>
      </header>

      <div className="h-96">
        <ResponsiveContainer>
          <BarChart
            data={[...players]
              .filter((p) => p.buildType !== "HEALS")
              .sort((a, b) => b.Damage - a.Damage)}
            margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
          >
            <defs>
              <linearGradient id="damageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f6d190" />
                <stop offset="60%" stopColor="#d79a32" />
                <stop offset="100%" stopColor="#8a5a18" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="Player"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={90}
              tick={{ fontSize: 10, fill: "#f8f3e6" }}
            />

            <YAxis
              tickFormatter={(v) => v.toLocaleString()}
              tick={{ fontSize: 11, fill: "#f8f3e6" }}
            />

            <Tooltip
              formatter={(v) => v.toLocaleString()}
              contentStyle={{
                background: "#1d1b16",
                border: "1px solid #c6a675",
                borderRadius: "0.5rem",
                color: "#f8f3e6",
              }}
              labelStyle={{ color: "#f8f3e6" }}
            />

            <Bar
              dataKey="Damage"
              fill="url(#damageGrad)"
              stroke="#3a2a14"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>


    {/* ============================
        ANALYTICS — K/D CURVE (LINE GRAPH)
    ============================ */}
    <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">
      <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
        K/D Curve
      </h2>

      <div className="h-96">
        <ResponsiveContainer>
          <LineChart
            data={[...players]
              .map((p) => ({ Player: p.Player, KD: parseFloat(p.KD) }))
              .sort((a, b) => b.KD - a.KD)}
            margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4a473d" />

            <XAxis
              dataKey="Player"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={90}
              tick={{ fontSize: 10, fill: "#f8f3e6" }}
            />

            <YAxis tick={{ fill: "#f8f3e6" }} domain={[0, "dataMax + 1"]} />

            <Tooltip
              formatter={(v) => v.toFixed(2)}
              contentStyle={{
                background: "#1d1b16",
                border: "1px solid #c6a675",
                borderRadius: "0.5rem",
                color: "#f8f3e6",
              }}
              labelStyle={{ color: "#f8f3e6" }}
            />

            <Line
              type="monotone"
              dataKey="KD"
              stroke="#d7b56d"
              strokeWidth={3}
              dot={{ r: 4, fill: "#f6d190", stroke: "#3a2a14", strokeWidth: 1 }}
              activeDot={{ r: 6, fill: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>


    {/* ============================
        ANALYTICS — KP% DISTRIBUTION TABLE
    ============================ */}
    <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">
      <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
        KP% Distribution
      </h2>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black/40">
            <tr>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-left">KP%</th>
            </tr>
          </thead>
          <tbody>
            {[...players]
              .map((p) => ({ Player: p.Player, KP: p.KP }))
              .sort((a, b) => b.KP - a.KP)
              .map((row, i, arr) => {
                const max = arr[0].KP;
                const min = arr[arr.length - 1].KP;
                const pct = (row.KP - min) / Math.max(1, max - min);
                const bg = `hsl(${pct * 180}, 40%, ${20 + pct * 20}%)`;

                return (
                  <tr key={i} className="border-t border-nw-gold/10" style={{ backgroundColor: bg }}>
                    <td className="px-3 py-2">{row.Player}</td>
                    <td className="px-3 py-2 font-semibold">{row.KP.toFixed(1)}%</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>


    

    {/* ============================
    ANALYTICS — TOP 15 DEATHS (PLAYERS)
============================ */}
<section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">
  <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
    Top 15 Deaths
  </h2>

  {(() => {
    const rows = [...players]
      .map((p) => ({ Player: p.Player, Deaths: p.Deaths }))
      .sort((a, b) => b.Deaths - a.Deaths)
      .slice(0, 15); // TAKE TOP 15

    const max = rows[0]?.Deaths ?? 1;

    return (
      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black/40">
            <tr>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-left">Deaths</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const pct = row.Deaths / max;

              // Muted NW-themed gradient (red → amber → teal)
              const bg = `hsl(${(1 - pct) * 195}, 45%, ${29 + (1 - pct) * 15}%)`;

              return (
                <tr
                  key={i}
                  className="border-t border-nw-gold/10"
                  style={{ backgroundColor: bg }}
                >
                  <td className="px-3 py-2 font-medium">{row.Player}</td>
                  <td className="px-3 py-2 font-semibold">{row.Deaths}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  })()}
</section>


  </>
)}












      </main>
    </div>
  );
}
