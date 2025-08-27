#!/usr/bin/env python3
"""
Test Three-Layer Integration with One Proposition Per Chart Type
Selects representative propositions for testing and validation.
"""

import os
import json
import sys
from typing import Dict, List, Any
from pathlib import Path
from datetime import datetime
import traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from three_layer_integrator import ThreeLayerIntegrator

class ChartTypeTestSelector:
    """Selects one proposition per chart type for testing"""
    
    def __init__(self):
        self.chart_types = [
            "areaChart_simple_2D",
            "areaChart_simple_3D", 
            "areaChart_stacked_2D",
            "barChart_simple_2D",
            "barChart_simple_3D",
            "barChart_with_mean_2D",
            "comboBarLine_simple_2D",
            "comboBarLine_simple_3D",
            "comboBarLine_with_mean_2D",
            "comboBarLine_with_threshold_2D",
            "divergentBarChart_simple_2D",
            "divergentBarChart_simple_3D",
            "divergentBarChart_with_mean_2D",
            "divergentBarChart_with_threshold_2D",
            "donutChart_simple_2D",
            "groupedBarChart_simple_2D",
            "groupedBarChart_simple_3D",
            "histogramHeatmap_simple_2D",
            "histogram_simple_2D",
            "lineChart_simple_2D",
            "lineChart_simple_3D",
            "lineChart_with_mean_2D",
            "lineChart_with_threshold_2D",
            "multiLineChart_simple_2D",
            "multiLineChart_simple_3D",
            "scatterPlot_simple_2D",
            "scatterPlot_simple_3D",
            "scatterPlot_with_mean_2D",
            "scatterPlot_with_threshold_2D"
        ]
        
    def load_all_propositions(self, layer2_output_file: str) -> Dict[str, Dict[str, Any]]:
        """Load all propositions from Layer2 master file"""
        print("🔄 Loading all Layer2 propositions...")
        
        with open(layer2_output_file, 'r') as f:
            data = json.load(f)
        
        propositions = {}
        if 'all_sql_queries' in data:
            for query in data['all_sql_queries']:
                prop_id = query.get('proposition_id')
                if prop_id:
                    propositions[prop_id] = query
        
        print(f"✅ Loaded {len(propositions)} Layer2 propositions")
        return propositions
    
    def select_one_per_chart_type(self, propositions: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Select one proposition per chart type"""
        print("🎯 Selecting one proposition per chart type...")
        
        selected = {}
        chart_type_counts = {}
        
        # Group propositions by chart type
        by_chart_type = {}
        for prop_id, prop_data in propositions.items():
            chart_type = prop_data.get('chart_type', '')
            if chart_type not in by_chart_type:
                by_chart_type[chart_type] = []
            by_chart_type[chart_type].append((prop_id, prop_data))
        
        # Select first proposition for each chart type
        for chart_type in self.chart_types:
            if chart_type in by_chart_type:
                prop_id, prop_data = by_chart_type[chart_type][0]  # Take first one
                selected[prop_id] = prop_data
                chart_type_counts[chart_type] = len(by_chart_type[chart_type])
                print(f"  ✅ {chart_type}: {prop_id} (from {len(by_chart_type[chart_type])} available)")
            else:
                print(f"  ❌ {chart_type}: No propositions found")
        
        print(f"\n📊 Selected {len(selected)} propositions from {len(self.chart_types)} chart types")
        return selected
    
    def create_test_layer2_file(self, selected_props: Dict[str, Dict[str, Any]], output_file: str):
        """Create a test Layer2 file with selected propositions"""
        test_data = {
            "processed_at": datetime.now().isoformat(),
            "test_mode": True,
            "selection_strategy": "one_per_chart_type",
            "processing_summary": {
                "total_queries": len(selected_props),
                "chart_types_tested": len(set(prop['chart_type'] for prop in selected_props.values()))
            },
            "all_sql_queries": list(selected_props.values())
        }
        
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(test_data, f, indent=2)
        
        print(f"📄 Test Layer2 file created: {output_file}")
        return output_file

def main():
    """Main test execution"""
    print("🧪 THREE-LAYER INTEGRATION TEST - ONE PER CHART TYPE")
    print("=" * 60)
    
    # Paths
    layer2_master_file = "../preprocess/output_layer2/sql_queries/all_sql_queries_complete.json"
    test_layer2_dir = "./output/test_layer2"
    test_layer2_file = f"{test_layer2_dir}/test_selected_queries.json"
    
    layer1_output_dir = "../preprocess/output"
    csv_data_dir = "../../data/london_datasets_csv"
    final_output_file = "./output/test_one_per_chart_type_results.json"
    
    try:
        # Step 1: Select representative propositions
        selector = ChartTypeTestSelector()
        all_propositions = selector.load_all_propositions(layer2_master_file)
        selected_propositions = selector.select_one_per_chart_type(all_propositions)
        
        if not selected_propositions:
            print("❌ No propositions selected for testing")
            return 1
        
        # Step 2: Create test Layer2 file
        test_file = selector.create_test_layer2_file(selected_propositions, test_layer2_file)
        
        # Step 3: Run three-layer integration on selected propositions
        print(f"\n🚀 Running Three-Layer Integration on {len(selected_propositions)} test propositions...")
        print("=" * 60)
        
        integrator = ThreeLayerIntegrator(csv_data_dir)
        
        # Load Layer1 (full dataset)
        integrator.layer1_data = integrator.load_layer1_propositions(layer1_output_dir)
        
        # Load Layer2 (test selection)
        integrator.layer2_data = selector.load_all_propositions(test_file)
        
        # Find matching propositions between Layer1 and our test selection
        matching_props = set(integrator.layer1_data.keys()) & set(integrator.layer2_data.keys())
        
        print(f"\n🔗 Found {len(matching_props)} matching propositions for testing")
        
        if len(matching_props) == 0:
            print("❌ No matching propositions found between Layer1 and test selection")
            return 1
        
        # Process matching propositions
        print(f"\n🔄 Processing {len(matching_props)} test propositions...")
        
        for i, prop_id in enumerate(sorted(matching_props)):
            try:
                layer1_prop = integrator.layer1_data[prop_id]
                layer2_query = integrator.layer2_data[prop_id]
                
                consolidated = integrator.validate_and_consolidate_proposition(prop_id, layer1_prop, layer2_query)
                integrator.consolidated_results.append(consolidated)
                
                chart_type = consolidated.chart_type
                status = "🧮" if consolidated.with_mean is not None else "✅"
                threshold_marker = "T" if consolidated.with_threshold else ""
                mean_marker = "M" if consolidated.with_mean is not None else ""
                markers = f"[{mean_marker}{threshold_marker}]" if mean_marker or threshold_marker else ""
                
                print(f"  {status} {i+1}/{len(matching_props)}: {chart_type} → {prop_id} {markers}")
                
            except Exception as e:
                print(f"❌ Error processing {prop_id}: {e}")
                traceback.print_exc()
        
        # Step 4: Save results
        if integrator.consolidated_results:
            integrator.save_consolidated_results(final_output_file)
            integrator.print_summary()
            
            print(f"\n🎉 Test completed successfully!")
            print(f"📄 Results saved to: {final_output_file}")
            
            # Show sample results by category
            mean_results = [p for p in integrator.consolidated_results if p.with_mean is not None]
            threshold_results = [p for p in integrator.consolidated_results if p.with_threshold]
            simple_results = [p for p in integrator.consolidated_results if p.with_mean is None and not p.with_threshold]
            
            print(f"\n📋 Test Results Summary:")
            print(f"  🧮 Charts with Mean SQL: {len(mean_results)}")
            if mean_results:
                for result in mean_results[:3]:  # Show first 3
                    print(f"    • {result.chart_type}: {result.proposition_id}")
            
            print(f"  📊 Charts with Threshold: {len(threshold_results)}")
            if threshold_results:
                for result in threshold_results[:3]:  # Show first 3
                    print(f"    • {result.chart_type}: {result.proposition_id}")
                    
            print(f"  ✅ Simple Charts: {len(simple_results)}")
            if simple_results:
                for result in simple_results[:3]:  # Show first 3
                    print(f"    • {result.chart_type}: {result.proposition_id}")
        else:
            print("\n❌ No results to save")
            return 1
    
    except Exception as e:
        print(f"💥 Test failed: {e}")
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
