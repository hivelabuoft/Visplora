import requests
import pandas as pd
import time
import json
from datetime import datetime, timedelta
import random
import os

class CrimeDataFetcher:
    def __init__(self):
        self.base_url = "https://data.police.uk/api"
        self.rate_limit_delay = 1/15  # 15 requests per second
        self.session = requests.Session()
        
        # London borough coordinates (approximate centers)
        self.london_boroughs = {
            "Barking and Dagenham": {"lat": 51.5607, "lng": 0.1557, "lsoa": "E09000002"},
            "Barnet": {"lat": 51.6252, "lng": -0.2000, "lsoa": "E09000003"},
            "Bexley": {"lat": 51.4549, "lng": 0.1505, "lsoa": "E09000004"},
            "Brent": {"lat": 51.5673, "lng": -0.2711, "lsoa": "E09000005"},
            "Bromley": {"lat": 51.4039, "lng": 0.0198, "lsoa": "E09000006"},
            "Camden": {"lat": 51.5290, "lng": -0.1255, "lsoa": "E09000007"},
            "City of London": {"lat": 51.5156, "lng": -0.0919, "lsoa": "E09000001"},
            "Croydon": {"lat": 51.3714, "lng": -0.0977, "lsoa": "E09000008"},
            "Ealing": {"lat": 51.5130, "lng": -0.3089, "lsoa": "E09000009"},
            "Enfield": {"lat": 51.6538, "lng": -0.0799, "lsoa": "E09000010"},
            "Greenwich": {"lat": 51.4892, "lng": 0.0648, "lsoa": "E09000011"},
            "Hackney": {"lat": 51.5450, "lng": -0.0553, "lsoa": "E09000012"},
            "Hammersmith and Fulham": {"lat": 51.4927, "lng": -0.2339, "lsoa": "E09000013"},
            "Haringey": {"lat": 51.5906, "lng": -0.1119, "lsoa": "E09000014"},
            "Harrow": {"lat": 51.5898, "lng": -0.3346, "lsoa": "E09000015"},
            "Havering": {"lat": 51.5812, "lng": 0.2206, "lsoa": "E09000016"},
            "Hillingdon": {"lat": 51.5441, "lng": -0.4760, "lsoa": "E09000017"},
            "Hounslow": {"lat": 51.4746, "lng": -0.3580, "lsoa": "E09000018"},
            "Islington": {"lat": 51.5362, "lng": -0.1033, "lsoa": "E09000019"},
            "Kensington and Chelsea": {"lat": 51.4991, "lng": -0.1938, "lsoa": "E09000020"},
            "Kingston upon Thames": {"lat": 51.4085, "lng": -0.3064, "lsoa": "E09000021"},
            "Lambeth": {"lat": 51.4607, "lng": -0.1163, "lsoa": "E09000022"},
            "Lewisham": {"lat": 51.4452, "lng": -0.0209, "lsoa": "E09000023"},
            "Merton": {"lat": 51.4098, "lng": -0.2108, "lsoa": "E09000024"},
            "Newham": {"lat": 51.5077, "lng": 0.0469, "lsoa": "E09000025"},
            "Redbridge": {"lat": 51.5590, "lng": 0.0741, "lsoa": "E09000026"},
            "Richmond upon Thames": {"lat": 51.4613, "lng": -0.3037, "lsoa": "E09000027"},
            "Southwark": {"lat": 51.5035, "lng": -0.0804, "lsoa": "E09000028"},
            "Sutton": {"lat": 51.3618, "lng": -0.1945, "lsoa": "E09000029"},
            "Tower Hamlets": {"lat": 51.5099, "lng": -0.0059, "lsoa": "E09000030"},
            "Waltham Forest": {"lat": 51.5886, "lng": -0.0118, "lsoa": "E09000031"},
            "Wandsworth": {"lat": 51.4571, "lng": -0.1931, "lsoa": "E09000032"},
            "Westminster": {"lat": 51.4975, "lng": -0.1357, "lsoa": "E09000033"}
        }
    
    def get_crime_categories(self, date):
        """Fetch available crime categories for a given date"""
        url = f"{self.base_url}/crime-categories?date={date}"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            time.sleep(self.rate_limit_delay)
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching crime categories: {e}")
            return []
    
    def get_crimes_at_location(self, lat, lng, date):
        """Fetch crimes at specific location"""
        url = f"{self.base_url}/crimes-at-location?date={date}&lat={lat}&lng={lng}"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            time.sleep(self.rate_limit_delay)
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching crimes at location: {e}")
            return []
    
    def generate_sample_data(self):
        """Generate sample crime data based on real API structure"""
        print("Generating sample crime data for London boroughs (2022-2023)...")
        
        # Get sample crime categories
        sample_categories = [
            {"url": "anti-social-behaviour", "name": "Anti-social behaviour"},
            {"url": "bicycle-theft", "name": "Bicycle theft"},
            {"url": "burglary", "name": "Burglary"},
            {"url": "criminal-damage-arson", "name": "Criminal damage and arson"},
            {"url": "drugs", "name": "Drugs"},
            {"url": "other-theft", "name": "Other theft"},
            {"url": "possession-of-weapons", "name": "Possession of weapons"},
            {"url": "public-order", "name": "Public order"},
            {"url": "robbery", "name": "Robbery"},
            {"url": "shoplifting", "name": "Shoplifting"},
            {"url": "theft-from-the-person", "name": "Theft from the person"},
            {"url": "vehicle-crime", "name": "Vehicle crime"},
            {"url": "violent-crime", "name": "Violent crime"},
            {"url": "other-crime", "name": "Other crime"}
        ]
        
        crime_data = []
        
        # Generate data for each borough and each month in 2022-2023
        for year in [2022, 2023]:
            for month in range(1, 13):
                date_str = f"{year}-{month:02d}"
                print(f"Processing {date_str}...")
                
                for borough_name, borough_info in self.london_boroughs.items():
                    # Generate realistic number of crimes per category per month
                    for category in sample_categories:
                        # Vary crime counts based on borough and crime type
                        if borough_name in ["Westminster", "Camden", "Tower Hamlets", "Southwark"]:
                            # Central London boroughs tend to have higher crime rates
                            base_count = random.randint(50, 200)
                        elif borough_name in ["City of London"]:
                            # City of London is small but has unique crime patterns
                            base_count = random.randint(10, 50)
                        else:
                            # Outer London boroughs
                            base_count = random.randint(20, 100)
                        
                        # Adjust based on crime type
                        if category["url"] in ["anti-social-behaviour", "violent-crime"]:
                            crime_count = int(base_count * random.uniform(1.2, 2.0))
                        elif category["url"] in ["burglary", "vehicle-crime", "other-theft"]:
                            crime_count = int(base_count * random.uniform(0.8, 1.5))
                        elif category["url"] in ["drugs", "possession-of-weapons"]:
                            crime_count = int(base_count * random.uniform(0.2, 0.6))
                        else:
                            crime_count = int(base_count * random.uniform(0.5, 1.2))
                        
                        # Generate individual crime records
                        for i in range(crime_count):
                            # Generate LSOA-like area names
                            area_suffix = random.choice(['001', '002', '003', '004', '005', '006'])
                            area_name = f"{borough_name} {area_suffix}"
                            
                            crime_record = {
                                'area_name': area_name,
                                'borough_name': borough_name,
                                'lsoa_code': f"{borough_info['lsoa']}{area_suffix}",
                                'crime_category': category["url"],
                                'crime_category_name': category["name"],
                                'year': year,
                                'month': month,
                                'date': date_str
                            }
                            crime_data.append(crime_record)
        
        return crime_data
    
    def save_to_csv(self, data, filename):
        """Save crime data to CSV file"""
        df = pd.DataFrame(data)
        
        # Reorder columns for better readability
        column_order = ['area_name', 'borough_name', 'lsoa_code', 'crime_category', 
                       'crime_category_name', 'year', 'month', 'date']
        df = df[column_order]
        
        # Sort by borough, year, month, and category
        df = df.sort_values(['borough_name', 'year', 'month', 'crime_category'])
        
        df.to_csv(filename, index=False)
        print(f"Data saved to {filename}")
        print(f"Total records: {len(df)}")
        print(f"Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"Boroughs: {df['borough_name'].nunique()}")
        print(f"Crime categories: {df['crime_category'].nunique()}")
        
        return df
    
    def fetch_sample_real_data(self):
        """Fetch a small sample of real data to validate our structure"""
        print("Fetching sample real data for validation...")
        
        # Get crime categories for recent date
        categories = self.get_crime_categories("2024-01")
        print(f"Available crime categories: {len(categories)}")
        for cat in categories[:5]:  # Show first 5
            print(f"  - {cat['url']}: {cat['name']}")
        
        # Get sample crimes for Westminster (central London)
        westminster = self.london_boroughs["Westminster"]
        sample_crimes = self.get_crimes_at_location(
            westminster["lat"], westminster["lng"], "2024-01"
        )
        
        print(f"\nSample crimes at Westminster: {len(sample_crimes)}")
        if sample_crimes:
            print("Sample crime structure:")
            print(json.dumps(sample_crimes[0], indent=2))
        
        return categories, sample_crimes

def main():
    fetcher = CrimeDataFetcher()
    
    # Optionally fetch some real data for validation
    print("=== FETCHING SAMPLE REAL DATA FOR VALIDATION ===")
    try:
        categories, sample_crimes = fetcher.fetch_sample_real_data()
    except Exception as e:
        print(f"Could not fetch real data (API might be down): {e}")
        print("Proceeding with sample data generation...")
    
    print("\n=== GENERATING SAMPLE CRIME DATA ===")
    
    # Generate comprehensive sample data
    crime_data = fetcher.generate_sample_data()
    
    # Save to CSV
    output_file = "london_crime_data_2022_2023.csv"
    df = fetcher.save_to_csv(crime_data, output_file)
    
    print(f"\n=== SUMMARY ===")
    print(f"Generated {len(crime_data)} crime records")
    print("\nSample of generated data:")
    print(df.head(10))
    
    print("\nCrime distribution by borough (top 10):")
    borough_counts = df['borough_name'].value_counts().head(10)
    for borough, count in borough_counts.items():
        print(f"  {borough}: {count} crimes")
    
    print("\nCrime distribution by category:")
    category_counts = df['crime_category_name'].value_counts()
    for category, count in category_counts.items():
        print(f"  {category}: {count} crimes")

if __name__ == "__main__":
    main()
