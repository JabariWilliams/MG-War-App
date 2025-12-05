import React from "react";

interface Props {
  onFileSelect: (file: File) => void;
  selectedCSV: string;
}

export default function CSVLoaderPanel({ onFileSelect, selectedCSV }: Props) {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <section className="nw-panel p-6 text-center mt-4">
      <h2 className="nw-title text-nw-gold-soft text-lg mb-3">
        {selectedCSV === "__none__" ? "WAR OVERVIEW" : "UPLOAD WAR REPORT"}
      </h2>

      <p className="text-nw-parchment-soft/85 text-sm mb-4">
        Upload a CSV file exported from the Mercguards War Reporter.
      </p>

      {/* Drag Drop Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border border-nw-gold/30 rounded-lg p-10 cursor-pointer hover:border-nw-gold/60 transition"
      >
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="text-nw-parchment-soft/90">
            <span className="text-nw-gold-soft font-semibold">Click to upload</span>{" "}
            or drag your CSV file here.
          </div>
        </label>
      </div>

      <p className="text-xs text-nw-parchment-soft/60 mt-4">
        Supports CSV from scoreboard tool or manual exports.
      </p>
    </section>
  );
}
