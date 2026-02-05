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
    <a href="https://www.brianmunene.me/docs/aitoken-cli-docs">Read the documentation</a>
  </p>
</div>

---

## The Problem

You're spending $200+/month on GPT-4, Claude, and other AI APIs.

**But you have no idea where it's going.**

## The Solution

Track every API call locally. See exactly what you're spending.

```bash
# Track usage
at add -p openai -m gpt-4o -i 1500 -o 800

# View stats
at stats
# Total: $34.56 (245,890 tokens)
```

## Features

- **Automatic Tracking** - Built-in wrappers, middleware, and SDK extensions (NEW in v1.1.0)
- **Multi-Provider Support** - OpenAI, Anthropic, Google, Azure, Cohere
- **Automatic Cost Calculation** - Up-to-date pricing for all major models
- **Beautiful Stats** - See usage by provider, model, and time period
- **Local Storage** - All data stored locally in SQLite (privacy-first)
- **Fast & Lightweight** - CLI tool, no GUI overhead
- **JSON Export** - Pipe data to other tools
- **Programmatic API** - Use in your code without CLI calls

## Installation

```bash
npm install -g aitoken-cli
```

## CLI Usage

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

## Automatic Tracking (v1.1.0+)

The package includes **built-in automatic tracking functions** - no need for exec() or CLI calls in your code!

### Import and Use Directly

```typescript
//  Method 1: Wrapper Functions (Easiest)
import { trackedGPT, trackedClaude, trackedGemini } from 'aitoken-cli/wrappers';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Just use trackedGPT() instead of openai.chat.completions.create()
const response = await trackedGPT(openai, {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
  // Automatically tracked! 
});

const claudeResponse = await trackedClaude(anthropic, {
  model: 'claude-sonnet-4.5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Explain TypeScript' }]
  // Automatically tracked! 
});
```

```typescript
//  Method 2: Middleware Pattern (Zero Code Changes)
import { createTrackedClient } from 'aitoken-cli/middleware';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Wrap your client once
const trackedOpenAI = createTrackedClient(openai, {
  provider: 'openai',
  model: 'gpt-4o'
});

// Use it exactly like normal - tracking happens automatically
const response = await trackedOpenAI.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
// Automatically tracked with zero code changes! 
```

```typescript
//  Method 3: SDK Extensions (Drop-in Replacement)
import { TrackedOpenAI, TrackedAnthropic } from 'aitoken-cli/extensions';

// Just change the import - everything else stays the same!
const openai = new TrackedOpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
// Automatically tracked!
```

**See [EXAMPLES.md](./EXAMPLES.md) for 12 complete examples including Express.js, Next.js, and chatbot integrations.**

## Programmatic API

```typescript
import { addUsage, getUsage, getStats, calculateCost } from 'aitoken-cli';

// Calculate cost for a request
const cost = calculateCost('openai', 'gpt-4o', 1500, 800);
console.log(`Cost: $${cost.toFixed(4)}`); // $0.0195

// Add a usage entry
addUsage({
  provider: 'openai',
  model: 'gpt-4o',
  promptTokens: 1500,
  completionTokens: 800,
  totalTokens: 2300,
  cost,
  timestamp: new Date().toISOString(),
  notes: 'My API call',
});

// Get usage entries
const usage = getUsage({ provider: 'openai', limit: 10 });

// Get statistics
const stats = getStats({ provider: 'openai' });
console.log(`Total: $${stats.totalCost.toFixed(2)} (${stats.totalRequests} requests)`);
```

## Data Storage

All data is stored locally in `~/.token-tracker/usage.db` (SQLite).

No data is sent anywhere. 100% local.

## Supported Providers & Models (42 Models)

### OpenAI (16 models)
- GPT-5.2, GPT-5.2 Pro, GPT-5 Mini
- GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano
- o4-mini
- GPT-4, GPT-4-32K, GPT-4 Turbo, GPT-4o, GPT-4o Mini
- GPT-3.5 Turbo, GPT-3.5 Turbo 16K
- o1-preview, o1-mini

### Anthropic (14 models)
- Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.5
- Claude 3.5 Sonnet, Claude 3.5 Haiku
- Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- Claude 2.1, Claude 2.0, Claude Instant

### Google (5 models)
- Gemini 1.5 Pro, Gemini 1.5 Flash
- Gemini 1.0 Pro, Gemini Pro, Gemini Pro Vision

### Azure OpenAI (3 models)
- GPT-4, GPT-4-32K, GPT-3.5 Turbo

### Cohere (4 models)
- Command, Command Light, Command R, Command R+

## Development

```bash
# Clone repo
git clone https://github.com/brian-mwirigi/aitoken-cli.git
cd aitoken-cli

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

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Author

Built by [Brian Mwirigi](https://github.com/brian-mwirigi)