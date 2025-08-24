#!/usr/bin/env python3
"""
Complete Three-Layer Integration: Process ALL Propositions and Save to /public
This script runs the complete workflow:
1. Layer1: Load original propositions with metadata
2. Layer2: Load SQL queries for data retrieval 
3. Layer3: VannaSQL validation + mean/threshold enhancements + consolidation
4. Save final output to /public for frontend consumption
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime
import traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from three_layer_integrator import ThreeLayerIntegrator

def main():
    """Process all propositions through three-layer integration and save to /public"""
    
    print("🚀 COMPLETE THREE-LAYER INTEGRATION - ALL PROPOSITIONS")
    print("=" * 70)
    print("📋 Workflow:")
    print("  1️⃣ Layer1: Load original propositions with metadata")
    print("  2️⃣ Layer2: Load SQL queries for data retrieval")
    print("  3️⃣ Layer3: VannaSQL validation + enhancements + consolidation")
    print("  4️⃣ Save final output to /public for frontend")
    print("=" * 70)
    
    # Configuration paths
    layer1_output_dir = "../preprocess/output"
    layer2_output_dir = "../preprocess/output_layer2/sql_queries"  
    csv_data_dir = "../../data/london_datasets_csv"
    
    # Final output in /public directory
    public_output_file = "../../public/final_all_propositions_integrated.json"
    
    print(f"📂 Layer1 Propositions: {layer1_output_dir}")
    print(f"📂 Layer2 SQL Queries: {layer2_output_dir}")
    print(f"📁 CSV Data Directory: {csv_data_dir}")
    print(f"💾 Final Public Output: {public_output_file}")
    print()
    
    try:
        # Initialize the three-layer integrator
        integrator = ThreeLayerIntegrator(csv_data_dir)
        
        # Run the complete three-layer integration process
        print("🔄 Starting three-layer integration process...")
        results = integrator.process_all_layers(layer1_output_dir, layer2_output_dir)
        
        if results:
            print(f"\n✅ Successfully processed {len(results)} propositions!")
            
            # Ensure public directory exists
            public_dir = Path(public_output_file).parent
            public_dir.mkdir(parents=True, exist_ok=True)
            
            # Save to /public directory for frontend consumption
            integrator.save_consolidated_results(public_output_file)
            
            # Print comprehensive summary
            integrator.print_summary()
            
            print("\n" + "=" * 70)
            print("🎉 THREE-LAYER INTEGRATION COMPLETED SUCCESSFULLY!")
            print("=" * 70)
            print(f"📄 Final output saved to: {public_output_file}")
            print(f"📊 Total propositions processed: {len(results)}")
            print(f"🎯 Ready for frontend consumption!")
            
            # Additional summary for easy access
            with_mean = sum(1 for p in results if p.with_mean is not None)
            with_threshold = sum(1 for p in results if p.with_threshold)
            simple_charts = len(results) - with_mean - with_threshold + sum(1 for p in results if p.with_mean is not None and p.with_threshold)
            
            print(f"\n📋 Final Statistics:")
            print(f"  ✅ Simple Charts: {simple_charts}")
            print(f"  📈 Enhanced with Mean SQL: {with_mean}")
            print(f"  📉 Enhanced with Threshold Logic: {with_threshold}")
            print(f"  🔧 Total Enhanced Charts: {with_mean + with_threshold}")
            
            # Show file size
            file_size = os.path.getsize(public_output_file) / (1024 * 1024)  # MB
            print(f"  📁 Output file size: {file_size:.2f} MB")
            
        else:
            print("\n❌ No results to save - integration failed")
            return 1
        
    except Exception as e:
        print(f"\n💥 Three-layer integration failed: {e}")
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    print("🎯 Running complete three-layer integration for all propositions...")
    exit_code = main()
    
    if exit_code == 0:
        print("\n✨ All propositions successfully integrated and saved to /public!")
    else:
        print("\n❌ Integration process failed")
    
    sys.exit(exit_code)
