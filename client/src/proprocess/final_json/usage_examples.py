#!/usr/bin/env python3
"""
SQL Query Executor Usage Examples
Demonstrates how to use the execute_sql_queries.py script
"""

import os
import subprocess
import json

def run_example(description, command):
    """Run an example command and show results"""
    print(f"\n🔍 {description}")
    print(f"Command: {' '.join(command)}")
    print("-" * 50)
    
    result = subprocess.run(command, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Success!")
        # Show last few lines of output
        lines = result.stdout.strip().split('\n')
        for line in lines[-10:]:
            print(line)
    else:
        print(f"❌ Error: {result.stderr}")

def main():
    """Run usage examples"""
    print("🚀 SQL Query Executor Usage Examples")
    print("=" * 60)
    
    # Example 1: Process all propositions
    run_example(
        "Process all propositions and generate complete dataset",
        ["python", "execute_sql_queries.py", 
         "--input", "../vanna_sql/output/test_one_per_chart_type_results.json",
         "--output", ".", 
         "--max-rows", "25"]
    )
    
    # Example 2: Process specific proposition
    run_example(
        "Process a specific proposition by ID",
        ["python", "execute_sql_queries.py",
         "--input", "../vanna_sql/output/test_one_per_chart_type_results.json",
         "--output", ".",
         "--id", "crime-rates_statistical_patterns_stat_001"]
    )
    
    # Example 3: Test single query
    run_example(
        "Test a single query in isolation",
        ["python", "test_single_query.py", "crime-rates_chart_analysis_groupedBarChart_simple_2D_001"]
    )
    
    print(f"\n📁 Generated Files:")
    print(f"- final_data_all_propositions.json (all propositions)")
    print(f"- final_data_<proposition_id>.json (specific proposition)")
    
    print(f"\n📊 JSON Structure:")
    print(f"""
    {{
      "processing_metadata": {{
        "processed_at": "timestamp",
        "total_propositions": number,
        "successful_executions": number,
        "failed_executions": number,
        "source_file": "path"
      }},
      "propositions_with_data": [
        {{
          "proposition_id": "unique_id",
          "proposition_description": "description",
          "reasoning": "why this chart type",
          "chart_type": "type_of_chart",
          "chart_title": "title",
          "chart_description": "description",
          "sql_result": [{{actual data}}],
          "mean"?: number (if with_mean),
          "threshold"?: true/false (if with_threshold)
        }}
      ]
    }}
    """)

if __name__ == "__main__":
    main()
