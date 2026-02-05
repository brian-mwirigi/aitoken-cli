# Usage Examples for aitoken-cli

This file demonstrates all three methods of automatic tracking with **aitoken-cli**.

## Prerequisites

Install peer dependencies based on which providers you want to use:

```bash
# For OpenAI
npm install openai

# For Anthropic Claude
npm install @anthropic-ai/sdk

# For Google Gemini
npm install @google/generative-ai

# For web frameworks (Express.js example)
npm install express
```

---

## METHOD 1: WRAPPER FUNCTIONS (Recommended)

### Example 1: OpenAI with trackedGPT()

```typescript
import { trackedGPT } from 'aitoken-cli/wrappers';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function askGPT() {
  const response = await trackedGPT(openai, {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is TypeScript?' }
    ]
  }, 'Documentation query'); // Optional notes

  console.log(response.choices[0].message.content);
  // ✅ Automatically tracked to ~/.token-tracker/usage.db
}
```

### Example 2: Anthropic Claude with trackedClaude()

```typescript
import { trackedClaude } from 'aitoken-cli/wrappers';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function askClaude() {
  const response = await trackedClaude(anthropic, {
    model: 'claude-sonnet-4.5',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Explain async/await in JavaScript' }
    ]
  }, 'Code explanation');

  console.log(response.content[0].text);
  // ✅ Automatically tracked
}
```

### Example 3: Google Gemini with trackedGemini()

```typescript
import { trackedGemini } from 'aitoken-cli/wrappers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function askGemini() {
  const response = await trackedGemini(genAI, {
    model: 'gemini-1.5-pro',
    prompt: 'What are the benefits of using TypeScript?'
  });

  console.log(response.response.text());
  // ✅ Automatically tracked
}
```

---

## METHOD 2: MIDDLEWARE PATTERN (Best for Large Codebases)

### Example 4: Proxy That Tracks Everything

```typescript
import { createTrackedClient } from 'aitoken-cli/middleware';
import OpenAI from 'openai';

async function useMiddleware() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // Wrap the entire client
  const trackedOpenAI = createTrackedClient(openai, {
    provider: 'openai',
    model: 'gpt-4o',
    notes: 'Production API'
  });

  // Use it exactly like normal OpenAI - tracking is automatic!
  const response = await trackedOpenAI.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }]
  });

  console.log(response.choices[0].message.content);
  // ✅ Automatically tracked - no changes to existing code!
}
```

### Example 5: Higher-Order Function Wrapper

```typescript
import { withTracking } from 'aitoken-cli/middleware';
import OpenAI from 'openai';

async function useHigherOrder() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // Wrap specific functions
  const generateCodeReview = withTracking(
    async (code: string) => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a code reviewer.' },
          { role: 'user', content: `Review this code:\n\n${code}` }
        ]
      });
    },
    { provider: 'openai', model: 'gpt-4o', notes: 'Code review' }
  );

  const response = await generateCodeReview('function add(a, b) { return a + b; }');
  console.log(response.choices[0].message.content);
  // ✅ Automatically tracked
}
```

### Example 6: Batch Tracking for Parallel Requests

```typescript
import { BatchTracker } from 'aitoken-cli/middleware';
import OpenAI from 'openai';

async function batchTracking() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const tracker = new BatchTracker('openai', 'gpt-4o', 'Parallel requests');

  // Track multiple parallel requests
  const responses = await Promise.all([
    tracker.track(() => openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'What is React?' }]
    })),
    tracker.track(() => openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'What is Vue?' }]
    })),
    tracker.track(() => openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'What is Angular?' }]
    }))
  ]);

  responses.forEach(r => console.log(r.choices[0].message.content));
  // ✅ All three requests automatically tracked
}
```

---

## METHOD 3: SDK EXTENSIONS (Drop-in Replacements)

### Example 7: TrackedOpenAI (Drop-in Replacement)

```typescript
import { TrackedOpenAI } from 'aitoken-cli/extensions';

async function useTrackedSDK() {
  // Just change the import - everything else stays the same!
  const openai = new TrackedOpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    notes: 'Using TrackedOpenAI'
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }]
  });

  console.log(response.choices[0].message.content);
  // ✅ Automatically tracked - zero code changes!
}
```

