"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const openai_1 = __importDefault(require("openai"));
const isDemoMode = process.env.DEMO_MODE === "true";
// Declare apiKey in outer scope
const apiKey = process.env.OPENAI_API_KEY;
// Only enforce API key when NOT in demo mode
if (!isDemoMode && !apiKey) {
    throw new Error("OPENAI_API_KEY not set in environment");
}
// Create client
exports.client = new openai_1.default({
    apiKey: apiKey || "demo-key", // dummy value allowed in DEMO_MODE
});
