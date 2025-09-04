# Vega Templates User Guide

This guide explains how to use the `SpecCreator` factory to create reusable chart templates in the Visplora application. Each template is designed to be configurable and follows a consistent parameter structure.

## Table of Contents

- [Overview](#overview)
- [Data Types & Usage Examples](#data-types--usage-examples)
- [Basic Usage](#basic-usage)
- [Chart Types](#chart-types)
  - [Line Charts](#line-charts)
  - [Bar Charts](#bar-charts)
  - [Pie Charts](#pie-charts)
  - [Scatter Charts](#scatter-charts)
  - [Map Charts](#map-charts)
  - [Multi-Type Charts](#multi-type-charts)
- [Common Parameters](#common-parameters)
- [Usage Examples](#usage-examples)

## Overview

The vega templates system uses a factory pattern with the `SpecCreator` class. You create charts by calling:

```typescript
import { SpecCreator } from "../../vegaTemplates/SpecCreator";

const chartSpec = SpecCreator.create({
  type: "line", // Chart type
  subtype: "multiLineLabelSpec", // Specific template
  data: myData, // Your data array
  config: {
    // Configuration object
  },
});
```

## Data Types & Usage Examples

This section shows the data structures used by each chart type in the travel2 dashboard, providing real-world examples of how to structure your data.

### Line Charts Data (Time Series)

```typescript
// CostTimelineData - used by multiLineLabelSpec
interface CostTimelineData {
  year: number;
  month: number;
  date: string; // "YYYY-MM" format
  avgHotelPrice: number;
  avgMealPrice: number;
  avgTransportCost: number;
  costIndex: number;
  destination: string;
}
```

### Bar Charts Data (Categorical)

```typescript
// Travel Growth - used by horizontalBarSpec
interface TravelGrowthData {
  city: string; // category field
  visitors: number; // value field
  change: number; // growth percentage (for color scaling)
  year: number;
}

// Safety Comparison - used by divergingBarSpec (with transformation)
interface SafetyComparisonData {
  region: string; // category field
  crimeIndex: number; // gets transformed to crimeIndex_positive
  politicalRisk: number; // gets transformed to crimeIndex_negative
  overallSafety: number;
}
```

### Pie Charts Data (Categorical Distribution)

```typescript
// Reviews Distribution - used by interactivePieSpec
interface ReviewsDistributionData {
  ratingBucket: string; // "5 Stars", "4 Stars", etc.
  count: number; // slice values
  percentage: number;
  avgSentiment: number;
}

// Safety Breakdown - used by interactivePieSpec
interface SafetyBreakdownData {
  category: string; // "Police", "Healthcare", etc.
  score: number; // slice values
}
```

### Scatter Charts Data (Multi-dimensional)

```typescript
// Environmental Quality - used by bubblePlotScatterSpec
interface EnvironmentalQualityData {
  city: string;
  aqi: number; // color field (Air Quality Index)
  greenSpacePct: number; // x-axis (Green space percentage)
  waterQuality: number; // y-axis (Water quality score)
  overallScore: number; // size field (bubble size)
  noiseIndex: number;
}
```

### Multi-Type Charts Data (Dual Axis)

```typescript
// Visitor Flow - used by barChartWithLineSpec
interface VisitorFlowSeasonalData {
  month: number;
  monthName: string; // x-axis field
  arrivals: number; // y-axis left (bars)
  occupancyRate: number; // y-axis right (line)
  season: string; // color field for bars
  destination: string;
}
```

### Map Charts Data (Geographic)

```typescript
// World Map - uses predefined country arrays
const CLICKABLE_COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "France",
  "Germany",
  "Italy",
  "Spain",
  "Japan",
  // ... 150+ countries
];
```

### Custom Implementation Data

```typescript
// Cultural Diversity - custom Vega-Lite spec
interface CulturalDiversityData {
  metric: string;         // "Language Diversity", "Cuisine Variety"
  score: number;          // current score
  maxScore: number;       // maximum possible
  percentage: number;     // calculated percentage
}
    dimensions: { width: 400, height: 300 },
    fields: { x: "date", y: "value" },
    styling: { colors: ["#3b82f6"] },
  },
});
```

## Basic Usage

### 1. Import the SpecCreator

```typescript
import { SpecCreator } from "../../vegaTemplates/SpecCreator";
```

### 2. Prepare Your Data

Ensure your data is an array of objects with the required fields for your chosen chart type.

### 3. Call SpecCreator.create()

Pass a `ChartSpec` object with `type`, `subtype`, `data`, and `config`.

# Chart Types

## Line Charts

### multiLineLabelSpec

Creates a multi-series line chart with hover labels and interactive features.

**Data Structure:**
The data should be an array of objects with time-based x values and numerical y values, grouped by series.

**Travel2 Example - Cost Timeline:**
Uses `CostTimelineData[]` transformed by `SpecCreator.transformCostTimelineData()`:

```typescript
interface CostTimelineData {
  year: number;
  month: number;
  date: string; // Format: "YYYY-MM"
  avgHotelPrice: number;
  avgMealPrice: number;
  avgTransportCost: number;
  costIndex: number;
  destination: string;
}

// Transformed data format for multiLineLabelSpec:
interface TransformedData {
  date: string; // x-axis: time dimension
  cost: number; // y-axis: cost values
  series: string; // series: "Hotel Cost", "Meal Cost", "Transport Cost"
}
```

**Parameters:**

- **data**: Array of objects with temporal data
- **fields**:
  - `x` (required): Field name for x-axis (temporal data, e.g., 'date')
  - `y` (required): Field name for y-axis values
  - `series` (optional): Field name for series grouping (default: 'series')
- **dimensions**:
  - `width`: Chart width in pixels (default: 340)
  - `height`: Chart height in pixels (default: 160)
- **styling**:
  - `colors`: Array of colors for different series (default: ['#aea630ff', '#3b82f6', '#16a34a'])
  - `background`: Background color (default: 'transparent')
  - `axes`: Axis configuration object
- **interactions**:
  - `hover` (boolean): Enable hover point highlighting (default: true)
  - `labels` (boolean): Show value labels on hover (default: true)
- **legend**: Full legend configuration object (see Common Parameters)
- **dateFormat**: Date format string for x-axis (default: '%Y-%m')
- **yFormat**: Y-axis number format (default: '$,.0f')

**Example:**

```typescript
const costTimelineSpec = SpecCreator.create({
  type: "line",
  subtype: "multiLineLabelSpec",
  data: transformedData,
  config: {
    dimensions: { width: 340, height: 160 },
    fields: {
      x: "date",
      y: "cost",
      series: "series",
    },
    styling: {
      colors: ["#aea630ff", "#3b82f6", "#16a34a"],
      background: "transparent",
      axes: {
        xAxis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 8,
          labelAngle: -45,
          grid: false,
          ticks: true,
          domain: true,
          title: null,
          format: "%Y-%m",
        },
        yAxis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 8,
          gridColor: "#888",
          gridDash: [2, 2],
          grid: true,
          ticks: true,
          domain: true,
          title: null,
          format: "$,.0f",
        },
      },
    },
    legend: {
      title: null,
      labelFontSize: 10,
      symbolSize: 80,
      orient: "right",
      padding: 10,
      offset: 0,
      symbolType: "circle",
    },
    interactions: {
      labels: true,
    },
  },
});
```

## Bar Charts

### horizontalBarSpec

Creates a horizontal bar chart with interactive hover and selection capabilities.

**Data Structure:**
The data should be an array of objects with categorical fields and numerical values.

**Travel2 Example - Travel Growth Trends:**
Uses travel growth data:

```typescript
interface TravelGrowthData {
  city: string; // category field
  visitors: number; // value field
  change: number; // growth percentage (optional, for color scaling)
  year: number; // temporal context
}

// Example data:
const data = [
  { city: "New York", visitors: 15200000, change: 8.5, year: 2025 },
  { city: "Los Angeles", visitors: 12800000, change: 6.2, year: 2025 },
  { city: "Chicago", visitors: 9500000, change: 4.1, year: 2025 },
];
```

**Parameters:**

- **data**: Array of objects with categorical data
- **fields**:
  - `category` (required): Field name for categories
  - `value` (required): Field name for values
- **dimensions**:
  - `width`: Chart width (default: 220)
  - `height`: Chart height (default: 205)
- **styling**:
  - `colors`: Color array or color scale configuration (default: ['#94a3b8', '#3b82f6', '#16a34a'])
  - `axes`: Axis styling configuration
  - `background`: Background color (default: 'transparent')
- **interactions**:
  - `hover` (boolean): Enable hover effects (default: true)
  - `select` (boolean): Enable selection (default: true)
- **tooltip**: Custom tooltip configuration
- **orientation**: Bar orientation - 'horizontal' or 'vertical' (default: 'horizontal')

**Advanced Color Handling:**
The template automatically detects data fields for color scaling:

- If data contains `change` field: Uses growth-based color scale
- If data contains `percentage` field: Uses percentage-based coloring
- Otherwise: Uses solid color from colors array

**Mark Styling:**

- `cornerRadiusEnd`: Rounded corners for horizontal bars (default: 2)
- `height`: Bar height for horizontal orientation (default: 12)
- Conditional stroke and opacity for hover/select states

**Example:**

```typescript
const growthTrendsSpec = SpecCreator.create({
  type: "bar",
  subtype: "horizontalBarSpec",
  data,
  config: {
    dimensions: { width: 170, height: 200 },
    fields: {
      category: "city",
      value: "visitors",
    },
    styling: {
      colors: ["#94a3b8", "#3b82f6", "#16a34a"],
      background: "transparent",
      axes: {
        xAxis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 8,
          grid: true,
          gridColor: "#888",
          gridDash: [2, 2],
          title: "Annual Visitors (millions)",
          format: ".1s",
        },
        yAxis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 10,
          title: null,
        },
      },
    },
    legend: {
      title: "Growth %",
      titleColor: "#888",
      labelColor: "#888",
      titleFontSize: 9,
      labelFontSize: 8,
      offset: 10,
      orient: "right",
    },
    tooltip: {
      fields: [
        { field: "city", type: "nominal", title: "City" },
        {
          field: "visitors",
          type: "quantitative",
          title: "Visitors",
          format: ".2s",
        },
        {
          field: "change",
          type: "quantitative",
          title: "Growth Rate (%)",
          format: ".1f",
        },
        { field: "year", type: "quantitative", title: "Year", format: ".0f" },
      ],
    },
    interactions: {
      hover: true,
      select: true,
    },
  },
});
```

### divergingBarSpec

Creates a diverging horizontal bar chart for comparing positive/negative values with advanced styling.

**Data Structure:**
The data should contain positive and negative value fields for comparison.

**Travel2 Example - Safety Comparison:**
Uses `SafetyComparisonData[]` with data transformation:

```typescript
interface SafetyComparisonData {
  region: string; // category field
  crimeIndex: number; // original value
  politicalRisk: number; // second value for comparison
  healthRisk: number;
  overallSafety: number;
}

// Transformed data for divergingBarSpec:
interface TransformedSafetyData {
  region: string;
  crimeIndex_positive: number; // positive side (crime risk)
  crimeIndex_negative: number; // negative side (political risk)
  overallSafety: number;
}

// Data transformation in travel2:
const transformedData = data.map((d) => ({
  ...d,
  crimeIndex_positive: d.crimeIndex,
  crimeIndex_negative: d.politicalRisk,
}));
```

**Parameters:**

- **data**: Array with positive and negative value fields
- **fields**:
  - `category` (required): Field for category labels
  - `value` (required): Base field name (system looks for `${value}_positive` and `${value}_negative`)
  - `positiveLabel` (optional): Custom label for positive values
  - `negativeLabel` (optional): Custom label for negative values
- **dimensions**:
  - `width`: Chart width (default: 450)
  - `height`: Chart height (default: 170)
- **styling**:
  - `colors`: Array of colors [positive, negative] (default: ['#ef4444', '#f59e0b'])
  - `background`: Background color (default: 'transparent')
  - `axes`: Axis configuration
- **interactions**:
  - `hover` (boolean): Enable hover effects (default: true)
  - `select` (boolean): Enable selection (default: true)
- **legend**: Legend configuration with special `direction: 'horizontal'` support
- **tooltip**: Automatic tooltip with category, risk type, and absolute values

**Advanced Features:**

- Automatic data transformation to positive/negative values
- Text labels overlay showing category names
- Conditional stroke and opacity for interactions
- Data sorting by positive values
- Custom legend positioning and styling

**Example:**

```typescript
const safetyComparisonSpec = SpecCreator.create({
  type: "bar",
  subtype: "divergingBarSpec",
  data: transformedData,
  config: {
    dimensions: { width: 450, height: 155 },
    fields: {
      category: "region",
      value: "crimeIndex",
      positiveLabel: "Crime Risk",
      negativeLabel: "Political Risk",
    },
    styling: {
      colors: ["#ef4444", "#f59e0b"],
      background: "transparent",
      axes: {
        xAxis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 8,
          grid: true,
          gridColor: "#888",
          gridDash: [2, 2],
          title: "Risk Index (Crime ← | → Political)",
          format: ".0f",
        },
      },
    },
    legend: {
      title: null,
      orient: "top",
      titleColor: "#888",
      labelColor: "#888",
      titleFontSize: 11,
      labelFontSize: 10,
      symbolSize: 150,
      symbolType: "square",
    },
    tooltip: {
      fields: [
        { field: "region", type: "nominal", title: "Region" },
        { field: "riskLabel", type: "nominal", title: "Risk Type" },
        {
          field: "absolute_risk",
          type: "quantitative",
          title: "Risk Value",
          format: ".1f",
        },
        {
          field: "overallSafety",
          type: "quantitative",
          title: "Overall Safety",
          format: ".0f",
        },
      ],
    },
    interactions: {
      hover: true,
      select: true,
    },
  },
});
```

## Pie Charts

### interactivePieSpec

Creates an interactive pie or donut chart with hover effects and optional center text.

**Data Structure:**
The data should be an array of objects with categorical fields and numerical values.

**Travel2 Examples:**

**1. Reviews Distribution:**
Uses `ReviewsDistributionData[]`:

```typescript
interface ReviewsDistributionData {
  ratingBucket: string; // category field: "5 Stars", "4 Stars", etc.
  count: number; // value field: number of reviews
  percentage: number; // additional context
  avgSentiment: number; // additional data
}
```

**2. Safety Breakdown:**
Uses safety breakdown data from `generateSafetyBreakdown()`:

```typescript
interface SafetyBreakdownData {
  category: string; // category field: "Police", "Healthcare", etc.
  score: number; // value field: safety scores
}
```

**Parameters:**

- **data**: Array of objects with categorical data
- **fields**:
  - `category` (required): Field name for categories
  - `value` (required): Field name for values
- **dimensions**:
  - `width`: Chart width (default: 120)
  - `height`: Chart height (default: 120)
- **styling**:
  - `colors`: Array of colors for slices
  - `background`: Background color (default: 'transparent')
- **pie/donut configuration**:
  - `innerRadius`: Inner radius for donut chart (default: 42, set to 0 for pie)
  - `outerRadius`: Outer radius (default: 60)
- **center text (for donut charts)**:
  - `showCenterText` (boolean): Show text in center (default: true)
  - `centerText`: Main center text (auto-calculated average if not provided)
  - `centerSubtext`: Subtitle text (default: 'Average')
- **interaction styling**:
  - `hoverParam`: Parameter name for hover (default: 'hover_pie')
  - `strokeWidth`: Default stroke width (default: 0.5)
  - `hoverStrokeWidth`: Hover stroke width (default: 2)
  - `opacity`: Default opacity (default: 0.7)
  - `hoverOpacity`: Hover opacity (default: 1.0)
- **interactions**:
  - `hover` (boolean): Enable hover effects (default: true)
- **legend**: Full legend configuration
- **tooltip**: Custom tooltip configuration

**Example:**

```typescript
const reviewsDistributionSpec = SpecCreator.create({
  type: "pie",
  subtype: "interactivePieSpec",
  data: [
    { rating: "5 Stars", count: 45 },
    { rating: "4 Stars", count: 32 },
    { rating: "3 Stars", count: 15 },
    { rating: "2 Stars", count: 6 },
    { rating: "1 Star", count: 2 },
  ],
  config: {
    dimensions: { width: 150, height: 150 },
    fields: {
      category: "rating",
      value: "count",
    },
    styling: {
      colors: ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B"],
    },
    legend: {
      title: "Review Ratings",
      orient: "right",
    },
  },
});
```

## Scatter Charts

### bubblePlotScatterSpec

Creates a scatter plot with optional bubble sizing and color encoding. **This chart supports multiple independent legends.**

**Data Structure:**
The data should be an array of objects with x/y coordinates and optional size/color fields.

**Travel2 Example - Environmental Quality:**
Uses `EnvironmentalQualityData[]`:

```typescript
interface EnvironmentalQualityData {
  city: string; // identifier
  aqi: number; // color field: Air Quality Index
  greenSpacePct: number; // x-axis: Green space percentage
  waterQuality: number; // y-axis: Water quality score
  overallScore: number; // size field: Overall environmental score
  noiseIndex: number; // additional data
}

// Example data:
const data = [
  {
    city: "Portland",
    aqi: 25, // Low AQI = better air quality (color)
    greenSpacePct: 35.2, // x-axis position
    waterQuality: 92, // y-axis position
    overallScore: 85, // bubble size
  },
];
```

**Parameters:**

- **data**: Array of objects with x, y, and optional size/color fields
- **fields**:
  - `x` (required): X-axis field name
  - `y` (required): Y-axis field name
  - `size` (optional): Field for bubble sizing
  - `color` (optional): Field for color encoding
- **dimensions**:
  - `width`: Chart width (default: 360)
  - `height`: Chart height (default: 120)
- **styling**:
  - `colors`: Color scheme configuration
    - For color scales: `['redyellowgreen', 'reverse']` format
    - For solid colors: `['#3b82f6']` format
  - `sizeDomain`: Min/max values for size field (default: [50, 100])
  - `sizeRange`: Min/max pixel sizes for bubbles (default: [200, 800])
  - `background`: Background color (default: 'transparent')
  - `axes`: Axis configuration object
- **multiple legend system**: ⭐ **Key Feature**
  - `legend`: General legend configuration (fallback for both)
  - `sizeLegend`: Dedicated size legend configuration
  - `colorLegend`: Dedicated color legend configuration
- **interactions**:
  - `hover` (boolean): Enable hover effects (default: true)
  - `select` (boolean): Enable selection (default: true)
- **tooltip**: Custom tooltip configuration

**Advanced Legend Configuration:**

**Size Legend (`sizeLegend`):**

```typescript
sizeLegend: {
  showSize: boolean,           // Show/hide size legend
  sizeTitle: string,          // Title for size legend
  titleColor: string,         // Title color
  labelColor: string,         // Label color
  titleFontSize: number,      // Title font size
  labelFontSize: number,      // Label font size
  orient: 'left' | 'right' | 'top' | 'bottom',  // Position
  offset: number,             // Distance from chart
  values: number[]            // Custom legend values [40, 60, 80, 100]
}
```

**Color Legend (`colorLegend`):**

```typescript
colorLegend: {
  showColor: boolean,         // Show/hide color legend
  colorTitle: string,         // Title for color legend
  colorOrient: 'left' | 'right' | 'top' | 'bottom',  // Position
  colorOffset: number,        // Distance from chart
  titleColor: string,         // Title color
  labelColor: string,         // Label color
  titleFontSize: number,      // Title font size
  labelFontSize: number       // Label font size
}
```

**Mark Styling:**

- Conditional stroke and opacity for hover/select states
- `strokeWidth`: 2 (for bubble outlines)
- Interactive cursor pointer

**Example:**

```typescript
const environmentalQualitySpec = SpecCreator.create({
  type: "scatter",
  subtype: "bubblePlotScatterSpec",
  data,
  config: {
    dimensions: { width: 360, height: 120 },
    fields: {
      x: "greenSpacePct",
      y: "waterQuality",
      size: "overallScore",
      color: "aqi",
    },
    styling: {
      colors: ["redyellowgreen", "reverse"],
      background: "transparent",
      sizeDomain: [40, 100],
      axes: {
        xAxis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 8,
          titleFontSize: 10,
          grid: true,
          gridColor: "#888",
          gridDash: [4, 10],
          ticks: true,
          domain: true,
          title: "Green Space %",
          scale: { domain: [0, 60], nice: true },
        },
        yAxis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 8,
          titleFontSize: 10,
          grid: false,
          gridColor: "#888",
          gridDash: [4, 50],
          ticks: true,
          domain: true,
          title: "Water Quality Score",
          scale: { domain: [70, 100], nice: true },
        },
      },
    },
    legend: {
      showSize: true,
      sizeTitle: "Overall Score",
      showColor: true,
      colorTitle: "Air Quality (Lower AQI = Better)",
      titleColor: "#888",
      labelColor: "#888",
      titleFontSize: 9,
      labelFontSize: 8,
      orient: "right",
      colorOrient: "top",
      offset: 15,
      colorOffset: 0,
    },
    sizeLegend: {
      sizeTitle: "Overall Score",
      titleColor: "#888",
      labelColor: "#888",
      titleFontSize: 9,
      labelFontSize: 8,
      orient: "right",
      values: [40, 60, 80, 100],
      offset: 15,
    },
    colorLegend: {
      colorTitle: "Air Quality (Lower AQI = Better)",
      titleColor: "#888",
      labelColor: "#888",
      titleFontSize: 9,
      labelFontSize: 8,
      colorOrient: "top",
      colorOffset: 0,
    },
    tooltip: {
      fields: [
        { field: "city", type: "nominal", title: "City" },
        {
          field: "aqi",
          type: "quantitative",
          title: "Air Quality Index",
          format: ".0f",
        },
        {
          field: "greenSpacePct",
          type: "quantitative",
          title: "Green Space %",
          format: ".1f",
        },
        {
          field: "waterQuality",
          type: "quantitative",
          title: "Water Quality Score",
          format: ".0f",
        },
        {
          field: "overallScore",
          type: "quantitative",
          title: "Overall Environmental Score",
          format: ".0f",
        },
      ],
    },
    interactions: {
      hover: true,
      select: true,
    },
  },
});
```

## Map Charts

### worldInteractiveMapSpec

Creates an interactive world map with country selection and advanced interaction options.

**Data Structure:**
The map uses predefined geographical data and country configurations.

**Travel2 Example - World Travel Map:**
Uses `CLICKABLE_COUNTRIES` array and **calls `createWorldTravelMapVegaSpec` directly** (not SpecCreator):

```typescript
// CLICKABLE_COUNTRIES: Array of country names that can be selected
const CLICKABLE_COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "France",
  "Germany",
  "Italy",
  "Spain",
  "Japan",
  "Australia",
  // ... 150+ countries
];

// Direct function call (bypasses SpecCreator):
import { createWorldTravelMapVegaSpec } from "../../vegaTemplates/map/worldInteractiveMapSpec";

const createWorldTravelMapSpec = () => {
  return createWorldTravelMapVegaSpec({
    width: 800,
    height: 350,
    background: "#7ec2ddff",
    options: {
      selectableCountries: CLICKABLE_COUNTRIES,
    },
  });
};
```

**Function Parameters for `createWorldTravelMapVegaSpec`:**

This function takes a `MapChartParams` object with the following structure:

- **width** (number, default: 800): Map width in pixels
- **height** (number, default: 350): Map height in pixels
- **background** (string, default: "#7ec2ddff"): Background color
- **options** (WorldMapOptions, optional): Configuration object containing:
  - `selectableCountries` (string[], optional): Array of country names that can be clicked
  - `countryField` (string, optional): Field containing country names (default: 'properties.NAME')

**Vega Specification Features:**

- Returns a **Vega** (not Vega-Lite) specification with advanced interaction capabilities
- Supports pan and zoom interactions through mouse/wheel events
- Emits `clicked_country` signal for integration with dashboard filters
- Built-in country name lookup with 240+ countries predefined
- Conditional interactivity: only specified countries are clickable (reduced opacity for others)

**Signal Handling:**

- **clicked_country**: Emitted when a country is clicked, contains full country data object
- **scale**: Controls zoom level (mouse wheel interaction)
- **rotateX, centerY**: Controls map rotation and center point for panning

**Usage in Travel2:**

```typescript
// In ReusableNode:
<ReusableNode
  chartType="vega" // Note: uses "vega" not "vega-lite"
  vegaSpec={createWorldTravelMapVegaSpec({
    width: 800,
    height: 350,
    background: "#7ec2ddff",
    options: { selectableCountries: CLICKABLE_COUNTRIES },
  })}
  signalListeners={{
    clicked_country: handleDestinationClick, // Handle country clicks
  }}
/>
```

**Note:** Unlike other chart types, the world map uses a direct function call rather than the SpecCreator factory pattern. This is because it requires a complex Vega specification with custom signals and interactions that are better handled through a dedicated function.

## Multi-Type Charts

### barChartWithLineSpec

Creates a combination chart with bars and a line overlay using independent dual Y-axes.

**Data Structure:**
The data should contain fields for both bar values and line values on the same x-axis.

**Travel2 Example - Visitor Flow Seasonal:**
Uses `VisitorFlowSeasonalData[]`:

```typescript
interface VisitorFlowSeasonalData {
  month: number; // temporal reference
  monthName: string; // x-axis field: "January", "February", etc.
  arrivals: number; // y-axis left (bars): visitor arrivals count
  occupancyRate: number; // y-axis right (line): hotel occupancy percentage
  season: string; // color field: "Low", "Shoulder", "High"
  destination: string; // grouping context
}

// Example data:
const data = [
  {
    monthName: "January",
    arrivals: 45000, // Bar values (left Y-axis)
    occupancyRate: 68, // Line values (right Y-axis)
    season: "Low", // Color coding for bars
  },
];
```

**Parameters:**

- **data**: Array of objects with bar and line data
- **fields**:
  - `x` (required): X-axis field name
  - `xType`: X-axis data type - 'nominal' | 'ordinal' | 'quantitative' | 'temporal' (default: 'ordinal')
  - `xSort`: Sort configuration - array or sort object
  - `yBar` (required): Field for bar values (left Y-axis)
  - `yLine` (required): Field for line values (right Y-axis)
  - `color` (optional): Field for color encoding of bars
- **dimensions**:
  - `width`: Chart width (default: 390)
  - `height`: Chart height (default: 160)
- **styling**:
  - `colors`: Colors for bar categories
  - `colorDomain`: Domain values for color scale (e.g., ['Low', 'Shoulder', 'High'])
  - `lineColor`: Color for the line (default: '#8b5cf6')
  - `lineWidth`: Width of the line (default: 2)
  - `cornerRadius`: Bar corner radius (default: 2)
  - `background`: Background color (default: 'transparent')
- **dual axis configuration**: ⭐ **Key Feature**
  - `yAxisLeft`: Configuration for bar values (left axis)
  - `yAxisRight`: Configuration for line values (right axis)
  - Independent scale resolution for Y-axes
- **axis objects**:

```typescript
yAxisLeft: {
  title: string,
  labelColor: string,
  titleColor: string,
  labelFontSize: number,
  gridColor: string,
  gridDash: number[],
  grid: boolean,
  format: string,           // e.g., '.2s'
  tooltipTitle: string
},
yAxisRight: {
  title: string,            // e.g., 'Occupancy Rate (%)'
  scale: { domain: [min, max] }, // e.g., { domain: [0, 100] }
  format: string,           // e.g., '.2s'
  tooltipTitle: string
}
```

- **interactions**:
  - `hover` (boolean): Enable hover effects (default: true)
  - Configurable hover parameters and opacity
- **legend**: Standard legend configuration
- **tooltip**: Automatic tooltip for both bar and line values

**Example:**

```typescript
const visitorFlowSpec = SpecCreator.create({
  type: "multiType",
  subtype: "barChartWithLineSpec",
  data: [
    { monthName: "Jan", arrivals: 12500, occupancyRate: 65, season: "Low" },
    { monthName: "Jul", arrivals: 28000, occupancyRate: 95, season: "High" },
  ],
  config: {
    dimensions: { width: 400, height: 200 },
    fields: {
      x: "monthName",
      xType: "ordinal",
      yBar: "arrivals",
      yLine: "occupancyRate",
      color: "season",
    },
    styling: {
      colors: ["#94a3b8", "#3b82f6", "#dc2626"],
      colorDomain: ["Low", "Shoulder", "High"], // Maps to colors
      lineColor: "#8b5cf6",
      lineWidth: 2,
      cornerRadius: 2,
    },
    // Dual Axis Configuration - Key Feature
    axes: {
      xAxis: {
        labelColor: "#888",
        titleColor: "#888",
        labelFontSize: 10,
        title: "Month",
      },
      yAxisLeft: {
        title: "Visitor Arrivals",
        labelColor: "#888",
        titleColor: "#888",
        labelFontSize: 8,
        grid: true,
        gridColor: "#888",
        gridDash: [2, 2],
        format: ".2s",
        tooltipTitle: "Arrivals",
      },
      yAxisRight: {
        title: "Occupancy Rate (%)",
        scale: { domain: [0, 100] },
        format: ".0f",
        tooltipTitle: "Occupancy Rate",
      },
    },
    interactions: {
      hover: true,
    },
  },
});
```

## Common Parameters

### Dimensions

All charts support:

- `width`: Chart width in pixels
- `height`: Chart height in pixels

### Styling

- `colors`: Array of color values (hex, rgb, or named colors)
- `background`: Background color (default: 'transparent')
- `axes`: Axis configuration object with `xAxis` and `yAxis` properties

### Axis Configuration

```typescript
xAxis: {
  title?: string | null,                   // Axis title (null hides title)
  labelColor?: string,                     // Color for axis labels (e.g., '#888')
  titleColor?: string,                     // Color for axis title (e.g., '#888')
  labelFontSize?: number,                  // Font size for labels (e.g., 8)
  titleFontSize?: number,                  // Font size for title (e.g., 10)
  labelAngle?: number,                     // Angle for label rotation (e.g., -45)
  labelPadding?: number,                   // Spacing between labels and axis (e.g., 5)
  labelLimit?: number,                     // Max width for labels (e.g., 120)
  grid?: boolean,                          // Show grid lines (default: varies by chart)
  gridColor?: string,                      // Grid line color (e.g., '#888')
  gridDash?: number[],                     // Grid line dash pattern (e.g., [2, 2] or [4, 10])
  ticks?: boolean,                         // Show tick marks (default: true)
  domain?: boolean,                        // Show axis line (default: true)
  format?: string,                         // Value formatting (e.g., '$,.0f', '.1%', '.2s', '%Y-%m')
  scale?: {                               // Custom scale configuration
    domain?: [number, number] | string[], // Scale domain (e.g., [0, 100] or ['A', 'B', 'C'])
    nice?: boolean,                       // Nice scale bounds (default: false)
    clamp?: boolean,                      // Clamp values to domain (default: false)
    type?: string                         // Scale type (e.g., 'linear', 'log', 'sqrt')
  }
},
yAxis: {
  // Same options as xAxis, plus:
  labelBaseline?: string,                  // Baseline for labels ('top', 'middle', 'bottom')
  labelAlign?: string                      // Alignment for labels ('left', 'center', 'right')
}
```

**Common Format Patterns:**

- **Currency**: `'$,.0f'` → $1,234
- **Percentage**: `'.1%'` → 45.3%
- **Short Numbers**: `'.2s'` → 1.2k, 3.4M
- **Integers**: `'.0f'` → 1234 (no decimals)
- **Decimals**: `'.1f'` → 123.4
- **Dates**: `'%Y-%m'` → 2024-01, `'%b %Y'` → Jan 2024

### Legend Configuration

```typescript
legend: {
  title?: string | null,                    // Legend title (null hides title)
  titleColor?: string,                     // Title text color
  titleFontSize?: number,                  // Title font size
  labelColor?: string,                     // Label text color
  labelFontSize?: number,                  // Label font size
  symbolSize?: number,                     // Size of legend symbols
  orient?: 'left' | 'right' | 'top' | 'bottom',  // Legend position
  padding?: number,                        // Internal padding
  offset?: number,                         // Distance from chart
  symbolType?: 'circle' | 'square' | 'cross' | 'diamond' | 'triangle-up' | 'triangle-down',
  direction?: 'horizontal' | 'vertical',   // Layout direction (for diverging bars)

  // Multi-Legend Support (Scatter Charts)
  showSize?: boolean,                      // Show/hide size legend
  sizeTitle?: string,                      // Size legend title
  showColor?: boolean,                     // Show/hide color legend
  colorTitle?: string,                     // Color legend title
  colorOrient?: 'left' | 'right' | 'top' | 'bottom',  // Color legend position
  colorOffset?: number,                    // Color legend offset
  values?: number[]                        // Custom legend values [40, 60, 80, 100]
}
```

### Tooltip Configuration

```typescript
tooltip: {
  fields: [
    {
      field: "fieldName",
      type: "nominal" | "quantitative" | "temporal",
      title: "Display Name",
      format: ",.0f", // Number/date formatting
    },
  ];
}
```

### Interactions

```typescript
interactions: {
  hover?: boolean,      // Enable hover effects
  select?: boolean,     // Enable selection
  labels?: boolean      // Show labels on hover (line charts)
}
```

## Usage Examples

### Complete Example - Cost Timeline Chart

```typescript
import { SpecCreator } from "../../vegaTemplates/SpecCreator";

// Sample data
const costData = [
  { date: "2024-01-01", cost: 1200, series: "Hotel Cost" },
  { date: "2024-01-01", cost: 300, series: "Meal Cost" },
  { date: "2024-02-01", cost: 1300, series: "Hotel Cost" },
  { date: "2024-02-01", cost: 320, series: "Meal Cost" },
];

// Create the chart specification
const costTimelineSpec = SpecCreator.create({
  type: "line",
  subtype: "multiLineLabelSpec",
  data: costData,
  config: {
    dimensions: {
      width: 400,
      height: 200,
    },
    fields: {
      x: "date",
      y: "cost",
      series: "series",
    },
    styling: {
      colors: ["#aea630ff", "#3b82f6", "#16a34a"],
      background: "transparent",
      axes: {
        xAxis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 8,
          labelAngle: -45,
          grid: false,
          format: "%Y-%m",
        },
        yAxis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 8,
          grid: true,
          gridColor: "#888",
          gridDash: [2, 2],
          format: "$,.0f",
        },
      },
    },
    legend: {
      title: null,
      labelFontSize: 10,
      symbolSize: 80,
      orient: "right",
      symbolType: "circle",
    },
    interactions: {
      labels: true,
      hover: true,
    },
  },
});

// Use the spec in your component
<ReusableNode
  chartType="vega-lite"
  title="Cost Timeline"
  vegaSpec={costTimelineSpec}
/>;
```

### Data Helper Functions

The `SpecCreator` also provides data transformation utilities:

```typescript
// Transform cost timeline data for multi-line format
const transformedData = SpecCreator.transformCostTimelineData(rawCostData);
```

This function transforms data from a single record per time period to multiple records per series, which is required for multi-line charts.

## Error Handling

The `SpecCreator` will throw descriptive errors for:

- Unsupported chart types or subtypes
- Missing required parameters
- Invalid data formats

Always wrap chart creation in try-catch blocks:

```typescript
try {
  const chartSpec = SpecCreator.create(chartConfig);
  // Use chartSpec
} catch (error) {
  console.error("Chart creation failed:", error.message);
  // Handle fallback or error state
}
```

## Best Practices

1. **Data Preparation**: Ensure your data matches the expected structure for each chart type
2. **Color Consistency**: Use consistent color schemes across your dashboard
3. **Responsive Design**: Consider different chart dimensions for various container sizes
4. **Performance**: For large datasets, consider data aggregation before chart creation
5. **Accessibility**: Use high-contrast colors and provide meaningful titles and legends

## Custom Chart Implementations

Sometimes you may need a chart variant that isn't covered by existing templates. You can create custom Vega-Lite specifications directly instead of using SpecCreator.

### Example: Cultural Diversity Bar Chart

**Data Structure:**
Uses `CulturalDiversityData[]` in travel2:

```typescript
interface CulturalDiversityData {
  metric: string; // category: "Language Diversity", "Cuisine Variety", etc.
  score: number; // current score value
  maxScore: number; // maximum possible score
  percentage: number; // calculated percentage (score/maxScore * 100)
}

// Example data:
const data = [
  { metric: "Language Diversity", score: 8, maxScore: 10, percentage: 80 },
  { metric: "Cuisine Variety", score: 9, maxScore: 10, percentage: 90 },
  { metric: "Cultural Events", score: 7, maxScore: 10, percentage: 70 },
];
```

Here's an example from travel2 page that creates a custom horizontal bar chart spec:

```typescript
const createCulturalDiversityBarSpec = (data: any[]) => {
  if (!data.length) return null;

  // Transform data to add percentage calculation
  const transformedData = data.map((d) => ({
    metric: d.metric,
    score: d.score,
    maxScore: d.maxScore,
    percentage: (d.score / d.maxScore) * 100,
  }));

  // Create direct Vega-Lite spec
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json" as const,
    width: 200,
    height: 100,
    background: "transparent",
    data: { values: transformedData },
    params: [
      {
        name: "hover_culture_bar",
        select: {
          type: "point" as const,
          on: "pointerover" as const,
          clear: "pointerout" as const,
        },
      },
    ],
    mark: {
      type: "bar" as const,
      cursor: "pointer" as const,
      cornerRadiusEnd: 4,
      height: 12,
    },
    encoding: {
      y: {
        field: "metric",
        type: "nominal" as const,
        sort: { field: "score", order: "descending" as const },
        axis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 10,
          labelLimit: 120,
          title: null,
          grid: false,
          ticks: true,
          domain: true,
        },
      },
      x: {
        field: "percentage",
        type: "quantitative" as const,
        scale: { domain: [0, 100] },
        axis: {
          labelColor: "#888",
          titleColor: "#888",
          labelFontSize: 8,
          grid: true,
          gridColor: "#888",
          gridDash: [2, 2],
          ticks: true,
          domain: true,
          title: null,
          format: ".0f",
        },
      },
      color: { value: "#16a34a" },
      opacity: {
        condition: { param: "hover_culture_bar", value: 1 },
        value: 0.7,
      },
      tooltip: [
        { field: "metric", type: "nominal" as const, title: "Cultural Metric" },
        {
          field: "score",
          type: "quantitative" as const,
          title: "Score",
          format: ".0f",
        },
        {
          field: "maxScore",
          type: "quantitative" as const,
          title: "Max Score",
          format: ".0f",
        },
      ],
    },
    config: {
      background: "transparent",
      view: { stroke: null },
    },
  };

  return spec;
};
```

### When to Use Custom Implementations

Consider creating custom specs when:

- You need specific data transformations not covered by templates
- You require unique interaction patterns
- You need specialized mark styling
- You want to optimize for specific use cases

### Integration with Templates

You can mix custom charts with template-generated charts in the same dashboard. Both approaches return standard Vega-Lite specifications that work with `ReusableNode`.

## Template Customization

If you need a chart variant not covered by existing templates:

1. **Extend Existing Templates**: Modify template files to add new parameters
2. **Create New Templates**: Follow the existing pattern in the `vegaTemplates` folder
3. **Add to SpecCreator**: Include your template in the factory class
4. **Update Interfaces**: Add new parameters to `types/interfaces.ts`
5. **Document**: Update this guide with your new template

For complex customizations, you can also extend existing templates or create custom Vega-Lite specifications directly.
