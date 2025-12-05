import React from "react";
import DamageByPlayerChart from "./DamageByPlayerChart";
import KDTrendChart from "./KDTrendChart";
import KPDistributionTable from "./KPDistributionTable";
import TopDeathsTable from "./TopDeathsTable";

interface Player {
  Player: string;
  KD: string;
  Damage: number;
  buildType: string;
  KP: number;
  Deaths: number;
}

interface Props {
  players: Player[];
}

export default function AnalyticsPanel({ players }: Props) {
  if (!players || players.length === 0) return null;

  return (
    <>
      <DamageByPlayerChart players={players} />
      <KDTrendChart players={players} />
      <KPDistributionTable players={players} />
      <TopDeathsTable players={players} />
    </>
  );
}
