#!/usr/bin/env python3
"""
Individual File Processor for Layer2 SQL Validation
Processes each output file separately with detailed tracking and reporting.
"""

import os
import json
import sys
from typing import List, Dict, Any, Optional
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime
import traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vanna_setup import SimpleSQLValidator

@dataclass
class FileValidationResult:
    """Results for a single file validation"""
    file_path: str
    file_type: str  # 'by_dataset', 'underused_charts', 'master'
    dataset_name: Optional[str]
    category_name: Optional[str]
    chart_type: Optional[str]
    total_queries: int
    valid_queries: int
    fixed_queries: int
    failed_queries: int
    processing_errors: int
    processing_time: float
    query_results: List[Dict[str, Any]]

class Layer2FileProcessor:
    """Process individual Layer2 output files"""
    
    def __init__(self, csv_data_dir: str):
        self.csv_data_dir = Path(csv_data_dir)
        self.validator = SimpleSQLValidator(csv_data_dir=str(csv_data_dir))
        self.file_results: List[FileValidationResult] = []
        
    def process_by_dataset_file(self, file_path: Path) -> FileValidationResult:
        """Process a single by_dataset category file"""
        print(f"📊 Processing by_dataset file: {file_path.name}")
        start_time = datetime.now()
        
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        dataset_name = data.get('dataset', 'unknown')
        category_name = data.get('category', 'unknown')
        queries = data.get('sql_queries', [])
        
        query_results = []
        valid_count = 0
        fixed_count = 0
        failed_count = 0
        error_count = 0
        
        for i, query_data in enumerate(queries):
            try:
                result = self._validate_query(query_data, file_path)
                query_results.append(result)
                
                if result['is_valid']:
                    valid_count += 1
                else:
                    failed_count += 1
                    
                if result['was_fixed']:
                    fixed_count += 1
                    
                print(f"  Query {i+1}/{len(queries)}: {result['proposition_id']} - {'✅' if result['is_valid'] else '❌'}")
                
            except Exception as e:
                error_count += 1
                print(f"  ❌ Error processing query {i+1}: {e}")
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return FileValidationResult(
            file_path=str(file_path),
            file_type='by_dataset',
            dataset_name=dataset_name,
            category_name=category_name,
            chart_type=None,
            total_queries=len(queries),
            valid_queries=valid_count,
            fixed_queries=fixed_count,
            failed_queries=failed_count,
            processing_errors=error_count,
            processing_time=processing_time,
            query_results=query_results
        )
    
    def process_underused_charts_file(self, file_path: Path) -> FileValidationResult:
        """Process a single underused_charts file"""
        print(f"📈 Processing underused_charts file: {file_path.name}")
        start_time = datetime.now()
        
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        chart_type = data.get('chart_type', 'unknown')
        category_name = data.get('category', 'chart_specific_analysis')
        queries = data.get('sql_queries', [])
        
        query_results = []
        valid_count = 0
        fixed_count = 0
        failed_count = 0
        error_count = 0
        
        for i, query_data in enumerate(queries):
            try:
                result = self._validate_query(query_data, file_path)
                query_results.append(result)
                
                if result['is_valid']:
                    valid_count += 1
                else:
                    failed_count += 1
                    
                if result['was_fixed']:
                    fixed_count += 1
                    
                print(f"  Query {i+1}/{len(queries)}: {result['proposition_id']} - {'✅' if result['is_valid'] else '❌'}")
                
            except Exception as e:
                error_count += 1
                print(f"  ❌ Error processing query {i+1}: {e}")
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return FileValidationResult(
            file_path=str(file_path),
            file_type='underused_charts',
            dataset_name=None,
            category_name=category_name,
            chart_type=chart_type,
            total_queries=len(queries),
            valid_queries=valid_count,
            fixed_queries=fixed_count,
            failed_queries=failed_count,
            processing_errors=error_count,
            processing_time=processing_time,
            query_results=query_results
        )
    
    def _validate_query(self, query_data: Dict[str, Any], source_file: Path) -> Dict[str, Any]:
        """Validate a single query and return detailed results"""
        proposition_id = query_data.get('proposition_id', 'unknown')
        dataset = query_data.get('dataset', 'unknown')
        chart_type = query_data.get('chart_type', 'unknown')
        sql_query = query_data.get('sql_query', '')
        
        if not sql_query or sql_query.strip() == '':
            return {
                'proposition_id': proposition_id,
                'dataset': dataset,
                'chart_type': chart_type,
                'original_query': sql_query,
                'validated_query': None,
                'is_valid': False,
                'was_fixed': False,
                'errors': ['Empty or missing SQL query'],
                'suggestions': [],
                'source_file': str(source_file)
            }
        
        # Validate with Vanna
        validation_result = self.validator.validate_and_fix_query(
            sql_query=sql_query,
            dataset_name=dataset,
            expected_columns=query_data.get('variables_needed', [])
        )
        
        was_fixed = (validation_result.fixed_query is not None and 
                    validation_result.fixed_query != sql_query)
        
        return {
            'proposition_id': proposition_id,
            'dataset': dataset,
            'chart_type': chart_type,
            'original_query': sql_query,
            'validated_query': validation_result.fixed_query,
            'is_valid': validation_result.is_valid,
            'was_fixed': was_fixed,
            'errors': validation_result.errors,
            'suggestions': validation_result.suggestions,
            'source_file': str(source_file)
        }
    
    def process_all_files(self, layer2_output_dir: str) -> List[FileValidationResult]:
        """Process all files in the layer2 output directory"""
        output_dir = Path(layer2_output_dir)
        
        if not output_dir.exists():
            raise FileNotFoundError(f"Layer2 output directory not found: {output_dir}")
        
        print("🔄 Processing all Layer2 output files...")
        print("=" * 60)
        
        # Process by_dataset files
        by_dataset_dir = output_dir / "by_dataset"
        if by_dataset_dir.exists():
            print(f"\n📊 Processing by_dataset files...")
            
            for dataset_dir in by_dataset_dir.iterdir():
                if dataset_dir.is_directory():
                    print(f"\n  📁 Dataset: {dataset_dir.name}")
                    
                    for category_file in dataset_dir.glob("*_sql.json"):
                        if '_complete.json' in category_file.name:
                            continue  # Skip complete files
                            
                        try:
                            result = self.process_by_dataset_file(category_file)
                            self.file_results.append(result)
                            
                            print(f"    ✅ {result.valid_queries}/{result.total_queries} valid, "
                                  f"{result.fixed_queries} fixed, {result.processing_time:.1f}s")
                            
                        except Exception as e:
                            print(f"    ❌ Error processing {category_file.name}: {e}")
        
        # Process underused_charts files
        underused_dir = output_dir / "underused_charts"
        if underused_dir.exists():
            print(f"\n📈 Processing underused_charts files...")
            
            for chart_file in underused_dir.glob("*_sql.json"):
                try:
                    result = self.process_underused_charts_file(chart_file)
                    self.file_results.append(result)
                    
                    print(f"  ✅ {chart_file.stem}: {result.valid_queries}/{result.total_queries} valid, "
                          f"{result.fixed_queries} fixed, {result.processing_time:.1f}s")
                    
                except Exception as e:
                    print(f"  ❌ Error processing {chart_file.name}: {e}")
        
        return self.file_results
    
    def save_detailed_results(self, output_dir: str):
        """Save detailed results with individual file breakdowns"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Save overall summary
        summary = {
            'processing_metadata': {
                'processed_at': datetime.now().isoformat(),
                'total_files_processed': len(self.file_results),
                'csv_data_dir': str(self.csv_data_dir),
                'vanna_config': self.validator.get_config()
            },
            'overall_statistics': self._calculate_overall_stats(),
            'file_results': [asdict(result) for result in self.file_results]
        }
        
        summary_file = output_path / "detailed_validation_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        print(f"✅ Detailed summary saved to {summary_file}")
        
        # Save individual file results
        for result in self.file_results:
            file_name = Path(result.file_path).stem + "_validation.json"
            individual_file = output_path / "individual_files" / file_name
            individual_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(individual_file, 'w') as f:
                json.dump(asdict(result), f, indent=2, default=str)
        
        print(f"✅ Individual file results saved to {output_path / 'individual_files'}")
    
    def _calculate_overall_stats(self) -> Dict[str, Any]:
        """Calculate overall statistics across all files"""
        total_queries = sum(r.total_queries for r in self.file_results)
        total_valid = sum(r.valid_queries for r in self.file_results)
        total_fixed = sum(r.fixed_queries for r in self.file_results)
        total_failed = sum(r.failed_queries for r in self.file_results)
        total_errors = sum(r.processing_errors for r in self.file_results)
        
        by_dataset_stats = {}
        by_chart_type_stats = {}
        
        for result in self.file_results:
            if result.dataset_name:
                if result.dataset_name not in by_dataset_stats:
                    by_dataset_stats[result.dataset_name] = {'files': 0, 'queries': 0, 'valid': 0, 'fixed': 0}
                by_dataset_stats[result.dataset_name]['files'] += 1
                by_dataset_stats[result.dataset_name]['queries'] += result.total_queries
                by_dataset_stats[result.dataset_name]['valid'] += result.valid_queries
                by_dataset_stats[result.dataset_name]['fixed'] += result.fixed_queries
            
            if result.chart_type:
                if result.chart_type not in by_chart_type_stats:
                    by_chart_type_stats[result.chart_type] = {'files': 0, 'queries': 0, 'valid': 0, 'fixed': 0}
                by_chart_type_stats[result.chart_type]['files'] += 1
                by_chart_type_stats[result.chart_type]['queries'] += result.total_queries
                by_chart_type_stats[result.chart_type]['valid'] += result.valid_queries
                by_chart_type_stats[result.chart_type]['fixed'] += result.fixed_queries
        
        return {
            'total_files': len(self.file_results),
            'total_queries': total_queries,
            'total_valid': total_valid,
            'total_fixed': total_fixed,
            'total_failed': total_failed,
            'processing_errors': total_errors,
            'success_rate': (total_valid / total_queries * 100) if total_queries > 0 else 0,
            'fix_rate': (total_fixed / total_queries * 100) if total_queries > 0 else 0,
            'by_dataset': by_dataset_stats,
            'by_chart_type': by_chart_type_stats,
            'by_file_type': {
                'by_dataset': len([r for r in self.file_results if r.file_type == 'by_dataset']),
                'underused_charts': len([r for r in self.file_results if r.file_type == 'underused_charts'])
            }
        }
    
    def print_summary(self):
        """Print comprehensive processing summary"""
        stats = self._calculate_overall_stats()
        
        print("\n" + "=" * 80)
        print("📊 INDIVIDUAL FILE PROCESSING SUMMARY")
        print("=" * 80)
        
        print(f"📁 Files Processed: {stats['total_files']}")
        print(f"🔢 Total Queries: {stats['total_queries']}")
        print(f"✅ Valid Queries: {stats['total_valid']}")
        print(f"🔧 Fixed Queries: {stats['total_fixed']}")
        print(f"❌ Failed Queries: {stats['total_failed']}")
        print(f"💥 Processing Errors: {stats['processing_errors']}")
        print(f"📈 Success Rate: {stats['success_rate']:.1f}%")
        print(f"🔧 Fix Rate: {stats['fix_rate']:.1f}%")
        
        print(f"\n📂 File Types:")
        print(f"  📊 by_dataset files: {stats['by_file_type']['by_dataset']}")
        print(f"  📈 underused_charts files: {stats['by_file_type']['underused_charts']}")

def main():
    """Main execution function"""
    layer2_output_dir = "../preprocess/output_layer2/sql_queries"
    csv_data_dir = "../../data/london_datasets_csv"
    validation_output_dir = "./validation_results"
    
    print("🚀 Layer2 Individual File SQL Validation System")
    print("=" * 60)
    print(f"📂 Layer2 Output: {layer2_output_dir}")
    print(f"📁 CSV Data: {csv_data_dir}")
    print(f"💾 Results: {validation_output_dir}")
    
    try:
        processor = Layer2FileProcessor(csv_data_dir)
        results = processor.process_all_files(layer2_output_dir)
        processor.save_detailed_results(validation_output_dir)
        processor.print_summary()
        
        print("\n🎉 Individual file processing completed successfully!")
        
    except Exception as e:
        print(f"💥 Processing failed: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
