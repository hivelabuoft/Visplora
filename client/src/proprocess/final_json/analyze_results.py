#!/usr/bin/env python3
"""
Summary of Final Results
Shows what data was successfully processed and extracted
"""

import json

def analyze_final_results():
    """Analyze the final JSON results"""
    
    try:
        with open('final_data_all_propositions.json', 'r') as f:
            data = json.load(f)
        
        propositions = data.get('propositions_with_data', [])
        metadata = data.get('processing_metadata', {})
        
        print("🎉 FINAL RESULTS ANALYSIS")
        print("=" * 50)
        
        print(f"📊 Processing Summary:")
        print(f"  Total Propositions: {metadata.get('total_propositions', 0)}")
        print(f"  Successful: {metadata.get('successful_executions', 0)}")
        print(f"  Failed: {metadata.get('failed_executions', 0)}")
        
        # Analyze data availability
        with_data = len([p for p in propositions if p.get('sql_result') and isinstance(p['sql_result'], list) and len(p['sql_result']) > 0])
        with_mean = len([p for p in propositions if 'mean' in p])
        with_threshold = len([p for p in propositions if 'threshold' in p])
        
        print(f"\n📈 Data Quality:")
        print(f"  Propositions with Data: {with_data}")
        print(f"  Propositions with Mean: {with_mean}")
        print(f"  Propositions with Threshold: {with_threshold}")
        
        # Show examples of successful propositions
        print(f"\n✅ Successful Propositions with Data:")
        successful = [p for p in propositions if p.get('sql_result') and isinstance(p['sql_result'], list) and len(p['sql_result']) > 0]
        
        for i, prop in enumerate(successful[:5]):
            data_count = len(prop['sql_result'])
            mean_info = f" (mean: {prop['mean']:.2f})" if 'mean' in prop else ""
            threshold_info = " [T]" if prop.get('threshold') else ""
            print(f"  {i+1}. {prop['chart_type']}: {data_count} records{mean_info}{threshold_info}")
        
        if len(successful) > 5:
            print(f"  ... and {len(successful) - 5} more")
        
        # Show propositions with means
        print(f"\n🧮 Propositions with Mean Values:")
        mean_props = [p for p in propositions if 'mean' in p]
        
        for prop in mean_props:
            print(f"  • {prop['proposition_id']}: {prop['mean']:.2f}")
        
        # Show propositions with thresholds
        print(f"\n📉 Propositions with Thresholds:")
        threshold_props = [p for p in propositions if p.get('threshold')]
        
        for prop in threshold_props:
            data_count = len(prop.get('sql_result', []))
            print(f"  • {prop['proposition_id']}: {data_count} records")
        
        # Show chart type distribution
        chart_types = {}
        for prop in propositions:
            chart_type = prop.get('chart_type', 'unknown')
            if chart_type in chart_types:
                chart_types[chart_type] += 1
            else:
                chart_types[chart_type] = 1
        
        print(f"\n📊 Chart Type Distribution:")
        for chart_type, count in sorted(chart_types.items()):
            print(f"  {chart_type}: {count}")
        
        print(f"\n💾 Output File: final_data_all_propositions.json")
        print(f"📁 File Size: {len(json.dumps(data)) / 1024:.1f} KB")
        
    except Exception as e:
        print(f"❌ Error analyzing results: {e}")

if __name__ == "__main__":
    analyze_final_results()
