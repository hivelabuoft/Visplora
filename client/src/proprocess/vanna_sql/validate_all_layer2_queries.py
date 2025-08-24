#!/usr/bin/env python3
"""
Comprehensive Vanna SQL Query Validator for Layer2 Output
Loads all generated SQL queries from layer2 processing and validates/fixes them using Vanna AI.
"""

import os
import json
import sys
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import traceback
from pathlib import Path

# Add the current directory to path to import vanna_setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vanna_setup import SimpleSQLValidator

@dataclass
class SQLQueryResult:
    """Structure for validated SQL query results"""
    proposition_id: str
    dataset: str
    chart_type: str
    original_query: str
    validated_query: Optional[str]
    is_valid: bool
    validation_errors: List[str]
    vanna_suggestions: List[str]
    processing_time: float
    source_file: str
    category: Optional[str] = None

class Layer2SQLValidator:
    """Comprehensive validator for all Layer2 SQL queries"""
    
    def __init__(self, layer2_output_dir: str, csv_data_dir: str):
        self.layer2_output_dir = Path(layer2_output_dir)
        self.csv_data_dir = Path(csv_data_dir)
        self.validator = SimpleSQLValidator(csv_data_dir=str(csv_data_dir))
        self.results: List[SQLQueryResult] = []
        
        # Statistics tracking
        self.stats = {
            'total_queries': 0,
            'successful_validations': 0,
            'failed_validations': 0,
            'queries_fixed_by_vanna': 0,
            'processing_errors': 0,
            'by_dataset': {},
            'by_chart_type': {},
            'by_source': {'by_dataset': 0, 'underused_charts': 0}
        }
        
    def load_master_file(self) -> Dict[str, Any]:
        """Load the master summary file"""
        master_file = self.layer2_output_dir / "all_sql_queries_complete.json"
        if not master_file.exists():
            raise FileNotFoundError(f"Master file not found: {master_file}")
            
        with open(master_file, 'r') as f:
            return json.load(f)
    
    def extract_queries_from_master(self, master_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract all queries from master file"""
        queries = []
        
        if 'all_sql_queries' in master_data:
            for query in master_data['all_sql_queries']:
                query['source_file'] = 'all_sql_queries_complete.json'
                query['source_type'] = 'master'
                queries.append(query)
                
        return queries
    
    def load_by_dataset_files(self) -> List[Dict[str, Any]]:
        """Load all queries from by_dataset directory structure"""
        queries = []
        by_dataset_dir = self.layer2_output_dir / "by_dataset"
        
        if not by_dataset_dir.exists():
            print(f"⚠️  by_dataset directory not found: {by_dataset_dir}")
            return queries
        
        # Iterate through dataset directories
        for dataset_dir in by_dataset_dir.iterdir():
            if dataset_dir.is_directory():
                dataset_name = dataset_dir.name
                print(f"  📊 Loading {dataset_name} queries...")
                
                # Load individual category files
                for category_file in dataset_dir.glob("*_sql.json"):
                    if category_file.name.endswith('_complete.json'):
                        continue  # Skip complete files to avoid duplicates
                        
                    try:
                        with open(category_file, 'r') as f:
                            category_data = json.load(f)
                            
                        if 'sql_queries' in category_data:
                            for query in category_data['sql_queries']:
                                query['source_file'] = str(category_file.relative_to(self.layer2_output_dir))
                                query['source_type'] = 'by_dataset'
                                query['category'] = category_data.get('category', 'unknown')
                                queries.append(query)
                                
                    except Exception as e:
                        print(f"❌ Error loading {category_file}: {e}")
                        
        return queries
    
    def load_underused_charts_files(self) -> List[Dict[str, Any]]:
        """Load all queries from underused_charts directory"""
        queries = []
        underused_dir = self.layer2_output_dir / "underused_charts"
        
        if not underused_dir.exists():
            print(f"⚠️  underused_charts directory not found: {underused_dir}")
            return queries
            
        print(f"  📈 Loading underused chart queries...")
        
        # Load individual chart type files
        for chart_file in underused_dir.glob("*_sql.json"):
            try:
                with open(chart_file, 'r') as f:
                    chart_data = json.load(f)
                    
                if 'sql_queries' in chart_data:
                    for query in chart_data['sql_queries']:
                        query['source_file'] = str(chart_file.relative_to(self.layer2_output_dir))
                        query['source_type'] = 'underused_charts'
                        query['category'] = chart_data.get('category', 'chart_specific_analysis')
                        queries.append(query)
                        
            except Exception as e:
                print(f"❌ Error loading {chart_file}: {e}")
                
        return queries
        
    def load_all_queries(self) -> List[Dict[str, Any]]:
        """Load all SQL queries from all layer2 output files"""
        print("🔄 Loading all Layer2 SQL queries...")
        
        all_queries = []
        
        # Method 1: Load from master file (most comprehensive)
        try:
            print("📄 Loading from master file...")
            master_data = self.load_master_file()
            master_queries = self.extract_queries_from_master(master_data)
            all_queries.extend(master_queries)
            print(f"  ✅ Loaded {len(master_queries)} queries from master file")
            
        except Exception as e:
            print(f"⚠️  Could not load master file: {e}")
            
            # Method 2: Fallback to individual files
            print("📂 Loading from individual files...")
            
            # Load by_dataset queries
            by_dataset_queries = self.load_by_dataset_files()
            all_queries.extend(by_dataset_queries)
            print(f"  ✅ Loaded {len(by_dataset_queries)} queries from by_dataset")
            
            # Load underused_charts queries
            underused_queries = self.load_underused_charts_files()
            all_queries.extend(underused_queries)
            print(f"  ✅ Loaded {len(underused_queries)} queries from underused_charts")
        
        print(f"📊 Total queries loaded: {len(all_queries)}")
        return all_queries
    
    def validate_single_query(self, query_data: Dict[str, Any]) -> SQLQueryResult:
        """Validate a single SQL query using Vanna"""
        start_time = datetime.now()
        
        proposition_id = query_data.get('proposition_id', 'unknown')
        dataset = query_data.get('dataset', 'unknown')
        chart_type = query_data.get('chart_type', 'unknown')
        sql_query = query_data.get('sql_query', '')
        source_file = query_data.get('source_file', 'unknown')
        category = query_data.get('category')
        
        validation_errors = []
        vanna_suggestions = []
        validated_query = None
        is_valid = False
        
        try:
            if not sql_query or sql_query.strip() == '':
                validation_errors.append("Empty or missing SQL query")
            else:
                # Validate with Vanna
                validation_result = self.validator.validate_and_fix_query(
                    sql_query=sql_query,
                    dataset_name=dataset,
                    expected_columns=query_data.get('variables_needed', [])
                )
                
                is_valid = validation_result.is_valid
                validated_query = validation_result.fixed_query if validation_result.fixed_query else sql_query
                validation_errors = validation_result.errors
                vanna_suggestions = validation_result.suggestions
                
        except Exception as e:
            validation_errors.append(f"Validation error: {str(e)}")
            print(f"❌ Error validating {proposition_id}: {e}")
            
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return SQLQueryResult(
            proposition_id=proposition_id,
            dataset=dataset,
            chart_type=chart_type,
            original_query=sql_query,
            validated_query=validated_query,
            is_valid=is_valid,
            validation_errors=validation_errors,
            vanna_suggestions=vanna_suggestions,
            processing_time=processing_time,
            source_file=source_file,
            category=category
        )
    
    def update_statistics(self, result: SQLQueryResult):
        """Update validation statistics"""
        self.stats['total_queries'] += 1
        
        if result.is_valid:
            self.stats['successful_validations'] += 1
        else:
            self.stats['failed_validations'] += 1
            
        if result.validated_query and result.validated_query != result.original_query:
            self.stats['queries_fixed_by_vanna'] += 1
            
        # By dataset stats
        dataset = result.dataset
        if dataset not in self.stats['by_dataset']:
            self.stats['by_dataset'][dataset] = {'total': 0, 'valid': 0, 'fixed': 0}
        self.stats['by_dataset'][dataset]['total'] += 1
        if result.is_valid:
            self.stats['by_dataset'][dataset]['valid'] += 1
        if result.validated_query != result.original_query:
            self.stats['by_dataset'][dataset]['fixed'] += 1
            
        # By chart type stats
        chart_type = result.chart_type
        if chart_type not in self.stats['by_chart_type']:
            self.stats['by_chart_type'][chart_type] = {'total': 0, 'valid': 0, 'fixed': 0}
        self.stats['by_chart_type'][chart_type]['total'] += 1
        if result.is_valid:
            self.stats['by_chart_type'][chart_type]['valid'] += 1
        if result.validated_query != result.original_query:
            self.stats['by_chart_type'][chart_type]['fixed'] += 1
            
        # By source stats
        if 'by_dataset' in result.source_file:
            self.stats['by_source']['by_dataset'] += 1
        elif 'underused_charts' in result.source_file:
            self.stats['by_source']['underused_charts'] += 1
    
    def validate_all_queries(self, batch_size: int = 5) -> List[SQLQueryResult]:
        """Validate all loaded queries with batch processing"""
        queries = self.load_all_queries()
        
        if not queries:
            print("❌ No queries to validate!")
            return []
            
        print(f"\n🔍 Starting validation of {len(queries)} SQL queries...")
        print("=" * 60)
        
        # Process in batches
        for i in range(0, len(queries), batch_size):
            batch = queries[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(queries) + batch_size - 1) // batch_size
            
            print(f"\n📦 Processing batch {batch_num}/{total_batches} ({len(batch)} queries)...")
            
            for j, query_data in enumerate(batch):
                try:
                    result = self.validate_single_query(query_data)
                    self.results.append(result)
                    self.update_statistics(result)
                    
                    # Progress indicator
                    status = "✅" if result.is_valid else "❌"
                    fixed_indicator = "🔧" if result.validated_query != result.original_query else ""
                    print(f"  {status} {fixed_indicator} {result.proposition_id} ({result.processing_time:.2f}s)")
                    
                except Exception as e:
                    self.stats['processing_errors'] += 1
                    print(f"❌ Error processing query {i + j + 1}: {e}")
                    traceback.print_exc()
            
            # Brief pause between batches for rate limiting
            if i + batch_size < len(queries):
                import time
                time.sleep(1)
        
        return self.results
    
    def save_validation_results(self, output_file: str):
        """Save all validation results to JSON file"""
        print(f"\n💾 Saving validation results to {output_file}...")
        
        output_data = {
            'validation_metadata': {
                'processed_at': datetime.now().isoformat(),
                'layer2_source_dir': str(self.layer2_output_dir),
                'csv_data_dir': str(self.csv_data_dir),
                'vanna_config': self.validator.get_config()
            },
            'statistics': self.stats,
            'validation_results': [asdict(result) for result in self.results]
        }
        
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2, default=str)
            
        print(f"✅ Validation results saved to {output_file}")
    
    def print_summary(self):
        """Print comprehensive validation summary"""
        print("\n" + "=" * 80)
        print("📊 LAYER2 SQL VALIDATION SUMMARY")
        print("=" * 80)
        
        print(f"🔢 Total Queries Processed: {self.stats['total_queries']}")
        print(f"✅ Successfully Validated: {self.stats['successful_validations']}")
        print(f"❌ Failed Validation: {self.stats['failed_validations']}")
        print(f"🔧 Fixed by Vanna: {self.stats['queries_fixed_by_vanna']}")
        print(f"💥 Processing Errors: {self.stats['processing_errors']}")
        
        if self.stats['total_queries'] > 0:
            success_rate = (self.stats['successful_validations'] / self.stats['total_queries']) * 100
            fix_rate = (self.stats['queries_fixed_by_vanna'] / self.stats['total_queries']) * 100
            print(f"📈 Success Rate: {success_rate:.1f}%")
            print(f"🔧 Fix Rate: {fix_rate:.1f}%")
        
        # Source breakdown
        print(f"\n📂 By Source:")
        print(f"  📊 by_dataset: {self.stats['by_source']['by_dataset']} queries")
        print(f"  📈 underused_charts: {self.stats['by_source']['underused_charts']} queries")
        
        # Top datasets
        print(f"\n🗃️ Top 10 Datasets by Query Count:")
        sorted_datasets = sorted(self.stats['by_dataset'].items(), 
                               key=lambda x: x[1]['total'], reverse=True)[:10]
        for dataset, counts in sorted_datasets:
            success_rate = (counts['valid'] / counts['total']) * 100 if counts['total'] > 0 else 0
            print(f"  {dataset}: {counts['total']} queries ({success_rate:.1f}% valid, {counts['fixed']} fixed)")
        
        # Top chart types
        print(f"\n📊 Top 10 Chart Types by Query Count:")
        sorted_charts = sorted(self.stats['by_chart_type'].items(), 
                             key=lambda x: x[1]['total'], reverse=True)[:10]
        for chart_type, counts in sorted_charts:
            success_rate = (counts['valid'] / counts['total']) * 100 if counts['total'] > 0 else 0
            print(f"  {chart_type}: {counts['total']} queries ({success_rate:.1f}% valid, {counts['fixed']} fixed)")

def main():
    """Main execution function"""
    # Configuration
    layer2_output_dir = "../preprocess/output_layer2/sql_queries"
    csv_data_dir = "../../data/london_datasets_csv"
    output_file = "./validation_results/layer2_validation_complete.json"
    
    print("🚀 Layer2 SQL Query Validation System")
    print("=" * 50)
    print(f"📂 Layer2 Output Dir: {layer2_output_dir}")
    print(f"📁 CSV Data Dir: {csv_data_dir}")
    print(f"💾 Output File: {output_file}")
    
    try:
        # Initialize validator
        validator = Layer2SQLValidator(layer2_output_dir, csv_data_dir)
        
        # Run validation
        results = validator.validate_all_queries(batch_size=5)
        
        # Save results
        validator.save_validation_results(output_file)
        
        # Print summary
        validator.print_summary()
        
        print("\n🎉 Layer2 SQL validation completed successfully!")
        
    except Exception as e:
        print(f"💥 Validation failed: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
