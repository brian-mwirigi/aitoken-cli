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
    <a href="https://www.brianmunene.me/docs/aitoken-cli-docs"> PLease read the documentation</a>
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

## ✨ Features

- **🎯 Automatic Tracking** - Built-in wrappers, middleware, and SDK extensions (NEW in v1.1.0)
- **🌍 Multi-Provider Support** - OpenAI, Anthropic, Google, Azure, Cohere
- **💰 Automatic Cost Calculation** - Up-to-date pricing for all major models
- **📊 Beautiful Stats** - See usage by provider, model, and time period
- **🔒 Local Storage** - All data stored locally in SQLite (privacy-first)
- **⚡ Fast & Lightweight** - CLI tool, no GUI overhead
- **📤 JSON Export** - Pipe data to other tools
- **📝 Programmatic API** - Use in your code without CLI calls

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

## Automatic Tracking Methods

### Method 1: Wrapper Functions (Recommended)

Create utility wrappers for complete automation:

```typescript
// utils/trackedAI.ts
import { exec } from 'child_process';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI();
const anthropic = new Anthropic();

// Tracked OpenAI wrapper
export async function trackedGPT(messages: any[], model = "gpt-4o") {
  const response = await openai.chat.completions.create({ model, messages });
  
  const { prompt_tokens, completion_tokens } = response.usage;
  exec(`at add -p openai -m ${model} -i ${prompt_tokens} -o ${completion_tokens}`);
  
  return response;
}

// Tracked Anthropic wrapper
export async function trackedClaude(messages: any[], model = "claude-3-5-sonnet-20241022") {
  const response = await anthropic.messages.create({
    model,
    messages,
    max_tokens: 4096
  });
  
  const { input_tokens, output_tokens } = response.usage;
  exec(`at add -p anthropic -m ${model} -i ${input_tokens} -o ${output_tokens}`);
  
  return response;
}
```

Then use these everywhere:

```typescript
// Before (manual tracking)
const response = await openai.chat.completions.create({...});

// After (automatic tracking)
const response = await trackedGPT([{role: "user", content: "Hello"}]);
```

### Method 2: Middleware Pattern

Intercept ALL API calls automatically:

```typescript
// middleware/aiTracker.ts
import { exec } from 'child_process';

export function createTrackedClient(client: any, provider: string) {
  return new Proxy(client, {
    get(target, prop) {
      const original = target[prop];
      
      if (typeof original === 'function') {
        return async function(...args: any[]) {
          const result = await original.apply(target, args);
          
          if (result?.usage) {
            const model = args[0]?.model || 'unknown';
            const inputTokens = result.usage.prompt_tokens || result.usage.input_tokens;
            const outputTokens = result.usage.completion_tokens || result.usage.output_tokens;
            
            exec(`at add -p ${provider} -m ${model} -i ${inputTokens} -o ${outputTokens}`);
          }
          
          return result;
        };
      }
      
      return original;
    }
  });
}

// Usage - all calls auto-track
const openai = createTrackedClient(new OpenAI(), 'openai');
```

### Method 3: Post-Session Manual Tracking

For AI coding tools (Cursor, Claude Code):

```bash
# After a coding session, manually log usage
at add -p anthropic -m claude-3.5-sonnet -i 15000 -o 8000 -n "2hr coding session"
```

## 🚀 NEW: Built-in Automatic Tracking (v1.1.0+)

The package now includes **ready-to-use automatic tracking functions** - no need for `exec()` or CLI calls!

### Import and Use Directly

```typescript
// ✨ Method 1: Wrapper Functions (Easiest)
import { trackedGPT, trackedClaude, trackedGemini } from 'aitoken-cli/wrappers';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Just use trackedGPT() instead of openai.chat.completions.create()
const response = await trackedGPT(openai, {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
  // Automatically tracked! ✅
});

const claudeResponse = await trackedClaude(anthropic, {
  model: 'claude-sonnet-4.5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Explain TypeScript' }]
  // Automatically tracked! ✅
});
```

```typescript
// ✨ Method 2: Middleware Pattern (Zero Code Changes)
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
// Automatically tracked with zero code changes! ✅
```

```typescript
// ✨ Method 3: SDK Extensions (Drop-in Replacement)
import { TrackedOpenAI, TrackedAnthropic } from 'aitoken-cli/extensions';

// Just change the import - everything else stays the same!
const openai = new TrackedOpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
// Automatically tracked! ✅
```

**See [EXAMPLES.ts](./EXAMPLES.ts) for 12 complete examples including Express.js, Next.js, and chatbot integrations.**

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
