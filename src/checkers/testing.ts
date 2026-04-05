import type { Checker, FileEntry, Issue } from "../scanner/types.js";

const TEST_FILE_PATTERNS = [
  /\.test\.\w+$/,
  /\.spec\.\w+$/,
  /\btest_[^/]+\.py$/,
  /[^/]+_test\.go$/,
];

const TEST_DIR_PATTERN = /(?:^|\/)tests?\//;

const EDGE_CASE_KEYWORDS = [
  "error", "edge", "boundary", "null", "undefined", "empty",
  "invalid", "timeout", "overflow", "negative", "zero", "NaN",
  "exception", "fail", "reject", "throw", "limit", "max", "min",
];

function isTestFile(path: string): boolean {
  if (TEST_DIR_PATTERN.test(path)) return true;
  return TEST_FILE_PATTERNS.some((p) => p.test(path));
}

function isSourceFile(path: string): boolean {
  return /\.(js|jsx|ts|tsx|py|go|rb|java|rs|c|cpp|cs)$/.test(path) && !isTestFile(path);
}

export const testingChecker: Checker = {
  name: "testing",

  check(files: FileEntry[]): Issue[] {
    const issues: Issue[] = [];

    const testFiles = files.filter((f) => isTestFile(f.path));
    const sourceFiles = files.filter((f) => isSourceFile(f.path));

    // TST-001: No tests at all
    if (testFiles.length === 0) {
      issues.push({
        id: "TST-001",
        title: "No test files found",
        severity: "high",
        file: ".",
        detail: "No test files (*.test.*, *.spec.*, test_*, *_test.go, tests/) were found in the project",
      });
      return issues; // No point checking coverage or edge cases
    }

    // TST-002: Low test coverage ratio
    if (sourceFiles.length > 0) {
      const ratio = testFiles.length / sourceFiles.length;
      if (ratio < 0.3) {
        const pct = Math.round(ratio * 100);
        issues.push({
          id: "TST-002",
          title: "Low test file coverage",
          severity: "medium",
          file: ".",
          detail: `Test-to-source file ratio is ${pct}% (${testFiles.length} test files / ${sourceFiles.length} source files). Recommend at least 30%`,
        });
      }
    }

    // TST-003: No edge case testing
    const allTestContent = testFiles.map((f) => f.content.toLowerCase()).join("\n");
    const hasEdgeCases = EDGE_CASE_KEYWORDS.some((kw) => allTestContent.includes(kw));

    if (!hasEdgeCases) {
      issues.push({
        id: "TST-003",
        title: "No edge case testing detected",
        severity: "low",
        file: ".",
        detail: "Test files do not contain common edge case keywords (error, boundary, null, empty, invalid, etc.)",
      });
    }

    return issues;
  },
};
