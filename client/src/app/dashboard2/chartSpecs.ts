import { VegaLiteSpec } from '../types/interfaces';

/**
 * Vega-Lite chart specifications for HR Dashboard visualizations
 */

export const createDepartmentRetentionChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 100,
  height: 70,
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
      { field: "count", type: "quantitative" as const, title: "Count" },
      { field: "percentage", type: "nominal" as const, title: "Percentage" }
    ]
  }
});

export const createGenderAttritionDonutChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 100,
  height: 120,
  padding: 0,
  mark: { type: "arc" as const, innerRadius: 25, outerRadius: 45 },
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
      { field: "count", type: "quantitative" as const, title: "Count" },
      { field: "percentage", type: "nominal" as const, title: "Percentage" }
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
    color: { 
      field: "type", 
      type: "nominal" as const,
      scale: { 
        domain: ["retention", "attrition"],
        range: ["#1b2a3a", "#ef9f56"]
      },
      legend: null,
    },
    tooltip: [
      { field: "ageGroup", type: "ordinal" as const, title: "Age Group" },
      { field: "count", type: "quantitative" as const, title: "Employee Count" }
    ]
  }
});

export const createDistanceFromHomeChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  height: 250,
  width: 300,
  padding: 0,
  mark: { type: "bar" as const },
  encoding: {
    x: { 
      field: "interval", 
      type: "ordinal" as const,
      axis: { title: "Distance From Home (km)", labelAngle: -45 },
      sort: { field: "interval", order: "ascending" }
    },
    y: { 
      field: "count",
      type: "quantitative" as const, 
      axis: { title: "Employee Count" } 
    },
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
      { field: "interval", type: "ordinal" as const, title: "Distance From Home (km)" },
      { field: "count", type: "quantitative" as const, title: "Employee Count" },
    ]
  }
});

export const createEducationBarChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  width: 200,
  height: 160,
  padding: 0,
  mark: "bar" as const,
  encoding: {
    x: { 
      field: "education", 
      type: "ordinal" as const, 
      axis: { title: null },
      sort: { field: "count", order: "descending" }
    },
    y: { 
      field: "count", 
      type: "quantitative" as const, 
      axis: { title: null }
    },
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
      { field: "education", type: "ordinal" as const, title: "Education Level" },
      { field: "count", type: "quantitative" as const, title: "Employee Count" },
    ]
  }
});

export const createEducationFieldBarChart = (): VegaLiteSpec => ({
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  width: 200,
  height: 160,
  padding: 0,
  mark: "bar" as const,
  encoding: {
    x: { 
      field: "field", 
      type: "ordinal" as const, 
      axis: { title: null },
      sort: { field: "count", order: "descending" }
    },
    y: { 
      field: "count", 
      type: "quantitative" as const, 
      axis: { title: null }
    },
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
      { field: "field", type: "ordinal" as const, title: "Education Field" },
      { field: "count", type: "quantitative" as const, title: "Employee Count" },
    ]
  }
});
