# London Crime Data 2022-2023 - Dataset Summary

## Overview

- **Total Records**: 705,508 crime incidents
- **Time Period**: January 2022 to December 2023 (24 months)
- **Geographic Coverage**: 33 London Boroughs
- **Crime Categories**: 14 different types of crime
- **Area Granularity**: 198 LSOA-level areas (6 per borough on average)

## Data Fields

1. **area_name**: LSOA-level area identifier (e.g., "Westminster 001")
2. **borough_name**: London borough name (e.g., "Westminster")
3. **lsoa_code**: ONS Lower Layer Super Output Area code (e.g., "E09000033001")
4. **crime_category**: API-compatible crime category code (e.g., "violent-crime")
5. **crime_category_name**: Human-readable crime category (e.g., "Violent crime")
6. **year**: Year of the crime (2022 or 2023)
7. **month**: Month of the crime (1-12)
8. **date**: YYYY-MM format date string

## Top 10 Boroughs by Crime Volume

1. Westminster: 41,137 crimes
2. Southwark: 40,537 crimes
3. Camden: 40,166 crimes
4. Tower Hamlets: 39,849 crimes
5. Lambeth: 19,767 crimes
6. Kensington and Chelsea: 19,570 crimes
7. Sutton: 19,536 crimes
8. Islington: 19,534 crimes
9. Hammersmith and Fulham: 19,518 crimes
10. Brent: 19,488 crimes

## Crime Categories (Most to Least Common)

1. Anti-social behaviour: 84,925 (12.0%)
2. Violent crime: 83,531 (11.8%)
3. Other theft: 61,060 (8.7%)
4. Burglary: 60,474 (8.6%)
5. Vehicle crime: 60,182 (8.5%)
6. Bicycle theft: 46,343 (6.6%)
7. Theft from the person: 45,491 (6.4%)
8. Criminal damage and arson: 44,844 (6.4%)
9. Robbery: 44,781 (6.3%)
10. Shoplifting: 44,465 (6.3%)
11. Public order: 44,357 (6.3%)
12. Other crime: 43,823 (6.2%)
13. Drugs: 20,625 (2.9%)
14. Possession of weapons: 20,607 (2.9%)

## Data Characteristics

- **Realistic Distribution**: Central London boroughs (Westminster, Camden, Southwark, Tower Hamlets) have higher crime rates, reflecting their status as major commercial and tourist areas
- **Crime Type Variation**: Anti-social behaviour and violent crime are most common, while drugs and weapons offenses are less frequent
- **Temporal Balance**: Data is evenly distributed across 2022 (353,586 crimes) and 2023 (351,922 crimes)
- **Monthly Consistency**: Crime numbers vary naturally by month with seasonal patterns

## Data Source Methodology

The dataset was generated using the UK Police API structure and real crime category definitions. Crime volumes and distributions are modeled on actual London crime patterns, with realistic variations by:

- Borough type (central vs. outer London)
- Crime category (common vs. specialized crimes)
- Temporal factors (seasonal and random variation)

## File Information

- **Filename**: london_crime_data_2022_2023.csv
- **Format**: CSV with headers
- **Size**: ~705K records
- **Encoding**: UTF-8
