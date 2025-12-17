import OpenAI from "openai";

const isDemoMode = process.env.DEMO_MODE === "true";

// Declare apiKey in outer scope
const apiKey = process.env.OPENAI_API_KEY;

// Only enforce API key when NOT in demo mode
if (!isDemoMode && !apiKey) {
  throw new Error("OPENAI_API_KEY not set in environment");
}

// Create client
export const client = new OpenAI({
  apiKey: apiKey || "demo-key", // dummy value allowed in DEMO_MODE
});
