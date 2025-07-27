/**
 * LLM Calls Index
 * Exports all LLM analysis functions and types
 */

// Individual LLM Functions
export { analyzeSentiment, type SentimentResult } from './sentimentAnalysis';
export { classifyTopic, type TopicResult } from './topicClassification';
export { detectIntent, type IntentResult } from './intentDetection';
export { suggestNextSteps, type NextStepsResult } from './nextStepsSuggestion';
export { checkFacts, type FactCheckResult } from './factChecking';
export { assessClarity, type ClarityResult } from './clarityAssessment';
export { analyzeCoherence, type CoherenceResult } from './narrativeCoherence';

// Orchestrator
export { 
  LLMOrchestrator, 
  type ComprehensiveAnalysis, 
  type AnalysisOptions 
} from './orchestrator';

// Example usage:
// import { LLMOrchestrator } from '@/app/LLMs';
// const analysis = await LLMOrchestrator.quickAnalyze(sentence);
