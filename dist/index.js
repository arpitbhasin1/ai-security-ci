#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const loadConfig_1 = require("./loadConfig");
const loadAttacks_1 = require("./loadAttacks");
const runAttacks_1 = require("./runAttacks");
const reportGenerator_1 = require("./reportGenerator");
const logger_1 = require("./logger");
function getConfigPathFromArgs() {
    const args = process.argv.slice(2);
    const configFlagIndex = args.indexOf("--config");
    if (configFlagIndex !== -1 && args[configFlagIndex + 1]) {
        return args[configFlagIndex + 1];
    }
    return "examples/ai-sec-config.yaml";
}
async function main() {
    try {
        const configPath = getConfigPathFromArgs();
        (0, logger_1.log)("normal", "normal", `🔧 Loading config from: ${path_1.default.resolve(configPath)}`);
        const config = (0, loadConfig_1.loadConfig)(configPath);
        (0, logger_1.log)("normal", config.logLevel || "normal", "✅ Config loaded.");
        const attacks = (0, loadAttacks_1.loadAttacks)(config.attacksPath);
        (0, logger_1.log)("normal", config.logLevel || "normal", `📦 Loaded ${attacks.length} attacks.`);
        (0, logger_1.log)("normal", config.logLevel || "normal", "⚔️  Running attacks (this will call the OpenAI API) ...");
        const envMax = process.env.MAX_CALLS_PER_RUN ? Number(process.env.MAX_CALLS_PER_RUN) : undefined;
        const finalMax = envMax && envMax > 0 ? envMax : config.maxCalls;
        const runs = await (0, runAttacks_1.runAttacks)(attacks, config.systemPromptPath, config.model, config.maxTokens, config.temperature, !!config.useJudge, finalMax, config.logLevel);
        // Calculate summary metrics
        const totalAttacks = attacks.length;
        const successfulAttacks = runs.filter(r => r.evaluation.success === true).length;
        const highSeverityFailures = runs.filter(r => r.attack.severity === "high" && r.evaluation.success === true).length;
        // Display human-friendly results summary
        if (successfulAttacks === 0) {
            (0, logger_1.log)("normal", config.logLevel || "normal", `✅ No vulnerabilities found. (0/${totalAttacks} attacks succeeded)`);
            (0, logger_1.log)("normal", config.logLevel || "normal", "Your model resisted all simulated attacks.");
        }
        else {
            (0, logger_1.log)("normal", config.logLevel || "normal", `⚠️  Vulnerabilities detected: ${successfulAttacks}/${totalAttacks} attacks were successful.`);
            (0, logger_1.log)("normal", config.logLevel || "normal", "Check the report for details.");
        }
        if (highSeverityFailures > 0) {
            (0, logger_1.log)("normal", config.logLevel || "normal", "🚨 High severity vulnerabilities found.");
        }
        (0, logger_1.log)("normal", config.logLevel || "normal", "🧾 Writing results...");
        const outDir = "ai-security-output";
        const runId = (0, crypto_1.randomUUID)();
        (0, reportGenerator_1.writeJsonResult)(outDir, runs, runId, attacks.length);
        (0, reportGenerator_1.writeMarkdownReport)(outDir, runs);
        (0, logger_1.log)("normal", config.logLevel || "normal", `✅ Done.`);
        (0, logger_1.log)("normal", config.logLevel || "normal", `Results: ${path_1.default.resolve(outDir)}/ai-security-result.json`);
        (0, logger_1.log)("normal", config.logLevel || "normal", `Report: ${path_1.default.resolve(outDir)}/ai-security-report.md`);
        // Read FAIL_ON_HIGH from environment (for GitHub Actions)
        // GitHub Actions node16 automatically sets INPUT_* env vars, but we also check FAIL_ON_HIGH for flexibility
        const failOnHighEnv = process.env.FAIL_ON_HIGH === "true" || process.env.INPUT_FAIL_ON_HIGH === "true";
        const finalFailOnHigh = config.fail_on_high || failOnHighEnv;
        // Fail on high severity only if enabled and not in DEMO mode
        if (process.env.DEMO_MODE !== "true" && finalFailOnHigh) {
            const highFail = runs.some(r => r.attack.severity === "high" && r.evaluation.success === true);
            if (highFail) {
                console.error("❌ High severity failure detected — exiting with code 2.");
                process.exit(2);
            }
        }
        // Default successful exit
        process.exit(0);
    }
    catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}
main();
