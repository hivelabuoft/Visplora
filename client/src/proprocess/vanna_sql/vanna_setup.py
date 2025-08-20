import os
import pandas as pd
from dotenv import load_dotenv
from vanna.openai.openai_chat import OpenAI_Chat

# Load environment variables
load_dotenv('../../../.env.local')

class VannaSQL:
    def __init__(self):
        """Initialize Vanna with OpenAI integration"""
        self.vn = OpenAI_Chat(
            model='gpt-4o',
            api_key=os.getenv('OPENAI_API_KEY')
        )
        
        # Dataset file mappings (same as sql_query_executor.js)
        self.dataset_paths = {
            'crime-rates': '../../../public/dataset/london/crime-rates/london_crime_data_2022_2023.csv',
            'ethnicity': '../../../public/dataset/london/ethnicity/Ethnic group.csv',
            'country-of-births': '../../../public/dataset/london/country-of-births/cob-borough.csv',
            'population': '../../../public/dataset/london/population/population 1801 to 2021.csv',
            'income': '../../../public/dataset/london/income/income-of-tax-payers.csv',
            'house-prices': '../../../public/dataset/london/house-prices/land-registry-house-prices-borough.csv',
            'schools-colleges': '../../../public/dataset/london/schools-colleges/2022-2023_england_school_information.csv',
            'vehicles': '../../../public/dataset/london/vehicles/vehicles-licensed-type-borough_2023.csv',
            'restaurants': '../../../public/dataset/london/restaurants/licensed-restaurants-cafes-borough_Restaurants-units.csv',
            'private-rent': '../../../public/dataset/london/private-rent/voa-average-rent-borough_Raw-data.csv',
            'gyms': '../../../public/dataset/london/gyms/london_gym_facilities_2024.csv',
            'libraries': '../../../public/dataset/london/libraries/libraries-by-areas-chart.csv'
        }
        
    def train_on_csv(self, dataset_name, csv_path=None, sample_size=1000):
        """
        Train Vanna on a CSV dataset
        
        Args:
            dataset_name (str): Name of the dataset
            csv_path (str): Optional path to CSV file (uses dataset_paths if not provided)
            sample_size (int): Number of rows to sample for training
        """
        try:
            # Get CSV path
            if csv_path is None:
                if dataset_name not in self.dataset_paths:
                    raise ValueError(f"Dataset '{dataset_name}' not found in dataset_paths")
                csv_path = self.dataset_paths[dataset_name]
            
            print(f"📊 Loading dataset: {dataset_name}")
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
            
            # Train Vanna on the CSV structure and sample data
            print(f"🎓 Training Vanna on {dataset_name}...")
            
            # Train on data structure and sample content
            self.vn.train(
                df=df_sample,
                documentation=f"This is the {dataset_name} dataset with columns: {', '.join(df.columns.tolist())}"
            )
            
                
            print(f"✅ Training completed for {dataset_name}")
            
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
            
            # Generate SQL
            sql = self.vn.generate_sql(full_question)
            print(f"📝 Generated SQL:\n{sql}")
            
            return sql
            
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
            
            # Get actual dataset schema info
            dataset_info = ""
            if dataset in self.dataset_paths:
                try:
                    import pandas as pd
                    df = pd.read_csv(self.dataset_paths[dataset])
                    columns = df.columns.tolist()
                    sample_data = df.head(3).to_dict('records')
                    dataset_info = f"Available columns: {', '.join(columns)}\nSample data: {sample_data}"
                except:
                    dataset_info = "Could not load dataset schema"
            
            # Create validation prompt
            validation_prompt = f"""
            Please validate and fix this SQL query for the {dataset} dataset:
            
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
            
            Please analyze this SQL query and check for:
            1. Wrong table names (should match actual dataset structure)
            2. Wrong column names (check against available columns)
            3. Syntax errors (GROUP BY, aggregation functions, etc.)
            4. Logic errors (incorrect aggregations, wrong filters)
            5. Missing or incorrect data types
            
            If issues are found, provide a corrected SQL query that:
            - Uses correct table/column names for the {dataset} dataset
            - Produces the expected output structure: {expected_output}
            - Handles the data appropriately for this dataset
            - Follows proper SQL syntax
            
            Return your response in this format:
            ISSUES FOUND: [list any issues, or "None" if query is correct]
            CORRECTED SQL: [provide fixed SQL query]
            """
            
            # Get Vanna's analysis and fix
            response = self.vn.generate_sql(validation_prompt)
            
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
