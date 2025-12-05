import { useState, useEffect } from "react";
import Papa from "papaparse";
import { EnhancedPlayer, normalizeCSVRow, detectBuild } from "../utils/csvParser";

export default function useCSVLoader() {
  const [players, setPlayers] = useState<EnhancedPlayer[]>([]);
  const [groups, setGroups] = useState<EnhancedPlayer[][]>([]);
  const [loadingCSV, setLoadingCSV] = useState(false);

  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedCSV, setSelectedCSV] = useState("__none__");

  // Load CSV from /public
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

  // Manual CSV upload (local)
  const handleCSV = (file: File) => {
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

  // Build groups from players
  useEffect(() => {
    if (players.length === 0) {
      setGroups([]);
      return;
    }

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

  // Load CSV manifest list from /public
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
    handleCSV,
  };
}
