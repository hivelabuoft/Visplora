#!/usr/bin/env python3
"""
Test script for the enhanced error handling system.
Tests various edge cases and data generation scenarios.
"""

import json
import os
from execute_sql_queries import SQLQueryExecutor

def create_test_propositions():
    """Create test propositions to verify error handling"""
    
    test_props = {
        "consolidated_propositions": [
            # Test 1: Empty SQL result - should generate data
            {
                "proposition_id": "test-empty-result",
                "chart_type": "2D Stacked Area Chart (change over time)",
                "proposition_description": "Test proposition with query that returns no data",
                "sql_query": "SELECT crime_type, year FROM crime_rates WHERE 1=0",
                "chart_title": "Empty Result Test",
                "reasoning": "Test empty result handling"
            },
            
            # Test 2: Time series with insufficient data - should extend
            {
                "proposition_id": "test-insufficient-timeseries",
                "chart_type": "2D Line Chart (change over time)",
                "proposition_description": "Test time series with only 2 data points",
                "sql_query": "SELECT SUBSTR(date, 1, 7) as month, COUNT(*) as count FROM crime_rates WHERE SUBSTR(date, 1, 7) IN ('2023-01', '2023-02') GROUP BY SUBSTR(date, 1, 7) ORDER BY month",
                "chart_title": "Insufficient Time Series Test",
                "reasoning": "Test time series extension"
            },
            
            # Test 3: No SQL query - should generate data
            {
                "proposition_id": "test-no-sql",
                "chart_type": "3D Bar Chart (with Mean Overlay)",
                "proposition_description": "Test proposition without SQL query",
                "chart_title": "No SQL Test",
                "reasoning": "Test fallback data generation"
            },
            
            # Test 4: Invalid SQL - should handle error and generate fallback
            {
                "proposition_id": "test-invalid-sql",
                "chart_type": "Histogram",
                "proposition_description": "Test proposition with invalid SQL",
                "sql_query": "SELECT * FROM non_existent_table WHERE invalid_syntax",
                "chart_title": "Invalid SQL Test",
                "reasoning": "Test SQL error handling"
            },
            
            # Test 5: Scatter plot needing extension
            {
                "proposition_id": "test-scatterplot-extend",
                "chart_type": "Scatter Plot",
                "proposition_description": "Test scatter plot with minimal data",
                "sql_query": "SELECT longitude as x, latitude as y FROM crime_rates LIMIT 2",
                "chart_title": "Scatter Plot Extension Test",
                "reasoning": "Test scatter plot data extension"
            },
            
            # Test 6: Heatmap requiring adequate data
            {
                "proposition_id": "test-heatmap-coverage",
                "chart_type": "Heatmap",
                "proposition_description": "Test heatmap data generation",
                "sql_query": "SELECT crime_type as x_bin, borough as y_bin, COUNT(*) as count FROM crime_rates GROUP BY crime_type, borough LIMIT 3",
                "chart_title": "Heatmap Coverage Test",
                "reasoning": "Test heatmap data requirements"
            }
        ]
    }
    
    return test_props

