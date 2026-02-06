/**
 * Wrapper Functions - Method 1 for Automatic Tracking
 * Write once, track forever. Wraps AI API calls with automatic token tracking.
 */

import { addUsage } from './db';
import { calculateCost } from './pricing';
import { Provider } from './types';

/**
 * Wraps an OpenAI streaming response to track usage from the final chunk.
 * OpenAI includes usage data in the last chunk when stream_options.include_usage is true.
 */
async function* trackOpenAIStream(
  stream: any,
  model: string,
  notes?: string
): AsyncGenerator<any> {
  let lastUsage: any = null;

  for await (const chunk of stream) {
    if (chunk.usage) {
      lastUsage = chunk.usage;
    }
    yield chunk;
  }

  if (lastUsage) {
    try {
      const promptTokens = lastUsage.prompt_tokens || 0;
      const completionTokens = lastUsage.completion_tokens || 0;
      const cost = calculateCost('openai', model, promptTokens, completionTokens);

      addUsage({
        provider: 'openai',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        cost,
        timestamp: new Date().toISOString(),
        notes,
      });
    } catch (e) {
      console.warn('[aitoken-cli] Failed to track streaming usage:', (e as Error).message);
    }
  }
}

/**
 * Wraps an Anthropic streaming response to track usage from stream events.
 * Anthropic sends input_tokens in message_start and output_tokens in message_delta.
 */
async function* trackAnthropicStream(
  stream: any,
  model: string,
  notes?: string
): AsyncGenerator<any> {
  let inputTokens = 0;
  let outputTokens = 0;

  for await (const event of stream) {
    if (event.type === 'message_start' && event.message?.usage) {
      inputTokens = event.message.usage.input_tokens || 0;
    }
    if (event.type === 'message_delta' && event.usage) {
      outputTokens = event.usage.output_tokens || 0;
    }
    yield event;
  }

  if (inputTokens > 0 || outputTokens > 0) {
    try {
      const cost = calculateCost('anthropic', model, inputTokens, outputTokens);

      addUsage({
        provider: 'anthropic',
        model,
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost,
        timestamp: new Date().toISOString(),
        notes,
      });
    } catch (e) {
      console.warn('[aitoken-cli] Failed to track streaming usage:', (e as Error).message);
    }
  }
}

/**
 * Wrapper for OpenAI Chat Completions API
 * Automatically tracks tokens for every GPT call
 * 
 * @example
 * ```typescript
 * import { trackedGPT } from 'aitoken-cli/wrappers';
 * 
 * const response = await trackedGPT(openai, {
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export async function trackedGPT(
  openai: any,
  params: {
    model: string;
    messages: any[];
    stream?: boolean;
    stream_options?: any;
    [key: string]: any;
  },
  notes?: string
): Promise<any> {
  // Handle streaming requests
  if (params.stream) {
    const streamParams = {
      ...params,
      stream_options: { ...params.stream_options, include_usage: true },
    };
    const stream = await openai.chat.completions.create(streamParams);
    return trackOpenAIStream(stream, params.model, notes);
  }

  const response = await openai.chat.completions.create(params);

  try {
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
      notes,
    });
  } catch (e) {
    console.warn('[aitoken-cli] Failed to track usage:', (e as Error).message);
  }

  return response;
}

/**
 * Wrapper for Anthropic Messages API
 * Automatically tracks tokens for every Claude call
 * 
 * @example
 * ```typescript
 * import { trackedClaude } from 'aitoken-cli/wrappers';
 * 
 * const response = await trackedClaude(anthropic, {
 *   model: 'claude-sonnet-4.5',
 *   max_tokens: 1024,
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export async function trackedClaude(
  anthropic: any,
  params: {
    model: string;
    max_tokens: number;
    messages: any[];
    stream?: boolean;
    [key: string]: any;
  },
  notes?: string
): Promise<any> {
  // Handle streaming requests
  if (params.stream) {
    const stream = await anthropic.messages.create(params);
    return trackAnthropicStream(stream, params.model, notes);
  }

  const response = await anthropic.messages.create(params);

  try {
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
      notes,
    });
  } catch (e) {
    console.warn('[aitoken-cli] Failed to track usage:', (e as Error).message);
  }

  return response;
}

/**
 * Wrapper for Google Generative AI API
 * Automatically tracks tokens for every Gemini call
 * 
 * @example
 * ```typescript
 * import { trackedGemini } from 'aitoken-cli/wrappers';
 * 
 * const response = await trackedGemini(genAI, {
 *   model: 'gemini-1.5-pro',
 *   prompt: 'Hello!'
 * });
 * ```
 */
export async function trackedGemini(
  genAI: any,
  params: {
    model: string;
    prompt: string;
    [key: string]: any;
  },
  notes?: string
): Promise<any> {
  const model = genAI.getGenerativeModel({ model: params.model });
  const response = await model.generateContent(params.prompt);

  // Google's API returns usage metadata differently
  const usageMetadata = response.response?.usageMetadata;
  const promptTokens = usageMetadata?.promptTokenCount || 0;
  const completionTokens = usageMetadata?.candidatesTokenCount || 0;

  try {
    const cost = calculateCost('google', params.model, promptTokens, completionTokens);

    addUsage({
      provider: 'google',
      model: params.model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost,
      timestamp: new Date().toISOString(),
      notes,
    });
  } catch (e) {
    console.warn('[aitoken-cli] Failed to track usage:', (e as Error).message);
  }

  return response;
}

/**
 * Generic wrapper for any AI provider
 * Use this for custom providers or unsupported APIs
 * 
 * @example
 * ```typescript
 * const response = await trackedAI('cohere', 'command-r', async () => {
 *   return await cohere.generate({ prompt: 'Hello' });
 * }, (res) => ({
 *   promptTokens: res.meta.tokens.input_tokens,
 *   completionTokens: res.meta.tokens.output_tokens
 * }));
 * ```
 */
export async function trackedAI<T>(
  provider: Provider,
  model: string,
  apiCall: () => Promise<T>,
  extractTokens: (response: T) => { promptTokens: number; completionTokens: number },
  notes?: string
): Promise<T> {
  const response = await apiCall();

  try {
    const { promptTokens, completionTokens } = extractTokens(response);
    const cost = calculateCost(provider, model, promptTokens, completionTokens);

    addUsage({
      provider,
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost,
      timestamp: new Date().toISOString(),
      notes,
    });
  } catch (e) {
    console.warn('[aitoken-cli] Failed to track usage:', (e as Error).message);
  }

  return response;
}
