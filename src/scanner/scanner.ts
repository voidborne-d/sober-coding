import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { score } from "./scorer.js";
import type { Checker, FileEntry, Issue, ScanResult } from "./types.js";
import { securityChecker } from "../checkers/security.js";
import { duplicationChecker } from "../checkers/duplication.js";
import { deadCodeChecker } from "../checkers/dead-code.js";
import { architectureChecker } from "../checkers/architecture.js";
import { errorHandlingChecker } from "../checkers/error-handling.js";
import { dependencyChecker } from "../checkers/dependency.js";
import { testingChecker } from "../checkers/testing.js";
import { loadConfig, type SoberConfig } from "../config.js";

const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
  "**/vendor/**",
  "**/__pycache__/**",
  "**/build/**",
  "**/.next/**",
];

const CODE_EXTS = [
  ".js", ".ts", ".jsx", ".tsx", ".py", ".go", ".rs",
  ".java", ".rb", ".php", ".c", ".cpp", ".h", ".cs",
  ".vue", ".svelte", ".mjs", ".cjs",
];

const checkers: Checker[] = [
  securityChecker,
  architectureChecker,
  duplicationChecker,
  errorHandlingChecker,
  dependencyChecker,
  testingChecker,
  deadCodeChecker,
];

export async function scan(targetPath: string): Promise<ScanResult> {
  const abs = path.resolve(targetPath);
  const config = loadConfig(targetPath);

  const ignorePatterns = [...DEFAULT_IGNORE, ...config.ignore];

  const filePaths = await fg("**/*", {
    cwd: abs,
    ignore: ignorePatterns,
    absolute: true,
    onlyFiles: true,
  });

  const codeFiles = filePaths.filter((f) =>
    CODE_EXTS.includes(path.extname(f).toLowerCase())
  );

  const entries: FileEntry[] = [];
  let totalLines = 0;

  for (const fp of codeFiles) {
    const content = fs.readFileSync(fp, "utf-8");
    const lines = content.split("\n");
    totalLines += lines.length;
    entries.push({
      path: path.relative(abs, fp),
      content,
      lines,
    });
  }

  const issues: Issue[] = [];
  for (const checker of checkers) {
    issues.push(...checker.check(entries));
  }

  issues.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  const { score: s, level } = score(issues, config.weights);

  return {
    path: abs,
    files: codeFiles.length,
    lines: totalLines,
    issues,
    score: s,
    level,
  };
}
