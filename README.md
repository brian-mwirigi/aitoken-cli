<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=120&section=header" width="100%"/>

# aitoken-cli

### Track every dollar you spend on AI APIs

<p>
<a href="https://www.npmjs.com/package/aitoken-cli"><img src="https://img.shields.io/npm/v/aitoken-cli?style=for-the-badge&color=brightgreen&label=version" alt="npm version"></a>&nbsp;
<a href="https://www.npmjs.com/package/aitoken-cli"><img src="https://img.shields.io/npm/dw/aitoken-cli?style=for-the-badge&color=blue&label=downloads" alt="npm downloads"></a>&nbsp;
<a href="https://github.com/brian-mwirigi/aitoken-cli/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/aitoken-cli?style=for-the-badge" alt="license"></a>&nbsp;
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">&nbsp;
<img src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
</p>

**Local-first &bull; Privacy-focused &bull; Multi-provider &bull; 42 models supported**

[Documentation](https://www.brianmunene.me/docs/aitoken-cli-docs) &bull; [npm](https://www.npmjs.com/package/aitoken-cli) &bull; [Issues](https://github.com/brian-mwirigi/aitoken-cli/issues)

</div>

<br/>

## Why aitoken-cli?

You're spending $200+/month on GPT-4, Claude, and Gemini. **But you have no idea where it's going.**

```
$ at stats

┌─────────────────┬──────────┐
│ Metric          │ Value    │
├─────────────────┼──────────┤
│ Total Requests  │ 127      │
│ Total Tokens    │ 3.2M     │
│ Total Cost      │ $24.5670 │
└─────────────────┴──────────┘

┌──────────┬──────────┬─────────┬──────────┬────────────┐
│ Provider │ Requests │ Tokens  │ Cost     │ % of Total │
├──────────┼──────────┼─────────┼──────────┼────────────┤
│ openai   │ 85       │ 2.1M    │ $18.2340 │ 74.2%      │
│ anthropic│ 32       │ 890K    │ $5.1230  │ 20.9%      │
│ google   │ 10       │ 210K    │ $1.2100  │ 4.9%       │
└──────────┴──────────┴─────────┴──────────┴────────────┘
```

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [CLI Commands](#cli-commands)
- [Automatic Tracking](#automatic-tracking-v110)
- [Programmatic API](#programmatic-api)
- [Supported Providers & Models](#supported-providers--models-42-models)
- [Architecture](#architecture)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

```bash
npm install -g aitoken-cli

# Track usage
at add -p openai -m gpt-4o -i 1500 -o 800

# View stats
at stats
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Automatic Tracking** | Built-in wrappers, middleware, and SDK extensions |
| **Multi-Provider** | OpenAI, Anthropic, Google, Azure, Cohere |
| **Automatic Costs** | Up-to-date pricing for all 42 models |
| **Beautiful Stats** | Usage by provider, model, and time period |
| **Local Storage** | All data in SQLite — nothing leaves your machine |
| **JSON Export** | Pipe data to other tools |
| **Programmatic API** | Use in your code without CLI calls |

---

## CLI Commands

### `at add` — Track usage

```bash
at add -p openai -m gpt-4o -i 1500 -o 800
at add -p anthropic -m claude-3.5-sonnet -i 2000 -o 1200 -n "Code review session"
```

| Flag | Description |
|------|-------------|
| `-p, --provider` | Provider (openai, anthropic, google, azure, cohere) |
| `-m, --model` | Model name |
| `-i, --input` | Input/prompt tokens |
| `-o, --output` | Output/completion tokens |
| `-n, --notes` | Optional notes |

### `at list` — View usage

```bash
at list              # Last 20 entries
at list -p openai    # Filter by provider
at list --json       # Export as JSON
```

### `at stats` — View statistics

```bash
at stats             # Overall stats
at stats -d 7        # Last 7 days
at stats -p anthropic # Specific provider
```

### `at today` — Today's snapshot

```bash
at today
at today --json
```

### `at models` — Supported models & pricing

```bash
at models            # All models
at models -p openai  # Filter by provider
```

### `at clear` — Clear data

```bash
at clear --yes              # Clear all
at clear -p openai --yes    # Clear by provider
at clear --before 2026-01-01 --yes  # Clear before date
```

---

## Automatic Tracking (v1.1.0+)

Three integration methods — pick the one that fits your workflow:

<details>
<summary><b>Method 1: Wrapper Functions (Easiest)</b></summary>

```typescript
import { trackedGPT, trackedClaude } from 'aitoken-cli/wrappers';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await trackedGPT(openai, {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
  // Automatically tracked!
});
```

</details>

<details>
<summary><b>Method 2: Middleware Pattern (Zero Code Changes)</b></summary>

```typescript
import { createTrackedClient } from 'aitoken-cli/middleware';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const trackedOpenAI = createTrackedClient(openai, {
  provider: 'openai',
  model: 'gpt-4o'
});

// Use exactly like normal — tracking is automatic
const response = await trackedOpenAI.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

</details>

<details>
<summary><b>Method 3: SDK Extensions (Drop-in Replacement)</b></summary>

```typescript
import { TrackedOpenAI } from 'aitoken-cli/extensions';

// Change the import — everything else stays the same
const openai = new TrackedOpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
// Automatically tracked!
```

</details>

> See [EXAMPLES.md](./EXAMPLES.md) for 12 complete examples including Express.js, Next.js, and chatbot integrations.

---

## Programmatic API

```typescript
import { addUsage, getUsage, getStats, calculateCost } from 'aitoken-cli';

const cost = calculateCost('openai', 'gpt-4o', 1500, 800);
// $0.0195

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

const stats = getStats({ provider: 'openai' });
console.log(`Total: $${stats.totalCost.toFixed(2)}`);
```

---

## Supported Providers & Models (42 Models)

| Provider | Models | Highlights |
|----------|--------|-----------|
| **OpenAI** | 16 | GPT-5.2, GPT-4.1, GPT-4o, o4-mini, o1 |
| **Anthropic** | 14 | Claude Sonnet 4.5, Claude Opus 4.5, Claude 3.5 |
| **Google** | 5 | Gemini 1.5 Pro, Gemini 1.5 Flash |
| **Azure OpenAI** | 3 | GPT-4, GPT-4-32K, GPT-3.5 Turbo |
| **Cohere** | 4 | Command R+, Command R, Command |

---

## Architecture

```
┌─────────────────────────────────────────┐
│              aitoken-cli                │
├───────────────┬─────────────────────────┤
│  CLI Layer    │  Programmatic API       │
│  (Commander)  │  (addUsage, getStats)   │
├───────────────┴─────────────────────────┤
│           Cost Calculator               │
│     (42 models, auto-updated pricing)   │
├─────────────────────────────────────────┤
│           SQLite Database               │
│        ~/.token-tracker/usage.db        │
└─────────────────────────────────────────┘
```

All data stays on your machine. **Nothing is sent anywhere.**

---

## Development

```bash
git clone https://github.com/brian-mwirigi/aitoken-cli.git
cd aitoken-cli
npm install
npm run build
npm link
at stats
```

## Contributing

Contributions welcome! Please [open an issue](https://github.com/brian-mwirigi/aitoken-cli/issues) or submit a PR.

## License

[MIT](./LICENSE)

---

<div align="center">

**Built by [Brian Munene Mwirigi](https://brianmunene.me)**

<a href="https://www.npmjs.com/package/aitoken-cli">npm</a> &bull;
<a href="https://www.brianmunene.me/docs/aitoken-cli-docs">Docs</a> &bull;
<a href="https://github.com/brian-mwirigi/aitoken-cli/issues">Issues</a>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=80&section=footer" width="100%"/>

</div>
