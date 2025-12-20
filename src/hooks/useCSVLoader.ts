import { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  EnhancedPlayer,
  normalizeCSVRow,
  detectBuild,
} from "../utils/csvParser";

export default function useCSVLoader() {
  const [players, setPlayers] = useState<EnhancedPlayer[]>([]);
  const [loadingCSV, setLoadingCSV] = useState(false);

  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedCSV, setSelectedCSV] = useState("__none__");

  // ALL wars (raw)
  const [allPlayersByWar, setAllPlayersByWar] =
    useState<Record<string, EnhancedPlayer[]>>({});

  // ONLY Full="yes" wars
  const [fullWarsByWar, setFullWarsByWar] =
    useState<Record<string, EnhancedPlayer[]>>({});

  // ----------------------------------------------------
  // Load a SINGLE selected CSV (dashboard / analytics)
  // ----------------------------------------------------
  const loadPublicCSV = async (filename: string) => {
    try {
      setLoadingCSV(true);

      const res = await fetch(`/${filename}?v=${Date.now()}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch CSV");

      const text = await res.text();

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
      setSelectedCSV(filename);
    } catch (err) {
      console.error("CSV load failed:", err);
      setPlayers([]);
    } finally {
      setLoadingCSV(false);
    }
  };

  // ----------------------------------------------------
  // Load ALL wars (used by Company Overview, Player Profile)
  // ----------------------------------------------------
  const loadAllWars = async () => {
    const all: Record<string, EnhancedPlayer[]> = {};
    const fullOnly: Record<string, EnhancedPlayer[]> = {};

    for (const file of csvFiles) {
      try {
        const res = await fetch(`/${file}?v=${Date.now()}`, {
          cache: "no-store",
        });

        if (!res.ok) continue;

        const text = await res.text();
        const rows: any[] = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        }).data;

        const parsed: EnhancedPlayer[] = rows
          .map((r) => normalizeCSVRow(r))
          .filter(Boolean) as EnhancedPlayer[];

        if (parsed.length === 0) continue;

        // Save ALL wars
        all[file] = parsed;

        // Save ONLY full=yes wars
        if (
          parsed.length > 0 &&
          parsed.every(
            (p) => String(p.Full || "").toLowerCase() === "yes"
          )
        ) {
          fullOnly[file] = parsed;
        }
      } catch (err) {
        console.warn(`Failed to load ${file}`, err);
      }
    }

    setAllPlayersByWar(all);
    setFullWarsByWar(fullOnly);
  };

  // ----------------------------------------------------
  // Reload all wars whenever manifest changes
  // ----------------------------------------------------
  useEffect(() => {
    if (csvFiles.length > 0) loadAllWars();
  }, [csvFiles]);

  // ----------------------------------------------------
  // Load CSV manifest (list of wars)
  // ----------------------------------------------------
  useEffect(() => {
    fetch(`/csv-manifest.json?v=${Date.now()}`, {
      cache: "no-store",
    })
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
    allPlayersByWar, // ALL wars
    fullWarsByWar,   // FULL wars only
    currentWar: selectedCSV,
  };
}
