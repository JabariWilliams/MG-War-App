// Mercguards War Dashboard – Consolidated & Mobile-Safe Version

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

// Allowed CSV columns
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
  "Result",
];

// Build types
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
  Result?: string;
}

interface EnhancedPlayer extends Player {
  KD: string;
  buildType: Build;
}

// Build priority for group sorting
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

// Build colors
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

// Build detection
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
  if (s.includes("cw")) return "CW";
  if (s.includes("heal")) return "HEALS";
  if (s.includes("tank")) return "TANK";

  return "UNKNOWN";
};

// CSV cleaner
const normalizeCSVRow = (row: any): Player | null => {
  const cleaned: any = {};

  for (const key of Object.keys(row)) {
    const normalized = key.trim();
    if (VALID_COLUMNS.includes(normalized)) {
      cleaned[normalized] = row[key];
    }
  }

  if (!cleaned.Player) return null;

  const num = (v: any) =>
    Number(String(v || "0").replace(/,/g, "").replace("%", "")) || 0;

  return {
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
    Result: cleaned.Result ? String(cleaned.Result).trim() : "",
  };
};

// ============================
// DESKTOP SIDEMENU
// ============================
function SideMenu({
  csvFiles,
  selectedCSV,
  setSelectedCSV,
  loadPublicCSV,
  view,
  setView,
}) {
  const formatCSVName = (name: string) =>
    name.replace(".csv", "").replace(/[_-]/g, " ");

  return (
    <aside className="hidden md:block fixed left-0 top-0 h-full w-56 bg-black/60 border-r border-nw-gold/40 backdrop-blur-lg p-4 overflow-y-auto z-30"
      style={{ paddingTop: "70px" }}>
      {/* NAVIGATION */}
      <div className="mb-6">
        <div className="text-nw-gold-soft text-lg font-bold mb-3">Navigation</div>

        <button
          onClick={() => setView("dashboard")}
          className={`block w-full text-left px-3 py-2 rounded mb-1 ${
            view === "dashboard"
              ? "bg-nw-gold-soft/20 text-nw-gold-soft"
              : "text-nw-parchment-soft"
          }`}>
          Dashboard
        </button>

        <button
          onClick={() => setView("analytics")}
          className={`block w-full text-left px-3 py-2 rounded ${
            view === "analytics"
              ? "bg-nw-gold-soft/20 text-nw-gold-soft"
              : "text-nw-parchment-soft"
          }`}>
          Analytics
        </button>
      </div>

      {/* WAR LIST */}
      <div>
        <div className="text-nw-gold-soft text-lg font-bold mb-3">War Reports</div>

        <button
          onClick={() => setSelectedCSV("__none__")}
          className={`block w-full text-left px-3 py-2 rounded mb-1 ${
            selectedCSV === "__none__"
              ? "bg-nw-gold-soft/20 text-nw-gold-soft"
              : "text-nw-parchment-soft"
          }`}>
          Overview
        </button>

        {csvFiles.map((file) => (
          <button
            key={file}
            onClick={() => {
              setSelectedCSV(file);
              loadPublicCSV(file);
            }}
            className={`block w-full text-left px-3 py-2 rounded mb-1 ${
              selectedCSV === file
                ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                : "text-nw-parchment-soft"
            }`}>
            {formatCSVName(file)}
          </button>
        ))}
      </div>
    </aside>
  );
}

