<div align="center">
  <h1>aitoken-cli</h1>
  <p><strong>Track every dollar you spend on AI APIs</strong></p>
  
  <p>
    <a href="https://www.npmjs.com/package/aitoken-cli"><img src="https://img.shields.io/npm/v/aitoken-cli?color=brightgreen" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/aitoken-cli"><img src="https://img.shields.io/npm/dm/aitoken-cli" alt="npm downloads"></a>
    <a href="https://github.com/brian-mwirigi/aitoken-cli/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/aitoken-cli" alt="license"></a>
  </p>

  <p><em>Local-first • Privacy-focused • Multi-provider • Fast</em></p>
  
  <p>
    <a href="https://www.brianmunene.me/blog/2-track-ai-api-costs">📖 Read the full story: How I cut AI costs by 59%</a>
  </p>
</div>

---

##  The Problem

You're spending $200+/month on GPT-4, Claude, and other AI APIs.

**But you have no idea where it's going.**

##  The Solution

Track every API call locally. See exactly what you're spending.

```bash
# Track usage
at add -p openai -m gpt-4o -i 1500 -o 800

# View stats
at stats
# Total: $34.56 (245,890 tokens)
```

> **Demo:** _[Add GIF here showing cost tracking in action]_

## Features

- **Multi-Provider Support** - OpenAI, Anthropic, Google, Azure, Cohere
- **Automatic Cost Calculation** - Up-to-date pricing for all major models
- **Beautiful Stats** - See usage by provider, model, and time period
- **Local Storage** - All data stored locally in SQLite (privacy-first)
- **Fast & Lightweight** - CLI tool, no GUI overhead
- **JSON Export** - Pipe data to other tools

## Installation

```bash
npm install -g aitoken-cli
```

##  Usage

### Add Usage

```bash
# Basic usage
at add -p openai -m gpt-4o -i 1500 -o 800

# With notes
at add -p anthropic -m claude-3.5-sonnet -i 2000 -o 1200 -n "Code review session"

# Options:
# -p, --provider   Provider (openai, anthropic, google, azure, cohere)
# -m, --model      Model name
# -i, --input      Input/prompt tokens
# -o, --output     Output/completion tokens
# -n, --notes      Optional notes
```

### View Usage

```bash
# List recent usage (default: last 20)
at list

# Filter by provider
at list -p openai

# Limit results
at list -l 50

# Export as JSON
at list --json > usage.json
```

### View Stats

```bash
# Overall stats
at stats

# Last 7 days
at stats -d 7

# Specific provider
at stats -p anthropic

# Export as JSON
at stats --json
```

### Today's Usage

```bash
# Quick view of today
at today

# As JSON
at today --json
```

### Supported Models

```bash
# List all models and pricing
at models

# Filter by provider
at models -p openai
```

### Clear Data

```bash
# Clear all data (requires confirmation)
at clear --yes

# Clear specific provider
at clear -p openai --yes

# Clear before date
at clear --before 2026-01-01 --yes
```

## Example Output

```bash
$ at stats

 Overall Stats

┌─────────────────┬──────────┐
│ Metric          │ Value    │
├─────────────────┼──────────┤
│ Total Requests  │ 127      │
│ Total Tokens    │ 3.2M     │
│ Total Cost      │ $24.5670 │
└─────────────────┴──────────┘

 By Provider

┌──────────┬──────────┬─────────┬──────────┬────────────┐
│ Provider │ Requests │ Tokens  │ Cost     │ % of Total │
├──────────┼──────────┼─────────┼──────────┼────────────┤
│ openai   │ 85       │ 2.1M    │ $18.2340 │ 74.2%      │
│ anthropic│ 32       │ 890K    │ $5.1230  │ 20.9%      │
│ google   │ 10       │ 210K    │ $1.2100  │ 4.9%       │
└──────────┴──────────┴─────────┴──────────┴────────────┘
```

## Use Cases

### Integration with AI Coding

Add after each coding session:

```bash
# After using Cursor/Claude Code
at add -p anthropic -m claude-3.5-sonnet -i 15000 -o 8000 -n "Built token tracker"
```

### Track API Usage in Code

**Integrate once, track forever:**

```typescript
import { exec } from 'child_process';
import OpenAI from 'openai';

const openai = new OpenAI();

// Create wrapper function (one-time setup)
async function callGPT(messages: any[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages
  });
  
  // Automatic tracking
  const { prompt_tokens, completion_tokens } = response.usage;
  exec(`at add -p openai -m gpt-4o -i ${prompt_tokens} -o ${completion_tokens}`);
  
  return response;
}

// Now every call tracks automatically
await callGPT([{role: "user", content: "Hello"}]);  // tracked ✓
await callGPT([{role: "user", content: "Goodbye"}]); // tracked ✓
```

**Works with Anthropic, Google, and all supported providers.**

### Budget Alerts

Check if you're over budget:

```bash
# Get today's spending as JSON
COST=$(at today --json | jq '.[] | .cost' | jq -s add)

if (( $(echo "$COST > 10" | bc -l) )); then
  echo "⚠️ Over daily budget!"
fi
```

## Data Storage

All data is stored locally in `~/.tokencost/usage.db` (SQLite).

No data is sent anywhere. 100% local.

## Supported Providers & Models

### OpenAI
- GPT-4, GPT-4 Turbo, GPT-4o, GPT-4o Mini
- GPT-3.5 Turbo variants
- O1 Preview, O1 Mini

### Anthropic (Claude)
- Claude 3 Opus, Sonnet, Haiku
- Claude 3.5 Sonnet, Haiku
- Claude 2.x, Claude Instant

### Google
- Gemini 1.5 Pro, Flash
- Gemini 1.0 Pro, Pro Vision

### Azure OpenAI
- GPT-4, GPT-3.5 Turbo

### Cohere
- Command, Command Light, Command R, Command R+

## Development

```bash
# Clone repo
git clone https://github.com/brian-mwirigi/tokencost.git
cd tokencost

# Install dependencies
npm install

# Run in dev mode
npm run dev -- add -p openai -m gpt-4o -i 1000 -o 500

# Build
npm run build

# Test locally
npm link
at stats
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

##  Inspired By

Built by [Brian Mwirigi](https://github.com/brian-mwirigi) inspired by [CodexBar](https://github.com/steipete/CodexBar).

---
