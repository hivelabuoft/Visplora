import { VegaLiteSpec } from '../types/interfaces';

/**
 * Vega-Lite chart specifications for HR Dashboard visualizations
 */

export const createDepartmentRetentionChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 100,
  height: 100,
  padding: 0,
  mark: { type: "arc" as const, innerRadius: 20, outerRadius: 35 },
  encoding: {
    theta: { field: "count", type: "quantitative" as const },
    color: { 
      field: "type", 
      type: "nominal" as const,
      scale: { 
        domain: ["retention", "attrition"],
        range: ["#1b2a3a", "#ef9f56"]
      },
      legend: null
    },
    tooltip: [
      { field: "type", type: "nominal" as const, title: "Type" },
      { field: "count", type: "quantitative" as const, title: "Count" },
      { field: "percentage", type: "nominal" as const, title: "Percentage" }
    ]
  }
});

export const createGenderDonutChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 120,
  height: 120,
  padding: 0,
  mark: { type: "arc" as const, innerRadius: 30, outerRadius: 60 },
  encoding: {
    theta: { field: "count", type: "quantitative" as const },
    color: { 
      field: "gender", 
      type: "nominal" as const,
      scale: { range: ["#ef9f56", "#FFD700"] }
    },
    tooltip: [
      { field: "gender", type: "nominal" as const },
      { field: "count", type: "quantitative" as const },
      { field: "percentage", type: "nominal" as const }
    ]
  }
});

export const createAgeGroupBarChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 200,
  height: 150,
  padding: 0,
  mark: "bar" as const,
  encoding: {
    x: { 
      field: "ageGroup", 
      type: "ordinal" as const, 
      axis: { title: null },
      sort: ["< 25", "25-34", "35-44", "45-55", "> 55"]
    },
    y: { 
      field: "count", 
      type: "quantitative" as const, 
      axis: { title: null } 
    },
    color: { value: "#ef9f56" },
    tooltip: [
      { field: "ageGroup", type: "ordinal" as const },
      { field: "count", type: "quantitative" as const }
    ]
  }
});

export const createAttritionTrendChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 800,
  height: 200,
  padding: 0,
  mark: { type: "bar" as const, color: "#ef9f56" },
  encoding: {
    x: { 
      field: "month", 
      type: "ordinal" as const, 
      axis: { title: null, labelAngle: -45 }
    },
    y: { 
      field: "attrition", 
      type: "quantitative" as const, 
      axis: { title: "Attrition Count" } 
    },
    tooltip: [
      { field: "month", type: "ordinal" as const },
      { field: "attrition", type: "quantitative" as const }
    ]
  }
});

export const createDistanceFromHomeChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  height: 250,
  width: 350,
  padding: 0,
  mark: { 
    type: "area" as const, color: "#ef9f56", 
    point: { size: 50, color: "#ef9f56"} 
  },
  encoding: {
    x: { 
      field: "distance", 
      type: "quantitative" as const,
      axis: { title: "Distance From Home (km)", labelAngle: -45 }
    },
    y: { 
      field: "count",
      type: "quantitative" as const, 
      axis: { title: "Employee Count" } 
    },
    tooltip: [
      { field: "distance", type: "quantitative" as const, title: "Distance From Home" },
      { field: "count", type: "quantitative" as const, title: "Employee Count" }
    ]
  }
});

export const createEducationBarChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 250,
  height: 150,
  padding: 0,
  mark: "bar" as const,
  encoding: {
    y: { 
      field: "education", 
      type: "ordinal" as const, 
      axis: { title: null },
      sort: { field: "count", order: "descending" }
    },
    x: { 
      field: "count", 
      type: "quantitative" as const, 
      axis: { title: null }
    },
    color: { value: "#ef9f56" },
    tooltip: [
      { field: "education", type: "ordinal" as const },
      { field: "count", type: "quantitative" as const }
    ]
  }
});
