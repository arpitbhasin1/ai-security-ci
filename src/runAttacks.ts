import fs from "fs";
import path from "path";
import { callChatCompletion } from "./openaiWrapper";
import { AttackDefinition } from "./types";
import { evaluateAttack, EvaluationResult } from "./evaluator";
import { judgeAttack } from "./judge";
import { sanitizeOutput } from "./sanitize";
import { log } from "./logger";

export interface AttackRun {
  attack: AttackDefinition;
  response: string;
  evaluation: EvaluationResult;
  judge?: { judgeSaysSuccess: boolean; explanation: string };
}

/**
 * Runs the attack library. Each attack is sent as a single user message,
 * with the provided system prompt prepended as system message.
 * This version will call the judge when heuristics are inconclusive or severity is high.
 */
export async function runAttacks(
  attacks: AttackDefinition[],
  systemPromptPath: string,
  model: string,
  maxTokens?: number,
  temperature?: number,
  useJudgeFlag?: boolean,
  maxCalls?: number,
  logLevel?: "quiet" | "normal" | "verbose"
): Promise<AttackRun[]> {
  const systemPath = path.resolve(systemPromptPath);
  if (!fs.existsSync(systemPath)) throw new Error(`System prompt file not found: ${systemPath}`);
  const systemPrompt = fs.readFileSync(systemPath, "utf8");

  // Apply maxCalls limit before running attacks
  if (maxCalls && Number(maxCalls) > 0) {
    attacks = attacks.slice(0, maxCalls);
  }

  const runs: AttackRun[] = [];

  for (const attack of attacks) {
    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: attack.prompt }
    ];

    const resp = await callChatCompletion({
      model,
      messages,
      max_tokens: Math.min(maxTokens ?? 512, 1024),
      temperature: temperature ?? 0.2
    });

    const content = resp.choices && resp.choices.length > 0 && resp.choices[0].message?.content
      ? String(resp.choices[0].message?.content)
      : "";

    // Heuristic evaluation
    const evaluation = evaluateAttack(attack, content);

    let judgeResult: { judgeSaysSuccess: boolean; explanation: string } | undefined = undefined;

    // JUDGE MUST RUN ONLY IF:
    // 1) heuristics did NOT detect success (evaluation.success === false)
    // AND
    // 2) (attack.severity === 'high' OR useJudgeFlag === true)
    const heuristicsDetectedSuccess = evaluation.success === true;
    const shouldCallJudge = !heuristicsDetectedSuccess && (attack.severity === "high" || useJudgeFlag === true);

    if (shouldCallJudge) {
      try {
        judgeResult = await judgeAttack(systemPrompt, attack.id, attack.description, content, model, 150, 0.0);
        
        // If judge says success = true → override evaluation.success to true and append explanation
        // Judge must NOT override a heuristic success → do not change success=true to false
        // (This is already protected by shouldCallJudge check, but we double-check here)
        if (judgeResult.judgeSaysSuccess && !evaluation.success) {
          evaluation.reason.push(`judge: ${judgeResult.explanation}`);
          evaluation.success = true;
        }
      } catch (err) {
        // Judge failed — just continue using heuristic result
        log("verbose", logLevel || "normal", `Judge call failed for ${attack.id}: ${(err as Error).message}`);
      }
    }

    runs.push({
      attack,
      response: sanitizeOutput(content),
      evaluation,
      judge: judgeResult
    });
  }

  return runs;
}
