# Travel Agent Simulator

## Overview

The Travel Agent Simulator is a collection of 5 specialized LLM-powered agents that generate travel-specific chart visualizations using the SpecCreator system. Each agent is pre-trained with travel domain knowledge and can generate context-aware data and appropriate chart configurations.

## Architecture

```
TravelAgentManager
├── LineChartAgent      - Time series, trends, seasonal patterns
├── BarChartAgent       - Comparisons, rankings, categorical data
├── PieChartAgent       - Distributions, breakdowns, proportions
├── ScatterChartAgent   - Relationships, correlations, multi-variable analysis
└── MultiTypeChartAgent - Combined visualizations (bars + lines)
```

## 🚀 Quick Start

```typescript
import { TravelAgentManager } from './travel_agent_simulator';

const agentManager = new TravelAgentManager();

// Generate a travel chart
const response = await agentManager.generateTravelChart({
  userQuery: "Show me monthly visitor trends for Tokyo with occupancy rates",
  constraints: {
    dataCategory: 'visitor-flow',
    destinations: ['Tokyo'],
    maxDataPoints: 12
  }
});

if (response.success && response.chartSpec) {
  // Use with SpecCreator
  const vegaSpec = SpecCreator.create(response.chartSpec);
  // Render with your visualization library
}
```

## 📊 Chart Types & Subtypes

### Line Charts (`LineChartAgent`)
- **multiLineLabelSpec**: Multi-series lines with hover labels
- **lineChartWithMean**: Line chart with average line overlay
- **lineChartWithThreshold**: Line chart with threshold/target line

**Use Cases**: Cost trends, visitor arrivals over time, safety scores evolution, seasonal patterns

**Sample Requests**:
- "Show monthly hotel costs for Tokyo over the past year"
- "Display visitor trends with seasonal averages"
- "Track safety scores against target threshold"

### Bar Charts (`BarChartAgent`)
- **horizontalBarSpec**: Standard horizontal bars for rankings
- **divergingBarSpec**: Dual-metric bars (positive/negative)
- **barChartWithMean**: Bars with average line
- **barChartWithThreshold**: Bars with target line

**Use Cases**: Destination comparisons, cost rankings, safety risk analysis, visitor growth

**Sample Requests**:
- "Compare average costs across Asian cities"
- "Show crime vs political risk by region"
- "Rank destinations by visitor numbers with global average"

### Pie Charts (`PieChartAgent`)
- **interactivePieSpec**: Interactive donut charts with hover effects

**Use Cases**: Review distributions, expense breakdowns, safety level distributions, cultural diversity

**Sample Requests**:
- "Show review rating distribution for Paris"
- "Break down travel expenses by category"
- "Display safety level distribution across city areas"

### Scatter Charts (`ScatterChartAgent`)
- **bubblePlotScatterSpec**: Multi-variable scatter with size and color encoding

**Use Cases**: Cost vs safety analysis, environmental quality relationships, popularity vs satisfaction

**Sample Requests**:
- "Show relationship between cost and safety across destinations"
- "Plot environmental quality: air quality vs green space"
- "Compare review ratings to visitor popularity"

### Multi-Type Charts (`MultiTypeChartAgent`)
- **barChartWithLineSpec**: Bars (left Y) + Line (right Y) - different scales
- **multiType_same_y_diff_type**: Bars + Line on same Y scale
- **multiTypeWithMean**: Bars + Line + Mean line
- **multiTypeWithThreshold**: Bars + Line + Threshold line

**Use Cases**: Seasonal analysis with dual metrics, cost vs satisfaction, capacity vs demand

**Sample Requests**:
- "Monthly visitors with occupancy rates"
- "Show cost trends with satisfaction scores"
- "Display arrivals vs global average"

## 🎯 Data Categories

The agents understand these travel data categories:

