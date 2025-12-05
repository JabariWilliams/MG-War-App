import React from "react";

interface SideMenuProps {
  csvFiles: string[];
  selectedCSV: string;
  setSelectedCSV: (val: string) => void;
  loadPublicCSV: (file: string) => void;
  view: "dashboard" | "analytics";
  setView: (val: "dashboard" | "analytics") => void;
}

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

  return (
    <aside
      className="hidden md:block fixed left-0 top-0 h-full w-56 bg-black/60 border-r border-nw-gold/40 backdrop-blur-lg p-4 overflow-y-auto z-30"
      style={{ paddingTop: "70px" }}
    >
      {/* NAVIGATION */}
      <div className="mb-6">
        <div className="text-nw-gold-soft text-lg font-bold mb-3">
          Navigation
        </div>

        <button
          onClick={() => setView("dashboard")}
          className={`block w-full text-left px-3 py-2 rounded mb-1 ${
            view === "dashboard"
              ? "bg-nw-gold-soft/20 text-nw-gold-soft"
              : "text-nw-parchment-soft"
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => setView("analytics")}
          className={`block w-full text-left px-3 py-2 rounded ${
            view === "analytics"
              ? "bg-nw-gold-soft/20 text-nw-gold-soft"
              : "text-nw-parchment-soft"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* WAR LIST */}
      <div>
        <div className="text-nw-gold-soft text-lg font-bold mb-3">
          War Reports
        </div>

        <button
          onClick={() => setSelectedCSV("__none__")}
          className={`block w-full text-left px-3 py-2 rounded mb-1 ${
            selectedCSV === "__none__"
              ? "bg-nw-gold-soft/20 text-nw-gold-soft"
              : "text-nw-parchment-soft"
          }`}
        >
          Overview
        </button>

        {csvFiles.map((file) => (
          <button
            key={file}
            onClick={() => {
              setSelectedCSV(file);
              loadPublicCSV(file);
            }}
            className={`block w-full text-left px-3 py-2 rounded mb-1 ${
              selectedCSV === file
                ? "bg-nw-gold-soft/20 text-nw-gold-soft"
                : "text-nw-parchment-soft"
            }`}
          >
            {formatCSVName(file)}
          </button>
        ))}
      </div>
    </aside>
  );
}
