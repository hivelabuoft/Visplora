# VegaTemplates Chart Organization Plan

## Overview

This document defines all chart templates available in the `vegaTemplates` folder using the SpecCreator system. Each template is highly reusable with standardized configuration interfaces for data, styling, and interactions.

## ✅ SpecCreator System - IMPLEMENTED

The SpecCreator provides a unified interface for all chart types:

```typescript
SpecCreator.create({
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'map' | 'multiType',
  subtype: 'specificImplementation',
  data: transformedData,
  config: { dimensions, fields, styling, interactions, legend, tooltip }
});
```

## 🔄 Field Flexibility - IMPORTANT!

**All chart types are field-agnostic!** The field names in examples (like `date`, `cost`, `series`) are just examples. You can use ANY field names from your data:

```typescript
// ✅ Works with travel data
fields: { x: 'date', y: 'cost', series: 'series' }

// ✅ Works with sales data  
fields: { x: 'month', y: 'revenue', series: 'product' }

// ✅ Works with any data
fields: { x: 'yourXField', y: 'yourYField', series: 'yourSeriesField' }
```

**The chart cares about data types, not field names:**
- **Temporal**: Date/time fields (x: 'date', x: 'timestamp', x: 'month')
- **Quantitative**: Numbers (y: 'cost', y: 'revenue', y: 'count')  
- **Nominal**: Categories (series: 'type', color: 'category', series: 'department')

---

## Chart Types & Subtypes

### **1. Line Charts** (`type: 'line'`)

#### **✅ `multiLineLabelSpec`** - Multi-series line chart with hover labels
*Used for: Time series, trends, multiple data series comparison*

**Data Requirements:**
- **X Field**: Any temporal/ordinal field
- **Y Field**: Any quantitative field  
- **Series Field**: Any nominal field for line grouping

**Example Data Formats:**
```typescript
// Travel cost example
[
  { date: '2024-01-01', cost: 150, series: 'Hotel Cost' },
  { date: '2024-01-01', cost: 45, series: 'Meal Cost' },
  // ...
]

// Sales revenue example  
[
  { month: 'Jan', revenue: 50000, product: 'Product A' },
  { month: 'Jan', revenue: 32000, product: 'Product B' },
  // ...
]

// Any temporal data
[
  { timestamp: '2024-Q1', value: 1250, category: 'Category 1' },
  { timestamp: '2024-Q1', value: 980, category: 'Category 2' },
  // ...
]
```

**Example Usage:**
```typescript
return SpecCreator.create({
  type: 'line',
  subtype: 'multiLineLabelSpec',
  data: yourData,
  config: {
    dimensions: { width: 340, height: 160 },
    fields: { 
      x: 'yourTimeField',      // Any temporal field
      y: 'yourValueField',     // Any quantitative field  
      series: 'yourGroupField' // Any nominal field
    },
    styling: {
      colors: ['#aea630ff', '#3b82f6', '#16a34a'],
      axes: {
        xAxis: { format: '%Y-%m', labelAngle: -45 },
        yAxis: { format: '$,.0f', grid: true }
      }
    }
  }
});
```

#### **✅ `lineChartWithMean`** - Line chart with mean reference line
*Used for: Showing data trends against averages, benchmarking*

**Subtype**: `lineChartWithMean`

**Example Usage (Line with Mean):**
```typescript
return SpecCreator.create({
  type: 'line',
  subtype: 'lineChartWithMean',
  data: salesData,
  config: {
    dimensions: { width: 340, height: 160 },
    fields: { 
      x: 'month',              // Any temporal field
      y: 'revenue',            // Any quantitative field  
      series: 'productLine'    // Any nominal field
    },
    styling: {
      colors: ['#3b82f6', '#16a34a'],
      meanValue: 50000,        // Show average revenue line
      meanColor: '#ff6b6b',
      meanLabel: 'Monthly Average',
      showMeanLabel: true
    }
  }
});
```

#### **✅ `lineChartWithThreshold`** - Line chart with threshold reference line  
*Used for: Goal tracking, performance against targets*

**Subtype**: `lineChartWithThreshold`

