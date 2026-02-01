export type Provider = 'openai' | 'anthropic' | 'google' | 'azure' | 'cohere' | 'other';

export interface Usage {
  id?: number;
  provider: Provider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: string;
  notes?: string;
}

export interface ProviderPricing {
  models: {
    [modelName: string]: {
      input: number;  // per 1M tokens
      output: number; // per 1M tokens
    };
  };
}

export interface Stats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byProvider: {
    [key: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
  byModel: {
    [key: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
}
