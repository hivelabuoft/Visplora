// Part-to-Whole Chart Templates
// Donut Chart, Pie Chart, Treemap, Sunburst

export interface PartToWholeData {
  [key: string]: any;
  // category field (categorical labels)
  // metric field (numeric values)
}

export interface PartToWholeOptions {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  colors?: string[];
  metricFormat?: string;
  showLabels?: boolean;
  showPercentages?: boolean;
  innerRadius?: number; // for donut charts
}

// Enhanced interfaces for flexible donut chart
export interface DonutChartParams {
  categories: {
    csvName: string;
    columnName: string;
  };
  metric: 'count' | 'share' | 'percentage' | string; // metric type
  dimension?: {
    csvName: string;
    columnName: string;
    filterValue?: string | number; // specific value to filter by
  };
  options?: PartToWholeOptions;
}

// New DonutParams interface for renderDonut function
export type DonutParams = {
  charttitle: string;
  description: string; // New field for chart description
  categories: { csv: string; column: string }; // e.g., { csv: "/dataset/london/ethnicity/Ethnic group.csv", column: "Group" }
  metric: string;                               // e.g., "Count" or "Share"
  dimension?: string;                           // optional: e.g., "Year" or "Crime Type"
  width?: number;                               // Chart width
  height?: number;                              // Chart height
  size?: 'small' | 'medium' | 'large';         // Size configuration
};

// Data source interface - this would be replaced with actual CSV reading logic
export interface DataSource {
  [csvName: string]: any[];
}

// Enhanced Donut Chart Function that handles 2D and 3D data
// Legacy function - now replaced by renderDonutChart in separate file
// export function renderDonutChart(params: DonutChartParams, dataSources: Record<string, any[]>): any {
//   // Implementation moved to renderDonutChart.ts
//   return null;
// }

// Helper function to process data based on metric type
const processDataForDonut = (
  data: any[],
  categoryColumn: string,
  metric: string
): PartToWholeData[] => {
  const grouped: { [key: string]: any[] } = {};
  
  // Group data by category
  data.forEach(row => {
    const category = row[categoryColumn];
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(row);
  });

  // Calculate metric for each category
  return Object.entries(grouped).map(([category, rows]) => {
    let value: number;
    
    switch (metric) {
      case 'count':
        value = rows.length;
        break;
      case 'share':
      case 'percentage':
        value = (rows.length / data.length) * 100;
        break;
      default:
        // Assume it's a column name for sum aggregation
        value = rows.reduce((sum, row) => sum + (parseFloat(row[metric]) || 0), 0);
        break;
    }
    
    return {
      category,
      value,
      originalData: rows // Keep reference to original data for tooltips
    };
  });
};

// Helper function to generate appropriate title
const generateDonutTitle = (params: DonutChartParams): string => {
  const { categories, metric, dimension } = params;
  
  let title = `${categories.columnName} Distribution`;
  
  if (dimension?.filterValue) {
    title += ` (${dimension.columnName}: ${dimension.filterValue})`;
  }
  
  const metricLabel = metric === 'count' ? 'Count' : 
                     metric === 'share' ? 'Share' : 
                     metric === 'percentage' ? 'Percentage' : 
                     metric;
                     
  return `${title} by ${metricLabel}`;
};

