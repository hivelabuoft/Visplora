# VegaTemplates Chart Organization Plan

## Overview

This document defines the chart templates that will be created in the `vegaTemplates` folder. Each template will be customizable with parameters for data, styling, and interactions.

## Chart Templates to Create

## Chart Templates to Create

### **1. Line Charts**

**File**: `line/`

- `multiLineLabelSpec` - Multi-series line chart with labels displayed when hovered. Example Implementation: costTimelineChartSpec from file travelVegeSpecs.ts
- `multiLineSpec` - Single line chart with tooltips displayed hovered. Example Implementation:

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": { "url": "data/stocks.csv" },
  "width": 400,
  "height": 300,
  "encoding": { "x": { "field": "date", "type": "temporal" } },
  "layer": [
    {
      "encoding": {
        "color": { "field": "symbol", "type": "nominal" },
        "y": { "field": "price", "type": "quantitative" }
      },
      "layer": [
        { "mark": "line" },
        {
          "transform": [{ "filter": { "param": "hover", "empty": false } }],
          "mark": "point"
        }
      ]
    },
    {
      "transform": [
        { "pivot": "symbol", "value": "price", "groupby": ["date"] }
      ],
      "mark": "rule",
      "encoding": {
        "opacity": {
          "condition": { "value": 0.3, "param": "hover", "empty": false },
          "value": 0
        },
        "tooltip": [
          { "field": "AAPL", "type": "quantitative" },
          { "field": "AMZN", "type": "quantitative" },
          { "field": "GOOG", "type": "quantitative" },
          { "field": "IBM", "type": "quantitative" },
          { "field": "MSFT", "type": "quantitative" }
        ]
      },
      "params": [
        {
          "name": "hover",
          "select": {
            "type": "point",
            "fields": ["date"],
            "nearest": true,
            "on": "pointerover",
            "clear": "pointerout"
          }
        }
      ]
    }
  ]
}
```

**Parameters**:

- `data`: Array of data objects
- `xField`: X-axis field name (temporal/ordinal)
- `yField`: Y-axis field name (quantitative)
- `seriesField`: Optional field for multiple series
- `colors`: Color scheme array
- `width`, `height`: Chart dimensions
- `xAxisConfig`: X-axis formatting and labels
- `yAxisConfig`: Y-axis formatting and labels
- `tooltip`: Custom tooltip fields
- `legend`: Legend configuration
- `dateFormat`: Date formatting for temporal data
- `yFormat`: Y-axis number formatting (currency, percentage, etc.)

### **2. Bar Charts**

**File**: `bar/`

- `divergingBarSpec` - Horizontal bar chart for regional comparison. Example Implementation: safetyComparisonBarChartSpec from file travelVegaSpecs.ts
- `horizontalBarSpec` - Horizontal bar chart with selection and hover. Example Implementations: (culturalDiversityBarSpec, travelGrowthTrendsSpec)

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "A bar chart with highlighting on hover and selecting on click.",
  "data": {
    "values": [
      { "a": "A", "b": 28 },
      { "a": "B", "b": 55 },
      { "a": "C", "b": 43 },
      { "a": "D", "b": 91 },
      { "a": "E", "b": 81 },
      { "a": "F", "b": 53 },
      { "a": "G", "b": 19 },
      { "a": "H", "b": 87 },
      { "a": "I", "b": 52 }
    ]
  },
  "params": [
    {
      "name": "highlight",
      "select": { "type": "point", "on": "pointerover" }
    },
    { "name": "select", "select": "point" }
  ],
  "mark": {
    "type": "bar",
    "fill": "#4C78A8",
    "stroke": "black",
    "cursor": "pointer"
  },
  "encoding": {
    "x": { "field": "a", "type": "ordinal" },
    "y": { "field": "b", "type": "quantitative" },
    "fillOpacity": {
      "condition": { "param": "select", "value": 1 },
      "value": 0.3
    },
    "strokeWidth": {
      "condition": [
        {
          "param": "select",
          "empty": false,
          "value": 2
        },
        {
          "param": "highlight",
          "empty": false,
          "value": 1
        }
      ],
      "value": 0
    }
  },
  "config": {
    "scale": {
      "bandPaddingInner": 0.2
    }
  }
}
```

**Parameters**:

- `data`: Array of data objects
- `xField`: X-axis field name
- `yField`: Y-axis field name
- `orientation`: 'horizontal' | 'vertical'
- `colors`: Color scheme (single color or array)
- `width`, `height`: Chart dimensions
- `xAxisConfig`: X-axis formatting and labels
- `yAxisConfig`: Y-axis formatting and labels
- `tooltip`: Custom tooltip configuration
- `sort`: Sorting configuration
- `showValues`: Whether to show value labels on bars
- `valueFormat`: Number formatting for values

### **3. Pie Charts**

**File**: `pie/`

