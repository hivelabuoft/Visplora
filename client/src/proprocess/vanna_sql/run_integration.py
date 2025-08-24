#!/usr/bin/env python3
"""
Quick execution script for Three-Layer Integration System
Run with: python run_integration.py
"""

import os
import sys
from pathlib import Path
import json
from datetime import datetime

def check_directories():
    """Check if all required directories exist"""
    base_dir = Path(__file__).parent
    
    directories = {
        'Layer1 Output': base_dir / "../preprocess/output",
        'Layer2 Output': base_dir / "../preprocess/output_layer2/sql_queries",
        'CSV Data': base_dir / "../../data/london_datasets_csv", 
        'Consolidated Results': base_dir / "consolidated_results"
    }
    
    print("📁 Directory Check:")
    all_exist = True
    
    for name, path in directories.items():
        if path.exists():
            if name == 'CSV Data':
                csv_count = len(list(path.glob("*.csv")))
                print(f"  ✅ {name}: {path} ({csv_count} CSV files)")
            else:
                file_count = len(list(path.rglob("*.json")))
                print(f"  ✅ {name}: {path} ({file_count} JSON files)")
        else:
            print(f"  ❌ {name}: {path} (NOT FOUND)")
            all_exist = False
    
    return all_exist

def estimate_processing_time():
    """Estimate processing time based on available propositions"""
    try:
        layer2_master = Path("../preprocess/output_layer2/sql_queries/all_sql_queries_complete.json")
        if layer2_master.exists():
            with open(layer2_master, 'r') as f:
                data = json.load(f)
            count = len(data.get('all_sql_queries', []))
        else:
            # Rough estimate from directory structure
            count = 522  # Known from previous processing
        
        # Estimate ~2-3 seconds per proposition for Vanna validation
        estimated_minutes = (count * 2.5) / 60
        
        print(f"⏱️  Processing Estimate:")
        print(f"  📊 Propositions to process: ~{count}")
        print(f"  🕐 Estimated time: {estimated_minutes:.1f} minutes")
        print(f"  🔧 Auxiliary queries: ~{count * 0.3:.0f} (for mean/threshold charts)")
        
        return count
        
    except Exception as e:
        print(f"⚠️  Could not estimate processing time: {e}")
        return 0

def main():
    """Main execution with user confirmation"""
    print("🚀 Three-Layer Integration System")
    print("=" * 50)
    
    # Check directories
    if not check_directories():
        print("\n❌ Missing required directories. Please check paths.")
        return 1
    
    # Estimate processing time
    prop_count = estimate_processing_time()
    
    # Get user confirmation
    print(f"\n🤔 This will process all propositions with Vanna AI validation.")
    print(f"💰 Note: This uses OpenAI API calls (~${prop_count * 0.002:.2f} estimated cost)")
    
    response = input("\n➡️  Continue with three-layer integration? [y/N]: ").strip().lower()
    
    if response not in ['y', 'yes']:
        print("✋ Integration cancelled.")
        return 0
    
    # Import and run the integrator
    try:
        from three_layer_integrator import ThreeLayerIntegrator
        
        print(f"\n🔄 Starting integration at {datetime.now().strftime('%H:%M:%S')}...")
        
        layer1_output_dir = "../preprocess/output"
        layer2_output_dir = "../preprocess/output_layer2/sql_queries"  
        csv_data_dir = "../../data/london_datasets_csv"
        output_file = "./consolidated_results/final_propositions_complete.json"
        
        integrator = ThreeLayerIntegrator(csv_data_dir)
        results = integrator.process_all_layers(layer1_output_dir, layer2_output_dir)
        
        if results:
            integrator.save_consolidated_results(output_file)
            integrator.print_summary()
            
            print(f"\n🎉 Integration completed at {datetime.now().strftime('%H:%M:%S')}!")
            print(f"📄 Results saved to: {output_file}")
            
            # Show sample result
            if results:
                sample = results[0]
                print(f"\n📋 Sample Result:")
                print(f"  ID: {sample.proposition_id}")
                print(f"  Type: {sample.chart_type}")
                print(f"  Mean: {'✅' if sample.with_mean else '❌'}")
                print(f"  Threshold: {'✅' if sample.with_threshold else '❌'}")
                if sample.auxiliary_queries:
                    aux_count = len(sample.auxiliary_queries)
                    print(f"  Auxiliary Queries: {aux_count}")
        else:
            print("\n❌ No results generated.")
            return 1
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure three_layer_integrator.py is in the same directory.")
        return 1
    except Exception as e:
        print(f"💥 Integration failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