**Example Usage (Line with Threshold):**
```typescript
return SpecCreator.create({
  type: 'line',
  subtype: 'lineChartWithThreshold',
  data: performanceData,
  config: {
    dimensions: { width: 340, height: 160 },
    fields: { 
      x: 'week',               // Any temporal field
      y: 'kpis',               // Any quantitative field  
      series: 'department'     // Any nominal field
    },
    styling: {
      colors: ['#8b5cf6', '#06b6d4'],
      thresholdValue: 85,      // Target performance line
      thresholdColor: '#22c55e',
      thresholdLabel: 'Target KPI',
      showThresholdLabel: true
    }
  }
});
```

---

### **2. Bar Charts** (`type: 'bar'`)

#### **✅ `horizontalBarSpec`** - Standard horizontal bar chart
*Used for: Rankings, comparisons, categorical data*

**Data Requirements:**
- **Category Field**: Any nominal field
- **Value Field**: Any quantitative field

**Example Data Formats:**
```typescript
// City rankings
[
  { city: 'New York', visitors: 12500000 },
  { city: 'Los Angeles', visitors: 8900000 },
  // ...
]

// Product sales
[
  { product: 'iPhone', sales: 50000000 },
  { product: 'MacBook', sales: 12000000 },
  // ...
]

// Any categorical data
[
  { department: 'Engineering', budget: 2500000 },
  { department: 'Marketing', budget: 1200000 },
  // ...
]
```

**Example Usage:**
```typescript
return SpecCreator.create({
  type: 'bar',
  subtype: 'horizontalBarSpec',
  data: yourData,
  config: {
    fields: { 
      category: 'yourCategoryField',  // Any nominal field
      value: 'yourValueField'         // Any quantitative field
    },
    styling: {
      colors: ['#94a3b8', '#3b82f6', '#16a34a']
    }
  }
});
```

#### **✅ `barChartWithMean`** - Horizontal bar chart with mean reference line
*Used for: Comparing categories against average performance*

**Subtype**: `barChartWithMean`

**Example Usage (Bar with Mean):**
```typescript
return SpecCreator.create({
  type: 'bar',
  subtype: 'barChartWithMean',
  data: salesByRegionData,
  config: {
    dimensions: { width: 300, height: 200 },
    fields: {
      category: 'region',      // Any nominal field
      value: 'sales'           // Any quantitative field
    },
    styling: {
      colors: ['#3b82f6', '#16a34a'],
      meanValue: 75000,        // Average sales line
      meanColor: '#ff6b6b',
      meanLabel: 'National Average',
      showMeanLabel: true
    }
  }
});
```

#### **✅ `barChartWithThreshold`** - Horizontal bar chart with threshold line  
*Used for: Goal tracking for categorical data*

**Subtype**: `barChartWithThreshold`

**Example Usage (Bar with Threshold):**
```typescript
return SpecCreator.create({
  type: 'bar',
  subtype: 'barChartWithThreshold',
  data: teamPerformanceData,
  config: {
    dimensions: { width: 300, height: 200 },
    fields: {
      category: 'team',        // Any nominal field
      value: 'score'           // Any quantitative field
    },
    styling: {
      colors: ['#8b5cf6', '#06b6d4'],
      thresholdValue: 90,      // Performance target
      thresholdColor: '#22c55e',
      thresholdLabel: 'Target Score',
      showThresholdLabel: true
    }
  }
});
```

#### **✅ `divergingBarSpec`** - Horizontal diverging bar chart
*Used for: Positive/negative comparisons, risk assessments*

**Data Requirements:**
- **Category Field**: Any nominal field
- **Positive Value Field**: Quantitative field for right side
- **Negative Value Field**: Quantitative field for left side

**Example Data Formats:**
```typescript
// Risk assessment  
[
  { 
    region: 'North America',
    crime_positive: 35,      // Right side (positive)
    political_negative: 15,  // Left side (negative)
  },
  // ...
]

// Performance vs benchmark
[
  {
    department: 'Sales',
    performance_positive: 15,  // Above benchmark  
    benchmark_negative: 8      // Below benchmark
  },
  // ...
]
```

