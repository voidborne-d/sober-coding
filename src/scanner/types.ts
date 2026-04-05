export type Severity = "critical" | "high" | "medium" | "low";

export interface Issue {
  id: string;
  title: string;
  severity: Severity;
  file: string;
  line?: number;
  detail?: string;
}

export interface ScanResult {
  path: string;
  files: number;
  lines: number;
  issues: Issue[];
  score: number;
  level: "SOBER" | "TIPSY" | "HUNGOVER" | "BLACKOUT";
}

export interface Checker {
  name: string;
  check(files: FileEntry[]): Issue[];
}

export interface FileEntry {
  path: string;
  content: string;
  lines: string[];
}
