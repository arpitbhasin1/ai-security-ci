"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAttacks = runAttacks;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const openaiWrapper_1 = require("./openaiWrapper");
const evaluator_1 = require("./evaluator");
const judge_1 = require("./judge");
const sanitize_1 = require("./sanitize");
const logger_1 = require("./logger");
/**
 * Runs the attack library. Each attack is sent as a single user message,
 * with the provided system prompt prepended as system message.
 * This version will call the judge when heuristics are inconclusive or severity is high.
 */
async function runAttacks(attacks, systemPromptPath, model, maxTokens, temperature, useJudgeFlag, maxCalls, logLevel) {
    var _a, _b;
    const systemPath = path_1.default.resolve(systemPromptPath);
    if (!fs_1.default.existsSync(systemPath))
        throw new Error(`System prompt file not found: ${systemPath}`);
    const systemPrompt = fs_1.default.readFileSync(systemPath, "utf8");
    // Apply maxCalls limit before running attacks
    if (maxCalls && Number(maxCalls) > 0) {
        attacks = attacks.slice(0, maxCalls);
    }
    const runs = [];
    for (const attack of attacks) {
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: attack.prompt }
        ];
        const resp = await (0, openaiWrapper_1.callChatCompletion)({
            model,
            messages,
            max_tokens: Math.min(maxTokens !== null && maxTokens !== void 0 ? maxTokens : 512, 1024),
            temperature: temperature !== null && temperature !== void 0 ? temperature : 0.2
        });
        const content = resp.choices && resp.choices.length > 0 && ((_a = resp.choices[0].message) === null || _a === void 0 ? void 0 : _a.content)
            ? String((_b = resp.choices[0].message) === null || _b === void 0 ? void 0 : _b.content)
            : "";
        // Heuristic evaluation
        const evaluation = (0, evaluator_1.evaluateAttack)(attack, content);
        let judgeResult = undefined;
        // JUDGE MUST RUN ONLY IF:
        // 1) heuristics did NOT detect success (evaluation.success === false)
        // AND
        // 2) (attack.severity === 'high' OR useJudgeFlag === true)
        const heuristicsDetectedSuccess = evaluation.success === true;
        const shouldCallJudge = !heuristicsDetectedSuccess && (attack.severity === "high" || useJudgeFlag === true);
        if (shouldCallJudge) {
            try {
                judgeResult = await (0, judge_1.judgeAttack)(systemPrompt, attack.id, attack.description, content, model, 150, 0.0);
                // If judge says success = true → override evaluation.success to true and append explanation
                // Judge must NOT override a heuristic success → do not change success=true to false
                // (This is already protected by shouldCallJudge check, but we double-check here)
                if (judgeResult.judgeSaysSuccess && !evaluation.success) {
                    evaluation.reason.push(`judge: ${judgeResult.explanation}`);
                    evaluation.success = true;
                }
            }
            catch (err) {
                // Judge failed — just continue using heuristic result
                (0, logger_1.log)("verbose", logLevel || "normal", `Judge call failed for ${attack.id}: ${err.message}`);
            }
        }
        runs.push({
            attack,
            response: (0, sanitize_1.sanitizeOutput)(content),
            evaluation,
            judge: judgeResult
        });
    }
    return runs;
}