---

### **3. Pie Charts** (`type: 'pie'`)

#### **✅ `interactivePieSpec`** - Interactive donut/pie chart
*Used for: Distributions, category breakdowns, part-to-whole relationships*

**Data Requirements:**
- **Category Field**: Any nominal field
- **Value Field**: Any quantitative field

**Example Data Formats:**
```typescript
// Review ratings
[
  { rating: '5 Stars', count: 1250 },
  { rating: '4 Stars', count: 890 },
  // ...
]

// Market share
[
  { company: 'Apple', marketShare: 35.2 },
  { company: 'Samsung', marketShare: 22.1 },
  // ...
]

// Budget allocation
[
  { department: 'Engineering', budget: 2500000 },
  { department: 'Marketing', budget: 1200000 },
  // ...
]
```

---

### **4. Scatter Charts** (`type: 'scatter'`)

#### **✅ `bubblePlotScatterSpec`** - Bubble scatter plot with size and color encoding
*Used for: Multi-dimensional data, correlations, bubble charts*

**Data Requirements:**
- **X Field**: Any quantitative field
- **Y Field**: Any quantitative field  
- **Size Field**: Any quantitative field (optional)
- **Color Field**: Any quantitative field (optional)

**Example Data Formats:**
```typescript
// Environmental data
[
  { 
    city: 'Tokyo',
    greenSpace: 35.2,        // X-axis
    airQuality: 92,          // Y-axis
    population: 13500000,    // Size encoding
    income: 45000            // Color encoding
  },
  // ...
]

// Business metrics
[
  {
    company: 'TechCorp',
    revenue: 1200000,        // X-axis  
    profit: 180000,          // Y-axis
    employees: 450,          // Size encoding
    satisfaction: 4.2        // Color encoding
  },
  // ...
]
```

---

### **5. Map Charts** (`type: 'map'`)

#### **✅ `worldInteractiveMapSpec`** - Interactive world map with country selection
*Used for: Geographic data, country selection, regional analysis*

**Special Usage:**
```typescript
// Uses specialized function, not SpecCreator
return createWorldTravelMapVegaSpec({
  width: 800,
  height: 350,
  background: "#7ec2ddff",
  options: { 
    selectableCountries: ['United States', 'Canada', 'Mexico'],
    selectedCountries: ['United States']  // Pre-selected countries
  }
});
```

---

### **6. Multi-Type Charts** (`type: 'multiType'`)

#### **✅ `barChartWithLineSpec`** - Combined bar and line chart (dual Y-axes)
*Used for: Seasonal data with dual metrics, volume + rate comparisons*

**Data Requirements:**
- **X Field**: Any ordinal/temporal field
- **Bar Field**: Quantitative field (left Y-axis)
- **Line Field**: Quantitative field (right Y-axis)
- **Color Field**: Nominal field (optional)

**Example Data Formats:**
```typescript
// Visitor data with occupancy
[
  { 
    month: 'January',
    arrivals: 125000,         // Bar values (left axis)
    occupancyRate: 78.5,      // Line values (right axis)
    season: 'Low'             // Color encoding
  },
  // ...
]

// Sales with conversion rate
[
  {
    quarter: 'Q1 2024',
    sales: 2500000,           // Bar values
    conversionRate: 12.5,     // Line values  
    region: 'North'           // Color encoding
  },
  // ...
]
```

#### **✅ `multiTypeWithMean`** - Bar+Line chart with mean reference line
*Used for: Comparing combined metrics against averages*

**Subtype**: `multiTypeWithMean`

**Example Usage (Multi-type with Mean):**
```typescript
return SpecCreator.create({
  type: 'multiType',
  subtype: 'multiTypeWithMean',
  data: seasonalBusinessData,
  config: {
    dimensions: { width: 390, height: 160 },
    fields: {
      x: 'quarter',
      y: 'revenue',            // Bar values (left axis)
      series: 'profitMargin',  // Line values (right axis)
      color: 'businessUnit'
    },
    styling: {
      colors: ['#94a3b8', '#3b82f6'],
      lineColor: '#8b5cf6',
      meanValue: 85000,        // Average revenue reference
      meanField: 'bar',        // Apply to bar axis (revenue)
      meanColor: '#ff6b6b',
      meanLabel: 'Avg Revenue',
      showMeanLabel: true
    }
  }
});
```

