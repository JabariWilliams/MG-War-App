import { useState, useEffect } from "react";
import Papa from "papaparse";
import { EnhancedPlayer, normalizeCSVRow, detectBuild } from "../utils/csvParser";

export default function useCSVLoader() {
  const [players, setPlayers] = useState<EnhancedPlayer[]>([]);
  const [loadingCSV, setLoadingCSV] = useState(false);

  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedCSV, setSelectedCSV] = useState("__none__");

  // ALL wars loaded raw
  const [allPlayersByWar, setAllPlayersByWar] =
    useState<Record<string, EnhancedPlayer[]>>({});

  // ONLY Full="yes" wars
  const [fullWarsByWar, setFullWarsByWar] =
    useState<Record<string, EnhancedPlayer[]>>({});

  // ----------------------------------------------------
  // Load a single selected CSV
  // ----------------------------------------------------
  const loadPublicCSV = async (filename: string) => {
    setLoadingCSV(true);

    const text = await fetch(`/${filename}`).then((r) => r.text());
    const rows = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    const parsed: EnhancedPlayer[] = rows
      .map((row: any) => normalizeCSVRow(row))
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
  // Load ALL wars: full and non-full
  // ----------------------------------------------------
  const loadAllWars = async () => {
    const all: Record<string, EnhancedPlayer[]> = {};
    const fullOnly: Record<string, EnhancedPlayer[]> = {};

    for (const file of csvFiles) {
      const text = await fetch(`/${file}`).then((r) => r.text());
      const rows: any[] = Papa.parse(text, { header: true }).data;

      const parsed: EnhancedPlayer[] = rows
        .map((r) => normalizeCSVRow(r))
        .filter(Boolean) as EnhancedPlayer[];

      if (parsed.length === 0) continue;

      // Save ALL wars
      all[file] = parsed;

      // Save ONLY full=yes wars
      if (parsed[0].Full === "yes") {
        fullOnly[file] = parsed;
      }
    }

    setAllPlayersByWar(all);
    setFullWarsByWar(fullOnly);
  };

  useEffect(() => {
    if (csvFiles.length > 0) loadAllWars();
  }, [csvFiles]);

  useEffect(() => {
    fetch("/csv-manifest.json")
      .then((r) => r.json())
      .then((list) => setCsvFiles(list))
      .catch(() => setCsvFiles([]));
  }, []);

  return {
    players,
    loadingCSV,
    csvFiles,
    selectedCSV,
    setSelectedCSV,
    loadPublicCSV,
    allPlayersByWar,  // ALL wars
    fullWarsByWar,    // FULL WARS ONLY
    currentWar: selectedCSV,
  };
}
