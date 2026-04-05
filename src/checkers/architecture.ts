import type { Checker, FileEntry, Issue } from "../scanner/types.js";

const DB_PATTERNS = [/\bSELECT\b/i, /\bINSERT\b/i, /\bUPDATE\b/i, /\bDELETE\b/i, /\.query\s*\(/];
const HTTP_PATTERNS = [/\breq\s*,\s*res\b/, /\bapp\.(get|post|put|delete|patch)\s*\(/, /\brouter\.(get|post|put|delete|patch)\s*\(/];

function extractImportPath(line: string): string | null {
  // JS/TS: import ... from './foo'
  const jsMatch = line.match(/import\s+.+\s+from\s+['"]([^'"]+)['"]/);
  if (jsMatch) return jsMatch[1];
  // JS/TS: require('./foo')
  const reqMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  if (reqMatch) return reqMatch[1];
  // Python: from foo import ...
  const pyMatch = line.match(/^from\s+(\S+)\s+import/);
  if (pyMatch) return pyMatch[1];
  return null;
}

function normalizePath(importerPath: string, importPath: string): string {
  if (!importPath.startsWith(".")) return importPath;
  const parts = importerPath.split("/");
  parts.pop(); // remove filename
  for (const seg of importPath.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/").replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, "");
}

function fileKey(filePath: string): string {
  return filePath.replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, "");
}

function countLeadingIndent(line: string): number {
  const match = line.match(/^(\s*)\S/);
  if (!match) return 0;
  const ws = match[1];
  // Count tabs as 4, spaces as 1
  let count = 0;
  for (const ch of ws) {
    count += ch === "\t" ? 4 : 1;
  }
  return count;
}

export const architectureChecker: Checker = {
  name: "architecture",

  check(files: FileEntry[]): Issue[] {
    const issues: Issue[] = [];

    // Build import graph for circular dependency detection
    const importGraph = new Map<string, Set<string>>();
    for (const file of files) {
      const key = fileKey(file.path);
      const targets = new Set<string>();
      for (const line of file.lines) {
        const imp = extractImportPath(line.trimStart());
        if (imp && imp.startsWith(".")) {
          targets.add(normalizePath(file.path, imp));
        }
      }
      importGraph.set(key, targets);
    }

    for (const file of files) {
      // ARC-001: God files
      if (file.lines.length > 500) {
        issues.push({
          id: "ARC-001",
          title: "God file",
          severity: "medium",
          file: file.path,
          detail: `File has ${file.lines.length} lines (>500). Consider splitting into smaller modules.`,
        });
      }

      // ARC-002: Circular dependencies
      const key = fileKey(file.path);
      const myImports = importGraph.get(key);
      if (myImports) {
        for (const target of myImports) {
          const theirImports = importGraph.get(target);
          if (theirImports?.has(key)) {
            // Only report once (alphabetical order)
            if (key < target) {
              issues.push({
                id: "ARC-002",
                title: "Circular dependency",
                severity: "high",
                file: file.path,
                detail: `Circular dependency between '${file.path}' and '${target}'. Extract shared code into a separate module.`,
              });
            }
          }
        }
      }

      // ARC-003: Mixed concerns
      const content = file.content;
      const hasDB = DB_PATTERNS.some((p) => p.test(content));
      const hasHTTP = HTTP_PATTERNS.some((p) => p.test(content));
      if (hasDB && hasHTTP) {
        issues.push({
          id: "ARC-003",
          title: "Mixed concerns",
          severity: "medium",
          file: file.path,
          detail: "File mixes database operations and HTTP handlers. Separate into distinct layers.",
        });
      }

      // ARC-004: Deep nesting
      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        if (!line.trim()) continue;
        const indent = countLeadingIndent(line);
        const nestLevel = Math.floor(indent / 4);
        if (nestLevel > 4) {
          issues.push({
            id: "ARC-004",
            title: "Deep nesting",
            severity: "medium",
            file: file.path,
            line: i + 1,
            detail: `Nesting level ${nestLevel} (>4). Refactor using early returns or extract helper functions.`,
          });
        }
      }

      // ARC-005: Spaghetti imports
      let importCount = 0;
      for (const line of file.lines) {
        const trimmed = line.trimStart();
        if (/^import\s+type\s+/.test(trimmed)) continue; // skip type-only
        if (/^import\s/.test(trimmed) || /^from\s+\S+\s+import/.test(trimmed)) {
          importCount++;
        }
      }
      if (importCount > 15) {
        issues.push({
          id: "ARC-005",
          title: "Spaghetti imports",
          severity: "low",
          file: file.path,
          detail: `File has ${importCount} imports (>15). Consider consolidating or splitting the module.`,
        });
      }
    }

    return issues;
  },
};
