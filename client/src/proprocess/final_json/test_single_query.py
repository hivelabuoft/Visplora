#!/usr/bin/env python3
"""
Test a single SQL query from propositions
"""

from execute_sql_queries import SQLQueryExecutor
import json

def test_single_proposition(proposition_id):
    """Test a specific proposition by ID"""
    
    # Load the propositions file
    with open('../vanna_sql/output/test_one_per_chart_type_results.json', 'r') as f:
        data = json.load(f)
    
    # Find the proposition
    propositions = data.get('consolidated_propositions', [])
    target_prop = None
    
    for prop in propositions:
        if prop.get('proposition_id') == proposition_id:
            target_prop = prop
            break
    
    if not target_prop:
        print(f"❌ Proposition '{proposition_id}' not found")
        return
    
    # Initialize executor
    executor = SQLQueryExecutor()
    
    # Test the proposition
    print(f"🧪 Testing proposition: {proposition_id}")
    print(f"📝 SQL Query: {target_prop.get('sql_query', 'N/A')[:200]}...")
    
    result = executor.process_proposition(target_prop)
    
    print(f"\n📊 Results:")
    print(f"Chart Type: {result.get('chart_type')}")
    print(f"SQL Result Length: {len(result.get('sql_result', []))}")
    
    if 'mean' in result:
        print(f"Mean Value: {result['mean']}")
    
    if 'threshold' in result:
        print(f"Has Threshold: {result['threshold']}")
    
    if result.get('sql_result'):
        print(f"\nFirst few results:")
        for i, row in enumerate(result['sql_result'][:3]):
            print(f"  {i+1}: {row}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python test_single_query.py <proposition_id>")
        print("\nExample proposition IDs:")
        print("- country-of-births_categorical_analysis_ca_001")
        print("- crime-rates_statistical_patterns_stat_001") 
        print("- crime-rates_chart_analysis_groupedBarChart_simple_2D_001")
        sys.exit(1)
    
    proposition_id = sys.argv[1]
    test_single_proposition(proposition_id)
