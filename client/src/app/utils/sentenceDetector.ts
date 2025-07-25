/**
 * Utility function to detect when a sentence ends based on multiple heuristics
 */

interface SentenceEndResult {
  isSentenceEnd: boolean;
  reason: string;
  confidence: number; // 0-1 scale
}

/**
 * Normalize contractions to handle both apostrophe and non-apostrophe versions
 */
function normalizeContractions(text: string): string {
  return text
    // Handle common contractions with and without apostrophes
    .replace(/\b(isn['']?t|isnt)\b/gi, 'is not')
    .replace(/\b(aren['']?t|arent)\b/gi, 'are not')
    .replace(/\b(wasn['']?t|wasnt)\b/gi, 'was not')
    .replace(/\b(weren['']?t|werent)\b/gi, 'were not')
    .replace(/\b(haven['']?t|havent)\b/gi, 'have not')
    .replace(/\b(hasn['']?t|hasnt)\b/gi, 'has not')
    .replace(/\b(hadn['']?t|hadnt)\b/gi, 'had not')
    .replace(/\b(don['']?t|dont)\b/gi, 'do not')
    .replace(/\b(doesn['']?t|doesnt)\b/gi, 'does not')
    .replace(/\b(didn['']?t|didnt)\b/gi, 'did not')
    .replace(/\b(can['']?t|cant)\b/gi, 'can not')
    .replace(/\b(couldn['']?t|couldnt)\b/gi, 'could not')
    .replace(/\b(shouldn['']?t|shouldnt)\b/gi, 'should not')
    .replace(/\b(wouldn['']?t|wouldnt)\b/gi, 'would not')
    .replace(/\b(won['']?t|wont)\b/gi, 'will not')
    .replace(/\b(mustn['']?t|mustnt)\b/gi, 'must not')
    .replace(/\b(I['']?m|Im)\b/gi, 'I am')
    .replace(/\b(you['']?re|youre)\b/gi, 'you are')
    .replace(/\b(he['']?s|hes)\b/gi, 'he is')
    .replace(/\b(she['']?s|shes)\b/gi, 'she is')
    .replace(/\b(it['']?s|its)\b/gi, 'it is')
    .replace(/\b(we['']?re|were)\b/gi, 'we are')
    .replace(/\b(they['']?re|theyre)\b/gi, 'they are')
    .replace(/\b(I['']?ve|Ive)\b/gi, 'I have')
    .replace(/\b(you['']?ve|youve)\b/gi, 'you have')
    .replace(/\b(we['']?ve|weve)\b/gi, 'we have')
    .replace(/\b(they['']?ve|theyve)\b/gi, 'they have')
    .replace(/\b(I['']?ll|Ill)\b/gi, 'I will')
    .replace(/\b(you['']?ll|youll)\b/gi, 'you will')
    .replace(/\b(he['']?ll|hell)\b/gi, 'he will')
    .replace(/\b(she['']?ll|shell)\b/gi, 'she will')
    .replace(/\b(it['']?ll|itll)\b/gi, 'it will')
    .replace(/\b(we['']?ll|well)\b/gi, 'we will')
    .replace(/\b(they['']?ll|theyll)\b/gi, 'they will')
    .replace(/\b(I['']?d|Id)\b/gi, 'I would')
    .replace(/\b(you['']?d|youd)\b/gi, 'you would')
    .replace(/\b(he['']?d|hed)\b/gi, 'he would')
    .replace(/\b(she['']?d|shed)\b/gi, 'she would')
    .replace(/\b(it['']?d|itd)\b/gi, 'it would')
    .replace(/\b(we['']?d|wed)\b/gi, 'we would')
    .replace(/\b(they['']?d|theyd)\b/gi, 'they would');
}

