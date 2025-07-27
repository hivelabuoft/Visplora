/**
 * LLM Orchestrator
 * Manages and coordinates multiple LLM calls for sentence analysis
 */

import { analyzeSentiment, SentimentResult } from './sentimentAnalysis';
import { classifyTopic, TopicResult } from './topicClassification';
import { detectIntent, IntentResult } from './intentDetection';
import { suggestNextSteps, NextStepsResult } from './nextStepsSuggestion';
import { checkFacts, FactCheckResult } from './factChecking';
import { assessClarity, ClarityResult } from './clarityAssessment';
import { analyzeCoherence, CoherenceResult } from './narrativeCoherence';

export interface ComprehensiveAnalysis {
  sentence: string;
  timestamp: Date;
  sentiment?: SentimentResult;
  topic?: TopicResult;
  intent?: IntentResult;
  nextSteps?: NextStepsResult;
  factCheck?: FactCheckResult;
  clarity?: ClarityResult;
  coherence?: CoherenceResult;
  errors: string[];
}

export interface AnalysisOptions {
  includeSentiment?: boolean;
  includeTopic?: boolean;
  includeIntent?: boolean;
  includeNextSteps?: boolean;
  includeFactCheck?: boolean;
  includeClarity?: boolean;
  includeCoherence?: boolean;
  targetAudience?: string;
  narrativeGoal?: string;
}

export class LLMOrchestrator {
  /**
   * Analyzes a completed sentence using multiple LLM calls
   */
  static async analyzeSentence(
    sentence: string,
    context: {
      previousSentences?: string[];
      fullNarrative?: string;
    },
    options: AnalysisOptions = {}
  ): Promise<ComprehensiveAnalysis> {
    const analysis: ComprehensiveAnalysis = {
      sentence,
      timestamp: new Date(),
      errors: [],
    };

    // Default to all analyses enabled
    const {
      includeSentiment = true,
      includeTopic = true,
      includeIntent = true,
      includeNextSteps = true,
      includeFactCheck = true,
      includeClarity = true,
      includeCoherence = true,
      targetAudience,
      narrativeGoal,
    } = options;

    // Run analyses in parallel for better performance
    const promises: Promise<void>[] = [];

    // Sentiment Analysis
    if (includeSentiment) {
      promises.push(
        analyzeSentiment(sentence)
          .then(result => { analysis.sentiment = result; })
          .catch(error => analysis.errors.push(`Sentiment: ${error.message}`))
          .then(() => void 0)
      );
    }

    // Topic Classification
    if (includeTopic) {
      promises.push(
        classifyTopic(sentence, context.fullNarrative)
          .then(result => { analysis.topic = result; })
          .catch(error => analysis.errors.push(`Topic: ${error.message}`))
          .then(() => void 0)
      );
    }

    // Intent Detection
    if (includeIntent) {
      promises.push(
        detectIntent(sentence, context.previousSentences)
          .then(result => { analysis.intent = result; })
          .catch(error => analysis.errors.push(`Intent: ${error.message}`))
          .then(() => void 0)
      );
    }

    // Next Steps Suggestion
    if (includeNextSteps) {
      promises.push(
        suggestNextSteps(sentence, context.fullNarrative)
          .then(result => { analysis.nextSteps = result; })
          .catch(error => analysis.errors.push(`Next Steps: ${error.message}`))
          .then(() => void 0)
      );
    }

    // Fact Checking
    if (includeFactCheck) {
      promises.push(
        checkFacts(sentence)
          .then(result => { analysis.factCheck = result; })
          .catch(error => analysis.errors.push(`Fact Check: ${error.message}`))
          .then(() => void 0)
      );
    }

    // Clarity Assessment
    if (includeClarity) {
      promises.push(
        assessClarity(sentence, targetAudience)
          .then(result => { analysis.clarity = result; })
          .catch(error => analysis.errors.push(`Clarity: ${error.message}`))
          .then(() => void 0)
      );
    }

    // Narrative Coherence
    if (includeCoherence && context.previousSentences) {
      promises.push(
        analyzeCoherence(sentence, context.previousSentences, narrativeGoal)
          .then(result => { analysis.coherence = result; })
          .catch(error => analysis.errors.push(`Coherence: ${error.message}`))
          .then(() => void 0)
      );
    }

    // Wait for all analyses to complete
    await Promise.allSettled(promises);

    return analysis;
  }

  /**
   * Quick analysis with only essential LLM calls
   */
  static async quickAnalyze(sentence: string, previousSentences?: string[]): Promise<ComprehensiveAnalysis> {
    return this.analyzeSentence(
      sentence,
      { previousSentences },
      {
        includeSentiment: true,
        includeTopic: true,
        includeIntent: true,
        includeNextSteps: true,
        includeFactCheck: false,
        includeClarity: false,
        includeCoherence: false,
      }
    );
  }

  /**
   * Deep analysis with all LLM calls
   */
  static async deepAnalyze(
    sentence: string, 
    context: { previousSentences?: string[]; fullNarrative?: string; },
    targetAudience?: string,
    narrativeGoal?: string
  ): Promise<ComprehensiveAnalysis> {
    return this.analyzeSentence(sentence, context, {
      includeSentiment: true,
      includeTopic: true,
      includeIntent: true,
      includeNextSteps: true,
      includeFactCheck: true,
      includeClarity: true,
      includeCoherence: true,
      targetAudience,
      narrativeGoal,
    });
  }
}
