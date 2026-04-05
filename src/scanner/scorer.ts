import type { Issue, ScanResult } from "./types.js";

const DEFAULT_PENALTY: Record<string, number> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 1,
};

export function score(
  issues: Issue[],
  weights?: Record<string, number>,
): { score: number; level: ScanResult["level"] } {
  const penalty = weights ?? DEFAULT_PENALTY;
  let total = 100;
  for (const issue of issues) {
    total -= penalty[issue.severity] ?? 0;
  }
  const s = Math.max(0, Math.min(100, total));
  return { score: s, level: getLevel(s) };
}

function getLevel(s: number): ScanResult["level"] {
  if (s >= 80) return "SOBER";
  if (s >= 60) return "TIPSY";
  if (s >= 40) return "HUNGOVER";
  return "BLACKOUT";
}
