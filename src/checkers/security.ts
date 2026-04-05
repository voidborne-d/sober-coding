import type { Checker, FileEntry, Issue } from "../scanner/types.js";

const SECRET_PATTERNS = [
  { regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"']{8,}["']/gi, label: "API key" },
  { regex: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']+["']/gi, label: "password" },
  { regex: /(?:secret|secret[_-]?key)\s*[:=]\s*["'][^"']{8,}["']/gi, label: "secret" },
  { regex: /(?:token|access[_-]?token|auth[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/gi, label: "token" },
  { regex: /(?:private[_-]?key)\s*[:=]\s*["'][^"']{8,}["']/gi, label: "private key" },
  { regex: /(?:AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID)\s*[:=]\s*["'][^"']+["']/gi, label: "AWS credential" },
  { regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g, label: "private key file" },
];

const SQL_INJECTION_PATTERNS = [
  /["']SELECT\s.+["']\s*\+/i,
  /["']INSERT\s.+["']\s*\+/i,
  /["']UPDATE\s.+["']\s*\+/i,
  /["']DELETE\s.+["']\s*\+/i,
  /f["']SELECT\s[^"']*\{/i,
  /f["']INSERT\s[^"']*\{/i,
  /f["']UPDATE\s[^"']*\{/i,
  /f["']DELETE\s[^"']*\{/i,
  /query\(\s*f["']/i,
  /query\(\s*["']\s*\+/i,
  /execute\(\s*f["']/i,
  /execute\(\s*["']\s*\+/i,
  /`SELECT\s[^`]*\$\{/i,
  /`INSERT\s[^`]*\$\{/i,
  /`UPDATE\s[^`]*\$\{/i,
  /`DELETE\s[^`]*\$\{/i,
];

const PATH_TRAVERSAL_INPUT = /req\.(params|query|body)\s*[\[.]/;
const PATH_TRAVERSAL_SINKS = [
  /fs\.\w*[Rr]ead/,
  /fs\.\w*[Ww]rite/,
  /fs\.access/,
  /fs\.stat/,
  /open\(/,
  /path\.join\(/,
  /path\.resolve\(/,
  /readFile/,
  /writeFile/,
];

const INSECURE_NPM_PACKAGES = [
  "event-stream",
  "flatmap-stream",
  "coa",
  "rc",
  "colors",
  "faker",
];

const INSECURE_VERSION_PACKAGES: Array<{ name: string; vulnerableBelow: string }> = [
  { name: "ua-parser-js", vulnerableBelow: "0.7.30" },
  { name: "log4js", vulnerableBelow: "6.4.0" },
  { name: "minimist", vulnerableBelow: "1.2.6" },
  { name: "node-forge", vulnerableBelow: "1.3.0" },
];

function isVersionBelow(version: string, threshold: string): boolean {
  const clean = (v: string) => v.replace(/^[^0-9]*/, "");
  const a = clean(version).split(".").map(Number);
  const b = clean(threshold).split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av < bv) return true;
    if (av > bv) return false;
  }
  return false;
}

const CORS_PATTERNS = [
  /Access-Control-Allow-Origin['":\s]*\*/,
  /cors\(\s*\{\s*origin\s*:\s*['"`]\*['"`]/,
  /cors\(\s*\)/,
];

export const securityChecker: Checker = {
  name: "security",

  check(files: FileEntry[]): Issue[] {
    const issues: Issue[] = [];

    for (const file of files) {
      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const lineNum = i + 1;
        const trimmedLine = line.trimStart();

        // Skip comment-only lines and pure string lines (avoid false positives in docs/examples)
        if (trimmedLine.startsWith("//") || trimmedLine.startsWith("#") || trimmedLine.startsWith("*") || trimmedLine.startsWith("/*")) continue;

        // SEC-001: Hardcoded secrets
        for (const { regex, label } of SECRET_PATTERNS) {
          regex.lastIndex = 0;
          if (regex.test(line)) {
            issues.push({
              id: "SEC-001",
              title: `Hardcoded ${label}`,
              severity: "critical",
              file: file.path,
              line: lineNum,
              detail: `Found hardcoded ${label} in source code. Move to environment variables.`,
            });
          }
        }

        // SEC-002: SQL injection
        for (const pattern of SQL_INJECTION_PATTERNS) {
          if (pattern.test(line)) {
            issues.push({
              id: "SEC-002",
              title: "Potential SQL injection",
              severity: "critical",
              file: file.path,
              line: lineNum,
              detail: "SQL query built via string concatenation or template interpolation. Use parameterized queries.",
            });
            break;
          }
        }

        // SEC-003: Path traversal
        if (PATH_TRAVERSAL_INPUT.test(line)) {
          for (const sink of PATH_TRAVERSAL_SINKS) {
            if (sink.test(line)) {
              issues.push({
                id: "SEC-003",
                title: "Potential path traversal",
                severity: "high",
                file: file.path,
                line: lineNum,
                detail: "User input from req.params/query/body used directly in file system operation. Sanitize the path first.",
              });
              break;
            }
          }
        }

        // SEC-005: CORS misconfiguration (only trigger on actual code, not string content)
        // Skip if the match is inside a string value assignment (e.g., why: "...Access-Control...")
        const isDocLine = /^\s*(?:why|title|description|message|detail|label|text|comment|error)\s*[:=]/.test(line);
        for (const pattern of CORS_PATTERNS) {
          if (!isDocLine && pattern.test(line)) {
            issues.push({
              id: "SEC-005",
              title: "CORS misconfiguration",
              severity: "high",
              file: file.path,
              line: lineNum,
              detail: "Overly permissive CORS configuration detected. Restrict allowed origins.",
            });
            break;
          }
        }
      }

      // SEC-004: Insecure dependencies
      const basename = file.path.split("/").pop() ?? "";
      if (basename === "package.json") {
        checkPackageJson(file, issues);
      } else if (basename === "requirements.txt") {
        checkRequirementsTxt(file, issues);
      }
    }

    return issues;
  },
};

function checkPackageJson(file: FileEntry, issues: Issue[]): void {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(file.content);
  } catch {
    return;
  }

  const allDeps: Record<string, string> = {
    ...(parsed.dependencies as Record<string, string> | undefined),
    ...(parsed.devDependencies as Record<string, string> | undefined),
  };

  for (const pkg of INSECURE_NPM_PACKAGES) {
    if (pkg in allDeps) {
      const lineNum = findLineInFile(file, pkg);
      issues.push({
        id: "SEC-004",
        title: `Insecure dependency: ${pkg}`,
        severity: "critical",
        file: file.path,
        line: lineNum,
        detail: `Package '${pkg}' is known to be compromised. Remove or replace it.`,
      });
    }
  }

  for (const { name, vulnerableBelow } of INSECURE_VERSION_PACKAGES) {
    if (name in allDeps && isVersionBelow(allDeps[name], vulnerableBelow)) {
      const lineNum = findLineInFile(file, name);
      issues.push({
        id: "SEC-004",
        title: `Insecure dependency version: ${name}`,
        severity: "high",
        file: file.path,
        line: lineNum,
        detail: `Package '${name}' version ${allDeps[name]} is below safe version ${vulnerableBelow}. Upgrade it.`,
      });
    }
  }
}

function checkRequirementsTxt(file: FileEntry, issues: Issue[]): void {
  const knownBad = ["pyyaml<5.4", "urllib3<1.26.5", "requests<2.20.0"];
  for (let i = 0; i < file.lines.length; i++) {
    const line = file.lines[i].trim().toLowerCase();
    if (!line || line.startsWith("#")) continue;
    for (const bad of knownBad) {
      if (line.includes(bad.split("<")[0]) && line.includes("<") && line.includes(bad.split("<")[1])) {
        issues.push({
          id: "SEC-004",
          title: `Insecure dependency: ${line}`,
          severity: "high",
          file: file.path,
          line: i + 1,
          detail: `Dependency appears to pin an insecure version. Upgrade it.`,
        });
      }
    }
  }
}

function findLineInFile(file: FileEntry, needle: string): number | undefined {
  for (let i = 0; i < file.lines.length; i++) {
    if (file.lines[i].includes(needle)) return i + 1;
  }
  return undefined;
}
