#!/usr/bin/env python3
"""
Three-Layer Integration Validator for Complete Proposition Processing
Merges Layer1 propositions, Layer2 SQL queries, and Vanna validation into final consolidated output.
"""

import os
import json
import sys
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime
import re
import traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vanna_setup import VannaSQL

@dataclass
class ConsolidatedProposition:
    """Final consolidated proposition with all three layers merged"""
    proposition_id: str
    proposition_description: str  # reworded_proposition from Layer1
    reasoning: str
    chart_type: str
    chart_title: str
    chart_description: str
    sql_query: str  # validated/fixed SQL from Vanna
    example: List[Dict[str, Any]]  # sample data structure
    variables_needed: List[str]
    time_period: str
    geographic_level: str
    with_mean: Optional[str]  # null if no mean, SQL query if chart_type contains '_with_mean'
    with_threshold: bool  # True if chart_type contains '_with_threshold'

class ThreeLayerIntegrator:
    """Integrates Layer1, Layer2, and Vanna validation results"""
    
    def __init__(self, csv_data_dir: str):
        self.csv_data_dir = Path(csv_data_dir)
        self.vanna_sql = VannaSQL()
        self.layer1_data = {}  # proposition_id -> layer1 data
        self.layer2_data = {}  # proposition_id -> layer2 data
        self.consolidated_results = []
        
    def load_layer1_propositions(self, layer1_output_dir: str) -> Dict[str, Dict[str, Any]]:
        """Load all Layer1 propositions from output directory"""
        print("🔄 Loading Layer1 propositions...")
        
        output_dir = Path(layer1_output_dir)
        propositions = {}
        
        # Load from by_dataset directory
        by_dataset_dir = output_dir / "by_dataset"
        if by_dataset_dir.exists():
            for dataset_dir in by_dataset_dir.iterdir():
                if dataset_dir.is_dir():
                    for category_file in dataset_dir.glob("*.json"):
                        if '_complete.json' in category_file.name:
                            continue
                            
                        try:
                            with open(category_file, 'r') as f:
                                data = json.load(f)
                            
                            if 'propositions' in data:
                                for prop in data['propositions']:
                                    prop_id = prop.get('proposition_id')
                                    if prop_id:
                                        propositions[prop_id] = prop
                                        
                        except Exception as e:
                            print(f"❌ Error loading {category_file}: {e}")
        
        # Load from underused_charts directory  
        underused_dir = output_dir / "underused_charts"
        if underused_dir.exists():
            for chart_file in underused_dir.glob("*_propositions.json"):
                try:
                    with open(chart_file, 'r') as f:
                        data = json.load(f)
                    
                    if 'propositions' in data:
                        for prop in data['propositions']:
                            prop_id = prop.get('proposition_id')
                            if prop_id:
                                propositions[prop_id] = prop
                                
                except Exception as e:
                    print(f"❌ Error loading {chart_file}: {e}")
        
        print(f"✅ Loaded {len(propositions)} Layer1 propositions")
        return propositions
    
    def load_layer2_queries(self, layer2_output_dir: str) -> Dict[str, Dict[str, Any]]:
        """Load all Layer2 SQL queries from output directory"""
        print("🔄 Loading Layer2 SQL queries...")
        
        # Try to load from master file first
        master_file = Path(layer2_output_dir) / "all_sql_queries_complete.json"
        queries = {}
        
        if master_file.exists():
            try:
                with open(master_file, 'r') as f:
                    master_data = json.load(f)
                
                if 'all_sql_queries' in master_data:
                    for query in master_data['all_sql_queries']:
                        prop_id = query.get('proposition_id')
                        if prop_id:
                            queries[prop_id] = query
                            
                print(f"✅ Loaded {len(queries)} Layer2 queries from master file")
                return queries
                
            except Exception as e:
                print(f"⚠️  Error loading master file: {e}")
        
        # Fallback to individual files
        output_dir = Path(layer2_output_dir)
        
        # Load from by_dataset
        by_dataset_dir = output_dir / "by_dataset"
        if by_dataset_dir.exists():
            for dataset_dir in by_dataset_dir.iterdir():
                if dataset_dir.is_dir():
                    for sql_file in dataset_dir.glob("*_sql.json"):
                        try:
                            with open(sql_file, 'r') as f:
                                data = json.load(f)
                            
                            if 'sql_queries' in data:
                                for query in data['sql_queries']:
                                    prop_id = query.get('proposition_id')
                                    if prop_id:
                                        queries[prop_id] = query
                                        
                        except Exception as e:
                            print(f"❌ Error loading {sql_file}: {e}")
        
        # Load from underused_charts
        underused_dir = output_dir / "underused_charts"
        if underused_dir.exists():
            for sql_file in underused_dir.glob("*_sql.json"):
                try:
                    with open(sql_file, 'r') as f:
                        data = json.load(f)
                    
                    if 'sql_queries' in data:
                        for query in data['sql_queries']:
                            prop_id = query.get('proposition_id')
                            if prop_id:
                                queries[prop_id] = query
                                
                except Exception as e:
                    print(f"❌ Error loading {sql_file}: {e}")
        
        print(f"✅ Loaded {len(queries)} Layer2 queries from individual files")
        return queries
    
    def analyze_chart_type(self, chart_type: str) -> Tuple[bool, bool]:
        """Analyze if chart type requires mean or threshold calculations"""
        has_mean = '_with_mean' in chart_type.lower()
        has_threshold = '_with_threshold' in chart_type.lower()
        return has_mean, has_threshold
    
    def generate_mean_sql_query(self, layer1_prop: Dict[str, Any], layer2_query: Dict[str, Any]) -> Optional[str]:
        """Generate SQL query for mean calculation using Vanna"""
        dataset = layer1_prop.get('dataset', '')
        main_sql = layer2_query.get('sql_query', '')
        proposition_description = layer1_prop.get('reworded_proposition', '')
        
        # Get dataset table mapping
        dataset_table_mapping = {
            'crime-rates': 'crime_data',
            'ethnicity': 'ethnicity_data', 
            'population': 'population_data',
            'income': 'income_data',
            'house-prices': 'house_price_data',
            'country-of-births': 'birth_country_data',
            'schools-colleges': 'education_data',
            'vehicles': 'vehicle_data',
            'restaurants': 'restaurant_data',
            'private-rent': 'rent_data',
            'gyms': 'gym_data',
            'libraries': 'library_data'
        }
        
        table_name = dataset_table_mapping.get(dataset, dataset + '_data')
        
        # Check if Vanna client is available
        if self.vanna_sql.vn is None:
            print(f"⚠️  Vanna client not available for mean SQL generation, using fallback")
            # Fallback simple mean query
            try:
                # Extract main value column from the original SQL (usually 'value' or similar)
                if 'AS value' in main_sql.upper():
                    fallback_sql = f"SELECT AVG(sub.value) as mean_value FROM ({main_sql.rstrip(';')}) as sub;"
                else:
                    # Generic fallback
                    fallback_sql = f"SELECT AVG(value) as mean_value FROM {table_name};"
                
                return fallback_sql
            except:
                return None
        
        try:
            # Generate mean calculation query using Vanna
            mean_prompt = f"""
            Generate a SQL query to calculate the mean/average value for this proposition: "{proposition_description}"
            
            Dataset: {dataset}
            Table name: {table_name}
            Original main query: {main_sql}
            
            The mean query should:
            1. Calculate the average of the main numeric value being analyzed in the proposition
            2. Use the same filtering conditions as the main query (time period, geographic filters, etc.)
            3. Return a single mean/average value that represents the overall average for this metric
            4. Be compatible with the main query's data scope and filtering
            5. Use appropriate column names based on the proposition context
            
            Return only the SQL query, no explanations.
            """
            
            mean_sql = self.vanna_sql.vn.generate_sql(mean_prompt)
            return mean_sql.strip()
            
        except Exception as e:
            print(f"⚠️  Error generating mean SQL query: {e}")
            
            # Fallback simple mean query
            try:
                # Extract main value column from the original SQL (usually 'value' or similar)
                if 'AS value' in main_sql.upper():
                    fallback_sql = f"SELECT AVG(sub.value) as mean_value FROM ({main_sql.rstrip(';')}) as sub;"
                else:
                    # Generic fallback
                    fallback_sql = f"SELECT AVG(value) as mean_value FROM {table_name};"
                
                return fallback_sql
            except:
                return None
    
    def validate_and_consolidate_proposition(self, prop_id: str, layer1_prop: Dict[str, Any], 
                                           layer2_query: Dict[str, Any]) -> ConsolidatedProposition:
        """Validate SQL with Vanna and create consolidated proposition"""
        print(f"🔄 Processing proposition: {prop_id}")
        
        # Analyze chart type for mean/threshold requirements
        chart_type = layer1_prop.get('chart_type', layer2_query.get('chart_type', ''))
        has_mean, has_threshold = self.analyze_chart_type(chart_type)
        
        # Validate SQL query with Vanna
        validation_data = {
            'proposition_id': prop_id,
            'dataset': layer1_prop.get('dataset', layer2_query.get('dataset', '')),
            'sql_query': layer2_query.get('sql_query', ''),
            'example': layer2_query.get('example', []),
            'variables_needed': layer1_prop.get('variables_needed', layer2_query.get('variables_needed', [])),
            'reworded_proposition': layer1_prop.get('reworded_proposition', '')
        }
        
        try:
            validation_result = self.vanna_sql.validate_proposition_sql(validation_data)
            if validation_result.get('status') == 'skipped':
                validated_sql = layer2_query.get('sql_query', '')
                print(f"⚠️  Validation skipped for {prop_id}, using original SQL")
            else:
                validated_sql = validation_result.get('fixed_sql', layer2_query.get('sql_query', ''))
        except Exception as e:
            print(f"⚠️  Validation failed for {prop_id}: {e}")
            validated_sql = layer2_query.get('sql_query', '')
        
        # Generate mean SQL query if needed
        mean_sql = None
        if has_mean:
            mean_sql = self.generate_mean_sql_query(layer1_prop, layer2_query)
            if mean_sql is None:
                # Fallback: create a simple mean query
                dataset = layer1_prop.get('dataset', '')
                dataset_table_mapping = {
                    'crime-rates': 'crime_data',
                    'ethnicity': 'ethnicity_data', 
                    'population': 'population_data',
                    'income': 'income_data',
                    'house-prices': 'house_price_data',
                    'country-of-births': 'birth_country_data',
                    'schools-colleges': 'education_data',
                    'vehicles': 'vehicle_data',
                    'restaurants': 'restaurant_data',
                    'private-rent': 'rent_data',
                    'gyms': 'gym_data',
                    'libraries': 'library_data'
                }
                table_name = dataset_table_mapping.get(dataset, dataset + '_data')
                mean_sql = f"SELECT AVG(value) as mean_value FROM {table_name};"
        
        # Create consolidated proposition
        consolidated = ConsolidatedProposition(
            proposition_id=prop_id,
            proposition_description=layer1_prop.get('reworded_proposition', ''),
            reasoning=layer1_prop.get('reasoning', ''),
            chart_type=chart_type,
            chart_title=layer1_prop.get('chart_title', ''),
            chart_description=layer1_prop.get('chart_description', ''),
            sql_query=validated_sql,
            example=layer2_query.get('example', []),
            variables_needed=layer1_prop.get('variables_needed', layer2_query.get('variables_needed', [])),
            time_period=layer1_prop.get('time_period', layer2_query.get('time_period', '')),
            geographic_level=layer1_prop.get('geographic_level', ''),
            with_mean=mean_sql,  # null if no mean needed, SQL query if has_mean
            with_threshold=has_threshold
        )
        
        return consolidated
    
    def process_all_layers(self, layer1_output_dir: str, layer2_output_dir: str) -> List[ConsolidatedProposition]:
        """Process and integrate all three layers"""
        print("🚀 Starting three-layer integration...")
        print("=" * 60)
        
        # Load Layer1 propositions
        self.layer1_data = self.load_layer1_propositions(layer1_output_dir)
        
        # Load Layer2 SQL queries
        self.layer2_data = self.load_layer2_queries(layer2_output_dir)
        
        # Find matching propositions
        matching_props = set(self.layer1_data.keys()) & set(self.layer2_data.keys())
        print(f"\n🔗 Found {len(matching_props)} matching propositions between Layer1 and Layer2")
        
        if len(matching_props) == 0:
            print("❌ No matching propositions found. Check proposition_id consistency.")
            return []
        
        # Process each matching proposition
        print(f"\n🔄 Processing {len(matching_props)} propositions with Vanna validation...")
        
        for i, prop_id in enumerate(sorted(matching_props)):
            try:
                layer1_prop = self.layer1_data[prop_id]
                layer2_query = self.layer2_data[prop_id]
                
                consolidated = self.validate_and_consolidate_proposition(prop_id, layer1_prop, layer2_query)
                self.consolidated_results.append(consolidated)
                
                status = "🧮" if consolidated.with_mean is not None else "✅"
                threshold_marker = "T" if consolidated.with_threshold else ""
                mean_marker = "M" if consolidated.with_mean is not None else ""
                markers = f"[{mean_marker}{threshold_marker}]" if mean_marker or threshold_marker else ""
                
                print(f"  {status} {i+1}/{len(matching_props)}: {prop_id} {markers}")
                
            except Exception as e:
                print(f"❌ Error processing {prop_id}: {e}")
                traceback.print_exc()
        
        print(f"\n✅ Successfully processed {len(self.consolidated_results)} propositions")
        return self.consolidated_results
    
    def save_consolidated_results(self, output_file: str):
        """Save final consolidated results"""
        print(f"\n💾 Saving consolidated results to {output_file}...")
        
        # Calculate statistics
        total_props = len(self.consolidated_results)
        with_mean_count = sum(1 for p in self.consolidated_results if p.with_mean is not None)
        with_threshold_count = sum(1 for p in self.consolidated_results if p.with_threshold)
        
        # Organize by chart type
        by_chart_type = {}
        for prop in self.consolidated_results:
            chart_type = prop.chart_type
            if chart_type not in by_chart_type:
                by_chart_type[chart_type] = []
            by_chart_type[chart_type].append(asdict(prop))
        
        # Create output structure
        output_data = {
            'consolidation_metadata': {
                'processed_at': datetime.now().isoformat(),
                'total_propositions': total_props,
                'propositions_with_mean_sql': with_mean_count,
                'propositions_with_threshold': with_threshold_count,
                'chart_types_processed': len(by_chart_type)
            },
            'statistics': {
                'by_chart_type': {ct: len(props) for ct, props in by_chart_type.items()},
                'enhancement_breakdown': {
                    'with_mean_sql': with_mean_count,
                    'with_threshold_only': sum(1 for p in self.consolidated_results if p.with_mean is None and p.with_threshold),
                    'with_both_mean_and_threshold': sum(1 for p in self.consolidated_results if p.with_mean is not None and p.with_threshold),
                    'simple_charts': sum(1 for p in self.consolidated_results if p.with_mean is None and not p.with_threshold)
                }
            },
            'consolidated_propositions': [asdict(prop) for prop in self.consolidated_results],
            'propositions_by_chart_type': by_chart_type
        }
        
        # Save to file
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2, default=str)
        
        print(f"✅ Consolidated results saved to {output_file}")
    
    def print_summary(self):
        """Print comprehensive processing summary"""
        print("\n" + "=" * 80)
        print("📊 THREE-LAYER INTEGRATION SUMMARY")
        print("=" * 80)
        
        total_props = len(self.consolidated_results)
        with_mean = sum(1 for p in self.consolidated_results if p.with_mean is not None)
        with_threshold = sum(1 for p in self.consolidated_results if p.with_threshold)
        with_both = sum(1 for p in self.consolidated_results if p.with_mean is not None and p.with_threshold)
        
        print(f"🔢 Total Consolidated Propositions: {total_props}")
        print(f"📊 Simple Charts: {total_props - with_mean - with_threshold + with_both}")
        print(f"📈 With Mean SQL Queries: {with_mean}")
        print(f"📉 With Threshold (Boolean): {with_threshold}")
        print(f"🔧 With Both Mean SQL & Threshold: {with_both}")
        
        # Chart type breakdown
        chart_type_counts = {}
        for prop in self.consolidated_results:
            chart_type = prop.chart_type.split('_')[0]  # Get base type
            chart_type_counts[chart_type] = chart_type_counts.get(chart_type, 0) + 1
        
        print(f"\n📊 By Base Chart Type:")
        for chart_type, count in sorted(chart_type_counts.items()):
            mean_count = sum(1 for p in self.consolidated_results 
                           if p.chart_type.startswith(chart_type) and p.with_mean is not None)
            threshold_count = sum(1 for p in self.consolidated_results 
                                if p.chart_type.startswith(chart_type) and p.with_threshold)
            print(f"  {chart_type}: {count} total (M:{mean_count}, T:{threshold_count})")

def main():
    """Main execution function"""
    layer1_output_dir = "../preprocess/output"
    layer2_output_dir = "../preprocess/output_layer2/sql_queries"  
    csv_data_dir = "../../data/london_datasets_csv"
    output_file = "./consolidated_results/final_propositions_complete.json"
    
    print("🚀 Three-Layer Integration System")
    print("=" * 50)
    print(f"📂 Layer1 Output: {layer1_output_dir}")
    print(f"📂 Layer2 Output: {layer2_output_dir}")
    print(f"📁 CSV Data: {csv_data_dir}")
    print(f"💾 Final Output: {output_file}")
    
    try:
        integrator = ThreeLayerIntegrator(csv_data_dir)
        results = integrator.process_all_layers(layer1_output_dir, layer2_output_dir)
        
        if results:
            integrator.save_consolidated_results(output_file)
            integrator.print_summary()
            print("\n🎉 Three-layer integration completed successfully!")
        else:
            print("\n❌ No results to save.")
        
    except Exception as e:
        print(f"💥 Integration failed: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
