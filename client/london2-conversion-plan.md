# London2 Page Conversion Plan

## Overview

This plan outlines the conversion of the existing london page to london2 page using ReusableNodes and SpecCreator objects, following the same pattern as the travel → travel2 conversion and aligning with the established VegaTemplates architecture.

## Current London Page Analysis & VegaTemplate Mapping

### Existing VegaTemplates Available

Based on the `CHART_TEMPLATES_PLAN.md` and current implementation, these templates are available:

**Line Charts:**

- ✅ `multiLineLabelSpec` - Multi-series line chart with labels

**Bar Charts:**

- ✅ `divergingBarSpec` - Horizontal diverging bars for comparisons
- ✅ `horizontalBarSpec` - Horizontal interactive bars

**Pie Charts:**

- ✅ `interactivePieSpec` - Interactive pie charts with hover

**Scatter Charts:**

- ✅ `bubblePlotScatterSpec` - Bubble scatter plots

**Map Charts:**

- ✅ `worldInteractiveMapSpec` - Interactive world maps

**Multi-Type Charts:**

- ✅ `barChartWithLineSpec` - Combined bar + line charts

### London Chart Analysis & Template Compatibility

#### ✅ **Charts That Can Use Existing Templates**

1. **Population Growth & Projections (population-growth-projections-9)**

   - **Current**: `populationTimelineChartSpec` (single-series line)
   - **Template**: `line/multiLineLabelSpec` ✅
   - **Conversion**: Direct - time series data perfect fit

2. **Mean Income Timeline (mean-income-timeline-10)**

   - **Current**: `incomeTimelineChartSpec` (dual-series line)
   - **Template**: `line/multiLineLabelSpec` ✅
   - **Conversion**: Direct - mean/median as separate series

3. **Borough Crime Categories (borough-crime-categories-11)**

   - **Current**: `crimePieChartComparisonSpec` (pie with comparison)
   - **Template**: `pie/interactivePieSpec` ✅
   - **Conversion**: Direct - category breakdown

4. **Country of Birth (country-of-birth-15)**

   - **Current**: `countryOfBirthPieChartSpec` (pie with legend)
   - **Template**: `pie/interactivePieSpec` ✅
   - **Conversion**: Direct - regional breakdown

5. **Sports/Recreation Facilities (lsoa-gyms)**

   - **Current**: `gymPieChartSpec` (simple pie)
   - **Template**: `pie/interactivePieSpec` ✅
   - **Conversion**: Direct - facility type breakdown

6. **Ethnicity Minority Groups (ethnicity-minority-groups-14)**
   - **Current**: `ethnicityMinorityGroupsBarChartSpec` (horizontal bars)
   - **Template**: `bar/horizontalBarSpec` ✅
   - **Conversion**: Direct - categorical data

#### ⚠️ **Charts Requiring New Templates**

7. **House Price Timeline (house-price-timeline-12)**

   - **Current**: `housePriceTimelineChartSpec` (triple-metric: mean, median, volume)
   - **Issue**: Complex multi-axis chart (price + volume on different scales)
   - **New Template Needed**: `line/tripleLineWithVolumeSpec`
   - **Features**: Dual Y-axes, volume bars + price lines

8. **Borough Crime Stats (borough-crime-stats-8)**

   - **Current**: `crimeBarChartComparisonSpec` (year-over-year comparison bars)
   - **Issue**: Side-by-side comparison bars with change indicators
   - **New Template Needed**: `bar/comparisonBarSpec`
   - **Features**: Grouped bars, percentage change annotations

9. **School Education Facilities (school-education-facilities-13)**

   - **Current**: `schoolEducationFacilitiesSpec` (stacked/grouped bars)
   - **Issue**: School type categorization with counts
   - **New Template Needed**: `bar/categoricalBarSpec` (or use existing `bar/horizontalBarSpec`)
   - **Features**: Simple categorical bars

10. **Library Visits (lsoa-libraries-16)**
    - **Current**: `libraryLineChartSpec` (simple line with trend)
    - **Issue**: Simple single-series line chart
    - **New Template Needed**: `line/simpleLineSpec`
    - **Features**: Basic line chart, simpler than multiLineLabelSpec

#### 🔧 **Custom/Legacy Charts**

