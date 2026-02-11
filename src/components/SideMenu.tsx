import React from "react";

interface SideMenuProps {
  csvFiles: string[];
  selectedCSV: string;
  setSelectedCSV: (val: string) => void;
  loadPublicCSV: (file: string) => void;
  view: "overview" | "dashboard" | "analytics" | "player" | "legacy";
  setView: (val: "overview" | "dashboard" | "analytics" | "player" | "legacy") => void;

  selectedWarIsWin?: boolean; // ✅ W/L support
}

export default function SideMenu({
  csvFiles,
  selectedCSV,
  setSelectedCSV,
  loadPublicCSV,
  view,
  setView,
  selectedWarIsWin,
}: SideMenuProps) {
  const formatCSVName = (name: string) =>
    name.replace(".csv", "").replace(/[_-]/g, " ");

  const formatWarTitle = (file: string) => {
    const base = formatCSVName(file);

    // Only prefix the currently selected war (we actually know its outcome)
    if (file !== selectedCSV) return base;

    if (selectedWarIsWin === true) return `W - ${base}`;
    if (selectedWarIsWin === false) return `L - ${base}`;

    return base;
  };

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

  const getYearMonthKey = (file: string): string | null => {
    const d = parseFileDate(file);
    if (!d) return null;
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  };

  const groupedByMonth = React.useMemo(() => {
    const map = new Map<string, string[]>();
    const ungrouped: string[] = [];

    for (const file of csvFiles) {
      const ym = getYearMonthKey(file);
      if (!ym) {
        ungrouped.push(file);
        continue;
      }
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym)!.push(file);
    }

    const compareFiles = (a: string, b: string) => {
      const da = parseFileDate(a);
      const db = parseFileDate(b);

      if (da && db) {
        const diff = da.getTime() - db.getTime();
        if (diff !== 0) return diff;
      } else if (da && !db) {
        return -1;
      } else if (!da && db) {
        return 1;
      }

      return a.localeCompare(b);
    };

    for (const [k, arr] of map.entries()) {
      arr.sort(compareFiles);
      map.set(k, arr);
    }

    const monthKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    ungrouped.sort((a, b) => a.localeCompare(b));

    return { map, monthKeys, ungrouped };
  }, [csvFiles]);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-black/80 border-r border-nw-gold/40 z-30 p-4 overflow-y-auto">
      <div className="w-full" style={{ paddingTop: "80px" }}>
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
            }}
            className={`block w-full text-left px-3 py-2 rounded mb-1 ${
              view === "legacy"
                ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                : "text-nw-parchment-soft"
            }`}
          >
            Legacy Stats
          </button>

          {/* ✅ CSV LIST GROUPED BY MONTH */}
          {groupedByMonth.monthKeys.map((ym) => {
            const files = groupedByMonth.map.get(ym) || [];
            return (
              <div key={ym} className="mb-2">
                <div className="text-nw-parchment-soft/70 text-xs font-semibold px-1 py-2">
                  {ym}
                </div>

                {files.map((file) => (
                  <button
                    key={file}
                    onClick={() => {
                      setSelectedCSV(file);
                      loadPublicCSV(file);
                      setView("dashboard");
                    }}
                    className={`block w-full text-left px-3 py-2 rounded mb-1 ${
                      selectedCSV === file
                        ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                        : "text-nw-parchment-soft"
                    }`}
                  >
                    {formatWarTitle(file)}
                  </button>
                ))}
              </div>
            );
          })}

          {groupedByMonth.ungrouped.length > 0 && (
            <div className="mt-3">
              <div className="text-nw-parchment-soft/70 text-xs font-semibold px-1 py-2">
                Other
              </div>

              {groupedByMonth.ungrouped.map((file) => (
                <button
                  key={file}
                  onClick={() => {
                    setSelectedCSV(file);
                    loadPublicCSV(file);
                    setView("dashboard");
                  }}
                  className={`block w-full text-left px-3 py-2 rounded mb-1 ${
                    selectedCSV === file
                      ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                      : "text-nw-parchment-soft"
                  }`}
                >
                  {formatWarTitle(file)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