// ============================
// CLASS COMPARISON
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

  const primaryStat =
    selectedClass === "HEALS" || selectedClass === "TANK"
      ? "Healing"
      : "Damage";

  const filtered = players
    .filter((p) => p.buildType === selectedClass)
    .sort((a, b) => b[primaryStat] - a[primaryStat]);

  const kills = filtered.map((p) => p.Kills);
  const deaths = filtered.map((p) => p.Deaths);
  const assists = filtered.map((p) => p.Assists);
  const dmg = filtered.map((p) => p.Damage);
  const healing = filtered.map((p) => p.Healing);
  const kp = filtered.map((p) => p.KP);

  const colMinMax = {
    Kills: [Math.min(...kills), Math.max(...kills)],
    Deaths: [Math.min(...deaths), Math.max(...deaths)],
    Assists: [Math.min(...assists), Math.max(...assists)],
    Damage: [Math.min(...dmg), Math.max(...dmg)],
    Healing: [Math.min(...healing), Math.max(...healing)],
    KP: [Math.min(...kp), Math.max(...kp)],
  };

  const heat = (v, [min, max]) => {
    if (min === max) return "hsl(0, 0%, 20%)";
    const pct = (v - min) / (max - min);
    return `hsl(${pct * 120}, 40%, 28%)`;
  };

  const totals = {
    Kills: kills.reduce((a, b) => a + b, 0),
    Deaths: deaths.reduce((a, b) => a + b, 0),
    Assists: assists.reduce((a, b) => a + b, 0),
    Damage: dmg.reduce((a, b) => a + b, 0),
    Healing: healing.reduce((a, b) => a + b, 0),
    KP: kp.length ? kp.reduce((a, b) => a + b, 0) / kp.length : 0,
  };

  return (
    <section className="nw-panel p-4 mt-8">
      <h2 className="nw-title text-nw-gold-soft text-lg mb-4">
        Class Comparison (Sorted by {primaryStat})
      </h2>

      {/* CLASS DROPDOWN */}
      <div className="mb-4 flex gap-4 items-center">
        <label className="text-sm text-nw-parchment-soft/85">
          Select Class:
        </label>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 text-sm rounded border border-nw-gold/60 bg-[#2a2620] text-nw-parchment-soft/90"
        >
          {classOptions.map((cls) => (
            <option
              key={cls}
              value={cls}
              className="bg-[#1a1815] text-nw-parchment-soft"
            >
              {cls}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black/40">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Kills</th>
              <th className="px-3 py-2 text-left">Deaths</th>
              <th className="px-3 py-2 text-left">Assists</th>
              <th className="px-3 py-2 text-left">Damage</th>
              <th className="px-3 py-2 text-left">Healing</th>
              <th className="px-3 py-2 text-left">KP%</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p, i) => (
              <tr key={i} className="border-t border-nw-gold/10">
                <td className="px-3 py-2">{p.Player}</td>
                <td className="px-3 py-2" style={{ backgroundColor: heat(p.Kills, colMinMax.Kills) }}>{p.Kills}</td>
                <td className="px-3 py-2" style={{ backgroundColor: heat(p.Deaths, colMinMax.Deaths) }}>{p.Deaths}</td>
                <td className="px-3 py-2" style={{ backgroundColor: heat(p.Assists, colMinMax.Assists) }}>{p.Assists}</td>
                <td className="px-3 py-2" style={{ backgroundColor: heat(p.Damage, colMinMax.Damage) }}>{p.Damage.toLocaleString()}</td>
                <td className="px-3 py-2" style={{ backgroundColor: heat(p.Healing, colMinMax.Healing) }}>{p.Healing.toLocaleString()}</td>
                <td className="px-3 py-2" style={{ backgroundColor: heat(p.KP, colMinMax.KP) }}>{p.KP.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-nw-gold/20 bg-black/40 font-bold">
              <td className="px-3 py-2">TOTAL</td>
              <td className="px-3 py-2">{totals.Kills}</td>
              <td className="px-3 py-2">{totals.Deaths}</td>
              <td className="px-3 py-2">{totals.Assists}</td>
              <td className="px-3 py-2">{totals.Damage.toLocaleString()}</td>
              <td className="px-3 py-2">{totals.Healing.toLocaleString()}</td>
              <td className="px-3 py-2">{totals.KP.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}







//////////////////////////////////////////////////////////////
// APP COMPONENT
//////////////////////////////////////////////////////////////
export default function App() {
  const [players, setPlayers] = useState<EnhancedPlayer[]>([]);
  const [groups, setGroups] = useState<EnhancedPlayer[][]>([]);
  const [view, setView] = useState<"dashboard" | "analytics">("dashboard");
  const [loadingCSV, setLoadingCSV] = useState(false);

  // MOBILE MENU
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const exportRef = useRef<HTMLDivElement | null>(null);

  const formatCSVName = (file: string) => {
    return file
      .replace(".csv", "")
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  //////////////////////////////////////////////////////////////
  // LOAD CSV FROM /public
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
                KD: (normalized.Kills / Math.max(1, normalized.Deaths)).toFixed(
                  2,
                ),
                buildType: detectBuild(normalized.Build),
              });
            }

            setPlayers(parsed.sort((a, b) => a.Rank - b.Rank));
            setLoadingCSV(false);
          },
        });
      });
  };

  // Manual CSV upload (local)
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

        setPlayers(parsed.sort((a, b) => a.Rank - b.Rank));
      },
    });
  };

  //////////////////////////////////////////////////////////////
  // GROUP BUILDING (USING GROUP COLUMN)
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

  //////////////////////////////////////////////////////////////
  // LOAD CSV MANIFEST
  //////////////////////////////////////////////////////////////
  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedCSV, setSelectedCSV] = useState("__none__");

  useEffect(() => {
    fetch("/csv-manifest.json")
      .then((res) => res.json())
      .then((list) => setCsvFiles(list))
      .catch(() => setCsvFiles([]));
  }, []);

  //////////////////////////////////////////////////////////////
  // MOBILE MENU PANEL
  //////////////////////////////////////////////////////////////
  const MobileMenu = () => (
    <>
      {/* BACKDROP */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      {/* SLIDE-IN PANEL */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-black/80 border-r border-nw-gold/40 z-50 p-4 overflow-y-auto transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "70px" }}
      >
        {/* NAVIGATION */}
        <div className="mb-6">
          <div className="text-nw-gold-soft text-lg font-bold mb-3">
            Navigation
          </div>

          <button
            onClick={() => {
              setView("dashboard");
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded mb-1 ${
              view === "dashboard"
                ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                : "text-nw-parchment-soft"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => {
              setView("analytics");
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded ${
              view === "analytics"
                ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                : "text-nw-parchment-soft"
            }`}
          >
            Analytics
          </button>
        </div>

        {/* WAR REPORTS LIST */}
        <div>
          <div className="text-nw-gold-soft text-lg font-bold mb-3">
            War Reports
          </div>

          <button
            onClick={() => {
              setSelectedCSV("__none__");
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded mb-1 ${
              selectedCSV === "__none__"
                ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                : "text-nw-parchment-soft"
            }`}
          >
            Overview
          </button>

          {csvFiles.map((file) => (
            <button
              key={file}
              onClick={() => {
                setSelectedCSV(file);
                loadPublicCSV(file);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded mb-1 ${
                selectedCSV === file
                  ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                  : "text-nw-parchment-soft"
              }`}
            >
              {formatCSVName(file)}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  //////////////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////////////
  return (
    <div className="min-h-screen bg-nw-obsidian text-nw-parchment-soft nw-bg font-body">

      {/* LOADING OVERLAY */}
      {loadingCSV && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center animate-fadeIn">
            <div className="w-12 h-12 border-4 border-nw-gold-soft border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-nw-parchment-soft text-lg">Loading War Report…</p>
          </div>
        </div>
      )}

      {/* DESKTOP MENU */}
      <SideMenu
        csvFiles={csvFiles}
        selectedCSV={selectedCSV}
        setSelectedCSV={setSelectedCSV}
        loadPublicCSV={loadPublicCSV}
        view={view}
        setView={setView}
      />

      {/* MOBILE MENU */}
      <MobileMenu />

      {/* TOP HEADER */}
      <header className="md:sticky md:top-0 z-40 bg-black/60 backdrop-blur border-b border-nw-gold/40 px-4 py-3 flex justify-between md:ml-56 ml-0">
        <button
          className="md:hidden text-nw-gold-soft text-3xl mr-3"
          onClick={() => setMobileMenuOpen(true)}
        >
          ☰
        </button>

        <h1 className="nw-title text-nw-gold-soft text-xl">
          Mercguards War Ledger
        </h1>

        <div className="flex gap-2 text-xs items-center"></div>
      </header>

      {/* MAIN CONTENT */}
      <main
        ref={exportRef}
        className="md:ml-56 ml-0 max-w-[1800px] mx-auto px-4 py-5 space-y-6"
      >
        {/* ============================
            LANDING PAGE
        ============================ */}
        {selectedCSV === "__none__" && (
          <div className="text-center py-20 opacity-70">
            <h2 className="text-3xl mb-3 font-semibold">
              Welcome to the Mercguards War Ledger
            </h2>
            <p className="text-lg">Please select a war report from the menu.</p>
          </div>
        )}

        {/* ============================
            DASHBOARD
        ============================ */}
        {selectedCSV !== "__none__" && view === "dashboard" && (
          <>
            {/* TEAM MATCHUP */}
            {players.length > 0 && (
              <section className="nw-panel p-4 mb-6 flex justify-center text-center">
                <div className="text-center">
                  {(() => {
                    const defenderTeam =
                      players.find(
                        (p) => p.Defender && p.Defender.trim().length > 0,
                      )?.Defender || "Defenders";

                    const attackerTeam =
                      players.find(
                        (p) => p.Attacker && p.Attacker.trim().length > 0,
                      )?.Attacker || "Attackers";

                    const rawResult = players[0]?.Result
                      ? String(players[0].Result).trim().toLowerCase()
                      : "";

                    const isWin =
                      rawResult.includes("win") ||
                      rawResult === "w" ||
                      rawResult === "1" ||
                      rawResult === "victory";

                    const isLoss =
                      rawResult.includes("loss") ||
                      rawResult === "l" ||
                      rawResult === "0" ||
                      rawResult === "defeat";

                    let outcomeText = "UNDECIDED";
                    let outcomeColor = "text-yellow-300";

                    if (isWin) {
                      outcomeText = "VICTORY";
                      outcomeColor = "text-green-400";
                    } else if (isLoss) {
                      outcomeText = "DEFEAT";
                      outcomeColor = "text-red-400";
                    }

                    return (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex justify-center items-center gap-6 text-xl font-semibold">
                          <span className="text-nw-parchment-soft">
                            {defenderTeam}
                          </span>

                          <span className="text-nw-gold-soft text-3xl font-bold">
                            VS
                          </span>

                          <span className="text-nw-parchment-soft">
                            {attackerTeam}
                          </span>
                        </div>

                        <div className={`text-2xl font-bold mt-1 ${outcomeColor}`}>
                          {outcomeText}
                        </div>
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
                <div className="grid grid-cols-2 md:grid-cols-4 text-center text-sm text-nw-parchment-soft/90 divide-x divide-nw-gold/20">
                  <div className="px-2">
                    <div className="uppercase text-[28px] text-nw-parchment-soft/60">
                      Kills
                    </div>
                    <div className="text-nw-gold-soft font-semibold text-lg">
                      {players.reduce((a, p) => a + p.Kills, 0)}
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="uppercase text-[28px] text-nw-parchment-soft/60">
                      Deaths
                    </div>
                    <div className="text-nw-gold-soft font-semibold text-lg">
                      {players.reduce((a, p) => a + p.Deaths, 0)}
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="uppercase text-[28px] text-nw-parchment-soft/60">
                      KDR
                    </div>
                    <div className="text-nw-gold-soft font-semibold text-lg">
                      {(
                        players.reduce((a, p) => a + p.Kills, 0) /
                        Math.max(1, players.reduce((a, p) => a + p.Deaths, 0))
                      ).toFixed(2)}
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="uppercase text-[28px] text-nw-parchment-soft/60">
                      Avg KP
                    </div>
                    <div className="text-nw-gold-soft font-semibold text-lg">
                      {(
                        players.reduce((a, p) => a + p.KP, 0) / players.length
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>

                <div className="border-t border-nw-gold/20"></div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 text-center text-sm text-nw-parchment-soft/90 divide-x divide-nw-gold/20">
                  <div className="px-2">
                    <div className="uppercase text-[28px] text-nw-parchment-soft/60">
                      Damage
                    </div>
                    <div className="text-nw-gold-soft font-semibold text-lg">
                      {players.reduce((a, p) => a + p.Damage, 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="uppercase text-[28px] text-nw-parchment-soft/60">
                      Healing
                    </div>
                    <div className="text-nw-gold-soft font-semibold text-lg">
                      {players.reduce((a, p) => a + p.Healing, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ----------------------------------------------------
               INSIGHTS (TOP DPS, HEALER, ASSISTS, KD)
            ---------------------------------------------------- */}
            {players.length > 0 && (
              <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  ["Top DPS", "Damage"],
                  ["Top Healer", "Healing"],
                  ["Top Assists", "Assists"],
                  ["Best K/D", "KD"],
                ].map(([title, stat]) => {
                  const sorted = [...players].sort((a, b) => {
                    if (stat === "KD")
                      return parseFloat(b.KD) - parseFloat(a.KD);
                    return (b as any)[stat] - (a as any)[stat];
                  });

                  const p = sorted[0];
                  if (!p) return null;

                  const value =
                    stat === "KD" ? p.KD : (p as any)[stat].toLocaleString();

                  return (
                    <article
                      key={title}
                      className="nw-panel p-4 flex flex-col gap-3"
                    >
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

                        {/* Build badge */}
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

            {/* ----------------------------------------------------
               WAR LEDGER TABLE
            ---------------------------------------------------- */}
            {players.length > 0 && (
              <section className="nw-panel p-4">
                <h2 className="nw-title text-nw-gold-soft text-lg mb-3">
                  Ranking
                </h2>

                <div className="overflow-x-auto w-full">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-black/40">
                      <tr>
                        <th className="px-3 py-2 text-left">Rank</th>
                        <th className="px-3 py-2 text-left">Group</th>
                        <th className="px-3 py-2 text-left">Player</th>
                        <th className="px-3 py-2 text-left">Build</th>
                        <th className="px-3 py-2 text-left">Kills</th>
                        <th className="px-3 py-2 text-left">Deaths</th>
                        <th className="px-3 py-2 text-left">Assists</th>
                        <th className="px-3 py-2 text-left">Healing</th>
                        <th className="px-3 py-2 text-left">Damage</th>
                        <th className="px-3 py-2 text-right">K/D</th>
                        <th className="px-3 py-2 text-right">KP%</th>
                      </tr>
                    </thead>

                    <tbody>
                      {players.map((p, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-nw-gold/10 hover:bg-white/5"
                        >
                          <td className="px-3 py-2">{p.Rank}</td>
                          <td className="px-3 py-2">{p.Group}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {p.Player}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] uppercase border"
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
                          </td>
                          <td className="px-3 py-2">{p.Kills}</td>
                          <td className="px-3 py-2">{p.Deaths}</td>
                          <td className="px-3 py-2">{p.Assists}</td>
                          <td className="px-3 py-2">
                            {p.Healing.toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            {p.Damage.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">{p.KD}</td>
                          <td className="px-3 py-2 text-right">
                            {p.KP.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ----------------------------------------------------
               ARMY GROUPS + QDPS SQUAD
            ---------------------------------------------------- */}
            {players.length > 0 && (
              <>
                {(() => {
                  const qdpsPlayers = players.filter(
                    (p) => p.buildType === "QDPS",
                  );

                  const nonQDPS = players.filter(
                    (p) => p.buildType !== "QDPS",
                  );

                  const cleanedGroups: EnhancedPlayer[][] = Object.values(
                    nonQDPS.reduce((acc: any, p: EnhancedPlayer) => {
                      if (!acc[p.Group]) acc[p.Group] = [];
                      acc[p.Group].push(p);
                      return acc;
                    }, {}),
                  );

                  cleanedGroups.forEach((g) =>
                    g.sort(
                      (a, b) =>
                        (BUILD_PRIORITY[a.buildType] || 99) -
                        (BUILD_PRIORITY[b.buildType] || 99),
                    ),
                  );

                  const qTotals = {
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
                      {/* -------------------------
                          ARMY GROUPS
                      ------------------------- */}
                      {cleanedGroups.length > 0 && (
                        <section className="space-y-5 mb-10">
                          <h2 className="nw-title text-nw-gold-soft text-lg">
                            ARMY GROUPS
                          </h2>

                          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                            {cleanedGroups.map((g, idx) => {
                              const totalKills = g.reduce(
                                (a, p) => a + p.Kills,
                                0,
                              );
                              const totalDeaths = g.reduce(
                                (a, p) => a + p.Deaths,
                                0,
                              );
                              const totalDamage = g.reduce(
                                (a, p) => a + p.Damage,
                                0,
                              );
                              const totalHealing = g.reduce(
                                (a, p) => a + p.Healing,
                                0,
                              );

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

                                  {/* Player list */}
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
                                                  buildColors[
                                                    p.buildType
                                                  ] + "26",
                                                color: buildColors[p.buildType],
                                                borderColor:
                                                  buildColors[
                                                    p.buildType
                                                  ] + "66",
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

                      {/* -------------------------
                          QDPS Squad
                      ------------------------- */}
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
                                {qTotals.kills}/{qTotals.deaths}
                              </div>

                              <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                                Total Damage
                              </div>
                              <div className="text-right">
                                {qTotals.damage.toLocaleString()}
                              </div>

                              <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                                Total Healing
                              </div>
                              <div className="text-right">
                                {qTotals.healing.toLocaleString()}
                              </div>

                              <div className="uppercase text-[10px] text-nw-parchment-soft/60">
                                Avg KP
                              </div>
                              <div className="text-right">
                                {qTotals.avgKP.toFixed(1)}%
                              </div>
                            </div>

                            <hr className="border-nw-gold/20 my-3" />

                            {/* Player list */}
                            <ul className="space-y-3">
                              {qdpsPlayers.map((p) => (
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

        {/* ----------------------------------------------------
           ANALYTICS SECTION (Class Comparison + Charts)
        ---------------------------------------------------- */}
        {view === "analytics" && players.length > 0 && (
          <>
            {/* CLASS COMPARISON */}
            <ClassComparison players={players} />

            {/* DAMAGE BY PLAYER CHART */}
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
                <ResponsiveContainer width="100%" height="100%">
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
                      formatter={(v: any) => v.toLocaleString()}
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

            {/* K/D CURVE */}
            <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">
              <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
                K/D Curve
              </h2>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
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
                      formatter={(v: any) => v.toFixed(2)}
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
                      dot={{
                        r: 4,
                        fill: "#f6d190",
                        stroke: "#3a2a14",
                        strokeWidth: 1,
                      }}
                      activeDot={{ r: 6, fill: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* KP% DISTRIBUTION */}
            <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw">
              <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
                KP% Distribution
              </h2>

              <div className="overflow-x-auto w-full">
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
                          <tr
                            key={i}
                            className="border-t border-nw-gold/10"
                            style={{ backgroundColor: bg }}
                          >
                            <td className="px-3 py-2">{row.Player}</td>
                            <td className="px-3 py-2 font-semibold">
                              {row.KP.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* TOP 15 DEATHS */}
            <section className="nw-panel p-4 mt-8 rounded-xl shadow-nw mb-10">
              <h2 className="nw-title text-sm md:text-lg text-nw-gold-soft mb-4">
                Top 15 Deaths
              </h2>

              {(() => {
                const rows = [...players]
                  .map((p) => ({ Player: p.Player, Deaths: p.Deaths }))
                  .sort((a, b) => b.Deaths - a.Deaths)
                  .slice(0, 15);

                const max = rows[0]?.Deaths ?? 1;

                return (
                  <div className="overflow-x-auto w-full">
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
                          const bg = `hsl(${(1 - pct) * 195}, 45%, ${
                            29 + (1 - pct) * 15
                          }%)`;

                          return (
                            <tr
                              key={i}
                              className="border-t border-nw-gold/10"
                              style={{ backgroundColor: bg }}
                            >
                              <td className="px-3 py-2 font-medium">
                                {row.Player}
                              </td>
                              <td className="px-3 py-2 font-semibold">
                                {row.Deaths}
                              </td>
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
