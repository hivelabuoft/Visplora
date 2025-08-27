// Line Chart Template - Change Over Time
// Required slots: time, metric
// Optional slots: series

export interface LineChartData {
  [key: string]: any;
  // time field (date, year, quarter, month)
  // metric field (numeric value)
  // series field (optional grouping)
}

export interface LineChartOptions {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  colors?: string[];
  timeFormat?: string;
  metricFormat?: string;
  showPoints?: boolean;
  interpolation?: 'linear' | 'monotone' | 'step';
}

export const createLineChartSpec = (
  data: LineChartData[],
  timeField: string,
  metricField: string,
  options: LineChartOptions = {},
  seriesField?: string
) => {
  const {
    title = 'Line Chart',
    subtitle,
    width = 400,
    height = 280,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B'],
    timeFormat = '%Y',
    metricFormat = '.2s',
    showPoints = true,
    interpolation = 'monotone'
  } = options;

  const spec: any = {
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
      { "name": "select", "select": "point" }
    ],
    "mark": {
      "type": "line",
      "strokeWidth": 3,
      "interpolate": interpolation,
      ...(showPoints && {
        "point": {
          "size": 60,
          "filled": true,
          "fill": "#FFFFFF",
          "stroke": colors[0],
          "strokeWidth": 2
        }
      })
    },
    "encoding": {
      "x": {
        "field": timeField,
        "type": "temporal",
        "title": "Time",
        "axis": {
          "grid": true,
          "gridColor": "#E5E7EB",
          "gridOpacity": 0.5,
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "format": timeFormat
        }
      },
      "y": {
        "field": metricField,
        "type": "quantitative",
        "title": "Value",
        "axis": {
          "grid": true,
          "gridColor": "#E5E7EB",
          "gridOpacity": 0.5,
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "format": metricFormat
        }
      },
      "tooltip": [
        { "field": timeField, "type": "temporal", "title": "Time" },
        { "field": metricField, "type": "quantitative", "title": "Value", "format": metricFormat }
      ]
    }
  };

  // Add series encoding if series field is provided
  if (seriesField) {
    spec.encoding.color = {
      "field": seriesField,
      "type": "nominal",
      "title": "Series",
      "scale": { "range": colors },
      "legend": {
        "titleColor": "#2B7A9B",
        "titleFontWeight": 600,
        "labelColor": "#4A6A7B"
      }
    };
    spec.encoding.tooltip.unshift({
      "field": seriesField,
      "type": "nominal",
      "title": "Series"
    });
  }

  return spec;
};

// Area Chart Template - Change Over Time
export const createAreaChartSpec = (
  data: LineChartData[],
  timeField: string,
  metricField: string,
  options: LineChartOptions = {},
  seriesField?: string
) => {
  const spec = createLineChartSpec(data, timeField, metricField, options, seriesField);
  
  // Convert to area chart
  spec.mark = {
    "type": "area",
    "opacity": 0.7,
    "stroke": "#2B7A9B",
    "strokeWidth": 2,
    "interpolate": options.interpolation || 'monotone'
  };

  // Add stacking if series field is provided
  if (seriesField) {
    spec.encoding.y.stack = "zero";
  }

  return spec;
};

// Small Multiples Line Chart Template
export interface SmallMultiplesLineOptions extends LineChartOptions {
  columns?: number;
  facetTitleFontSize?: number;
}

export const createSmallMultiplesLineSpec = (
  data: LineChartData[],
  timeField: string,
  metricField: string,
  facetField: string,
  options: SmallMultiplesLineOptions = {}
) => {
  const {
    title = 'Small Multiples Line Chart',
    width = 120,
    height = 80,
    columns = 3,
    facetTitleFontSize = 10,
    ...restOptions
  } = options;

  const baseSpec = createLineChartSpec(data, timeField, metricField, {
    ...restOptions,
    width,
    height,
    title: undefined // Remove title from individual charts
  });

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      "fontSize": 14,
      "anchor": "start"
    },
    "data": { "values": data },
    "facet": {
      "field": facetField,
      "type": "nominal",
      "columns": columns,
      "title": null,
      "header": {
        "labelFontSize": facetTitleFontSize,
        "labelColor": "#2B7A9B",
        "labelFontWeight": 600
      }
    },
    "spec": {
      ...baseSpec,
      "data": undefined, // Remove data from spec since it's in the parent
      "title": undefined
    }
  };
};

// Slope Chart Template
export interface SlopeChartData {
  entity: string;
  time: string | number;
  metric: number;
}

