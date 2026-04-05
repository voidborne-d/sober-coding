import type { Checker, FileEntry, Issue } from "../scanner/types.js";

const IMPORT_PATTERNS = [
  // JS/TS: import { foo, bar } from '...' (skip 'import type')
  { regex: /import\s+\{([^}]+)\}\s+from\s+/g, extract: (m: string) => m.split(",").map((s) => s.replace(/\s+as\s+\w+/, "").trim()).filter(Boolean) },
  // JS/TS: import foo from '...' (skip 'import type')
  { regex: /import\s+(\w+)\s+from\s+/g, extract: (m: string) => [m.trim()] },
  // Python: from x import foo, bar
  { regex: /from\s+\S+\s+import\s+(.+)/g, extract: (m: string) => m.split(",").map((s) => s.replace(/\s+as\s+\w+/, "").trim()).filter(Boolean) },
  // Python: import foo
  { regex: /^import\s+(\w+)/gm, extract: (m: string) => [m.trim()] },
];

// Skip TS type-only imports entirely
function isTypeImport(line: string): boolean {
  return /import\s+type\s+/.test(line);
}

// Patterns for function definitions
const FUNC_DEF_PATTERNS = [
  // function foo(...)
  /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
  // const foo = (...) => | const foo = function
  /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function\b)/,
];

// Patterns for lines that look like code (for commented-out code detection)
const CODE_LIKE_PATTERNS = [
  /^\s*\/\/\s*(import|export|const|let|var|function|class|if|else|for|while|return|switch|case|try|catch)\b/,
  /^\s*\/\/\s*\w+\s*[=(]/,
  /^\s*\/\/\s*\w+\.\w+\s*\(/,
  /^\s*\/\/\s*\}\s*$/,
  /^\s*\/\/\s*\{\s*$/,
  /^\s*\/\/\s*\);?\s*$/,
];

// Statements after which code is unreachable
const TERMINAL_STATEMENTS = /^\s*(return\b|throw\b|break\s*;|continue\s*;)/;

export const deadCodeChecker: Checker = {
  name: "dead-code",

  check(files: FileEntry[]): Issue[] {
    const issues: Issue[] = [];
    const supportedExts = [".js", ".ts", ".jsx", ".tsx", ".py", ".mjs", ".cjs"];

    // Build a set of all identifiers across all files for cross-file usage check
    const allContent = files
      .filter((f) => supportedExts.includes(f.path.slice(f.path.lastIndexOf("."))))
      .map((f) => f.content)
      .join("\n");

    for (const file of files) {
      const ext = file.path.slice(file.path.lastIndexOf("."));
      if (!supportedExts.includes(ext)) continue;

      // DED-002: Unused imports (original logic)
      const imports = extractImports(file);
      for (const imp of imports) {
        if (imp.name.startsWith("_") || imp.name === "*") continue;
        const restOfFile = file.lines.slice(imp.line).join("\n");
        const usageRegex = new RegExp(`\\b${escapeRegex(imp.name)}\\b`);
        if (!usageRegex.test(restOfFile)) {
          issues.push({
            id: "DED-002",
            title: `Unused import: ${imp.name}`,
            severity: "low",
            file: file.path,
            line: imp.line,
            detail: `'${imp.name}' is imported but never used. Remove it.`,
          });
        }
      }

      // DED-001: Unused functions
      const funcs = extractFunctions(file);
      for (const func of funcs) {
        const nameRegex = new RegExp(`\\b${escapeRegex(func.name)}\\b`, "g");
        // Count occurrences in the entire codebase
        let count = 0;
        let m: RegExpExecArray | null;
        nameRegex.lastIndex = 0;
        while ((m = nameRegex.exec(allContent)) !== null) {
          count++;
          if (count > 1) break; // just need to know if >1
        }
        // 1 occurrence = only the definition itself
        if (count <= 1) {
          issues.push({
            id: "DED-001",
            title: `Unused function: ${func.name}`,
            severity: "medium",
            file: file.path,
            line: func.line,
            detail: `Function '${func.name}' is defined but never called. Consider removing it.`,
          });
        }
      }

      // DED-003: Commented-out code
      checkCommentedOutCode(file, issues);

      // DED-004: Unreachable code
      checkUnreachableCode(file, issues);
    }

    return issues;
  },
};

interface ImportedName {
  name: string;
  line: number;
}

interface FuncDef {
  name: string;
  line: number;
}

function extractImports(file: FileEntry): ImportedName[] {
  const result: ImportedName[] = [];

  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i];
    const trimmed = line.trimStart();
    if (isTypeImport(line) || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;
    for (const pattern of IMPORT_PATTERNS) {
      pattern.regex.lastIndex = 0;
      const match = pattern.regex.exec(line);
      if (match && match[1]) {
        const names = pattern.extract(match[1]);
        for (const name of names) {
          if (name) result.push({ name, line: i + 1 });
        }
      }
    }
  }

  return result;
}

function extractFunctions(file: FileEntry): FuncDef[] {
  const result: FuncDef[] = [];

  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i];
    const trimmed = line.trimStart();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    for (const pattern of FUNC_DEF_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        // Skip common patterns that are always "used" (main, exports, handlers)
        const name = match[1];
        if (name === "main" || name === "constructor" || name.startsWith("_")) continue;
        result.push({ name, line: i + 1 });
        break;
      }
    }
  }

  return result;
}

function checkCommentedOutCode(file: FileEntry, issues: Issue[]): void {
  let streak = 0;
  let streakStart = 0;

  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i];
    const isCodeComment = CODE_LIKE_PATTERNS.some((p) => p.test(line));

    if (isCodeComment) {
      if (streak === 0) streakStart = i;
      streak++;
    } else {
      if (streak >= 3) {
        issues.push({
          id: "DED-003",
          title: "Commented-out code block",
          severity: "low",
          file: file.path,
          line: streakStart + 1,
          detail: `${streak} consecutive lines of commented-out code. Remove dead code instead of commenting it out.`,
        });
      }
      streak = 0;
    }
  }

  // Handle streak at end of file
  if (streak >= 3) {
    issues.push({
      id: "DED-003",
      title: "Commented-out code block",
      severity: "low",
      file: file.path,
      line: streakStart + 1,
      detail: `${streak} consecutive lines of commented-out code. Remove dead code instead of commenting it out.`,
    });
  }
}

function checkUnreachableCode(file: FileEntry, issues: Issue[]): void {
  for (let i = 0; i < file.lines.length - 1; i++) {
    const line = file.lines[i];
    if (!TERMINAL_STATEMENTS.test(line)) continue;

    // Check the next non-empty line
    let j = i + 1;
    while (j < file.lines.length && file.lines[j].trim() === "") j++;
    if (j >= file.lines.length) continue;

    const nextLine = file.lines[j].trimStart();
    // Skip closing braces, case labels, else — those are structural, not unreachable
    if (nextLine.startsWith("}") || nextLine.startsWith("case ") || nextLine.startsWith("default:") || nextLine.startsWith("else") || nextLine.startsWith("catch") || nextLine.startsWith("finally")) continue;

    // The next line is actual code after a terminal statement
    issues.push({
      id: "DED-004",
      title: "Unreachable code",
      severity: "medium",
      file: file.path,
      line: j + 1,
      detail: "Code after return/break/continue/throw is unreachable.",
    });
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
