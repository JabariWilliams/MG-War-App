// ===============================
// Build Types
// ===============================
export type Build =
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

export function detectBuild(raw: string | undefined): Build {
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
}

// ===============================
// Player Interface
// ===============================
export interface EnhancedPlayer {
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
  KD: string;
  Defender: string;
  Attacker: string;
  buildType: Build;
  Result: string;
  Full: string; // yes/no war-level flag
}

// ===============================
// Normalize CSV Row
// ===============================
export function normalizeCSVRow(raw: any): EnhancedPlayer | null {
  if (!raw.Player) return null;

  const num = (v: any) =>
    Number(String(v || "0").replace(/,/g, "").replace("%", "")) || 0;

  // ⭐ Normalize Full once — row-level, but used WAR-LEVEL in loader
  const rawFull = raw.Full ? String(raw.Full).trim().toLowerCase() : "";
  const fullNormalized =
    rawFull === "no" || rawFull === "n" || rawFull === "false"
      ? "no"
      : "yes";

  const kills = num(raw.Kills);
  const deaths = num(raw.Deaths);

  return {
    Rank: num(raw.Rank),
    Group: num(raw.Group),
    Build: String(raw.Build || "").trim(),
    Player: String(raw.Player || "").trim(),
    Kills: kills,
    Deaths: deaths,
    Assists: num(raw.Assists),
    Healing: num(raw.Healing),
    Damage: num(raw.Damage),
    KP: num(raw["KP %"] ?? raw["KP%"] ?? 0),
    KD: (kills / Math.max(1, deaths)).toFixed(2),
    Defender: raw.Defender ? String(raw.Defender).trim() : "",
    Attacker: raw.Attacker ? String(raw.Attacker).trim() : "",
    Result: raw.Result ? String(raw.Result).trim() : "",
    Full: fullNormalized, // now used ONLY at war-level externally
    buildType: detectBuild(String(raw.Build || "")),
  };
}

// ===============================
// Parse CSV Text (legacy)
// ===============================
export function parseCsvText(text: string): EnhancedPlayer[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const delimiter = text.includes("\t") ? "\t" : ",";

  const header = lines.shift()!.split(delimiter).map((h) => h.trim());

  const players: EnhancedPlayer[] = [];

  for (const line of lines) {
    const cols = line.split(delimiter).map((c) => c.trim());
    const row: any = {};

    header.forEach((h, i) => (row[h] = cols[i]));

    const normalized = normalizeCSVRow(row);
    if (normalized) players.push(normalized);
  }

  return players;
}

// ===============================
// Group helper
// ===============================
export function groupByGroup(players: EnhancedPlayer[]): EnhancedPlayer[][] {
  const map: Record<number, EnhancedPlayer[]> = {};

  for (const p of players) {
    if (!map[p.Group]) map[p.Group] = [];
    map[p.Group].push(p);
  }

  return Object.values(map).sort((a, b) => a[0].Group - b[0].Group);
}
