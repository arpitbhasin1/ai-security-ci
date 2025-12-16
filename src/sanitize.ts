export function sanitizeOutput(str: string): string {
  if (!str) return "";
  let out = str;

  // Remove long token-like sequences (API keys, secrets, etc.)
  out = out.replace(/[A-Za-z0-9\-_]{20,}/g, "[REDACTED]");

  // Truncate very long or harmful outputs
  if (out.length > 500) {
    out = out.slice(0, 500) + "... [TRUNCATED]";
  }

  return out;
}
