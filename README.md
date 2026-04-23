# 🧊 Sober Coding

**The hangover cure for vibe coding. Analyze AI-generated code quality, locate technical debt, and get actionable fixes.**

[![GitHub stars](https://img.shields.io/github/stars/voidborne-d/sober-coding?style=flat-square)](https://github.com/voidborne-d/sober-coding)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Language-Agnostic](https://img.shields.io/badge/Languages-All-blue?style=flat-square)](#supported-languages)
[![Claude Code](https://img.shields.io/badge/Claude_Code-compatible-orange?style=flat-square)](#claude-code)

**[中文文档](README_CN.md)**

---

## Philosophy

> **Vibe coding is fast. Sober coding keeps it alive.**

We're not against vibe coding. AI-generated code is the future.

But vibe coding has a fatal flaw: **it creates technical debt 10x faster than humans.**

Traditional tools (ESLint, SonarQube) catch human coding mistakes. AI-generated code has its own "smell" — duplication patterns, over-generation, missing edge cases, structural redundancy.

Sober Coding specifically targets these AI-native patterns, helping you clean up before technical debt spirals out of control.

---

## The Problem

You vibe-coded a project with Cursor, Claude Code, or Copilot. It runs. But deep down, you know:

- 🔴 **Dead code everywhere** — AI generated 5 versions, you kept the last one, the other 4 are still there
- 🔴 **Copy-paste hell** — Same logic appears 3 times because AI rewrote it from scratch each time
- 🔴 **No error handling** — Happy path is perfect, anything else crashes
- 🔴 **God files** — 2000-line `utils.py` that does everything
- 🔴 **Dependency chaos** — 47 packages installed, 12 actually used
- 🔴 **Security holes** — Hardcoded secrets, SQL injection, path traversal
- 🔴 **Zero tests** — "It works on my machine" is the only test

Sober Coding finds all of this, tells you what to fix first, and how.

---

## Real-World Demo

Scanning a real vibe-coded full-stack project (Python + Vue.js, 50 files, 13k lines):

```bash
sober scan ./RedInk
```

```
🧊 Sober Coding v0.1.0 — Let's see what we're working with.

Scanning ./RedInk (50 files, 13,579 lines)

╭────────────────────────────────────────╮
│  SOBRIETY SCORE: 0/100  🔴 BLACKOUT  │
╰────────────────────────────────────────╯

  🟠 High (fix this week)
     ERR-001  Empty except block in backend/routes/config_routes.py:231
     ERR-001  Empty except block in backend/services/content.py:111
     ERR-001  Empty catch block in frontend/src/views/HistoryView.vue:189
     ... (7 total)

  🟡 Medium (fix this sprint)
     ARC-004  Deep nesting in backend/app.py:89
     DED-004  Unreachable code in backend/generators/google_genai.py:372
     DUP-001  Exact duplicate code block in backend/generators/image_api.py:68
     ARC-001  God file: backend/generators/google_genai.py (500+ lines)
     ERR-002  No error handling in backend/services/content.py:45
     ... (1,067 total)

  ⚪ Low (when you can)
     DUP-003  Structural clone detected in backend/generators/image_api.py:51
     DED-002  Unused import: Dict in backend/app.py:2
     ... (94 total)

  💊 Run `sober fix ERR-001` to get fix instructions
```

**1,172 issues found.** The top offenders:

| Issue | Count | What it means |
|-------|-------|---------------|
| ARC-004 | 604 | Deep nesting (>4 levels) — AI loves nested if/for/try |
| DED-004 | 226 | Unreachable code after return/break |
| DUP-001 | 180 | Exact duplicate code blocks across files |
| DUP-003 | 81 | Same control-flow structure, different variable names |
| ERR-002 | 30 | Async calls without error handling |

This is what vibe coding looks like under the hood.

---

## Fix Mode

Doesn't just point out problems — tells you how to fix them:

```bash
sober fix DUP-012
```

```
🔧 DUP-012: Near-duplicate code detected (89% similarity)

  File A: utils/parse.py:45-92
  File B: helpers/format.py:12-58

  WHY IT MATTERS:
  Fix a bug in one, the other still has it. AI didn't know it already wrote this.

  HOW TO FIX:
  1. Extract shared logic into a single function
  2. Both files import from the shared module
  3. Delete the duplicate

  SUGGESTED REFACTOR:
  ┌─ shared/text_utils.py (new) ─────────────────┐
  │ def normalize_text(raw: str) -> str:          │
  │     """Merge of parse.py:45-92 & format.py""" │
  │     ...                                        │
  └────────────────────────────────────────────────┘

  AUTO-FIX AVAILABLE: sober fix DUP-012 --apply
```

---

## Install

```bash
# npm (recommended)
npm install -g sober-coding

# pip
pip install sober-coding

# From source
git clone https://github.com/voidborne-d/sober-coding.git
cd sober-coding && npm link

# Claude Code Skill
npx skills add https://github.com/voidborne-d/sober-coding.git

# ClawHub
clawhub install sober-coding
```

Zero config. Zero API keys. Runs 100% locally.

---

## Claude Code

Copy slash commands into your project:

```bash
cp sober-coding/claude-code/*.md YOUR_PROJECT/.claude/commands/
```

Then use directly:

```
/sober-scan              # Full project scan
/sober-fix DUP-012       # Get fix instructions
/sober-report            # Generate HTML report
/sober-watch             # Watch mode — scan on every save
```

---

## What It Checks

### 🔒 Security
| ID | Check | Description |
|---|---|---|
| SEC-001 | Hardcoded secrets | API keys, passwords, tokens in source code |
| SEC-002 | SQL injection | String concatenation in SQL queries |
| SEC-003 | Path traversal | User input directly in file paths |
| SEC-004 | Insecure dependencies | Known vulnerable dependency versions |
| SEC-005 | CORS misconfiguration | `Access-Control-Allow-Origin: *` |

### 🏗️ Architecture
| ID | Check | Description |
|---|---|---|
| ARC-001 | God files | Single file exceeding 500 lines |
| ARC-002 | Circular dependencies | Circular imports between modules |
| ARC-003 | Mixed concerns | API + DB + business logic in one file |
| ARC-004 | Deep nesting | More than 4 levels of indentation |
| ARC-005 | Spaghetti imports | Import graph entropy |

### 🔄 Duplication
| ID | Check | Description |
|---|---|---|
| DUP-001 | Exact clones | Identical code blocks |
| DUP-002 | Near clones | High similarity (>70%), classic AI behavior |
| DUP-003 | Structural clones | Same structure, different variable names |

### ⚠️ Error Handling
| ID | Check | Description |
|---|---|---|
| ERR-001 | Empty catch blocks | `catch (e) {}` swallowing all errors |
| ERR-002 | No error handling | Async calls without try-catch |
| ERR-003 | Generic catches | Single top-level catch for everything |
| ERR-004 | Missing input validation | User input without validation |

### 📦 Dependencies
| ID | Check | Description |
|---|---|---|
| DEP-001 | Unused dependencies | Listed in manifest but never imported |
| DEP-002 | Duplicate functionality | lodash AND underscore installed |
| DEP-003 | Outdated versions | Major dependencies 2+ versions behind |

### 🧪 Testing
| ID | Check | Description |
|---|---|---|
| TST-001 | No tests | Zero test files found |
| TST-002 | Low coverage | Test coverage below threshold |
| TST-003 | No edge cases | Only happy path tested |

### 💀 Dead Code
| ID | Check | Description |
|---|---|---|
| DED-001 | Unused functions | Defined but never called |
| DED-002 | Unused imports | Imported but never used |
| DED-003 | Commented-out code | Large blocks of commented code |
| DED-004 | Unreachable code | Code after return/break |

---

## Scoring

| Score | Level | Meaning |
|---|---|---|
| 80-100 | 🟢 **SOBER** | Clean, maintainable code. Ship it. |
| 60-79 | 🟡 **TIPSY** | Some issues. Fix before it gets worse. |
| 40-59 | 🟠 **HUNGOVER** | Significant debt. Needs a cleanup sprint. |
| 0-39 | 🔴 **BLACKOUT** | Critical issues. Stop building, start fixing. |

Each dimension scores 0-10, weighted into the overall score. Weights are configurable.

---

## Supported Languages

| Language | Scan | Fix | Auto-Fix |
|---|---|---|---|
| JavaScript / TypeScript | ✅ | ✅ | ✅ |
| Python | ✅ | ✅ | ✅ |
| Go | ✅ | ✅ | 🔜 |
| Rust | ✅ | ✅ | 🔜 |
| Java | ✅ | ✅ | 🔜 |
| Ruby | ✅ | 🔜 | 🔜 |
| PHP | ✅ | 🔜 | 🔜 |
| C/C++ | ✅ | 🔜 | 🔜 |

Language-agnostic checks (duplication, dead code, dependencies, security) work for all languages.

---

## Config

Zero config to start. Customize with `.soberrc.json` in your project root:

```json
{
  "thresholds": {
    "god_file_lines": 500,
    "max_nesting": 4,
    "min_test_coverage": 60,
    "duplication_similarity": 70
  },
  "ignore": [
    "node_modules",
    "dist",
    "*.generated.*"
  ],
  "weights": {
    "security": 2.0,
    "architecture": 1.5,
    "duplication": 1.0,
    "error_handling": 1.5,
    "dependencies": 0.8,
    "testing": 1.2,
    "dead_code": 0.8
  },
  "severity": "medium"
}
```

---

## CI/CD Integration

```yaml
# GitHub Actions
- name: Sober Check
  run: npx sober-coding scan . --ci --fail-on=critical
```

```yaml
# GitLab CI
sober-check:
  script:
    - npx sober-coding scan . --ci --fail-on=high
  allow_failure: false
```

CI mode outputs SARIF format, compatible with GitHub Code Scanning.

---

## vs. Others

|  | Sober Coding | pyscn | ESLint/Ruff | SonarQube |
|---|---|---|---|---|
| Built for vibe coding | ✅ | ✅ | ❌ | ❌ |
| Language-agnostic | ✅ | ❌ Python only | ❌ per-language | ✅ |
| Debt scoring | ✅ 0-100 | ✅ | ❌ | ✅ |
| AI pattern detection | ✅ | ✅ | ❌ | ❌ |
| Fix suggestions | ✅ with code | ❌ | ❌ | partial |
| Auto-fix | ✅ `--apply` | ❌ | partial | ❌ |
| Zero config | ✅ | ✅ | ❌ | ❌ |
| Runs locally | ✅ | ✅ | ✅ | ❌ server |
| Claude Code integration | ✅ | ❌ | ❌ | ❌ |
| Free | ✅ | ✅ | ✅ | ⚠️ freemium |

---

## Roadmap

- [x] Core scanner engine
- [x] Security checks (SEC-001~005)
- [x] Architecture checks (ARC-001~005)
- [x] Duplication detection (DUP-001~003)
- [x] Error handling checks (ERR-001~004)
- [x] Dependency checks (DEP-001~003)
- [x] Testing checks (TST-001~003)
- [x] Dead code detection (DED-001~004)
- [x] CLI with scoring
- [x] Fix suggestions (`sober fix <ID>`)
- [x] `.soberrc.json` config support
- [x] CI mode (`--ci`, `--fail-on`)
- [ ] Auto-fix engine (`--apply`)
- [ ] HTML/PDF report generation
- [ ] VS Code extension
- [ ] GitHub Action (marketplace)
- [ ] Watch mode (scan on save)
- [ ] AI pattern fingerprinting (detect which AI generated the code)
- [ ] Team dashboard

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=voidborne-d/sober-coding&type=Date)](https://star-history.com/#voidborne-d/sober-coding&Date)

---

## From the Same Workshop

Part of [voidborne-d](https://github.com/voidborne-d)'s toolkit for working with AI-generated output. Same premise across all three: **AI leaves fingerprints — these are the tools to detect, clean, or repurpose them.**

- **[humanize-chinese](https://github.com/voidborne-d/humanize-chinese)** — the natural-language analog. Detects and rewrites AI-generated Chinese text via n-gram perplexity + 20+ pattern detectors + academic AIGC reduction (知网/维普/万方). Pure Python, zero dependencies.
- **[lambda-lang](https://github.com/voidborne-d/lambda-lang)** — compressed agent-to-agent communication language. 139 atoms, 5–8× compression ratio, Go implementation. Useful when your vibe-coded agents need to talk to each other without burning tokens on prose.

---

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — Use it, fork it, ship it. Free forever.
