/**
 * LLM Configuration
 * Configure which analyses to run and their settings
 */

export interface LLMConfig {
  // API endpoints
  endpoints: {
    sentiment: string;
    topic: string;
    intent: string;
    nextSteps: string;
    factCheck: string;
    clarity: string;
    coherence: string;
  };
  
  // Default analysis options
  defaultAnalyses: {
    sentiment: boolean;
    topic: boolean;
    intent: boolean;
    nextSteps: boolean;
    factCheck: boolean;
    clarity: boolean;
    coherence: boolean;
  };
  
  // Performance settings
  timeouts: {
    individual: number; // ms for each LLM call
    total: number; // ms for all calls combined
  };
  
  // Retry configuration
  retry: {
    maxAttempts: number;
    delayMs: number;
  };
  
  // Quality thresholds
  thresholds: {
    minConfidence: number;
    maxErrors: number;
  };
}

export const defaultConfig: LLMConfig = {
  endpoints: {
    sentiment: '/api/llm/sentiment',
    topic: '/api/llm/topic',
    intent: '/api/llm/intent',
    nextSteps: '/api/llm/next-steps',
    factCheck: '/api/llm/fact-check',
    clarity: '/api/llm/clarity',
    coherence: '/api/llm/coherence',
  },
  
  defaultAnalyses: {
    sentiment: true,
    topic: true,
    intent: true,
    nextSteps: true,
    factCheck: false, // Disabled by default (can be slow)
    clarity: false,   // Disabled by default
    coherence: true,
  },
  
  timeouts: {
    individual: 10000, // 10 seconds per call
    total: 30000,      // 30 seconds total
  },
  
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
  },
  
  thresholds: {
    minConfidence: 0.6,
    maxErrors: 2,
  },
};

// Environment-specific configurations
export const configs = {
  development: {
    ...defaultConfig,
    timeouts: { individual: 15000, total: 45000 },
  },
  
  production: {
    ...defaultConfig,
    timeouts: { individual: 8000, total: 20000 },
  },
  
  testing: {
    ...defaultConfig,
    defaultAnalyses: {
      sentiment: true,
      topic: true,
      intent: false,
      nextSteps: false,
      factCheck: false,
      clarity: false,
      coherence: false,
    },
    timeouts: { individual: 5000, total: 10000 },
  },
};

export function getConfig(environment?: string): LLMConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  return configs[env as keyof typeof configs] || defaultConfig;
}
