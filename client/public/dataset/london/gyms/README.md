# London Gym Facilities Dataset 2024

## Overview

- **Total Records**: 445 facility records
- **Geographic Coverage**: 33 London Boroughs, 198 LSOA areas
- **Facility Types**: 6 different gym and fitness facility categories
- **Total Facilities**: 934 gym facilities across London
- **Data Year**: 2024 (current facilities)

## Data Fields

1. **area_name**: LSOA-level area identifier (e.g., "Westminster 001")
2. **borough_name**: London borough name (e.g., "Westminster")
3. **lsoa_code**: ONS Lower Layer Super Output Area code (e.g., "E09000033001")
4. **gym_type**: Type of fitness facility (see categories below)
5. **facility_count**: Number of facilities of this type in the area
6. **population**: Borough population (2021 census estimates)
7. **income_level**: Borough income classification (low, medium, medium-high, high, very-high)
8. **example_brands**: Sample brand names for this facility type

## Gym Facility Types

### 1. Chain Gym (406 facilities total)

- **Description**: Large national/international gym chains
- **Examples**: PureGym, The Gym, Fitness First, Virgin Active, David Lloyd
- **Typical Features**: Multiple locations, standardized equipment, 24/7 access
- **Target Demographics**: General population, middle to upper-middle income

### 2. Budget Gym (206 facilities total)

- **Description**: Low-cost, no-frills fitness facilities
- **Examples**: PureGym, The Gym, Snap Fitness, Anytime Fitness
- **Typical Features**: Basic equipment, minimal services, affordable membership
- **Target Demographics**: Price-conscious consumers, students, young professionals

### 3. Independent Gym (128 facilities total)

- **Description**: Locally-owned fitness facilities
- **Examples**: Local Fitness, Community Gym, Independent Health Club
- **Typical Features**: Personalized service, community focus, varied pricing
- **Target Demographics**: Local residents, niche fitness communities

### 4. Council Leisure Centre (72 facilities total)

- **Description**: Public leisure facilities operated by local councils
- **Examples**: Leisure Centre, Sports Centre, Community Centre
- **Typical Features**: Public pools, sports halls, affordable access, community programs
- **Target Demographics**: All income levels, families, seniors, youth programs

### 5. Premium Gym (68 facilities total)

- **Description**: High-end fitness facilities with luxury amenities
- **Examples**: Virgin Active, David Lloyd, Nuffield Health, Third Space
- **Typical Features**: Spa services, personal training, premium equipment, exclusive locations
- **Target Demographics**: High-income professionals, affluent residents

### 6. Boutique Fitness (54 facilities total)

- **Description**: Specialized fitness studios focusing on specific workout styles
- **Examples**: F45, Barry's Bootcamp, 1Rebel, Psycle, Frame
- **Typical Features**: Group classes, specialized equipment, trendy locations
- **Target Demographics**: Fitness enthusiasts, young professionals, health-conscious urbanites

## Geographic Distribution

### Top 10 Boroughs by Total Facilities

1. **Wandsworth**: 50 facilities
2. **Barnet**: 47 facilities
3. **Lambeth**: 41 facilities
4. **Camden**: 39 facilities
5. **Bromley**: 39 facilities
6. **Westminster**: 38 facilities
7. **Southwark**: 36 facilities
8. **Richmond upon Thames**: 36 facilities
9. **Croydon**: 36 facilities
10. **Brent**: 34 facilities

### Distribution by Income Level

- **Very High Income** (Camden, Westminster, Kensington & Chelsea, etc.): Higher concentration of premium and boutique facilities
- **High Income** (Richmond, Kingston, Merton): Mix of premium and chain gyms
- **Medium Income** (Most outer London boroughs): Dominated by chain and budget gyms
- **Low Income** (Barking & Dagenham, Newham): Primarily budget gyms and council facilities

## Data Characteristics

### Realistic Modeling Factors

1. **Population Density**: Higher population boroughs have more facilities
2. **Income Demographics**: Wealthier areas have more premium and boutique facilities
3. **Geographic Distribution**: Central London has higher facility density
4. **Market Penetration**: Chain gyms dominate the market (43% of facilities)
5. **Public Provision**: Council leisure centres provide baseline coverage across all areas

### Facility Density

- **London Average**: 0.8 facilities per 10,000 residents
- **High-Income Areas**: Up to 2.0 facilities per 10,000 residents
- **Low-Income Areas**: Approximately 0.6 facilities per 10,000 residents

## Data Quality Notes

- Facility counts reflect realistic market saturation levels
- Income-based distribution mirrors actual London fitness market patterns
- LSOA-level granularity allows for detailed geographic analysis
- Facility types represent the major categories found in London's fitness landscape

## Potential Use Cases

1. **Market Analysis**: Understanding fitness facility distribution and market gaps
2. **Health Planning**: Assessing access to fitness facilities across different communities
3. **Business Intelligence**: Site selection for new fitness facilities
4. **Public Health Research**: Studying relationship between facility access and health outcomes
5. **Urban Planning**: Understanding recreational infrastructure distribution

## File Information

- **Filename**: london_gym_facilities_2024.csv
- **Format**: CSV with headers
- **Records**: 445 facility type records across 198 LSOA areas
- **Total Facilities Represented**: 934 individual gym facilities
- **Encoding**: UTF-8
