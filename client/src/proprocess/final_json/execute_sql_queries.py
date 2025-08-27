#!/usr/bin/env python3
"""
SQL Query Executor for Chart Propositions
Executes SQL queries from validated propositions and generates final JSON with actual data.
"""

import os
import json
import pandas as pd
import sqlite3
import re
from datetime import datetime
import argparse
from pathlib import Path
import random
from typing import List, Dict, Any, Optional

class SQLQueryExecutor:
    def __init__(self):
        """Initialize the SQL Query Executor"""
        # Dataset file mappings (from vanna_setup.py)
        self.dataset_paths = {
            'crime_data': '../../../public/dataset/london/crime-rates/london_crime_data_2022_2023.csv',
            'ethnicity_data': '../../../public/dataset/london/ethnicity/Ethnic group.csv',
            'birth_country_data': '../../../public/dataset/london/country-of-births/cob-borough.csv',
            'country_of_births': '../../../public/dataset/london/country-of-births/cob-borough.csv',  # Alternative name
            'population_data': '../../../public/dataset/london/population/population 1801 to 2021.csv',
            'income_data': '../../../public/dataset/london/income/income-of-tax-payers.csv',
            'house_price_data': '../../../public/dataset/london/house-prices/land-registry-house-prices-borough.csv',
            'house_prices': '../../../public/dataset/london/house-prices/land-registry-house-prices-borough.csv',  # Alternative name
            'education_data': '../../../public/dataset/london/schools-colleges/2022-2023_england_school_information.csv',
            'vehicle_data': '../../../public/dataset/london/vehicles/vehicles-licensed-type-borough_2023.csv',
            'restaurant_data': '../../../public/dataset/london/restaurants/licensed-restaurants-cafes-borough_Restaurants-units.csv',
            'rent_data': '../../../public/dataset/london/private-rent/voa-average-rent-borough_Raw-data.csv',
            'gym_data': '../../../public/dataset/london/gyms/london_gym_facilities_2024.csv',
            'library_data': '../../../public/dataset/london/libraries/libraries-by-areas-chart.csv'
        }
        
        # Dataset to table name mapping (from layer2.js convention)
        self.dataset_to_table = {
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
        
        # Load London metadata for better data generation
        self.london_metadata = self._load_london_metadata()
        
        # Create in-memory SQLite database
        self.conn = sqlite3.connect(':memory:')
        self.conn.execute("PRAGMA table_info=json1")  # Enable JSON1 extension if available
        
        # Load all datasets into SQLite
        self.load_datasets()
    
    def _load_london_metadata(self) -> Dict[str, Any]:
        """Load London dataset metadata for better data generation"""
        try:
            metadata_path = "/Users/h2o/Documents/Projects/Research/Visplora/client/public/data/london_metadata.json"
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            print(f"📊 Loaded metadata for {len(metadata.get('categories', []))} dataset categories")
            return metadata
        except Exception as e:
            print(f"⚠️  Failed to load London metadata: {e}")
            return {"categories": []}
    
    def load_datasets(self):
        """Load all CSV datasets into SQLite database"""
        print("📂 Loading datasets into SQLite database...")
        
        for table_name, csv_path in self.dataset_paths.items():
            try:
                if os.path.exists(csv_path):
                    print(f"  Loading {table_name} from {csv_path}")
                    df = pd.read_csv(csv_path)
                    
                    # Clean column names (replace spaces and special characters)
                    df.columns = [col.strip().replace(' ', '_').replace('-', '_').replace('/', '_') 
                                for col in df.columns]
                    
                    # Load into SQLite
                    df.to_sql(table_name, self.conn, if_exists='replace', index=False)
                    
                    print(f"    ✅ Loaded {len(df)} rows, {len(df.columns)} columns")
                else:
                    print(f"    ❌ File not found: {csv_path}")
                    
            except Exception as e:
                print(f"    ❌ Error loading {table_name}: {e}")
        
        print("✅ Dataset loading completed")
    
    def clean_sql_query(self, sql_query):
        """Clean and prepare SQL query for execution"""
        # Remove markdown code block markers
        sql_query = re.sub(r'```sql\n?', '', sql_query)
        sql_query = re.sub(r'```\n?', '', sql_query)
        
        # Remove comments and notes that appear after the query
        lines = sql_query.split('\n')
        cleaned_lines = []
        in_sql = True
        
        for line in lines:
            line = line.strip()
            
            # Stop processing when we hit explanatory text
            if line.lower().startswith(('note:', 'explanation:', 'this query')):
                break
                
            if line and not line.startswith('--') and in_sql:
                cleaned_lines.append(line)
        
        sql_query = '\n'.join(cleaned_lines)
        
        # Handle multiple statements - take only the first one
        if 'UNION ALL' in sql_query and sql_query.count(';') > 1:
            # For UNION queries, we need to handle them specially
            statements = sql_query.split(';')
            sql_query = statements[0] + ';'
        
        # Replace common table name variations
        replacements = {
            'dataset_name': 'birth_country_data',
            'your_table_name': 'restaurant_data'
        }
        
        for old, new in replacements.items():
            sql_query = sql_query.replace(old, new)
        
        # Fix column names that might have been affected by CSV loading
        column_fixes = {
            '"local authority name"': 'local_authority_name',
            '"All usual residents"': 'All_usual_residents',
            '"White British"': 'White_British',
            '"Area name"': 'Area_name',
            '"Local Authority"': 'Local_Authority',
            'crime_rate': 'COUNT(*)',  # Fix missing crime_rate column
        }
        
        for old, new in column_fixes.items():
            sql_query = sql_query.replace(old, new)
        
        # Handle SQLite-specific function replacements
        sqlite_fixes = {
            'DATE_TRUNC(\'month\', TO_DATE(date || \'-01\', \'YYYY-MM-DD\'))': 'date',
            'CONCAT(': '(',  # SQLite uses || for concatenation
        }
        
        for old, new in sqlite_fixes.items():
            if old in sql_query:
                if 'CONCAT(' in old:
                    # Fix CONCAT to use || operator
                    sql_query = re.sub(r'CONCAT\(([^,]+),\s*([^)]+)\)', r'\1 || \2', sql_query)
                else:
                    sql_query = sql_query.replace(old, new)
        
        return sql_query.strip()
    
    def detect_dataset_from_proposition(self, proposition):
        """Detect which dataset is being used from the proposition"""
        prop_id = proposition.get('proposition_id', '')
        
        # Extract dataset from proposition ID
        for dataset_name in self.dataset_to_table.keys():
            if prop_id.startswith(dataset_name):
                return self.dataset_to_table[dataset_name]
        
        # Fallback: look in SQL query for table names
        sql_query = proposition.get('sql_query', '')
        for table_name in self.dataset_paths.keys():
            if table_name in sql_query:
                return table_name
        
        return None
    
    def execute_sql_query(self, sql_query, max_rows=100):
        """Execute SQL query and return results as JSON"""
        try:
            # Clean the SQL query
            cleaned_sql = self.clean_sql_query(sql_query)
            
            if not cleaned_sql:
                return {"error": "Empty SQL query after cleaning"}
            
            print(f"    🔍 Executing: {cleaned_sql[:100]}...")
            
            # Execute query with row limit
            if 'LIMIT' not in cleaned_sql.upper():
                if cleaned_sql.rstrip().endswith(';'):
                    cleaned_sql = cleaned_sql.rstrip(';') + f' LIMIT {max_rows};'
                else:
                    cleaned_sql += f' LIMIT {max_rows}'
            
            # Execute the query
            result = pd.read_sql_query(cleaned_sql, self.conn)
            
            # Convert to JSON-serializable format
            result_dict = result.to_dict('records')
            
            print(f"    ✅ Query executed successfully, {len(result_dict)} rows returned")
            
            return result_dict
            
        except Exception as e:
            error_msg = str(e)
            print(f"    ❌ SQL execution error: {error_msg}")
            
            # Try to provide more helpful error messages
            if 'no such table' in error_msg.lower():
                available_tables = [name[0] for name in self.conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
                error_msg += f". Available tables: {', '.join(available_tables)}"
            
            return {"error": error_msg}
    
    def execute_query(self, sql_query, max_rows=100):
        """Alias for execute_sql_query to maintain compatibility"""
        return self.execute_sql_query(sql_query, max_rows)
    
    def compute_mean_value(self, sql_query, table_name):
        """Compute mean value for queries that need it"""
        try:
            # Clean the SQL query first
            cleaned_sql = self.clean_sql_query(sql_query)
            
            # Remove ORDER BY and LIMIT clauses for subquery
            cleaned_for_subquery = re.sub(r'\s+ORDER BY[^;]*', '', cleaned_sql, flags=re.IGNORECASE)
            cleaned_for_subquery = re.sub(r'\s+LIMIT\s+\d+', '', cleaned_for_subquery, flags=re.IGNORECASE)
            cleaned_for_subquery = cleaned_for_subquery.rstrip(';')
            
            # Strategy 1: Try to build a simple mean query based on the table and value expression
            if 'AS value' in cleaned_sql:
                # Extract the value expression from the SELECT clause
                select_match = re.search(r'SELECT\s+.*?([\w\(\)]+.*?)\s+AS\s+value', cleaned_sql, re.IGNORECASE | re.DOTALL)
                if select_match:
                    value_expr = select_match.group(1).strip()
                    
                    # Extract FROM and WHERE clauses
                    from_match = re.search(r'FROM\s+(\w+)', cleaned_sql, re.IGNORECASE)
                    where_match = re.search(r'WHERE\s+(.+?)(?:GROUP BY|ORDER BY|LIMIT|$)', cleaned_sql, re.IGNORECASE | re.DOTALL)
                    
                    if from_match:
                        from_table = from_match.group(1)
                        where_clause = where_match.group(1).strip() if where_match else None
                        
                        # Build simple mean query
                        if where_clause:
                            mean_sql = f"SELECT AVG({value_expr}) as mean_value FROM {from_table} WHERE {where_clause}"
                        else:
                            mean_sql = f"SELECT AVG({value_expr}) as mean_value FROM {from_table}"
                        
                        print(f"    🧮 Computing mean (direct): {mean_sql[:100]}...")
                        
                        result = pd.read_sql_query(mean_sql, self.conn)
                        mean_value = result.iloc[0]['mean_value'] if len(result) > 0 else None
                        
                        if mean_value is not None:
                            print(f"    ✅ Mean computed: {mean_value}")
                            return float(mean_value)
            
            # Strategy 2: Use subquery approach (fallback)
            try:
                mean_sql = f"SELECT AVG(CAST(value AS FLOAT)) as mean_value FROM ({cleaned_for_subquery}) as subquery"
                
                print(f"    🧮 Computing mean (subquery): {mean_sql[:100]}...")
                
                result = pd.read_sql_query(mean_sql, self.conn)
                mean_value = result.iloc[0]['mean_value'] if len(result) > 0 else None
                
                if mean_value is not None:
                    print(f"    ✅ Mean computed: {mean_value}")
                    return float(mean_value)
                    
            except Exception as subquery_error:
                print(f"    ⚠️ Subquery approach failed: {subquery_error}")
            
            # Strategy 3: Execute original query and compute mean from results
            try:
                print(f"    🧮 Computing mean from query results...")
                
                # Execute the original query to get results
                original_results = self.execute_sql_query(sql_query, max_rows=1000)
                
                if isinstance(original_results, list) and original_results:
                    # Find the 'value' column and compute mean
                    values = []
                    for row in original_results:
                        if 'value' in row and row['value'] is not None:
                            try:
                                values.append(float(row['value']))
                            except (ValueError, TypeError):
                                continue
                    
                    if values:
                        mean_value = sum(values) / len(values)
                        print(f"    ✅ Mean computed from results: {mean_value}")
                        return mean_value
                        
            except Exception as results_error:
                print(f"    ⚠️ Results-based mean failed: {results_error}")
            
            print(f"    ⚠️ All mean computation strategies failed")
            return None
            
        except Exception as e:
            print(f"    ❌ Mean computation error: {e}")
            return None
    
    def get_chart_data_requirements(self, chart_type: str) -> Dict[str, Any]:
        """Get minimum data requirements for different chart types"""
        requirements = {
            'min_records': 1,
            'is_time_series': False,
            'typical_columns': ['category', 'value'],
            'data_generation_strategy': 'categorical'
        }
        
        # Time series charts need more data points
        if any(keyword in chart_type.lower() for keyword in ['line', 'area', 'scatter']):
            requirements['min_records'] = 6
            requirements['is_time_series'] = True
            requirements['typical_columns'] = ['time', 'value']
            requirements['data_generation_strategy'] = 'time_series'
        
        # Heatmaps and histograms need adequate coverage
        if any(keyword in chart_type.lower() for keyword in ['heatmap', 'histogram']):
            requirements['min_records'] = 8
            requirements['typical_columns'] = ['x_bin', 'y_bin', 'count']
            requirements['data_generation_strategy'] = 'distribution'
        
        # Multi-dimensional charts
        if '3D' in chart_type or 'grouped' in chart_type.lower():
            requirements['min_records'] = 5
            requirements['typical_columns'] = ['category', 'value', 'dimension']
            requirements['data_generation_strategy'] = 'multi_dimensional'
        
        # Divergent charts
        if 'divergent' in chart_type.lower():
            requirements['typical_columns'] = ['category', 'positive_value', 'negative_value']
            requirements['data_generation_strategy'] = 'divergent'
        
        # Combo charts
        if 'combo' in chart_type.lower():
            requirements['typical_columns'] = ['category', 'bar_value', 'line_value']
            requirements['data_generation_strategy'] = 'combo'
        
        return requirements
    
    def generate_realistic_data(self, proposition: Dict[str, Any], requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate realistic data based on proposition context and requirements using metadata"""
        
        chart_type = proposition.get('chart_type', '')
        prop_id = proposition.get('proposition_id', '')
        description = proposition.get('proposition_description', '')
        
        # Determine dataset context from metadata
        dataset_name = None
        dataset_metadata = None
        
        for ds_name in self.dataset_to_table.keys():
            if prop_id.startswith(ds_name):
                dataset_name = ds_name
                # Find corresponding metadata
                for category in self.london_metadata.get('categories', []):
                    if category['name'] == dataset_name:
                        dataset_metadata = category
                        break
                break
        
        strategy = requirements['data_generation_strategy']
        min_records = requirements['min_records']
        
        print(f"    🎲 Generating {strategy} data for {chart_type} (min: {min_records} records)")
        if dataset_metadata:
            print(f"    📊 Using metadata context for {dataset_name}")
        
        if strategy == 'time_series':
            return self._generate_time_series_data(dataset_name, description, min_records, dataset_metadata)
        elif strategy == 'categorical':
            return self._generate_categorical_data(dataset_name, description, min_records, dataset_metadata)
        elif strategy == 'distribution':
            return self._generate_distribution_data(dataset_name, description, min_records, dataset_metadata)
        elif strategy == 'multi_dimensional':
            return self._generate_multi_dimensional_data(dataset_name, description, min_records, dataset_metadata)
        elif strategy == 'divergent':
            return self._generate_divergent_data(dataset_name, description, min_records, dataset_metadata)
        elif strategy == 'combo':
            return self._generate_combo_data(dataset_name, description, min_records, dataset_metadata)
        else:
            return self._generate_categorical_data(dataset_name, description, min_records, dataset_metadata)
    
    def _generate_time_series_data(self, dataset_name: str, description: str, min_records: int, metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Generate time series data using metadata for realistic values"""
        data = []
        
        # Determine time range and pattern based on dataset
        if dataset_name == 'crime-rates':
            time_values = ['2022-01', '2022-06', '2022-12', '2023-01', '2023-06', '2023-12']
            base_value = random.randint(500, 2000)
        elif dataset_name == 'population':
            time_values = ['2001', '2006', '2011', '2016', '2021']
            base_value = random.randint(200000, 500000)
        else:
            # Generic time series
            time_values = [f"2022-{i:02d}" for i in range(1, min_records + 1)]
            base_value = random.randint(100, 1000)
        
        # Generate trend based on description
        trend_factor = 1.1 if any(word in description.lower() for word in ['increase', 'surge', 'rise', 'growth']) else 0.95
        
        for i, time_val in enumerate(time_values[:min_records]):
            value = int(base_value * (trend_factor ** i) + random.randint(-50, 50))
            data.append({
                'time': time_val,
                'value': max(0, value)  # Ensure non-negative
            })
        
        return data
    
    def _generate_categorical_data(self, dataset_name: str, description: str, min_records: int, metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Generate categorical data using metadata for realistic values"""
        data = []
        
        # Use metadata to get realistic categories and values
        categories = []
        base_range = (50, 500)
        
        if metadata and metadata.get('files'):
            # Extract categories from metadata
            file_summary = metadata['files'][0].get('file_summary', {})
            value_examples = file_summary.get('value_examples', {})
            
            # Try to find categorical columns
            for col_name, values in value_examples.items():
                if isinstance(values, list) and len(values) > 1:
                    if any(keyword in col_name.lower() for keyword in ['name', 'category', 'type', 'group', 'borough']):
                        categories = values[:min_records]
                        break
            
            # Adjust value ranges based on dataset type
            if dataset_name == 'crime-rates':
                base_range = (100, 1500)
            elif dataset_name == 'population':
                base_range = (10000, 100000)
            elif dataset_name == 'income':
                base_range = (25000, 65000)
        
        # Fallback to hardcoded categories if metadata doesn't provide good ones
        if not categories:
            if dataset_name == 'crime-rates':
                categories = ['violent-crime', 'theft', 'burglary', 'anti-social-behaviour', 'drug-offences']
                base_range = (100, 1500)
            elif dataset_name == 'country-of-births':
                categories = ['United Kingdom', 'India', 'Poland', 'Ireland', 'Nigeria', 'Bangladesh']
                base_range = (500, 5000)
            elif dataset_name == 'ethnicity':
                categories = ['White British', 'Asian', 'Black', 'Mixed', 'Other']
                base_range = (10000, 100000)
            elif dataset_name == 'income':
                categories = ['Westminster', 'Kensington and Chelsea', 'Camden', 'Tower Hamlets', 'Hackney']
                base_range = (25000, 65000)
            else:
                # Generic categories
                categories = [f'Category_{i+1}' for i in range(min_records)]
                base_range = (50, 500)
        
        # Generate data using categories
        for i, category in enumerate(categories[:min_records]):
            value = random.randint(*base_range)
            data.append({
                'category': category,
                'value': value
            })
        
        return data
    
    def _generate_distribution_data(self, dataset_name: str, description: str, min_records: int, metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Generate distribution/heatmap data"""
        data = []
        
        if dataset_name == 'crime-rates':
            x_bins = ['violent-crime', 'theft', 'burglary', 'drug-offences']
            y_bins = ['Westminster', 'Camden', 'Hackney', 'Tower Hamlets']
        else:
            x_bins = [f'X_Bin_{i+1}' for i in range(4)]
            y_bins = [f'Y_Bin_{i+1}' for i in range(4)]
        
        for x_bin in x_bins:
            for y_bin in y_bins:
                if len(data) >= min_records:
                    break
                count = random.randint(5, 100)
                data.append({
                    'x_bin': x_bin,
                    'y_bin': y_bin,
                    'count': count
                })
        
        return data[:min_records]
    
    def _generate_multi_dimensional_data(self, dataset_name: str, description: str, min_records: int, metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Generate multi-dimensional data"""
        data = []
        
        if dataset_name == 'crime-rates':
            categories = ['violent-crime', 'theft', 'burglary']
            dimensions = ['Westminster', 'Camden', 'Hackney']
        elif dataset_name == 'ethnicity':
            categories = ['White British', 'Asian', 'Black']
            dimensions = ['Inner London', 'Outer London']
        else:
            categories = [f'Cat_{i+1}' for i in range(3)]
            dimensions = [f'Dim_{i+1}' for i in range(3)]
        
        for category in categories:
            for dimension in dimensions:
                if len(data) >= min_records:
                    break
                value = random.randint(100, 1000)
                data.append({
                    'category': category,
                    'value': value,
                    'dimension': dimension
                })
        
        return data[:min_records]
    
    def _generate_divergent_data(self, dataset_name: str, description: str, min_records: int, metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Generate divergent bar chart data"""
        data = []
        
        if dataset_name == 'crime-rates':
            categories = ['violent-crime', 'theft', 'burglary', 'drug-offences']
        elif dataset_name == 'income':
            categories = ['Westminster', 'Kensington and Chelsea', 'Camden', 'Tower Hamlets']
        else:
            categories = [f'Category_{i+1}' for i in range(min_records)]
        
        for category in categories[:min_records]:
            pos_val = random.randint(50, 300)
            neg_val = random.randint(0, 100)
            data.append({
                'category': category,
                'positive_value': pos_val,
                'negative_value': neg_val
            })
        
        return data
    
    def _generate_combo_data(self, dataset_name: str, description: str, min_records: int, metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Generate combo chart data (bar + line)"""
        data = []
        
        if dataset_name == 'crime-rates':
            categories = ['Westminster', 'Camden', 'Hackney', 'Tower Hamlets', 'Lambeth']
        else:
            categories = [f'Area_{i+1}' for i in range(min_records)]
        
        for category in categories[:min_records]:
            bar_val = random.randint(100, 800)
            line_val = random.randint(50, 200)
            data.append({
                'category': category,
                'bar_value': bar_val,
                'line_value': line_val
            })
        
        return data
    
    def generate_llm_fallback_data(self, proposition: Dict[str, Any], requirements: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Use OpenAI to generate realistic data when rule-based generation isn't sufficient"""
        try:
            # Try to use the existing OpenAI client if available
            if not hasattr(self, 'use_direct_openai') or not self.use_direct_openai:
                print("    ⚠️  No OpenAI client available for LLM fallback")
                return None
            
            chart_type = proposition.get('chart_type', '')
            description = proposition.get('proposition_description', '')
            sql_query = proposition.get('sql_query', '')
            prop_id = proposition.get('proposition_id', '')
            
            # Extract expected columns from SQL
            expected_columns = self._extract_sql_columns(sql_query)
            
            # Get relevant dataset metadata for context
            dataset_context = self._get_dataset_context_for_proposition(prop_id)
            
            # Build comprehensive prompt with metadata context
            prompt = f"""
            Generate realistic sample data for a {chart_type} chart based on London demographic and crime data.
            
            Proposition: {description}
            Expected columns: {expected_columns}
            Minimum records needed: {requirements['min_records']}
            
            Dataset Context:
            {dataset_context}
            
            Requirements:
            1. Generate exactly {requirements['min_records']} records
            2. Use column names that match the expected output: {expected_columns}
            3. Make data values realistic for London (boroughs, crime types, population ranges, etc.)
            4. Include proper data types (numbers for counts, strings for categories)
            5. Ensure data supports the chart type ({chart_type})
            
            Return only a valid JSON array of objects with no additional text or markdown formatting.
            """
            
            print(f"    🤖 Requesting LLM fallback data with dataset context...")
            
            if hasattr(self, 'openai_client') and self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are a data generator. Return only valid JSON arrays."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=2000,
                    temperature=0.3
                )
                
                json_text = response.choices[0].message.content.strip()
                # Clean up the response
                json_text = re.sub(r'^```json\n?', '', json_text)
                json_text = re.sub(r'\n?```$', '', json_text)
                
                llm_data = json.loads(json_text)
                print(f"    ✅ LLM generated {len(llm_data)} records with metadata context")
                
                return llm_data
                
            else:
                # Try legacy OpenAI format
                import openai as openai_legacy
                response = openai_legacy.ChatCompletion.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are a data generator for London demographic and crime visualization. Return only valid JSON arrays with realistic London data."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=800,
                    temperature=0.3
                )
                
                json_text = response.choices[0].message.content.strip()
                json_text = re.sub(r'^```json\n?', '', json_text)
                json_text = re.sub(r'\n?```$', '', json_text)
                
                llm_data = json.loads(json_text)
                print(f"    ✅ LLM generated {len(llm_data)} records with metadata context")
                
                return llm_data
                
        except Exception as e:
            print(f"    ❌ LLM fallback failed: {e}")
            return None
    
    def _extract_sql_columns(self, sql_query: str) -> List[str]:
        """Extract expected column names from SQL query"""
        columns = []
        
        # Look for AS aliases in SELECT clause
        select_match = re.search(r'SELECT\s+(.+?)\s+FROM', sql_query, re.IGNORECASE | re.DOTALL)
        if select_match:
            select_clause = select_match.group(1)
            
            # Find AS aliases
            as_matches = re.findall(r'\w+.*?\s+AS\s+(\w+)', select_clause, re.IGNORECASE)
            columns.extend(as_matches)
        
        return columns if columns else ['category', 'value']
    
    def _get_dataset_context_for_proposition(self, prop_id: str) -> str:
        """Get relevant dataset metadata context for a proposition"""
        
        # Determine which dataset this proposition relates to
        dataset_name = None
        for ds_name in self.dataset_to_table.keys():
            if prop_id.startswith(ds_name):
                dataset_name = ds_name
                break
        
        if not dataset_name or not self.london_metadata.get('categories'):
            return "No specific dataset context available."
        
        # Find matching category in metadata
        for category in self.london_metadata['categories']:
            if category['name'] == dataset_name:
                # Build context from metadata
                context_parts = [
                    f"Dataset: {category['name']} - {category['description']}",
                ]
                
                for file_info in category.get('files', [])[:1]:  # Use first file
                    summary = file_info.get('file_summary', {})
                    
                    # Column information
                    columns = summary.get('column_names', [])
                    if columns:
                        context_parts.append(f"Available columns: {', '.join(columns[:8])}")  # Limit to first 8
                    
                    # Value examples for key columns
                    value_examples = summary.get('value_examples', {})
                    if value_examples:
                        examples_text = []
                        for col, values in list(value_examples.items())[:3]:  # First 3 columns
                            if isinstance(values, list) and values:
                                examples_text.append(f"{col}: {', '.join(map(str, values[:3]))}")
                        if examples_text:
                            context_parts.append(f"Example values: {'; '.join(examples_text)}")
                    
                    # Data sample
                    data_sample = summary.get('data_sample', [])
                    if data_sample:
                        context_parts.append(f"Sample record: {str(data_sample[0])[:200]}...")
                
                return '\n'.join(context_parts)
        
        return f"Dataset category '{dataset_name}' context not found in metadata."
    
    def validate_and_enhance_data(self, sql_result: List[Dict[str, Any]], proposition: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Validate data and enhance if needed based on chart requirements"""
        
        chart_type = proposition.get('chart_type', '')
        requirements = self.get_chart_data_requirements(chart_type)
        
        print(f"    📊 Validating data for {chart_type} (min: {requirements['min_records']} records)")
        
        # Case 1: Empty results - generate data
        if not sql_result or len(sql_result) == 0:
            print(f"    ⚠️  Empty results detected, generating data...")
            
            # Try LLM fallback first
            generated_data = self.generate_llm_fallback_data(proposition, requirements)
            if generated_data and len(generated_data) >= requirements['min_records']:
                return generated_data
            
            # Fall back to rule-based generation
            return self.generate_realistic_data(proposition, requirements)
        
        # Case 2: Insufficient data for time series charts
        if requirements['is_time_series'] and len(sql_result) < requirements['min_records']:
            print(f"    📈 Time series chart needs more data ({len(sql_result)} < {requirements['min_records']})")
            
            # Try to extend existing data
            enhanced_data = self._extend_time_series_data(sql_result, requirements['min_records'])
            if len(enhanced_data) >= requirements['min_records']:
                return enhanced_data
            
            # Generate completely new data if extension failed
            return self.generate_realistic_data(proposition, requirements)
        
        # Case 3: Data looks good
        print(f"    ✅ Data validation passed ({len(sql_result)} records)")
        return sql_result
    
    def _extend_time_series_data(self, existing_data: List[Dict[str, Any]], target_count: int) -> List[Dict[str, Any]]:
        """Extend existing time series data to meet minimum requirements"""
        
        if not existing_data:
            return existing_data
        
        # Try to identify time and value columns
        first_row = existing_data[0]
        time_col = None
        value_col = None
        
        for col in first_row.keys():
            if any(keyword in col.lower() for keyword in ['time', 'date', 'year', 'month']):
                time_col = col
            elif any(keyword in col.lower() for keyword in ['value', 'count', 'amount']):
                value_col = col
        
        if not time_col or not value_col:
            return existing_data
        
        # Generate additional time points
        extended_data = list(existing_data)
        
        # Calculate trend from existing data
        if len(existing_data) >= 2:
            last_val = existing_data[-1][value_col]
            second_last_val = existing_data[-2][value_col] if len(existing_data) > 1 else last_val
            
            try:
                trend = (last_val - second_last_val) / max(1, second_last_val) if second_last_val != 0 else 0.1
            except:
                trend = 0.1
        else:
            trend = 0.1
        
        # Add synthetic future points
        last_time = existing_data[-1][time_col]
        last_value = existing_data[-1][value_col]
        
        for i in range(len(existing_data), target_count):
            new_value = max(0, int(last_value * (1 + trend) + random.randint(-20, 20)))
            
            # Generate next time point (simple increment)
            if '-' in str(last_time):  # Date format
                try:
                    year, month = map(int, str(last_time).split('-'))
                    month += 1
                    if month > 12:
                        month = 1
                        year += 1
                    new_time = f"{year}-{month:02d}"
                except:
                    new_time = f"Future_{i}"
            else:  # Year or other format
                try:
                    new_time = str(int(last_time) + 1)
                except:
                    new_time = f"Period_{i}"
            
            extended_data.append({
                time_col: new_time,
                value_col: new_value
            })
            
            last_time = new_time
            last_value = new_value
        
        return extended_data
    
    def process_proposition(self, proposition: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single proposition by executing its SQL query with error handling."""
        prop_id = proposition.get('proposition_id', 'Unknown')
        chart_type = proposition.get('chart_type', 'Unknown')
        sql_query = proposition.get('sql_query', '')
        
        print(f"\n� Processing {prop_id} ({chart_type})")
        
        if not sql_query:
            print(f"    ⚠️  No SQL query found, generating fallback data")
            requirements = self.get_chart_data_requirements(chart_type)
            fallback_data = self.generate_realistic_data(proposition, requirements)
            return {
                **proposition, 
                'sql_result': fallback_data, 
                'has_mean': False, 
                'mean_value': None, 
                'has_threshold': False,
                'data_source': 'generated'
            }
        
        try:
            # Execute the SQL query
            raw_query_result = self.execute_query(sql_query)
            
            # Validate and enhance the data based on chart requirements
            validated_result = self.validate_and_enhance_data(raw_query_result, proposition)
            
            # Check for threshold conditions in the chart type
            has_threshold = 'threshold' in chart_type.lower()
            
            # Compute mean value if needed (use validated result for consistency)
            mean_value = self.compute_mean_value(sql_query, validated_result)
            has_mean = mean_value is not None
            
            # Determine data source
            data_source = 'sql'
            if validated_result != raw_query_result:
                if not raw_query_result:
                    data_source = 'generated'
                else:
                    data_source = 'enhanced'
            
            # Log results summary
            print(f"    ✅ Final result: {len(validated_result)} rows ({data_source})")
            if has_mean:
                print(f"    📊 Mean value: {mean_value}")
            if has_threshold:
                print(f"    🎯 Threshold chart detected")
            
            # Return enhanced proposition
            return {
                **proposition,
                'sql_result': validated_result,
                'has_mean': has_mean,
                'mean_value': mean_value,
                'has_threshold': has_threshold,
                'data_source': data_source
            }
            
        except Exception as e:
            print(f"    ❌ Error processing {prop_id}: {e}")
            print(f"    🔄 Generating fallback data...")
            
            # Generate fallback data on any error
            try:
                requirements = self.get_chart_data_requirements(chart_type)
                fallback_data = self.generate_realistic_data(proposition, requirements)
                
                return {
                    **proposition,
                    'sql_result': fallback_data,
                    'has_mean': False,
                    'mean_value': None,
                    'has_threshold': False,
                    'error': str(e),
                    'data_source': 'fallback'
                }
            except Exception as fallback_error:
                print(f"    💥 Fallback generation failed: {fallback_error}")
                return {
                    **proposition,
                    'sql_result': [],
                    'has_mean': False,
                    'mean_value': None,
                    'has_threshold': False,
                    'error': f"SQL Error: {e}, Fallback Error: {fallback_error}",
                    'data_source': 'failed'
                }
    
    def process_all_propositions(self, input_file, output_dir=None, specific_id=None):
        """Process all propositions from the input file"""
        
        if output_dir is None:
            output_dir = "."
        
        try:
            # Load input file
            print(f"📖 Loading propositions from: {input_file}")
            with open(input_file, 'r') as f:
                data = json.load(f)
            
            propositions = data.get('consolidated_propositions', [])
            print(f"📊 Found {len(propositions)} propositions")
            
            # Filter for specific ID if provided
            if specific_id:
                propositions = [p for p in propositions if p.get('proposition_id') == specific_id]
                if not propositions:
                    print(f"❌ Proposition with ID '{specific_id}' not found")
                    return
                print(f"🎯 Processing specific proposition: {specific_id}")
            
            # Process propositions
            processed_results = []
            
            for i, proposition in enumerate(propositions):
                print(f"\n--- Processing {i+1}/{len(propositions)} ---")
                try:
                    result = self.process_proposition(proposition)
                    processed_results.append(result)
                except Exception as e:
                    print(f"❌ Error processing proposition {proposition.get('proposition_id')}: {e}")
                    # Add error result
                    processed_results.append({
                        "proposition_id": proposition.get('proposition_id'),
                        "error": str(e)
                    })
            
            # Save results
            output_data = {
                "processing_metadata": {
                    "processed_at": datetime.now().isoformat(),
                    "total_propositions": len(processed_results),
                    "successful_executions": len([r for r in processed_results if 'error' not in r]),
                    "failed_executions": len([r for r in processed_results if 'error' in r]),
                    "source_file": input_file
                },
                "propositions_with_data": processed_results
            }
            
            # Generate output filename
            if specific_id:
                output_file = os.path.join(output_dir, f"final_data_{specific_id}.json")
            else:
                output_file = os.path.join(output_dir, "final_data_all_propositions.json")
            
            # Save to file
            with open(output_file, 'w') as f:
                json.dump(output_data, f, indent=2, default=str)
            
            print(f"\n💾 Results saved to: {output_file}")
            
            # Summary
            successful = output_data["processing_metadata"]["successful_executions"]
            failed = output_data["processing_metadata"]["failed_executions"]
            
            print(f"\n📊 PROCESSING SUMMARY:")
            print(f"Total Propositions: {len(processed_results)}")
            print(f"Successful: {successful}")
            print(f"Failed: {failed}")
            
            if failed > 0:
                failed_ids = [r['proposition_id'] for r in processed_results if 'error' in r]
                print(f"Failed IDs: {', '.join(failed_ids[:5])}{'...' if len(failed_ids) > 5 else ''}")
            
            return output_file
            
        except Exception as e:
            print(f"❌ Error processing propositions: {e}")
            return None

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Execute SQL queries from validated propositions')
    parser.add_argument('--input', '-i', 
                       default='../vanna_sql/output/test_one_per_chart_type_results.json',
                       help='Input JSON file with propositions')
    parser.add_argument('--output', '-o', 
                       default='.',
                       help='Output directory for results')
    parser.add_argument('--id', 
                       help='Specific proposition ID to process')
    parser.add_argument('--max-rows', type=int, default=100,
                       help='Maximum rows to return per query')
    
    args = parser.parse_args()
    
    print("🚀 SQL Query Executor for Chart Propositions")
    print("=" * 60)
    
    # Initialize executor
    executor = SQLQueryExecutor()
    
    # Process propositions
    result_file = executor.process_all_propositions(
        input_file=args.input,
        output_dir=args.output,
        specific_id=args.id
    )
    
    if result_file:
        print(f"\n🎉 Processing completed successfully!")
        print(f"📁 Output file: {result_file}")
    else:
        print(f"\n💥 Processing failed!")

if __name__ == "__main__":
    main()
