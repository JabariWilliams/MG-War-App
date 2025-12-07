import { useState, useEffect } from "react";
import Papa from "papaparse";
import { EnhancedPlayer, normalizeCSVRow, detectBuild } from "../utils/csvParser";

export default function useCSVLoader() {
  const [players, setPlayers] = useState<EnhancedPlayer[]>([]);
  const [groups, setGroups] = useState<EnhancedPlayer[][]>([]);
  const [loadingCSV, setLoadingCSV] = useState(false);

  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedCSV, setSelectedCSV] = useState("__none__");

  // store all wars
  const [allPlayersByWar, setAllPlayersByWar] =
    useState<Record<string, EnhancedPlayer[]>>({});

  // ----------------------------------------------------
  // Load ONE CSV (current war)
  // ----------------------------------------------------
  const loadPublicCSV = async (filename: string) => {
    setLoadingCSV(true);

    const text = await fetch(`/${filename}`).then((r) => r.text());
    const rows: any[] = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    const parsed: EnhancedPlayer[] = rows
      .map((row) => normalizeCSVRow(row))
      .filter(Boolean)
      .map((p: any) => ({
        ...p,
        KD: (p.Kills / Math.max(1, p.Deaths)).toFixed(2),
        buildType: detectBuild(p.Build),
      }));

    setPlayers(parsed.sort((a, b) => a.Rank - b.Rank));
    setLoadingCSV(false);
  };

  // ----------------------------------------------------
  // Load ALL wars (ONCE)
  // now supports Full=yes/no logic
  // ----------------------------------------------------
  const loadAllWars = async () => {
    const out: Record<string, EnhancedPlayer[]> = {};

    for (const file of csvFiles) {
      const text = await fetch(`/${file}`).then((r) => r.text());
      const rows: any[] = Papa.parse(text, { header: true }).data;

      const parsed: EnhancedPlayer[] = rows
        .map((r) => normalizeCSVRow(r))
        .filter(Boolean) as EnhancedPlayer[];

      // ----------------------------------------------------
      // 🚨 NEW: remove wars where ALL players have Full = "no"
      // ----------------------------------------------------
      const hasAnyFullYes = parsed.some((p) => p.Full !== "no");

      if (!hasAnyFullYes) {
        // skip this war entirely
        continue;
      }

      // Optional: only keep players marked Full=yes
      // (you did NOT request this, so we keep all rows)
      out[file] = parsed;
    }

    setAllPlayersByWar(out);
  };

  useEffect(() => {
    if (csvFiles.length > 0) loadAllWars();
  }, [csvFiles]);

  // load list of CSV files
  useEffect(() => {
    fetch("/csv-manifest.json")
      .then((res) => res.json())
      .then((list) => setCsvFiles(list))
      .catch(() => setCsvFiles([]));
  }, []);

  return {
    players,
    groups,
    loadingCSV,
    csvFiles,
    selectedCSV,
    setSelectedCSV,
    loadPublicCSV,
    handleCSV: () => {},
    allPlayersByWar,
    currentWar: selectedCSV,
  };
}
