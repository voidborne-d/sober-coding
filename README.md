# 🧊 Sober Coding

**Vibe coding 的解酒药。分析 AI 生成代码质量，定位技术债务，给出修复方案。**

**The hangover cure for vibe coding. Analyze AI-generated code quality, locate technical debt, and get actionable fixes.**

[![GitHub stars](https://img.shields.io/github/stars/voidborne-d/sober-coding?style=flat-square)](https://github.com/voidborne-d/sober-coding)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Language-Agnostic](https://img.shields.io/badge/Languages-All-blue?style=flat-square)](#supported-languages)
[![Claude Code](https://img.shields.io/badge/Claude_Code-compatible-orange?style=flat-square)](#claude-code)

---

## The Problem / 问题

你用 Cursor、Claude Code、Copilot 写了一个项目。跑起来了。但你心里清楚：

You vibe-coded a project with Cursor, Claude Code, or Copilot. It runs. But deep down, you know:

- 🔴 **Dead code everywhere** — AI 生成了 5 个版本，你只用了最后一个，前 4 个还在
- 🔴 **Copy-paste hell** — 同一段逻辑出现 3 次，AI 每次都从头写
- 🔴 **No error handling** — happy path 完美，一出错就 crash
- 🔴 **God files** — 2000 行的 `utils.py`，什么都往里塞
- 🔴 **Dependency chaos** — 装了 47 个包，实际用了 12 个
- 🔴 **Security holes** — hardcoded secrets、SQL injection、路径穿越
- 🔴 **Zero tests** — "It works on my machine" is the only test

Sober Coding 帮你把这些全找出来，告诉你先修什么、怎么修。

Sober Coding finds all of this, tells you what to fix first, and how.

---

## 30 Seconds Demo / 30 秒看效果

```bash
sober scan ./my-vibe-project
```

```
🧊 Sober Coding v0.1.0 — Let's see what we're working with.

Scanning ./my-vibe-project (1,247 files, 89,302 lines)

╭──────────────────────────────────────────────────╮
│  SOBRIETY SCORE: 34/100  🟠 HUNGOVER             │
╰──────────────────────────────────────────────────╯

  🔴 Critical (fix now)
     SEC-001  Hardcoded API key in config.py:23
     SEC-003  SQL injection in api/users.py:87

  🟠 High (fix this week)
     DUP-012  89% duplicate: utils/parse.py ↔ helpers/format.py
     DEP-003  god file: services/main.py (2,341 lines, 47 functions)
     ERR-007  No error handling in 23/45 API endpoints

  🟡 Medium (fix this sprint)
     DEP-001  31 unused dependencies in package.json
     TST-001  0% test coverage (0 test files found)
     DRY-004  Login logic duplicated in 3 files

  📊 Summary
     Security:      2/10
     Architecture:  4/10
     Duplication:   3/10
     Error Handling: 2/10
     Dependencies:  4/10
     Test Coverage:  0/10
     Dead Code:     5/10
     ─────────────────
     Overall:       34/100

  💊 Run `sober fix SEC-001` to get fix instructions
  📋 Run `sober report` for full HTML report
```

---

## Fix Mode / 修复模式

不只是告诉你问题在哪，还告诉你怎么修：

It doesn't just point out problems — it tells you how to fix them:

```bash
sober fix DUP-012
```

```
🔧 DUP-012: Near-duplicate code detected (89% similarity)

  File A: utils/parse.py:45-92
  File B: helpers/format.py:12-58

  WHY IT MATTERS:
  修一个 bug，另一个还在。AI 生成时不知道已经写过一次了。
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

## Install / 安装

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

零配置。不需要 API Key。完全本地运行。

---

## Claude Code

复制 slash commands 到项目里：

```bash
cp sober-coding/claude-code/*.md YOUR_PROJECT/.claude/commands/
```

然后直接用：

```
/sober-scan              # Full project scan
/sober-fix DUP-012       # Get fix instructions
/sober-report            # Generate HTML report
/sober-watch             # Watch mode — scan on every save
```

---

## What It Checks / 检测项目

### 🔒 Security / 安全
| ID | Check | 说明 |
|---|---|---|
| SEC-001 | Hardcoded secrets | API keys、密码、token 写死在代码里 |
| SEC-002 | SQL injection | 字符串拼接 SQL |
| SEC-003 | Path traversal | 用户输入直接拼路径 |
| SEC-004 | Insecure dependencies | 已知漏洞的依赖版本 |
| SEC-005 | CORS misconfiguration | `Access-Control-Allow-Origin: *` |

### 🏗️ Architecture / 架构
| ID | Check | 说明 |
|---|---|---|
| ARC-001 | God files | 单文件超过 500 行 |
| ARC-002 | Circular dependencies | 循环引用 |
| ARC-003 | Mixed concerns | 一个文件里又有 API 又有 DB 又有业务逻辑 |
| ARC-004 | Deep nesting | 超过 4 层缩进 |
| ARC-005 | Spaghetti imports | import 图混乱度 |

### 🔄 Duplication / 重复
| ID | Check | 说明 |
|---|---|---|
| DUP-001 | Exact clones | 完全一样的代码块 |
| DUP-002 | Near clones | 高度相似（>70%），AI 的经典行为 |
| DUP-003 | Structural clones | 结构相同，变量名不同 |

### ⚠️ Error Handling / 错误处理
| ID | Check | 说明 |
|---|---|---|
| ERR-001 | Empty catch blocks | `catch (e) {}` 吞掉所有错误 |
| ERR-002 | No error handling | 异步调用没有 try-catch |
| ERR-003 | Generic catches | 只有一个顶层 catch |
| ERR-004 | Missing input validation | 用户输入不校验 |

### 📦 Dependencies / 依赖
| ID | Check | 说明 |
|---|---|---|
| DEP-001 | Unused dependencies | package.json / requirements.txt 里有但没用到 |
| DEP-002 | Duplicate functionality | 同时装了 lodash 和 underscore |
| DEP-003 | Outdated versions | 主要依赖落后 2+ 大版本 |

### 🧪 Testing / 测试
| ID | Check | 说明 |
|---|---|---|
| TST-001 | No tests | 零测试文件 |
| TST-002 | Low coverage | 测试覆盖率低于阈值 |
| TST-003 | No edge cases | 只测 happy path |

### 💀 Dead Code / 死代码
| ID | Check | 说明 |
|---|---|---|
| DED-001 | Unused functions | 定义了但从没调用 |
| DED-002 | Unused imports | import 了但没用 |
| DED-003 | Commented-out code | 大段注释掉的代码 |
| DED-004 | Unreachable code | return/break 后面的代码 |

---

## Scoring / 评分

| Score | Level | Meaning |
|---|---|---|
| 80-100 | 🟢 **SOBER** | Clean, maintainable code. Ship it. |
| 60-79 | 🟡 **TIPSY** | Some issues. Fix before it gets worse. |
| 40-59 | 🟠 **HUNGOVER** | Significant debt. Needs a cleanup sprint. |
| 0-39 | 🔴 **BLACKOUT** | Critical issues. Stop building, start fixing. |

每个维度 0-10 分，加权汇总。权重可自定义。

Each dimension scores 0-10, weighted into the overall score. Weights are configurable.

---

## Supported Languages / 支持语言

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

语言无关的检测（重复、死代码、依赖、安全）对所有语言都生效。

Language-agnostic checks (duplication, dead code, dependencies, security) work for all languages.

---

## Config / 配置

零配置即可使用。需要自定义时在项目根目录放 `.soberrc.json`：

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

## CI/CD Integration / CI 集成

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

CI 模式下输出 SARIF 格式，可以直接推到 GitHub Code Scanning。

In CI mode, outputs SARIF format compatible with GitHub Code Scanning.

---

## vs. Others / 对比

|  | Sober Coding | pyscn | ESLint/Ruff | SonarQube |
|---|---|---|---|---|
| 专为 vibe coding 设计 | ✅ | ✅ | ❌ | ❌ |
| 语言无关 | ✅ | ❌ Python only | ❌ per-language | ✅ |
| 技术债务评分 | ✅ 0-100 | ✅ | ❌ | ✅ |
| AI 生成模式检测 | ✅ | ✅ | ❌ | ❌ |
| 修复建议 | ✅ with code | ❌ | ❌ | partial |
| 自动修复 | ✅ `--apply` | ❌ | partial | ❌ |
| 零配置 | ✅ | ✅ | ❌ | ❌ |
| 本地运行 | ✅ | ✅ | ✅ | ❌ server |
| Claude Code 集成 | ✅ | ❌ | ❌ | ❌ |
| 免费 | ✅ | ✅ | ✅ | ⚠️ freemium |

---

## Philosophy / 理念

> **Vibe coding is fast. Sober coding keeps it alive.**
>
> Vibe coding 很快。Sober coding 让它活下去。

我们不反对 vibe coding。AI 生成代码是趋势，回不去了。

但 vibe coding 有个致命问题：**它制造技术债务的速度比人类快 10 倍。**

传统工具（ESLint、SonarQube）检测的是人类写代码的常见问题。AI 生成的代码有自己的"味道"——重复模式、过度生成、缺少边界处理、结构性冗余。

Sober Coding 专门识别这些 AI 特有的模式，帮你在技术债务失控之前清理干净。

We're not against vibe coding. AI-generated code is the future.

But vibe coding has a fatal flaw: **it creates technical debt 10x faster than humans.**

Traditional tools (ESLint, SonarQube) catch human coding mistakes. AI-generated code has its own "smell" — duplication patterns, over-generation, missing edge cases, structural redundancy.

Sober Coding specifically targets these AI-native patterns, helping you clean up before technical debt spirals out of control.

---

## Roadmap / 路线图

- [x] Core scanner engine
- [x] Security checks
- [x] Duplication detection
- [x] CLI with scoring
- [ ] Auto-fix engine
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

## Contributing / 贡献

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — Use it, fork it, ship it. Free forever.

MIT — 随便用，随便改，永远免费。
