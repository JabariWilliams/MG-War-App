import { Build, detectBuild } from "./buildClassifier";

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
}

export function parseCsvText(text: string): EnhancedPlayer[] {
  const rows = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const header = rows.shift()!.split(",").map((h) => h.trim());

  const players: EnhancedPlayer[] = [];

  for (const line of rows) {
    const cols = line.split(",").map((c) => c.trim());
    const row: any = {};
    header.forEach((h, i) => (row[h] = cols[i]));

    const kills = Number(row["Kills"]);
    const deaths = Number(row["Deaths"]);
    const assists = Number(row["Assists"]);
    const healing = Number(row["Healing"]);
    const damage = Number(row["Damage"]);
    const kp = Number(row["KP %"]);

    const buildType = detectBuild({
      rawBuild: row["Build"],
      playerName: row["Player"],
      kills,
      deaths,
      damage,
      healing
    });

    players.push({
      Rank: Number(row["Rank"]),
      Group: Number(row["Group"]),
      Build: row["Build"],
      Player: row["Player"],
      Kills: kills,
      Deaths: deaths,
      Assists: assists,
      Healing: healing,
      Damage: damage,
      KP: kp,
      KD: (kills / Math.max(deaths, 1)).toFixed(2),
      Defender: cleaned.Defender ? String(cleaned.Defender).trim() : "",
      Attacker: cleaned.Attacker ? String(cleaned.Attacker).trim() : "",
      buildType
    });
  }

  return players;
}

export function groupByGroup(players: EnhancedPlayer[]): EnhancedPlayer[][] {
  const map: Record<number, EnhancedPlayer[]> = {};
  for (const p of players) {
    if (!map[p.Group]) map[p.Group] = [];
    map[p.Group].push(p);
  }
  return Object.values(map).sort((a, b) => a[0].Group - b[0].Group);
}