// Main renderDonut function - creates interactive donut charts with optional dimension switching
export const renderDonut = (params: DonutParams) => {
  const { charttitle, description, categories, metric, dimension, width, height, size } = params;
  
  // Calculate size-aware dimensions
  const getChartDimensions = () => {
    if (width && height) {
      return { chartWidth: width, chartHeight: height };
    }
    
    // Default dimensions based on size - make dimensions more compact when dimensions are present
    const hasMultipleDimensions = dimension;
    
    switch (size) {
      case 'small':
        return { 
          chartWidth: hasMultipleDimensions ? 90 : 100, 
          chartHeight: hasMultipleDimensions ? 80 : 100 
        };
      case 'medium':
        return { 
          chartWidth: hasMultipleDimensions ? 180 : 200, 
          chartHeight: hasMultipleDimensions ? 160 : 200 
        };
      case 'large':
        return { 
          chartWidth: hasMultipleDimensions ? 250 : 280, 
          chartHeight: hasMultipleDimensions ? 180 : 280 
        };
      default:
        return { 
          chartWidth: hasMultipleDimensions ? 180 : 200, 
          chartHeight: hasMultipleDimensions ? 160 : 200 
        };
    }
  };

  const { chartWidth, chartHeight } = getChartDimensions();
  
  // Calculate inner and outer radius based on chart size
  const getRadii = () => {
    const baseRadius = Math.min(chartWidth, chartHeight) / 2 - 10;
    switch (size) {
      case 'small':
        return { innerRadius: 12, outerRadius: 30 };
      case 'medium':
        return { innerRadius: 40, outerRadius: 85 };
      case 'large':
        return { innerRadius: 55, outerRadius: 100 };
      default:
        return { innerRadius: 40, outerRadius: 85 };
    }
  };

  const { innerRadius, outerRadius } = getRadii();
  
  // Generate placeholder data based on parameters
  // In real implementation, this would read from the CSV files
  const generatePlaceholderData = () => {
    if (dimension) {
      // 3D data with dimension switching (like countryOfBirthPieChartSpec)
      const sampleCategories = ['Anti-social behaviour', 'Violent crime', 'Burglary', 'Vehicle crime', 'Other theft'];
      const sampleDimensions = ['2020', '2021', '2022', '2023'];
      
      const data: { [key: string]: any[] } = {};
      
      sampleDimensions.forEach((dim, dimIndex) => {
        data[dim] = sampleCategories.map((cat, index) => ({
          category: cat,
          value: 150 + (index * 80) + (dimIndex * 20) + Math.floor(Math.random() * 50),
          percentage: 15 + (index * 5) + Math.floor(Math.random() * 10),
          dimension: dim
        }));
      });
      
      return { data, dimensions: sampleDimensions };
    } else {
      // 2D data (like crimePieChartComparisonSpec) - provide concrete values
      return [
        { category: 'Anti-social behaviour', value: 320, percentage: 28.5 },
        { category: 'Violent crime', value: 280, percentage: 24.9 },
        { category: 'Burglary', value: 180, percentage: 16.0 },
        { category: 'Vehicle crime', value: 150, percentage: 13.4 },
        { category: 'Other theft', value: 195, percentage: 17.3 }
      ];
    }
  };

  const result = generatePlaceholderData();

  if (dimension) {
    // Return object with chart spec function and dimensions for 3D switching UI
    const { data, dimensions } = result as { data: { [key: string]: any[] }, dimensions: string[] };
    
    return {
      dimensions,
      getSpec: (selectedDimension: string) => ({
        "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
        "title": {
          "text": charttitle,
          "subtitle": description,
          "fontSize": size === 'small' ? 8 : size === 'medium' ? 14 : 18,
          "subtitleFontSize": size === 'small' ? 6 : size === 'medium' ? 10 : 14,
          "anchor": "start",
          "color": "#333",
          "subtitleColor": "#666"
        },
        "width": chartWidth,
        "height": chartHeight,
        "background": "transparent",
        "layer": [
          {
            "data": {
              "values": data[selectedDimension]
            },
            "params": [
              {
                "name": "hover_donut",
                "select": {
                  "type": "point",
                  "on": "mouseover",
                  "clear": "mouseout"
                }
              }
            ],
            "mark": {
              "type": "arc" as const,
              "innerRadius": innerRadius,
              "outerRadius": outerRadius,
              "cursor": "pointer" as const
            },
            "encoding": {
              "theta": {
                "field": "value",
                "type": "quantitative" as const
              },
              "color": {
                "field": "category",
                "type": "nominal" as const,
                "scale": {
                  "range": ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#1E40AF", "#F59E0B"]
                },
                "legend": {
                  "orient": "right",
                  "titleColor": "#888",
                  "titleFontSize": size === 'small' ? 6 : size === 'medium' ? 10 : 12,
                  "labelColor": "#888",
                  "labelFontSize": size === 'small' ? 5 : size === 'medium' ? 9 : 11,
                  "labelLimit": size === 'small' ? 40 : size === 'medium' ? 120 : 150,
                  "symbolSize": size === 'small' ? 20 : size === 'medium' ? 60 : 80,
                  "title": null
                }
              },
              "stroke": {
                "condition": {
                  "param": "hover_donut",
                  "value": "white"
                },
                "value": "white"
              },
              "strokeWidth": {
                "condition": {
                  "param": "hover_donut",
                  "value": 1
                },
                "value": 0.5
              },
              "opacity": {
                "condition": {
                  "param": "hover_donut",
                  "value": 1
                },
                "value": 0.7
              },
              "tooltip": [
                {
                  "field": "category",
                  "type": "nominal",
                  "title": "Category"
                },
                {
                  "field": "value",
                  "type": "quantitative",
                  "title": "Value",
                  "format": ".0f"
                },
                {
                  "field": "percentage",
                  "type": "quantitative",
                  "title": "Percentage",
                  "format": ".1f"
                }
              ]
            }
          },
          // Center text showing total
          {
            "data": {
              "values": [
                {
                  "text": data[selectedDimension].reduce((sum: number, d: any) => sum + d.value, 0).toLocaleString(),
                  "category": "Total"
                }
              ]
            },
            "mark": {
              "type": "text",
              "align": "center",
              "baseline": "middle",
              "fontSize": size === 'small' ? 8 : size === 'medium' ? 16 : 20,
              "fontWeight": "bold",
              "dy": -4,
              "color": "white"
            },
            "encoding": {
              "text": {
                "field": "text",
                "type": "nominal"
              }
            }
          },
          // Center label
          {
            "data": {
              "values": [
                {
                  "text": selectedDimension
                }
              ]
            },
            "mark": {
              "type": "text",
              "align": "center",
              "baseline": "middle",
              "fontSize": size === 'small' ? 6 : size === 'medium' ? 10 : 12,
              "color": "#9CA3AF",
              "dy": 6
            },
            "encoding": {
              "text": {
                "field": "text",
                "type": "nominal"
              }
            }
          }
        ],
        "config": {
          "background": "transparent",
          "view": {
            "stroke": null
          }
        }
      })
    };
  } else {
    // Return simple 2D donut chart spec with legend
    const data = result as any[];
    return {
      "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
      "title": {
        "text": charttitle,
        "subtitle": description,
        "fontSize": size === 'small' ? 8 : size === 'medium' ? 14 : 18,
        "subtitleFontSize": size === 'small' ? 6 : size === 'medium' ? 10 : 14,
        "anchor": "start",
        "color": "#333",
        "subtitleColor": "#666"
      },
      "width": chartWidth,
      "height": chartHeight,
      "background": "transparent",
      "layer": [
        {
          "data": {
            "values": data
          },
          "params": [
            {
              "name": "hover_donut",
              "select": {
                "type": "point",
                "on": "mouseover",
                "clear": "mouseout"
              }
            }
          ],
          "mark": {
            "type": "arc" as const,
            "innerRadius": innerRadius,
            "outerRadius": outerRadius,
            "cursor": "pointer" as const
          },
          "encoding": {
            "theta": {
              "field": "value",
              "type": "quantitative" as const
            },
            "color": {
              "field": "category",
              "type": "nominal" as const,
              "scale": {
                "range": ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#1E40AF", "#F59E0B"]
              },
              "legend": {
                "orient": "right",
                "titleColor": "#888",
                "titleFontSize": size === 'small' ? 6 : size === 'medium' ? 10 : 12,
                "labelColor": "#888", 
                "labelFontSize": size === 'small' ? 5 : size === 'medium' ? 9 : 11,
                "labelLimit": size === 'small' ? 40 : size === 'medium' ? 120 : 150,
                "symbolSize": size === 'small' ? 20 : size === 'medium' ? 60 : 80,
                "title": null
              }
            },
            "stroke": {
              "condition": {
                "param": "hover_donut",
                "value": "white"
              },
              "value": "white"
            },
            "strokeWidth": {
              "condition": {
                "param": "hover_donut",
                "value": 2
              },
              "value": 1
            },
            "opacity": {
              "condition": {
                "param": "hover_donut",
                "value": 1
              },
              "value": 0.8
            },
            "tooltip": [
              {
                "field": "category",
                "type": "nominal",
                "title": "Category"
              },
              {
                "field": "value",
                "type": "quantitative",
                "title": "Value",
                "format": ".0f"
              },
              {
                "field": "percentage",
                "type": "quantitative",
                "title": "Percentage", 
                "format": ".1f"
              }
            ]
          }
        },
        // Center text showing total
        {
          "data": {
            "values": [
              {
                "text": data.reduce((sum: number, d: any) => sum + d.value, 0).toLocaleString(),
                "category": "Total"
              }
            ]
          },
          "mark": {
            "type": "text",
            "align": "center",
            "baseline": "middle",
            "fontSize": size === 'small' ? 10 : size === 'medium' ? 18 : 24,
            "fontWeight": "bold",
            "dy": -4,
            "color": "white"
          },
          "encoding": {
            "text": {
              "field": "text",
              "type": "nominal"
            }
          }
        },
        // Center label
        {
          "data": {
            "values": [
              {
                "text": "Total"
              }
            ]
          },
          "mark": {
            "type": "text",
            "align": "center",
            "baseline": "middle",
            "fontSize": size === 'small' ? 6 : size === 'medium' ? 10 : 14,
            "color": "#9CA3AF",
            "dy": 6
          },
          "encoding": {
            "text": {
              "field": "text",
              "type": "nominal"
            }
          }
        }
      ],
      "config": {
        "background": "transparent",
        "view": {
          "stroke": null
        }
      }
    };
  }
};

