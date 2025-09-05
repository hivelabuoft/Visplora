import { PieChartParams } from '../types/interfaces';

export interface PieChartData {
  [key: string]: string | number | undefined;
  percentage?: number;
}

/**
 * Creates an interactive pie/donut chart with hover effects and center text
 * Based on reviewsDistributionPieSpec and safetyBreakdownPieSpec patterns
 */
export function createInteractivePieSpec(
  data: PieChartData[],
  params: PieChartParams
): any {
  const {
    categoryField,
    valueField,
    width = 150,
    height = 150,
    innerRadius = 42,
    outerRadius = 60,
    colors,
    hoverParam = "hover_pie",
    showCenterText = true,
    centerText,
    centerSubtext,
    legend,
    tooltip,
    strokeWidth = 0.5,
    hoverStrokeWidth = 2,
    opacity = 0.7,
    hoverOpacity = 1.0
  } = params;

  // Calculate total value for center display
  const totalValue = data.reduce((sum, d) => sum + (d[valueField] as number), 0);
  const averageValue = totalValue / data.length;

  // Build layers starting with the pie chart
  const layers: any[] = [
    {
      data: { values: data },
      params: [
        {
          name: hoverParam,
          select: {
            type: "point",
            on: "mouseover",
            clear: "mouseout"
          }
        }
      ],
      mark: {
        type: "arc" as const,
        innerRadius,
        outerRadius,
        cursor: "pointer" as const
      },
      encoding: {
        theta: {
          field: valueField,
          type: "quantitative" as const
        },
        color: {
          field: categoryField,
          type: "nominal" as const,
          ...(colors && { scale: { range: colors } }),
          ...(legend && {
            legend: {
              title: legend.title || categoryField,
              orient: legend.orient || "right",
              titleColor: legend.titleColor || "#888",
              labelColor: legend.labelColor || "#888",
              titleFontSize: legend.titleFontSize || 11,
              labelFontSize: legend.labelFontSize || 10,
              symbolSize: legend.symbolSize || 200,
              offset: legend.offset || 30,
              padding: legend.padding || 0,
              symbolType: legend.symbolType || "circle"
            }
          })
        },
        stroke: {
          condition: {
            param: hoverParam,
            value: "white"
          },
          value: "white"
        },
        strokeWidth: {
          condition: {
            param: hoverParam,
            value: hoverStrokeWidth
          },
          value: strokeWidth
        },
        opacity: {
          condition: {
            param: hoverParam,
            value: hoverOpacity
          },
          value: opacity
        },
        tooltip: tooltip || [
          { field: categoryField, type: "nominal", title: "Category" },
          { field: valueField, type: "quantitative", title: "Value", format: ".0f" },
          ...(data[0]?.percentage !== undefined ? [
            { field: "percentage", type: "quantitative", title: "Percentage", format: ".1f" }
          ] : [])
        ]
      }
    }
  ];

  // Add center text layers if enabled (for donut charts)
  if (showCenterText && innerRadius > 0) {
    // Main center value
    layers.push({
      data: {
        values: [{ 
          text: centerText || Math.round(averageValue).toString(),
          category: "center"
        }]
      },
      mark: {
        type: "text",
        align: "center",
        baseline: "middle",
        fontSize: 16,
        fontWeight: "bold",
        dy: -10,
        color: "#333"
      },
      encoding: {
        text: {
          field: "text",
          type: "nominal"
        }
      }
    });

    // Center subtitle
    layers.push({
      data: {
        values: [{ 
          text: centerSubtext || "Average",
          category: "subtitle"
        }]
      },
      mark: {
        type: "text",
        align: "center",
        baseline: "middle",
        fontSize: 10,
        dy: 8,
        color: "#888"
      },
      encoding: {
        text: {
          field: "text",
          type: "nominal"
        }
      }
    });
  }

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    width,
    height,
    background: "transparent",
    layer: layers,
    config: {
      view: {
        stroke: null
      }
    }
  };
}