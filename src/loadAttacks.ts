import fs from "fs";
import path from "path";
import { AttackDefinition, Severity } from "./types";

const validSeverities: Severity[] = ["low", "medium", "high"];

export function loadAttacks(attacksPath: string): AttackDefinition[] {
  const fullPath = path.resolve(attacksPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Attack library file not found at path: ${fullPath}`);
  }

  const raw = fs.readFileSync(fullPath, "utf8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Unable to parse attack library JSON: ${(err as Error).message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Attack library must be a JSON array.");
  }

  const attacks: AttackDefinition[] = parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`[${fullPath}] Invalid attack definition at index ${index}: must be an object`);
    }

    const { id, category, description, prompt, severity } = item as any;

    // Ensure each attack has required fields: id, category, description, prompt, severity
    const missingFields: string[] = [];
    if (!id) missingFields.push("id");
    if (!category) missingFields.push("category");
    if (!description) missingFields.push("description");
    if (!prompt) missingFields.push("prompt");
    if (!severity) missingFields.push("severity");
    
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
      throw new Error(
        `[${fullPath}] Invalid severity "${severity}" at index ${index} (attack ID: ${attackId}). Must be one of: ${validSeverities.join(", ")}`
      );
    }

    const attack: AttackDefinition = {
      id: attackId,
      category: String(category),
      description: attackDescription,
      prompt: String(prompt),
      severity
    };

    return attack;
  });

  // Ensure IDs must be unique across the entire file
  const ids = new Set<string>();
  for (let i = 0; i < attacks.length; i++) {
    const attack = attacks[i];
    if (ids.has(attack.id)) {
      throw new Error(`[${fullPath}] Duplicate attack ID "${attack.id}" found at index ${i}. IDs must be unique across the entire file.`);
    }
    ids.add(attack.id);
  }

  return attacks;
}

