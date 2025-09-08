# Chart Specification Generator

This system generates chart specifications from narrative example files using OpenAI GPT-4.

## How it works:

1. **Input**: Example JSON files with `exploration_path` containing narrative sentences
2. **Processing**: Each sentence is analyzed by GPT-4 to determine optimal chart specifications
3. **Output**: Generated chart specifications in `*_data.json` format

## Features:

### Supported Chart Types:
- **Line Charts**: `multiLineLabelSpec`, `lineChartWithMean`, `lineChartWithThreshold`
- **Bar Charts**: `horizontalBar`, `divergingBar`, `barChartWithThreshold`, `barChartWithMean`
- **Multi-Type Charts**: `barChartWithLineSpec`, `multiType_same_y_diff_type`, `multiTypeWithThreshold`, `multiTypeWithMean`
- **Scatter Charts**: `bubblePlotScatterSpec`
- **Map Charts**: `worldInteractiveMap`
- **Pie Charts**: `interactivePieSpec`

### Interactive Features:
- **Filter Support**: Pie and bar charts automatically get filter configurations
- **Filter Types**: budget_level, region, season, trip_type, year
- **Node Sizes**: Automatic sizing (pie=medium, bar=medium/xlarge, others=xlarge)

### Data Categories:
- cost, safety, visitor-flow, environmental, reviews, cultural
- demographics, recovery-analysis, economics, sustainability
- wildlife, revenue, accessibility, geographic, seasonal-tourism

## Usage:

1. Navigate to `/chart-spec-generator`
2. Select an example JSON file (e.g., `scenario1/example4.json`)
3. Click "Generate Chart Specifications with AI"
4. Review generated specifications
5. Output saved as `*_data.json` in the same directory

## API Endpoints:

- `POST /api/generate-chart-specs` - Main generation endpoint
- `GET /api/list-scenario-files` - Lists available input files

## Generated Output Format:

```json
[
  {
    "sentence_id": 1,
    "charts": [
      {
        "name": "Chart Name",
        "request": {
          "userQuery": "Description",
          "constraints": {
            "chartType": "bar",
            "subtype": "horizontalBar",
            "nodeSize": "medium",
            "dataCategory": "visitor-flow",
            "destinations": ["Tokyo", "Paris"],
            "maxDataPoints": 5,
            "hasFieldFilter": true,
            "filterConfig": {
              "filterType": "region",
              "filterKey": "selectedRegion",
              "filterLabel": "Region",
              "defaultValue": "Asia",
              "options": [...]
            }
          }
        }
      }
    ]
  }
]
```

This format is compatible with the existing chart generation system and can be used directly by the travel agent visualization system.