export function detectSentenceEnd(text: string): SentenceEndResult {
  const trimmed = text.trim();
  
  // Empty text check
  if (!trimmed) {
    return { isSentenceEnd: false, reason: 'empty', confidence: 0 };
  }

  // Normalize contractions for better detection
  const normalizedText = normalizeContractions(trimmed);

  // 1. Ends with sentence punctuation
  if (/[.!?]$/.test(trimmed)) {
    return { isSentenceEnd: true, reason: 'punctuation', confidence: 0.95 };
  }

  // 2. Ends with a long pause indicator (newline)
  if (/\n\s*$/.test(text)) {
    return { isSentenceEnd: true, reason: 'newline_pause', confidence: 0.8 };
  }

  // 3. Check for complete thoughts based on word count and grammar
  const lastClause = normalizedText.split(/[.!?\n]/).pop()?.trim() ?? '';
  const wordCount = lastClause.split(/\s+/).filter(Boolean).length;

  // Basic auxiliary verbs and common verbs that indicate complete thoughts (simplified since contractions are normalized)
  const auxiliaryVerbs = /\b(am|is|are|was|were|have|had|has|do|did|does|can|could|should|would|will|shall|must|may|might|not)\b/i;
  const actionVerbs = /\b(think|believe|see|know|feel|want|need|like|love|hate|go|come|make|take|give|get|put|say|tell|ask|find|work|play|run|walk|talk|speak|write|read|eat|drink|sleep|live|die|buy|sell|learn|teach|help|try|use|look|watch|listen|hear|understand|remember|forget|start|stop|finish|continue|change|move|stay|leave|arrive|return|meet|visit|call|send|receive|open|close|turn|cut|break|build|create|destroy|save|lose|win|fail|succeed|grow|shrink|increase|decrease|improve|worsen|work|worked|wait|pause|surprise|surprised|happen|happened|hope|hoped|hoping|wish|wished|wishing|expect|expected|expecting)\b/i;
  
  // Check for subject-verb-object patterns
  const hasSubject = /\b(I|you|he|she|it|we|they|this|that|these|those|[A-Z][a-z]+)\b/.test(lastClause);
  const hasVerb = auxiliaryVerbs.test(lastClause) || actionVerbs.test(lastClause);

  // Check for emotional expressions and reactions
  const emotionalExpressions = /\b(wow|oh|ah|hey|wait|whoa|damn|gosh|geez|yay|hooray|amazing|incredible|surprised|shocked|confused|excited|happy|sad|angry|frustrated|relieved|worried|scared|curious|interested|interesting|bored|tired|energized|motivated|disappointed|satisfied|pleased|annoyed|impressed|grateful|thankful|sorry|apologize|congrats|congratulations|hoping|expected|unexpected|exactly|perfect|terrible|awful|great|fantastic|wonderful|horrible)\b/i;
  const hasEmotion = emotionalExpressions.test(lastClause);

  // Check for negative expressions and disappointment (simplified since contractions are normalized)
  const negativeExpressions = /\b(not|never|nothing|nobody|nowhere|neither|nor|hardly|barely|scarcely|seldom|rarely|unfortunately|sadly|disappointing|disappointed|frustrating|frustrated|annoying|annoyed|terrible|awful|horrible|bad|worse|worst|wrong|incorrect|false|untrue|impossible|difficult|hard|tough|challenging|problematic|troublesome|concerning|worrying|alarming|disturbing)\b/i;
  const hasNegative = negativeExpressions.test(lastClause);

  // Check for expectation/comparison expressions
  const expectationExpressions = /\b(exactly|precisely|specifically|particularly|especially|really|truly|actually|literally|definitely|certainly|absolutely|completely|totally|entirely|fully|quite|rather|pretty|very|extremely|incredibly|amazingly|surprisingly|obviously|clearly|apparently|supposedly|presumably|hopefully|expected|expecting|hoping|wishing|wanting|needing|looking|seeking|trying|attempting)\b/i;
  const hasExpectation = expectationExpressions.test(lastClause);

  // Check for complete narrative patterns (storytelling, observations)
  const narrativePatterns = /\b(then|so|but|however|meanwhile|suddenly|finally|first|next|after|before|when|while|during|since|until|because|although|though|if|unless|even|just|now|today|yesterday|tomorrow|recently|lately|often|sometimes|always|never|usually|typically|generally|specifically|actually|really|probably|maybe|perhaps|definitely|certainly|obviously|clearly|apparently|supposedly|reportedly|according|based|depending)\b/i;
  
  // Lower thresholds for complete thoughts with good grammar
  if (wordCount >= 8 && hasSubject && hasVerb) {
    return { isSentenceEnd: true, reason: 'complete_thought', confidence: 0.75 };
  }

  // Medium-length sentences with emotional content
  if (wordCount >= 6 && hasEmotion && hasVerb) {
    return { isSentenceEnd: true, reason: 'emotional_expression', confidence: 0.7 };
  }

  // Negative expressions or disappointment (common complete thoughts)
  if (wordCount >= 6 && hasNegative && (hasSubject || hasVerb)) {
    return { isSentenceEnd: true, reason: 'negative_expression', confidence: 0.72 };
  }

  // Expectation/comparison statements
  if (wordCount >= 7 && hasExpectation && hasVerb) {
    return { isSentenceEnd: true, reason: 'expectation_statement', confidence: 0.7 };
  }

  // Narrative or observational statements
  if (wordCount >= 7 && narrativePatterns.test(lastClause) && hasVerb) {
    return { isSentenceEnd: true, reason: 'narrative_statement', confidence: 0.68 };
  }

  // Very long sentence with complete grammar structure (original logic)
  if (wordCount > 20 && hasSubject && hasVerb) {
    return { isSentenceEnd: true, reason: 'long_complete_thought', confidence: 0.7 };
  }

  // 4. Check for question patterns without punctuation
  if (/^(what|where|when|why|how|who|which|whose|can|could|should|would|will|do|does|did|is|are|was|were)\b/i.test(lastClause) && wordCount > 3) {
    return { isSentenceEnd: true, reason: 'question_pattern', confidence: 0.75 };
  }

  // 5. Check for imperative sentences (commands)
  const imperativeStarters = /^(please|let|try|make|take|go|come|stop|start|help|give|show|tell|explain|describe|think|consider|remember|forget|look|see|listen|hear|wait|hold|keep|put|get|find|bring|send|call|write|read|open|close|turn|move|walk|run|sit|stand|lie|sleep|wake|eat|drink|buy|sell|learn|teach)\b/i;
  if (imperativeStarters.test(lastClause) && wordCount > 2) {
    return { isSentenceEnd: true, reason: 'imperative', confidence: 0.65 };
  }

  // 6. Check for common sentence endings without punctuation
  const commonEndings = /\b(now|then|today|tomorrow|yesterday|here|there|everywhere|nowhere|always|never|sometimes|often|usually|finally|actually|really|probably|maybe|perhaps|certainly|definitely|absolutely|completely|totally|exactly|specifically|generally|basically|essentially|obviously|clearly|unfortunately|fortunately|hopefully|surprisingly|interestingly|importantly|significantly|ultimately|eventually|immediately|suddenly|quickly|slowly|carefully|easily|hardly|barely|almost|nearly|quite|very|extremely|incredibly|amazingly|perfectly|terribly|seriously|honestly|frankly|personally|obviously|apparently|presumably|supposedly|allegedly|reportedly|theoretically|practically|technically|literally|figuratively|metaphorically|symbolically|ironically|surprisingly|unfortunately|fortunately|hopefully|sadly|happily|angrily|excitedly|nervously|calmly|quietly|loudly|softly|gently|roughly|smoothly|sharply|deeply|highly|widely|closely|directly|indirectly|similarly|differently|equally|unequally|fairly|unfairly|justly|unjustly|rightly|wrongly|correctly|incorrectly|accurately|inaccurately|precisely|imprecisely|exactly|approximately|roughly|broadly|narrowly|specifically|generally|particularly|especially|mainly|mostly|largely|partly|partially|completely|totally|entirely|fully|half|quarter|double|triple|first|second|third|last|final|initial|original|current|recent|future|past|present|modern|ancient|old|new|young|fresh|stale|hot|cold|warm|cool|big|small|large|tiny|huge|enormous|massive|gigantic|microscopic|invisible)$/i;
  if (commonEndings.test(lastClause) && wordCount > 4) {
    return { isSentenceEnd: true, reason: 'common_ending', confidence: 0.6 };
  }

  // 7. Check for conjunctions that might indicate incomplete thoughts
  const incompleteConjunctions = /\b(and|but|or|so|because|since|although|though|while|whereas|however|nevertheless|furthermore|moreover|therefore|thus|hence|consequently|accordingly|meanwhile|meanwhile|instead|otherwise|besides|additionally|also|too|as well|in addition|on the other hand|in contrast|in comparison|similarly|likewise|in fact|indeed|actually|really|truly|certainly|definitely|probably|possibly|maybe|perhaps|apparently|obviously|clearly|evidently|presumably|supposedly|allegedly|reportedly|according to|based on|depending on|regardless of)$/i;
  if (incompleteConjunctions.test(lastClause)) {
    return { isSentenceEnd: false, reason: 'incomplete_conjunction', confidence: 0.8 };
  }

  // 8. Very long clause might be a run-on sentence
  if (wordCount > 40) {
    return { isSentenceEnd: true, reason: 'excessive_length', confidence: 0.5 };
  }

  // Default: not a sentence end
  return { isSentenceEnd: false, reason: 'incomplete', confidence: 0.9 };
}

