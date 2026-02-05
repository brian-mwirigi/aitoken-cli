/**
 * Wrapper Functions - Method 1 for Automatic Tracking
 * Write once, track forever. Wraps AI API calls with automatic token tracking.
 */

import { addUsage } from './db';
import { calculateCost } from './pricing';
import { Provider } from './types';

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
    [key: string]: any;
  },
  notes?: string
): Promise<any> {
  const response = await openai.chat.completions.create(params);

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
    [key: string]: any;
  },
  notes?: string
): Promise<any> {
  const response = await anthropic.messages.create(params);

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

  return response;
}