- **cost**: Hotel prices, meal costs, transport expenses, cost indexes
- **safety**: Crime rates, political risk, safety scores, incident data
- **visitor-flow**: Tourist arrivals, seasonal patterns, occupancy rates
- **reviews**: Ratings, review counts, satisfaction scores, sentiment
- **environmental**: Air quality, green space, water quality, sustainability
- **cultural**: Diversity metrics, events, language support, inclusivity

## 🔧 Configuration

### Request Structure
```typescript
interface TravelAgentRequest {
  userQuery: string;                    // Natural language request
  constraints?: TravelConstraints;      // Optional constraints
}

interface TravelConstraints {
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'multiType';
  dataCategory?: 'cost' | 'safety' | 'visitor-flow' | 'reviews' | 'environmental' | 'cultural';
  timeRange?: { start: string; end: string };
  destinations?: string[];              // City names
  maxDataPoints?: number;               // Default: 8
  visualization?: 'comparison' | 'trends' | 'distribution' | 'relationship';
}
```

### Response Structure
```typescript
interface AgentResponse {
  success: boolean;
  chartSpec?: TravelChartSpec;          // Ready for SpecCreator
  explanation?: string;                 // Human-readable explanation
  error?: string;                       // Error message if failed
  suggestedAlternatives?: string[];     // Alternative approaches
}
```

## 🧠 Agent Intelligence

### Chart Type Selection Logic
The system automatically selects the best agent based on query analysis:

1. **Multi-Type**: "monthly visitors with occupancy", "costs and satisfaction"
2. **Line**: "over time", "trends", "monthly", "seasonal patterns"
3. **Pie**: "distribution", "breakdown", "percentage", "composition"
4. **Scatter**: "relationship", "vs", "correlation", "compared to"
5. **Bar**: "compare", "ranking", "by destination", "across cities"

### Data Generation
Each agent generates realistic, context-aware travel data:
- Uses actual destination names from `TRAVEL_DESTINATIONS`
- Applies realistic value ranges for each metric type
- Considers seasonal patterns and regional differences
- Ensures data relationships make sense (e.g., higher costs in peak season)

### Styling Intelligence
Agents apply travel-appropriate styling:
- Color schemes suitable for travel data
- Proper axis formatting (currency, percentages, dates)
- Meaningful legends and tooltips
- Responsive dimensions based on data complexity

## 📝 Critical Rules for LLM Agents

### NEVER Change:
- **Dimensions**: Always use provided dimensions exactly
- **Chart type**: Must match the agent's specialization
- **Core structure**: Don't modify SpecCreator interfaces

### ALWAYS Modify:
- **Colors**: Use travel-appropriate color schemes
- **Styling**: Customize axes, legends, tooltips
- **Titles**: Create descriptive, context-specific titles
- **Field mappings**: Use appropriate field names from generated data
- **Data values**: Generate realistic travel metrics

### Field Requirements by Chart Type:

**Line Charts**:
- `x`: Temporal (date, month, year) or ordinal
- `y`: Quantitative (cost, count, score)
- `series`: Nominal (category, destination)

**Bar Charts**:
- `category`: Nominal (destination, city, region)
- `value`: Quantitative (cost, visitors, score)
- For diverging: `positiveValue`, `negativeValue`

**Pie Charts**:
- `category`: Nominal (rating, type, level)
- `value`: Quantitative (count, amount, score)
- Include `percentage` for tooltips

**Scatter Charts**:
- `x`, `y`: Quantitative (cost, score, rating)
- `size`: Quantitative (visitors, population)
- `color`: Quantitative or nominal

**Multi-Type Charts**:
- `x`: Ordinal (month, quarter, year)
- `y`: Quantitative for bars (arrivals, cost)
- `series`: Quantitative for line (rate, score)
- `color`: Nominal for bar categories

## 🛡️ Error Handling

The system includes comprehensive error handling:
- **Validation**: Ensures generated specs match SpecCreator requirements
- **Fallbacks**: Suggests alternative chart types when requests fail
- **Type Safety**: Full TypeScript support with proper interfaces
- **API Resilience**: Handles OpenAI API failures gracefully