/**
 * Enhanced version that also considers typing patterns and pauses
 */
export function detectSentenceEndWithTiming(
  text: string, 
  lastKeystrokeTime?: number,
  pauseThreshold: number = 2000 // 2 seconds
): SentenceEndResult {
  const basicResult = detectSentenceEnd(text);
  
  // High confidence detections (like punctuation) should trigger immediately
  if (basicResult.confidence >= 0.95) {
    return basicResult;
  }
  
  // If no keystroke timing is provided, return basic result
  if (!lastKeystrokeTime) {
    return basicResult;
  }
  
  const timeSinceLastKeystroke = Date.now() - lastKeystrokeTime;
  const hasCompletedWord = isWordComplete(text);
  const hasPaused = timeSinceLastKeystroke > pauseThreshold;
  
  // For lower confidence detections, require a complete word + pause
  if (basicResult.isSentenceEnd) {
    // Only trigger if user has paused AND completed a word
    if (hasPaused && hasCompletedWord) {
      return { 
        ...basicResult,
        reason: `${basicResult.reason}_with_pause`,
        confidence: Math.min(basicResult.confidence + 0.15, 0.9)
      };
    } else {
      // Don't trigger yet - still typing or incomplete word or not enough pause
      let reason = 'incomplete_word';
      if (hasCompletedWord && !hasPaused) {
        reason = 'waiting_for_pause';
      } else if (!hasCompletedWord && hasPaused) {
        reason = 'incomplete_word';
      } else if (!hasCompletedWord && !hasPaused) {
        reason = 'incomplete_word';
      }
      
      return { 
        isSentenceEnd: false, 
        reason: reason, 
        confidence: basicResult.confidence 
      };
    }
  }
  
  // Handle long pause detection for otherwise incomplete text
  if (hasPaused) {
    const trimmed = text.trim();
    const lastClause = trimmed.split(/[.!?\n]/).pop()?.trim() ?? '';
    const wordCount = lastClause.split(/\s+/).filter(Boolean).length;
    
    // If there's a substantial clause after a long pause and word is complete
    if (wordCount > 3 && hasCompletedWord) {
      return { 
        isSentenceEnd: true, 
        reason: 'long_pause_complete_word', 
        confidence: 0.6
      };
    }
  }
  
  return basicResult;
}