11. **Borough Map (london-map-1)**

    - **Current**: `boroughMapSpec` (London-specific topojson)
    - **Solution**: Keep existing VegaLite spec (not compatible with world map template)
    - **Integration**: Wrap in ReusableNode with `chartType="vega"`

12. **LSOA Level Borough Map (lsoa-map-2)**
    - **Current**: Custom `LSOAMap` React component
    - **Solution**: Keep existing component
    - **Integration**: Wrap in ReusableNode with `chartType="custom"`

### KPI Cards (6 total) - No Templates Needed

1. **Borough Details** - `chartType="kpi"` with custom icon
2. **Total Population** - `chartType="kpi"` with numeric value
3. **Population Change** - `chartType="kpi"` with trend indicator
4. **Population Density** - `chartType="kpi"` with numeric value
5. **Mean House Price** - `chartType="kpi"` with numeric value
6. **Mean Household Income** - `chartType="kpi"` with numeric value

## New VegaTemplates to Create

### 1. **line/simpleLineSpec.tsx**

**Purpose**: Single-series line charts with basic interactions
**Usage**: Library visits timeline
**Parameters**:

```typescript
interface SimpleLineParams {
  data: any[];
  xField: string;
  yField: string;
  color?: string;
  width: number;
  height: number;
  xAxisConfig?: AxisConfig;
  yAxisConfig?: AxisConfig;
  tooltip?: TooltipConfig;
}
```

### 2. **line/tripleLineWithVolumeSpec.tsx**

**Purpose**: Triple-metric line chart with dual Y-axes (price lines + volume bars)
**Usage**: House price timeline (mean price, median price, sales volume)
**Parameters**:

```typescript
interface TripleLineVolumeParams {
  data: any[];
  xField: string;
  yField1: string; // Primary Y-axis (price)
  yField2: string; // Primary Y-axis (price)
  volumeField: string; // Secondary Y-axis (volume)
  colors: [string, string, string];
  width: number;
  height: number;
  axes?: DualAxisConfig;
  legend?: LegendConfig;
}
```

### 3. **bar/comparisonBarSpec.tsx**

**Purpose**: Side-by-side comparison bars with change indicators
**Usage**: Borough crime stats (2022 vs 2023 comparison)
**Parameters**:

```typescript
interface ComparisonBarParams {
  data: any[];
  categoryField: string;
  value1Field: string; // Previous period
  value2Field: string; // Current period
  changeField?: string; // Percentage change
  colors: [string, string];
  width: number;
  height: number;
  orientation?: "horizontal" | "vertical";
  showChange?: boolean;
}
```

### 4. **bar/categoricalBarSpec.tsx** (Optional - could use existing horizontal)

**Purpose**: Simple categorical bar chart
**Usage**: School facilities by type
**Note**: Might be redundant with existing `horizontalBarSpec`

## Conversion Strategy

### Phase 1: VegaTemplate Extensions

1. **Create new required templates**:

   ```
   src/vegaTemplates/
   ├── line/
   │   ├── simpleLineSpec.tsx           (NEW - for library visits)
   │   └── tripleLineWithVolumeSpec.tsx (NEW - for house prices)
   └── bar/
       └── comparisonBarSpec.tsx        (NEW - for crime stats comparison)
   ```

2. **Update SpecCreator.tsx** to support new subtypes:
   ```typescript
   case 'line':
     switch (subtype) {
       case 'multiLineLabelSpec': // existing
       case 'simpleLineSpec': // NEW
       case 'tripleLineWithVolumeSpec': // NEW
     }
   case 'bar':
     switch (subtype) {
       case 'horizontalBarSpec': // existing
       case 'divergingBarSpec': // existing
       case 'comparisonBarSpec': // NEW
     }
   ```

### Phase 2: Infrastructure Setup

1. **Create london2 directory structure**

   ```
   src/app/london2/
   ├── page.tsx              (main dashboard)
   ├── londonDataUtils.ts    (data processing utilities)
   ├── londonDataTypes.ts    (TypeScript interfaces)
   └── londonSpecHelpers.ts  (chart specification helpers)
   ```

2. **Import dependencies**
   - ReusableNode component
   - ReusableGrid component
   - Extended SpecCreator with new templates
   - All existing london data utilities

### Phase 3: Data Layer Refactoring

