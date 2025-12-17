"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const openai_1 = __importDefault(require("openai"));
const isDemoMode = process.env.DEMO_MODE === "true";
const apiKey = process.env.OPENAI_API_KEY;
if (!isDemoMode && !apiKey) {
    throw new Error("OPENAI_API_KEY not set in environment");
}
exports.client = new openai_1.default({
    apiKey: apiKey || "demo-key",
});
