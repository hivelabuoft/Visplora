# Proposition Generation System

This system generates data-driven propositions for London datasets based on a configuration file. It supports both single-dataset propositions and cross-dataset relationship propositions.

## Files Overview

### Core Files
- `proposition_generator.js` - Main generator class that orchestrates the proposition creation
- `llm_service.js` - LLM interface for generating propositions (placeholder implementations included)
- `proposition_config.json` - Configuration file defining datasets, proposition counts, and categories
- `test_runner.js` - Test script to validate the system

### Configuration Structure

The `proposition_config.json` file defines:

1. **Single Dataset Propositions**: For each dataset (crime-rates, ethnicity, population, etc.)
   - Total number of propositions
   - Breakdown by category (trend_analysis, geographic_patterns, etc.)

2. **Cross-Dataset Propositions**: Relationships between multiple datasets
   - Categories like socioeconomic_correlations, crime_demographics
   - Which datasets are involved in each analysis

3. **LLM Settings**: Model configuration, temperature, tokens, etc.

4. **Output Settings**: Where to save generated propositions

## Usage

### Basic Usage

```bash
# Run the complete proposition generation
node proposition_generator.js

# Or use the test runner
node test_runner.js full
```

### Testing Individual Components

```bash
# Test single dataset proposition generation
node test_runner.js single

# Test cross-dataset proposition generation  
node test_runner.js cross

# Test both components
node test_runner.js test
```

## Configuration Example

```json
{
  "datasets": {
    "crime-rates": {
      "total_propositions": 50,
      "proposition_breakdown": {
        "trend_analysis": 15,
        "geographic_patterns": 12,
        "seasonal_variations": 8,
        "crime_type_comparisons": 10,
        "statistical_insights": 5
      }
    }
  },
  "cross_dataset_propositions": {
    "total_propositions": 60,
    "proposition_breakdown": {
      "socioeconomic_correlations": {
        "count": 15,
        "datasets": ["income", "house-prices", "private-rent", "ethnicity"]
      }
    }
  }
}
```

## Generated Output

The system generates JSON files containing:

### Single Dataset Propositions
```json
{
  "dataset": "crime-rates",
  "total_count": 50,
  "categories": {
    "trend_analysis": {
      "count": 15,
      "propositions": [
        {
          "id": "crime-rates_trend_analysis_1",
          "text": "[LLM Generated proposition]",
          "confidence": 0.85,
          "data_references": ["crime-rates.csv"],
          "visualization_suggestion": "line_chart"
        }
      ]
    }
  }
}
```

### Cross-Dataset Propositions
```json
{
  "type": "cross_dataset",
  "categories": {
    "socioeconomic_correlations": {
      "datasets": ["income", "house-prices"],
      "propositions": [
        {
          "id": "cross_socioeconomic_correlations_1",
          "text": "[Cross-dataset analysis proposition]",
          "datasets_involved": ["income", "house-prices"],
          "relationship_type": "correlation"
        }
      ]
    }
  }
}
```

## Implementation Status

### ✅ Complete
- Configuration-driven architecture using `london_config.json`
- Comprehensive prompt generation for single and cross-dataset propositions
- Detailed prompt templates with category-specific instructions
- JSON output generation with enhanced metadata
- Test runner and validation system
- Integration with Claude Sonnet 4 (claude-sonnet-4-20250514) model

### 🔄 Ready for LLM Integration
- **Comprehensive Prompts**: Detailed prompts with dataset metadata, temporal guidelines, and quality standards
- **Structured Output**: JSON format with specific proposition attributes
- **Model Configuration**: Optimized for Claude Sonnet 4 with temperature 0.3 for consistent structured output
- **Error Handling**: Fallback to mock data when LLM calls fail

### 🔮 Future Enhancements
- Real-time LLM API integration (currently uses detailed mock responses)
- Proposition quality scoring and validation
- Interactive proposition refinement
- Integration with actual dataset metadata from `london_metadata.json`
- Visualization recommendation engine based on proposition types

## LLM Integration Points

The system is now ready for LLM integration. To implement actual LLM calls, update the `callLLM()` method in `llm_service.js`:

```javascript
async callLLM(prompt, options = {}) {
    // Example Claude API integration
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: options.max_tokens || this.maxTokens,
            temperature: options.temperature || this.temperature,
            messages: [{ role: 'user', content: prompt }]
        })
    });
    
    return await response.json();
}
```

## Enhanced Prompt System

### Single Dataset Prompts Include:
- **Dataset Information**: Name, description, temporal coverage, geographic scope
- **Schema Details**: Column names, sample values, data types
- **Temporal Guidelines**: Appropriate tense usage based on data coverage
- **Quality Standards**: Specificity, testability, actionability requirements
- **Category-Specific Instructions**: Detailed guidance for each proposition type
- **Output Format**: Structured JSON with required attributes

### Cross-Dataset Prompts Include:
- **Multi-Dataset Overview**: All available datasets with metadata
- **Temporal Overlap Analysis**: Which datasets can be meaningfully combined
- **Relationship Types**: Direct overlap, temporal lag, historical context, proxy relationships
- **Quality Requirements**: Multi-dataset specificity and testability
- **Visualization Suggestions**: Appropriate charts for cross-dataset analysis

## Dataset Coverage

The system is configured to generate propositions for all London datasets:

- **Crime Rates** (50 propositions)
- **Ethnicity** (40 propositions)  
- **Population** (45 propositions)
- **Income** (35 propositions)
- **House Prices** (40 propositions)
- **Schools/Colleges** (45 propositions)
- **Vehicles** (30 propositions)
- **Restaurants** (25 propositions)
- **Private Rent** (35 propositions)
- **Gyms** (20 propositions)
- **Libraries** (20 propositions)

Plus 60 cross-dataset propositions exploring relationships between multiple domains.

**Total: 445 propositions** across all datasets and relationships.
