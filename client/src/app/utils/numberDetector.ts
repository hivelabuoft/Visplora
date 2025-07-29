/**
 * Utility function to detect and extract numbers from text
 */

export interface NumberMatch {
  value: number;
  text: string;
  start: number;
  end: number;
  type: 'integer' | 'decimal' | 'percentage' | 'currency' | 'scientific';
}

export interface NumberDetectionResult {
  numbers: NumberMatch[];
  hasNumbers: boolean;
  totalNumbers: number;
}

/**
 * Regular expressions for different number formats
 */
const NUMBER_PATTERNS = {
  // Decimal numbers (including negative): -123.45, 70.46, .5, -.25
  decimal: /[-+]?(?:\d+\.?\d*|\.\d+)/g,
  
  // Percentages: 70.46%, 25%
  percentage: /[-+]?(?:\d+\.?\d*|\.\d+)%/g,
  
  // Currency: $123.45, €50.20, £30.75
  currency: /[$€£¥][-+]?(?:\d{1,3}(?:,\d{3})*\.?\d*|\.\d+)/g,
  
  // Scientific notation: 1.23e5, 2.5E-3
  scientific: /[-+]?(?:\d+\.?\d*|\.\d+)[eE][-+]?\d+/g,
  
  // Numbers with thousand separators: 1,234.56, 1,000
  withCommas: /[-+]?\d{1,3}(?:,\d{3})*(?:\.\d+)?/g
};

/**
 * Extract numbers from text with their positions and types
 */
export function detectNumbers(text: string): NumberDetectionResult {
  const numbers: NumberMatch[] = [];
  const processedRanges: Array<{start: number, end: number}> = [];
  
  // Helper function to check if a range overlaps with already processed ranges
  const isOverlapping = (start: number, end: number): boolean => {
    return processedRanges.some(range => 
      (start >= range.start && start < range.end) || 
      (end > range.start && end <= range.end) ||
      (start <= range.start && end >= range.end)
    );
  };
  
  // Helper function to add a number match if it doesn't overlap
  const addNumberMatch = (match: RegExpExecArray, type: NumberMatch['type'], rawValue?: number) => {
    const start = match.index!;
    const end = start + match[0].length;
    
    if (isOverlapping(start, end)) {
      return; // Skip overlapping matches
    }
    
    let value: number;
    let text = match[0];
    
    if (rawValue !== undefined) {
      value = rawValue;
    } else {
      // Clean the text for parsing
      let cleanText = text;
      
      // Remove currency symbols
      cleanText = cleanText.replace(/[$€£¥]/g, '');
      
      // Remove percentage symbol
      cleanText = cleanText.replace(/%/g, '');
      
      // Remove thousand separators
      cleanText = cleanText.replace(/,/g, '');
      
      // Parse the cleaned number
      value = parseFloat(cleanText);
    }
    
    // Only add valid numbers
    if (!isNaN(value) && isFinite(value)) {
      numbers.push({
        value,
        text,
        start,
        end,
        type
      });
      
      processedRanges.push({ start, end });
    }
  };
  
  // Reset regex lastIndex to ensure fresh matching
  Object.values(NUMBER_PATTERNS).forEach(pattern => {
    pattern.lastIndex = 0;
  });
  
  // 1. First pass: Scientific notation (highest priority)
  let match;
  while ((match = NUMBER_PATTERNS.scientific.exec(text)) !== null) {
    addNumberMatch(match, 'scientific');
  }
  
  // 2. Second pass: Currency
  NUMBER_PATTERNS.currency.lastIndex = 0;
  while ((match = NUMBER_PATTERNS.currency.exec(text)) !== null) {
    addNumberMatch(match, 'currency');
  }
  
  // 3. Third pass: Percentages
  NUMBER_PATTERNS.percentage.lastIndex = 0;
  while ((match = NUMBER_PATTERNS.percentage.exec(text)) !== null) {
    addNumberMatch(match, 'percentage');
  }
  
  // 4. Fourth pass: Numbers with commas
  NUMBER_PATTERNS.withCommas.lastIndex = 0;
  while ((match = NUMBER_PATTERNS.withCommas.exec(text)) !== null) {
    // Only process if it contains commas (to avoid duplicating simple numbers)
    if (match[0].includes(',')) {
      addNumberMatch(match, match[0].includes('.') ? 'decimal' : 'integer');
    }
  }
  
  // 5. Last pass: Simple decimal numbers (including integers)
  NUMBER_PATTERNS.decimal.lastIndex = 0;
  while ((match = NUMBER_PATTERNS.decimal.exec(text)) !== null) {
    const numberText = match[0];
    
    // Skip if this is just a standalone period or single character
    if (numberText === '.' || numberText.length === 1 && /[+-]/.test(numberText)) {
      continue;
    }
    
    // Determine if it's an integer or decimal
    const type = numberText.includes('.') ? 'decimal' : 'integer';
    addNumberMatch(match, type);
  }
  
  // Sort numbers by their position in the text
  numbers.sort((a, b) => a.start - b.start);
  
  return {
    numbers,
    hasNumbers: numbers.length > 0,
    totalNumbers: numbers.length
  };
}

/**
 * Get just the numeric values from text
 */
export function extractNumberValues(text: string): number[] {
  const result = detectNumbers(text);
  return result.numbers.map(num => num.value);
}

/**
 * Check if text contains specific number patterns
 */
export function hasNumberPattern(text: string, pattern: 'decimal' | 'integer' | 'percentage' | 'currency' | 'scientific'): boolean {
  const result = detectNumbers(text);
  return result.numbers.some(num => num.type === pattern);
}

/**
 * Get summary statistics about numbers in text
 */
export function getNumberSummary(text: string): {
  count: number;
  min?: number;
  max?: number;
  average?: number;
  types: Record<string, number>;
} {
  const result = detectNumbers(text);
  const values = result.numbers.map(num => num.value);
  
  const types: Record<string, number> = {};
  result.numbers.forEach(num => {
    types[num.type] = (types[num.type] || 0) + 1;
  });
  
  if (values.length === 0) {
    return { count: 0, types };
  }
  
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
    types
  };
}

/**
 * Format numbers for display with appropriate precision
 */
export function formatNumber(value: number, type: NumberMatch['type']): string {
  switch (type) {
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'currency':
      return `$${value.toFixed(2)}`;
    case 'scientific':
      return value.toExponential(2);
    case 'decimal':
      // Use appropriate decimal places based on the value
      if (value % 1 === 0) {
        return value.toString();
      } else {
        return value.toFixed(2);
      }
    case 'integer':
    default:
      return Math.round(value).toString();
  }
}

/**
 * Highlight numbers in text by wrapping them in spans
 */
export function highlightNumbers(text: string, className: string = 'number-highlight'): string {
  const result = detectNumbers(text);
  
  if (!result.hasNumbers) {
    return text;
  }
  
  let highlightedText = text;
  let offset = 0;
  
  // Process numbers in reverse order to maintain correct positions
  result.numbers.reverse().forEach(num => {
    const beforeText = highlightedText.substring(0, num.start + offset);
    const numberText = highlightedText.substring(num.start + offset, num.end + offset);
    const afterText = highlightedText.substring(num.end + offset);
    
    const wrappedNumber = `<span class="${className}" data-value="${num.value}" data-type="${num.type}">${numberText}</span>`;
    highlightedText = beforeText + wrappedNumber + afterText;
    
    offset += wrappedNumber.length - numberText.length;
  });
  
  return highlightedText;
}
