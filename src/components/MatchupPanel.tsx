import React from "react";

interface Props {
  attackers: string;
  defenders: string;
  result: string;
}

export default function MatchupPanel({ attackers, defenders, result }: Props) {
  const isWin = ["win", "victory"].includes(result.toLowerCase());

  return (
    <section className="nw-panel p-6 mb-6 text-center space-y-6">
      {/* Top row: Left + VS + Right */}
      <div className="flex justify-center items-start gap-12">
        {/* ATTACKERS COLUMN */}
        <div className="flex flex-col items-center w-40">
          <h3 className="nw-title text-nw-parchment-soft/70 text-sm mb-1">
            ATTACKERS
          </h3>
          <p className="text-nw-gold-soft text-xl font-semibold leading-tight">
            {attackers}
          </p>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center justify-center w-10">
          <span className="text-nw-parchment-soft/60 text-xl leading-none">
            VS
          </span>
        </div>

        {/* DEFENDERS COLUMN */}
        <div className="flex flex-col items-center w-40">
          <h3 className="nw-title text-nw-parchment-soft/70 text-sm mb-1">
            DEFENDERS
          </h3>
          <p className="text-nw-gold-soft text-xl font-semibold leading-tight">
            {defenders}
          </p>
        </div>
      </div>

      {/* Bottom row: RESULT */}
      <div>
        <h3 className="nw-title text-nw-parchment-soft/80 text-base mb-1">
          RESULT
        </h3>
        <p
          className={`text-3xl font-bold ${
            isWin ? "text-green-300" : "text-red-300"
          }`}
        >
          {result}
        </p>
      </div>
    </section>
  );
}
