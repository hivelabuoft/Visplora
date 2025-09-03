import pandas as pd
import json
import os

# Create processed directory if it doesn't exist
os.makedirs('.', exist_ok=True)

print("Processing London housing and population data...")

# Process housing density data - get latest year data only
print("1. Processing housing density data...")
density_df = pd.read_csv('../population/housing-density-borough.csv')

# Filter for 2023 data and borough-level data only (exclude London-wide aggregates)
latest_density = density_df[
    (density_df['Year'] == 2023) & 
    (density_df['Name'] != 'Inner London') & 
    (density_df['Name'] != 'Outer London') &
    (density_df['Name'] != 'London')
].copy()

# Create clean column names
latest_density_clean = pd.DataFrame({
    'Borough': latest_density['Name'],
    'Population': latest_density['Population'],
    'Area_Hectares': latest_density['Inland_Area _Hectares'],
    'Population_Density': latest_density['Population_per_hectare'],
    'Population_per_sqkm': latest_density['Population_per_square_kilometre']
})

# Remove any rows with missing data
latest_density_clean = latest_density_clean.dropna()

# Save processed data
latest_density_clean.to_csv('borough_demographics_2023.csv', index=False)
print(f"   Saved {len(latest_density_clean)} borough records to borough_demographics_2023.csv")

# Create a ranking dataset
print("2. Creating ranking datasets...")

# Top 10 most dense boroughs
top_dense = latest_density_clean.nlargest(10, 'Population_Density').copy()
top_dense['Rank'] = range(1, len(top_dense) + 1)
top_dense.to_csv('top_dense_boroughs.csv', index=False)
print(f"   Saved top 10 dense boroughs to top_dense_boroughs.csv")

# Top 12 most populated boroughs
top_populated = latest_density_clean.nlargest(12, 'Population').copy()
top_populated['Rank'] = range(1, len(top_populated) + 1)
top_populated.to_csv('top_populated_boroughs.csv', index=False)
print(f"   Saved top 12 populated boroughs to top_populated_boroughs.csv")

# Large area boroughs (over 1000 hectares)
large_areas = latest_density_clean[latest_density_clean['Area_Hectares'] > 1000].copy()
large_areas = large_areas.sort_values('Area_Hectares', ascending=False)
large_areas.to_csv('large_area_boroughs.csv', index=False)
print(f"   Saved {len(large_areas)} large area boroughs to large_area_boroughs.csv")

# High population boroughs (over 100,000)
high_pop = latest_density_clean[latest_density_clean['Population'] > 100000].copy()
high_pop.to_csv('high_population_boroughs.csv', index=False)
print(f"   Saved {len(high_pop)} high population boroughs to high_population_boroughs.csv")

print("\nData processing complete!")
print("Generated files:")
print("- borough_demographics_2023.csv (all boroughs)")
print("- top_dense_boroughs.csv (top 10 by density)")
print("- top_populated_boroughs.csv (top 12 by population)")
print("- large_area_boroughs.csv (boroughs > 1000 hectares)")
print("- high_population_boroughs.csv (boroughs > 100k population)")