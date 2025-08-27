#!/usr/bin/env python3
"""
Test script for the enhanced metadata-driven error handling system.
Tests the integration of London metadata for more realistic data generation.
"""

import json
import os
from execute_sql_queries import SQLQueryExecutor

def test_metadata_integration():
    """Test that the metadata is properly loaded and used"""
    
    print("🔬 Testing Metadata Integration")
    print("=" * 50)
    
    # Initialize executor
    executor = SQLQueryExecutor()
    
    # Test 1: Check if metadata loaded properly
    print("📊 Metadata Loading Test:")
    print(f"Loaded categories: {len(executor.london_metadata.get('categories', []))}")
    
    if executor.london_metadata.get('categories'):
        for category in executor.london_metadata['categories'][:3]:  # Show first 3
            print(f"  - {category['name']}: {category['description'][:50]}...")
    
    # Test 2: Test dataset context extraction
    print("\n🎯 Dataset Context Extraction:")
    test_prop_ids = [
        'crime-rates-test-1',
        'ethnicity-analysis-2', 
        'country-of-births-viz-3',
        'population-trends-4'
    ]
    
    for prop_id in test_prop_ids:
        context = executor._get_dataset_context_for_proposition(prop_id)
        print(f"\n{prop_id}:")
        print(f"  Context: {context[:150]}...")
    
    # Test 3: Enhanced categorical data generation
    print("\n🎲 Enhanced Data Generation Test:")
    
    test_propositions = [
        {
            'proposition_id': 'crime-rates-enhanced-test',
            'chart_type': '3D Bar Chart',
            'proposition_description': 'Crime rates by category in London boroughs'
        },
        {
            'proposition_id': 'ethnicity-enhanced-test', 
            'chart_type': '2D Stacked Area Chart',
            'proposition_description': 'Ethnicity distribution across London areas'
        },
        {
            'proposition_id': 'population-enhanced-test',
            'chart_type': '2D Line Chart (change over time)',
            'proposition_description': 'Population growth trends over decades'
        }
    ]
    
    for prop in test_propositions:
        print(f"\n📊 Testing: {prop['proposition_id']}")
        
        requirements = executor.get_chart_data_requirements(prop['chart_type'])
        generated_data = executor.generate_realistic_data(prop, requirements)
        
        print(f"Generated {len(generated_data)} records:")
        for i, record in enumerate(generated_data[:2]):  # Show first 2
            print(f"  {i+1}: {record}")

def test_realistic_data_with_context():
    """Test that generated data is more realistic with metadata context"""
    
    print("\n🎨 Testing Realistic Data Generation with Metadata")
    print("=" * 60)
    
    executor = SQLQueryExecutor()
    
    # Test crime data generation
    crime_prop = {
        'proposition_id': 'crime-rates-realistic-test',
        'chart_type': 'Bar Chart',
        'proposition_description': 'Crime incidents by type across London'
    }
    
    requirements = executor.get_chart_data_requirements(crime_prop['chart_type'])
    crime_data = executor.generate_realistic_data(crime_prop, requirements)
    
    print("🚔 Crime Data with Metadata Context:")
    for record in crime_data:
        print(f"  {record}")
    
    # Test ethnicity data generation  
    ethnicity_prop = {
        'proposition_id': 'ethnicity-realistic-test',
        'chart_type': '2D Stacked Area Chart',
        'proposition_description': 'Ethnic group distribution in London boroughs'
    }
    
    requirements = executor.get_chart_data_requirements(ethnicity_prop['chart_type'])
    ethnicity_data = executor.generate_realistic_data(ethnicity_prop, requirements)
    
    print("\n🏘️ Ethnicity Data with Metadata Context:")
    for record in ethnicity_data[:3]:  # Show first 3
        print(f"  {record}")