1. **Create consolidated data interfaces** (`londonDataTypes.ts`)

   ```typescript
   interface LondonDashboardFilters {
     selectedBorough: string;
     selectedCrimeCategory: string;
     selectedBirthYear: number;
     selectedBaseYear: number;
     selectedLSOA: string;
     selectedLSOAName: string;
   }

   // Unified data interfaces for all chart types
   interface PopulationTimelineData { ... }
   interface IncomeTimelineData { ... }
   interface CrimeComparisonData { ... }
   // ... etc
   ```

2. **Centralize data utilities** (`londonDataUtils.ts`)
   - Consolidate all data loading functions
   - Create unified data transformation helpers
   - Abstract data processing from UI components

### Phase 4: Chart Specification Helpers (`londonSpecHelpers.ts`)

#### Helper functions using SpecCreator for each chart:

```typescript
// ✅ USING EXISTING TEMPLATES

// Population timeline using existing multiLineLabelSpec
export const createPopulationTimelineSpec = (
  data: PopulationTimelineData[]
) => {
  return SpecCreator.create({
    type: "line",
    subtype: "multiLineLabelSpec",
    data: transformPopulationData(data),
    config: {
      dimensions: { width: 340, height: 160 },
      fields: { x: "year", y: "population", series: "type" },
      styling: {
        colors: ["#8B5CF6", "#3B82F6"],
        background: "transparent",
        axes: {
          /* ... */
        },
      },
    },
  });
};

// Income timeline using existing multiLineLabelSpec
export const createIncomeTimelineSpec = (data: IncomeTimelineData[]) => {
  return SpecCreator.create({
    type: "line",
    subtype: "multiLineLabelSpec",
    data: transformIncomeData(data),
    config: {
      dimensions: { width: 390, height: 160 },
      fields: { x: "year", y: "income", series: "type" },
      styling: {
        colors: ["#8B5CF6", "#3B82F6"],
        axes: { yAxis: { format: "$,.0f" } },
      },
    },
  });
};

// Crime categories using existing interactivePieSpec
export const createCrimeCategoriesSpec = (data: CrimeCategoryComparison[]) => {
  return SpecCreator.create({
    type: "pie",
    subtype: "interactivePieSpec",
    data,
    config: {
      dimensions: { width: 150, height: 150 },
      fields: { category: "name", value: "count2023" },
      styling: { colors: CRIME_CATEGORY_COLORS },
    },
  });
};

// Country of birth using existing interactivePieSpec
export const createCountryOfBirthSpec = (data: CountryOfBirthStats) => {
  return SpecCreator.create({
    type: "pie",
    subtype: "interactivePieSpec",
    data: data.regions,
    config: {
      dimensions: { width: 130, height: 130 },
      fields: { category: "region", value: "count" },
      styling: {
        colors: ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#1E40AF"],
      },
    },
  });
};

// Gym facilities using existing interactivePieSpec
export const createGymFacilitiesSpec = (data: any[]) => {
  return SpecCreator.create({
    type: "pie",
    subtype: "interactivePieSpec",
    data,
    config: {
      dimensions: { width: 120, height: 120 },
      fields: { category: "facility_type", value: "count" },
      styling: { colors: GYM_COLOR_RANGE },
    },
  });
};

// Ethnicity groups using existing horizontalBarSpec
export const createEthnicityGroupsSpec = (data: BoroughEthnicityStats) => {
  return SpecCreator.create({
    type: "bar",
    subtype: "horizontalBarSpec",
    data: data.minorityGroups,
    config: {
      dimensions: { width: 200, height: 120 },
      fields: { category: "name", value: "percentage" },
      styling: {
        colors: ["#16a34a"],
        axes: { xAxis: { format: ".1f" } },
      },
    },
  });
};

// ⚠️ USING NEW TEMPLATES

// Library visits using NEW simpleLineSpec
export const createLibraryVisitsSpec = (data: any[]) => {
  return SpecCreator.create({
    type: "line",
    subtype: "simpleLineSpec", // NEW
    data,
    config: {
      dimensions: { width: 180, height: 100 },
      fields: { x: "year", y: "visits_per_1000" },
      styling: {
        color: "#3B82F6",
        axes: { yAxis: { format: ".0f" } },
      },
    },
  });
};

// House prices using NEW tripleLineWithVolumeSpec
export const createHousePriceTimelineSpec = (
  data: HousePriceTimelineData[]
) => {
  return SpecCreator.create({
    type: "line",
    subtype: "tripleLineWithVolumeSpec", // NEW
    data,
    config: {
      dimensions: { width: 390, height: 160 },
      fields: {
        x: "year",
        yField1: "mean",
        yField2: "median",
        volumeField: "totalSales",
      },
      styling: {
        colors: ["#8B5CF6", "#3B82F6", "#06B6D4"],
        axes: {
          /* dual Y-axis config */
        },
      },
    },
  });
};

// Crime stats using NEW comparisonBarSpec
export const createCrimeStatsComparisonSpec = (
  data: BoroughCrimeStatsComparison[]
) => {
  return SpecCreator.create({
    type: "bar",
    subtype: "comparisonBarSpec", // NEW
    data,
    config: {
      dimensions: { width: 200, height: 320 },
      fields: {
        category: "borough",
        value1Field: "count2022",
        value2Field: "count2023",
        changeField: "change",
      },
      styling: {
        colors: ["#94a3b8", "#3b82f6"],
        showChange: true,
      },
    },
  });
};

// School facilities using existing horizontalBarSpec (simple categorical)
export const createSchoolFacilitiesSpec = (data: BoroughSchoolStats) => {
  const transformedData = [
    { type: "Primary", count: data.primarySchools },
    { type: "Secondary", count: data.secondarySchools },
    { type: "Special", count: data.specialSchools || 0 },
  ];

  return SpecCreator.create({
    type: "bar",
    subtype: "horizontalBarSpec",
    data: transformedData,
    config: {
      dimensions: { width: 150, height: 80 },
      fields: { category: "type", value: "count" },
      styling: { colors: SCHOOL_TYPE_COLORS },
    },
  });
};
```