#### **✅ `multiTypeWithThreshold`** - Bar+Line chart with threshold line
*Used for: Goal tracking across multiple metrics*

**Subtype**: `multiTypeWithThreshold`

**Example Usage (Multi-type with Threshold):**
```typescript
return SpecCreator.create({
  type: 'multiType',
  subtype: 'multiTypeWithThreshold',
  data: performanceTrackingData,
  config: {
    dimensions: { width: 390, height: 160 },
    fields: {
      x: 'month',
      y: 'volume',             // Bar values (left axis)
      series: 'efficiency',    // Line values (right axis)
      color: 'department'
    },
    styling: {
      colors: ['#94a3b8', '#3b82f6'],
      lineColor: '#8b5cf6',
      thresholdValue: 95,      // Efficiency target
      thresholdField: 'line',  // Apply to line axis (efficiency)
      thresholdColor: '#22c55e',
      thresholdLabel: 'Efficiency Target',
      showThresholdLabel: true
    }
  }
});
```

#### **✅ `multiType_same_y_diff_type`** - Bar+Line chart with shared Y-axis *(NEW!)*
*Used for: Comparing different measures on the same scale*

**Data Requirements:**
- **X Field**: Any ordinal field  
- **Bar Field**: Quantitative field for bars
- **Line Field**: Quantitative field for line (same scale as bars)

**Example Data Formats:**
```typescript
// City vs Global comparison
[
  {
    month: 'January',
    cityArrivals: 125000,     // Bar values
    globalAverage: 110000,    // Line values (same scale!)
    season: 'Low'
  },
  // ...
]

// Department vs Company average
[
  {
    quarter: 'Q1',
    departmentSales: 500000,  // Bar values
    companyAverage: 450000,   // Line values (same scale!)
    department: 'Engineering'
  },
  // ...
]
```

**Key Feature:** Both bar and line use the same Y-axis scale for direct comparison!

---

## Enhanced Styling Options

### **Mean & Threshold Lines** (Available on compatible chart types)

```typescript
styling: {
  // Mean line options
  meanValue: 75,                    // Fixed value or calculated from data
  meanField: 'bar',                 // For multi-type: 'bar' or 'line'
  meanColor: '#ff6b6b',             // Line color
  meanStrokeWidth: 2,               // Line thickness
  meanStrokeDash: [4, 4],           // Dash pattern [dash, gap]
  meanLabel: 'Average',             // Label text
  showMeanLabel: true,              // Show/hide label
  
  // Threshold line options  
  thresholdValue: 100,              // Fixed value
  thresholdField: 'line',           // For multi-type: 'bar' or 'line'
  thresholdColor: '#22c55e',        // Line color
  thresholdStrokeWidth: 3,          // Line thickness  
  thresholdStrokeDash: [2, 6],      // Dash pattern
  thresholdLabel: 'Target',         // Label text
  showThresholdLabel: true,         // Show/hide label
  
  // Multi-type specific
  lineColor: '#8b5cf6',             // Line color in multi-type charts
  lineWidth: 2,                     // Line thickness
  cornerRadius: 2,                  // Bar corner radius
  colorDomain: ['Low', 'High']      // Custom color domain
}
```

---

## Implementation Status

### **✅ Implemented & Working**
- **SpecCreator System**: Complete factory pattern with type safety
- **Line Charts**: `multiLineLabelSpec`, `lineChartWithMean`, `lineChartWithThreshold`  
- **Bar Charts**: `horizontalBarSpec`, `barChartWithMean`, `barChartWithThreshold`, `divergingBarSpec`
- **Pie Charts**: `interactivePieSpec` with hover effects
- **Scatter Charts**: `bubblePlotScatterSpec` with size/color encoding  
- **Map Charts**: `worldInteractiveMapSpec`, `countryDetailMapSpec`
- **Multi-Type**: `barChartWithLineSpec`, `multiTypeWithMean`, `multiTypeWithThreshold`, `multiType_same_y_diff_type`

