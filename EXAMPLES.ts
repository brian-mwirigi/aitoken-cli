/**
 * EXAMPLES: Using aitoken-cli Automatic Tracking
 * 
 * This file demonstrates all three methods of automatic tracking:
 * 1. Wrapper Functions
 * 2. Middleware Pattern
 * 3. SDK Extensions
 */

// ==================================================
// METHOD 1: WRAPPER FUNCTIONS (Recommended for most)
// ==================================================

import { trackedGPT, trackedClaude, trackedGemini } from 'aitoken-cli/wrappers';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Example 1: OpenAI wrapper
async function example1_OpenAI() {
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

// Example 2: Anthropic wrapper
async function example2_Claude() {
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

// Example 3: Google Gemini wrapper
async function example3_Gemini() {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

  const response = await trackedGemini(genAI, {
    model: 'gemini-1.5-pro',
    prompt: 'What are the benefits of using TypeScript?'
  });

  console.log(response.response.text());
  // ✅ Automatically tracked
}

// ==================================================
// METHOD 2: MIDDLEWARE PATTERN (Best for large codebases)
// ==================================================

import { createTrackedClient } from 'aitoken-cli/middleware';

// Example 4: Proxy that tracks everything
async function example4_Middleware() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // Wrap the entire client
  const trackedOpenAI = createTrackedClient(openai, {
    provider: 'openai',
    model: 'gpt-4o',
    notes: 'Production API'
  });

  // Use it exactly like normal OpenAI - tracking is automatic
  const response = await trackedOpenAI.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }]
  });

  console.log(response.choices[0].message.content);
  // ✅ Automatically tracked - no changes to existing code!
}

// Example 5: Higher-order function wrapper
import { withTracking } from 'aitoken-cli/middleware';

async function example5_HigherOrder() {
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

// Example 6: Batch tracking for parallel requests
import { BatchTracker } from 'aitoken-cli/middleware';

async function example6_BatchTracking() {
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

// ==================================================
// METHOD 3: SDK EXTENSIONS (Drop-in replacements)
// ==================================================

import { TrackedOpenAI, TrackedAnthropic, TrackedGoogleAI } from 'aitoken-cli/extensions';

// Example 7: TrackedOpenAI (drop-in replacement)
async function example7_TrackedSDK() {
  // Just change the import - everything else stays the same
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

// Example 8: TrackedAnthropic
async function example8_TrackedClaude() {
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

// Example 9: TrackedGoogleAI
async function example9_TrackedGemini() {
  const genAI = new TrackedGoogleAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const response = await model.generateContent('What is async programming?');
  console.log(response.response.text());
  // ✅ Automatically tracked
}

// ==================================================
// REAL-WORLD EXAMPLES
// ==================================================

// Example 10: Express.js middleware
import express from 'express';

const app = express();
const trackedOpenAI = createTrackedClient(
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }),
  { provider: 'openai', model: 'gpt-4o', notes: 'API endpoint' }
);

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  const response = await trackedOpenAI.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: message }]
  });

  res.json({ reply: response.choices[0].message.content });
  // ✅ Every request automatically tracked
});

// Example 11: Next.js API route
export async function POST(request: Request) {
  const { message } = await request.json();
  const openai = new TrackedOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: message }]
  });

  return Response.json({
    reply: response.choices[0].message.content
  });
  // ✅ Automatically tracked
}

// Example 12: Chatbot with multiple providers
class AIAssistant {
  private openai: any;
  private claude: any;

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

// ==================================================
// VIEWING YOUR TRACKED DATA
// ==================================================

// After running any of the above examples, view your usage:

// CLI commands:
// $ at stats                    # View all stats
// $ at today                    # Today's usage
// $ at list -p openai -l 10    # Last 10 OpenAI requests
// $ at models                   # See all pricing

// Programmatic access:
import { getStats, getUsage } from 'aitoken-cli';

async function viewStats() {
  const stats = getStats({ provider: 'openai' });
  console.log('Total cost:', stats.totalCost);
  console.log('Total requests:', stats.totalRequests);
  console.log('Total tokens:', stats.totalTokens);

  const recentUsage = getUsage({ limit: 10 });
  console.log('Recent usage:', recentUsage);
}
