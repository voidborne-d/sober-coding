import type { Checker, FileEntry, Issue } from "../scanner/types.js";

export const errorHandlingChecker: Checker = {
  name: "error-handling",

  check(files: FileEntry[]): Issue[] {
    const issues: Issue[] = [];

    for (const file of files) {
      checkEmptyCatch(file, issues);
      checkNoErrorHandling(file, issues);
      checkGenericCatch(file, issues);
      checkMissingInputValidation(file, issues);
    }

    return issues;
  },
};

// ERR-001: Empty catch blocks
function checkEmptyCatch(file: FileEntry, issues: Issue[]): void {
  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i].trimStart();

    // catch (...) { } on same line
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
      issues.push({
        id: "ERR-001",
        title: "Empty catch block",
        severity: "high",
        file: file.path,
        line: i + 1,
        detail: "Catch block is empty. At minimum, log the error.",
      });
      continue;
    }

    // catch (...) { on this line, check if next non-blank/comment line is }
    if (/catch\s*\([^)]*\)\s*\{/.test(line)) {
      let j = i + 1;
      let empty = true;
      while (j < file.lines.length) {
        const next = file.lines[j].trimStart();
        if (next === "" || next.startsWith("//") || next.startsWith("*") || next.startsWith("/*")) {
          j++;
          continue;
        }
        if (next.startsWith("}")) {
          // empty or comment-only catch
        } else {
          empty = false;
        }
        break;
      }
      if (empty && j < file.lines.length) {
        issues.push({
          id: "ERR-001",
          title: "Empty catch block",
          severity: "high",
          file: file.path,
          line: i + 1,
          detail: "Catch block is empty (or contains only comments). At minimum, log the error.",
        });
      }
    }

    // Python: except ...: with empty body
    if (/except\s.*:\s*$/.test(line) || line === "except:") {
      let j = i + 1;
      if (j < file.lines.length) {
        const next = file.lines[j].trimStart();
        if (next === "pass" || next === "") {
          issues.push({
            id: "ERR-001",
            title: "Empty except block",
            severity: "high",
            file: file.path,
            line: i + 1,
            detail: "Except block only contains 'pass'. At minimum, log the error.",
          });
        }
      }
    }
  }
}