### Example 8: TrackedAnthropic

```typescript
import { TrackedAnthropic } from 'aitoken-cli/extensions';

async function useTrackedClaude() {
  const anthropic = new TrackedAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4.5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Explain promises' }]
  });

  console.log(response.content[0].text);
  // ✅ Automatically tracked
}
```

### Example 9: TrackedGoogleAI

```typescript
import { TrackedGoogleAI } from 'aitoken-cli/extensions';

async function useTrackedGemini() {
  const genAI = new TrackedGoogleAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const response = await model.generateContent('What is async programming?');
  console.log(response.response.text());
  // ✅ Automatically tracked
}
```

---

## REAL-WORLD EXAMPLES

### Example 10: Express.js Middleware

```typescript
import express from 'express';
import { createTrackedClient } from 'aitoken-cli/middleware';
import OpenAI from 'openai';

const app = express();
const trackedOpenAI = createTrackedClient(
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }),
  { provider: 'openai', model: 'gpt-4o', notes: 'API endpoint' }
);

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  const response = await trackedOpenAI.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: message }]
  });

  res.json({ reply: response.choices[0].message.content });
  // ✅ Every request automatically tracked
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Example 11: Next.js API Route

```typescript
// app/api/chat/route.ts
import { TrackedOpenAI } from 'aitoken-cli/extensions';

export async function POST(request: Request) {
  const { message } = await request.json();
  
  const openai = new TrackedOpenAI({ 
    apiKey: process.env.OPENAI_API_KEY! 
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: message }]
  });

  return Response.json({
    reply: response.choices[0].message.content
  });
  // ✅ Automatically tracked
}
```

### Example 12: Chatbot with Multiple Providers

```typescript
import { TrackedOpenAI, TrackedAnthropic } from 'aitoken-cli/extensions';

class AIAssistant {
  private openai: TrackedOpenAI;
  private claude: TrackedAnthropic;

  constructor() {
    // Use SDK extensions for automatic tracking
    this.openai = new TrackedOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY!,
      notes: 'Chatbot'
    });
    this.claude = new TrackedAnthropic({ 
      apiKey: process.env.ANTHROPIC_API_KEY!,
      notes: 'Chatbot'
    });
  }

  async ask(question: string, provider: 'openai' | 'claude' = 'openai') {
    if (provider === 'openai') {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: question }]
      });
      return response.choices[0].message.content;
    } else {
      const response = await this.claude.messages.create({
        model: 'claude-sonnet-4.5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: question }]
      });
      return response.content[0].text;
    }
    // ✅ Both providers automatically tracked
  }
}

// Usage
const assistant = new AIAssistant();
await assistant.ask('What is TypeScript?', 'openai');
await assistant.ask('Explain promises', 'claude');
```

---

## VIEWING YOUR TRACKED DATA

After running any of the above examples, view your usage:

### CLI Commands

```bash
# View all stats
at stats

# Today's usage
at today

# Last 10 OpenAI requests
at list -p openai -l 10

# See all pricing
at models
```

### Programmatic Access

```typescript
import { getStats, getUsage } from 'aitoken-cli';

async function viewStats() {
  // Get overall statistics
  const stats = getStats({ provider: 'openai' });
  console.log('Total cost:', stats.totalCost);
  console.log('Total requests:', stats.totalRequests);
  console.log('Total tokens:', stats.totalTokens);

  // Get recent usage entries
  const recentUsage = getUsage({ limit: 10 });
  console.log('Recent usage:', recentUsage);
}
```

---

## METHOD COMPARISON

| Method | Best For | Setup Effort | Automation | Code Changes |
|--------|----------|--------------|------------|--------------|
| **Wrapper Functions** | Production apps | Medium | 95% | Minimal |
| **Middleware Pattern** | Large codebases | Low | 100% | None |
| **SDK Extensions** | Drop-in replacement | None | 100% | Import only |

**Recommendation:** Start with **Wrapper Functions** (Method 1) for the best balance of simplicity and automation. Use **Middleware** or **SDK Extensions** if you want zero code changes.
