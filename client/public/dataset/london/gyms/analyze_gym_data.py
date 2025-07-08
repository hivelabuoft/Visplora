import pandas as pd

def analyze_gym_data():
    """Comprehensive analysis of London gym facilities data"""
    
    # Load the data
    df = pd.read_csv('london_gym_facilities_2024.csv')
    
    print("=== LONDON GYM FACILITIES ANALYSIS ===")
    print(f"Dataset contains {len(df)} records covering {df['borough_name'].nunique()} boroughs")
    print(f"Total facilities across London: {df['facility_count'].sum()}")
    
    # Remove 'None' entries for facility analysis
    facilities_df = df[df['gym_type'] != 'None'].copy()
    
    print(f"\nFacilities by type:")
    type_distribution = facilities_df.groupby('gym_type')['facility_count'].sum().sort_values(ascending=False)
    for gym_type, count in type_distribution.items():
        percentage = (count / type_distribution.sum()) * 100
        print(f"  {gym_type}: {count} facilities ({percentage:.1f}%)")
    
    # Borough analysis
    print(f"\nBorough analysis:")
    borough_stats = df.groupby('borough_name').agg({
        'facility_count': 'sum',
        'population': 'first',
        'income_level': 'first'
    }).reset_index()
    
    # Calculate facilities per capita
    borough_stats['facilities_per_10k'] = (borough_stats['facility_count'] / borough_stats['population']) * 10000
    
    print("Top 5 boroughs by total facilities:")
    top_facilities = borough_stats.nlargest(5, 'facility_count')
    for _, row in top_facilities.iterrows():
        print(f"  {row['borough_name']}: {row['facility_count']} facilities ({row['facilities_per_10k']:.1f} per 10k residents)")
    
    print("\nTop 5 boroughs by facilities per capita:")
    top_per_capita = borough_stats.nlargest(5, 'facilities_per_10k')
    for _, row in top_per_capita.iterrows():
        print(f"  {row['borough_name']}: {row['facilities_per_10k']:.1f} per 10k residents ({row['facility_count']} total)")
    
    # Income level analysis
    print(f"\nFacilities by income level:")
    income_analysis = borough_stats.groupby('income_level').agg({
        'facility_count': 'sum',
        'facilities_per_10k': 'mean',
        'borough_name': 'count'
    }).round(1)
    income_analysis.columns = ['Total Facilities', 'Avg per 10k', 'Borough Count']
    print(income_analysis.to_string())
    
    # Area-level analysis
    print(f"\nLSOA area analysis:")
    area_stats = df.groupby(['borough_name', 'area_name'])['facility_count'].sum().reset_index()
    area_stats = area_stats[area_stats['facility_count'] > 0]  # Only areas with facilities
    
    print(f"Areas with facilities: {len(area_stats)} out of {df['area_name'].nunique()} total areas")
    print(f"Average facilities per area: {area_stats['facility_count'].mean():.1f}")
    print(f"Areas with 10+ facilities: {len(area_stats[area_stats['facility_count'] >= 10])}")
    
    print("\nTop 10 LSOA areas by facility count:")
    top_areas = area_stats.nlargest(10, 'facility_count')
    for _, row in top_areas.iterrows():
        print(f"  {row['area_name']} ({row['borough_name']}): {row['facility_count']} facilities")
    
    # Facility type preferences by income level
    print(f"\nFacility type preferences by income level:")
    income_type_analysis = facilities_df.groupby(['income_level', 'gym_type'])['facility_count'].sum().unstack(fill_value=0)
    
    # Calculate percentages
    income_type_pct = income_type_analysis.div(income_type_analysis.sum(axis=1), axis=0) * 100
    print("Percentage distribution of facility types by income level:")
    print(income_type_pct.round(1).to_string())
    
    return df, borough_stats, facilities_df

def generate_insights(df, borough_stats, facilities_df):
    """Generate key insights from the gym data"""
    
    print(f"\n=== KEY INSIGHTS ===")
    
    # Market concentration
    chain_budget_pct = ((facilities_df[facilities_df['gym_type'].isin(['Chain Gym', 'Budget Gym'])]['facility_count'].sum() / 
                        facilities_df['facility_count'].sum()) * 100)
    print(f"1. Market Concentration: {chain_budget_pct:.1f}% of facilities are chain or budget gyms")
    
    # Income inequality
    high_income_boroughs = borough_stats[borough_stats['income_level'].isin(['high', 'very-high'])]
    low_income_boroughs = borough_stats[borough_stats['income_level'] == 'low']
    
    high_avg = high_income_boroughs['facilities_per_10k'].mean()
    low_avg = low_income_boroughs['facilities_per_10k'].mean()
    inequality_ratio = high_avg / low_avg
    
    print(f"2. Access Inequality: High-income areas have {inequality_ratio:.1f}x more facilities per capita than low-income areas")
    
    # Public provision
    public_facilities = facilities_df[facilities_df['gym_type'] == 'Council Leisure Centre']['facility_count'].sum()
    public_pct = (public_facilities / facilities_df['facility_count'].sum()) * 100
    print(f"3. Public Provision: {public_pct:.1f}% of facilities are council-operated leisure centres")
    
    # Premium market
    premium_boutique = facilities_df[facilities_df['gym_type'].isin(['Premium Gym', 'Boutique Fitness'])]['facility_count'].sum()
    premium_pct = (premium_boutique / facilities_df['facility_count'].sum()) * 100
    print(f"4. Premium Market: {premium_pct:.1f}% of facilities are premium or boutique fitness")
    
    # Coverage gaps
    no_facilities = len(df[(df['gym_type'] == 'None') & (df['facility_count'] == 0)])
    coverage_pct = ((df['area_name'].nunique() - no_facilities) / df['area_name'].nunique()) * 100
    print(f"5. Coverage: {coverage_pct:.1f}% of LSOA areas have at least one gym facility")

if __name__ == "__main__":
    df, borough_stats, facilities_df = analyze_gym_data()
    generate_insights(df, borough_stats, facilities_df)
