import { ProviderPricing } from './types';

export const pricing: Record<string, ProviderPricing> = {
  openai: {
    models: {
      // GPT-5 Series (2026)
      'gpt-5.2': { input: 1.75, output: 14.0 },
      'gpt-5.2-pro': { input: 21.0, output: 168.0 },
      'gpt-5-mini': { input: 0.25, output: 2.0 },
      // GPT-4.1 Series (2026)
      'gpt-4.1': { input: 3.0, output: 12.0 },
      'gpt-4.1-mini': { input: 0.80, output: 3.20 },
      'gpt-4.1-nano': { input: 0.20, output: 0.80 },
      // o4 Series (2026)
      'o4-mini': { input: 4.0, output: 16.0 },
      // Legacy GPT-4 Series (still available)
      'gpt-4': { input: 30.0, output: 60.0 },
      'gpt-4-32k': { input: 60.0, output: 120.0 },
      'gpt-4-turbo': { input: 10.0, output: 30.0 },
      'gpt-4o': { input: 5.0, output: 15.0 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
      'gpt-3.5-turbo-16k': { input: 3.0, output: 4.0 },
      'o1-preview': { input: 15.0, output: 60.0 },
      'o1-mini': { input: 3.0, output: 12.0 },
    },
  },
  anthropic: {
    models: {
      // Claude 4.5 Series (2026) - Current
      'claude-sonnet-4-5': { input: 3.0, output: 15.0 },
      'claude-sonnet-4.5': { input: 3.0, output: 15.0 },
      'claude-haiku-4-5': { input: 1.0, output: 5.0 },
      'claude-haiku-4.5': { input: 1.0, output: 5.0 },
      'claude-opus-4-5': { input: 5.0, output: 25.0 },
      'claude-opus-4.5': { input: 5.0, output: 25.0 },
      // Claude 3 Series (Legacy but still available)
      'claude-3-opus': { input: 15.0, output: 75.0 },
      'claude-3-sonnet': { input: 3.0, output: 15.0 },
      'claude-3-haiku': { input: 0.25, output: 1.25 },
      'claude-3.5-sonnet': { input: 3.0, output: 15.0 },
      'claude-3.5-haiku': { input: 1.0, output: 5.0 },
      'claude-2.1': { input: 8.0, output: 24.0 },
      'claude-2.0': { input: 8.0, output: 24.0 },
      'claude-instant': { input: 0.80, output: 2.40 },
    },
  },
  google: {
    models: {
      'gemini-1.5-pro': { input: 3.50, output: 10.50 },
      'gemini-1.5-flash': { input: 0.075, output: 0.30 },
      'gemini-1.0-pro': { input: 0.50, output: 1.50 },
      'gemini-pro': { input: 0.50, output: 1.50 },
      'gemini-pro-vision': { input: 0.25, output: 0.50 },
    },
  },
  azure: {
    models: {
      'gpt-4': { input: 30.0, output: 60.0 },
      'gpt-4-32k': { input: 60.0, output: 120.0 },
      'gpt-35-turbo': { input: 0.50, output: 1.50 },
    },
  },
  cohere: {
    models: {
      'command': { input: 1.0, output: 2.0 },
      'command-light': { input: 0.30, output: 0.60 },
      'command-r': { input: 0.50, output: 1.50 },
      'command-r-plus': { input: 3.0, output: 15.0 },
    },
  },
};

export function calculateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const providerPricing = pricing[provider.toLowerCase()];
  if (!providerPricing) {
    if (promptTokens > 0 || completionTokens > 0) {
      console.warn(`[aitoken-cli] Unknown provider "${provider}" - cost recorded as $0.00`);
    }
    return 0;
  }

  const modelPricing = providerPricing.models[model.toLowerCase()];
  if (!modelPricing) {
    // Try to find a partial match
    const matchedModel = Object.keys(providerPricing.models).find((m) =>
      model.toLowerCase().includes(m)
    );
    if (matchedModel) {
      const p = providerPricing.models[matchedModel];
      return (promptTokens / 1_000_000) * p.input + (completionTokens / 1_000_000) * p.output;
    }
    if (promptTokens > 0 || completionTokens > 0) {
      console.warn(`[aitoken-cli] Unknown model "${model}" for provider "${provider}" - cost recorded as $0.00`);
    }
    return 0;
  }

  return (
    (promptTokens / 1_000_000) * modelPricing.input +
    (completionTokens / 1_000_000) * modelPricing.output
  );
}
