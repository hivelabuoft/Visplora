#!/usr/bin/env python3
"""
Test script to validate the five sample propositions using Vanna AI
"""

import json
import os
from datetime import datetime
from vanna_setup import VannaSQL

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
                "reworded_proposition": prop.get("reworded_proposition", "")
            }
            propositions.append(clean_prop)
        
        print(f"✅ Loaded {len(propositions)} sample propositions")
        return propositions
        
    except Exception as e:
        print(f"❌ Error loading propositions: {str(e)}")
        return []

def main():
    """Main test function"""
    print("🚀 Testing Vanna AI on Five Sample Propositions")
    print("=" * 50)
    
    # Load sample propositions
    propositions = load_sample_propositions()
    
    if not propositions:
        print("❌ No propositions to process")
        return
    
    # Initialize Vanna
    print("\n🔧 Initializing Vanna with OpenAI...")
    try:
        vanna = VannaSQL()
    except Exception as e:
        print(f"❌ Error initializing Vanna: {str(e)}")
        print("Make sure you have installed vanna and set your OPENAI_API_KEY in .env.local")
        return
    
    # Train Vanna on the datasets present in our sample
    datasets_to_train = list(set([prop['dataset'] for prop in propositions]))
    print(f"\n📚 Training Vanna on datasets: {datasets_to_train}")
    
    for dataset in datasets_to_train:
        try:
            print(f"  Training on {dataset}...")
            vanna.train_on_csv(dataset, sample_size=300)
        except Exception as e:
            print(f"  ⚠️  Warning: Could not train on {dataset}: {str(e)}")
    
    # Validate each proposition
    print(f"\n🔍 Validating {len(propositions)} propositions...")
    results = []
    
    for i, proposition in enumerate(propositions):
        print(f"\n--- Proposition {i+1}/{len(propositions)} ---")
        print(f"ID: {proposition['proposition_id']}")
        print(f"Dataset: {proposition['dataset']}")
        
        try:
            # Validate the proposition
            result = vanna.validate_proposition_sql(proposition)
            results.append(result)
            
            # Print summary
            status_emoji = {
                'valid': '✅',
                'fixed': '🔧', 
                'error': '❌',
                'needs_attention': '⚠️'
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
    errors = len([r for r in results if r['status'] == 'error'])
    needs_attention = len([r for r in results if r['status'] == 'needs_attention'])
    
    print(f"Total Propositions: {total}")
    print(f"✅ Valid: {valid}")
    print(f"🔧 Fixed: {fixed}")
    print(f"❌ Errors: {errors}")
    print(f"⚠️  Needs Attention: {needs_attention}")
    
    # Save detailed results
    output_data = {
        "test_metadata": {
            "test_date": datetime.now().isoformat(),
            "input_file": "../preprocess/output2/five_sample_propositions.json",
            "total_propositions": total,
            "datasets_trained": datasets_to_train
        },
        "summary": {
            "valid": valid,
            "fixed": fixed,
            "errors": errors,
            "needs_attention": needs_attention
        },
        "detailed_results": results
    }
    
    # Save to output folder
    output_file = "output/five_samples_validation_results.json"
    
    try:
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Detailed results saved to: {output_file}")
        
        # Also save a summary report
        summary_file = "output/five_samples_summary.txt"
        with open(summary_file, 'w') as f:
            f.write("VANNA AI VALIDATION RESULTS\n")
            f.write("=" * 40 + "\n")
            f.write(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Input File: five_sample_propositions.json\n")
            f.write(f"Total Propositions: {total}\n\n")
            
            f.write("SUMMARY:\n")
            f.write(f"✅ Valid: {valid}\n")
            f.write(f"🔧 Fixed: {fixed}\n") 
            f.write(f"❌ Errors: {errors}\n")
            f.write(f"⚠️  Needs Attention: {needs_attention}\n\n")
            
            f.write("DETAILED RESULTS:\n")
            f.write("-" * 20 + "\n")
            
            for result in results:
                f.write(f"ID: {result['proposition_id']}\n")
                f.write(f"Dataset: {result['dataset']}\n")
                f.write(f"Status: {result['status']}\n")
                
                if result.get('issues_found'):
                    f.write(f"Issues: {', '.join(result['issues_found'])}\n")
                
                f.write(f"Original SQL: {result.get('original_sql', 'N/A')}\n")
                
                if result.get('fixed_sql') and result['fixed_sql'] != result.get('original_sql'):
                    f.write(f"Fixed SQL: {result['fixed_sql']}\n")
                
                f.write("-" * 40 + "\n")
        
        print(f"📄 Summary report saved to: {summary_file}")
        
    except Exception as e:
        print(f"❌ Error saving results: {str(e)}")
    
    print(f"\n🎉 Test completed! Check the output folder for detailed results.")

if __name__ == "__main__":
    main()
