import OpenAI from "openai";

const isDemoMode = process.env.DEMO_MODE === "true";
const apiKey = process.env.OPENAI_API_KEY;

if (!isDemoMode && !apiKey) {
  throw new Error("OPENAI_API_KEY not set in environment");
}

export const client = new OpenAI({
  apiKey: apiKey || "demo-key",
});
