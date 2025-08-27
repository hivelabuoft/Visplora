# Narrative Proposition Preprocessing Script

This script processes the existing narrative propositions into a structured format that includes:

- Cleaned-up, insight-style propositions
- Matched chart type and metadata
- TAPAS validation questions
- Chart rendering metadata

## How it Works

### Input
The script reads from `public/data/narrative_propositions/all_generated_propositions.json` which contains 430 narrative propositions across 12 datasets organized by categories.

### Processing Steps

1. **Chart Type Mapping**: Maps the `suggested_visualization` field to our internal chart templates
2. **LLM Rewriting**: Uses GPT-4o to rewrite propositions for better interpretability:
   - Removes hardcoded statistics (like "15%")
   - Makes them more insight-focused
   - Generates chart titles and descriptions
3. **TAPAS Question Generation**: Creates validation questions based on chart type and content
4. **Metadata Extraction**: Preserves original variables, time periods, geographic levels

### Output
Creates `public/data/narrative_propositions/processed_propositions.json` with the structured format:

```json
{
  "proposition_id": "crime-rates_geographic_patterns_geo_001",
  "dataset": "crime-rates",
  "category": "geographic_patterns",
  "original_proposition": "Westminster accounts for 25% of all theft-from-the-person incidents in London.",
  "reworded_proposition": "Westminster stands out as the borough with the highest concentration of theft-from-the-person incidents in London.",
  "chart_type": "barChart_simple_2D",
  "chart_title": "Theft Incidents by Borough",
  "chart_description": "Distribution of theft-from-the-person incidents across London boroughs",
  "reasoning": "Bar chart is ideal for comparing categorical data across geographic areas.",
  "tapas_questions": [
    "Which borough has the highest theft incidents?",
    "Which borough has the lowest theft incidents?",
    "What is the average theft incidents per borough?",
    "What is the overall pattern shown in the data?"
  ],
  "variables_needed": ["crime_category", "borough_name", "count"],
  "time_period": "Not applicable",
  "geographic_level": "Borough",
  "complexity_level": "Basic"
}
```

## Chart Type Mapping

The script maps visualization types to our internal chart variations:

- `line_chart` → `lineChart_simple_2D/3D`
- `bar_chart` → `barChart_simple_2D`, `barChart_with_mean_2D`, `barChart_with_threshold_2D`
- `pie_chart` → `donutChart_simple_2D/3D`
- `choropleth_map` → `barChart_simple_2D` (simplified for now)
- `scatter_plot` → `scatterPlot_simple_2D/3D`
- And more...

## TAPAS Question Templates

The script generates 4 validation questions per proposition based on:

- **Ranking questions**: "Which X has the highest Y?"
- **Proportion questions**: "What percentage of Y is in X?"
- **Temporal questions**: "How did Y change over time?"
- **Comparison questions**: "How does X1 compare to X2?"
- **Generic questions**: "What is the overall pattern?"

## Usage

### Prerequisites
- Node.js installed
- OpenAI API key in `.env.local`

### Running the Script

```bash
# Navigate to the client directory
cd /path/to/Visplora/client

# Run preprocessing
npm run preprocess
```

### Configuration

The script processes in batches to respect OpenAI API rate limits:
- Batch size: 5 propositions at a time
- Delay: 1 second between batches
- Model: GPT-4o with temperature 0.3

### Error Handling

- If OpenAI API fails, the script provides fallback processing
- Failed batches are logged but don't stop the entire process
- Includes retry logic and graceful error handling

## Output Statistics

The processed file includes summary statistics:

```json
{
  "processed_at": "2025-08-20T02:45:30.123Z",
  "total_processed": 330,
  "processing_summary": {
    "by_dataset": {
      "crime-rates": 40,
      "ethnicity": 35,
      // ...
    },
    "by_chart_type": {
      "barChart_simple_2D": 150,
      "lineChart_simple_2D": 80,
      // ...
    },
    "by_complexity": {
      "Basic": 120,
      "Intermediate": 140,
      "Advanced": 70
    }
  },
  "propositions": [/* all processed propositions */]
}
```

## Cost Estimation

- ~430 propositions × ~300 tokens each × GPT-4o pricing
- Estimated cost: $5-10 per complete run
- Failed requests use fallback processing (no additional cost)

## Files

- `layer1.js` - Main preprocessing script
- `layer1.ts` - TypeScript version (requires tsx)
- Input: `public/data/narrative_propositions/all_generated_propositions.json`
- Output: `public/data/narrative_propositions/processed_propositions.json`

## Next Steps

1. Run the script to generate processed propositions
2. Integrate the output into your visualization pipeline
3. Use the TAPAS questions for user interaction validation
4. Leverage the chart type mappings for dynamic visualization rendering