### ❌ **Not Yet Implemented**  
- **Line Charts**: `multiLineSpec` (basic multi-line without labels)

---

## Key Benefits of SpecCreator System

### **🔄 Highly Reusable & Field-Agnostic**
- Works with ANY data structure
- Field names don't matter - only data types
- Consistent interface across all chart types

### **🎨 Flexible Styling**
- Comprehensive styling options for all chart elements
- Mean and threshold line support across chart types
- Easy to maintain visual consistency

### **⚡ Easy to Use**
```typescript
// Simple, consistent usage pattern for ANY data
const chartSpec = SpecCreator.create({
  type: 'bar',
  subtype: 'horizontalBarSpec',
  data: myData,
  config: {
    fields: { 
      category: 'myCategory',  // Use YOUR field names
      value: 'myValue'         // Use YOUR field names
    }
  }
});
```

### **� Enhanced with Reference Lines**
- Mean lines for showing averages
- Threshold lines for goal tracking  
- Works on line, bar, and multi-type charts
- Flexible positioning (left/right axis for multi-type)

---

## Complete Chart Type Reference

| **Type** | **Subtypes Available** | **Best For** |
|----------|------------------------|--------------|
| `line` | `multiLineLabelSpec`, `lineChartWithMean`, `lineChartWithThreshold` | Time series, trends, comparisons over time |
| `bar` | `horizontalBarSpec`, `barChartWithMean`, `barChartWithThreshold`, `divergingBarSpec` | Rankings, categorical comparisons, positive/negative data |
| `pie` | `interactivePieSpec` | Distributions, part-to-whole relationships |
| `scatter` | `bubblePlotScatterSpec` | Correlations, multi-dimensional data |
| `map` | `worldInteractiveMapSpec` | Geographic data, regional analysis |
| `multiType` | `barChartWithLineSpec`, `multiTypeWithMean`, `multiTypeWithThreshold`, `multiType_same_y_diff_type` | Dual metrics, complex comparisons |

---

## Folder Structure

```
vegaTemplates/
├── SpecCreator.tsx                      # ✅ Main factory class
├── types/
│   └── interfaces.ts                    # ✅ TypeScript interfaces
├── line/
│   ├── multiLineLabelSpec.tsx          # ✅ Multi-series with labels
│   ├── multiLineLabelWithMeanSpec.tsx  # ✅ + Mean line
│   └── multiLineLabelWithThresholdSpec.tsx # ✅ + Threshold line
├── bar/
│   ├── horizontalBarSpec.tsx           # ✅ Standard horizontal bars
│   ├── horizontalBarWithMeanSpec.tsx   # ✅ + Mean line
│   ├── horizontalBarWithThresholdSpec.tsx # ✅ + Threshold line
│   └── divergingBarSpec.tsx            # ✅ Diverging bars
├── pie/
│   └── interactivePieSpec.tsx          # ✅ Interactive pie/donut
├── scatter/
│   └── bubblePlotScatterSpec.tsx       # ✅ Bubble scatter plot
├── map/
│   └── worldInteractiveMapSpec.tsx     # ✅ Interactive world map
└── multiType/
    ├── barChartWithLineSpec.tsx        # ✅ Bar + line (dual axis)
    ├── barChartWithLineAndMeanSpec.tsx # ✅ + Mean line
    ├── barChartWithLineAndThresholdSpec.tsx # ✅ + Threshold line  
    └── multiTypeSameYAxisSpec.tsx      # ✅ Bar + line (same axis)
```

---

## Usage Examples in Travel2 Dashboard

See `/src/app/travel2/page.tsx` for complete implementation examples including:
- Cost Timeline with mean line (line chart)
- Travel Growth Trends (horizontal bar)
- Safety Breakdown (pie chart)  
- Environmental Quality (bubble scatter)
- Visitor Flow with shared axis (multi-type same Y)
- World Travel Map (interactive map)

Each example demonstrates complete data flow: raw data → transformation → SpecCreator → ReusableNode.