// Original Donut Chart Template (now used internally by renderDonutChart)
export const createDonutChartSpec = (
  data: PartToWholeData[],
  categoryField: string,
  metricField: string,
  options: PartToWholeOptions = {}
) => {
  const {
    title = 'Donut Chart',
    subtitle,
    width = 300,
    height = 300,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B', '#E3F2FA'],
    metricFormat = '.2s',
    showPercentages = true,
    innerRadius = 50
  } = options;

  const totalValue = data.reduce((sum, d) => sum + d[metricField], 0);

  // Enhanced spec with better interactivity for filtered data
  const spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": 14,
      "anchor": "start"
    },
    "data": { "values": data },
    "width": width,
    "height": height,
    "params": [
      { "name": "highlight", "select": { "type": "point", "on": "mouseover" } },
      { "name": "click", "select": { "type": "point", "on": "click" } }
    ],
    "layer": [
      // Main donut with enhanced interactivity
      {
        "mark": {
          "type": "arc",
          "innerRadius": innerRadius,
          "outerRadius": Math.min(width, height) / 2 - 10,
          "stroke": "#FFFFFF",
          "strokeWidth": 2,
          "cursor": "pointer"
        },
        "encoding": {
          "theta": {
            "field": metricField,
            "type": "quantitative"
          },
          "color": {
            "field": categoryField,
            "type": "nominal",
            "title": "Category",
            "scale": { "range": colors },
            "legend": {
              "titleColor": "#2B7A9B",
              "titleFontWeight": 600,
              "labelColor": "#4A6A7B",
              "orient": "right"
            }
          },
          "opacity": {
            "condition": [
              { "param": "highlight", "value": 1.0 },
              { "param": "click", "value": 0.9 }
            ],
            "value": 0.7
          },
          "stroke": {
            "condition": [
              { "param": "highlight", "value": "#1A3C4A" },
              { "param": "click", "value": "#2B7A9B" }
            ],
            "value": "#FFFFFF"
          },
          "strokeWidth": {
            "condition": [
              { "param": "highlight", "value": 3 },
              { "param": "click", "value": 4 }
            ],
            "value": 2
          },
          "tooltip": [
            { "field": categoryField, "type": "nominal", "title": "Category" },
            { "field": metricField, "type": "quantitative", "title": "Value", "format": metricFormat },
            {
              "calculate": `datum.${metricField} / ${totalValue} * 100`,
              "title": "Percentage",
              "format": ".1f"
            }
          ]
        }
      },
      // Center text showing total with dynamic updates
      {
        "data": { "values": [{ "total": totalValue, "label": "Total" }] },
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 18,
          "fontWeight": "bold",
          "color": "#2B7A9B",
          "dy": -8
        },
        "encoding": {
          "text": {
            "field": "total",
            "type": "quantitative",
            "format": metricFormat
          },
          "opacity": {
            "condition": { "param": "highlight", "value": 0.7 },
            "value": 1.0
          }
        }
      },
      {
        "data": { "values": [{ "text": "Total" }] },
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 12,
          "color": "#4A6A7B",
          "dy": 8
        },
        "encoding": {
          "text": { "field": "text", "type": "nominal" },
          "opacity": {
            "condition": { "param": "highlight", "value": 0.7 },
            "value": 1.0
          }
        }
      },
      // Highlighted value display
      {
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 14,
          "fontWeight": "bold",
          "color": "#8B5CF6",
          "dy": -25
        },
        "encoding": {
          "text": {
            "condition": { 
              "param": "highlight", 
              "field": metricField, 
              "type": "quantitative",
              "format": metricFormat
            },
            "value": ""
          },
          "opacity": {
            "condition": { "param": "highlight", "value": 1.0 },
            "value": 0.0
          }
        }
      },
      {
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 10,
          "color": "#8B5CF6",
          "dy": -12
        },
        "encoding": {
          "text": {
            "condition": { 
              "param": "highlight", 
              "field": categoryField, 
              "type": "nominal"
            },
            "value": ""
          },
          "opacity": {
            "condition": { "param": "highlight", "value": 1.0 },
            "value": 0.0
          }
        }
      }
    ]
  };

  return spec;
};

