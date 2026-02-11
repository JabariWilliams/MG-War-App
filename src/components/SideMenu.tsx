import React from "react";
import { motion } from "framer-motion";

interface SideMenuProps {
  csvFiles: string[];
  selectedCSV: string;
  setSelectedCSV: (val: string) => void;
  loadPublicCSV: (file: string) => void;
  view: "overview" | "dashboard" | "analytics" | "player" | "legacy";
  setView: (val: "overview" | "dashboard" | "analytics" | "player" | "legacy") => void;
}

type WarOutcome = "W" | "L" | "?";

export default function SideMenu({
  csvFiles,
  selectedCSV,
  setSelectedCSV,
  loadPublicCSV,
  view,
  setView,
}: SideMenuProps) {
  const formatCSVName = (name: string) =>
    name.replace(".csv", "").replace(/[_-]/g, " ");

  // ✅ CHANGE THIS if your CSVs live under a folder like "/wars/"
  const CSV_BASE_PATH = "/";

  // Cache outcomes so we don't refetch repeatedly
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

  /**
   * Best-effort outcome extraction:
   * 1) If there is a "result" column in the header, read the first data row's result value.
   * 2) Else, search the entire file for keywords: win/victory vs loss/defeat.
   */
  const extractOutcomeFromCSVText = (csvText: string): WarOutcome => {
    const text = normalize(csvText);

    // Try to parse header/result column
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

    // Keyword scan fallback
    const hasWin = /\b(win|victory|won)\b/.test(text);
    const hasLoss = /\b(loss|defeat|lost)\b/.test(text);

    if (hasWin && !hasLoss) return "W";
    if (hasLoss && !hasWin) return "L";

    // If both appear (or neither), we can't be sure
    return "?";
  };

  // Fetch outcome for a single file (cached)
  const fetchOutcomeIfNeeded = React.useCallback(
    async (file: string) => {
      if (warOutcomeByFile[file]) return; // already have it

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

  // Light-touch preload: fetch outcomes for visible list (sequential, avoids spike)
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      for (const file of csvFiles) {
        if (cancelled) return;
        // Only fetch if not already cached
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
    return base; // unknown: don't prefix (or change to `? - ${base}` if you want)
  };

  // -----------------------------------------------------
  // Animated Nav Button
  // -----------------------------------------------------
  const NavButton = ({
    active,
    label,
    onClick,
  }: {
    active: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <motion.button
      onClick={onClick}
      initial={false}
      animate={{
        backgroundColor: active ? "rgba(198,155,91,0.25)" : "rgba(0,0,0,0)",
        color: active ? "#c6a675" : "#e9e5d8",
        x: active ? 4 : 0,
      }}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.25 }}
      className="relative block w-full text-left px-3 py-2 rounded mb-1"
    >
      {label}

      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="
            absolute right-2 top-1/2 -translate-y-1/2 
            w-2 h-2 rounded-full bg-nw-gold-soft
            shadow-[0_0_8px_3px_rgba(198,166,117,0.6)]
          "
        />
      )}
    </motion.button>
  );

  return (
    <aside
      className="
        hidden md:block fixed left-0 top-0 
        h-full w-56 
        bg-black/60 backdrop-blur-lg 
        border-r border-nw-gold/40 
        p-4 overflow-y-auto z-30
      "
      style={{ paddingTop: "70px" }}
    >
      {/* LOGO */}
      <div className="flex flex-col items-center mb-6 mt-2">
        <img
          src="/assets/mercguards-logo.png"
          alt="Mercguards Logo"
          className="w-28 opacity-90 drop-shadow-lg"
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

        <NavButton
          active={view === "overview"}
          label="Overview"
          onClick={() => {
            setSelectedCSV("__none__");
            setView("overview");
          }}
        />

        <NavButton
          active={view === "dashboard"}
          label="Dashboard"
          onClick={() => setView("dashboard")}
        />

        <NavButton
          active={view === "analytics"}
          label="Analytics"
          onClick={() => setView("analytics")}
        />
      </div>

      {/* WAR REPORTS */}
      <div>
        <div className="text-nw-gold-soft text-lg font-bold mb-3">
          War Reports
        </div>

        {/* ---- Legacy Stats (NEW) ---- */}
        <NavButton
          active={view === "legacy"}
          label=" Legacy Stats"
          onClick={() => {
            setSelectedCSV("__none__");
            setView("legacy");
          }}
        />

        {/* CSV files */}
        {csvFiles.map((file) => (
          <NavButton
            key={file}
            active={selectedCSV === file}
            label={formatWarLabelWithOutcome(file)}
            onClick={() => {
              setSelectedCSV(file);
              loadPublicCSV(file);
              if (view === "overview" || view === "legacy") setView("dashboard");
            }}
          />
        ))}
      </div>
    </aside>
  );
}
