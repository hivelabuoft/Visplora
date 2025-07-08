import pandas as pd
import random
import os

class GymDataGenerator:
    def __init__(self):
        # London borough information (using the same structure as crime data)
        self.london_boroughs = {
            "Barking and Dagenham": {"lsoa": "E09000002", "population": 218900, "income_level": "low"},
            "Barnet": {"lsoa": "E09000003", "population": 395869, "income_level": "medium-high"},
            "Bexley": {"lsoa": "E09000004", "population": 248287, "income_level": "medium"},
            "Brent": {"lsoa": "E09000005", "population": 329771, "income_level": "medium"},
            "Bromley": {"lsoa": "E09000006", "population": 331096, "income_level": "high"},
            "Camden": {"lsoa": "E09000007", "population": 270029, "income_level": "very-high"},
            "City of London": {"lsoa": "E09000001", "population": 8618, "income_level": "very-high"},
            "Croydon": {"lsoa": "E09000008", "population": 386710, "income_level": "medium"},
            "Ealing": {"lsoa": "E09000009", "population": 341982, "income_level": "medium"},
            "Enfield": {"lsoa": "E09000010", "population": 333794, "income_level": "medium"},
            "Greenwich": {"lsoa": "E09000011", "population": 287942, "income_level": "medium"},
            "Hackney": {"lsoa": "E09000012", "population": 279665, "income_level": "medium-high"},
            "Hammersmith and Fulham": {"lsoa": "E09000013", "population": 185426, "income_level": "very-high"},
            "Haringey": {"lsoa": "E09000014", "population": 270624, "income_level": "medium"},
            "Harrow": {"lsoa": "E09000015", "population": 250149, "income_level": "medium-high"},
            "Havering": {"lsoa": "E09000016", "population": 259552, "income_level": "medium"},
            "Hillingdon": {"lsoa": "E09000017", "population": 305909, "income_level": "medium"},
            "Hounslow": {"lsoa": "E09000018", "population": 271523, "income_level": "medium"},
            "Islington": {"lsoa": "E09000019", "population": 239142, "income_level": "high"},
            "Kensington and Chelsea": {"lsoa": "E09000020", "population": 156197, "income_level": "very-high"},
            "Kingston upon Thames": {"lsoa": "E09000021", "population": 177507, "income_level": "high"},
            "Lambeth": {"lsoa": "E09000022", "population": 325917, "income_level": "medium-high"},
            "Lewisham": {"lsoa": "E09000023", "population": 305309, "income_level": "medium"},
            "Merton": {"lsoa": "E09000024", "population": 206548, "income_level": "high"},
            "Newham": {"lsoa": "E09000025", "population": 353134, "income_level": "low"},
            "Redbridge": {"lsoa": "E09000026", "population": 303858, "income_level": "medium"},
            "Richmond upon Thames": {"lsoa": "E09000027", "population": 198019, "income_level": "very-high"},
            "Southwark": {"lsoa": "E09000028", "population": 317256, "income_level": "medium-high"},
            "Sutton": {"lsoa": "E09000029", "population": 206349, "income_level": "medium"},
            "Tower Hamlets": {"lsoa": "E09000030", "population": 324745, "income_level": "medium"},
            "Waltham Forest": {"lsoa": "E09000031", "population": 276983, "income_level": "medium"},
            "Wandsworth": {"lsoa": "E09000032", "population": 329677, "income_level": "high"},
            "Westminster": {"lsoa": "E09000033", "population": 261317, "income_level": "very-high"}
        }
        
        # Different types of gym facilities
        self.gym_types = {
            "Chain Gym": {
                "examples": ["PureGym", "The Gym", "Fitness First", "Virgin Active", "David Lloyd"],
                "probability": 0.35,
                "income_preference": ["medium", "medium-high", "high", "very-high"]
            },
            "Budget Gym": {
                "examples": ["PureGym", "The Gym", "Snap Fitness", "Anytime Fitness"],
                "probability": 0.25,
                "income_preference": ["low", "medium", "medium-high"]
            },
            "Premium Gym": {
                "examples": ["Virgin Active", "David Lloyd", "Nuffield Health", "Third Space"],
                "probability": 0.15,
                "income_preference": ["high", "very-high"]
            },
            "Independent Gym": {
                "examples": ["Local Fitness", "Community Gym", "Independent Health Club"],
                "probability": 0.12,
                "income_preference": ["low", "medium", "medium-high", "high"]
            },
            "Boutique Fitness": {
                "examples": ["F45", "Barry's Bootcamp", "1Rebel", "Psycle", "Frame"],
                "probability": 0.08,
                "income_preference": ["medium-high", "high", "very-high"]
            },
            "Council Leisure Centre": {
                "examples": ["Leisure Centre", "Sports Centre", "Community Centre"],
                "probability": 0.05,
                "income_preference": ["low", "medium", "medium-high", "high", "very-high"]
            }
        }
    
    def get_gym_density_factor(self, borough_info):
        """Calculate gym density factor based on borough characteristics"""
        population = borough_info["population"]
        income_level = borough_info["income_level"]
        
        # Base factor based on population (gyms per 10,000 people)
        base_factor = 0.8  # London average
        
        # Adjust based on income level
        income_multipliers = {
            "low": 0.6,
            "medium": 1.0,
            "medium-high": 1.3,
            "high": 1.6,
            "very-high": 2.0
        }
        
        return base_factor * income_multipliers.get(income_level, 1.0)
    
    def generate_gym_data(self):
        """Generate comprehensive gym data for London boroughs"""
        print("Generating gym facility data for London boroughs...")
        
        gym_data = []
        
        for borough_name, borough_info in self.london_boroughs.items():
            print(f"Processing {borough_name}...")
            
            # Calculate expected number of gyms for this borough
            density_factor = self.get_gym_density_factor(borough_info)
            expected_gyms = int((borough_info["population"] / 10000) * density_factor)
            
            # Add some randomness
            total_gyms = max(1, expected_gyms + random.randint(-5, 10))
            
            # Distribute gyms across LSOA areas (6 areas per borough)
            lsoa_areas = ['001', '002', '003', '004', '005', '006']
            
            # Create a distribution of gyms across areas (some areas have more than others)
            gym_distribution = []
            remaining_gyms = total_gyms
            
            for i, area in enumerate(lsoa_areas):
                if i == len(lsoa_areas) - 1:  # Last area gets remaining gyms
                    area_gyms = remaining_gyms
                else:
                    # Random distribution but ensure each area gets at least 0-2 gyms
                    max_for_area = max(1, remaining_gyms // (len(lsoa_areas) - i))
                    area_gyms = random.randint(0, max_for_area)
                    remaining_gyms -= area_gyms
                
                gym_distribution.append(area_gyms)
            
            # Generate gym records for each area
            for area_idx, area_suffix in enumerate(lsoa_areas):
                area_name = f"{borough_name} {area_suffix}"
                lsoa_code = f"{borough_info['lsoa']}{area_suffix}"
                num_gyms = gym_distribution[area_idx]
                
                # Determine which types of gyms exist in this area
                gym_type_counts = {}
                
                for _ in range(num_gyms):
                    # Select gym type based on probabilities and income preferences
                    suitable_types = []
                    for gym_type, details in self.gym_types.items():
                        if borough_info["income_level"] in details["income_preference"]:
                            # Add multiple entries based on probability
                            weight = int(details["probability"] * 100)
                            suitable_types.extend([gym_type] * weight)
                    
                    if suitable_types:
                        selected_type = random.choice(suitable_types)
                        gym_type_counts[selected_type] = gym_type_counts.get(selected_type, 0) + 1
                
                # Create records for each gym type in this area
                for gym_type, count in gym_type_counts.items():
                    gym_record = {
                        'area_name': area_name,
                        'borough_name': borough_name,
                        'lsoa_code': lsoa_code,
                        'gym_type': gym_type,
                        'facility_count': count,
                        'population': borough_info["population"],
                        'income_level': borough_info["income_level"],
                        'example_brands': ', '.join(self.gym_types[gym_type]["examples"][:3])
                    }
                    gym_data.append(gym_record)
                
                # If no gyms in this area, still create a record with 0 count
                if not gym_type_counts:
                    gym_record = {
                        'area_name': area_name,
                        'borough_name': borough_name,
                        'lsoa_code': lsoa_code,
                        'gym_type': 'None',
                        'facility_count': 0,
                        'population': borough_info["population"],
                        'income_level': borough_info["income_level"],
                        'example_brands': 'No facilities'
                    }
                    gym_data.append(gym_record)
        
        return gym_data
    
    def save_to_csv(self, data, filename):
        """Save gym data to CSV file"""
        df = pd.DataFrame(data)
        
        # Sort by borough, area, and gym type
        df = df.sort_values(['borough_name', 'area_name', 'gym_type'])
        
        df.to_csv(filename, index=False)
        print(f"Data saved to {filename}")
        print(f"Total records: {len(df)}")
        print(f"Boroughs covered: {df['borough_name'].nunique()}")
        print(f"LSOA areas: {df['area_name'].nunique()}")
        print(f"Gym types: {df[df['gym_type'] != 'None']['gym_type'].nunique()}")
        
        return df
    
    def generate_summary_stats(self, df):
        """Generate summary statistics for the gym data"""
        print("\n=== GYM FACILITY SUMMARY ===")
        
        # Total facilities by type
        type_totals = df[df['gym_type'] != 'None'].groupby('gym_type')['facility_count'].sum().sort_values(ascending=False)
        print("\nTotal facilities by type:")
        for gym_type, count in type_totals.items():
            print(f"  {gym_type}: {count} facilities")
        
        # Borough totals
        borough_totals = df.groupby('borough_name')['facility_count'].sum().sort_values(ascending=False)
        print(f"\nTop 10 boroughs by total gym facilities:")
        for borough, count in borough_totals.head(10).items():
            print(f"  {borough}: {count} facilities")
        
        # Areas with most facilities
        area_totals = df.groupby(['borough_name', 'area_name'])['facility_count'].sum().sort_values(ascending=False)
        print(f"\nTop 10 LSOA areas by gym facilities:")
        for (borough, area), count in area_totals.head(10).items():
            print(f"  {area} ({borough}): {count} facilities")
        
        return type_totals, borough_totals

def main():
    generator = GymDataGenerator()
    
    print("=== GENERATING LONDON GYM FACILITY DATA ===")
    
    # Generate gym data
    gym_data = generator.generate_gym_data()
    
    # Save to CSV
    output_file = "london_gym_facilities_2024.csv"
    df = generator.save_to_csv(gym_data, output_file)
    
    # Generate summary statistics
    type_totals, borough_totals = generator.generate_summary_stats(df)
    
    print(f"\n=== SAMPLE DATA ===")
    print("First 10 records:")
    print(df.head(10)[['area_name', 'gym_type', 'facility_count']].to_string())
    
    print(f"\nTotal gym facilities across London: {df['facility_count'].sum()}")
    print(f"Average facilities per borough: {df.groupby('borough_name')['facility_count'].sum().mean():.1f}")

if __name__ == "__main__":
    main()
