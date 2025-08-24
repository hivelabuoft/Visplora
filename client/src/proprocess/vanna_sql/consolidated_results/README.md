# Three-Layer Integration System

This system consolidates data from three processing layers:
1. **Layer1**: Original propositions with descriptions and metadata
2. **Layer2**: SQL query generation with example data structures  
3. **Layer3**: Vanna AI validation with SQL fixing and enhancement

## Key Features

### 🔗 Complete Integration
- Matches propositions across all three layers by `proposition_id`
- Merges all relevant fields into final consolidated output
- Handles missing data gracefully with fallback logic

### 🧮 Auxiliary Query Generation  
- Automatically detects chart types requiring mean/threshold calculations
- Generates additional SQL queries for `_with_mean` and `_with_threshold` charts
- Uses Vanna AI to create contextually appropriate calculation queries

### 📊 Enhanced Validation
- Validates all SQL queries through Vanna AI integration
- Fixes syntax errors and optimizes query performance
- Ensures compatibility with available dataset schemas

### 📁 Flexible Output Structure
The final output includes:
```json
{
  "proposition_id": "unique_identifier",
  "proposition_description": "human_readable_description", 
  "reasoning": "why_this_chart_is_appropriate",
  "chart_type": "chart_type_with_variants",
  "chart_title": "display_title",
  "chart_description": "detailed_description",
  "sql_query": "validated_and_fixed_sql",
  "example": [{"time": "2022-01", "value": 42}],
  "variables_needed": ["required_data_fields"],
  "time_period": "analysis_timeframe",
  "geographic_level": "data_granularity",
  "with_mean": null_or_sql_query,
  "with_threshold": true/false
}
```

### 🧮 Mean Query Generation
- **`with_mean`**: Contains `null` for charts without mean calculations, or the actual SQL query for mean calculation when chart type contains `_with_mean`
- **`with_threshold`**: Boolean value indicating if chart type contains `_with_threshold`

## Usage

### Quick Start
```bash
cd /Users/h2o/Documents/Projects/Research/Visplora/client/src/proprocess/vanna_sql
python three_layer_integrator.py
```

### Custom Paths
Modify the paths in `main()` function:
```python
layer1_output_dir = "../preprocess/output"
layer2_output_dir = "../preprocess/output_layer2/sql_queries"  
csv_data_dir = "../../data/london_datasets_csv"
output_file = "./consolidated_results/final_propositions_complete.json"
```

## Chart Type Enhancement Detection

The system automatically analyzes chart types and generates appropriate queries:

### Mean Calculations (`_with_mean`)
- **Detection**: Chart type contains `_with_mean`
- **Output**: Generates contextual SQL query for mean calculation
- **Use Case**: Charts showing deviation from average trends with reference lines

### Threshold Detection (`_with_threshold`)  
- **Detection**: Chart type contains `_with_threshold`
- **Output**: Boolean flag indicating threshold requirement
- **Use Case**: Charts highlighting values above/below critical thresholds

### Examples
```
lineChart_with_mean_2D → with_mean: "SELECT AVG(income) FROM income_data WHERE...", with_threshold: false
barChart_with_threshold_simple → with_mean: null, with_threshold: true  
scatterChart_with_mean_with_threshold → with_mean: "SELECT AVG(...)", with_threshold: true
areaChart_simple_2D → with_mean: null, with_threshold: false
```

## Processing Flow

1. **Load Layer1**: Parse original propositions from output directory
2. **Load Layer2**: Parse SQL queries from Layer2 processing results
3. **Match Propositions**: Find corresponding entries by proposition_id
4. **Vanna Validation**: Validate and fix SQL queries using AI
5. **Auxiliary Generation**: Create mean/threshold queries when needed
6. **Consolidation**: Merge all data into final structure
7. **Save Results**: Export consolidated propositions with metadata

## Output Structure

### Main Results File
- `consolidated_results/final_propositions_complete.json`
- Contains all propositions with complete three-layer integration
- Includes processing metadata and statistics

### Statistics Included
- Total propositions processed
- Chart type distribution
- Enhancement breakdown (mean/threshold/both/simple)
- Processing timestamps and success rates

## Error Handling

- **Missing Data**: Graceful handling of incomplete propositions
- **SQL Validation Failures**: Fallback to original queries with warnings
- **Auxiliary Query Errors**: Simple fallback queries with statistical functions
- **File Loading Issues**: Detailed error reporting with file paths

## Dependencies

- `vanna_setup.py`: AI SQL validation capabilities
- Layer1 proposition outputs in JSON format
- Layer2 SQL query outputs in JSON format  
- CSV dataset files for schema validation

## Monitoring

The system provides comprehensive progress tracking:
- Real-time processing status updates
- Error reporting with stack traces
- Statistics summary at completion
- Detailed logging of auxiliary query generation

This creates a complete data pipeline from raw propositions to production-ready chart configurations with validated SQL queries and enhanced analytical capabilities.
