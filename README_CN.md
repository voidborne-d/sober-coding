# 🧊 Sober Coding

**Vibe coding 的解酒药。分析 AI 生成代码质量,定位技术债务,给出修复方案。**

[![GitHub stars](https://img.shields.io/github/stars/voidborne-d/sober-coding?style=flat-square)](https://github.com/voidborne-d/sober-coding)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Language-Agnostic](https://img.shields.io/badge/语言-全部支持-blue?style=flat-square)](#支持语言)
[![Claude Code](https://img.shields.io/badge/Claude_Code-兼容-orange?style=flat-square)](#claude-code)

**[English](README.md)**

---

## 理念

> **Vibe coding 很快。Sober coding 让它活下去。**

我们不反对 vibe coding。AI 生成代码是趋势，回不去了。

但 vibe coding 有个致命问题：**它制造技术债务的速度比人类快 10 倍。**

传统工具（ESLint、SonarQube）检测的是人类写代码的常见问题。AI 生成的代码有自己的“味道”——重复模式、过度生成、缺少边界处理、结构性冗余。

Sober Coding 专门识别这些 AI 特有的模式，帮你在技术债务失控之前清理干净。

---

## 问题

你用 Cursor、Claude Code、Copilot 写了一个项目。跑起来了。但你心里清楚:

- 🔴 **死代码遍地** - AI 生成了 5 个版本,你只用了最后一个,前 4 个还在
- 🔴 **复制粘贴地狱** - 同一段逻辑出现 3 次,AI 每次都从头写
- 🔴 **没有错误处理** - happy path 完美,一出错就 crash
- 🔴 **上帝文件** - 2000 行的 `utils.py`,什么都往里塞
- 🔴 **依赖混乱** - 装了 47 个包,实际用了 12 个
- 🔴 **安全漏洞** - 写死的密钥、SQL 注入、路径穿越
- 🔴 **零测试** - "我电脑上能跑"就是唯一的测试

Sober Coding 帮你把这些全找出来,告诉你先修什么、怎么修。

---

## 真实项目扫描

对一个真实的 vibe coded 全栈项目（Python + Vue.js，50 文件，1.3 万行）进行扫描：

```bash
sober scan ./RedInk
```

```
🧊 Sober Coding v0.1.0 — Let's see what we're working with.

扫描 ./RedInk（50 文件，13,579 行）

╭────────────────────────────────────────╮
│  清醒指数: 0/100  🔴 断片               │
╰────────────────────────────────────────╯

  🟠 高（本周修复）
     ERR-001  空的 except 块 in backend/routes/config_routes.py:231
     ERR-001  空的 except 块 in backend/services/content.py:111
     ERR-001  空的 catch 块 in frontend/src/views/HistoryView.vue:189
     ...（共 7 个）

  🟡 中（本迭代修复）
     ARC-004  深层嵌套 in backend/app.py:89
     DED-004  不可达代码 in backend/generators/google_genai.py:372
     DUP-001  完全重复代码块 in backend/generators/image_api.py:68
     ARC-001  上帝文件: backend/generators/google_genai.py（500+ 行）
     ERR-002  无错误处理 in backend/services/content.py:45
     ...（共 1,067 个）

  ⚪ 低（有空再修）
     DUP-003  结构克隆 in backend/generators/image_api.py:51
     DED-002  未使用导入: Dict in backend/app.py:2
     ...（共 94 个）

  💊 运行 `sober fix ERR-001` 获取修复方案
```

**共发现 1,172 个问题。** 主要问题分布：

| 问题 | 数量 | 含义 |
|------|------|------|
| ARC-004 | 604 | 深层嵌套（>4 层）— AI 最爱嵌套 if/for/try |
| DED-004 | 226 | return/break 后的不可达代码 |
| DUP-001 | 180 | 跨文件完全重复的代码块 |
| DUP-003 | 81 | 结构相同、变量名不同的克隆代码 |
| ERR-002 | 30 | 异步调用没有错误处理 |

这就是 vibe coding 的真面目。

---

## 修复模式

不只是告诉你问题在哪,还告诉你怎么修:

```bash
sober fix DUP-012
```

```
🔧 DUP-012: 检测到高度相似代码(89% 相似度)

  文件 A: utils/parse.py:45-92
  文件 B: helpers/format.py:12-58

  为什么重要:
  修了一个的 bug,另一个还在。AI 不知道它已经写过一遍了。

  修复方法:
  1. 提取共享逻辑到独立函数
  2. 两个文件都从共享模块导入
  3. 删除重复代码

  建议重构:
  ┌─ shared/text_utils.py(新建)─────────────────┐
  │ def normalize_text(raw: str) -> str:          │
  │     """合并 parse.py:45-92 和 format.py"""     │
  │     ...                                        │
  └────────────────────────────────────────────────┘

  自动修复可用: sober fix DUP-012 --apply
```

---

## 安装

```bash
# npm(推荐)
npm install -g sober-coding

# pip
pip install sober-coding

# 源码安装
git clone https://github.com/voidborne-d/sober-coding.git
cd sober-coding && npm link

# Claude Code Skill
npx skills add https://github.com/voidborne-d/sober-coding.git

# ClawHub
clawhub install sober-coding
```

零配置。不需要 API Key。完全本地运行。

---

## Claude Code

复制 slash commands 到项目里:

```bash
cp sober-coding/claude-code/*.md YOUR_PROJECT/.claude/commands/
```

然后直接用:

```
/sober-scan              # 全项目扫描
/sober-fix DUP-012       # 获取修复方案
/sober-report            # 生成 HTML 报告
/sober-watch             # 监听模式 - 保存时自动扫描
```

---

## 检测项目

### 🔒 安全
| ID | 检查项 | 说明 |
|---|---|---|
| SEC-001 | 硬编码密钥 | API key、密码、token 写死在代码里 |
| SEC-002 | SQL 注入 | 字符串拼接 SQL 查询 |
| SEC-003 | 路径穿越 | 用户输入直接拼文件路径 |
| SEC-004 | 不安全依赖 | 已知漏洞的依赖版本 |
| SEC-005 | CORS 配置错误 | `Access-Control-Allow-Origin: *` |

### 🏗️ 架构
| ID | 检查项 | 说明 |
|---|---|---|
| ARC-001 | 上帝文件 | 单文件超过 500 行 |
| ARC-002 | 循环依赖 | 模块间循环引用 |
| ARC-003 | 职责混杂 | 一个文件里又有 API 又有 DB 又有业务逻辑 |
| ARC-004 | 深层嵌套 | 超过 4 层缩进 |
| ARC-005 | 意面导入 | import 图混乱度 |

### 🔄 重复
| ID | 检查项 | 说明 |
|---|---|---|
| DUP-001 | 完全克隆 | 一模一样的代码块 |
| DUP-002 | 近似克隆 | 高度相似(>70%),AI 的经典行为 |
| DUP-003 | 结构克隆 | 结构相同,变量名不同 |

### ⚠️ 错误处理
| ID | 检查项 | 说明 |
|---|---|---|
| ERR-001 | 空 catch 块 | `catch (e) {}` 吞掉所有错误 |
| ERR-002 | 无错误处理 | 异步调用没有 try-catch |
| ERR-003 | 泛化捕获 | 只有一个顶层 catch 兜底 |
| ERR-004 | 缺少输入校验 | 用户输入不做验证 |

### 📦 依赖
| ID | 检查项 | 说明 |
|---|---|---|
| DEP-001 | 未使用依赖 | 写在 manifest 里但从没 import |
| DEP-002 | 功能重复 | 同时装了 lodash 和 underscore |
| DEP-003 | 版本过旧 | 主要依赖落后 2+ 大版本 |

### 🧪 测试
| ID | 检查项 | 说明 |
|---|---|---|
| TST-001 | 无测试 | 零测试文件 |
| TST-002 | 覆盖率低 | 测试覆盖率低于阈值 |
| TST-003 | 无边界测试 | 只测了 happy path |

### 💀 死代码
| ID | 检查项 | 说明 |
|---|---|---|
| DED-001 | 未使用函数 | 定义了但从没调用 |
| DED-002 | 未使用导入 | import 了但没用 |
| DED-003 | 注释代码 | 大段被注释掉的代码 |
| DED-004 | 不可达代码 | return/break 后面的代码 |

---

## 评分

| 分数 | 等级 | 含义 |
|---|---|---|
| 80-100 | 🟢 **清醒** | 干净、可维护的代码。可以上线。 |
| 60-79 | 🟡 **微醺** | 有些问题。趁早修,别恶化。 |
| 40-59 | 🟠 **宿醉** | 技术债务明显。需要一个清理迭代。 |
| 0-39 | 🔴 **断片** | 严重问题。停止开发,先修再说。 |

每个维度 0-10 分,加权汇总。权重可在配置文件中自定义。

---

## 支持语言

| 语言 | 扫描 | 修复建议 | 自动修复 |
|---|---|---|---|
| JavaScript / TypeScript | ✅ | ✅ | ✅ |
| Python | ✅ | ✅ | ✅ |
| Go | ✅ | ✅ | 🔜 |
| Rust | ✅ | ✅ | 🔜 |
| Java | ✅ | ✅ | 🔜 |
| Ruby | ✅ | 🔜 | 🔜 |
| PHP | ✅ | 🔜 | 🔜 |
| C/C++ | ✅ | 🔜 | 🔜 |

语言无关的检测(重复、死代码、依赖、安全)对所有语言都生效。

---

## 配置

零配置即可使用。需要自定义时在项目根目录放 `.soberrc.json`:

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

## CI/CD 集成

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

CI 模式下输出 SARIF 格式,可直接推到 GitHub Code Scanning。

---

## 对比

|  | Sober Coding | pyscn | ESLint/Ruff | SonarQube |
|---|---|---|---|---|
| 专为 vibe coding 设计 | ✅ | ✅ | ❌ | ❌ |
| 语言无关 | ✅ | ❌ 仅 Python | ❌ 按语言 | ✅ |
| 技术债务评分 | ✅ 0-100 | ✅ | ❌ | ✅ |
| AI 生成模式检测 | ✅ | ✅ | ❌ | ❌ |
| 修复建议 | ✅ 含代码 | ❌ | ❌ | 部分 |
| 自动修复 | ✅ `--apply` | ❌ | 部分 | ❌ |
| 零配置 | ✅ | ✅ | ❌ | ❌ |
| 本地运行 | ✅ | ✅ | ✅ | ❌ 需服务器 |
| Claude Code 集成 | ✅ | ❌ | ❌ | ❌ |
| 免费 | ✅ | ✅ | ✅ | ⚠️ 有限免费 |

---

## 路线图

- [x] 核心扫描引擎
- [x] 安全检查（SEC-001~005）
- [x] 架构检查（ARC-001~005）
- [x] 重复检测（DUP-001~003）
- [x] 错误处理检查（ERR-001~004）
- [x] 依赖检查（DEP-001~003）
- [x] 测试检查（TST-001~003）
- [x] 死代码检测（DED-001~004）
- [x] CLI + 评分系统
- [x] 修复建议（`sober fix <ID>`）
- [x] `.soberrc.json` 配置支持
- [x] CI 模式（`--ci`、`--fail-on`）
- [ ] 自动修复引擎（`--apply`）
- [ ] HTML/PDF 报告生成
- [ ] VS Code 扩展
- [ ] GitHub Action（应用市场）
- [ ] 监听模式（保存时自动扫描）
- [ ] AI 指纹识别（检测代码由哪个 AI 生成）
- [ ] 团队仪表盘

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=voidborne-d/sober-coding&type=Date)](https://star-history.com/#voidborne-d/sober-coding&Date)

---

## 贡献

欢迎 PR。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 许可证

MIT - 随便用,随便改,永远免费。
