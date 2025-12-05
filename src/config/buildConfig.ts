import { Build } from "../utils/csvParser";

// Build priority for group sorting
export const BUILD_PRIORITY: Record<string, number> = {
  BRUISER: 1,
  DISRUPTOR: 2,
  QDPS: 3,
  DEX: 4,
  VGIG: 5,
  FSX: 6,
  BBX: 7,
  CW: 8,
  TANK: 9,
  HEALS: 10,
  UNKNOWN: 11,
};

// Build color definitions
export const buildColors: Record<Build, string> = {
  FLAIL: "#c4a26a",
  QDPS: "#ff4d4d",
  BRUISER: "#ff6a3d",
  DISRUPTOR: "#e89d24",
  BBX: "#e0a840",
  VGIG: "#f5cf42",
  FSX: "#f38b3b",
  DEX: "#3b82f6",
  CW: "#6366f1",
  HEALS: "#4ade80",
  TANK: "#22c1d6",
  UNKNOWN: "#9ca3af",
};