export const createSlopeChartSpec = (
  data: SlopeChartData[],
  entityField: string = 'entity',
  timeField: string = 'time',
  metricField: string = 'metric',
  options: LineChartOptions = {}
) => {
  const {
    title = 'Slope Chart',
    width = 400,
    height = 300,
    colors = ['#2B7A9B'],
    metricFormat = '.2s'
  } = options;

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      "fontSize": 14,
      "anchor": "start"
    },
    "data": { "values": data },
    "width": width,
    "height": height,
    "mark": {
      "type": "line",
      "strokeWidth": 2
    },
    "encoding": {
      "x": {
        "field": timeField,
        "type": "ordinal",
        "title": "Time Period",
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600
        }
      },
      "y": {
        "field": metricField,
        "type": "quantitative",
        "title": "Value",
        "axis": {
          "grid": true,
          "gridColor": "#E5E7EB",
          "gridOpacity": 0.5,
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "format": metricFormat
        }
      },
      "color": {
        "field": entityField,
        "type": "nominal",
        "scale": { "range": colors },
        "legend": {
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelColor": "#4A6A7B"
        }
      },
      "tooltip": [
        { "field": entityField, "type": "nominal", "title": "Entity" },
        { "field": timeField, "type": "ordinal", "title": "Time" },
        { "field": metricField, "type": "quantitative", "title": "Value", "format": metricFormat }
      ]
    }
  };
};

// Combo Bar-Line Chart Template
export interface ComboChartData {
  [key: string]: any;
  // x_axis field
  // metric_bar field (for bars)
  // metric_line field (for line)
  // series field (optional)
}

export const createComboBarLineSpec = (
  data: ComboChartData[],
  xField: string,
  barMetricField: string,
  lineMetricField: string,
  options: LineChartOptions = {},
  seriesField?: string
) => {
  const {
    title = 'Combo Bar-Line Chart',
    width = 400,
    height = 280,
    colors = ['#2B7A9B', '#8B5CF6']
  } = options;

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      "fontSize": 14,
      "anchor": "start"
    },
    "data": { "values": data },
    "width": width,
    "height": height,
    "resolve": {
      "scale": { "y": "independent" }
    },
    "layer": [
      {
        "mark": {
          "type": "bar",
          "opacity": 0.7,
          "color": colors[0]
        },
        "encoding": {
          "x": {
            "field": xField,
            "type": "nominal",
            "title": "Category",
            "axis": {
              "labelColor": "#4A6A7B",
              "titleColor": "#2B7A9B",
              "titleFontWeight": 600
            }
          },
          "y": {
            "field": barMetricField,
            "type": "quantitative",
            "title": "Bar Metric",
            "axis": {
              "grid": true,
              "gridColor": "#E5E7EB",
              "gridOpacity": 0.5,
              "labelColor": "#4A6A7B",
              "titleColor": colors[0],
              "titleFontWeight": 600
            }
          }
        }
      },
      {
        "mark": {
          "type": "line",
          "strokeWidth": 3,
          "color": colors[1],
          "point": {
            "size": 60,
            "filled": true,
            "fill": "#FFFFFF",
            "stroke": colors[1],
            "strokeWidth": 2
          }
        },
        "encoding": {
          "x": {
            "field": xField,
            "type": "nominal"
          },
          "y": {
            "field": lineMetricField,
            "type": "quantitative",
            "title": "Line Metric",
            "axis": {
              "titleColor": colors[1],
              "titleFontWeight": 600,
              "labelColor": "#4A6A7B"
            }
          }
        }
      }
    ]
  };
};

// New LineParams interface for renderLine function
export type LineParams = {
  charttitle: string;
  description: string;                        // Chart description
  categories: { csv: string; column: string }; // e.g., { csv: "/dataset/london/time/Year.csv", column: "Year" }
  metric: string;                             // e.g., "Count" or "Value"
  dimension?: string;                         // optional: e.g., "Category" or "Crime Type"
  width?: number;                             // Chart width
  height?: number;                            // Chart height
  size?: 'small' | 'medium' | 'large';       // Size configuration
};

// Multi-Line Chart Parameters interface
export type MultiLineParams = {
  charttitle: string;
  description: string;                        // Chart description
  categories: { csv: string; column: string }; // e.g., { csv: "/dataset/london/time/Year.csv", column: "Year" }
  metric: string;                             // e.g., "Count" or "Value"
  seriesField: string;                        // e.g., "Crime Type" or "Borough"
  dimension?: string;                         // optional: e.g., "Comparison Type"
  width?: number;                             // Chart width
  height?: number;                            // Chart height
  size?: 'small' | 'medium' | 'large';       // Size configuration
};

// Combo Chart Parameters interface
export type ComboParams = {
  charttitle: string;
  description: string;                        // Chart description
  categories: { csv: string; column: string }; // e.g., { csv: "/dataset/london/categories/Quarter.csv", column: "Quarter" }
  barMetric: string;                          // e.g., "Volume" or "Count"
  lineMetric: string;                         // e.g., "Rate" or "Percentage"
  dimension?: string;                         // optional: e.g., "Analysis Type"
  width?: number;                             // Chart width
  height?: number;                            // Chart height
  size?: 'small' | 'medium' | 'large';       // Size configuration
};

