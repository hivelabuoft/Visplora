// Multi-type chart with bar and line using the same Y axis template
import { MultiTypeChartParams } from '../types/interfaces';

export interface MultiTypeSameYAxisParams extends MultiTypeChartParams {
  // Override fields to use same y field for both bar and line
  fields: {
    x: string;
    xType?: 'nominal' | 'ordinal' | 'quantitative' | 'temporal';
    xSort?: string[] | { field: string; order: 'ascending' | 'descending' };
    yBar: string;        // Field for bar values
    yLine: string;       // Field for line values (different from bar but same scale)
    colorField?: string;
  };
}

export const createMultiTypeSameYAxisSpec = (params: MultiTypeSameYAxisParams) => {
  const {
    data,
    dimensions,
    fields,
    styling,
    interactions,
    axes,
    legend,
    tooltip
  } = params;

  const spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
    "width": dimensions.width || 390,
    "height": dimensions.height || 160,
    "background": styling.background || "transparent",
    "data": {
      "values": data
    },
    "layer": [
      // Bar layer
      {
        "params": [
          {
            "name": interactions?.hoverParam || "hover_bar",
            "select": {
              "type": "point" as const,
              "on": interactions?.hoverOn || "pointerover" as const,
              "clear": interactions?.hoverClear || "pointerout" as const
            }
          }
        ],
        "mark": {
          "type": "bar" as const,
          "cursor": "pointer" as const,
          "cornerRadiusEnd": styling.cornerRadius || 2
        },
        "encoding": {
          "x": {
            "field": fields.x,
            "type": fields.xType || "ordinal" as const,
            ...(fields.xSort && { "sort": fields.xSort }),
            "axis": {
              "labelColor": axes?.xAxis?.labelColor || "#888",
              "titleColor": axes?.xAxis?.titleColor || "#888",
              "labelFontSize": axes?.xAxis?.labelFontSize || 10,
              "labelAngle": axes?.xAxis?.labelAngle || 0,
              "labelPadding": axes?.xAxis?.labelPadding || 5,
              "title": axes?.xAxis?.title || null,
              "grid": axes?.xAxis?.grid || false,
              "ticks": axes?.xAxis?.ticks !== false,
              "domain": axes?.xAxis?.domain !== false
            }
          },
          "y": {
            "field": fields.yBar,
            "type": "quantitative" as const,
            "axis": {
              "labelColor": axes?.yAxisLeft?.labelColor || "#888",
              "titleColor": axes?.yAxisLeft?.titleColor || "#888",
              "labelFontSize": axes?.yAxisLeft?.labelFontSize || 8,
              "gridColor": axes?.yAxisLeft?.gridColor || "#888",
              "gridDash": axes?.yAxisLeft?.gridDash || [2, 2],
              "grid": axes?.yAxisLeft?.grid !== false,
              "title": axes?.yAxisLeft?.title,
              "format": axes?.yAxisLeft?.format || ".2s"
            }
          },
          "color": {
            "field": fields.colorField,
            "type": "nominal" as const,
            "scale": {
              "domain": styling.colorDomain,
              "range": styling.colors
            },
            "legend": !legend ? null : {
              "title": legend?.title,
              "orient": legend?.orient || "right" as const,
              "titleColor": legend?.titleColor || "#888",
              "labelColor": legend?.labelColor || "#888",
              "titleFontSize": legend?.titleFontSize || 11,
              "labelFontSize": legend?.labelFontSize || 10,
              "symbolSize": legend?.symbolSize || 200
            }
          },
          "opacity": {
            "condition": {
              "param": interactions?.hoverParam || "hover_bar",
              "value": interactions?.hoverOpacity || 0.8
            },
            "value": interactions?.defaultOpacity || 0.6
          },
          "tooltip": tooltip || [
            {"field": fields.x, "type": fields.xType || "nominal" as const, "title": axes?.xAxis?.tooltipTitle || "Category"},
            {"field": fields.yBar, "type": "quantitative" as const, "title": "Bar Value", "format": ",.0f"},
            {"field": fields.yLine, "type": "quantitative" as const, "title": "Line Value", "format": ",.0f"},
            ...(fields.colorField ? [{"field": fields.colorField, "type": "nominal" as const, "title": "Category"}] : [])
          ]
        }
      },
      // Line layer (using same Y axis as bars)
      {
        "mark": {
          "type": "line" as const,
          "color": styling.lineColor || "#8b5cf6",
          "strokeWidth": styling.lineWidth || 2,
          "point": true
        },
        "encoding": {
          "x": {
            "field": fields.x,
            "type": fields.xType || "ordinal" as const,
            ...(fields.xSort && { "sort": fields.xSort })
          },
          "y": {
            "field": fields.yLine,
            "type": "quantitative" as const
            // No axis config here - it will use the same scale as the bar
          },
          "tooltip": [
            {"field": fields.x, "type": fields.xType || "nominal" as const, "title": axes?.xAxis?.tooltipTitle || "Category"},
            {"field": fields.yLine, "type": "quantitative" as const, "title": "Line Value", "format": ",.0f"}
          ]
        }
      }
    ],
    "resolve": {
      "scale": {
        "y": "shared" // This is key - both layers share the same Y scale
      }
    },
    "config": {
      "background": styling.background || "transparent",
      "view": {
        "stroke": null
      }
    }
  };

  return spec;
};