## 🔄 Integration with SpecCreator

The agents generate chart specifications that are directly compatible with SpecCreator:

```typescript
// Agent generates this structure
const chartSpec = {
  type: 'line',
  subtype: 'multiLineLabelSpec',
  data: [...],
  config: {
    dimensions: { width: 400, height: 200 },
    fields: { x: 'date', y: 'cost', series: 'category' },
    styling: { colors: ['#aea630ff', '#3b82f6'], ... },
    // ... other config
  },
  title: "Monthly Travel Costs - Tokyo",
  description: "Cost trends over time showing seasonal patterns"
};

// Direct usage with SpecCreator
const vegaSpec = SpecCreator.create(chartSpec);
```

## 🌍 Travel Data Sources

The agents are pre-loaded with:
- **135+ destinations** across all continents
- **19 regions** (Western Europe, Southeast Asia, etc.)
- **Realistic value ranges** for all travel metrics
- **Seasonal patterns** for tourism data
- **Regional characteristics** for authentic data generation

## 🎨 Styling Guidelines

### Travel-Appropriate Color Schemes:
- **Costs**: Golden/amber tones `['#aea630ff', '#f59e0b']`
- **Safety**: Green to red spectrum `['#16a34a', '#ef4444']`
- **Seasonal**: Blue spectrum `['#94a3b8', '#3b82f6', '#1e40af']`
- **Quality**: Purple gradient `['#8B5CF6', '#3B82F6', '#06B6D4']`
- **Regional**: Distinct categorical colors

### Format Standards:
- **Currency**: `$,.0f` or `.1s` for large numbers
- **Percentages**: `.1%` or `.0f` for whole numbers
- **Dates**: `%Y-%m` for year-month, `%Y` for years
- **Counts**: `.1s` for abbreviated (1.2M, 450K)

## 🚦 System Validation

Validate the system before use:

```typescript
const validation = agentManager.validateSystem();
if (!validation.isValid) {
  console.error('System validation errors:', validation.errors);
}
```

Checks:
- All 5 agents are properly initialized
- OpenAI API key is available
- Agent configurations are valid

## 🎯 Best Practices

1. **Be Specific**: Include destination names and data categories in requests
2. **Use Constraints**: Specify chart type if you have a preference
3. **Handle Errors**: Always check `response.success` before using chart specs
4. **Context Matters**: More specific queries generate better visualizations
5. **Iterate**: Use `suggestedAlternatives` if first attempt doesn't match needs

## 🔮 Example Usage Patterns

### Trend Analysis
```typescript
await agentManager.generateTravelChart({
  userQuery: "Show visitor arrival trends for Bangkok over the past 8 months",
  constraints: { 
    dataCategory: 'visitor-flow',
    destinations: ['Bangkok'],
    maxDataPoints: 8
  }
});
```

### Comparative Analysis
```typescript
await agentManager.generateTravelChart({
  userQuery: "Compare safety scores across major European cities",
  constraints: { 
    dataCategory: 'safety',
    destinations: ['Paris', 'London', 'Berlin', 'Rome'],
    chartType: 'bar'
  }
});
```

### Relationship Analysis
```typescript
await agentManager.generateTravelChart({
  userQuery: "Show relationship between travel costs and environmental quality",
  constraints: { 
    dataCategory: 'environmental',
    chartType: 'scatter',
    maxDataPoints: 10
  }
});
```

### Distribution Analysis
```typescript
await agentManager.generateTravelChart({
  userQuery: "Break down review ratings distribution for Singapore hotels",
  constraints: { 
    dataCategory: 'reviews',
    destinations: ['Singapore'],
    chartType: 'pie'
  }
});
```

---

*Built with TypeScript, OpenAI GPT-4, and the SpecCreator visualization system.*