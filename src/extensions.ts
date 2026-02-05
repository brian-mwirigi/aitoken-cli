/**
 * SDK Extensions - Method 3 for Automatic Tracking
 * Drop-in replacement classes that extend official SDKs with automatic tracking.
 */

import { addUsage } from './db';
import { calculateCost } from './pricing';

/**
 * TrackedOpenAI - Drop-in replacement for OpenAI SDK
 * Extends the official OpenAI client with automatic token tracking
 * 
 * @example
 * ```typescript
 * import { TrackedOpenAI } from 'aitoken-cli/extensions';
 * 
 * // Use exactly like the official SDK
 * const openai = new TrackedOpenAI({
 *   apiKey: process.env.OPENAI_API_KEY
 * });
 * 
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * // Automatically tracked!
 * ```
 */
export class TrackedOpenAI {
  private client: any;
  private notes?: string;

  constructor(config: { apiKey: string; notes?: string; [key: string]: any }) {
    // Dynamically import OpenAI to avoid requiring it as a dependency
    try {
      const OpenAI = require('openai');
      this.client = new OpenAI(config);
      this.notes = config.notes;
    } catch (error) {
      throw new Error(
        'OpenAI SDK not installed. Run: npm install openai\n' +
        'TrackedOpenAI is a wrapper that requires the official OpenAI SDK.'
      );
    }

    // Proxy the chat.completions API
    this.chat = {
      completions: {
        create: this.createChatCompletion.bind(this),
      },
    };
  }

  chat: {
    completions: {
      create: (params: any) => Promise<any>;
    };
  };

  private async createChatCompletion(params: any): Promise<any> {
    const response = await this.client.chat.completions.create(params);

    const { prompt_tokens, completion_tokens, total_tokens } = response.usage;

    const cost = calculateCost('openai', params.model, prompt_tokens, completion_tokens);

    addUsage({
      provider: 'openai',
      model: params.model,
      promptTokens: prompt_tokens,
      completionTokens: completion_tokens,
      totalTokens: total_tokens,
      cost,
      timestamp: new Date().toISOString(),
      notes: this.notes,
    });

    return response;
  }

  // Pass through other methods to the underlying client
  get completions() {
    return this.client.completions;
  }

  get embeddings() {
    return this.client.embeddings;
  }

  get images() {
    return this.client.images;
  }

  get models() {
    return this.client.models;
  }

  get files() {
    return this.client.files;
  }

  get fineTuning() {
    return this.client.fineTuning;
  }
}

/**
 * TrackedAnthropic - Drop-in replacement for Anthropic SDK
 * Extends the official Anthropic client with automatic token tracking
 * 
 * @example
 * ```typescript
 * import { TrackedAnthropic } from 'aitoken-cli/extensions';
 * 
 * const anthropic = new TrackedAnthropic({
 *   apiKey: process.env.ANTHROPIC_API_KEY
 * });
 * 
 * const response = await anthropic.messages.create({
 *   model: 'claude-sonnet-4.5',
 *   max_tokens: 1024,
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * // Automatically tracked!
 * ```
 */
export class TrackedAnthropic {
  private client: any;
  private notes?: string;

  constructor(config: { apiKey: string; notes?: string; [key: string]: any }) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      this.client = new Anthropic(config);
      this.notes = config.notes;
    } catch (error) {
      throw new Error(
        'Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk\n' +
        'TrackedAnthropic is a wrapper that requires the official Anthropic SDK.'
      );
    }

    this.messages = {
      create: this.createMessage.bind(this),
    };
  }

  messages: {
    create: (params: any) => Promise<any>;
  };

  private async createMessage(params: any): Promise<any> {
    const response = await this.client.messages.create(params);

    const { input_tokens, output_tokens } = response.usage;

    const cost = calculateCost('anthropic', params.model, input_tokens, output_tokens);

    addUsage({
      provider: 'anthropic',
      model: params.model,
      promptTokens: input_tokens,
      completionTokens: output_tokens,
      totalTokens: input_tokens + output_tokens,
      cost,
      timestamp: new Date().toISOString(),
      notes: this.notes,
    });

    return response;
  }

  // Pass through other methods
  get completions() {
    return this.client.completions;
  }
}

/**
 * TrackedGoogleAI - Drop-in replacement for Google Generative AI SDK
 * 
 * @example
 * ```typescript
 * import { TrackedGoogleAI } from 'aitoken-cli/extensions';
 * 
 * const genAI = new TrackedGoogleAI(process.env.GOOGLE_API_KEY);
 * const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
 * 
 * const response = await model.generateContent('Hello!');
 * // Automatically tracked!
 * ```
 */
export class TrackedGoogleAI {
  private client: any;
  private notes?: string;

  constructor(apiKey: string, notes?: string) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      this.client = new GoogleGenerativeAI(apiKey);
      this.notes = notes;
    } catch (error) {
      throw new Error(
        'Google Generative AI SDK not installed. Run: npm install @google/generative-ai\n' +
        'TrackedGoogleAI is a wrapper that requires the official Google SDK.'
      );
    }
  }

  getGenerativeModel(config: { model: string }): any {
    const model = this.client.getGenerativeModel(config);

    // Wrap the generateContent method
    const originalGenerate = model.generateContent.bind(model);
    model.generateContent = async (prompt: string) => {
      const response = await originalGenerate(prompt);

      const usageMetadata = response.response?.usageMetadata;
      const promptTokens = usageMetadata?.promptTokenCount || 0;
      const completionTokens = usageMetadata?.candidatesTokenCount || 0;

      const cost = calculateCost('google', config.model, promptTokens, completionTokens);

      addUsage({
        provider: 'google',
        model: config.model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        cost,
        timestamp: new Date().toISOString(),
        notes: this.notes,
      });

      return response;
    };

    return model;
  }
}

/**
 * Factory function to create tracked clients for any provider
 * 
 * @example
 * ```typescript
 * const trackedOpenAI = createTrackedClient('openai', { apiKey: process.env.OPENAI_API_KEY });
 * const trackedClaude = createTrackedClient('anthropic', { apiKey: process.env.ANTHROPIC_API_KEY });
 * ```
 */
export function createTrackedClient(
  provider: 'openai' | 'anthropic' | 'google',
  config: any
): any {
  switch (provider) {
    case 'openai':
      return new TrackedOpenAI(config);
    case 'anthropic':
      return new TrackedAnthropic(config);
    case 'google':
      return new TrackedGoogleAI(config.apiKey, config.notes);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
