# SQL Query Executor for Chart Propositions

This directory contains tools to execute SQL queries from validated chart propositions and generate final JSON datasets with actual data results.

## 📁 Files Overview

- **`execute_sql_queries.py`** - Main script that executes SQL queries from propositions
- **`test_single_query.py`** - Test individual propositions for debugging
- **`usage_examples.py`** - Examples of how to use the tools
- **`final_data_all_propositions.json`** - Output file with all executed propositions

## 🚀 Quick Start

### Execute All Propositions
```bash
python execute_sql_queries.py --input ../vanna_sql/output/test_one_per_chart_type_results.json --output .
```

### Execute Specific Proposition
```bash
python execute_sql_queries.py --id "crime-rates_statistical_patterns_stat_001"
```

### Test Single Query
```bash
python test_single_query.py "crime-rates_chart_analysis_groupedBarChart_simple_2D_001"
```

## 📊 Output Format

The final JSON contains:

```json
{
  "processing_metadata": {
    "processed_at": "2025-08-20T15:42:39.728902",
    "total_propositions": 29,
    "successful_executions": 29,
    "failed_executions": 0,
    "source_file": "path_to_input"
  },
  "propositions_with_data": [
    {
      "proposition_id": "unique_identifier",
      "proposition_description": "What the chart shows",
      "reasoning": "Why this chart type was chosen",
      "chart_type": "type_of_chart_2D_or_3D",
      "chart_title": "Title for the chart",
      "chart_description": "Detailed description",
      "sql_result": [
        {"column1": "value1", "column2": "value2"},
        {"column1": "value3", "column2": "value4"}
      ],
      "mean": 123.45,          // Only if chart has mean calculation
      "threshold": true        // Only if chart has threshold condition
    }
  ]
}
```

## 🔧 Features

### Dataset Support
- **Crime Data** - London crime rates 2022-2023 (705,508 records)
- **Ethnicity Data** - London ethnic group distribution (4,994 records)  
- **Birth Country Data** - Country of births by borough (14,700 records)
- **Population Data** - Historical London population (38 records)
- **Income Data** - Borough income statistics (55 records)
- **House Prices** - Property values by area (12,015 records)
- **Education Data** - School information (25,386 records)
- **Vehicle Data** - Vehicle registrations by type (54 records)
- **Restaurant Data** - Licensed establishments (51 records)
- **Rent Data** - Private rental prices (6,159 records)
- **Gym Data** - Fitness facilities (445 records)
- **Library Data** - Library locations (37 records)

### Chart Types Supported (29 total)
- **Simple Charts** - Basic 2D and 3D visualizations
- **Charts with Mean** - Include statistical mean overlays
- **Charts with Threshold** - Include threshold/benchmark lines
- **Combined Charts** - Bar+Line combinations, divergent charts, etc.

### SQL Processing Features
- Automatic SQL cleaning and validation
- SQLite in-memory database execution
- Column name standardization
- Error handling and reporting
- Result limiting for performance
- Mean calculation for statistical charts
- Threshold detection for conditional charts

## 📈 Chart Types Processed

### By Category:
- **Area Charts**: 3 (simple 2D/3D, stacked)
- **Bar Charts**: 3 (simple, with mean, 3D)
- **Combo Charts**: 4 (bar+line combinations)
- **Divergent Charts**: 4 (simple, with mean/threshold)
- **Line Charts**: 4 (simple, with mean/threshold)
- **Scatter Plots**: 4 (simple, with mean/threshold)
- **Others**: Donut, Histogram, Heatmap, Grouped Bar, Multi-line

### By Enhancement:
- **Simple Charts**: 20
- **With Mean Calculation**: 5
- **With Threshold Condition**: 4

## 🛠 Command Line Options

```bash
python execute_sql_queries.py [OPTIONS]

Options:
  --input, -i    Input JSON file path [default: test results file]
  --output, -o   Output directory [default: current directory]
  --id          Specific proposition ID to process
  --max-rows    Maximum rows per query [default: 100]
```

## 📋 Example Propositions

### High-Performing Queries:
- **crime-rates_statistical_patterns_stat_001**: Crime frequency distribution (14 results)
- **crime-rates_chart_analysis_groupedBarChart_simple_2D_001**: Crime by borough and type (100 results)
- **ethnicity_chart_analysis_groupedBarChart_simple_3D_002**: Ethnic diversity visualization (4 ethnic groups)

### Mean Calculations:
- **country-of-births_categorical_analysis_ca_003**: Birth rates with statistical mean
- **crime-rates_trend_lineChart_with_mean_2D_016**: Crime trends vs average
- **ethnicity_chart_analysis_comboBarLine_014**: Borough diversity with mean overlay

### Threshold Conditions:
- **house-prices_property_value_divergentBarChart_with_threshold_2D_003**: Property values above/below threshold
- **restaurants_trend_lineChart_with_threshold_2D_020**: Employment above 10,000 jobs threshold

## 🔍 Debugging

Use the test script to debug individual propositions:
```bash
python test_single_query.py "proposition_id_here"
```

This will show:
- SQL query being executed  
- Number of results returned
- Sample data rows
- Mean values (if applicable)
- Threshold flags (if applicable)

## 📊 Success Metrics

Recent execution results:
- **Total Propositions**: 29
- **Successful Executions**: 29 (100%)
- **Failed Executions**: 0 (0%)
- **Average Results per Query**: ~45 records
- **Processing Time**: ~2-3 minutes for all propositions

## 🎯 Use Cases

1. **Chart Generation** - Use `sql_result` data to render actual charts
2. **Statistical Analysis** - Use `mean` values for baseline comparisons  
3. **Threshold Visualization** - Use `threshold` flag for conditional formatting
4. **Data Exploration** - Browse actual London dataset patterns
5. **Validation** - Verify proposition accuracy with real data
