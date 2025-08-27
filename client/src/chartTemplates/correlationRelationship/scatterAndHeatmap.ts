// Correlation & Relationship Chart Templates
// Scatter Plot, Bubble Chart, Heatmap

export interface ScatterPlotData {
  [key: string]: any;
  // x_metric field (numeric)
  // y_metric field (numeric)
  // group field (optional categorical)
  // size field (optional numeric for bubble chart)
}

export interface ScatterPlotOptions {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  colors?: string[];
  xFormat?: string;
  yFormat?: string;
  pointSize?: number;
  showTrendLine?: boolean;
}

// Scatter Plot Template
export const createScatterPlotSpec = (
  data: ScatterPlotData[],
  xField: string,
  yField: string,
  options: ScatterPlotOptions = {},
  groupField?: string
) => {
  const {
    title = 'Scatter Plot',
    subtitle,
    width = 400,
    height = 280,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B'],
    xFormat = '.2s',
    yFormat = '.2s',
    pointSize = 100,
    showTrendLine = false
  } = options;

  const baseSpec: any = {
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
    "layer": []
  };

  // Main scatter plot layer
  const scatterLayer: any = {
    "params": [
      { "name": "highlight", "select": { "type": "point", "on": "mouseover" } },
      { "name": "select", "select": "point" }
    ],
    "mark": {
      "type": "circle",
      "size": pointSize,
      "opacity": 0.7,
      "stroke": "#FFFFFF",
      "strokeWidth": 1
    },
    "encoding": {
      "x": {
        "field": xField,
        "type": "quantitative",
        "title": "X Metric",
        "axis": {
          "grid": true,
          "gridColor": "#E5E7EB",
          "gridOpacity": 0.5,
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "format": xFormat
        }
      },
      "y": {
        "field": yField,
        "type": "quantitative",
        "title": "Y Metric",
        "axis": {
          "grid": true,
          "gridColor": "#E5E7EB",
          "gridOpacity": 0.5,
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "format": yFormat
        }
      },
      "opacity": {
        "condition": { "param": "highlight", "value": 1.0 },
        "value": 0.7
      },
      "size": {
        "condition": { "param": "select", "value": pointSize * 1.5 },
        "value": pointSize
      },
      "tooltip": [
        { "field": xField, "type": "quantitative", "title": "X Value", "format": xFormat },
        { "field": yField, "type": "quantitative", "title": "Y Value", "format": yFormat }
      ]
    }
  };

  // Add color encoding if group field is provided
  if (groupField) {
    scatterLayer.encoding.color = {
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
    scatterLayer.encoding.tooltip.unshift({
      "field": groupField,
      "type": "nominal",
      "title": "Group"
    });
  } else {
    scatterLayer.mark.color = colors[0];
  }

  baseSpec.layer.push(scatterLayer);

  // Add trend line if requested
  if (showTrendLine) {
    const trendLayer = {
      "mark": {
        "type": "line",
        "color": "#1A3C4A",
        "strokeWidth": 2,
        "opacity": 0.6
      },
      "transform": [{
        "regression": yField,
        "on": xField,
        ...(groupField && { "groupby": [groupField] })
      }],
      "encoding": {
        "x": {
          "field": xField,
          "type": "quantitative"
        },
        "y": {
          "field": yField,
          "type": "quantitative"
        },
        ...(groupField && {
          "color": {
            "field": groupField,
            "type": "nominal"
          }
        })
      }
    };
    baseSpec.layer.push(trendLayer);
  }

  return baseSpec;
};

// Bubble Chart Template
export const createBubbleChartSpec = (
  data: ScatterPlotData[],
  xField: string,
  yField: string,
  sizeField: string,
  options: ScatterPlotOptions = {},
  groupField?: string
) => {
  const spec = createScatterPlotSpec(data, xField, yField, options, groupField);
  
  // Update the scatter layer to use size encoding
  const scatterLayer = spec.layer[0];
  scatterLayer.encoding.size = {
    "field": sizeField,
    "type": "quantitative",
    "title": "Size",
    "scale": {
      "type": "sqrt",
      "range": [50, 400]
    },
    "legend": {
      "titleColor": "#2B7A9B",
      "titleFontWeight": 600,
      "labelColor": "#4A6A7B"
    }
  };

  // Add size field to tooltip
  scatterLayer.encoding.tooltip.push({
    "field": sizeField,
    "type": "quantitative",
    "title": "Size",
    "format": ".2s"
  });

  // Remove the size condition from select since we're using the size field
  delete scatterLayer.encoding.size.condition;

  return spec;
};

// Heatmap Template
export interface HeatmapData {
  [key: string]: any;
  // cat_x field (categorical X axis)
  // cat_y field (categorical Y axis)
  // metric field (numeric value for color)
}

export interface HeatmapOptions {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  colorScheme?: string;
  metricFormat?: string;
  cellSize?: number;
}

export const createHeatmapSpec = (
  data: HeatmapData[],
  xField: string,
  yField: string,
  metricField: string,
  options: HeatmapOptions = {}
) => {
  const {
    title = 'Heatmap',
    subtitle,
    width = 400,
    height = 280,
    colorScheme = 'blues',
    metricFormat = '.2s',
    cellSize = 20
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
    "params": [
      { "name": "highlight", "select": { "type": "point", "on": "mouseover" } }
    ],
    "mark": {
      "type": "rect",
      "stroke": "#FFFFFF",
      "strokeWidth": 2
    },
    "encoding": {
      "x": {
        "field": xField,
        "type": "nominal",
        "title": "X Category",
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelAngle": -45
        }
      },
      "y": {
        "field": yField,
        "type": "nominal",
        "title": "Y Category",
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600
        }
      },
      "color": {
        "field": metricField,
        "type": "quantitative",
        "title": "Value",
        "scale": {
          "scheme": colorScheme
        },
        "legend": {
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelColor": "#4A6A7B"
        }
      },
      "stroke": {
        "condition": { "param": "highlight", "value": "#1A3C4A" },
        "value": "#FFFFFF"
      },
      "strokeWidth": {
        "condition": { "param": "highlight", "value": 3 },
        "value": 2
      },
      "tooltip": [
        { "field": xField, "type": "nominal", "title": "X Category" },
        { "field": yField, "type": "nominal", "title": "Y Category" },
        { "field": metricField, "type": "quantitative", "title": "Value", "format": metricFormat }
      ]
    }
  };
};

// Correlation Matrix Template (special heatmap)
export const createCorrelationMatrixSpec = (
  data: any[],
  fields: string[],
  options: HeatmapOptions = {}
) => {
  // Transform data to correlation format
  const correlationData: any[] = [];
  
  fields.forEach(field1 => {
    fields.forEach(field2 => {
      // This is a placeholder - in real implementation, you'd calculate actual correlation
      const correlation = field1 === field2 ? 1 : Math.random() * 2 - 1;
      correlationData.push({
        field_x: field1,
        field_y: field2,
        correlation: correlation
      });
    });
  });

  const {
    title = 'Correlation Matrix',
    width = 300,
    height = 300,
    ...restOptions
  } = options;

  return createHeatmapSpec(
    correlationData,
    'field_x',
    'field_y',
    'correlation',
    {
      title,
      width,
      height,
      colorScheme: 'redblue',
      metricFormat: '.2f',
      ...restOptions
    }
  );
};