// Main renderLine function - creates interactive line charts with optional dimension switching
export const renderLine = (params: LineParams) => {
  const { charttitle, description, categories, metric, dimension, width, height, size } = params;
  
  // Calculate size-aware dimensions
  const getChartDimensions = () => {
    if (width && height) {
      return { chartWidth: width, chartHeight: height };
    }
    
    // Default dimensions based on size - make height smaller when dimensions are present for better fit
    const hasMultipleDimensions = dimension;
    
    switch (size) {
      case 'small':
        return { 
          chartWidth: 120, 
          chartHeight: hasMultipleDimensions ? 50 : 60 
        };
      case 'medium':
        return { 
          chartWidth: 280, 
          chartHeight: hasMultipleDimensions ? 100 : 120 
        };
      case 'large':
        return { 
          chartWidth: 400, 
          chartHeight: hasMultipleDimensions ? 150 : 180 
        };
      default:
        return { 
          chartWidth: 280, 
          chartHeight: hasMultipleDimensions ? 100 : 120 
        };
    }
  };

  const { chartWidth, chartHeight } = getChartDimensions();
  
  // Generate placeholder data based on parameters
  // In real implementation, this would read from the CSV files
  const generatePlaceholderData = () => {
    if (dimension) {
      // 3D data with dimension switching
      const sampleTimePoints = ['2020', '2021', '2022', '2023'];
      const sampleDimensions = ['Anti-social behaviour', 'Burglary', 'Vehicle crime', 'Violent crime'];
      
      const data: { [key: string]: any[] } = {};
      
      sampleDimensions.forEach((dim, dimIndex) => {
        data[dim] = sampleTimePoints.map((time, index) => ({
          time: time,
          value: Math.floor(Math.random() * 200) + 300 + (dimIndex * 100) + (index * 25),
          dimension: dim
        }));
      });
      
      return { data, dimensions: sampleDimensions };
    } else {
      // 2D data (simple time series) - provide concrete values
      return [
        { time: '2020', value: 450 },
        { time: '2021', value: 520 },
        { time: '2022', value: 580 },
        { time: '2023', value: 620 }
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
        "data": {
          "values": data[selectedDimension]
        },
        "layer": [
          {
            "encoding": {
              "x": {
                "field": "time",
                "type": "ordinal" as const,
                "axis": {
                  "labelColor": "#888",
                  "titleColor": "#888",
                  "labelFontSize": size === 'small' ? 6 : 8,
                  "labelAngle": -45,
                  "grid": false,
                  "ticks": true,
                  "domain": true,
                  "title": null
                }
              },
              "y": {
                "field": "value",
                "type": "quantitative" as const,
                "axis": {
                  "labelColor": "#888",
                  "titleColor": "#888",
                  "labelFontSize": size === 'small' ? 6 : 8,
                  "gridColor": "#888",
                  "gridDash": [2, 2],
                  "grid": true,
                  "ticks": true,
                  "domain": true,
                  "title": null,
                  "format": ".0s"
                }
              },
              "color": {
                "value": "#8B5CF6"
              }
            },
            "layer": [
              {
                "mark": {
                  "type": "line" as const,
                  "strokeWidth": size === 'small' ? 2 : size === 'medium' ? 3 : 4,
                  "cursor": "pointer" as const
                }
              },
              {
                "params": [{
                  "name": "label",
                  "select": {
                    "type": "point" as const,
                    "encodings": ["x"] as ("x")[],
                    "nearest": true,
                    "on": "pointerover" as const
                  }
                }],
                "mark": {
                  "type": "point" as const,
                  "size": size === 'small' ? 30 : size === 'medium' ? 60 : 100,
                  "cursor": "pointer" as const
                },
                "encoding": {
                  "opacity": {
                    "condition": {
                      "param": "label",
                      "empty": false,
                      "value": 1
                    },
                    "value": 0
                  },
                  "tooltip": [
                    {
                      "field": "time",
                      "type": "ordinal",
                      "title": "Time"
                    },
                    {
                      "field": "value",
                      "type": "quantitative",
                      "title": "Value",
                      "format": ".0f"
                    },
                    {
                      "field": "dimension",
                      "type": "nominal",
                      "title": "Category"
                    }
                  ]
                }
              }
            ]
          },
          {
            "transform": [{"filter": {"param": "label", "empty": false}}],
            "layer": [
              {
                "mark": {"type": "rule" as const, "color": "#666", "strokeWidth": 1},
                "encoding": {
                  "x": {"type": "ordinal" as const, "field": "time", "aggregate": "min" as const}
                }
              },
              {
                "encoding": {
                  "text": {"type": "quantitative" as const, "field": "value", "format": ".2s"},
                  "x": {"type": "ordinal" as const, "field": "time"},
                  "y": {"type": "quantitative" as const, "field": "value"}
                },
                "layer": [
                  {
                    "mark": {
                      "type": "text" as const,
                      "stroke": "transparent",
                      "strokeWidth": 3,
                      "align": "left" as const,
                      "dx": 8,
                      "dy": -8,
                      "fontSize": size === 'small' ? 8 : size === 'medium' ? 10 : 12,
                      "fontWeight": "bold" as const
                    }
                  },
                  {
                    "mark": {
                      "type": "text" as const,
                      "align": "left" as const,
                      "dx": 8,
                      "dy": -8,
                      "fontSize": size === 'small' ? 8 : size === 'medium' ? 10 : 12,
                      "fontWeight": "bold" as const,
                      "color": "#8B5CF6"
                    }
                  }
                ]
              }
            ]
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
    // Return simple 2D line chart spec
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
      "data": {
        "values": data
      },
      "layer": [
        {
          "encoding": {
            "x": {
              "field": "time",
              "type": "ordinal" as const,
              "axis": {
                "labelColor": "#888",
                "titleColor": "#888",
                "labelFontSize": size === 'small' ? 6 : 8,
                "labelAngle": -45,
                "grid": false,
                "ticks": true,
                "domain": true,
                "title": null,
                "values": ["2020", "2021", "2022", "2023"]
              }
            },
            "y": {
              "field": "value",
              "type": "quantitative" as const,
              "axis": {
                "labelColor": "#888",
                "titleColor": "#888",
                "labelFontSize": size === 'small' ? 6 : 8,
                "gridColor": "#888",
                "gridDash": [2, 2],
                "grid": true,
                "ticks": true,
                "domain": true,
                "title": null,
                "format": ".0s"
              }
            },
            "color": {
              "value": "#8B5CF6"
            }
          },
          "layer": [
            {
              "mark": {
                "type": "line" as const,
                "strokeWidth": size === 'small' ? 2 : size === 'medium' ? 3 : 4,
                "cursor": "pointer" as const
              }
            },
            {
              "params": [{
                "name": "label",
                "select": {
                  "type": "point" as const,
                  "encodings": ["x"] as ("x")[],
                  "nearest": true,
                  "on": "pointerover" as const
                }
              }],
              "mark": {
                "type": "point" as const,
                "size": size === 'small' ? 30 : size === 'medium' ? 60 : 100,
                "cursor": "pointer" as const
              },
              "encoding": {
                "opacity": {
                  "condition": {
                    "param": "label",
                    "empty": false,
                    "value": 1
                  },
                  "value": 0
                },
                "tooltip": [
                  {
                    "field": "time",
                    "type": "ordinal",
                    "title": "Time"
                  },
                  {
                    "field": "value",
                    "type": "quantitative",
                    "title": "Value",
                    "format": ".0f"
                  }
                ]
              }
            }
          ]
        },
        {
          "transform": [{"filter": {"param": "label", "empty": false}}],
          "layer": [
            {
              "mark": {"type": "rule" as const, "color": "#666", "strokeWidth": 1},
              "encoding": {
                "x": {"type": "ordinal" as const, "field": "time", "aggregate": "min" as const}
              }
            },
            {
              "encoding": {
                "text": {"type": "quantitative" as const, "field": "value", "format": ".2s"},
                "x": {"type": "ordinal" as const, "field": "time"},
                "y": {"type": "quantitative" as const, "field": "value"}
              },
              "layer": [
                {
                  "mark": {
                    "type": "text" as const,
                    "stroke": "transparent",
                    "strokeWidth": 3,
                    "align": "left" as const,
                    "dx": 8,
                    "dy": -8,
                    "fontSize": size === 'small' ? 8 : size === 'medium' ? 10 : 12,
                    "fontWeight": "bold" as const
                  }
                },
                {
                  "mark": {
                    "type": "text" as const,
                    "align": "left" as const,
                    "dx": 8,
                    "dy": -8,
                    "fontSize": size === 'small' ? 8 : size === 'medium' ? 10 : 12,
                    "fontWeight": "bold" as const,
                    "color": "#8B5CF6"
                  }
                }
              ]
            }
          ]
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

// Multi-Line Chart render function - creates interactive multi-line charts with series
export const renderMultiLine = (params: MultiLineParams) => {
  const { charttitle, description, categories, metric, seriesField, dimension, width, height, size } = params;
  
  // Calculate size-aware dimensions
  const getChartDimensions = () => {
    if (width && height) {
      return { chartWidth: width, chartHeight: height };
    }
    
    // Default dimensions based on size - make height smaller when dimensions are present for better fit
    const hasMultipleDimensions = dimension;
    
    switch (size) {
      case 'small':
        return { 
          chartWidth: 120, 
          chartHeight: hasMultipleDimensions ? 50 : 60 
        };
      case 'medium':
        return { 
          chartWidth: 280, 
          chartHeight: hasMultipleDimensions ? 100 : 120 
        };
      case 'large':
        return { 
          chartWidth: 400, 
          chartHeight: hasMultipleDimensions ? 150 : 180 
        };
      default:
        return { 
          chartWidth: 280, 
          chartHeight: hasMultipleDimensions ? 100 : 120 
        };
    }
  };

  const { chartWidth, chartHeight } = getChartDimensions();
  
  // Generate placeholder data for multi-line chart
  const generatePlaceholderData = () => {
    if (dimension) {
      // 3D data with dimension switching
      const sampleTimePoints = ['2020', '2021', '2022', '2023'];
      const dimensionTypes = {
        'Crime Type': ['Anti-social behaviour', 'Burglary', 'Vehicle crime', 'Violent crime'],
        'Borough Comparison': ['Camden', 'Westminster', 'Islington', 'Hackney'],
        'Age Groups': ['18-25', '26-35', '36-45', '46-55'],
        'Income Levels': ['Low Income', 'Middle Income', 'High Income', 'Very High Income']
      };
      
      const sampleDimensions = Object.keys(dimensionTypes);
      const data: { [key: string]: any[] } = {};
      
      sampleDimensions.forEach((dim) => {
        const series = dimensionTypes[dim as keyof typeof dimensionTypes];
        const timeSeriesData: any[] = [];
        
        series.forEach((seriesName, seriesIndex) => {
          sampleTimePoints.forEach((time, timeIndex) => {
            timeSeriesData.push({
              time: time,
              value: 200 + (seriesIndex * 150) + (timeIndex * 50) + Math.floor(Math.random() * 100),
              series: seriesName,
              dimension: dim
            });
          });
        });
        
        data[dim] = timeSeriesData;
      });
      
      return { data, dimensions: sampleDimensions };
    } else {
      // 2D data (multi-series without dimension switching)
      const sampleTimePoints = ['2020', '2021', '2022', '2023'];
      const sampleSeries = ['Series A', 'Series B', 'Series C'];
      const data: any[] = [];
      
      sampleSeries.forEach((seriesName, seriesIndex) => {
        sampleTimePoints.forEach((time, timeIndex) => {
          data.push({
            time: time,
            value: 300 + (seriesIndex * 100) + (timeIndex * 40),
            series: seriesName
          });
        });
      });
      
      return data;
    }
  };

  const result = generatePlaceholderData();
  const colors = ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#1E40AF", "#F59E0B"];

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
        "data": {
          "values": data[selectedDimension]
        },
        "encoding": {
          "x": {
            "field": "time",
            "type": "ordinal" as const,
            "axis": {
              "labelColor": "#888",
              "titleColor": "#888",
              "labelFontSize": size === 'small' ? 6 : 8,
              "labelAngle": -45,
              "grid": false,
              "ticks": true,
              "domain": true,
              "title": null
            }
          },
          "y": {
            "field": "value",
            "type": "quantitative" as const,
            "axis": {
              "labelColor": "#888",
              "titleColor": "#888",
              "labelFontSize": size === 'small' ? 6 : 8,
              "gridColor": "#888",
              "gridDash": [2, 2],
              "grid": true,
              "ticks": true,
              "domain": true,
              "title": null,
              "format": ".0s"
            }
          },
          "color": {
            "field": "series",
            "type": "nominal" as const,
            "scale": {
              "range": colors
            },
            "legend": {
              "orient": "top",
              "titleColor": "#888",
              "titleFontSize": size === 'small' ? 6 : size === 'medium' ? 10 : 12,
              "labelColor": "#888", 
              "labelFontSize": size === 'small' ? 5 : size === 'medium' ? 9 : 11,
              "labelLimit": size === 'small' ? 40 : size === 'medium' ? 80 : 120,
              "symbolSize": size === 'small' ? 20 : size === 'medium' ? 60 : 80,
              "title": null,
              "offset": 5
            }
          }
        },
        "layer": [
          {
            "mark": {
              "type": "line" as const,
              "strokeWidth": size === 'small' ? 2 : size === 'medium' ? 3 : 4,
              "cursor": "pointer" as const,
              "point": {
                "size": size === 'small' ? 20 : size === 'medium' ? 40 : 60,
                "filled": true
              }
            }
          },
          {
            "params": [{
              "name": "label",
              "select": {
                "type": "point" as const,
                "encodings": ["x"] as ("x")[],
                "nearest": true,
                "on": "pointerover" as const
              }
            }],
            "mark": {
              "type": "point" as const,
              "size": size === 'small' ? 40 : size === 'medium' ? 80 : 120,
              "cursor": "pointer" as const
            },
            "encoding": {
              "opacity": {
                "condition": {
                  "param": "label",
                  "empty": false,
                  "value": 1
                },
                "value": 0
              },
              "tooltip": [
                {
                  "field": "time",
                  "type": "ordinal",
                  "title": "Time"
                },
                {
                  "field": "value",
                  "type": "quantitative",
                  "title": "Value",
                  "format": ".0f"
                },
                {
                  "field": "series",
                  "type": "nominal",
                  "title": "Series"
                },
                {
                  "field": "dimension",
                  "type": "nominal",
                  "title": "Category"
                }
              ]
            }
          },
          {
            "transform": [{"filter": {"param": "label", "empty": false}}],
            "layer": [
              {
                "mark": {"type": "rule" as const, "color": "#666", "strokeWidth": 1},
                "encoding": {
                  "x": {"type": "ordinal" as const, "field": "time", "aggregate": "min" as const}
                }
              },
              {
                "encoding": {
                  "text": {"type": "quantitative" as const, "field": "value", "format": ".2s"},
                  "x": {"type": "ordinal" as const, "field": "time"},
                  "y": {"type": "quantitative" as const, "field": "value"},
                  "color": {
                    "field": "series",
                    "type": "nominal" as const,
                    "scale": {
                      "range": colors
                    },
                    "legend": null
                  }
                },
                "layer": [
                  {
                    "mark": {
                      "type": "text" as const,
                      "stroke": "transparent",
                      "strokeWidth": 3,
                      "align": "left" as const,
                      "dx": 8,
                      "dy": -8,
                      "fontSize": size === 'small' ? 8 : size === 'medium' ? 10 : 12,
                      "fontWeight": "bold" as const
                    }
                  },
                  {
                    "mark": {
                      "type": "text" as const,
                      "align": "left" as const,
                      "dx": 8,
                      "dy": -8,
                      "fontSize": size === 'small' ? 8 : size === 'medium' ? 10 : 12,
                      "fontWeight": "bold" as const
                    }
                  }
                ]
              }
            ]
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
    // Return simple 2D multi-line chart spec
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
      "data": {
        "values": data
      },
      "encoding": {
        "x": {
          "field": "time",
          "type": "ordinal" as const,
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "labelFontSize": size === 'small' ? 6 : 8,
            "labelAngle": -45,
            "grid": false,
            "ticks": true,
            "domain": true,
            "title": null,
            "values": ["2020", "2021", "2022", "2023"]
          }
        },
        "y": {
          "field": "value",
          "type": "quantitative" as const,
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "labelFontSize": size === 'small' ? 6 : 8,
            "gridColor": "#888",
            "gridDash": [2, 2],
            "grid": true,
            "ticks": true,
            "domain": true,
            "title": null,
            "format": ".0s"
          }
        },
        "color": {
          "field": "series",
          "type": "nominal" as const,
          "scale": {
            "range": colors
          },
          "legend": {
            "orient": "top",
            "titleColor": "#888",
            "titleFontSize": size === 'small' ? 6 : size === 'medium' ? 10 : 12,
            "labelColor": "#888", 
            "labelFontSize": size === 'small' ? 5 : size === 'medium' ? 9 : 11,
            "labelLimit": size === 'small' ? 40 : size === 'medium' ? 80 : 120,
            "symbolSize": size === 'small' ? 20 : size === 'medium' ? 60 : 80,
            "title": null,
            "offset": 5
          }
        }
      },
      "layer": [
        {
          "mark": {
            "type": "line" as const,
            "strokeWidth": size === 'small' ? 2 : size === 'medium' ? 3 : 4,
            "cursor": "pointer" as const,
            "point": {
              "size": size === 'small' ? 20 : size === 'medium' ? 40 : 60,
              "filled": true
            }
          }
        },
        {
          "params": [{
            "name": "label",
            "select": {
              "type": "point" as const,
              "encodings": ["x"] as ("x")[],
              "nearest": true,
              "on": "pointerover" as const
            }
          }],
          "mark": {
            "type": "point" as const,
            "size": size === 'small' ? 40 : size === 'medium' ? 80 : 120,
            "cursor": "pointer" as const
          },
          "encoding": {
            "opacity": {
              "condition": {
                "param": "label",
                "empty": false,
                "value": 1
              },
              "value": 0
            },
            "tooltip": [
              {
                "field": "time",
                "type": "ordinal",
                "title": "Time"
              },
              {
                "field": "value",
                "type": "quantitative",
                "title": "Value",
                "format": ".0f"
              },
              {
                "field": "series",
                "type": "nominal",
                "title": "Series"
              }
            ]
          }
        },
        {
          "transform": [{"filter": {"param": "label", "empty": false}}],
          "layer": [
            {
              "mark": {"type": "rule" as const, "color": "#666", "strokeWidth": 1},
              "encoding": {
                "x": {"type": "ordinal" as const, "field": "time", "aggregate": "min" as const}
              }
            },
            {
              "encoding": {
                "text": {"type": "quantitative" as const, "field": "value", "format": ".2s"},
                "x": {"type": "ordinal" as const, "field": "time"},
                "y": {"type": "quantitative" as const, "field": "value"},
                "color": {
                  "field": "series",
                  "type": "nominal" as const,
                  "scale": {
                    "range": colors
                  },
                  "legend": null
                }
              },
              "layer": [
                {
                  "mark": {
                    "type": "text" as const,
                    "stroke": "transparent",
                    "strokeWidth": 3,
                    "align": "left" as const,
                    "dx": 8,
                    "dy": -8,
                    "fontSize": size === 'small' ? 8 : size === 'medium' ? 10 : 12,
                    "fontWeight": "bold" as const
                  }
                },
                {
                  "mark": {
                    "type": "text" as const,
                    "align": "left" as const,
                    "dx": 8,
                    "dy": -8,
                    "fontSize": size === 'small' ? 8 : size === 'medium' ? 10 : 12,
                    "fontWeight": "bold" as const
                  }
                }
              ]
            }
          ]
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

// Combo Bar-Line Chart render function - creates interactive combo charts with bars and line
export const renderCombo = (params: ComboParams) => {
  const { charttitle, description, categories, barMetric, lineMetric, dimension, width, height, size } = params;
  
  // Calculate size-aware dimensions
  const getChartDimensions = () => {
    if (width && height) {
      return { chartWidth: width, chartHeight: height };
    }
    
    // Default dimensions based on size - make height smaller when dimensions are present for better fit
    const hasMultipleDimensions = dimension;
    
    switch (size) {
      case 'small':
        return { 
          chartWidth: 120, 
          chartHeight: hasMultipleDimensions ? 50 : 60 
        };
      case 'medium':
        return { 
          chartWidth: 280, 
          chartHeight: hasMultipleDimensions ? 100 : 120 
        };
      case 'large':
        return { 
          chartWidth: 400, 
          chartHeight: hasMultipleDimensions ? 150 : 180 
        };
      default:
        return { 
          chartWidth: 280, 
          chartHeight: hasMultipleDimensions ? 100 : 120 
        };
    }
  };

  const { chartWidth, chartHeight } = getChartDimensions();
  
  // Generate placeholder data for combo chart
  const generatePlaceholderData = () => {
    if (dimension) {
      // 3D data with dimension switching
      const dimensionTypes = {
        'By Region': [
          { category: 'North', barValue: 420, lineValue: 73.8 },
          { category: 'South', barValue: 380, lineValue: 68.5 },
          { category: 'East', barValue: 510, lineValue: 79.2 },
          { category: 'West', barValue: 460, lineValue: 76.1 }
        ],
        'By Product': [
          { category: 'Product A', barValue: 320, lineValue: 88.3 },
          { category: 'Product B', barValue: 280, lineValue: 92.7 },
          { category: 'Product C', barValue: 410, lineValue: 75.9 },
          { category: 'Product D', barValue: 360, lineValue: 83.4 }
        ],
        'By Season': [
          { category: 'Spring', barValue: 450, lineValue: 85.2 },
          { category: 'Summer', barValue: 520, lineValue: 78.6 },
          { category: 'Autumn', barValue: 390, lineValue: 82.4 },
          { category: 'Winter', barValue: 340, lineValue: 89.1 }
        ],
        'By Department': [
          { category: 'Sales', barValue: 580, lineValue: 76.3 },
          { category: 'Marketing', barValue: 420, lineValue: 84.7 },
          { category: 'Operations', barValue: 350, lineValue: 91.2 },
          { category: 'Support', barValue: 290, lineValue: 87.8 }
        ]
      };
      
      const sampleDimensions = Object.keys(dimensionTypes);
      const data: { [key: string]: any[] } = {};
      
      sampleDimensions.forEach((dim) => {
        data[dim] = dimensionTypes[dim as keyof typeof dimensionTypes].map(item => ({
          ...item,
          dimension: dim
        }));
      });
      
      return { data, dimensions: sampleDimensions };
    } else {
      // 2D data (simple combo chart without dimension switching)
      return [
        { category: 'Q1', barValue: 450, lineValue: 75.5 },
        { category: 'Q2', barValue: 520, lineValue: 82.3 },
        { category: 'Q3', barValue: 580, lineValue: 78.9 },
        { category: 'Q4', barValue: 620, lineValue: 85.2 }
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
        "data": {
          "values": data[selectedDimension]
        },
        "resolve": {
          "scale": { "y": "independent" }
        },
        "layer": [
          {
            "mark": {
              "type": "bar" as const,
              "opacity": 0.7,
              "color": "#2B7A9B",
              "cursor": "pointer" as const
            },
            "encoding": {
              "x": {
                "field": "category",
                "type": "ordinal" as const,
                "axis": {
                  "labelColor": "#888",
                  "titleColor": "#888",
                  "labelFontSize": size === 'small' ? 6 : 8,
                  "labelAngle": -45,
                  "grid": false,
                  "ticks": true,
                  "domain": true,
                  "title": null
                }
              },
              "y": {
                "field": "barValue",
                "type": "quantitative" as const,
                "axis": {
                  "labelColor": "#2B7A9B",
                  "titleColor": "#2B7A9B",
                  "labelFontSize": size === 'small' ? 6 : 8,
                  "gridColor": "#888",
                  "gridDash": [2, 2],
                  "grid": true,
                  "ticks": true,
                  "domain": true,
                  "title": null,
                  "format": ".0s"
                }
              },
              "tooltip": [
                {
                  "field": "category",
                  "type": "ordinal",
                  "title": "Category"
                },
                {
                  "field": "barValue",
                  "type": "quantitative",
                  "title": barMetric,
                  "format": ".0f"
                },
                {
                  "field": "dimension",
                  "type": "nominal",
                  "title": "Analysis"
                }
              ]
            }
          },
          {
            "mark": {
              "type": "line" as const,
              "strokeWidth": size === 'small' ? 2 : size === 'medium' ? 3 : 4,
              "color": "#8B5CF6",
              "cursor": "pointer" as const,
              "point": {
                "size": size === 'small' ? 30 : size === 'medium' ? 60 : 100,
                "filled": true,
                "fill": "white",
                "stroke": "#8B5CF6",
                "strokeWidth": 2
              }
            },
            "encoding": {
              "x": {
                "field": "category",
                "type": "ordinal" as const
              },
              "y": {
                "field": "lineValue",
                "type": "quantitative" as const,
                "axis": {
                  "labelColor": "#8B5CF6",
                  "titleColor": "#8B5CF6",
                  "labelFontSize": size === 'small' ? 6 : 8,
                  "title": null,
                  "format": ".1f"
                }
              },
              "tooltip": [
                {
                  "field": "category",
                  "type": "ordinal",
                  "title": "Category"
                },
                {
                  "field": "lineValue",
                  "type": "quantitative",
                  "title": lineMetric,
                  "format": ".1f"
                },
                {
                  "field": "dimension",
                  "type": "nominal",
                  "title": "Analysis"
                }
              ]
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
    // Return simple 2D combo chart spec
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
      "data": {
        "values": data
      },
      "resolve": {
        "scale": { "y": "independent" }
      },
      "layer": [
        {
          "mark": {
            "type": "bar" as const,
            "opacity": 0.7,
            "color": "#2B7A9B",
            "cursor": "pointer" as const
          },
          "encoding": {
            "x": {
              "field": "category",
              "type": "ordinal" as const,
              "axis": {
                "labelColor": "#888",
                "titleColor": "#888",
                "labelFontSize": size === 'small' ? 6 : 8,
                "labelAngle": -45,
                "grid": false,
                "ticks": true,
                "domain": true,
                "title": null
              }
            },
            "y": {
              "field": "barValue",
              "type": "quantitative" as const,
              "axis": {
                "labelColor": "#2B7A9B",
                "titleColor": "#2B7A9B",
                "labelFontSize": size === 'small' ? 6 : 8,
                "gridColor": "#888",
                "gridDash": [2, 2],
                "grid": true,
                "ticks": true,
                "domain": true,
                "title": null,
                "format": ".0s"
              }
            },
            "tooltip": [
              {
                "field": "category",
                "type": "ordinal",
                "title": "Category"
              },
              {
                "field": "barValue",
                "type": "quantitative",
                "title": barMetric,
                "format": ".0f"
              }
            ]
          }
        },
        {
          "mark": {
            "type": "line" as const,
            "strokeWidth": size === 'small' ? 2 : size === 'medium' ? 3 : 4,
            "color": "#8B5CF6",
            "cursor": "pointer" as const,
            "point": {
              "size": size === 'small' ? 30 : size === 'medium' ? 60 : 100,
              "filled": true,
              "fill": "white",
              "stroke": "#8B5CF6",
              "strokeWidth": 2
            }
          },
          "encoding": {
            "x": {
              "field": "category",
              "type": "ordinal" as const
            },
            "y": {
              "field": "lineValue",
              "type": "quantitative" as const,
              "axis": {
                "labelColor": "#8B5CF6",
                "titleColor": "#8B5CF6",
                "labelFontSize": size === 'small' ? 6 : 8,
                "title": null,
                "format": ".1f"
              }
            },
            "tooltip": [
              {
                "field": "category",
                "type": "ordinal",
                "title": "Category"
              },
              {
                "field": "lineValue",
                "type": "quantitative",
                "title": lineMetric,
                "format": ".1f"
              }
            ]
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
