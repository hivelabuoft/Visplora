import pandas as pd

# Load the data
df = pd.read_csv('london_crime_data_2022_2023.csv')

print('=== LONDON CRIME DATA 2022-2023 SUMMARY ===')
print(f'Total Records: {len(df):,}')
print(f'Time Period: {df["date"].min()} to {df["date"].max()}')
print(f'Boroughs: {df["borough_name"].nunique()}')
print(f'Crime Categories: {df["crime_category_name"].nunique()}')
print(f'Area Names (LSOA): {df["area_name"].nunique()}')

print('\n=== BOROUGH DISTRIBUTION (Top 15) ===')
borough_stats = df.groupby('borough_name').size().sort_values(ascending=False)
print(borough_stats.head(15).to_string())

print('\n=== CRIME CATEGORY DISTRIBUTION ===')
category_stats = df.groupby('crime_category_name').size().sort_values(ascending=False)
print(category_stats.to_string())

print('\n=== YEARLY COMPARISON ===')
yearly_stats = df.groupby('year').size()
print(yearly_stats.to_string())

print('\n=== MONTHLY DISTRIBUTION (2022) ===')
monthly_2022 = df[df['year'] == 2022].groupby('month').size()
print(monthly_2022.to_string())

print('\n=== SAMPLE RECORDS ===')
print(df.sample(5)[['area_name', 'borough_name', 'crime_category_name', 'date']].to_string())
