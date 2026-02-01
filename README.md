# aitoken

> Track your AI API usage and costs across OpenAI, Anthropic, Google, and more.

Never wonder "how much am I spending on AI?" again. Simple, fast, and local-first.

## Features

- **Multi-Provider Support** - OpenAI, Anthropic, Google, Azure, Cohere
- **Automatic Cost Calculation** - Up-to-date pricing for all major models
- **Beautiful Stats** - See usage by provider, model, and time period
- **Local Storage** - All data stored locally in SQLite (privacy-first)
- **Fast & Lightweight** - CLI tool, no GUI overhead
- **JSON Export** - Pipe data to other tools

## Quick Start

```bash
# Install
npm install -g aitoken-cli

# Add usage
at add -p openai -m gpt-4o -i 1500 -o 800

# View today's usage
at today

# View stats
at stats

# View last 7 days
at stats -d 7
```

## Installation

```bash
npm install -g aitoken-cli
```

Or use without installing:

```bash
npx aitoken-cli add -p openai -m gpt-4o -i 1500 -o 800
```

## Usage

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

### Track API Usage

Log your API calls automatically:

```typescript
import { exec } from 'child_process';

async function logUsage(response: any) {
  exec(`at add -p openai -m ${response.model} -i ${response.usage.prompt_tokens} -o ${response.usage.completion_tokens}`);
}
```

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
