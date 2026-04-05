import fs from "node:fs";
import path from "node:path";

export interface SoberConfig {
  thresholds: {
    god_file_lines: number;
    max_nesting: number;
    min_test_coverage: number;
    duplication_similarity: number;
  };
  ignore: string[];
  weights: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  severity: Record<string, "critical" | "high" | "medium" | "low">;
}

const DEFAULT_CONFIG: SoberConfig = {
  thresholds: {
    god_file_lines: 500,
    max_nesting: 4,
    min_test_coverage: 60,
    duplication_similarity: 70,
  },
  ignore: [],
  weights: {
    critical: 15,
    high: 8,
    medium: 4,
    low: 1,
  },
  severity: {},
};

export function loadConfig(targetPath: string): SoberConfig {
  const abs = path.resolve(targetPath);
  const configPath = path.join(abs, ".soberrc.json");

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return {
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...raw.thresholds },
      ignore: Array.isArray(raw.ignore) ? raw.ignore : DEFAULT_CONFIG.ignore,
      weights: { ...DEFAULT_CONFIG.weights, ...raw.weights },
      severity: raw.severity && typeof raw.severity === "object" ? raw.severity : DEFAULT_CONFIG.severity,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
