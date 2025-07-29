# London Dashboard Interaction Tracking System

## Overview
This document describes the comprehensive interaction tracking system implemented for the London Dashboard. The system captures meaningful user interactions with dashboard elements, focusing on behaviors that indicate exploration, analysis, and decision-making.

## Tracking Philosophy
The system implements **targeted interaction tracking** rather than general container hovering. This means we only track interactions that:

1. **Trigger UI changes** (tooltips, highlights, data reveals)
2. **Indicate data exploration** (hovering on chart points, pie segments)
3. **Show user intent** (button hovers, selection changes)
4. **Represent meaningful engagement** (sustained chart exploration)

## Tracked Interactions

### 1. Click Interactions
All dashboard elements capture click interactions when users:
- Select boroughs on maps
- Choose crime categories 
- Select birth years
- Add elements to sidebar
- Apply filters

**Implementation**: Uses `logInteractionWithConfig()` function with full JSON context.

### 2. Interactive Hover Tracking
**Purpose**: Captures immediate hover feedback on interactive controls.
**Threshold**: Immediate (no delay)
**Elements**:
- Crime category selector buttons
- Birth year selector buttons
- Any UI controls that change state on hover

**Implementation**: 
```typescript
logInteractiveHover(elementId, elementName, elementType, {
  interactionSubtype: 'button_hover',
  description: 'User hovered over interactive control'
});
```

### 3. Chart Exploration Hover Tracking  
**Purpose**: Captures sustained exploration of data visualizations.
**Threshold**: 1 second (reduced from 2 seconds for responsiveness)
**Elements**:
- Income timeline chart (line chart with tooltip points)
- Crime categories pie chart (interactive segments)
- House price timeline chart (line chart with tooltip points) 
- Country of birth pie chart (interactive segments)

**Implementation**:
```typescript
const chartHover = useChartExplorationHover(elementId, elementName, elementType);
// Applied to chart containers that have interactive tooltip elements
```

## Dashboard Element Coverage

### Interactive Elements (ID 1-16):
1. **London Map** (london-map-1) - Click interactions only (borough selection)
2. **LSOA Map** (lsoa-map-2) - Click interactions only (LSOA selection)  
3. **Total Population** (total-population-3) - Click interactions (sidebar)
4. **Population Density** (population-density-4) - Click interactions (sidebar)
5. **Foreign-born Population** (foreign-born-population-5) - Click interactions (sidebar)
6. **Birth Country Diversity** (birth-country-diversity-6) - Click interactions (sidebar)
7. **Life Expectancy** (life-expectancy-7) - Click interactions (sidebar)
8. **Borough Crime Stats** (borough-crime-stats-8) - Click + Button hover (crime category buttons)
9. **Population Growth & Projections** (population-growth-projections-9) - Click interactions only
10. **Mean Income Timeline** (mean-income-timeline-10) - Click + Chart exploration hover
11. **Borough Crime Categories** (borough-crime-categories-11) - Click + Chart exploration hover  
12. **House Price Timeline** (house-price-timeline-12) - Click + Chart exploration hover
13. **School Education Facilities** (school-education-facilities-13) - Click interactions only
14. **Ethnicity Minority Groups** (ethnicity-minority-groups-14) - Click interactions only
15. **Country of Birth** (country-of-birth-15) - Click + Button hover + Chart exploration hover
16. **Libraries in LSOA** (lsoa-libraries-16) - Click interactions only

## Data Captured

### For All Interactions:
- Timestamp
- Element ID and metadata from JSON configuration
- Interaction type (click, interactive_hover, chart_exploration_hover)
- User context (selected borough, LSOA, filters)

### Additional Context by Interaction Type:

#### Click Interactions:
- Selected values
- Filter changes
- Navigation actions

#### Interactive Hover:
- Specific button/control hovered
- Current selection state
- Interaction subtype

#### Chart Exploration Hover:
- Chart type
- Available data context
- Hover duration (1000ms threshold)

## Technical Implementation

### Files:
- `london.json` - Dashboard element configurations
- `dashboardConfig.ts` - Enhanced logging with JSON lookup
- `hoverTracking.ts` - Targeted hover detection system
- `london/page.tsx` - Dashboard with integrated tracking

### Key Functions:
- `logInteractionWithConfig()` - Comprehensive interaction logging
- `useChartExplorationHover()` - Sustained chart hover detection
- `logInteractiveHover()` - Immediate interactive element hover logging

## Benefits of This Approach

1. **Reduced Noise**: Only meaningful interactions are logged
2. **Better Insights**: Focus on exploration behaviors rather than accidental hovers
3. **Performance**: Lower overhead by avoiding general container tracking
4. **Actionable Data**: Each logged interaction indicates genuine user intent
5. **Context Rich**: Full dashboard state captured with each interaction

## Future Enhancements

1. **Vega-Lite Signal Integration**: Directly capture chart-level interactions (tooltip shows, selections)
2. **Sequence Analysis**: Track interaction patterns and flows
3. **Heat Mapping**: Aggregate interaction data for UX insights
4. **A/B Testing**: Compare interaction patterns across different dashboard layouts