// ERR-002: No error handling in async functions / missing .catch()
function checkNoErrorHandling(file: FileEntry, issues: Issue[]): void {
  const content = file.content;

  // Check async functions without try-catch
  const asyncFuncRegex = /async\s+function\s+(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = asyncFuncRegex.exec(content)) !== null) {
    const funcName = match[1];
    const startIdx = match.index;
    const body = extractBlock(content, startIdx);
    if (body && !body.includes("try") && !body.includes("catch")) {
      const line = content.slice(0, startIdx).split("\n").length;
      issues.push({
        id: "ERR-002",
        title: `Async function '${funcName}' has no error handling`,
        severity: "medium",
        file: file.path,
        line,
        detail: "Async function has no try-catch. Unhandled promise rejections may crash the process.",
      });
    }
  }

  // Also check const foo = async (...) =>
  const asyncArrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*async\s/g;
  while ((match = asyncArrowRegex.exec(content)) !== null) {
    const funcName = match[1];
    const startIdx = match.index;
    const body = extractBlock(content, startIdx);
    if (body && !body.includes("try") && !body.includes("catch")) {
      const line = content.slice(0, startIdx).split("\n").length;
      issues.push({
        id: "ERR-002",
        title: `Async function '${funcName}' has no error handling`,
        severity: "medium",
        file: file.path,
        line,
        detail: "Async function has no try-catch. Unhandled promise rejections may crash the process.",
      });
    }
  }

  // Check .then() without .catch()
  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i];
    if (/\.then\s*\(/.test(line) && !/.catch\s*\(/.test(line)) {
      // Look ahead a few lines for .catch
      let hasCatch = false;
      for (let j = i + 1; j < Math.min(i + 5, file.lines.length); j++) {
        if (/\.catch\s*\(/.test(file.lines[j])) {
          hasCatch = true;
          break;
        }
      }
      if (!hasCatch) {
        issues.push({
          id: "ERR-002",
          title: "Promise .then() without .catch()",
          severity: "medium",
          file: file.path,
          line: i + 1,
          detail: "Promise chain has .then() but no .catch(). Add error handling.",
        });
      }
    }
  }
}

// ERR-003: Generic catches — single catch wrapping entire function body
function checkGenericCatch(file: FileEntry, issues: Issue[]): void {
  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i].trimStart();

    // Detect function with try as first statement and catch wrapping everything
    if (/^(?:async\s+)?function\s/.test(line) || /=>\s*\{/.test(line)) {
      // Find the opening brace
      let braceIdx = i;
      while (braceIdx < file.lines.length && !file.lines[braceIdx].includes("{")) braceIdx++;
      if (braceIdx >= file.lines.length) continue;

      // Check if next non-empty line is 'try {'
      let nextLine = braceIdx + 1;
      while (nextLine < file.lines.length && file.lines[nextLine].trim() === "") nextLine++;
      if (nextLine < file.lines.length && /^\s*try\s*\{/.test(file.lines[nextLine])) {
        // Check: is the catch at the end of the function (only } after catch block)?
        const tryLine = nextLine;
        let depth = 0;
        let catchLine = -1;
        for (let j = tryLine; j < file.lines.length; j++) {
          for (const ch of file.lines[j]) {
            if (ch === "{") depth++;
            if (ch === "}") depth--;
          }
          if (depth === 0 && /catch\s*\(/.test(file.lines[j + 1] ?? "")) {
            catchLine = j + 1;
            break;
          }
          if (/\}\s*catch\s*\(/.test(file.lines[j]) && depth <= 1) {
            catchLine = j;
            break;
          }
        }
        if (catchLine > 0) {
          issues.push({
            id: "ERR-003",
            title: "Generic catch wrapping entire function",
            severity: "medium",
            file: file.path,
            line: catchLine + 1,
            detail: "Single try-catch wraps entire function body. Use granular error handling for different operations.",
          });
        }
      }
    }
  }
}

// ERR-004: Missing input validation in API handlers
function checkMissingInputValidation(file: FileEntry, issues: Issue[]): void {
  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i];

    // Detect (req, res) handler signature
    if (!/\(\s*req\s*,\s*res\s*[),]/.test(line) && !/\(\s*request\s*,\s*response\s*[),]/.test(line)) continue;

    // Scan the handler body for direct usage of req.body/req.params without validation
    const bodyEnd = findBlockEnd(file.lines, i);
    let usesInput = false;
    let hasValidation = false;

    for (let j = i + 1; j <= bodyEnd && j < file.lines.length; j++) {
      const handlerLine = file.lines[j];
      if (/req\.(body|params|query)\s*[\[.]/.test(handlerLine) || /request\.(body|params|query)\s*[\[.]/.test(handlerLine)) {
        usesInput = true;
      }
      // Common validation patterns
      if (/\b(validate|validation|schema|joi|zod|yup|ajv|check|assert|sanitize)\b/i.test(handlerLine)) {
        hasValidation = true;
      }
      if (/if\s*\(\s*!?\s*req\.(body|params|query)/.test(handlerLine)) {
        hasValidation = true;
      }
      if (/typeof\s+req\.(body|params|query)/.test(handlerLine)) {
        hasValidation = true;
      }
    }

    if (usesInput && !hasValidation) {
      issues.push({
        id: "ERR-004",
        title: "Missing input validation",
        severity: "high",
        file: file.path,
        line: i + 1,
        detail: "API handler uses req.body/params/query without validation. Add input validation.",
      });
    }
  }
}

function findBlockEnd(lines: string[], start: number): number {
  let depth = 0;
  let found = false;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") { depth++; found = true; }
      if (ch === "}") depth--;
    }
    if (found && depth <= 0) return i;
  }
  return Math.min(start + 50, lines.length - 1);
}

function extractBlock(content: string, startIdx: number): string | null {
  const braceIdx = content.indexOf("{", startIdx);
  if (braceIdx === -1) return null;
  let depth = 0;
  let end = braceIdx;
  for (let i = braceIdx; i < content.length; i++) {
    if (content[i] === "{") depth++;
    if (content[i] === "}") depth--;
    if (depth === 0) { end = i; break; }
  }
  return content.slice(braceIdx, end + 1);
}
