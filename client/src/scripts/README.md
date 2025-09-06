# Chart Specification Generator

This script replicates the travel-agent-simulator's two-stage LLM architecture to transform input data into interactive chart specifications.

## How It Works

The system follows the exact same architecture as the travel-agent-simulator:

### Stage 1: Primary Agent Generation
- **TravelAgentManager** receives requests with `userQuery` and `constraints`
- Routes to specialized agents based on `chartType` and `subtype`:
  - `HorizontalBarAgent` for basic bar charts
  - `BarWithMeanAgent` for bars with mean lines
  - `BarWithThresholdAgent` for bars with thresholds
  - `PieChartAgent`, `ScatterChartAgent`, etc.
- Each agent calls **OpenAI GPT-4** with specialized prompts
- Generates `TravelChartSpec` with data, config, styling, metadata

### Stage 2: Variation Agent Generation
- If `hasFieldFilter: true`, uses variation agents:
  - `HorizontalBarVariationAgent`
  - `BarWithMeanVariationAgent` 
  - `BarWithThresholdVariationAgent`
- Generates filter-specific data variations
- Stores in `backupData` for instant filter switching

### Stage 3: Vega-Lite Conversion
- **SpecCreator** converts `TravelChartSpec` to `VegaLiteSpec`
- Ready for rendering in interactive dashboard

## Setup Instructions

1. **Environment Setup**:
   ```bash
   cd Visplora/client
   export OPENAI_API_KEY="your-openai-api-key-here"
   ```

2. **Run the Script**:
   ```bash
   node src/scripts/generateChartSpecs.js example4_data.json example4_data_output.json
   ```

## Usage

### Input Format
Place input files in:
- `Visplora/client/public/examples/scenario1/`
- `Visplora/client/public/examples/scenario2/`

Input structure (like `example4_data.json`):
```json
[
  {
    "sentence_id": 1,
    "charts": [
      {
        "name": "Tourist Arrivals by Destination - Horizontal Bar",
        "request": {
          "userQuery": "Show annual tourist arrivals by destination with year filtering",
          "constraints": {
            "chartType": "bar",
            "subtype": "horizontalBarSpec",
            "nodeSize": "medium",
            "dataCategory": "visitor-flow",
            "destinations": ["Tokyo", "Paris", "London", "New York"],
            "maxDataPoints": 5,
            "hasFieldFilter": true,
            "filterConfig": {
              "filterType": "year",
              "filterKey": "selectedYear",
              "filterLabel": "Year",
              "defaultValue": "2023",
              "options": [
                { "label": "2022", "value": "2022", "displayName": "2022" },
                { "label": "2023", "value": "2023", "displayName": "2023" },
                { "label": "2024", "value": "2024", "displayName": "2024" }
              ]
            }
          }
        }
      }
    ]
  }
]
```

### Output Format
Output saved in same directory as input, structured like `demo_output.json`:
```json
{
  "sentence_id": 1,
  "charts": [
    {
      "id": "chart-0",
      "name": "Tourist Arrivals by Destination - Horizontal Bar",
      "request": { /* original request */ },
      "chartSpec": { /* generated TravelChartSpec */ },
      "vegaSpec": { /* Vega-Lite specification */ },
      "generationTime": 1234,
      "success": true,
      "error": null
    }
  ]
}
```

## Multiple Sentences Support

The script handles multiple sentences automatically:
- Processes `sentence_id: 1` through `sentence_id: n`
- Each sentence can contain multiple charts
- Generates all chart specifications for all sentences

## Chart Types Supported

### Bar Charts
- `horizontalBarSpec` - Basic horizontal bars
- `barChartWithMean` - Bars with mean line
- `barChartWithThreshold` - Bars with threshold line

### Other Types
- `pie` - Pie charts with distribution
- `scatter` - Scatter plots for relationships  
- `line` - Line charts for trends
- `multiType` - Combined chart types

## Interactive Features

When `hasFieldFilter: true`:
- Generates `backupData` with filter variations
- Supports filter types: `year`, `region`, `season`, `budget_level`, `trip_type`
- Enables instant filter switching without API calls

## Example Commands

```bash
# Generate from scenario1
node src/scripts/generateChartSpecs.js example4_data.json example4_data_output.json

# Generate from scenario2  
node src/scripts/generateChartSpecs.js example1.json example1_output.json
```

## Output Files

Generated files contain complete chart specifications ready for:
1. **ViewGenerator** rendering in narrative canvas
2. **Interactive dashboards** with real-time filtering
3. **Vega-Lite** visualization display

## Troubleshooting

### Missing OpenAI Key
```
⚠️ OPENAI_API_KEY not set - running in mock mode
```
- Set environment variable: `export OPENAI_API_KEY="your-key"`
- Or use mock mode for testing (generates sample data)

### Input File Not Found
```
❌ Input file example4_data.json not found in scenario1 or scenario2 directories
```
- Check file exists in `public/examples/scenario1/` or `scenario2/`
- Verify filename spelling

### Agent Generation Failed
```
❌ Agent generation failed: No agent available for chart type: bar
```
- Check `chartType` and `subtype` in input constraints
- Ensure valid combinations (see supported types above)

## Integration with ViewGenerator

After generating chart specifications, update the ViewGenerator to:
1. Read the output JSON files
2. Render each chart in a grid layout
3. Support interactive filtering
4. Match the travel-agent-simulator dashboard style