// Pie Chart Template
export const createPieChartSpec = (
  data: PartToWholeData[],
  categoryField: string,
  metricField: string,
  options: PartToWholeOptions = {}
) => {
  const donutSpec = createDonutChartSpec(data, categoryField, metricField, {
    ...options,
    innerRadius: 0 // Convert donut to pie by setting inner radius to 0
  });
  
  // Remove center text layers for pie chart
  donutSpec.layer = [donutSpec.layer[0]];
  
  return donutSpec;
};

// Treemap Template
export interface TreemapData {
  [key: string]: any;
  // category field (for grouping)
  // metric field (for size)
  // parent field (optional for hierarchical data)
}

export const createTreemapSpec = (
  data: TreemapData[],
  categoryField: string,
  metricField: string,
  options: PartToWholeOptions = {},
  parentField?: string
) => {
  const {
    title = 'Treemap',
    subtitle,
    width = 400,
    height = 300,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B', '#E3F2FA'],
    metricFormat = '.2s',
    showLabels = true
  } = options;

  // Prepare data for treemap (nest if parent field is provided)
  const treeData = parentField ? {
    "name": "root",
    "children": data.map(d => ({
      "name": d[categoryField],
      "parent": d[parentField] || "root",
      "value": d[metricField]
    }))
  } : {
    "name": "root",
    "children": data.map(d => ({
      "name": d[categoryField],
      "value": d[metricField]
    }))
  };

  const spec: any = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": 14,
      "anchor": "start"
    },
    "data": { "values": [treeData] },
    "width": width,
    "height": height,
    "transform": [
      {
        "nest": ["name"]
      },
      {
        "treemap": {
          "field": "value",
          "sort": {"field": "value", "order": "descending"},
          "round": true,
          "method": "squarify",
          "padding": 2,
          "size": [{"signal": "width"}, {"signal": "height"}]
        }
      }
    ],
    "mark": {
      "type": "rect",
      "stroke": "#FFFFFF",
      "strokeWidth": 2
    },
    "encoding": {
      "x": {"field": "x0", "type": "quantitative", "axis": null},
      "y": {"field": "y0", "type": "quantitative", "axis": null},
      "x2": {"field": "x1", "type": "quantitative"},
      "y2": {"field": "y1", "type": "quantitative"},
      "color": {
        "field": categoryField,
        "type": "nominal",
        "scale": { "range": colors },
        "legend": {
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelColor": "#4A6A7B"
        }
      },
      "tooltip": [
        { "field": "name", "type": "nominal", "title": "Category" },
        { "field": "value", "type": "quantitative", "title": "Value", "format": metricFormat }
      ]
    }
  };

  // Add text labels if requested
  if (showLabels) {
    spec.layer = [
      { ...spec, "mark": spec.mark },
      {
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 10,
          "color": "#FFFFFF",
          "fontWeight": "bold"
        },
        "encoding": {
          "x": {"field": "x0", "type": "quantitative"},
          "y": {"field": "y0", "type": "quantitative"},
          "x2": {"field": "x1", "type": "quantitative"},
          "y2": {"field": "y1", "type": "quantitative"},
          "text": {"field": "name", "type": "nominal"}
        }
      }
    ];
    delete spec.mark;
    delete spec.encoding;
  }

  return spec;
};

