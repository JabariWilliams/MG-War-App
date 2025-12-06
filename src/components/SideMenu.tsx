import React from "react";
import { motion } from "framer-motion";

interface SideMenuProps {
  csvFiles: string[];
  selectedCSV: string;
  setSelectedCSV: (val: string) => void;
  loadPublicCSV: (file: string) => void;
  view: "overview" | "dashboard" | "analytics" | "player";
  setView: (val: "overview" | "dashboard" | "analytics" | "player") => void;
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

  // -----------------------------------------------------
  // Animated Nav Button Component
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
      {/* =============================
          NAVIGATION SECTION
      ============================== */}
      <div className="mb-6">
        <div className="text-nw-gold-soft text-lg font-bold mb-3">
          Navigation
        </div>

        {/* Overview — clears war selection */}
        <NavButton
          active={view === "overview"}
          label="Overview"
          onClick={() => {
            setView("overview");
            setSelectedCSV("__none__"); // deselect all wars
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

      {/* =============================
          WAR REPORTS LIST
      ============================== */}
      <div>
        <div className="text-nw-gold-soft text-lg font-bold mb-3">
          War Reports
        </div>

        {csvFiles.map((file) => (
          <NavButton
            key={file}
            active={selectedCSV === file}
            label={formatCSVName(file)}
            onClick={() => {
              setSelectedCSV(file);
              loadPublicCSV(file);

              // Leaving Overview if user clicks a war
              if (view === "overview") {
                setView("dashboard");
              }
            }}
          />
        ))}
      </div>
    </aside>
  );
}
