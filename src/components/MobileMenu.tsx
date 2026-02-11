import React from "react";
import { motion } from "framer-motion";

interface MobileMenuProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  csvFiles: string[];
  selectedCSV: string;
  setSelectedCSV: (val: string) => void;
  loadPublicCSV: (file: string) => void;
  view: "overview" | "dashboard" | "analytics" | "player" | "legacy";
  setView: (val: "overview" | "dashboard" | "analytics" | "player" | "legacy") => void;
}

type WarOutcome = "W" | "L" | "?";

export default function MobileMenu({
  mobileMenuOpen,
  setMobileMenuOpen,
  csvFiles,
  selectedCSV,
  setSelectedCSV,
  loadPublicCSV,
  view,
  setView,
}: MobileMenuProps) {
  const formatCSVName = (name: string) =>
    name.replace(".csv", "").replace(/[_-]/g, " ");

  // ✅ CHANGE THIS if your CSVs live under a folder like "/wars/"
  const CSV_BASE_PATH = "/";

  const [warOutcomeByFile, setWarOutcomeByFile] = React.useState<Record<string, WarOutcome>>({});

  const getCSVUrl = (file: string) => {
    const base = CSV_BASE_PATH.endsWith("/") ? CSV_BASE_PATH : `${CSV_BASE_PATH}/`;
    return `${base}${encodeURIComponent(file)}`;
  };

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\r/g, "")
      .replace(/"/g, "")
      .trim();

  const extractOutcomeFromCSVText = (csvText: string): WarOutcome => {
    const text = normalize(csvText);

    // 1) Parse header, look for result/outcome column
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      const header = lines[0].split(",").map((h) => normalize(h));
      const resultIdx = header.findIndex((h) => h === "result" || h === "outcome");
      if (resultIdx >= 0) {
        const firstRow = lines[1].split(",").map((v) => normalize(v));
        const rv = firstRow[resultIdx] || "";
        if (rv.includes("win") || rv.includes("victory")) return "W";
        if (rv.includes("loss") || rv.includes("defeat")) return "L";
      }
    }

    // 2) Keyword scan fallback
    const hasWin = /\b(win|victory|won)\b/.test(text);
    const hasLoss = /\b(loss|defeat|lost)\b/.test(text);

    if (hasWin && !hasLoss) return "W";
    if (hasLoss && !hasWin) return "L";

    return "?";
  };

  const fetchOutcomeIfNeeded = React.useCallback(
    async (file: string) => {
      if (warOutcomeByFile[file]) return;

      try {
        const url = getCSVUrl(file);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const outcome = extractOutcomeFromCSVText(text);

        setWarOutcomeByFile((prev) => (prev[file] ? prev : { ...prev, [file]: outcome }));
      } catch {
        setWarOutcomeByFile((prev) => (prev[file] ? prev : { ...prev, [file]: "?" }));
      }
    },
    [warOutcomeByFile]
  );

  // Preload outcomes (sequential)
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      for (const file of csvFiles) {
        if (cancelled) return;
        if (!warOutcomeByFile[file]) {
          await fetchOutcomeIfNeeded(file);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [csvFiles, warOutcomeByFile, fetchOutcomeIfNeeded]);

  const formatWarLabelWithOutcome = (file: string) => {
    const base = formatCSVName(file);
    const outcome = warOutcomeByFile[file] || "?";
    if (outcome === "W") return `W - ${base}`;
    if (outcome === "L") return `L - ${base}`;
    return base; // unknown: no prefix (change if you want)
  };

  return (
    <>
      {/* BACKDROP */}
      <motion.div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        initial={false}
        animate={{ opacity: mobileMenuOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* SLIDE PANEL */}
      <motion.div
        className={`
          fixed top-0 left-0 
          h-full w-64 
          bg-black/80 
          border-r border-nw-gold/40 
          z-50 
          p-4 
          overflow-y-auto
        `}
        style={{ paddingTop: "80px" }}
        initial={false}
        animate={{ x: mobileMenuOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
      >
        {/* LOGO */}
        <div className="flex flex-col items-center mb-6 mt-2">
          <img
            src="/assets/mercguards-logo.png"
            alt="Mercguards Logo"
            className="w-20 opacity-90 drop-shadow-lg"
          />
          <p className="mt-2 text-nw-gold-soft font-semibold text-sm tracking-wide">
            MERCGUARDS
          </p>
        </div>

        {/* NAVIGATION */}
        <div className="mb-6">
          <div className="text-nw-gold-soft text-lg font-bold mb-3">
            Navigation
          </div>

          <button
            onClick={() => {
              setView("overview");
              setSelectedCSV("__none__");
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded mb-1 ${
              view === "overview"
                ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                : "text-nw-parchment-soft"
            }`}
          >
            Overview
          </button>

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

        {/* WAR REPORTS */}
        <div>
          <div className="text-nw-gold-soft text-lg font-bold mb-3">
            War Reports
          </div>

          {/* Legacy Stats */}
          <button
            onClick={() => {
              setView("legacy");
              setSelectedCSV("__none__");
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded mb-1 ${
              view === "legacy"
                ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                : "text-nw-parchment-soft"
            }`}
          >
            Legacy Stats
          </button>

          {/* CSV LIST (with W/L prefix from CSV contents) */}
          {csvFiles.map((file) => (
            <button
              key={file}
              onClick={() => {
                setSelectedCSV(file);
                loadPublicCSV(file);
                setView("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded mb-1 ${
                selectedCSV === file
                  ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                  : "text-nw-parchment-soft"
              }`}
            >
              {formatWarLabelWithOutcome(file)}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