// Sunburst Chart Template (Radial Treemap)
export const createSunburstSpec = (
  data: TreemapData[],
  categoryField: string,
  metricField: string,
  options: PartToWholeOptions = {},
  parentField?: string
) => {
  const {
    title = 'Sunburst Chart',
    subtitle,
    width = 300,
    height = 300,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B', '#E3F2FA'],
    metricFormat = '.2s'
  } = options;

  // For Vega-Lite, sunburst is implemented as nested arcs
  // This is a simplified version - full sunburst would require custom transforms
  
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": 14,
      "anchor": "start"
    },
    "data": { "values": data },
    "width": width,
    "height": height,
    "params": [
      { "name": "highlight", "select": { "type": "point", "on": "mouseover" } }
    ],
    "mark": {
      "type": "arc",
      "innerRadius": 40,
      "outerRadius": 80,
      "stroke": "#FFFFFF",
      "strokeWidth": 2
    },
    "encoding": {
      "theta": {
        "field": metricField,
        "type": "quantitative"
      },
      "radius": {
        "field": metricField,
        "type": "quantitative",
        "scale": {
          "type": "sqrt",
          "range": [40, 100]
        }
      },
      "color": {
        "field": categoryField,
        "type": "nominal",
        "scale": { "range": colors },
        "legend": {
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelColor": "#4A6A7B"
        }
      },
      "opacity": {
        "condition": { "param": "highlight", "value": 1.0 },
        "value": 0.8
      },
      "tooltip": [
        { "field": categoryField, "type": "nominal", "title": "Category" },
        ...(parentField ? [{ "field": parentField, "type": "nominal", "title": "Parent" }] : []),
        { "field": metricField, "type": "quantitative", "title": "Value", "format": metricFormat }
      ]
    }
  };
};