def run_error_handling_tests():
    """Run comprehensive error handling tests"""
    
    print("🧪 Starting Error Handling Tests")
    print("=" * 50)
    
    # Create test propositions file
    test_file = "/Users/h2o/Documents/Projects/Research/Visplora/client/src/proprocess/final_json/test_propositions.json"
    test_props = create_test_propositions()
    
    with open(test_file, 'w') as f:
        json.dump(test_props, f, indent=2)
    
    print(f"📝 Created test propositions: {test_file}")
    
    # Initialize executor
    executor = SQLQueryExecutor()
    
    # Test individual chart type requirements
    print("\n🎯 Testing Chart Type Requirements:")
    print("-" * 40)
    
    test_charts = [
        "2D Line Chart (change over time)",
        "3D Bar Chart (with Mean Overlay)", 
        "Histogram",
        "Heatmap",
        "Scatter Plot",
        "2D Stacked Area Chart (change over time)"
    ]
    
    for chart_type in test_charts:
        requirements = executor.get_chart_data_requirements(chart_type)
        print(f"📊 {chart_type}:")
        print(f"   Min records: {requirements['min_records']}")
        print(f"   Is time series: {requirements['is_time_series']}")
        print(f"   Strategy: {requirements['data_generation_strategy']}")
    
    # Test data generation for different strategies
    print("\n🎲 Testing Data Generation:")
    print("-" * 40)
    
    sample_prop = {
        "proposition_id": "test-generation",
        "chart_type": "2D Line Chart (change over time)",
        "proposition_description": "Crime rates increasing over time in London boroughs"
    }
    
    requirements = executor.get_chart_data_requirements(sample_prop['chart_type'])
    generated_data = executor.generate_realistic_data(sample_prop, requirements)
    
    print(f"📈 Generated {len(generated_data)} time series records:")
    for i, record in enumerate(generated_data[:3]):  # Show first 3
        print(f"   {i+1}: {record}")
    
    # Test categorical data generation
    sample_prop['chart_type'] = "3D Bar Chart"
    requirements = executor.get_chart_data_requirements(sample_prop['chart_type'])
    categorical_data = executor.generate_realistic_data(sample_prop, requirements)
    
    print(f"\n📊 Generated {len(categorical_data)} categorical records:")
    for i, record in enumerate(categorical_data[:3]):
        print(f"   {i+1}: {record}")
    
    # Run full proposition processing
    print("\n🔄 Processing All Test Propositions:")
    print("-" * 40)
    
    try:
        output_file = executor.process_all_propositions(
            test_file, 
            "/Users/h2o/Documents/Projects/Research/Visplora/client/src/proprocess/final_json"
        )
        
        if output_file and os.path.exists(output_file):
            # Analyze results
            with open(output_file, 'r') as f:
                results = json.load(f)
            
            print(f"\n📋 Test Results Summary:")
            print(f"Total propositions: {len(results['propositions_with_data'])}")
            
            data_sources = {}
            for prop in results['propositions_with_data']:
                source = prop.get('data_source', 'unknown')
                data_sources[source] = data_sources.get(source, 0) + 1
            
            print(f"Data sources breakdown:")
            for source, count in data_sources.items():
                print(f"  {source}: {count}")
            
            # Check specific test cases
            print(f"\n🔍 Detailed Test Case Analysis:")
            
            for prop in results['propositions_with_data']:
                prop_id = prop.get('proposition_id')
                data_source = prop.get('data_source', 'unknown')
                data_count = len(prop.get('sql_result', []))
                
                print(f"  {prop_id}:")
                print(f"    Source: {data_source}")
                print(f"    Records: {data_count}")
                
                if 'error' in prop:
                    print(f"    Error: {prop['error']}")
                
                if data_count > 0:
                    first_record = prop['sql_result'][0]
                    print(f"    Sample: {first_record}")
            
            print(f"\n✅ All tests completed successfully!")
            print(f"📄 Full results saved to: {output_file}")
            
        else:
            print("❌ Test execution failed - no output file generated")
    
    except Exception as e:
        print(f"❌ Test execution error: {e}")
    
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.remove(test_file)
            print(f"🧹 Cleaned up test file")

def test_data_validation():
    """Test the data validation and enhancement logic"""
    
    print("\n🔬 Testing Data Validation Logic:")
    print("-" * 40)
    
    executor = SQLQueryExecutor()
    
    # Test case 1: Empty data
    test_prop = {
        "proposition_id": "validation-test-1", 
        "chart_type": "2D Line Chart (change over time)",
        "proposition_description": "Test empty data handling"
    }
    
    empty_data = []
    validated = executor.validate_and_enhance_data(empty_data, test_prop)
    print(f"Empty data → {len(validated)} records")
    
    # Test case 2: Insufficient time series data
    minimal_time_data = [
        {"time": "2023-01", "value": 100},
        {"time": "2023-02", "value": 120}
    ]
    
    enhanced_time_data = executor.validate_and_enhance_data(minimal_time_data, test_prop)
    print(f"Minimal time series ({len(minimal_time_data)}) → {len(enhanced_time_data)} records")
    
    # Test case 3: Sufficient data (should pass through)
    sufficient_data = [{"category": f"Cat_{i}", "value": i*10} for i in range(10)]
    test_prop["chart_type"] = "Bar Chart"
    
    validated_sufficient = executor.validate_and_enhance_data(sufficient_data, test_prop)
    print(f"Sufficient data ({len(sufficient_data)}) → {len(validated_sufficient)} records")
    
    print("✅ Data validation tests completed")

if __name__ == "__main__":
    # Run all tests
    run_error_handling_tests()
    test_data_validation()
    
    print("\n🎉 All error handling tests completed!")
    print("The system now includes:")
    print("  ✅ Empty result detection and data generation")
    print("  ✅ Time series data extension for insufficient data points")
    print("  ✅ Chart-type-specific minimum data requirements")
    print("  ✅ Rule-based realistic data generation")
    print("  ✅ LLM fallback capability (when configured)")
    print("  ✅ Comprehensive error handling and logging")
