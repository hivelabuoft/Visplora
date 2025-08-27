import os
import pandas as pd
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../../../.env.local')

# Try multiple approaches for Vanna imports
try:
    from vanna.remote import VannaDefault
    VANNA_REMOTE_AVAILABLE = True
except ImportError:
    VANNA_REMOTE_AVAILABLE = False
    VannaDefault = None

try:
    from vanna.openai import OpenAI_Chat
    from vanna.chromadb import ChromaDB_VectorStore
    
    class LocalVanna(ChromaDB_VectorStore, OpenAI_Chat):
        def __init__(self, config=None):
            ChromaDB_VectorStore.__init__(self, config=config)
            OpenAI_Chat.__init__(self, config=config)
    
    VANNA_LOCAL_AVAILABLE = True
except ImportError:
    VANNA_LOCAL_AVAILABLE = False
    LocalVanna = None

# Direct OpenAI integration as fallback
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

class VannaSQL:
    def __init__(self):
        """Initialize Vanna with multiple fallback approaches"""
        
        # Always set dataset paths first
        # Dataset file mappings (matching layer2.js table naming convention)
        self.dataset_paths = {
            'crime_data': '../../../public/dataset/london/crime-rates/london_crime_data_2022_2023.csv',
            'ethnicity_data': '../../../public/dataset/london/ethnicity/Ethnic group.csv',
            'birth_country_data': '../../../public/dataset/london/country-of-births/cob-borough.csv',
            'population_data': '../../../public/dataset/london/population/population 1801 to 2021.csv',
            'income_data': '../../../public/dataset/london/income/income-of-tax-payers.csv',
            'house_price_data': '../../../public/dataset/london/house-prices/land-registry-house-prices-borough.csv',
            'education_data': '../../../public/dataset/london/schools-colleges/2022-2023_england_school_information.csv',
            'vehicle_data': '../../../public/dataset/london/vehicles/vehicles-licensed-type-borough_2023.csv',
            'restaurant_data': '../../../public/dataset/london/restaurants/licensed-restaurants-cafes-borough_Restaurants-units.csv',
            'rent_data': '../../../public/dataset/london/private-rent/voa-average-rent-borough_Raw-data.csv',
            'gym_data': '../../../public/dataset/london/gyms/london_gym_facilities_2024.csv',
            'library_data': '../../../public/dataset/london/libraries/libraries-by-areas-chart.csv'
        }
        
        # Try to get API key from environment
        api_key = os.getenv('OPENAI_API_KEY')
        
        # If not found, try to load from .env.local directly
        if not api_key:
            try:
                with open('../../../.env.local', 'r') as f:
                    for line in f:
                        if line.startswith('OPENAI_API_KEY='):
                            api_key = line.split('=', 1)[1].strip().strip('"\'')
                            break
            except:
                pass
        
        if not api_key:
            print("❌ OPENAI_API_KEY not found in environment or .env.local")
            self.vn = None
            self.api_key = None
            self.use_direct_openai = False
            return
        
        self.api_key = api_key
        print(f"✅ Found OpenAI API key: {api_key[:10]}...")
        
        # Try Vanna Remote first
        self.vn = None
        if VANNA_REMOTE_AVAILABLE:
            try:
                print("🔄 Trying VannaDefault (remote)...")
                vn = VannaDefault(model='gpt-4o', api_key=api_key)
                
                # Test it with a simple query
                test_sql = vn.generate_sql("SELECT 1")
                self.vn = vn
                self.use_direct_openai = False
                print("✅ VannaDefault initialized successfully")
                return
            except Exception as e:
                print(f"⚠️  VannaDefault failed: {e}")
        
        # Try Local Vanna
        if VANNA_LOCAL_AVAILABLE:
            try:
                print("🔄 Trying LocalVanna...")
                vn = LocalVanna(config={'api_key': api_key, 'model': 'gpt-4o'})
                self.vn = vn
                self.use_direct_openai = False
                print("✅ LocalVanna initialized successfully")
                return
            except Exception as e:
                print(f"⚠️  LocalVanna failed: {e}")
        
        # Fallback to direct OpenAI API
        if OPENAI_AVAILABLE:
            try:
                print("🔄 Using direct OpenAI API...")
                from openai import OpenAI
                
                # Initialize OpenAI client with new format
                self.openai_client = OpenAI(api_key=api_key)
                
                # Test the API
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{"role": "user", "content": "Hello"}],
                    max_tokens=10
                )
                
                self.vn = None  # We'll handle this directly
                self.use_direct_openai = True
                print("✅ Direct OpenAI API initialized successfully")
                return
            except Exception as e:
                print(f"⚠️  Direct OpenAI failed: {e}")
                # Try legacy format
                try:
                    print("🔄 Trying legacy OpenAI format...")
                    import openai as openai_legacy
                    openai_legacy.api_key = api_key
                    
                    # Test the legacy API
                    response = openai_legacy.ChatCompletion.create(
                        model="gpt-4o",
                        messages=[{"role": "user", "content": "Hello"}],
                        max_tokens=10
                    )
                    
                    self.vn = None
                    self.use_direct_openai = True
                    self.openai_client = None  # Use legacy format
                    print("✅ Legacy OpenAI API initialized successfully")
                    return
                except Exception as legacy_error:
                    print(f"⚠️  Legacy OpenAI also failed: {legacy_error}")
        
        # All methods failed
        print("❌ All initialization methods failed")
        self.vn = None
        self.use_direct_openai = False
    def generate_sql_direct(self, prompt):
        """Generate SQL using direct OpenAI API when Vanna is not available"""
        if not self.use_direct_openai or not OPENAI_AVAILABLE:
            return None
        
        try:
            if hasattr(self, 'openai_client') and self.openai_client:
                # Use new OpenAI client format
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are an expert SQL developer. Generate only valid SQL queries based on user requests."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.1
                )
                return response.choices[0].message.content.strip()
            else:
                # Use legacy format
                import openai as openai_legacy
                response = openai_legacy.ChatCompletion.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are an expert SQL developer. Generate only valid SQL queries based on user requests."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.1
                )
                return response.choices[0].message.content.strip()
                
        except Exception as e:
            print(f"❌ Direct OpenAI SQL generation failed: {e}")
            return None
    
    def train_on_csv(self, dataset_name, csv_path=None, sample_size=1000):
        """
        Train Vanna on a CSV dataset
        
        Args:
            dataset_name (str): Name of the dataset (e.g. 'crime-rates' or 'crime_data')
            csv_path (str): Optional path to CSV file (uses dataset_paths if not provided)
            sample_size (int): Number of rows to sample for training
        """
        try:
            # Map dataset name to table name if needed
            dataset_to_table = {
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
            
            table_name = dataset_to_table.get(dataset_name, dataset_name)
            
            # Get CSV path
            if csv_path is None:
                if table_name not in self.dataset_paths:
                    raise ValueError(f"Dataset '{table_name}' not found in dataset_paths")
                csv_path = self.dataset_paths[table_name]
            
            print(f"📊 Loading dataset: {dataset_name} (table: {table_name})")
            print(f"📂 File path: {csv_path}")
            
            # Load CSV data
            df = pd.read_csv(csv_path)
            print(f"✅ Loaded {len(df)} rows, {len(df.columns)} columns")
            
            # Sample data if too large
            if len(df) > sample_size:
                df_sample = df.sample(n=sample_size, random_state=42)
                print(f"📉 Sampled {sample_size} rows for training")
            else:
                df_sample = df
            
            # Only train if Vanna client is available
            if self.vn is not None:
                print(f"🎓 Training Vanna on {dataset_name}...")
                
                # Train on data structure and sample content
                self.vn.train(
                    df=df_sample,
                    documentation=f"This is the {table_name} dataset with columns: {', '.join(df.columns.tolist())}"
                )
                print(f"✅ Training completed for {dataset_name}")
            else:
                print(f"⚠️  Vanna client not available, skipping training for {dataset_name}")
                
        except Exception as e:
            print(f"❌ Error training on {dataset_name}: {str(e)}")
    
    def train_all_datasets(self, sample_size=500):
        """Train Vanna on all available datasets"""
        print("🚀 Training Vanna on all London datasets...")
        
        for dataset_name in self.dataset_paths.keys():
            print(f"\n--- Training on {dataset_name} ---")
            self.train_on_csv(dataset_name, sample_size=sample_size)
            
        print("\n✅ All datasets training completed!")
    
    def ask_sql(self, question, dataset_context=""):
        """
        Ask Vanna to generate SQL for a natural language question
        
        Args:
            question (str): Natural language question
            dataset_context (str): Optional context about which dataset to use
            
        Returns:
            str: Generated SQL query
        """
        try:
            if dataset_context:
                full_question = f"Using the {dataset_context} dataset: {question}"
            else:
                full_question = question
                
            print(f"🤔 Question: {full_question}")
            
            # Try Vanna first if available
            if self.vn is not None:
                try:
                    sql = self.vn.generate_sql(full_question)
                    print(f"📝 Generated SQL (Vanna):\n{sql}")
                    return sql
                except Exception as e:
                    print(f"⚠️  Vanna generate_sql failed: {e}")
            
            # Try direct OpenAI if available
            if self.use_direct_openai:
                try:
                    sql = self.generate_sql_direct(full_question)
                    print(f"📝 Generated SQL (Direct OpenAI):\n{sql}")
                    return sql
                except Exception as e:
                    print(f"⚠️  Direct OpenAI failed: {e}")
            
            print("⚠️  No working SQL generation client available")
            return None
            
        except Exception as e:
            print(f"❌ Error generating SQL: {str(e)}")
            return None
    
    def validate_proposition_sql(self, proposition_data):
        """
        Validate and fix SQL query from a proposition
        
        Args:
            proposition_data (dict): Proposition data containing:
                - dataset: dataset name (e.g. "crime-rates")
                - sql_query: original SQL query to validate
                - example: expected output structure
                - proposition_id: unique identifier
                - variables_needed: list of required variables (optional)
                - reworded_proposition: description of what query should do (optional)
        
        Returns:
            dict: Validation result with original_sql, fixed_sql, issues_found, status
        """
        try:
            dataset = proposition_data.get('dataset', '')
            original_sql = proposition_data.get('sql_query', '')
            expected_output = proposition_data.get('example', [])
            proposition_id = proposition_data.get('proposition_id', '')
            variables_needed = proposition_data.get('variables_needed', [])
            description = proposition_data.get('reworded_proposition', '')
            
            print(f"🔍 Validating SQL for proposition: {proposition_id}")
            print(f"📊 Dataset: {dataset}")
            print(f"📝 Original SQL: {original_sql}")
            
            # Check if any client is available
            if self.vn is None and not self.use_direct_openai:
                print("⚠️  No SQL validation client available, skipping validation")
                return {
                    "proposition_id": proposition_id,
                    "dataset": dataset,
                    "status": "skipped",
                    "original_sql": original_sql,
                    "fixed_sql": original_sql,
                    "issues_found": ["No SQL validation client available"],
                    "validation_response": "Skipped - No validation client initialized"
                }
            
            # Get actual dataset schema info
            dataset_info = ""
            
            # Map dataset name to table name (matching layer2.js convention)
            dataset_to_table = {
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
            
            table_name = dataset_to_table.get(dataset, dataset + '_data')
            
            if table_name in self.dataset_paths:
                try:
                    import pandas as pd
                    df = pd.read_csv(self.dataset_paths[table_name])
                    columns = df.columns.tolist()
                    sample_data = df.head(3).to_dict('records')
                    dataset_info = f"Available columns: {', '.join(columns)}\nSample data: {sample_data}"
                except:
                    dataset_info = "Could not load dataset schema"
            
            # Create validation prompt
            validation_prompt = f"""
            CRITICAL: You are validating SQL for the {dataset} dataset. Before suggesting any fixes, you MUST carefully examine the actual data format in this specific dataset.
            
            ORIGINAL SQL QUERY:
            {original_sql}
            
            DATASET INFO:
            {dataset_info}
            
            EXPECTED OUTPUT STRUCTURE:
            {expected_output}
            
            REQUIRED VARIABLES:
            {', '.join(variables_needed) if variables_needed else 'Not specified'}
            
            QUERY PURPOSE:
            {description if description else 'Not specified'}
            
            CRITICAL DATE/TIME FORMAT VALIDATION:
            1. Each dataset has DIFFERENT date/time formats - DO NOT assume!
            2. For crime-rates dataset: date column contains "2022-01" format (YYYY-MM), NOT full dates like "2022-01-01"
            3. For other datasets: You MUST check what the actual date format is before suggesting changes
            4. NEVER change date filtering unless you're certain the current format is wrong for the actual data
            5. Common mistake: changing BETWEEN '2022-01' AND '2023-12' to BETWEEN '2022-01-01' AND '2023-12-31' when data has YYYY-MM format
            
            Please analyze this SQL query and check for:
            1. **FIRST PRIORITY**: Verify date/time format compatibility with actual data
            2. Wrong table names (should match actual dataset structure)
            3. Wrong column names (check against available columns)
            4. Syntax errors (GROUP BY, aggregation functions, etc.)
            5. Logic errors (incorrect aggregations, wrong filters)
            6. Missing or incorrect data types
            
            EXAMPLES OF CORRECT DATE FILTERING:
            - If date column has "2022-01" format: WHERE date BETWEEN '2022-01' AND '2023-12'
            - If date column has full dates: WHERE date BETWEEN '2022-01-01' AND '2023-12-31'  
            - If using year column (integer): WHERE year BETWEEN 2022 AND 2023
            
            If issues are found, provide a corrected SQL query that:
            - Uses correct table/column names for the {dataset} dataset
            - Uses date filtering that matches the ACTUAL data format
            - Produces the expected output structure: {expected_output}
            - Handles the data appropriately for this dataset
            - Follows proper SQL syntax
            
            Return your response in this format:
            ISSUES FOUND: [list any issues, or "None" if query is correct - be specific about date format]
            CORRECTED SQL: [provide fixed SQL query only if needed]
            """
            
            # Get SQL validation response
            response = None
            
            if self.vn is not None:
                # Use Vanna client
                try:
                    response = self.vn.generate_sql(validation_prompt)
                except Exception as e:
                    print(f"⚠️  Vanna generate_sql failed: {e}")
            
            if response is None and self.use_direct_openai:
                # Use direct OpenAI API
                try:
                    response = self.generate_sql_direct(validation_prompt)
                except Exception as e:
                    print(f"⚠️  Direct OpenAI failed: {e}")
            
            if response is None:
                # All methods failed
                return {
                    "proposition_id": proposition_id,
                    "dataset": dataset,
                    "status": "validation_failed",
                    "original_sql": original_sql,
                    "fixed_sql": original_sql,
                    "issues_found": ["SQL validation failed - no working client"],
                    "validation_response": "Validation failed"
                }
            
            # Parse the response to extract issues and corrected SQL
            issues_found = []
            fixed_sql = original_sql
            
            if "ISSUES FOUND:" in response:
                parts = response.split("CORRECTED SQL:")
                if len(parts) >= 2:
                    issues_section = parts[0].replace("ISSUES FOUND:", "").strip()
                    fixed_sql = parts[1].strip()
                    
                    if issues_section.lower() != "none":
                        issues_found = [issues_section]
            
            # Determine status
            if not issues_found:
                status = "valid"
                fixed_sql = original_sql
            elif fixed_sql != original_sql:
                status = "fixed"
            else:
                status = "needs_attention"
            
            result = {
                "proposition_id": proposition_id,
                "dataset": dataset,
                "status": status,
                "original_sql": original_sql,
                "fixed_sql": fixed_sql,
                "issues_found": issues_found,
                "validation_response": response
            }
            
            print(f"✅ Validation completed - Status: {status}")
            if issues_found:
                print(f"⚠️  Issues found: {', '.join(issues_found)}")
            if status == "fixed":
                print(f"🔧 Fixed SQL: {fixed_sql}")
            
            return result
            
        except Exception as e:
            print(f"❌ Error validating SQL: {str(e)}")
            return {
                "proposition_id": proposition_data.get('proposition_id', ''),
                "dataset": proposition_data.get('dataset', ''),
                "status": "error",
                "original_sql": proposition_data.get('sql_query', ''),
                "fixed_sql": None,
                "issues_found": [f"Validation error: {str(e)}"],
                "error": str(e)
            }

    def fix_sql_with_context(self, original_sql, error_message, question=""):
        """
        Fix SQL query using error context
        
        Args:
            original_sql (str): The SQL query that failed
            error_message (str): Error message from execution
            question (str): Original question/intent
            
        Returns:
            str: Fixed SQL query
        """
        try:
            fix_prompt = f"""
            The following SQL query failed with an error:
            
            Original SQL: {original_sql}
            Error: {error_message}
            Original Question: {question}
            
            Please provide a corrected SQL query that fixes this error.
            """
            
            print(f"🔧 Attempting to fix SQL query...")
            print(f"❌ Original error: {error_message}")
            
            # Use Vanna to generate a fixed query
            fixed_sql = self.vn.generate_sql(fix_prompt)
            print(f"✅ Fixed SQL:\n{fixed_sql}")
            
            return fixed_sql
            
        except Exception as e:
            print(f"❌ Error fixing SQL: {str(e)}")
            return None

    def batch_validate_propositions(self, propositions_list):
        """
        Validate multiple propositions at once
        
        Args:
            propositions_list (list): List of proposition dictionaries
            
        Returns:
            list: List of validation results
        """
        print(f"🚀 Starting batch validation of {len(propositions_list)} propositions...")
        
        results = []
        for i, proposition in enumerate(propositions_list):
            print(f"\n--- Processing {i+1}/{len(propositions_list)} ---")
            result = self.validate_proposition_sql(proposition)
            results.append(result)
            
        # Summary
        valid = len([r for r in results if r['status'] == 'valid'])
        fixed = len([r for r in results if r['status'] == 'fixed'])
        errors = len([r for r in results if r['status'] == 'error'])
        needs_attention = len([r for r in results if r['status'] == 'needs_attention'])
        
        print(f"\n📊 BATCH VALIDATION SUMMARY:")
        print(f"Total: {len(results)}")
        print(f"Valid: {valid}")
        print(f"Fixed: {fixed}")
        print(f"Errors: {errors}")
        print(f"Needs Attention: {needs_attention}")
        
        return results

def main():
    """Example usage of VannaSQL with proposition validation"""
    vanna = VannaSQL()
    
    # Example 1: Train on crime data
    print("=== Training on Crime Data ===")
    vanna.train_on_csv('crime-rates', sample_size=1000)
    
    # Example 2: Validate a proposition SQL query
    print("\n=== Validating Proposition SQL ===")
    
    # Example proposition (like the one from your file)
    sample_proposition = {
        "proposition_id": "crime-rates_temporal_trends_temp_001",
        "dataset": "crime-rates",
        "time_period": "2022-2023",
        "variables_needed": ["crime_category", "date", "count"],
        "chart_type": "lineChart_simple_2D",
        "example": [
            {"time": "", "value": 0},
            {"time": "", "value": 0}
        ],
        "sql_query": "SELECT date AS time, SUM(count) AS value FROM crime_data WHERE date BETWEEN '2022-01-01' AND '2023-12-31' GROUP BY date ORDER BY date;",
        "reworded_proposition": "Crime incidents show temporal trends across months in London"
    }
    
    # Validate this proposition
    validation_result = vanna.validate_proposition_sql(sample_proposition)
    
    print(f"\nValidation Result:")
    print(f"Status: {validation_result['status']}")
    print(f"Issues: {validation_result.get('issues_found', [])}")
    
    # Example 3: Batch validate multiple propositions
    print("\n=== Batch Validation Example ===")
    
    # Sample propositions with different potential issues
    sample_propositions = [
        sample_proposition,  # The good one
        {
            "proposition_id": "crime-rates_bad_example_001",
            "dataset": "crime-rates", 
            "sql_query": "SELECT wrong_column FROM wrong_table GROUP BY invalid_field;",
            "example": [{"category": "", "count": 0}]
        }
    ]
    
    batch_results = vanna.batch_validate_propositions(sample_propositions)
    
    # Save results to file
    import json
    with open('validation_results.json', 'w') as f:
        json.dump(batch_results, f, indent=2)
    
    print(f"\n💾 Results saved to validation_results.json")
    
    # Example 4: Ask questions (original functionality)
    print("\n=== Asking Questions ===")
    
    questions = [
        "What are the top 5 boroughs with highest crime rates?",
        "Show monthly crime trends for 2022"
    ]
    
    for question in questions:
        print(f"\n--- Question: {question} ---")
        sql = vanna.ask_sql(question, "crime-rates")
        if sql:
            print("Generated successfully!")

if __name__ == "__main__":
    main()
