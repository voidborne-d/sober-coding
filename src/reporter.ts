import chalk from "chalk";
import type { Issue, ScanResult, Severity } from "./scanner/types.js";

const LEVEL_COLORS = {
  SOBER: chalk.green,
  TIPSY: chalk.yellow,
  HUNGOVER: chalk.hex("#FF8C00"),
  BLACKOUT: chalk.red,
};

const LEVEL_EMOJI = {
  SOBER: "\u{1F7E2}",
  TIPSY: "\u{1F7E1}",
  HUNGOVER: "\u{1F7E0}",
  BLACKOUT: "\u{1F534}",
};

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: "\u{1F534}",
  high: "\u{1F7E0}",
  medium: "\u{1F7E1}",
  low: "\u{26AA}",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical (fix now)",
  high: "High (fix this week)",
  medium: "Medium (fix this sprint)",
  low: "Low (when you can)",
};

export function report(result: ScanResult): void {
  const { path: scanPath, files, lines, issues, score, level } = result;
  const colorFn = LEVEL_COLORS[level];

  console.log();
  console.log(chalk.cyan.bold(`\u{1F9CA} Sober Coding v0.1.0`) + chalk.dim(` — Let's see what we're working with.`));
  console.log();
  console.log(chalk.dim(`Scanning ${scanPath} (${files.toLocaleString()} files, ${lines.toLocaleString()} lines)`));
  console.log();

  // Score box
  const scoreText = `  SOBRIETY SCORE: ${score}/100  ${LEVEL_EMOJI[level]} ${level}  `;
  const boxWidth = scoreText.length + 2;
  console.log(colorFn(`\u{256D}${"─".repeat(boxWidth)}\u{256E}`));
  console.log(colorFn(`\u{2502}`) + chalk.bold(colorFn(scoreText)) + colorFn(`\u{2502}`));
  console.log(colorFn(`\u{2570}${"─".repeat(boxWidth)}\u{256E}`));
  console.log();

  // Group by severity
  const grouped = groupBySeverity(issues);
  const severityOrder: Severity[] = ["critical", "high", "medium", "low"];

  for (const sev of severityOrder) {
    const group = grouped[sev];
    if (!group || group.length === 0) continue;

    console.log(`  ${SEVERITY_EMOJI[sev]} ${chalk.bold(SEVERITY_LABEL[sev])}`);
    for (const issue of group) {
      const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
      console.log(chalk.dim(`     ${issue.id}  `) + `${issue.title} ${chalk.dim(`in ${loc}`)}`);
    }
    console.log();
  }

  if (issues.length === 0) {
    console.log(chalk.green.bold("  \u{2728} No issues found. Your code is sober!"));
    console.log();
  }

  // Footer
  console.log(chalk.dim(`  \u{1F48A} Run \`sober fix <ID>\` to get fix instructions`));
  console.log();
}

function groupBySeverity(issues: Issue[]): Record<Severity, Issue[]> {
  const groups: Record<Severity, Issue[]> = { critical: [], high: [], medium: [], low: [] };
  for (const issue of issues) {
    groups[issue.severity].push(issue);
  }
  return groups;
}
