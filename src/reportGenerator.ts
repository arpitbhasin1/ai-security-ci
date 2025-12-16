import fs from "fs";
import path from "path";
import { AttackRun } from "./runAttacks";
import { sanitizeOutput } from "./sanitize";

export function writeJsonResult(outDir: string, runs: AttackRun[], runId: string, totalAttacks: number) {
  const failedAttacks = runs.filter(r => r.evaluation.success).length;
  const highSeverityFailures = runs.filter(r => r.attack.severity === "high" && r.evaluation.success).length;
  
  const payload = {
    timestamp: new Date().toISOString(),
    tool_version: "0.1.0",
    attack_library_version: "1.0",
    run_id: runId,
    summary: {
      total_attacks: totalAttacks,
      failed_attacks: failedAttacks,
      high_severity_failures: highSeverityFailures
    },
    runs
  };
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "ai-security-result.json"), JSON.stringify(payload, null, 2), "utf8");
}

export function writeMarkdownReport(outDir: string, runs: AttackRun[]) {
  const total = runs.length;
  const failed = runs.filter(r => r.evaluation.success).length;

  let md = `# AI Security Scan Report\n\n`;
  md += `**Scan date:** ${new Date().toISOString()}\n\n`;
  md += `**Summary:** ${failed}/${total} tests *failed* (attack succeeded).\n\n`;

  md += `| Attack ID | Category | Severity | Result | Indicators |\n`;
  md += `|---|---|---:|---|---|\n`;
  for (const r of runs) {
    const indicators = r.evaluation.reason.length > 0 ? r.evaluation.reason.join("; ") : "-";
    const result = r.evaluation.success ? "FAILED" : "PASSED";
    md += `| ${r.attack.id} | ${r.attack.category} | ${r.attack.severity} | ${result} | ${indicators} |\n`;
  }

  md += `\n\n---\n\n## Details\n\n`;
  for (const r of runs) {
    md += `### ${r.attack.id} — ${r.attack.description}\n\n`;
    md += `**Prompt sent:**\n\n\`\`\`\n${sanitizeOutput(r.attack.prompt)}\n\`\`\`\n\n`;
    md += `**Model output (snippet):**\n\n\`\`\`\n${sanitizeOutput(r.response)}\n\`\`\`\n\n`;
    md += `**Evaluation:** ${r.evaluation.success ? "FAILED" : "PASSED"}\n\n`;
    if (r.evaluation.reason.length) {
      md += `**Indicators:**\n\n- ${r.evaluation.reason.map(reason => sanitizeOutput(reason)).join("\n- ")}\n\n`;
    }
    md += `---\n\n`;
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "ai-security-report.md"), md, "utf8");
}