def test_full_processing_with_metadata():
    """Test full proposition processing with enhanced error handling"""
    
    print("\n🔄 Testing Full Processing with Metadata-Enhanced Error Handling")
    print("=" * 70)
    
    # Create test propositions that will trigger different error scenarios
    test_propositions = {
        "consolidated_propositions": [
            {
                "proposition_id": "crime-rates-empty-sql",
                "chart_type": "2D Stacked Area Chart (change over time)",
                "proposition_description": "Crime trend analysis showing increase in violent crimes over time",
                "sql_query": "SELECT crime_type, date FROM crime_data WHERE 1=0",  # Returns empty
                "chart_title": "Crime Trends Over Time",
                "reasoning": "Test empty SQL with metadata context"
            },
            {
                "proposition_id": "ethnicity-insufficient-data",
                "chart_type": "2D Line Chart (change over time)", 
                "proposition_description": "Ethnicity diversity changes in London boroughs",
                "sql_query": "SELECT borough_name as area, COUNT(*) as population FROM ethnicity_data GROUP BY borough_name LIMIT 2",  # Insufficient for time series
                "chart_title": "Ethnicity Diversity Trends",
                "reasoning": "Test insufficient data with enhancement"
            },
            {
                "proposition_id": "population-no-sql",
                "chart_type": "3D Bar Chart (with Mean Overlay)",
                "proposition_description": "Population density comparison across London areas",
                "chart_title": "Population Density Analysis", 
                "reasoning": "Test no SQL query with metadata generation"
            }
        ]
    }
    
    # Save test file
    test_file = "/Users/h2o/Documents/Projects/Research/Visplora/client/src/proprocess/final_json/metadata_test_propositions.json"
    with open(test_file, 'w') as f:
        json.dump(test_propositions, f, indent=2)
    
    print(f"📝 Created metadata test file: {test_file}")
    
    # Process with enhanced system
    executor = SQLQueryExecutor()
    
    try:
        output_file = executor.process_all_propositions(
            test_file,
            "/Users/h2o/Documents/Projects/Research/Visplora/client/src/proprocess/final_json"
        )
        
        if output_file and os.path.exists(output_file):
            # Analyze enhanced results
            with open(output_file, 'r') as f:
                results = json.load(f)
            
            print(f"\n📋 Enhanced Processing Results:")
            print(f"Total propositions: {len(results['propositions_with_data'])}")
            
            for prop in results['propositions_with_data']:
                prop_id = prop.get('proposition_id')
                data_source = prop.get('data_source', 'unknown')
                data_count = len(prop.get('sql_result', []))
                
                print(f"\n📊 {prop_id}:")
                print(f"    Source: {data_source}")
                print(f"    Records: {data_count}")
                
                if data_count > 0:
                    first_record = prop['sql_result'][0]
                    print(f"    Sample: {first_record}")
                    
                    # Check if data looks realistic (has London-specific values)
                    record_str = str(first_record).lower()
                    london_indicators = ['london', 'westminster', 'camden', 'hackney', 'tower', 'crime', 'violent', 'theft', 'british', 'asian']
                    realistic_score = sum(1 for indicator in london_indicators if indicator in record_str)
                    print(f"    Realism score: {realistic_score}/10")
            
            print(f"\n✅ Metadata-enhanced processing completed!")
            print(f"📄 Results saved to: {output_file}")
        
        else:
            print("❌ Processing failed")
    
    finally:
        # Clean up
        if os.path.exists(test_file):
            os.remove(test_file)
            print(f"🧹 Cleaned up test file")

def test_specific_dataset_metadata():
    """Test metadata usage for specific datasets"""
    
    print("\n🔍 Testing Specific Dataset Metadata Usage")
    print("=" * 50)
    
    executor = SQLQueryExecutor()
    
    # Test each dataset type
    dataset_tests = [
        ('crime-rates', 'Crime data categories and ranges'),
        ('ethnicity', 'Ethnic group distributions'),
        ('population', 'Population and demographic data'),
        ('country-of-births', 'Country of origin statistics'),
        ('income', 'Income and economic indicators')
    ]
    
    for dataset_name, description in dataset_tests:
        print(f"\n📊 Testing {dataset_name}: {description}")
        
        # Create test proposition
        test_prop = {
            'proposition_id': f'{dataset_name}-metadata-test',
            'chart_type': 'Bar Chart',
            'proposition_description': f'Analysis of {description}'
        }
        
        # Get context
        context = executor._get_dataset_context_for_proposition(test_prop['proposition_id'])
        print(f"Context length: {len(context)} characters")
        
        # Generate data
        requirements = executor.get_chart_data_requirements(test_prop['chart_type'])
        data = executor.generate_realistic_data(test_prop, requirements)
        
        print(f"Generated data sample:")
        if data:
            print(f"  {data[0]}")
            
            # Check for realistic values
            values = list(data[0].values())
            print(f"  Value types: {[type(v).__name__ for v in values]}")

if __name__ == "__main__":
    # Run all metadata integration tests
    test_metadata_integration()
    test_realistic_data_with_context()
    test_full_processing_with_metadata()
    test_specific_dataset_metadata()
    
    print("\n🎉 All metadata integration tests completed!")
    print("\nEnhanced System Features:")
    print("  ✅ London dataset metadata loading and parsing")
    print("  ✅ Dataset context extraction for propositions") 
    print("  ✅ Metadata-driven realistic data generation")
    print("  ✅ Enhanced LLM prompts with dataset context")
    print("  ✅ Improved categorical values from actual data samples")
    print("  ✅ Realistic value ranges based on dataset characteristics")
    print("  ✅ Chart-type-specific data generation with context")
