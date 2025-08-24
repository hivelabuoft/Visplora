#!/usr/bin/env python3
"""
Batch Processing Script for Layer2 SQL Validation
Processes Layer2 output files in organized batches with detailed progress tracking.
"""

import os
import json
import sys
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime
import time
import traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vanna_setup import SimpleSQLValidator

@dataclass
class BatchResult:
    """Results for a single batch processing"""
    batch_id: str
    batch_type: str  # 'dataset', 'chart_type'
    files_in_batch: List[str]
    total_queries: int
    valid_queries: int
    fixed_queries: int
    failed_queries: int
    processing_time: float
    queries_per_second: float

class BatchProcessor:
    """Batch processing system for Layer2 SQL validation"""
    
    def __init__(self, csv_data_dir: str, batch_size: int = 10):
        self.csv_data_dir = Path(csv_data_dir)
        self.batch_size = batch_size
        self.validator = SimpleSQLValidator(csv_data_dir=str(csv_data_dir))
        self.batch_results: List[BatchResult] = []
        self.all_query_results: List[Dict[str, Any]] = []
        
    def create_dataset_batches(self, layer2_output_dir: str) -> List[Tuple[str, List[Path]]]:
        """Create batches organized by dataset"""
        output_dir = Path(layer2_output_dir)
        by_dataset_dir = output_dir / "by_dataset"
        
        batches = []
        
        if by_dataset_dir.exists():
            for dataset_dir in by_dataset_dir.iterdir():
                if dataset_dir.is_directory():
                    dataset_files = []
                    for category_file in dataset_dir.glob("*_sql.json"):
                        if '_complete.json' not in category_file.name:
                            dataset_files.append(category_file)
                    
                    if dataset_files:
                        batch_id = f"dataset_{dataset_dir.name}"
                        batches.append((batch_id, dataset_files))
        
        return batches
    
    def create_chart_type_batches(self, layer2_output_dir: str) -> List[Tuple[str, List[Path]]]:
        """Create batches organized by chart type"""
        output_dir = Path(layer2_output_dir)
        underused_dir = output_dir / "underused_charts"
        
        batches = []
        
        if underused_dir.exists():
            chart_files = []
            for chart_file in underused_dir.glob("*_sql.json"):
                chart_files.append(chart_file)
            
            # Split chart files into batches of specified size
            for i in range(0, len(chart_files), self.batch_size):
                batch_files = chart_files[i:i + self.batch_size]
                batch_id = f"charts_batch_{i // self.batch_size + 1}"
                batches.append((batch_id, batch_files))
        
        return batches
    
    def process_single_file(self, file_path: Path) -> Tuple[int, int, int, List[Dict[str, Any]]]:
        """Process a single file and return query counts and results"""
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        queries = data.get('sql_queries', [])
        query_results = []
        valid_count = 0
        fixed_count = 0
        
        for query_data in queries:
            try:
                result = self._validate_single_query(query_data, file_path)
                query_results.append(result)
                
                if result['is_valid']:
                    valid_count += 1
                
                if result['was_fixed']:
                    fixed_count += 1
                    
            except Exception as e:
                print(f"    ⚠️  Error processing query in {file_path.name}: {e}")
        
        return len(queries), valid_count, fixed_count, query_results
    
    def _validate_single_query(self, query_data: Dict[str, Any], source_file: Path) -> Dict[str, Any]:
        """Validate a single query"""
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
                'source_file': str(source_file),
                'batch_id': None
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
            'source_file': str(source_file),
            'batch_id': None
        }
    
    def process_batch(self, batch_id: str, files: List[Path], batch_type: str) -> BatchResult:
        """Process a single batch of files"""
        print(f"\n🔄 Processing batch: {batch_id}")
        print(f"  📁 Files: {len(files)}")
        print(f"  📊 Type: {batch_type}")
        
        start_time = datetime.now()
        total_queries = 0
        valid_queries = 0
        fixed_queries = 0
        batch_query_results = []
        
        for i, file_path in enumerate(files):
            print(f"    {i+1}/{len(files)}: {file_path.name}")
            
            try:
                file_total, file_valid, file_fixed, file_results = self.process_single_file(file_path)
                
                # Add batch_id to each query result
                for result in file_results:
                    result['batch_id'] = batch_id
                
                total_queries += file_total
                valid_queries += file_valid
                fixed_queries += file_fixed
                batch_query_results.extend(file_results)
                
                print(f"      ✅ {file_valid}/{file_total} valid, {file_fixed} fixed")
                
            except Exception as e:
                print(f"      ❌ Error processing {file_path.name}: {e}")
        
        processing_time = (datetime.now() - start_time).total_seconds()
        queries_per_second = total_queries / processing_time if processing_time > 0 else 0
        
        # Add to overall results
        self.all_query_results.extend(batch_query_results)
        
        result = BatchResult(
            batch_id=batch_id,
            batch_type=batch_type,
            files_in_batch=[str(f) for f in files],
            total_queries=total_queries,
            valid_queries=valid_queries,
            fixed_queries=fixed_queries,
            failed_queries=total_queries - valid_queries,
            processing_time=processing_time,
            queries_per_second=queries_per_second
        )
        
        print(f"  ✅ Batch complete: {valid_queries}/{total_queries} valid ({queries_per_second:.1f} queries/sec)")
        
        return result
    
    def process_all_batches(self, layer2_output_dir: str) -> List[BatchResult]:
        """Process all batches in organized manner"""
        print("🚀 Starting batch processing of Layer2 SQL queries...")
        print("=" * 70)
        
        # Create dataset batches
        dataset_batches = self.create_dataset_batches(layer2_output_dir)
        print(f"📊 Created {len(dataset_batches)} dataset batches")
        
        # Create chart type batches  
        chart_batches = self.create_chart_type_batches(layer2_output_dir)
        print(f"📈 Created {len(chart_batches)} chart type batches")
        
        # Process dataset batches
        if dataset_batches:
            print(f"\n📊 Processing dataset batches...")
            for batch_id, files in dataset_batches:
                try:
                    result = self.process_batch(batch_id, files, 'dataset')
                    self.batch_results.append(result)
                    
                    # Brief pause between batches
                    if len(self.batch_results) < len(dataset_batches):
                        time.sleep(2)
                        
                except Exception as e:
                    print(f"❌ Error processing batch {batch_id}: {e}")
        
        # Process chart type batches
        if chart_batches:
            print(f"\n📈 Processing chart type batches...")
            for batch_id, files in chart_batches:
                try:
                    result = self.process_batch(batch_id, files, 'chart_type')
                    self.batch_results.append(result)
                    
                    # Brief pause between batches
                    if result != self.batch_results[-1]:
                        time.sleep(2)
                        
                except Exception as e:
                    print(f"❌ Error processing batch {batch_id}: {e}")
        
        return self.batch_results
    
    def save_batch_results(self, output_dir: str):
        """Save batch processing results"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Overall statistics
        total_queries = sum(b.total_queries for b in self.batch_results)
        total_valid = sum(b.valid_queries for b in self.batch_results)
        total_fixed = sum(b.fixed_queries for b in self.batch_results)
        total_failed = sum(b.failed_queries for b in self.batch_results)
        
        overall_stats = {
            'processing_metadata': {
                'processed_at': datetime.now().isoformat(),
                'batch_size': self.batch_size,
                'total_batches': len(self.batch_results),
                'csv_data_dir': str(self.csv_data_dir),
                'vanna_config': self.validator.get_config()
            },
            'overall_statistics': {
                'total_queries': total_queries,
                'total_valid': total_valid,
                'total_fixed': total_fixed,
                'total_failed': total_failed,
                'success_rate': (total_valid / total_queries * 100) if total_queries > 0 else 0,
                'fix_rate': (total_fixed / total_queries * 100) if total_queries > 0 else 0,
                'average_queries_per_second': sum(b.queries_per_second for b in self.batch_results) / len(self.batch_results) if self.batch_results else 0
            },
            'batch_results': [asdict(result) for result in self.batch_results],
            'all_query_results': self.all_query_results
        }
        
        # Save main results file
        results_file = output_path / "batch_processing_results.json"
        with open(results_file, 'w') as f:
            json.dump(overall_stats, f, indent=2, default=str)
        
        print(f"✅ Batch results saved to {results_file}")
        
        # Save individual batch files
        batch_dir = output_path / "individual_batches"
        batch_dir.mkdir(exist_ok=True)
        
        for batch_result in self.batch_results:
            batch_queries = [q for q in self.all_query_results if q.get('batch_id') == batch_result.batch_id]
            
            batch_data = {
                'batch_info': asdict(batch_result),
                'queries': batch_queries
            }
            
            batch_file = batch_dir / f"{batch_result.batch_id}_results.json"
            with open(batch_file, 'w') as f:
                json.dump(batch_data, f, indent=2, default=str)
        
        print(f"✅ Individual batch files saved to {batch_dir}")
    
    def print_batch_summary(self):
        """Print comprehensive batch processing summary"""
        total_queries = sum(b.total_queries for b in self.batch_results)
        total_valid = sum(b.valid_queries for b in self.batch_results)
        total_fixed = sum(b.fixed_queries for b in self.batch_results)
        total_failed = sum(b.failed_queries for b in self.batch_results)
        
        print("\n" + "=" * 80)
        print("📊 BATCH PROCESSING SUMMARY")
        print("=" * 80)
        
        print(f"🔢 Total Batches: {len(self.batch_results)}")
        print(f"🔢 Total Queries: {total_queries}")
        print(f"✅ Valid Queries: {total_valid}")
        print(f"🔧 Fixed Queries: {total_fixed}")
        print(f"❌ Failed Queries: {total_failed}")
        
        if total_queries > 0:
            print(f"📈 Success Rate: {total_valid / total_queries * 100:.1f}%")
            print(f"🔧 Fix Rate: {total_fixed / total_queries * 100:.1f}%")
        
        # Batch performance
        avg_qps = sum(b.queries_per_second for b in self.batch_results) / len(self.batch_results) if self.batch_results else 0
        print(f"⚡ Average Speed: {avg_qps:.1f} queries/second")
        
        # Top performing batches
        sorted_batches = sorted(self.batch_results, key=lambda x: x.queries_per_second, reverse=True)[:5]
        print(f"\n🏆 Top 5 Fastest Batches:")
        for i, batch in enumerate(sorted_batches, 1):
            success_rate = (batch.valid_queries / batch.total_queries * 100) if batch.total_queries > 0 else 0
            print(f"  {i}. {batch.batch_id}: {batch.queries_per_second:.1f} q/s, {success_rate:.1f}% valid")
        
        # Dataset vs Chart type performance
        dataset_batches = [b for b in self.batch_results if b.batch_type == 'dataset']
        chart_batches = [b for b in self.batch_results if b.batch_type == 'chart_type']
        
        print(f"\n📊 By Batch Type:")
        if dataset_batches:
            dataset_queries = sum(b.total_queries for b in dataset_batches)
            dataset_valid = sum(b.valid_queries for b in dataset_batches)
            print(f"  📊 Dataset batches: {len(dataset_batches)} batches, {dataset_queries} queries, {dataset_valid / dataset_queries * 100:.1f}% valid")
        
        if chart_batches:
            chart_queries = sum(b.total_queries for b in chart_batches)
            chart_valid = sum(b.valid_queries for b in chart_batches)
            print(f"  📈 Chart type batches: {len(chart_batches)} batches, {chart_queries} queries, {chart_valid / chart_queries * 100:.1f}% valid")

def main():
    """Main execution function"""
    layer2_output_dir = "../preprocess/output_layer2/sql_queries"
    csv_data_dir = "../../data/london_datasets_csv"
    output_dir = "./validation_results"
    batch_size = 8  # Process 8 files per batch
    
    print("🚀 Layer2 Batch SQL Validation System")
    print("=" * 50)
    print(f"📂 Layer2 Output: {layer2_output_dir}")
    print(f"📁 CSV Data: {csv_data_dir}")
    print(f"💾 Results: {output_dir}")
    print(f"📦 Batch Size: {batch_size}")
    
    try:
        processor = BatchProcessor(csv_data_dir, batch_size)
        processor.process_all_batches(layer2_output_dir)
        processor.save_batch_results(output_dir)
        processor.print_batch_summary()
        
        print("\n🎉 Batch processing completed successfully!")
        
    except Exception as e:
        print(f"💥 Batch processing failed: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
