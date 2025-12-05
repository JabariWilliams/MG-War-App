import { EnhancedPlayer } from "../utils/csvParser";

export default function useMatchup(players: EnhancedPlayer[]) {
  let attackers = "Attackers";
  let defenders = "Defenders";
  let result = "Undecided";

  if (players.length > 0) {
    const firstWithMeta = players.find(
      (p) =>
        (p.Attacker && p.Attacker.trim().length > 0) ||
        (p.Defender && p.Defender.trim().length > 0) ||
        (p.Result && p.Result.trim().length > 0)
    );

    if (firstWithMeta) {
      attackers =
        firstWithMeta.Attacker?.trim().length > 0
          ? firstWithMeta.Attacker.trim()
          : "Attackers";

      defenders =
        firstWithMeta.Defender?.trim().length > 0
          ? firstWithMeta.Defender.trim()
          : "Defenders";

      // FIXED LINE — was `.tr` before, now correct
      const raw = firstWithMeta.Result?.trim().toLowerCase() || "";

      if (["win", "w", "1", "victory"].includes(raw)) result = "Victory";
      if (["loss", "l", "0", "defeat"].includes(raw)) result = "Loss";
    }
  }

  // REQUIRED: return object so App.tsx destructuring works
  return { attackers, defenders, result };
}
