import crypto from "node:crypto";
import type { Checker, FileEntry, Issue } from "../scanner/types.js";

const MIN_BLOCK_SIZE = 6;

function hashLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed === "{" || trimmed === "}") {
    return "";
  }
  return crypto.createHash("md5").update(trimmed).digest("hex");
}

/** Normalize a line: strip whitespace, replace identifiers with a placeholder */
function normalizeLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed === "{" || trimmed === "}") {
    return "";
  }
  // Replace quoted strings with placeholder
  let normalized = trimmed.replace(/(["'`])(?:(?!\1).)*\1/g, '"__STR__"');
  // Replace identifiers (variable/function names) with placeholder, but keep keywords
  const keywords = new Set([
    "if", "else", "for", "while", "return", "function", "class", "const", "let", "var",
    "import", "export", "from", "try", "catch", "finally", "throw", "new", "switch",
    "case", "break", "continue", "default", "do", "typeof", "instanceof", "in", "of",
    "async", "await", "yield", "void", "delete", "this", "super", "extends", "implements",
    "interface", "type", "enum", "null", "undefined", "true", "false",
  ]);
  normalized = normalized.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, (match) =>
    keywords.has(match) ? match : "__ID__"
  );
  return normalized;
}

function hashNormalized(line: string): string {
  const n = normalizeLine(line);
  if (!n) return "";
  return crypto.createHash("md5").update(n).digest("hex");
}

const CONTROL_KEYWORDS = /\b(if|else|for|while|return|function|class|try|catch|switch|case|throw)\b/g;

/** Extract control-flow keyword sequence from a line */
function extractControlFlow(line: string): string[] {
  const matches = line.match(CONTROL_KEYWORDS);
  return matches ?? [];
}

export const duplicationChecker: Checker = {
  name: "duplication",

  check(files: FileEntry[]): Issue[] {
    const issues: Issue[] = [];

    // --- DUP-001: Exact duplicates ---
    const blockMap = new Map<string, { file: string; startLine: number }>();

    for (const file of files) {
      const hashes = file.lines.map(hashLine);

      for (let i = 0; i <= hashes.length - MIN_BLOCK_SIZE; i++) {
        const block = hashes.slice(i, i + MIN_BLOCK_SIZE);
        if (block.some((h) => h === "")) continue;

        const blockHash = block.join("|");
        const existing = blockMap.get(blockHash);

        if (existing && existing.file !== file.path) {
          issues.push({
            id: "DUP-001",
            title: "Exact duplicate code block",
            severity: "medium",
            file: file.path,
            line: i + 1,
            detail: `${MIN_BLOCK_SIZE}-line block duplicated from ${existing.file}:${existing.startLine}`,
          });
        } else if (!existing) {
          blockMap.set(blockHash, { file: file.path, startLine: i + 1 });
        }
      }
    }

    // --- DUP-002: Near clones (normalized hash matching) ---
    const nearMap = new Map<string, { file: string; startLine: number }>();
    const exactKeys = new Set(blockMap.keys());

    for (const file of files) {
      const normHashes = file.lines.map(hashNormalized);

      for (let i = 0; i <= normHashes.length - MIN_BLOCK_SIZE; i++) {
        const block = normHashes.slice(i, i + MIN_BLOCK_SIZE);
        if (block.some((h) => h === "")) continue;

        const normBlockHash = block.join("|");

        // Skip if already reported as exact duplicate
        const rawHashes = file.lines.slice(i, i + MIN_BLOCK_SIZE).map(hashLine);
        const rawKey = rawHashes.join("|");
        if (exactKeys.has(rawKey)) continue;

        const existing = nearMap.get(normBlockHash);

        if (existing && existing.file !== file.path) {
          issues.push({
            id: "DUP-002",
            title: "Near-clone code block",
            severity: "low",
            file: file.path,
            line: i + 1,
            detail: `${MIN_BLOCK_SIZE}-line block is a near clone of ${existing.file}:${existing.startLine}`,
          });
        } else if (!existing) {
          nearMap.set(normBlockHash, { file: file.path, startLine: i + 1 });
        }
      }
    }

    // --- DUP-003: Structural clones (control-flow sequence matching) ---
    const MIN_CONTROL_FLOW_LEN = 8;
    const structMap = new Map<string, { file: string; startLine: number }>();
    const TEST_FILE_PATTERN = /\.(test|spec)\.[^.]+$|_test\.\w+$|test_[^/]+$|__tests__/;

    for (const file of files) {
      // Skip test files — repetitive control flow is normal in tests
      if (TEST_FILE_PATTERN.test(file.path)) continue;
      // Build control-flow sequence for the file
      const cfSequence: { keywords: string[]; line: number }[] = [];
      for (let i = 0; i < file.lines.length; i++) {
        const kws = extractControlFlow(file.lines[i]);
        if (kws.length > 0) {
          cfSequence.push({ keywords: kws, line: i + 1 });
        }
      }

      // Skip files with too few control-flow keywords
      if (cfSequence.length < MIN_CONTROL_FLOW_LEN) continue;

      // Slide a window over control-flow entries
      for (let i = 0; i <= cfSequence.length - MIN_CONTROL_FLOW_LEN; i++) {
        const window = cfSequence.slice(i, i + MIN_CONTROL_FLOW_LEN);
        const key = window.map((e) => e.keywords.join(",")).join("|");
        const existing = structMap.get(key);

        // Only report cross-file structural clones (skip same-file matches)
        if (existing && existing.file !== file.path) {
          issues.push({
            id: "DUP-003",
            title: "Structural clone detected",
            severity: "low",
            file: file.path,
            line: window[0].line,
            detail: `Control-flow pattern matches ${existing.file}:${existing.startLine}`,
          });
        } else if (!existing) {
          structMap.set(key, { file: file.path, startLine: window[0].line });
        }
      }
    }

    return issues;
  },
};
