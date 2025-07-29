import { ChartTemplate } from "../types/visualization";

// Sample Vega-Lite chart templates
export const chartTemplates: ChartTemplate[] = [
  {
    id: "bar-chart-1",
    name: "Simple Bar Chart",
    category: "bar",
    thumbnailUrl: "",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      description: "A simple bar chart with categorical data",
      data: {
        values: [
          { category: "A", value: 28 },
          { category: "B", value: 55 },
          { category: "C", value: 43 },
          { category: "D", value: 91 },
          { category: "E", value: 81 },
          { category: "F", value: 53 },
        ]
      },
      mark: "bar",
      encoding: {
        x: { field: "category", type: "nominal", axis: { labelAngle: 0 } },
        y: { field: "value", type: "quantitative" },
        color: { field: "category", type: "nominal", legend: null }
      },
      width: 300,
      height: 200
    }
  },
  {
    id: "line-chart-1",
    name: "Simple Line Chart",
    category: "line",
    thumbnailUrl: "",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      description: "A simple line chart with time series data",
      data: {
        values: [
          { date: "2023-01", value: 42 },
          { date: "2023-02", value: 55 },
          { date: "2023-03", value: 48 },
          { date: "2023-04", value: 62 },
          { date: "2023-05", value: 75 },
          { date: "2023-06", value: 83 }
        ]
      },
      mark: "line",
      encoding: {
        x: { field: "date", type: "temporal", timeUnit: "yearmonth" },
        y: { field: "value", type: "quantitative" },
        color: { value: "#4c78a8" }
      },
      width: 300,
      height: 200
    }
  },
  {
    id: "scatter-plot-1",
    name: "Scatter Plot",
    category: "scatter",
    thumbnailUrl: "",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      description: "A scatter plot showing the relationship between two variables",
      data: {
        values: [
          { x: 10, y: 12, category: "A" },
          { x: 23, y: 42, category: "A" },
          { x: 35, y: 35, category: "A" },
          { x: 45, y: 50, category: "B" },
          { x: 60, y: 65, category: "B" },
          { x: 78, y: 82, category: "B" }
        ]
      },
      mark: "point",
      encoding: {
        x: { field: "x", type: "quantitative" },
        y: { field: "y", type: "quantitative" },
        color: { field: "category", type: "nominal" },
        size: { value: 100 }
      },
      width: 300,
      height: 200
    }
  },
  {
    id: "area-chart-1",
    name: "Area Chart",
    category: "area",
    thumbnailUrl: "",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      description: "A simple area chart with time series data",
      data: {
        values: [
          { date: "2023-01", value: 42 },
          { date: "2023-02", value: 55 },
          { date: "2023-03", value: 48 },
          { date: "2023-04", value: 62 },
          { date: "2023-05", value: 75 },
          { date: "2023-06", value: 83 }
        ]
      },
      mark: { type: "area", color: "#4c78a8" },
      encoding: {
        x: { field: "date", type: "temporal", timeUnit: "yearmonth" },
        y: { field: "value", type: "quantitative" }
      },
      width: 300,
      height: 200
    }
  },
  {
    id: "pie-chart-1",
    name: "Pie Chart",
    category: "pie",
    thumbnailUrl: "",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      description: "A simple pie chart with categorical data",
      data: {
        values: [
          { category: "A", value: 28 },
          { category: "B", value: 55 },
          { category: "C", value: 43 },
          { category: "D", value: 91 }
        ]
      },
      mark: "arc",
      encoding: {
        theta: { field: "value", type: "quantitative" },
        color: { field: "category", type: "nominal" }
      },
      width: 200,
      height: 200
    }
  },
  {
    id: "heatmap-1",
    name: "Heatmap",
    category: "other",
    thumbnailUrl: "",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      description: "A heatmap showing values across two dimensions",
      data: {
        values: [
          { x: 1, y: "A", heat: 42 },
          { x: 1, y: "B", heat: 28 },
          { x: 1, y: "C", heat: 85 },
          { x: 2, y: "A", heat: 56 },
          { x: 2, y: "B", heat: 39 },
          { x: 2, y: "C", heat: 67 },
          { x: 3, y: "A", heat: 30 },
          { x: 3, y: "B", heat: 91 },
          { x: 3, y: "C", heat: 48 }
        ]
      },
      mark: "rect",
      encoding: {
        x: { field: "x", type: "ordinal" },
        y: { field: "y", type: "ordinal" },
        color: { field: "heat", type: "quantitative" }
      },
      width: 300,
      height: 200
    }
  }
];
