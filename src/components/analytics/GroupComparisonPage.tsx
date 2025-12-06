import { useMemo } from "react";
import { EnhancedPlayer } from "../../utils/csvParser";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface GroupComparisonPageProps {
  players: EnhancedPlayer[];
}

type GroupStat = {
  group: string;
  totalDamage: number;
  totalHealing: number;
  totalContrib: number; // kills + assists
};

function buildGroupStats(players: EnhancedPlayer[]): GroupStat[] {
  const map = new Map<string, GroupStat>();

  for (const p of players) {
    const groupKey = (p as any).Group ?? "Unassigned";

    const dmg = Number((p as any).Damage || 0);
    const heal = Number((p as any).Healing || 0);
    const kills = Number((p as any).Kills || 0);
    const assists = Number((p as any).Assists || 0);
    const contrib = kills + assists;

    if (!map.has(groupKey)) {
      map.set(groupKey, {
        group: groupKey,
        totalDamage: 0,
        totalHealing: 0,
        totalContrib: 0,
      });
    }

    const stat = map.get(groupKey)!;
    stat.totalDamage += isNaN(dmg) ? 0 : dmg;
    stat.totalHealing += isNaN(heal) ? 0 : heal;
    stat.totalContrib += isNaN(contrib) ? 0 : contrib;
  }

  return Array.from(map.values()).sort((a, b) => b.totalDamage - a.totalDamage);
}

export default function GroupComparisonPage({ players }: GroupComparisonPageProps) {
  const groupStats = useMemo(() => buildGroupStats(players), [players]);

  if (!groupStats.length) {
    return (
      <section className="nw-panel p-4 rounded-xl bg-black/40 border border-nw-gold-soft/20">
        <h2 className="nw-title text-nw-gold-soft text-lg mb-2">Group Comparison</h2>
        <p className="text-sm text-nw-parchment-soft/80">
          No group data available for this war.
        </p>
      </section>
    );
  }

  return (
    <section className="pt-1">

      <p className="text-sm text-nw-parchment-soft/80 mb-6">
        Comparing total damage, healing, and contribution (kills + assists) for all groups
        in this war.
      </p>


      {/* Leaderboard Table */}
      <div className="nw-subpanel p-4 rounded-xl bg-black/40 border border-nw-gold-soft/20 overflow-x-auto">
        <h3 className="nw-title text-sm md:text-base mb-3">Group Leaderboard</h3>

        <table className="min-w-full text-sm">
          <thead className="nw-sticky-header text-left text-nw-gold-soft text-xs md:text-sm">
            <tr>
              <th className="py-2 pr-4">Group</th>
              <th className="py-2 pr-4">Total Damage</th>
              <th className="py-2 pr-4">Total Healing</th>
              <th className="py-2 pr-4">Kills + Assists</th>
            </tr>
          </thead>

          <tbody>
            {groupStats.map((g) => (
              <tr key={g.group} className="border-b border-white/5 last:border-b-0">
                <td className="py-1.5 pr-4 font-semibold text-nw-gold-soft">
                  {g.group}
                </td>
                <td className="py-1.5 pr-4">
                  {Math.round(g.totalDamage).toLocaleString()}
                </td>
                <td className="py-1.5 pr-4">
                  {Math.round(g.totalHealing).toLocaleString()}
                </td>
                <td className="py-1.5 pr-4">
                  {Math.round(g.totalContrib).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
