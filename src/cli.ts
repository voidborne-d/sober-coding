import { Command } from "commander";
import chalk from "chalk";
import { scan } from "./scanner/scanner.js";
import { report } from "./reporter.js";
import { getFix } from "./fixer.js";
import type { Severity } from "./scanner/types.js";

const program = new Command();

program
  .name("sober")
  .description("The hangover cure for vibe coding")
  .version("0.1.0");

program
  .command("scan <path>")
  .description("Scan a project for vibe coding issues")
  .option("--ci", "CI mode: concise one-line-per-issue output")
  .option("--fail-on <severity>", "Exit non-zero only when issues reach this severity (critical|high|medium|low)")
  .action(async (targetPath: string, opts: { ci?: boolean; failOn?: string }) => {
    try {
      const result = await scan(targetPath);

      if (opts.ci) {
        // CI mode: concise output
        for (const issue of result.issues) {
          const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
          console.log(`${issue.severity.toUpperCase()} ${issue.id} ${issue.title} ${loc}`);
        }

        if (opts.failOn) {
          const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          const threshold = severityOrder[opts.failOn];
          if (threshold === undefined) {
            console.error(`Invalid severity: ${opts.failOn}`);
            process.exit(1);
          }
          const matching = result.issues.filter((i) => severityOrder[i.severity] <= threshold);
          if (matching.length > 0) {
            process.exit(matching.length);
          }
        } else {
          if (result.issues.length > 0) {
            process.exit(result.issues.length);
          }
        }
      } else {
        report(result);

        if (opts.failOn) {
          const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          const threshold = severityOrder[opts.failOn];
          if (threshold === undefined) {
            console.error(chalk.red(`Invalid severity: ${opts.failOn}`));
            process.exit(1);
          }
          const matching = result.issues.filter((i) => severityOrder[i.severity] <= threshold);
          if (matching.length > 0) {
            process.exit(matching.length);
          }
        }
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command("fix <id>")
  .description("Show fix instructions for an issue")
  .action((id: string) => {
    const fix = getFix(id);

    console.log();
    if (!fix) {
      console.log(chalk.red.bold(`  Unknown issue ID: ${id.toUpperCase()}`));
      console.log(chalk.dim(`  Run \`sober scan <path>\` to see valid issue IDs.`));
      console.log();
      return;
    }

    console.log(chalk.cyan.bold(`  \u{1F527} ${fix.id}: ${fix.title}`));
    console.log();
    console.log(chalk.yellow.bold("  Why this matters:"));
    console.log(`  ${fix.why}`);
    console.log();
    console.log(chalk.green.bold("  How to fix:"));
    for (const step of fix.howToFix) {
      console.log(`  ${chalk.green("→")} ${step}`);
    }
    console.log();
    if (fix.autoFixAvailable) {
      console.log(chalk.magenta("  ✨ Auto-fix available! Run `sober fix --apply " + fix.id + "`"));
    }
    console.log();
  });

program.parse();
