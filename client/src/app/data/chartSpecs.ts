import { VegaLiteSpec } from '../types/interfaces';

/**
 * Vega-Lite chart specifications for HR Dashboard visualizations
 */

export const createDepartmentPieChart = (): VegaLiteSpec => ({
  width: 300,
  height: 200,
  mark: { type: "arc" as const, innerRadius: 40, outerRadius: 80 },
  encoding: {
    theta: { field: "total", type: "quantitative" as const },
    color: { 
      field: "department", 
      type: "nominal" as const,
      scale: { range: ["#8B4513", "#D2691E", "#F4A460"] }
    },
    tooltip: [
      { field: "department", type: "nominal" as const },
      { field: "total", type: "quantitative" as const },
      { field: "attrition", type: "quantitative" as const }
    ]
  }
});

export const createGenderDonutChart = (): VegaLiteSpec => ({
  width: 120,
  height: 120,
  mark: { type: "arc" as const, innerRadius: 30, outerRadius: 60 },
  encoding: {
    theta: { field: "count", type: "quantitative" as const },
    color: { 
      field: "gender", 
      type: "nominal" as const,
      scale: { range: ["#FFA500", "#FFD700"] }
    },
    tooltip: [
      { field: "gender", type: "nominal" as const },
      { field: "count", type: "quantitative" as const },
      { field: "percentage", type: "nominal" as const }
    ]
  }
});

export const createAgeGroupBarChart = (): VegaLiteSpec => ({
  width: 200,
  height: 150,
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
    color: { value: "#FFA500" },
    tooltip: [
      { field: "ageGroup", type: "ordinal" as const },
      { field: "count", type: "quantitative" as const }
    ]
  }
});

export const createAttritionTrendChart = (): VegaLiteSpec => ({
  width: 800,
  height: 200,
  mark: { type: "bar" as const, color: "#FFA500" },
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

export const createEducationBarChart = (): VegaLiteSpec => ({
  width: 250,
  height: 150,
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
    color: { value: "#FFA500" },
    tooltip: [
      { field: "education", type: "ordinal" as const },
      { field: "count", type: "quantitative" as const }
    ]
  }
});
