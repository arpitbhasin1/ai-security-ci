# 🛡️ AI Security CI (Phase 1 MVP)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v0.1.0-orange)](package.json)

Automated **AI prompt security testing** that runs in your CI pipeline.  
Think: *Unit tests / SAST — but for AI prompts & agents.*

## 🚀 What it does

This tool runs simulated prompt attacks against your AI system to detect security vulnerabilities:

- **Jailbreak attempts** - Tests if your model can be tricked into ignoring safety instructions
- **Prompt leakage** - Checks if your system prompt or internal configuration can be extracted
- **Harmful content generation** - Validates that your model refuses dangerous requests

The tool evaluates responses using heuristics and optional LLM-based judging, then generates detailed reports in JSON and Markdown formats.

## 📦 Installation

### Prerequisites

- Node.js 20+ 
- OpenAI API key (for real testing) or use `DEMO_MODE` for testing without API calls

### Install Dependencies

```bash
npm install
```

## 🏃 Running Locally

1. **Set your OpenAI API key:**
   ```bash
   export OPENAI_API_KEY="sk-..."
   ```

2. **Run the security tests:**
   ```bash
   npm run ai-sec -- --config examples/ai-sec-config.yaml
   ```

3. **View results:**
   - JSON report: `ai-security-output/ai-security-result.json`
   - Markdown report: `ai-security-output/ai-security-report.md`

## 🎭 DEMO_MODE

Test the tool without making real API calls (zero cost):

```bash
export DEMO_MODE="true"
npm run ai-sec -- --config examples/ai-sec-config.yaml
```

DEMO_MODE uses canned responses, so you can verify the tool works end-to-end without spending API credits.

## ⚙️ Configuration Options

### maxCalls

Limit the number of attacks to run (useful for testing or cost control):

**Via config file:**
```yaml
maxCalls: 2
```

**Via environment variable:**
```bash
export MAX_CALLS_PER_RUN=2
npm run ai-sec -- --config examples/ai-sec-config.yaml
```

### fail_on_high

Control whether the tool exits with code 2 when high-severity failures are detected:

**Via config file:**
```yaml
fail_on_high: true  # Default: false
```

**Via environment variable:**
```bash
export FAIL_ON_HIGH="true"
npm run ai-sec -- --config examples/ai-sec-config.yaml
```

## 📝 Configuration File Example

Create `examples/ai-sec-config.yaml`:

```yaml
model: "gpt-4o-mini"
systemPromptPath: "./examples/system-prompt.txt"
attacksPath: "./attack-library/basic-attacks.json"
maxTokens: 512
temperature: 0.2
useJudge: true
maxCalls: 3
fail_on_high: false
```

### Path Resolution

- `systemPromptPath` - Path to your system prompt file (relative to config file directory)
- `attacksPath` - Path to your attack library JSON file (relative to config file directory)

Example: If your config is at `examples/ai-sec-config.yaml`:
- `systemPromptPath: "./system-prompt.txt"` resolves to `examples/system-prompt.txt`
- `attacksPath: "../attack-library/basic-attacks.json"` resolves to `attack-library/basic-attacks.json`

## 🔧 GitHub Actions Usage

### Basic Setup

Create `.github/workflows/ai-security.yml`:

```yaml
name: AI Security Check
on: [pull_request]

jobs:
  ai_security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run AI Security
        uses: your-org/ai-security-ci@v1
        with:
          config_path: "examples/ai-sec-config.yaml"
          fail_on_high: "true"
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### With maxCalls Limit

```yaml
      - name: Run AI Security
        uses: your-org/ai-security-ci@v1
        with:
          config_path: "examples/ai-sec-config.yaml"
          fail_on_high: "true"
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          MAX_CALLS_PER_RUN: "2"
```

## 📚 Documentation

- **[USAGE.md](USAGE.md)** - Detailed usage instructions and examples
- **ETHICS.md** - Ethical guidelines and responsible disclosure practices

## 🎯 Phase 1 Scope

**Current Attack Library:**
- Phase 1 includes **3 sanitized example attacks** covering:
  - Jailbreak attempts
  - System prompt leakage
  - Harmful content generation

**Phase 2 Roadmap:**
- Expand to **20+ attacks** covering additional attack vectors
- Enhanced evaluation heuristics
- More sophisticated judge prompts
- Additional report formats

## 🔒 Security & Privacy

- All outputs are **automatically sanitized** (long tokens redacted, content truncated)
- No sensitive data is logged or stored
- Attack prompts are included in reports for transparency
- Use `DEMO_MODE` for testing without API calls

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is Phase 1 MVP. Contributions welcome! Please see contributing guidelines (coming soon).

---

**Note:** This tool is designed for defensive security testing of your own AI systems. Only use it on systems you own or have explicit permission to test.
