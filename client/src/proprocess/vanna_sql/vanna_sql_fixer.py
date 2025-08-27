import os
import sys
import json
from pathlib import Path

# Add parent directory to path to import existing modules
sys.path.append(str(Path(__file__).parent.parent))

from vanna_setup import VannaSQL

class VannaPropositionFixer:
    """
    Integration between Vanna AI and the existing proposition SQL queries
    """
    
    def __init__(self):
        self.vanna = VannaSQL()
        self.proposition_dirs = [
            '../output/by_dataset',
            '../output/cross_dataset', 
            '../output2',
            '../output/underused_charts'
        ]
    
    def find_proposition_files(self):
        """Find all proposition JSON files"""
        proposition_files = []
        
        for dir_path in self.proposition_dirs:
            if os.path.exists(dir_path):
                for root, dirs, files in os.walk(dir_path):
                    for file in files:
                        if file.endswith('.json'):
                            proposition_files.append(os.path.join(root, file))
        
        return proposition_files
    
    def extract_sql_queries(self, file_path):
        """Extract SQL queries from proposition files"""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            sql_queries = []
            
            # Handle different file structures
            propositions = []
            if 'sample_propositions' in data:
                propositions = data['sample_propositions']
            elif 'propositions' in data:
                propositions = data['propositions']
            elif isinstance(data, list):
                propositions = data
            
            for prop in propositions:
                if 'sql_query' in prop and prop['sql_query']:
                    sql_queries.append({
                        'proposition_id': prop.get('proposition_id', ''),
                        'dataset': prop.get('dataset', ''),
                        'sql_query': prop['sql_query'],
                        'variables_needed': prop.get('variables_needed', []),
                        'reworded_proposition': prop.get('reworded_proposition', '')
                    })
            
            return sql_queries
            
        except Exception as e:
            print(f"❌ Error reading {file_path}: {str(e)}")
            return []
    
    def validate_and_fix_sql(self, sql_info):
        """
        Validate SQL query and fix if needed using Vanna
        """
        sql_query = sql_info['sql_query']
        dataset = sql_info['dataset']
        proposition = sql_info.get('reworded_proposition', '')
        
        print(f"\n🔍 Validating SQL for: {sql_info['proposition_id']}")
        print(f"📊 Dataset: {dataset}")
        print(f"💭 Proposition: {proposition}")
        print(f"🔧 Original SQL: {sql_query}")
        
        try:
            # Try to improve/fix the SQL using Vanna
            improved_question = f"""
            For the {dataset} dataset, generate SQL to answer: {proposition}
            
            Original SQL attempt: {sql_query}
            Required variables: {', '.join(sql_info.get('variables_needed', []))}
            
            Please provide an improved SQL query that:
            1. Uses correct table and column names for the {dataset} dataset
            2. Handles the data structure appropriately 
            3. Answers the question effectively
            """
            
            improved_sql = self.vanna.ask_sql(improved_question, dataset)
            
            if improved_sql and improved_sql.strip() != sql_query.strip():
                print(f"✅ Improved SQL: {improved_sql}")
                return {
                    **sql_info,
                    'original_sql': sql_query,
                    'improved_sql': improved_sql,
                    'status': 'improved'
                }
            else:
                print("ℹ️  No improvement needed")
                return {
                    **sql_info,
                    'status': 'valid'
                }
                
        except Exception as e:
            print(f"❌ Error validating SQL: {str(e)}")
            return {
                **sql_info,
                'status': 'error',
                'error': str(e)
            }
    
    def process_all_propositions(self):
        """Process all proposition files and fix SQL queries"""
        print("🚀 Starting Vanna-powered SQL validation and fixing...")
        
        # First, train Vanna on key datasets
        print("\n📚 Training Vanna on key datasets...")
        key_datasets = ['crime-rates', 'house-prices', 'ethnicity', 'population', 'vehicles']
        
        for dataset in key_datasets:
            try:
                self.vanna.train_on_csv(dataset, sample_size=300)
            except Exception as e:
                print(f"⚠️  Warning: Could not train on {dataset}: {str(e)}")
        
        # Find all proposition files
        proposition_files = self.find_proposition_files()
        print(f"\n📁 Found {len(proposition_files)} proposition files")
        
        all_results = []
        
        for file_path in proposition_files:
            print(f"\n📄 Processing: {file_path}")
            
            # Extract SQL queries from file
            sql_queries = self.extract_sql_queries(file_path)
            
            if not sql_queries:
                print("  No SQL queries found in this file")
                continue
                
            print(f"  Found {len(sql_queries)} SQL queries")
            
            # Process each SQL query
            for sql_info in sql_queries[:3]:  # Limit to first 3 per file for testing
                result = self.validate_and_fix_sql(sql_info)
                result['source_file'] = file_path
                all_results.append(result)
        
        # Save results
        output_file = 'vanna_sql_fixes.json'
        with open(output_file, 'w') as f:
            json.dump(all_results, f, indent=2)
            
        print(f"\n✅ Processing completed! Results saved to: {output_file}")
        
        # Print summary
        total = len(all_results)
        improved = len([r for r in all_results if r['status'] == 'improved'])
        valid = len([r for r in all_results if r['status'] == 'valid'])
        errors = len([r for r in all_results if r['status'] == 'error'])
        
        print(f"\n📊 SUMMARY:")
        print(f"Total SQL queries processed: {total}")
        print(f"Improved: {improved}")
        print(f"Already valid: {valid}")
        print(f"Errors: {errors}")

def main():
    """Run the Vanna-powered SQL fixer"""
    fixer = VannaPropositionFixer()
    fixer.process_all_propositions()

if __name__ == "__main__":
    main()
