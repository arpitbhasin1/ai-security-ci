import fs from "fs";
import path from "path";
import yaml from "yaml";
import { ToolConfig } from "./types";

/**
 * Load config from file and resolve file paths relative to the config file directory.
 * Adds safe defaults for optional flags.
 */
export function loadConfig(configPath: string): ToolConfig {
  const fullConfigPath = path.resolve(configPath);

  if (!fs.existsSync(fullConfigPath)) {
    throw new Error(`Config file not found at path: ${fullConfigPath}`);
  }

  const raw = fs.readFileSync(fullConfigPath, "utf8");
  const parsed = yaml.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid config file: unable to parse YAML.");
  }

  const requiredFields = ["model", "systemPromptPath", "attacksPath"];

  for (const field of requiredFields) {
    if (!parsed[field]) {
      throw new Error(`Missing required config field: ${field}`);
    }
  }

  // Validate numeric fields
  if (parsed.maxTokens && typeof parsed.maxTokens !== "number") {
    throw new Error("maxTokens must be a number");
  }
  if (parsed.temperature && typeof parsed.temperature !== "number") {
    throw new Error("temperature must be a number");
  }
  if (parsed.maxCalls && typeof parsed.maxCalls !== "number") {
    throw new Error("maxCalls must be a number");
  }

  // Validate ranges
  if (parsed.temperature < 0 || parsed.temperature > 1) {
    throw new Error("temperature must be between 0 and 1");
  }
  if (parsed.maxTokens < 1) {
    throw new Error("maxTokens must be >= 1");
  }

  // Resolve relative paths relative to config file directory
  const cfgDir = path.dirname(fullConfigPath);
  const resolvedSystemPromptPath = path.resolve(cfgDir, String(parsed.systemPromptPath));
  const resolvedAttacksPath = path.resolve(cfgDir, String(parsed.attacksPath));

  const config: ToolConfig = {
    model: String(parsed.model),
    systemPromptPath: resolvedSystemPromptPath,
    attacksPath: resolvedAttacksPath,
    maxTokens: parsed.maxTokens ? Number(parsed.maxTokens) : undefined,
    temperature: parsed.temperature ? Number(parsed.temperature) : undefined,
    // optional flags (safe defaults)
    useJudge: parsed.useJudge === true || false,
    maxCalls: parsed.maxCalls ? Number(parsed.maxCalls) : undefined,
    fail_on_high: parsed.fail_on_high === true,
    judgeModel: parsed.judgeModel ? String(parsed.judgeModel) : undefined,
    demoMode: parsed.demoMode === true || false,
    logLevel: parsed.logLevel || "normal"
  };

  return config;
}