### Phase 5: ReusableNode Implementation

#### KPI Row (6 nodes, size: 'xsmall' or 'small')

```typescript
{/* Borough Details */}
<ReusableNode
  size="xsmall"
  chartType="kpi"
  title="Borough Details"
  kpiValue={selectedBorough}
  kpiIcon={<MiniMapComponent borough={selectedBorough} />}
/>

{/* Population KPIs */}
<ReusableNode
  size="xsmall"
  chartType="kpi"
  title="Total Population"
  kpiValue={formatNumber(currentMetrics?.population2023 || 0)}
  kpiUnit="Borough Total"
/>

<ReusableNode
  size="xsmall"
  chartType="kpi"
  title="Population Change"
  kpiValue={formatPercentage(currentMetrics?.populationChangeFromPrevYearPercent || 0)}
  kpiTrend={currentMetrics?.populationChangeFromPrevYearPercent >= 0 ? 'positive' : 'negative'}
  kpiIcon={currentMetrics?.populationChangeFromPrevYearPercent >= 0 ? '↗' : '↘'}
/>

{/* Additional KPIs... */}
```

#### Main Charts (various sizes)

```typescript
{/* ✅ Using existing templates */}
<ReusableNode
  size="medium"
  chartType="vega-lite"
  title="Population Growth & Projections"
  description={`Historical and projected population data for ${selectedBorough}`}
  vegaSpec={createPopulationTimelineSpec(populationTimelineData)}
  chartPosition="left-4-bottom-0"
  dataCondition={populationTimelineData.length > 0}
/>

<ReusableNode
  size="xlarge"
  chartType="vega-lite"
  title="Mean Income Timeline"
  description="Mean and median income trends over time"
  vegaSpec={createIncomeTimelineSpec(incomeTimelineData)}
  chartPosition="left-4-bottom-0"
/>

{/* ⚠️ Using new templates */}
<ReusableNode
  size="xlarge"
  chartType="vega-lite"
  title="House Price Timeline"
  description="Mean, median prices & sales volume"
  vegaSpec={createHousePriceTimelineSpec(housePriceTimelineData)}
  chartPosition="left-4-bottom-0"
/>

<ReusableNode
  size="tall"
  chartType="vega-lite"
  title="Borough Crime Stats"
  description={`Crime statistics comparison for ${selectedCrimeCategory}`}
  vegaSpec={createCrimeStatsComparisonSpec(crimeBarDataComparison)}
  chartPosition="bottom-0-right-4"
  hasFieldFilter={true}
  fieldFilterKey="selectedCrimeCategory"
  filterOptions={crimeCategories}
  selectedFilter={selectedCrimeCategory}
  onFilterChange={updateDashboardFilter}
/>

{/* 🔧 Legacy/Custom charts */}
<ReusableNode
  size="xlarge"
  chartType="vega"
  title="Borough Map"
  subtitle="(Click to filter dashboard)"
  vegaSpec={boroughMapSpec}
  signalListeners={{ select: handleBoroughClick }}
  chartPosition="full"
/>

<ReusableNode
  size="xlarge"
  chartType="custom"
  title={`LSOA Level Borough Map | ${selectedLSOAName || selectedBorough}`}
  subtitle="(Click LSOA to filter)"
  chartPosition="full"
>
  <LSOAMap
    selectedBorough={selectedBorough}
    selectedLSOA={selectedLSOA}
    onLSOASelect={handleLSOASelect}
  />
</ReusableNode>
```

