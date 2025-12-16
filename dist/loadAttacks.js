"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAttacks = loadAttacks;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const validSeverities = ["low", "medium", "high"];
function loadAttacks(attacksPath) {
    const fullPath = path_1.default.resolve(attacksPath);
    if (!fs_1.default.existsSync(fullPath)) {
        throw new Error(`Attack library file not found at path: ${fullPath}`);
    }
    const raw = fs_1.default.readFileSync(fullPath, "utf8");
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (err) {
        throw new Error(`Unable to parse attack library JSON: ${err.message}`);
    }
    if (!Array.isArray(parsed)) {
        throw new Error("Attack library must be a JSON array.");
    }
    const attacks = parsed.map((item, index) => {
        if (!item || typeof item !== "object") {
            throw new Error(`[${fullPath}] Invalid attack definition at index ${index}: must be an object`);
        }
        const { id, category, description, prompt, severity } = item;
        // Ensure each attack has required fields: id, category, description, prompt, severity
        const missingFields = [];
        if (!id)
            missingFields.push("id");
        if (!category)
            missingFields.push("category");
        if (!description)
            missingFields.push("description");
        if (!prompt)
            missingFields.push("prompt");
        if (!severity)
            missingFields.push("severity");
        if (missingFields.length > 0) {
            throw new Error(`[${fullPath}] Missing required fields at index ${index}: ${missingFields.join(", ")}`);
        }
        const attackId = String(id);
        const attackDescription = String(description);
        // Ensure description length <= 200 characters
        if (attackDescription.length > 200) {
            throw new Error(`[${fullPath}] Description too long at index ${index} (attack ID: ${attackId}): ${attackDescription.length} characters (max 200)`);
        }
        // Ensure severity must be one of: "low", "medium", "high"
        if (!validSeverities.includes(severity)) {
            throw new Error(`[${fullPath}] Invalid severity "${severity}" at index ${index} (attack ID: ${attackId}). Must be one of: ${validSeverities.join(", ")}`);
        }
        const attack = {
            id: attackId,
            category: String(category),
            description: attackDescription,
            prompt: String(prompt),
            severity
        };
        return attack;
    });
    // Ensure IDs must be unique across the entire file
    const ids = new Set();
    for (let i = 0; i < attacks.length; i++) {
        const attack = attacks[i];
        if (ids.has(attack.id)) {
            throw new Error(`[${fullPath}] Duplicate attack ID "${attack.id}" found at index ${i}. IDs must be unique across the entire file.`);
        }
        ids.add(attack.id);
    }
    return attacks;
}
