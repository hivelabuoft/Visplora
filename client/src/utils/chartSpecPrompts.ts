/**
 * LLM Prompt Templates for Chart Specification Generation
 * This file contains the prompts used to generate chart specifications
 * from narrative sentences using OpenAI GPT-4
 */

export const CHART_SPEC_SYSTEM_PROMPT = `You are a travel data visualization expert. Your role is to analyze narrative sentences about travel data and generate appropriate chart specifications that would best visualize the insights described.

You have deep understanding of:
- Travel industry data patterns and metrics
- Visualization best practices for different data types
- Interactive filtering needs for travel dashboards
- User experience considerations for travel analytics

Always respond with valid JSON only. No explanations or additional text.`;

export const CHART_SPEC_USER_PROMPT_TEMPLATE = `Based on the following narrative sentence and context, generate 2-4 diverse chart specifications that would best visualize the data insights described.

SENTENCE: "{sentenceContent}"
SYSTEM SHOWS: "{systemShows}"
ANALYSIS TYPE: "{driftType}"

AVAILABLE CHART TYPES AND SUBTYPES:
- line: multiLineLabelSpec, lineChartWithMean, lineChartWithThreshold
- bar: horizontalBar, divergingBar, barChartWithThreshold, barChartWithMean  
- multiType: barChartWithLineSpec, multiType_same_y_diff_type, multiTypeWithThreshold, multiTypeWithMean
- scatter: bubblePlotScatterSpec
- map: worldInteractiveMap
- pie: interactivePieSpec

CHART SELECTION GUIDELINES:
- Trends over time → line charts (multiLineLabelSpec, lineChartWithMean, lineChartWithThreshold)
- Comparisons/rankings → bar charts (horizontalBar, divergingBar, barChartWithMean, barChartWithThreshold)
- Relationships/correlations → scatter charts (bubblePlotScatterSpec)
- Distributions/breakdowns → pie charts (interactivePieSpec)
- Geographic data → map charts (worldInteractiveMap)
- Combined metrics → multiType charts (barChartWithLineSpec, multiTypeWithThreshold, etc.)

RULES:
1. Choose chart types that match the analysis intent
2. For pie and bar charts, add hasFieldFilter=true with appropriate filterConfig
3. Node sizes: pie=medium, bar=medium/xlarge, others=xlarge
4. Select appropriate dataCategory from: cost, safety, visitor-flow, environmental, reviews, cultural, demographics, recovery-analysis, economics, sustainability, wildlife, revenue, accessibility, geographic, seasonal-tourism
5. Include 3-8 realistic destinations or countries based on the sentence context
6. Set maxDataPoints appropriately (5-12 typically)
7. Create meaningful, specific chart names and user queries that match the sentence intent
8. Ensure diversity in chart types for comprehensive data storytelling

FILTER TYPES AVAILABLE: budget_level, region, season, trip_type, year

DATA CATEGORIES EXPLAINED:
- cost: Travel expenses, hotel prices, budget analysis
- safety: Safety scores, crime rates, risk assessments
- visitor-flow: Tourist arrivals, occupancy rates, seasonal patterns
- environmental: Air quality, sustainability metrics, green initiatives
- reviews: Customer satisfaction, ratings, feedback analysis
- cultural: Cultural diversity, heritage sites, local experiences
- demographics: Population data, tourist demographics
- recovery-analysis: Post-COVID recovery rates, tourism resilience
- economics: GDP impact, revenue analysis, economic indicators
- sustainability: Environmental impact, conservation efforts
- wildlife: Wildlife diversity, conservation status
- revenue: Tourism revenue, economic contribution
- accessibility: Visa requirements, infrastructure accessibility
- geographic: Geographic distributions, regional analysis
- seasonal-tourism: Seasonal patterns, weather impact

Generate a JSON response with 2-4 charts in this exact format:
{
  "charts": [
    {
      "name": "Descriptive Chart Name",
      "request": {
        "userQuery": "Clear description of what to show",
        "constraints": {
          "chartType": "type",
          "subtype": "subtype",
          "nodeSize": "medium|xlarge",
          "dataCategory": "category",
          "destinations": ["dest1", "dest2"] OR "selectedCountries": ["country1", "country2"] for maps,
          "maxDataPoints": number,
          "hasFieldFilter": true/false,
          "filterConfig": {filter_object} // only if hasFieldFilter=true
        }
      }
    }
  ]
}

Make the charts diverse in type and complementary to tell a complete data story for this sentence.`;

/**
 * Generates the complete LLM prompt for chart specification generation
 */
export const generateChartSpecPrompt = (
  sentenceContent: string, 
  systemShows: string, 
  driftType: string
): string => {
  return CHART_SPEC_USER_PROMPT_TEMPLATE
    .replace('{sentenceContent}', sentenceContent)
    .replace('{systemShows}', systemShows || 'Not specified')
    .replace('{driftType}', driftType);
};

/**
 * Example prompts for testing and validation
 */
export const EXAMPLE_PROMPTS = {
  trendAnalysis: {
    sentence: "Tourist arrivals to Southeast Asia have shown steady growth over the past five years, with Thailand leading the recovery.",
    systemShows: "Dashboard: regional trends; chart1: line chart of arrivals by country; chart2: growth rate comparison",
    driftType: "Provide Overview"
  },
  comparison: {
    sentence: "Among European capitals, London and Paris consistently rank highest for both visitor satisfaction and travel costs.",
    systemShows: "Dashboard: city comparison; chart1: satisfaction vs cost scatter; chart2: ranking bars",
    driftType: "Compare"
  },
  geographic: {
    sentence: "The distribution of international visitors shows clear regional preferences, with Asian destinations gaining popularity.",
    systemShows: "Dashboard: world map; chart1: visitor flow map; chart2: regional breakdown pie",
    driftType: "Match Mental Model"
  }
};