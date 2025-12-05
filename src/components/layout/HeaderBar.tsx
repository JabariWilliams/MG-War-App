import React from "react";

interface Props {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  selectedCSV: string;
}

export default function HeaderBar({
  mobileMenuOpen,
  setMobileMenuOpen,
  selectedCSV,
}: Props) {
  const formatCSV = (name: string) =>
    name.replace(".csv", "").replace(/[_-]/g, " ");

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-black/50 border-b border-nw-gold/30 backdrop-blur-lg p-4 flex justify-between items-center md:hidden">
      <h1 className="nw-title text-nw-gold-soft text-base">
        {selectedCSV === "__none__" ? "WAR OVERVIEW" : formatCSV(selectedCSV)}
      </h1>

      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="text-nw-gold-soft border border-nw-gold/30 px-3 py-1 rounded"
      >
        Menu
      </button>
    </header>
  );
}