- `interactivePieSpec` - Pie chart with basic hover highlights. Example Implementations: reviewsDistributionPieSpec and safetyBreakdownPieSpec

**Parameters**:

- `data`: Array of data objects
- `valueField`: Field containing values for pie slices
- `categoryField`: Field containing category labels
- `colors`: Color scheme array
- `width`, `height`: Chart dimensions
- `innerRadius`: For donut charts (0 for pie)
- `outerRadius`: Outer radius size
- `legend`: Legend configuration
- `tooltip`: Custom tooltip configuration
- `showPercentages`: Whether to show percentages
- `labelStyle`: Label configuration
- `hoverEffects`: Hover interaction configuration

### **4. Scatter Charts**

**File**: `scatter/`

- `bubblePlotScatterSpec` - Scatter plot with bubble sizing and tooltips on hover. Example Implementation: environmentalQualityScatterSpec

**Parameters**:

- `data`: Array of data objects
- `xField`: X-axis field name
- `yField`: Y-axis field name
- `sizeField`: Optional field for bubble sizing
- `colorField`: Optional field for color encoding
- `colors`: Color scheme
- `width`, `height`: Chart dimensions
- `xAxisConfig`: X-axis formatting and labels
- `yAxisConfig`: Y-axis formatting and labels
- `tooltip`: Custom tooltip configuration
- `sizeRange`: Min/max size range for bubbles
- `legend`: Legend configuration for color/size

### **5. Map Charts**

**File**: `map/`

- `worldInteractiveMapSpec` - Interactive world map with country selection. Example Implementation: worldTravelMapSpec

**Parameters**:

- `data`: Geographic data or data to overlay
- `geoData`: Topological/geographic JSON data
- `colors`: Color scheme for data visualization
- `width`, `height`: Chart dimensions
- `projection`: Map projection type
- `selectionEnabled`: Whether countries are clickable
- `tooltip`: Custom tooltip configuration
- `legend`: Legend configuration
- `dataBinding`: How to bind data to geographic features
- `defaultColor`: Default color for regions without data
- `strokeColor`: Border color for geographic features

### **6. Multi-Type Charts**

**File**: `multiType/`

- `barChartWithLineSpec` - A histogram and line chart on the same axis. Example Implementaion: visitorFlowSeasonalChartSpec

**Parameters**:

- `data`: Array of data objects
- `primaryType`: 'bar' | 'line' | 'area'
- `secondaryType`: 'bar' | 'line' | 'area'
- `xField`: X-axis field name
- `yField`: Primary Y-axis field name
- `y2Field`: Secondary Y-axis field name
- `colors`: Color scheme for each chart type
- `width`, `height`: Chart dimensions
- `axes`: Configuration for both Y-axes
- `tooltip`: Custom tooltip configuration
- `legend`: Legend configuration

## Implementation Plan

### Folder Structure

```
vegaTemplates/
├── SpecCreator.tsx                 # Main factory for creating charts
├── types/
│   └── interfaces.ts               # Common interfaces and types
├── line/
│   ├── multiLineLabelSpec.tsx     # Multi-series with labels
│   └── multiLineSpec.tsx          # Single line with tooltips
├── bar/
│   ├── divergingBarSpec.tsx       # Horizontal diverging bars
│   └── horizontalBarSpec.tsx      # Horizontal interactive bars
├── pie/
│   └── interactivePieSpec.tsx     # Interactive pie/donut chart
├── scatter/
│   └── bubblePlotScatterSpec.tsx  # Bubble scatter plot
├── map/
│   └── worldInteractiveMapSpec.tsx # Interactive world map
└── multiType/
    ├── barChartWithLineSpec.tsx   # Bar + line combination
    └── combinedChartSpec.tsx      # General multi-type chart
```

### SpecCreator Interface

```typescript
interface ChartSpec {
  type: "line" | "bar" | "pie" | "scatter" | "map" | "multiType";
  subtype: string;
  data: any[];
  config: ChartConfig;
}

interface ChartConfig {
  dimensions: { width: number; height: number };
  fields: FieldMapping;
  styling: StyleConfig;
  interactions?: InteractionConfig;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
}
```

### Integration with ReusableNode

```typescript
// Usage in ReusableNode
const chartSpec = SpecCreator.create({
  type: "line",
  subtype: "multiLineLabelSpec",
  data: costData,
  config: {
    dimensions: { width: 340, height: 160 },
    fields: { x: "date", y: "cost", series: "series" },
    styling: { colors: ["#1f77b4", "#ff7f0e", "#2ca02c"] },
  },
});
```

## Next Steps

1. ✅ Create this plan document
2. ⏳ Implement SpecCreator.tsx with interfaces
3. ⏳ Create individual chart template files
4. ⏳ Update ReusableNode to use SpecCreator
5. ⏳ Test with travel2 dashboard
