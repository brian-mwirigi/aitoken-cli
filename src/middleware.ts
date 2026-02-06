/**
 * Middleware Pattern - Method 2 for Automatic Tracking
 * Creates a proxy that automatically tracks all API calls without modifying existing code.
 */

import { addUsage } from './db';
import { calculateCost } from './pricing';
import { Provider } from './types';

interface ClientConfig {
  provider: Provider;
  model: string;
  notes?: string;
}

/**
 * Creates a tracked client proxy that automatically logs all API calls
 * Works with any AI SDK by intercepting method calls
 * 
 * @example
 * ```typescript
 * import { createTrackedClient } from 'aitoken-cli/middleware';
 * import OpenAI from 'openai';
 * 
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const trackedOpenAI = createTrackedClient(openai, {
 *   provider: 'openai',
 *   model: 'gpt-4o'
 * });
 * 
 * // Use normally - tracking happens automatically
 * const response = await trackedOpenAI.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export function createTrackedClient<T extends object>(
  client: T,
  config: ClientConfig
): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);

      // If it's a nested object (like openai.chat), proxy that too
      if (typeof original === 'object' && original !== null) {
        return createTrackedClient(original, config);
      }

      // If it's a method, wrap it with tracking
      if (typeof original === 'function') {
        return new Proxy(original, {
          async apply(fn, thisArg, args) {
            const response = await Reflect.apply(fn, thisArg, args);

            // Try to extract usage from response
            if (response && typeof response === 'object') {
              trackResponse(response, config);
            }

            return response;
          },
        });
      }

      return original;
    },
  });
}

/**
 * Extract usage data from API response and track it
 */
function trackResponse(response: any, config: ClientConfig): void {
  try {
    let promptTokens = 0;
    let completionTokens = 0;
    let model = config.model;

    // OpenAI format
    if (response.usage?.prompt_tokens) {
      promptTokens = response.usage.prompt_tokens;
      completionTokens = response.usage.completion_tokens;
      model = response.model || config.model;
    }
    // Anthropic format
    else if (response.usage?.input_tokens) {
      promptTokens = response.usage.input_tokens;
      completionTokens = response.usage.output_tokens;
      model = response.model || config.model;
    }
    // Google format
    else if (response.response?.usageMetadata) {
      promptTokens = response.response.usageMetadata.promptTokenCount || 0;
      completionTokens = response.response.usageMetadata.candidatesTokenCount || 0;
    }
    // Unknown format - don't track
    else {
      return;
    }

    const cost = calculateCost(config.provider, model, promptTokens, completionTokens);

    addUsage({
      provider: config.provider,
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost,
      timestamp: new Date().toISOString(),
      notes: config.notes,
    });
  } catch (e) {
    console.warn('[aitoken-cli] Failed to track usage:', (e as Error).message);
  }
}

/**
 * Higher-order function that wraps any async AI function with automatic tracking
 * 
 * @example
 * ```typescript
 * const trackedGenerate = withTracking(
 *   async (prompt: string) => openai.chat.completions.create({ ... }),
 *   { provider: 'openai', model: 'gpt-4o' }
 * );
 * 
 * const response = await trackedGenerate('Hello!');
 * // Automatically tracked!
 * ```
 */
export function withTracking<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: ClientConfig
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const response = await fn(...args);

    if (response && typeof response === 'object') {
      trackResponse(response, config);
    }

    return response;
  };
}

/**
 * Batch tracking for multiple API calls
 * Useful for parallel requests or streaming responses
 * 
 * @example
 * ```typescript
 * const tracker = new BatchTracker('openai', 'gpt-4o');
 * 
 * const responses = await Promise.all([
 *   tracker.track(() => openai.chat.completions.create({ ... })),
 *   tracker.track(() => openai.chat.completions.create({ ... })),
 *   tracker.track(() => openai.chat.completions.create({ ... }))
 * ]);
 * 
 * tracker.flush(); // Optionally flush all tracking
 * ```
 */
export class BatchTracker {
  private provider: Provider;
  private model: string;
  private notes?: string;

  constructor(provider: Provider, model: string, notes?: string) {
    this.provider = provider;
    this.model = model;
    this.notes = notes;
  }

  async track<T>(fn: () => Promise<T>): Promise<T> {
    const response = await fn();

    if (response && typeof response === 'object') {
      trackResponse(response, {
        provider: this.provider,
        model: this.model,
        notes: this.notes,
      });
    }

    return response;
  }

  flush(): void {
    // Additional cleanup if needed
  }
}
