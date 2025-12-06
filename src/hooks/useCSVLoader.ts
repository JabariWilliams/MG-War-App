import { useState, useEffect } from "react";
import Papa from "papaparse";
import { EnhancedPlayer, normalizeCSVRow, detectBuild } from "../utils/csvParser";

export default function useCSVLoader() {
  const [players, setPlayers] = useState<EnhancedPlayer[]>([]);
  const [groups, setGroups] = useState<EnhancedPlayer[][]>([]);
  const [loadingCSV, setLoadingCSV] = useState(false);

  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedCSV, setSelectedCSV] = useState("__none__");

  // NEW: store ALL wars' players here
  const [allPlayersByWar, setAllPlayersByWar] =
    useState<Record<string, EnhancedPlayer[]>>({});

  // -----------------------------
  // Load one CSV (current war)
  // -----------------------------
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
  // -----------------------------
  // Load ALL wars (once only)
  // -----------------------------
  const loadAllWars = async () => {
    const out: Record<string, EnhancedPlayer[]> = {};
    for (const file of csvFiles) {
      const text = await fetch(`/${file}`).then((r) => r.text());
      const rows: any[] = Papa.parse(text, { header: true }).data;
      const parsed: EnhancedPlayer[] = rows
        .map((r) => normalizeCSVRow(r))
        .filter(Boolean) as EnhancedPlayer[];

      out[file] = parsed;
    }
    setAllPlayersByWar(out);
  };

  useEffect(() => {
    if (csvFiles.length > 0) loadAllWars();
  }, [csvFiles]);

  // Load csv manifest list
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