### Phase 6: ReusableGrid Configuration

1. **Create dashboard grid configuration**

   ```typescript
   <ReusableGrid
     config="london-dashboard"
     isLoading={isLoading}
     loadingState={
       <div className="text-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
         <p className="text-gray-600">Loading London data...</p>
       </div>
     }
   >
     {/* All ReusableNode components */}
   </ReusableGrid>
   ```

2. **Implement filtering system**
   - Centralized `dashboardFilters` state
   - `updateDashboardFilter` function for all interactions
   - Filter propagation to all relevant charts
   - Maintain filter state consistency

## Implementation Steps & Timeline

### Step 1: Create New VegaTemplates (Priority: HIGH)

**Estimated Time: 4-6 hours**

1. **Create `line/simpleLineSpec.tsx`** (1.5 hours)

   - Single-series line chart with basic interactions
   - Used for library visits timeline

2. **Create `line/tripleLineWithVolumeSpec.tsx`** (2-3 hours)

   - Complex dual Y-axis chart for price + volume
   - Used for house price timeline

3. **Create `bar/comparisonBarSpec.tsx`** (1.5 hours)

   - Side-by-side comparison bars with change indicators
   - Used for crime statistics comparison

4. **Update SpecCreator.tsx** (0.5 hours)
   - Add new subtype cases
   - Test integration

### Step 2: Setup and Data Layer (Priority: MEDIUM)

**Estimated Time: 2-3 hours**

1. **Create london2 page structure** (0.5 hours)
2. **Create `londonDataTypes.ts`** (1 hour)
   - Consolidate all data interfaces
   - Add filter state types
3. **Create `londonDataUtils.ts`** (1 hour)
   - Import and adapt existing data utilities
   - Create data transformation helpers
4. **Test data loading functionality** (0.5 hours)

### Step 3: Chart Specification Helpers (Priority: HIGH)

**Estimated Time: 3-4 hours**

1. **Create `londonSpecHelpers.ts`** (2.5 hours)

   - Implement all 12 chart specification functions
   - Data transformation utilities
   - Test each chart spec individually

2. **Test SpecCreator integration** (1 hour)
   - Verify all templates work correctly
   - Debug any issues

### Step 4: KPI Cards Implementation (Priority: LOW)

**Estimated Time: 1-2 hours**

1. **Convert 6 KPI cards to ReusableNode** (1 hour)
2. **Implement borough selection logic** (0.5 hours)
3. **Test basic dashboard structure** (0.5 hours)

### Step 5: Map Components Integration (Priority: MEDIUM)

**Estimated Time: 2-3 hours**

1. **Integrate Borough Map with ReusableNode** (1 hour)

   - Wrap existing VegaLite spec
   - Implement interaction handlers

2. **Integrate LSOA Map with ReusableNode** (1.5 hours)

   - Wrap existing React component
   - Handle LSOA selection events

3. **Test map interactions** (0.5 hours)

### Step 6: Chart Conversion by Priority (Priority: HIGH)

**Estimated Time: 4-6 hours**

**High Priority Charts** (2.5 hours):

- Population Growth & Projections ✅ (existing template)
- Mean Income Timeline ✅ (existing template)
- Borough Crime Categories ✅ (existing template)

**Medium Priority Charts** (2 hours):

- House Price Timeline ⚠️ (new template)
- Borough Crime Stats ⚠️ (new template)
- Ethnicity Groups ✅ (existing template)

**Low Priority Charts** (1.5 hours):

