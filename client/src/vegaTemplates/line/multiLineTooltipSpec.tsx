// Multi-line chart with enhanced tooltip functionality
import { LineChartParams } from '../types/interfaces';

export interface MultiLineTooltipConfig {
  data: Array<{ [key: string]: any }>;
  dimensions?: {
    width?: number;
    height?: number;
  };
  fields: {
    x: string;           // X-axis field (e.g., 'year', 'date')
    lines: string[];     // Array of fields to plot as lines (e.g., ['meanIncome', 'medianIncome'])
    lineLabels?: string[]; // Optional custom labels for lines (defaults to field names)
  };
  styling?: {
    colors?: string[];
    background?: string;
    axes?: {
      xAxis?: {
        title?: string | null;
        labelColor?: string;
        titleColor?: string;
        labelFontSize?: number;
        labelAngle?: number;
        grid?: boolean;
        gridColor?: string;
        gridDash?: number[];
        format?: string;
        values?: string[]; // Specific tick values to show
        ticks?: boolean;
        domain?: boolean;
      };
      yAxis?: {
        title?: string | null;
        labelColor?: string;
        titleColor?: string;
        labelFontSize?: number;
        grid?: boolean;
        gridColor?: string;
        gridDash?: number[];
        format?: string;
        ticks?: boolean;
        domain?: boolean;
      };
    };
  };
  interactions?: {
    hover?: boolean;
    points?: boolean;
  };
  tooltip?: {
    fields: Array<{
      field: string;
      type: 'nominal' | 'quantitative' | 'ordinal' | 'temporal';
      title: string;
      format?: string;
    }>;
  };
  legend?: {
    show?: boolean;
    orient?: 'top' | 'bottom' | 'left' | 'right';
    title?: string | null;
  };
}

export const createMultiLineTooltipSpec = (config: MultiLineTooltipConfig) => {
  const {
    data,
    dimensions = { width: 420, height: 130 },
    fields,
    styling = {},
    interactions = { hover: true, points: true },
    tooltip,
    legend = { show: false }
  } = config;

  // Default styling
  const defaultStyling = {
    colors: ['#8B5CF6', '#3B82F6', '#16a34a', '#f59e0b', '#ef4444'],
    background: 'transparent',
    axes: {
      xAxis: {
        title: null,
        labelColor: '#888',
        titleColor: '#888',
        labelFontSize: 8,
        labelAngle: -45,
        grid: false,
        gridColor: '#888',
        gridDash: [2, 2],
        format: undefined,
        values: undefined,
        ticks: true,
        domain: true
      },
      yAxis: {
        title: null,
        labelColor: '#888',
        titleColor: '#888',
        labelFontSize: 8,
        grid: true,
        gridColor: '#888',
        gridDash: [2, 2],
        format: ',.0f',
        ticks: false,
        domain: true
      }
    }
  };

  // Merge styling with defaults
  const finalStyling = {
    colors: styling.colors || defaultStyling.colors,
    background: styling.background || defaultStyling.background,
    axes: {
      xAxis: { ...defaultStyling.axes.xAxis, ...styling.axes?.xAxis },
      yAxis: { ...defaultStyling.axes.yAxis, ...styling.axes?.yAxis }
    }
  };

  // Create line labels if not provided
  const lineLabels = fields.lineLabels || fields.lines.map(field => 
    field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')
  );

  // Create domain and range for color scale
  const colorDomain = fields.lines;
  const colorRange = finalStyling.colors.slice(0, fields.lines.length);

  // Default tooltip if none provided
  const defaultTooltip = {
    fields: [
      { field: fields.x, type: 'ordinal' as const, title: 'Year' },
      { field: 'value', type: 'quantitative' as const, title: 'Value', format: ',.0f' },
      { field: 'lineLabel', type: 'nominal' as const, title: 'Type' }
    ]
  };

  const finalTooltip = tooltip || defaultTooltip;

  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json' as const,
    width: dimensions.width,
    height: dimensions.height,
    background: finalStyling.background,
    data: {
      values: data
    },
    transform: [
      {
        fold: fields.lines,
        as: ['lineType', 'value'] as [string, string]
      },
      {
        calculate: fields.lines.map((field, index) => 
          `datum.lineType === '${field}' ? '${lineLabels[index]}'`
        ).join(' : ') + ` : datum.lineType`,
        as: 'lineLabel'
      }
    ],
    encoding: {
      x: {
        field: fields.x,
        type: 'ordinal' as const,
        axis: {
          labelColor: finalStyling.axes.xAxis.labelColor,
          titleColor: finalStyling.axes.xAxis.titleColor,
          labelFontSize: finalStyling.axes.xAxis.labelFontSize,
          labelAngle: finalStyling.axes.xAxis.labelAngle,
          gridColor: finalStyling.axes.xAxis.gridColor,
          gridDash: finalStyling.axes.xAxis.gridDash,
          grid: finalStyling.axes.xAxis.grid,
          ticks: finalStyling.axes.xAxis.ticks,
          domain: finalStyling.axes.xAxis.domain,
          title: finalStyling.axes.xAxis.title,
          format: finalStyling.axes.xAxis.format,
          ...(finalStyling.axes.xAxis.values && { values: finalStyling.axes.xAxis.values })
        }
      },
      y: {
        field: 'value',
        type: 'quantitative' as const,
        axis: {
          labelColor: finalStyling.axes.yAxis.labelColor,
          titleColor: finalStyling.axes.yAxis.titleColor,
          labelFontSize: finalStyling.axes.yAxis.labelFontSize,
          gridColor: finalStyling.axes.yAxis.gridColor,
          gridDash: finalStyling.axes.yAxis.gridDash,
          grid: finalStyling.axes.yAxis.grid,
          ticks: finalStyling.axes.yAxis.ticks,
          domain: finalStyling.axes.yAxis.domain,
          title: finalStyling.axes.yAxis.title,
          format: finalStyling.axes.yAxis.format
        }
      },
      color: {
        field: 'lineType',
        type: 'nominal' as const,
        scale: {
          domain: colorDomain,
          range: colorRange
        },
        legend: legend.show ? {
          title: legend.title,
          orient: legend.orient || 'right'
        } : null
      }
    },
    layer: [
      {
        mark: {
          type: 'line' as const,
          strokeWidth: 2,
          cursor: 'pointer' as const
        }
      },
      ...(interactions.hover && interactions.points ? [{
        params: [{
          name: 'hover_multiline',
          select: {
            type: 'point' as const,
            on: 'pointerover' as const,
            clear: 'pointerout' as const
          }
        }],
        mark: {
          type: 'circle' as const,
          tooltip: true
        },
        encoding: {
          opacity: {
            condition: {
              test: {
                param: 'hover_multiline',
                empty: false
              },
              value: 1
            },
            value: 0
          },
          size: {
            condition: {
              test: {
                param: 'hover_multiline',
                empty: false
              },
              value: 48
            },
            value: 100
          },
          tooltip: finalTooltip.fields
        }
      }] : [])
    ],
    config: {
      background: 'transparent',
      view: {
        stroke: null
      }
    }
  };
};