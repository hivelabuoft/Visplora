// Domain validation utility for checking if user questions are within dataset scope

export interface DomainValidationResult {
  is_data_driven_question: boolean;
  inquiry_supported: boolean;
  matched_dataset: string[];
  matched_columns: { [dataset: string]: string[] };
  explanation: string;
}

export interface DomainValidationResponse {
  success: boolean;
  validation?: DomainValidationResult;
  datasets_info?: {
    total_categories: number;
    category_names: string[];
  };
  error?: string;
  message?: string;
}

/**
 * Validates if a user's question/exploration sentence is within the scope 
 * of available London datasets using OpenAI
 */
export async function validateDomain(sentence: string): Promise<DomainValidationResponse> {
  try {
    console.log('🔍 Validating domain scope for sentence:', sentence);
    
    const response = await fetch('/api/validate-domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sentence: sentence.trim()
      }),
    });

    if (!response.ok) {
      throw new Error(`Domain validation API error: ${response.status} ${response.statusText}`);
    }

    const result: DomainValidationResponse = await response.json();
    
    console.log('✅ Domain validation result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Domain validation error:', error);
    
    return {
      success: false,
      error: 'Domain validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Quick check if a sentence is likely in scope based on keywords
 * (faster fallback that doesn't require API call)
 */
export function quickDomainCheck(sentence: string): boolean {
  const inScopeKeywords = [
    // Location
    'london', 'borough', 'area', 'district', 'neighbourhood', 'ward', 'lsoa',
    // Demographics
    'population', 'people', 'residents', 'demographic', 'ethnicity', 'ethnic', 'diversity',
    'country of birth', 'birth', 'nationality', 'white', 'asian', 'black', 'mixed',
    // Housing & Property
    'housing', 'house', 'home', 'property', 'prices', 'cost', 'rent', 'rental', 'buy', 'purchase',
    'density', 'accommodation', 'dwelling', 'private rent', 'land registry',
    // Safety & Crime
    'crime', 'safety', 'safe', 'dangerous', 'security', 'police', 'theft', 'burglary',
    'assault', 'violence', 'murder', 'robbery', 'crime rate',
    // Income & Economy
    'income', 'salary', 'wage', 'earnings', 'money', 'economic', 'employment', 'job',
    'tax', 'taxpayer', 'wealth', 'rich', 'poor', 'mean', 'median',
    // Education
    'school', 'education', 'college', 'university', 'student', 'teacher', 'learning',
    'establishment', 'pupils', 'nursery', 'sixth form', 'ofsted',
    // Transportation
    'transport', 'vehicle', 'car', 'bus', 'train', 'underground', 'tube', 'bike', 'cycling',
    'licensed', 'registration', 'motorcycle', 'goods', 'coaches',
    // Food & Restaurants
    'restaurant', 'cafe', 'food', 'dining', 'eat', 'licensed',
    // Facilities
    'gym', 'fitness', 'library', 'facilities',
    // Statistical terms
    'count', 'number', 'total', 'average', 'percentage', 'rate', 'compare', 'analyze'
  ];
  
  const outOfScopeKeywords = [
    // Other locations
    'paris', 'new york', 'tokyo', 'manchester', 'birmingham',
    // Weather & Climate
    'weather', 'temperature', 'rain', 'snow', 'climate', 'sunny', 'cloudy',
    // Healthcare
    'hospital', 'doctor', 'medical', 'health', 'covid', 'pandemic', 'disease',
    // Real-time events
    'today', 'tomorrow', 'yesterday', 'current', 'now', 'live', 'breaking',
    // Specific businesses
    'tesco', 'sainsbury', 'mcdonalds', 'starbucks'
  ];
  
  const lowerSentence = sentence.toLowerCase();
  
  // Check for out-of-scope keywords first (higher priority)
  const hasOutOfScope = outOfScopeKeywords.some(keyword => lowerSentence.includes(keyword));
  if (hasOutOfScope) {
    return false;
  }
  
  // Check for in-scope keywords
  const hasInScope = inScopeKeywords.some(keyword => lowerSentence.includes(keyword));
  
  return hasInScope;
}

/**
 * Get user-friendly feedback for out-of-scope questions
 */
export function getOutOfScopeFeedback(sentence: string): string {
  const lowerSentence = sentence.toLowerCase();
  
  if (lowerSentence.includes('weather') || lowerSentence.includes('climate')) {
    return "Weather data isn't available in our datasets. Try asking about housing, crime, income, or demographics in London boroughs instead.";
  }
  
  if (lowerSentence.includes('hospital') || lowerSentence.includes('health')) {
    return "Healthcare data isn't included. You can explore safety (crime rates), education, housing, or income data across London boroughs.";
  }
  
  const otherCities = ['paris', 'new york', 'tokyo', 'manchester', 'birmingham'];
  const mentionedCity = otherCities.find(city => lowerSentence.includes(city));
  if (mentionedCity) {
    return `Data for ${mentionedCity} isn't available. Our datasets focus on London boroughs. Try asking about London housing, crime, demographics, or income instead.`;
  }
  
  return "This question might be outside our available datasets. Try asking about London housing, crime rates, income, demographics, education, or transportation data.";
}
