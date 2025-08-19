// Distribution Chart Templates
// Histogram, Box Plot

export interface DistributionData {
  [key: string]: any;
  // metric field (numeric value for distribution)
  // category field (optional grouping for box plots)
  // group field (optional secondary grouping)
}

export interface DistributionOptions {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  colors?: string[];
  metricFormat?: string;
  bins?: number;
  binExtent?: [number, number];
}

// Histogram Template
export const createHistogramSpec = (
  data: DistributionData[],
  metricField: string,
  options: DistributionOptions = {},
  groupField?: string
) => {
  const {
    title = 'Histogram',
    subtitle,
    width = 400,
    height = 280,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B'],
    metricFormat = '.2s',
    bins = 15
  } = options;

  const spec: any = {
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
      "type": "bar",
      "binSpacing": 2,
      "stroke": "#FFFFFF",
      "strokeWidth": 1,
      "opacity": 0.8
    },
    "encoding": {
      "x": {
        "field": metricField,
        "type": "quantitative",
        "bin": { "maxbins": bins },
        "title": "Value",
        "axis": {
          "grid": false,
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "format": metricFormat
        }
      },
      "y": {
        "aggregate": "count",
        "type": "quantitative",
        "title": "Frequency",
        "axis": {
          "grid": true,
          "gridColor": "#E5E7EB",
          "gridOpacity": 0.5,
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600
        }
      },
      "tooltip": [
        {
          "field": metricField,
          "type": "quantitative",
          "bin": true,
          "title": "Value Range"
        },
        {
          "aggregate": "count",
          "type": "quantitative",
          "title": "Count"
        }
      ]
    }
  };

  // Add color encoding if group field is provided
  if (groupField) {
    spec.encoding.color = {
      "field": groupField,
      "type": "nominal",
      "title": "Group",
      "scale": { "range": colors },
      "legend": {
        "titleColor": "#2B7A9B",
        "titleFontWeight": 600,
        "labelColor": "#4A6A7B"
      }
    };
    spec.encoding.tooltip.unshift({
      "field": groupField,
      "type": "nominal",
      "title": "Group"
    });
  } else {
    spec.mark.color = colors[0];
  }

  return spec;
};

// Box Plot Template
export const createBoxPlotSpec = (
  data: DistributionData[],
  metricField: string,
  options: DistributionOptions = {},
  categoryField?: string
) => {
  const {
    title = 'Box Plot',
    subtitle,
    width = 400,
    height = 280,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B'],
    metricFormat = '.2s'
  } = options;

  const spec: any = {
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
      "type": "boxplot",
      "extent": "min-max",
      "size": 40
    },
    "encoding": {
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
      }
    }
  };

  // Add category encoding if category field is provided
  if (categoryField) {
    spec.encoding.x = {
      "field": categoryField,
      "type": "nominal",
      "title": "Category",
      "axis": {
        "labelColor": "#4A6A7B",
        "titleColor": "#2B7A9B",
        "titleFontWeight": 600,
        "labelAngle": -45
      }
    };
    spec.encoding.color = {
      "field": categoryField,
      "type": "nominal",
      "scale": { "range": colors },
      "legend": {
        "titleColor": "#2B7A9B",
        "titleFontWeight": 600,
        "labelColor": "#4A6A7B"
      }
    };
  } else {
    spec.mark.color = colors[0];
    // For single box plot, add a dummy x field
    spec.encoding.x = {
      "value": "Distribution"
    };
  }

  return spec;
};

// Violin Plot Template (alternative to box plot)
export const createViolinPlotSpec = (
  data: DistributionData[],
  metricField: string,
  options: DistributionOptions = {},
  categoryField?: string
) => {
  const {
    title = 'Violin Plot',
    subtitle,
    width = 400,
    height = 280,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B'],
    metricFormat = '.2s'
  } = options;

  const spec: any = {
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
    "transform": [
      {
        "density": metricField,
        ...(categoryField && { "groupby": [categoryField] }),
        "extent": { "signal": `[${metricField}_extent[0], ${metricField}_extent[1]]` }
      }
    ],
    "mark": {
      "type": "area",
      "orient": "horizontal",
      "opacity": 0.7
    },
    "encoding": {
      "y": {
        "field": "value",
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
      "x": {
        "field": "density",
        "type": "quantitative",
        "title": "Density",
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600
        }
      }
    }
  };

  // Add category encoding if category field is provided
  if (categoryField) {
    spec.encoding.color = {
      "field": categoryField,
      "type": "nominal",
      "title": "Category",
      "scale": { "range": colors },
      "legend": {
        "titleColor": "#2B7A9B",
        "titleFontWeight": 600,
        "labelColor": "#4A6A7B"
      }
    };
    spec.encoding.column = {
      "field": categoryField,
      "type": "nominal"
    };
  } else {
    spec.mark.color = colors[0];
  }

  return spec;
};

// QQ Plot Template (Quantile-Quantile plot for comparing distributions)
export const createQQPlotSpec = (
  data: DistributionData[],
  metricField: string,
  referenceDistribution: 'normal' | 'uniform' = 'normal',
  options: DistributionOptions = {}
) => {
  const {
    title = 'Q-Q Plot',
    subtitle,
    width = 400,
    height = 280,
    colors = ['#2B7A9B'],
    metricFormat = '.2s'
  } = options;

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
    "transform": [
      {
        "quantile": metricField,
        "probs": {"expr": "sequence(0.01, 1, 0.01)"}
      },
      {
        "calculate": referenceDistribution === 'normal' 
          ? "quantileNormal(datum.prob)" 
          : "datum.prob",
        "as": "theoretical"
      }
    ],
    "layer": [
      // Q-Q points
      {
        "mark": {
          "type": "circle",
          "size": 50,
          "color": colors[0],
          "opacity": 0.7
        },
        "encoding": {
          "x": {
            "field": "theoretical",
            "type": "quantitative",
            "title": `Theoretical ${referenceDistribution} Quantiles`,
            "axis": {
              "grid": true,
              "gridColor": "#E5E7EB",
              "gridOpacity": 0.5,
              "labelColor": "#4A6A7B",
              "titleColor": "#2B7A9B",
              "titleFontWeight": 600
            }
          },
          "y": {
            "field": "value",
            "type": "quantitative",
            "title": "Sample Quantiles",
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
            { "field": "prob", "type": "quantitative", "title": "Quantile", "format": ".2f" },
            { "field": "theoretical", "type": "quantitative", "title": "Theoretical", "format": ".2f" },
            { "field": "value", "type": "quantitative", "title": "Sample", "format": metricFormat }
          ]
        }
      },
      // Reference line (y = x)
      {
        "mark": {
          "type": "line",
          "color": "#1A3C4A",
          "strokeDash": [5, 5],
          "strokeWidth": 2
        },
        "transform": [
          {
            "aggregate": [
              {"op": "min", "field": "theoretical", "as": "min_x"},
              {"op": "max", "field": "theoretical", "as": "max_x"}
            ]
          },
          {
            "calculate": "datum.min_x",
            "as": "x"
          },
          {
            "calculate": "datum.min_x",
            "as": "y"
          }
        ],
        "encoding": {
          "x": { "field": "min_x", "type": "quantitative" },
          "y": { "field": "min_x", "type": "quantitative" },
          "x2": { "field": "max_x", "type": "quantitative" },
          "y2": { "field": "max_x", "type": "quantitative" }
        }
      }
    ]
  };
};
