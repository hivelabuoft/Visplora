# Enhanced SQL Query Executor with Metadata-Driven Error Handling

## Overview

The SQL Query Executor has been significantly enhanced with sophisticated error handling and metadata-driven data generation capabilities. The system now provides intelligent fallbacks when SQL queries return empty results or insufficient data, ensuring that all chart propositions receive meaningful, realistic data for visualization.

## Key Enhancements

### 1. **Metadata Integration**
- **London Dataset Metadata Loading**: Automatically loads comprehensive metadata from `/public/data/london_metadata.json`
- **Dataset Context Extraction**: Provides rich context about columns, value examples, and data samples for each dataset
- **Realistic Value Generation**: Uses actual London data samples (boroughs, crime types, ethnicities) instead of generic placeholders

### 2. **Chart-Type-Specific Requirements**
- **Minimum Data Points**: Different chart types have different minimum data requirements
- **Time Series Charts**: Require at least 6 data points for meaningful trend visualization
- **Distribution Charts**: Need 8+ records for adequate coverage
- **Multi-dimensional Charts**: Require 5+ records with multiple dimensions

### 3. **Multi-Strategy Error Handling**

#### **Strategy 1: SQL Execution**
- Primary attempt to execute the original SQL query
- Enhanced SQL cleaning and column name standardization
- SQLite function compatibility fixes

#### **Strategy 2: Data Validation & Enhancement**
- Validates returned data against chart type requirements
- Extends insufficient time series data with realistic projections
- Maintains trend patterns from existing data

#### **Strategy 3: LLM Fallback (Enhanced)**
- Uses OpenAI GPT-4 with rich dataset context
- Comprehensive prompts including metadata, column examples, and data samples
- Contextually appropriate data generation for London demographics

#### **Strategy 4: Rule-Based Generation**
- Sophisticated rule-based data generation using metadata
- Dataset-specific realistic value ranges
- London-appropriate categories and naming

## Data Generation Strategies

### Time Series Data
```python
# Enhanced with metadata context
- Crime rates: 100-1500 incidents with temporal trends
- Population: 200,000-500,000 with growth patterns
- Income: £25,000-£65,000 with economic fluctuations
```

### Categorical Data  
```python
# Uses actual London metadata values
- Boroughs: "Westminster", "Camden", "Hackney", "Tower Hamlets"
- Crime Types: "violent-crime", "theft", "burglary", "anti-social-behaviour"
- Ethnicities: "White British", "Asian", "Black", "Mixed", "Other"
```

### Geographic Data
```python
# Real London area names from metadata
- Area Names: "Barking and Dagenham 002", "City of London", "Barnet"
- Realistic coordinates and density values
```

## Usage Examples

### Basic Execution
```bash
python execute_sql_queries.py --input propositions.json
```

### Single Proposition Testing
```bash
python execute_sql_queries.py --input propositions.json --id crime-rates-analysis-1
```

### With Custom Output Directory
```bash
python execute_sql_queries.py --input propositions.json --output /path/to/output
```

## Error Handling Flow

1. **Load Metadata**: Parse London dataset metadata for context
2. **Execute SQL**: Attempt original query execution
3. **Validate Results**: Check if data meets chart type requirements
4. **Apply Enhancement**: 
   - If empty: Generate new data using LLM/rules
   - If insufficient: Extend existing data intelligently
   - If adequate: Pass through with optional enrichment
5. **Quality Check**: Ensure realistic values and proper data types

## Output Structure

```json
{
  "proposition_id": "crime-rates-enhanced-1",
  "sql_result": [
    {"category": "Westminster", "value": 1247, "trend": "increasing"}
  ],
  "has_mean": true,
  "mean_value": 956.3,
  "has_threshold": false,
  "data_source": "enhanced", // sql|enhanced|generated|fallback
  "processing_metadata": {
    "enhancement_applied": true,
    "original_count": 2,
    "final_count": 6,
    "metadata_context": true
  }
}
```

## Data Source Types

- **sql**: Original query returned adequate data
- **enhanced**: Original data extended/improved to meet requirements  
- **generated**: New data created using metadata context
- **fallback**: Emergency data generation when other methods failed

## Validation & Testing

### Comprehensive Test Suite
- **Metadata Integration Tests**: Verify metadata loading and context extraction
- **Data Generation Tests**: Test all generation strategies with different chart types
- **Error Scenario Tests**: Validate handling of empty/insufficient/invalid SQL results
- **Realism Tests**: Check generated data for London-appropriate values and naming

### Quality Metrics
- **Realism Score**: Measures how well generated data reflects actual London characteristics
- **Completeness Score**: Ensures all required fields and data points are present
- **Consistency Score**: Validates data relationships and logical constraints

## Performance Optimizations

- **Metadata Caching**: London metadata loaded once per session
- **Intelligent Fallbacks**: Prioritized strategy selection based on available resources
- **Efficient Data Generation**: Optimized algorithms for different chart types
- **Memory Management**: Proper resource cleanup and error handling

## Integration Benefits

1. **Zero Empty Results**: Every proposition guaranteed to have visualizable data
2. **Contextually Accurate**: Generated data reflects actual London demographics
3. **Chart-Optimized**: Data generation tailored to specific visualization requirements
4. **Scalable**: Handles large batches of propositions efficiently
5. **Maintainable**: Clear separation of concerns and comprehensive logging

## Future Enhancements

- **Multi-City Support**: Extend metadata system to other cities
- **Advanced Trend Modeling**: More sophisticated time series projections
- **Interactive Configuration**: User-configurable data generation parameters
- **Real-time Updates**: Dynamic metadata refresh from live data sources
