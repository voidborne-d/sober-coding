import type { Checker, FileEntry, Issue } from "../scanner/types.js";

const DUPLICATE_GROUPS: string[][] = [
  ["lodash", "underscore"],
  ["moment", "dayjs", "date-fns", "luxon"],
  ["axios", "node-fetch", "got", "undici"],
  ["express", "koa", "fastify", "hapi"],
  ["mocha", "jest", "vitest", "ava"],
  ["webpack", "rollup", "esbuild", "parcel"],
  ["commander", "yargs", "meow", "cac"],
];

/** Very rough heuristic: major version 0 or pinned to exact old-looking versions */
function looksOutdated(name: string, version: string): boolean {
  // Strip leading ^ ~ >= etc
  const cleaned = version.replace(/^[\^~>=<\s]+/, "");
  const majorMatch = cleaned.match(/^(\d+)/);
  if (!majorMatch) return false;
  const major = parseInt(majorMatch[1], 10);

  // Known packages with high major versions — flag if pinned to very old major
  const knownMajors: Record<string, number> = {
    react: 18, next: 14, webpack: 5, typescript: 5, eslint: 9,
    express: 4, lodash: 4, axios: 1, jest: 29, mocha: 10,
    "node-fetch": 3, commander: 12, yargs: 17, chalk: 5,
  };

  const currentMajor = knownMajors[name];
  if (currentMajor !== undefined && major < currentMajor - 1) {
    return true;
  }

  return false;
}

export const dependencyChecker: Checker = {
  name: "dependency",

  check(files: FileEntry[]): Issue[] {
    const issues: Issue[] = [];

    const pkgFile = files.find(
      (f) => f.path === "package.json" || f.path.endsWith("/package.json")
    );
    if (!pkgFile) return issues;

    let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    try {
      pkg = JSON.parse(pkgFile.content);
    } catch {
      return issues;
    }

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const depNames = Object.keys(allDeps);
    if (depNames.length === 0) return issues;

    // Collect all import/require references from code files
    const codeFiles = files.filter((f) => /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(f.path));
    const importedPackages = new Set<string>();

    for (const file of codeFiles) {
      for (const line of file.lines) {
        // import ... from "pkg" or require("pkg")
        const importMatch = line.match(/(?:from|require\s*\()\s*['"]([^'"./][^'"]*)['"]/g);
        if (importMatch) {
          for (const m of importMatch) {
            const pkgMatch = m.match(/['"]([^'"]+)['"]/);
            if (pkgMatch) {
              // Get the package name (handle scoped packages)
              const raw = pkgMatch[1];
              const pkgName = raw.startsWith("@")
                ? raw.split("/").slice(0, 2).join("/")
                : raw.split("/")[0];
              importedPackages.add(pkgName);
            }
          }
        }
      }
    }

    // DEP-001: Unused dependencies
    for (const dep of depNames) {
      if (!importedPackages.has(dep)) {
        // Skip common non-import deps (types, plugins, configs)
        if (dep.startsWith("@types/")) continue;
        if (dep.startsWith("eslint-")) continue;
        if (dep.startsWith("prettier")) continue;
        if (dep === "typescript") continue;

        issues.push({
          id: "DEP-001",
          title: "Potentially unused dependency",
          severity: "medium",
          file: pkgFile.path,
          detail: `Package "${dep}" is listed in dependencies but not imported in any source file`,
        });
      }
    }

    // DEP-002: Duplicate functionality
    const depSet = new Set(depNames);
    for (const group of DUPLICATE_GROUPS) {
      const found = group.filter((name) => depSet.has(name));
      if (found.length >= 2) {
        issues.push({
          id: "DEP-002",
          title: "Duplicate functionality in dependencies",
          severity: "high",
          file: pkgFile.path,
          detail: `Multiple packages serving similar purpose: ${found.join(", ")}`,
        });
      }
    }

    // DEP-003: Outdated versions
    for (const [name, version] of Object.entries(allDeps)) {
      if (looksOutdated(name, version)) {
        issues.push({
          id: "DEP-003",
          title: "Potentially outdated dependency",
          severity: "low",
          file: pkgFile.path,
          detail: `Package "${name}" is pinned to version "${version}" which may be outdated`,
        });
      }
    }

    return issues;
  },
};