/**
 * Helper function to check if the user has completed a word (not in the middle of typing)
 */
export function isWordComplete(text: string): boolean {
  const trimmed = text.trim();
  
  // Empty text is not a complete word
  if (!trimmed) {
    return false;
  }
  
  // If text ends with whitespace, the last word is complete
  if (/\s$/.test(text)) {
    return true;
  }
  
  // If text ends with punctuation, word is complete
  if (/[.!?,:;)\]}]$/.test(trimmed)) {
    return true;
  }
  
  // Normalize contractions for better word detection
  const normalizedText = normalizeContractions(trimmed);
  
  // Check if the last "word" looks complete (no partial typing indicators)
  const lastWord = normalizedText.split(/\s+/).pop() || '';
  
  // Very short fragments are likely incomplete
  if (lastWord.length < 2) {
    return false;
  }
  
  // Words ending with common suffixes are likely complete
  const completeSuffixes = /\b\w+(ed|ing|ly|er|est|tion|sion|ment|ness|ity|ful|less|able|ible|ive|ous|ish|like|ward|wise|ized|ised|iced|aced|ased|eted|ated|ored|ured|ired)$/i;
  if (completeSuffixes.test(lastWord)) {
    return true;
  }
  
  // Common complete words (articles, prepositions, etc.)
  const completeWords = /^(the|and|or|but|for|nor|so|yet|a|an|in|on|at|by|to|of|with|from|up|down|out|off|over|under|above|below|through|between|among|during|before|after|since|until|while|where|when|why|how|what|who|which|that|this|these|those|some|any|all|no|not|yes|can|could|should|would|will|may|might|must|do|does|did|have|has|had|am|is|are|was|were|be|been|being|get|got|give|go|come|take|make|see|know|think|feel|want|need|like|love|hate|say|tell|ask|work|play|run|walk|talk|help|try|use|look|find|keep|put|turn|call|move|live|feel|seem|become|remain|stay|leave|arrive|return|meet|visit|send|receive|open|close|start|stop|finish|continue|change|grow|learn|teach|read|write|speak|listen|hear|understand|remember|forget|buy|sell|eat|drink|sleep|wake|sit|stand|lie|cut|break|build|create|save|lose|win|fail|wait|worked|surprised|moment|just|very|really|totally|completely|absolutely|definitely|probably|maybe|perhaps|actually|finally|suddenly|quickly|slowly|carefully|easily|barely|almost|quite|rather|pretty|fairly|enough|too|also|even|only|still|already|yet|again|once|twice|often|sometimes|always|never|usually|generally|specifically|especially|particularly|mainly|mostly|largely|partly|exactly|approximately|roughly|nearly|about|around|over|under|more|less|most|least|better|worse|best|worst|good|bad|great|terrible|amazing|incredible|awesome|wonderful|fantastic|excellent|perfect|horrible|awful|disgusting|beautiful|ugly|cute|funny|serious|boring|interesting|exciting|scary|peaceful|dangerous|safe|risky|easy|hard|difficult|simple|complex|complicated|clear|confusing|obvious|hidden|secret|public|private|personal|professional|formal|informal|casual|fancy|plain|normal|weird|strange|unusual|common|rare|special|ordinary|extraordinary|regular|irregular|smooth|rough|soft|hard|hot|cold|warm|cool|dry|wet|clean|dirty|fresh|old|new|young|ancient|modern|traditional|contemporary|classic|trendy|popular|famous|unknown|rich|poor|expensive|cheap|free|busy|empty|full|open|closed|big|small|large|tiny|huge|enormous|massive|gigantic|microscopic|invisible|visible|bright|dark|light|heavy|thin|thick|wide|narrow|tall|short|long|brief|quick|slow|fast|immediate|instant|gradual|sudden|smooth|sharp|dull|smart|stupid|intelligent|brilliant|clever|wise|foolish|silly|serious|funny|happy|sad|angry|excited|calm|nervous|relaxed|stressed|tired|energetic|lazy|active|passive|aggressive|gentle|kind|mean|nice|rude|polite|friendly|hostile|helpful|useless|useful|important|significant|minor|major|critical|essential|necessary|optional|required|forbidden|allowed|legal|illegal|right|wrong|correct|incorrect|true|false|real|fake|honest|dishonest|fair|unfair|just|unjust|isnt|arent|wasnt|werent|dont|didnt|doesnt|cant|couldnt|shouldnt|wouldnt|wont|hoping|expected)$/i;
  if (completeWords.test(lastWord)) {
    return true;
  }
  
  // If word has mixed case or numbers, likely complete
  if (/[A-Z]/.test(lastWord) && /[a-z]/.test(lastWord)) {
    return true;
  }
  
  if (/\d/.test(lastWord)) {
    return true;
  }
  
  // Words with 4+ characters are probably complete unless they look like typing artifacts
  if (lastWord.length >= 4 && !/[xyz]{2,}|[qwerty]{3,}|asd|zxc/i.test(lastWord)) {
    return true;
  }
  
  // Default: assume incomplete if we can't determine
  return false;
}

/**
 * Helper function to extract the current sentence being typed
 */
export function getCurrentSentence(text: string): string {
  const trimmed = text.trim();
  const sentences = trimmed.split(/[.!?\n]/);
  return sentences[sentences.length - 1]?.trim() ?? '';
}

/**
 * Helper function to count complete sentences in text
 */
export function countCompleteSentences(text: string): number {
  return text.split(/[.!?\n]/).filter(s => s.trim().length > 0).length - 1;
}