- Country of Birth ✅ (existing template)
- School Facilities ✅ (existing template)
- Library Visits ⚠️ (new template)
- Gym Facilities ✅ (existing template)

### Step 7: Filter Integration & Testing (Priority: HIGH)

**Estimated Time: 2-3 hours**

1. **Implement dashboard-wide filter state** (1 hour)
2. **Connect filters to ReusableNode components** (1 hour)
3. **Test filter interactions and data updates** (1 hour)

### Step 8: Final Integration & Polish (Priority: LOW)

**Estimated Time: 2-3 hours**

1. **Style consistency checks** (0.5 hours)
2. **Performance optimization** (1 hour)
3. **Error handling** (0.5 hours)
4. **Testing and validation** (1 hour)

## Technical Implementation Details

### Template Creation Priority

#### 🔴 **Critical Path Templates** (Must be created first)

1. **`tripleLineWithVolumeSpec.tsx`** - Complex chart, core functionality
2. **`comparisonBarSpec.tsx`** - Unique comparison visualization
3. **`simpleLineSpec.tsx`** - Simple but needed for completion

#### SpecCreator Updates Required

```typescript
// Add to SpecCreator.tsx
private static createLineChart(subtype: string, data: any[], config: ChartConfig): any {
  switch (subtype) {
    case 'multiLineLabelSpec':
      return SpecCreator.createMultiLineLabelChart(data, config);
    case 'simpleLineSpec': // NEW
      return SpecCreator.createSimpleLineChart(data, config);
    case 'tripleLineWithVolumeSpec': // NEW
      return SpecCreator.createTripleLineVolumeChart(data, config);
    default:
      throw new Error(`Unsupported line chart subtype: ${subtype}`);
  }
}

private static createBarChart(subtype: string, data: any[], config: ChartConfig): any {
  switch (subtype) {
    case 'horizontalBarSpec':
    case 'divergingBarSpec':
      // existing cases
    case 'comparisonBarSpec': // NEW
      return SpecCreator.createComparisonBarChart(data, config);
    default:
      throw new Error(`Unsupported bar chart subtype: ${subtype}`);
  }
}
```

### Data Transformation Strategy

#### Chart Data Requirements

```typescript
// ✅ Direct compatibility (minimal transformation)
- Population Timeline → multiLineLabelSpec (time series)
- Income Timeline → multiLineLabelSpec (dual series)
- Crime Categories → interactivePieSpec (categorical)
- Country of Birth → interactivePieSpec (regional)
- Ethnicity Groups → horizontalBarSpec (categorical)

// ⚠️ Requires transformation (moderate complexity)
- Gym Facilities → interactivePieSpec (aggregate counts)
- School Facilities → horizontalBarSpec (type categorization)

// 🔴 Complex transformation (new templates needed)
- House Prices → tripleLineWithVolumeSpec (multi-metric, dual axis)
- Crime Stats → comparisonBarSpec (year-over-year comparison)
- Library Visits → simpleLineSpec (single time series)
```

## Success Criteria & Validation

### Functional Requirements ✅

1. **Complete Feature Parity**: All 12 charts + 6 KPIs + 2 maps functional
2. **Filter System**: Borough, LSOA, crime category, year selection working
3. **Interactions**: Map clicks, chart hovers, filter changes
4. **Data Loading**: All existing data sources integrated

### Technical Requirements ✅

1. **Template Usage**: 7/12 charts using existing templates, 3/12 using new templates
2. **Code Quality**: Clean separation of concerns, reusable components
3. **Performance**: No regression in loading/interaction times
4. **Type Safety**: Full TypeScript coverage

### New Template Validation ✅

1. **`simpleLineSpec`**: Single-series line charts work correctly
2. **`tripleLineWithVolumeSpec`**: Dual Y-axis with lines + bars renders properly
3. **`comparisonBarSpec`**: Side-by-side bars with change indicators function

## Summary

This updated plan aligns with the VegaTemplates architecture and provides:

- **7 charts** can use existing templates directly ✅
- **3 charts** require new templates ⚠️
- **2 charts** remain as custom/legacy components 🔧
- **Clear implementation priority** focusing on new template creation first
- **Realistic timeline** of 20-28 hours total development time

The conversion follows established patterns while extending the template system to support London-specific chart requirements, maintaining consistency with the travel2 implementation approach.
