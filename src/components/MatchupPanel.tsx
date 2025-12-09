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
      {/* =====================================
           TOP: ATTACKERS — VS — DEFENDERS
      ===================================== */}
      <div className="flex justify-center items-start gap-12">
        {/* ATTACKERS */}
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

        {/* DEFENDERS */}
        <div className="flex flex-col items-center w-40">
          <h3 className="nw-title text-nw-parchment-soft/70 text-sm mb-1">
            DEFENDERS
          </h3>
          <p className="text-nw-gold-soft text-xl font-semibold leading-tight">
            {defenders}
          </p>
        </div>
      </div>

      {/* =====================================
                    RESULT (PULSE ON WIN)
      ===================================== */}
      <div>
        <h3 className="nw-title text-nw-parchment-soft/80 text-base mb-1">
          RESULT
        </h3>

        <p
          className={`
            text-3xl font-bold 
            ${isWin ? "text-green-300" : "text-red-300"}
            ${isWin ? "animate-winPulse" : ""}
          `}
        >
          {result}
        </p>
      </div>

      {/* =====================================
            CUSTOM ANIMATION (INLINE STYLE)
      ===================================== */}
      <style>
        {`
          @keyframes winPulse {
            0% { transform: scale(1); text-shadow: 0 0 6px rgba(0,255,140,0.55); }
            50% { transform: scale(1.08); text-shadow: 0 0 16px rgba(0,255,140,0.85); }
            100% { transform: scale(1); text-shadow: 0 0 6px rgba(0,255,140,0.55); }
          }

          .animate-winPulse {
            animation: winPulse 1.6s ease-in-out infinite;
          }
        `}
      </style>
    </section>
  );
}