// Waffle Chart Template (Grid of squares)
export const createWaffleChartSpec = (
  data: PartToWholeData[],
  categoryField: string,
  metricField: string,
  options: PartToWholeOptions & { gridSize?: number; cellSize?: number } = {}
) => {
  const {
    title = 'Waffle Chart',
    subtitle,
    width = 400,
    height = 300,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B', '#E3F2FA'],
    gridSize = 10,
    cellSize = 20
  } = options;

  // Transform data to grid format
  const totalValue = data.reduce((sum, d) => sum + d[metricField], 0);
  const totalCells = gridSize * gridSize;
  
  const gridData: any[] = [];
  let cellIndex = 0;
  
  data.forEach(d => {
    const cellCount = Math.round((d[metricField] / totalValue) * totalCells);
    for (let i = 0; i < cellCount; i++) {
      gridData.push({
        x: cellIndex % gridSize,
        y: Math.floor(cellIndex / gridSize),
        category: d[categoryField],
        value: d[metricField]
      });
      cellIndex++;
    }
  });

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": 14,
      "anchor": "start"
    },
    "data": { "values": gridData },
    "width": width,
    "height": height,
    "params": [
      { "name": "highlight", "select": { "type": "point", "on": "mouseover" } }
    ],
    "mark": {
      "type": "square",
      "size": cellSize * cellSize,
      "stroke": "#FFFFFF",
      "strokeWidth": 1
    },
    "encoding": {
      "x": {
        "field": "x",
        "type": "ordinal",
        "axis": null
      },
      "y": {
        "field": "y",
        "type": "ordinal",
        "axis": null
      },
      "color": {
        "field": "category",
        "type": "nominal",
        "title": "Category",
        "scale": { "range": colors },
        "legend": {
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelColor": "#4A6A7B"
        }
      },
      "opacity": {
        "condition": { "param": "highlight", "value": 1.0 },
        "value": 0.8
      },
      "tooltip": [
        { "field": "category", "type": "nominal", "title": "Category" },
        { "field": "value", "type": "quantitative", "title": "Value" }
      ]
    }
  };
};
