import React from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  // -----------------------------
  // DATE PARSING + GROUPING
  // -----------------------------
  const parseFileDate = (file: string): Date | null => {
    const base = file.replace(".csv", "");
    const m = base.match(/(?:^|[_-])(\d{1,2})-(\d{1,2})-(\d{2})(?:$|[_-])/);
    if (!m) return null;

    const month = Number(m[1]);
    const day = Number(m[2]);
    const yy = Number(m[3]);
    const year = 2000 + yy;

    if (!month || month < 1 || month > 12 || !day || day < 1 || day > 31) return null;
    return new Date(year, month - 1, day);
  };

  const monthKeyFromDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const monthLabelFromKey = (key: string) => {
    const [y, m] = key.split("-");
    const monthIndex = Number(m) - 1;
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];
    return `${monthNames[monthIndex] || m} ${y}`;
  };

  const grouped = React.useMemo(() => {
    const map = new Map<string, string[]>();
    const ungrouped: string[] = [];

    const compareFilesByDate = (a: string, b: string) => {
      const da = parseFileDate(a);
      const db = parseFileDate(b);
      if (da && db) return da.getTime() - db.getTime();
      if (da && !db) return -1;
      if (!da && db) return 1;
      return a.localeCompare(b);
    };

    for (const file of csvFiles) {
      const d = parseFileDate(file);
      if (!d) {
        ungrouped.push(file);
        continue;
      }
      const key = monthKeyFromDate(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(file);
    }

    for (const [k, arr] of map.entries()) {
      arr.sort(compareFilesByDate);
      map.set(k, arr);
    }

    const monthKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    ungrouped.sort((a, b) => a.localeCompare(b));

    return { map, monthKeys, ungrouped };
  }, [csvFiles]);

  // -----------------------------
  // COLLAPSE/EXPAND MONTHS
  // -----------------------------
  const selectedMonthKey = React.useMemo(() => {
    const d = selectedCSV ? parseFileDate(selectedCSV) : null;
    return d ? monthKeyFromDate(d) : null;
  }, [selectedCSV]);

  const [openMonthKey, setOpenMonthKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (selectedMonthKey) setOpenMonthKey(selectedMonthKey);
    else if (!openMonthKey && grouped.monthKeys.length > 0) setOpenMonthKey(grouped.monthKeys[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonthKey, grouped.monthKeys.join("|")]);

  // -----------------------------
  // READABLE TITLE HELPERS (FULL OPPONENT, DATE BELOW)
  // -----------------------------
  const parseOpponentFromFile = (file: string) => {
    const base = file.replace(".csv", "");
    const m = base.match(/^MGv([^_]+)[_-]/i);
    return m ? m[1] : "Unknown";
  };

  const formatReadableDate = (file: string) => {
    const d = parseFileDate(file);
    if (!d) return "";
    const monthNamesShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${monthNamesShort[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const renderWarRow = (file: string) => {
    const outcome = warOutcomeByFile[file] || "?";
    const opponent = parseOpponentFromFile(file);
    const date = formatReadableDate(file);

    const badge =
      outcome === "W" ? (
        <span className="text-[10px] font-bold text-green-300">W</span>
      ) : outcome === "L" ? (
        <span className="text-[10px] font-bold text-red-300">L</span>
      ) : (
        <span className="text-[10px] font-bold text-nw-parchment-soft/40">•</span>
      );

    return (
      <div className="w-full">
        {/* Line 1: MG vs Opponent (no ellipsis; allow horizontal scroll if needed) */}
        <div
          className="
            flex items-center gap-2 whitespace-nowrap
            overflow-x-auto
            [-ms-overflow-style:none] [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <span className="inline-flex w-4 justify-center shrink-0">{badge}</span>
          <span className="text-[12px] font-semibold shrink-0">MG</span>
          <span className="text-[12px] opacity-80 shrink-0">vs</span>
          <span className="text-[12px] font-semibold shrink-0">{opponent}</span>
        </div>

        {/* Line 2: Date */}
        {date && <div className="text-[10px] opacity-70 pl-6 leading-tight">{date}</div>}
      </div>
    );
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
          <div className="text-nw-gold-soft text-lg font-bold mb-3">Navigation</div>

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
          <div className="text-nw-gold-soft text-lg font-bold mb-3">War Reports</div>

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

          {grouped.monthKeys.map((monthKey) => {
            const isOpen = openMonthKey === monthKey;
            const monthFiles = grouped.map.get(monthKey) || [];

            return (
              <div key={monthKey} className="mb-2">
                <motion.button
                  onClick={() => setOpenMonthKey((prev) => (prev === monthKey ? null : monthKey))}
                  className="w-full text-left px-2 py-2 rounded border border-nw-gold/20 bg-black/20"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-nw-parchment-soft/80 text-sm font-semibold">
                      {monthLabelFromKey(monthKey)}
                    </span>
                    <span className="text-nw-parchment-soft/50 text-xs">
                      {monthFiles.length} war{monthFiles.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </motion.button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key={`${monthKey}-body`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden pl-1 pt-1"
                    >
                      {monthFiles.map((file) => (
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
                          {renderWarRow(file)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
