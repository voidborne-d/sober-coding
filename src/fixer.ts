export interface FixSuggestion {
  id: string;
  title: string;
  why: string;
  howToFix: string[];
  autoFixAvailable: boolean;
}

const fixes: Record<string, FixSuggestion> = {
  "SEC-001": {
    id: "SEC-001",
    title: "Hardcoded secrets",
    why: "Secrets in source code can be leaked through version control, logs, or error messages. Attackers scan public repos for these patterns.",
    howToFix: [
      "Move secrets to environment variables (process.env.API_KEY)",
      "Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, dotenv)",
      "Add .env to .gitignore to prevent accidental commits",
      "Rotate any secrets that were previously committed",
    ],
    autoFixAvailable: false,
  },
  "SEC-002": {
    id: "SEC-002",
    title: "SQL injection risk",
    why: "String concatenation in SQL queries allows attackers to inject arbitrary SQL commands, potentially reading or destroying your database.",
    howToFix: [
      "Use parameterized queries / prepared statements",
      "Use an ORM (Prisma, Drizzle, SQLAlchemy) instead of raw SQL",
      "If raw SQL is needed, use query builder libraries with escaping",
    ],
    autoFixAvailable: false,
  },
  "SEC-003": {
    id: "SEC-003",
    title: "Path traversal risk",
    why: "Unsanitized user input in file paths allows attackers to read/write files outside the intended directory (e.g., ../../etc/passwd).",
    howToFix: [
      "Validate and sanitize file paths with path.resolve() + prefix check",
      "Use a whitelist of allowed filenames or directories",
      "Never pass user input directly to fs operations",
    ],
    autoFixAvailable: false,
  },
  "SEC-004": {
    id: "SEC-004",
    title: "Insecure dependency",
    why: "Known-compromised packages can execute malicious code during install or at runtime.",
    howToFix: [
      "Remove the compromised package immediately",
      "Run `npm audit` or `yarn audit` to find alternatives",
      "Use a lockfile and enable dependency review in CI",
    ],
    autoFixAvailable: false,
  },
  "SEC-005": {
    id: "SEC-005",
    title: "CORS misconfiguration",
    why: "Allowing all origins (Access-Control-Allow-Origin: *) lets any website make requests to your API, potentially exposing user data.",
    howToFix: [
      "Set specific allowed origins instead of '*'",
      "Use a CORS middleware with a whitelist of trusted domains",
      "For APIs with credentials, never use wildcard origins",
    ],
    autoFixAvailable: false,
  },
  "ARC-001": {
    id: "ARC-001",
    title: "God file (>500 lines)",
    why: "Large files are harder to understand, test, and maintain. They often indicate mixed responsibilities.",
    howToFix: [
      "Identify distinct responsibilities within the file",
      "Extract each responsibility into its own module",
      "Use a barrel file (index.ts) to re-export if needed",
      "Aim for files under 200-300 lines",
    ],
    autoFixAvailable: false,
  },
  "ARC-002": {
    id: "ARC-002",
    title: "Circular dependency",
    why: "Circular imports cause initialization order bugs, bundler issues, and make the dependency graph hard to reason about.",
    howToFix: [
      "Extract shared types/interfaces into a separate module",
      "Use dependency inversion (depend on abstractions, not concretions)",
      "Reorganize modules to form a DAG (directed acyclic graph)",
    ],
    autoFixAvailable: false,
  },
  "ARC-003": {
    id: "ARC-003",
    title: "Mixed concerns",
    why: "Mixing database logic with HTTP handling makes code hard to test and violates separation of concerns.",
    howToFix: [
      "Separate into layers: routes/controllers, services, repositories",
      "Database queries go in a repository/data-access layer",
      "HTTP handling stays in route handlers/controllers",
    ],
    autoFixAvailable: false,
  },
  "ARC-004": {
    id: "ARC-004",
    title: "Deep nesting (>4 levels)",
    why: "Deeply nested code is hard to read and often indicates complex logic that should be simplified.",
    howToFix: [
      "Use early returns / guard clauses to reduce nesting",
      "Extract nested blocks into well-named helper functions",
      "Replace nested conditionals with switch/lookup tables",
    ],
    autoFixAvailable: false,
  },
  "ARC-005": {
    id: "ARC-005",
    title: "Spaghetti imports (>15 imports)",
    why: "Too many imports signal that a module depends on too many things and likely has too many responsibilities.",
    howToFix: [
      "Split the file into smaller, focused modules",
      "Group related imports behind a facade/barrel module",
      "Check if some imports are unused and remove them",
    ],
    autoFixAvailable: false,
  },
  "DUP-001": {
    id: "DUP-001",
    title: "Exact duplicate code block",
    why: "Copy-pasted code means bugs must be fixed in multiple places. Changes diverge over time.",
    howToFix: [
      "Extract the duplicated block into a shared function",
      "Place the shared function in a utils/helpers module",
      "Import and call the function from both locations",
    ],
    autoFixAvailable: false,
  },
  "DUP-002": {
    id: "DUP-002",
    title: "Near-clone code block",
    why: "Near-clones are copy-paste with minor edits. They're harder to spot but cause the same maintenance issues.",
    howToFix: [
      "Identify the differences between the clones",
      "Parameterize the differences as function arguments",
      "Extract a single generic function that handles both cases",
    ],
    autoFixAvailable: false,
  },
  "DUP-003": {
    id: "DUP-003",
    title: "Structural clone detected",
    why: "Same control-flow structure across files suggests a pattern that should be abstracted.",
    howToFix: [
      "Review both files to confirm the structural similarity",
      "Extract the common pattern into a shared utility or base class",
      "Consider using a strategy/template pattern if the structure is intentional",
    ],
    autoFixAvailable: false,
  },
  "ERR-001": {
    id: "ERR-001",
    title: "Empty catch block",
    why: "Swallowing errors silently makes debugging nearly impossible. Failures go unnoticed until they cascade.",
    howToFix: [
      "At minimum, log the error: console.error(err)",
      "Re-throw if you can't handle it meaningfully",
      "If intentionally ignoring, add a comment explaining why",
    ],
    autoFixAvailable: false,
  },
  "ERR-002": {
    id: "ERR-002",
    title: "No error handling in async function",
    why: "Unhandled promise rejections crash Node.js processes and cause silent failures in browsers.",
    howToFix: [
      "Wrap async logic in try/catch blocks",
      "Add .catch() to promise chains",
      "Use an error boundary or global error handler as a safety net",
    ],
    autoFixAvailable: false,
  },
  "ERR-003": {
    id: "ERR-003",
    title: "Generic catch wrapping entire function",
    why: "A single try/catch around an entire function obscures which operation actually failed.",
    howToFix: [
      "Wrap only the specific operations that can fail",
      "Use separate try/catch blocks for distinct failure modes",
      "Let unexpected errors propagate to a global handler",
    ],
    autoFixAvailable: false,
  },
  "ERR-004": {
    id: "ERR-004",
    title: "Missing input validation",
    why: "Unvalidated user input leads to crashes, security holes, and corrupted data.",
    howToFix: [
      "Use a validation library (zod, joi, yup) at API boundaries",
      "Validate req.body, req.params, and req.query before use",
      "Return 400 with a descriptive error for invalid input",
    ],
    autoFixAvailable: false,
  },
  "DEP-001": {
    id: "DEP-001",
    title: "Unused dependency",
    why: "Unused dependencies bloat install size, increase attack surface, and slow down CI.",
    howToFix: [
      "Remove with `npm uninstall <package>`",
      "If used indirectly (plugin/preset), move to devDependencies",
      "Run `npx depcheck` for a comprehensive unused dependency scan",
    ],
    autoFixAvailable: false,
  },
  "DEP-002": {
    id: "DEP-002",
    title: "Duplicate functionality",
    why: "Multiple packages doing the same thing waste bundle size and cause inconsistency.",
    howToFix: [
      "Choose one package per function (e.g., either lodash or underscore)",
      "Migrate all usage to the chosen package",
      "Remove the redundant package",
    ],
    autoFixAvailable: false,
  },
  "DEP-003": {
    id: "DEP-003",
    title: "Outdated dependency version",
    why: "Outdated dependencies miss security patches and bug fixes.",
    howToFix: [
      "Run `npm outdated` to see latest versions",
      "Update with `npm update` or manually bump in package.json",
      "Test thoroughly after updating major versions",
    ],
    autoFixAvailable: false,
  },
  "TST-001": {
    id: "TST-001",
    title: "No test files found",
    why: "Code without tests is code you can't confidently refactor, deploy, or review.",
    howToFix: [
      "Set up a test framework (vitest, jest, or mocha)",
      "Start with tests for critical business logic",
      "Add test scripts to package.json",
    ],
    autoFixAvailable: false,
  },
  "TST-002": {
    id: "TST-002",
    title: "Low test coverage",
    why: "Low test-to-source ratio means large parts of the codebase are untested and fragile.",
    howToFix: [
      "Prioritize testing business-critical paths",
      "Aim for at least 60% test-to-source file ratio",
      "Use coverage tools (c8, istanbul) to find untested code",
    ],
    autoFixAvailable: false,
  },
  "TST-003": {
    id: "TST-003",
    title: "No edge case testing",
    why: "Tests without edge cases only verify the happy path. Real bugs hide in boundaries and error states.",
    howToFix: [
      "Add tests for null/undefined/empty inputs",
      "Test boundary values (0, -1, MAX_INT, empty string)",
      "Test error paths (network failures, invalid data, timeouts)",
    ],
    autoFixAvailable: false,
  },
  "DED-001": {
    id: "DED-001",
    title: "Unused function",
    why: "Dead functions clutter the codebase and confuse readers about what's actually used.",
    howToFix: [
      "Verify the function is truly unused (search across the entire project)",
      "Delete it — version control preserves history if you need it back",
      "If it's a public API, check if external consumers depend on it",
    ],
    autoFixAvailable: false,
  },
  "DED-002": {
    id: "DED-002",
    title: "Unused import",
    why: "Unused imports add noise and can slow down bundling.",
    howToFix: [
      "Remove the unused import statement",
      "Enable the no-unused-vars ESLint rule to catch these automatically",
      "Use your editor's 'organize imports' feature",
    ],
    autoFixAvailable: false,
  },
  "DED-003": {
    id: "DED-003",
    title: "Commented-out code block",
    why: "Commented code is dead weight. It confuses readers about intent and never gets cleaned up.",
    howToFix: [
      "Delete the commented code — git history preserves it",
      "If it's a TODO, convert to a proper TODO comment or issue",
      "If it's debugging code, use a debug flag instead",
    ],
    autoFixAvailable: false,
  },
  "DED-004": {
    id: "DED-004",
    title: "Unreachable code",
    why: "Code after return/throw/break can never execute. It indicates a logic error or leftover code.",
    howToFix: [
      "Remove the unreachable code",
      "If the logic is needed, move it before the return/throw/break",
      "Check if the early return was added by mistake",
    ],
    autoFixAvailable: false,
  },
};

export function getFix(id: string): FixSuggestion | null {
  return fixes[id.toUpperCase()] ?? null;
}
