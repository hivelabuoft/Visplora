#!/usr/bin/env python3
"""
Simplified test script to validate the five sample propositions
This version uses a basic OpenAI client directly to validate SQL
"""

import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../../../.env.local')

try:
    from openai import OpenAI
    openai_available = True
except ImportError:
    print("OpenAI not available, using mock responses")
    openai_available = False

class SimpleSQLValidator:
    """Simple SQL validator using OpenAI directly"""
    
    def __init__(self):
        if openai_available and os.getenv('OPENAI_API_KEY'):
            self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            self.available = True
        else:
            self.available = False
            print("⚠️  OpenAI API not available - will use mock validation")
    
    def validate_sql(self, sql_query, dataset, expected_output):
        """Validate SQL query using OpenAI"""
        
        if not self.available:
            # Mock validation for testing
            return {
                "status": "mock_valid",
                "issues_found": ["Mock validation - OpenAI not available"],
                "fixed_sql": sql_query,
                "analysis": "Mock analysis: SQL appears syntactically correct"
            }
        
        try:
            # Dataset schema info (simplified)
            schema_info = {
                'crime-rates': 'Columns: area_name, borough_name, lsoa_code, crime_category, crime_category_name, year, month, date. DATE FORMAT: "2022-01" (YYYY-MM)',
                'house-prices': 'Columns: borough, area, date, price, property_type. DATE FORMAT: Check actual data',
                'population': 'Columns: area, borough, year, population_count, demographic_info. DATE FORMAT: year column (integer)',
                'vehicles': 'Columns: borough, vehicle_type, registration_count, year, date. DATE FORMAT: Check actual data',
                'private-rent': 'Columns: borough, area, date, average_rent, property_size. DATE FORMAT: Check actual data'
            }
            
            prompt = f"""
            CRITICAL: You are analyzing SQL for {dataset} dataset. Before suggesting any fixes, you MUST carefully examine the actual data format.
            
            SQL Query to Analyze: {sql_query}
            
            Dataset Schema: {schema_info.get(dataset, 'Schema unknown')}
            
            Expected Output: {expected_output}
            
            IMPORTANT DATE/TIME FORMAT CHECKING:
            1. Each dataset has DIFFERENT date/time formats
            2. For crime-rates: date column contains "2022-01" format (YYYY-MM), NOT full dates
            3. For other datasets: CHECK what the actual date format is before suggesting changes
            4. NEVER assume date format - use BETWEEN ranges that match the actual data format
            5. If date column has "2022-01" format, use BETWEEN '2022-01' AND '2023-12', NOT '2022-01-01' AND '2023-12-31'
            
            Check for these issues in this exact order:
            1. FIRST: Verify the actual date/time format in the dataset
            2. Table names (should match dataset name or be reasonable)
            3. Column names (should match schema)
            4. Date filtering logic (MUST match actual date format)
            5. Syntax errors
            6. Logic errors
            
            EXAMPLES OF CORRECT DATE FILTERING:
            - If date column has "2022-01" format: WHERE date BETWEEN '2022-01' AND '2023-12'
            - If date column has full dates: WHERE date BETWEEN '2022-01-01' AND '2023-12-31'
            - If using year column (integer): WHERE year BETWEEN 2022 AND 2023
            
            DO NOT "fix" date ranges unless you're certain the current format is wrong for the actual data.
            
            Respond with:
            STATUS: [VALID/NEEDS_FIX]
            ISSUES: [list issues or NONE - be specific about date format issues]
            FIXED_SQL: [corrected SQL if needed, or SAME]
            ANALYSIS: [brief explanation focusing on date format validation]
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a SQL expert. Analyze SQL queries and provide corrections."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.1
            )
            
            analysis = response.choices[0].message.content
            
            # Parse response
            status = "valid"
            issues_found = []
            fixed_sql = sql_query
            
            if "STATUS: NEEDS_FIX" in analysis:
                status = "needs_fix"
                
            if "ISSUES:" in analysis:
                issues_part = analysis.split("ISSUES:")[1].split("FIXED_SQL:")[0].strip()
                if issues_part != "NONE":
                    issues_found = [issues_part]
            
            if "FIXED_SQL:" in analysis:
                fixed_part = analysis.split("FIXED_SQL:")[1].split("ANALYSIS:")[0].strip()
                if fixed_part != "SAME":
                    fixed_sql = fixed_part
                    status = "fixed"
            
            return {
                "status": status,
                "issues_found": issues_found,
                "fixed_sql": fixed_sql,
                "analysis": analysis
            }
            
        except Exception as e:
            return {
                "status": "error",
                "issues_found": [f"Validation error: {str(e)}"],
                "fixed_sql": sql_query,
                "analysis": f"Error during validation: {str(e)}"
            }

def load_sample_propositions():
    """Load the five sample propositions from the JSON file"""
    file_path = "../preprocess/output2/five_sample_propositions.json"
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Extract just the required attributes for each proposition
        propositions = []
        for prop in data['sample_propositions']:
            # Only include the required attributes for validation
            clean_prop = {
                "proposition_id": prop.get("proposition_id", ""),
                "dataset": prop.get("dataset", ""),
                "sql_query": prop.get("sql_query", ""),
                "example": prop.get("example", []),
                "variables_needed": prop.get("variables_needed", []),
                "time_period": prop.get("time_period", ""),
                "chart_type": prop.get("chart_type", "")
            }
            propositions.append(clean_prop)
        
        print(f"✅ Loaded {len(propositions)} sample propositions")
        return propositions
        
    except Exception as e:
        print(f"❌ Error loading propositions: {str(e)}")
        return []

def main():
    """Main test function"""
    print("🚀 Testing SQL Validation on Five Sample Propositions")
    print("=" * 55)
    
    # Load sample propositions
    propositions = load_sample_propositions()
    
    if not propositions:
        print("❌ No propositions to process")
        return
    
    # Initialize validator
    print("\n🔧 Initializing SQL Validator...")
    validator = SimpleSQLValidator()
    
    # Validate each proposition
    print(f"\n🔍 Validating {len(propositions)} propositions...")
    results = []
    
    for i, proposition in enumerate(propositions):
        print(f"\n--- Proposition {i+1}/{len(propositions)} ---")
        print(f"ID: {proposition['proposition_id']}")
        print(f"Dataset: {proposition['dataset']}")
        print(f"Chart Type: {proposition['chart_type']}")
        print(f"SQL: {proposition['sql_query'][:100]}...")
        
        try:
            # Validate the proposition
            validation_result = validator.validate_sql(
                proposition['sql_query'], 
                proposition['dataset'], 
                proposition['example']
            )
            
            result = {
                "proposition_id": proposition['proposition_id'],
                "dataset": proposition['dataset'],
                "chart_type": proposition['chart_type'],
                "time_period": proposition['time_period'],
                "original_sql": proposition['sql_query'],
                "expected_output": proposition['example'],
                "variables_needed": proposition['variables_needed'],
                **validation_result
            }
            
            results.append(result)
            
            # Print summary
            status_emoji = {
                'valid': '✅',
                'fixed': '🔧', 
                'needs_fix': '⚠️',
                'error': '❌',
                'mock_valid': '🔄'
            }
            
            print(f"Status: {status_emoji.get(result['status'], '❓')} {result['status']}")
            
            if result['issues_found']:
                print(f"Issues: {', '.join(result['issues_found'])}")
                
            if result['status'] == 'fixed':
                print("Fixed SQL provided ✨")
                
        except Exception as e:
            print(f"❌ Error validating proposition: {str(e)}")
            results.append({
                "proposition_id": proposition['proposition_id'],
                "dataset": proposition['dataset'],
                "status": "error",
                "error": str(e),
                "original_sql": proposition.get('sql_query', ''),
                "fixed_sql": None,
                "issues_found": [f"Validation error: {str(e)}"]
            })
    
    # Generate summary
    print(f"\n📊 VALIDATION SUMMARY")
    print("=" * 30)
    
    total = len(results)
    valid = len([r for r in results if r['status'] == 'valid'])
    fixed = len([r for r in results if r['status'] == 'fixed'])
    needs_fix = len([r for r in results if r['status'] == 'needs_fix'])
    errors = len([r for r in results if r['status'] == 'error'])
    mock_valid = len([r for r in results if r['status'] == 'mock_valid'])
    
    print(f"Total Propositions: {total}")
    print(f"✅ Valid: {valid}")
    print(f"🔧 Fixed: {fixed}")
    print(f"⚠️  Needs Fix: {needs_fix}")
    print(f"❌ Errors: {errors}")
    print(f"🔄 Mock Valid: {mock_valid}")
    
    # Save detailed results
    output_data = {
        "test_metadata": {
            "test_date": datetime.now().isoformat(),
            "input_file": "../preprocess/output2/five_sample_propositions.json",
            "total_propositions": total,
            "validator_type": "SimpleSQLValidator with OpenAI" if validator.available else "Mock Validator"
        },
        "summary": {
            "valid": valid,
            "fixed": fixed,
            "needs_fix": needs_fix,
            "errors": errors,
            "mock_valid": mock_valid
        },
        "detailed_results": results
    }
    
    # Ensure output directory exists
    os.makedirs("output", exist_ok=True)
    
    # Save to output folder
    output_file = "output/five_samples_validation_results.json"
    
    try:
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Detailed results saved to: {output_file}")
        
        # Also save a summary report
        summary_file = "output/five_samples_summary.txt"
        with open(summary_file, 'w') as f:
            f.write("SQL VALIDATION RESULTS\n")
            f.write("=" * 40 + "\n")
            f.write(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Input File: five_sample_propositions.json\n")
            f.write(f"Total Propositions: {total}\n")
            f.write(f"Validator: {'OpenAI GPT-4o' if validator.available else 'Mock'}\n\n")
            
            f.write("SUMMARY:\n")
            f.write(f"✅ Valid: {valid}\n")
            f.write(f"🔧 Fixed: {fixed}\n") 
            f.write(f"⚠️  Needs Fix: {needs_fix}\n")
            f.write(f"❌ Errors: {errors}\n")
            f.write(f"🔄 Mock Valid: {mock_valid}\n\n")
            
            f.write("DETAILED RESULTS:\n")
            f.write("-" * 50 + "\n")
            
            for result in results:
                f.write(f"ID: {result['proposition_id']}\n")
                f.write(f"Dataset: {result['dataset']}\n")
                f.write(f"Chart Type: {result['chart_type']}\n")
                f.write(f"Status: {result['status']}\n")
                
                if result.get('issues_found'):
                    f.write(f"Issues: {', '.join(result['issues_found'])}\n")
                
                f.write(f"Original SQL: {result.get('original_sql', 'N/A')}\n")
                
                if result.get('fixed_sql') and result['fixed_sql'] != result.get('original_sql'):
                    f.write(f"Fixed SQL: {result['fixed_sql']}\n")
                
                if result.get('analysis'):
                    f.write(f"Analysis: {result['analysis'][:200]}...\n")
                
                f.write("-" * 50 + "\n")
        
        print(f"📄 Summary report saved to: {summary_file}")
        
    except Exception as e:
        print(f"❌ Error saving results: {str(e)}")
    
    print(f"\n🎉 Test completed! Check the output folder for detailed results.")
    print(f"📁 Output directory: ./output/")

if __name__ == "__main__":
    main()
