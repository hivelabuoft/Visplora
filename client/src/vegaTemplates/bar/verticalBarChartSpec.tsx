// Vertical bar chart based on populationTimelineChartSpec styling
// Designed for time series and categorical data with vertical orientation

export interface VerticalBarChartConfig {
  data: Array<{ [key: string]: any }>;
  dimensions?: {
    width?: number;
    height?: number;
  };
  fields: {
    category: string;  // Field for X-axis categories (e.g., 'year', 'month')
    value: string;     // Field for Y-axis values (e.g., 'population', 'count')
    type?: string;     // Optional field for color grouping (e.g., 'Historical', 'Projected')
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
        ticks?: boolean;
        domain?: boolean;
        values?: (string | number)[];
      };
      yAxis?: {
        title?: string | null;
        labelColor?: string;
        titleColor?: string;
        labelFontSize?: number;
        grid?: boolean;
        gridColor?: string;
        gridDash?: number[];
        ticks?: boolean;
        domain?: boolean;
        format?: string;
      };
    };
  };
  interactions?: {
    hover?: boolean;
    select?: boolean;
  };
  tooltip?: {
    fields: Array<{
      field: string;
      type: 'nominal' | 'quantitative' | 'ordinal';
      title: string;
      format?: string;
    }>;
  };
  legend?: {
    show?: boolean;
    title?: string | null;
    orient?: 'top' | 'bottom' | 'left' | 'right';
  };
}

export const createVerticalBarChartSpec = (config: VerticalBarChartConfig) => {
  const {
    data,
    dimensions = { width: 250, height: 130 },
    fields,
    styling = {},
    interactions = { hover: true, select: true },
    tooltip,
    legend = { show: false }
  } = config;

  // Default styling to match populationTimelineChartSpec
  const defaultStyling = {
    colors: ['#8B5CF6', '#4C1D95'],
    background: 'transparent',
    axes: {
      xAxis: {
        title: null,
        labelColor: '#888',
        titleColor: '#888',
        labelFontSize: 8,
        labelAngle: -45,
        grid: false,
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
        ticks: true,
        domain: true,
        format: '.2s'
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

  // Default tooltip if none provided
  const defaultTooltip = {
    fields: [
      { field: fields.category, type: 'ordinal' as const, title: 'Category' },
      { field: fields.value, type: 'quantitative' as const, title: 'Value', format: ',' },
      ...(fields.type ? [{ field: fields.type, type: 'nominal' as const, title: 'Type' }] : [])
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
    params: [
      ...(interactions.hover ? [{
        name: 'highlight',
        select: {
          type: 'point' as const,
          on: 'pointerover' as const
        }
      }] : []),
      ...(interactions.select ? [{
        name: 'select',
        select: 'point' as const
      }] : [])
    ],
    mark: {
      type: 'bar' as const,
      width: 5,
      cursor: 'pointer' as const
    },
    encoding: {
      x: {
        field: fields.category,
        type: 'ordinal' as const,
        axis: {
          labelColor: finalStyling.axes.xAxis.labelColor,
          titleColor: finalStyling.axes.xAxis.titleColor,
          labelFontSize: finalStyling.axes.xAxis.labelFontSize,
          labelAngle: finalStyling.axes.xAxis.labelAngle,
          grid: finalStyling.axes.xAxis.grid,
          ticks: finalStyling.axes.xAxis.ticks,
          domain: finalStyling.axes.xAxis.domain,
          title: finalStyling.axes.xAxis.title,
          ...(finalStyling.axes.xAxis.values && { values: finalStyling.axes.xAxis.values })
        }
      },
      y: {
        field: fields.value,
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
          format: finalStyling.axes.yAxis.format,
          title: finalStyling.axes.yAxis.title
        }
      },
      ...(fields.type ? {
        color: {
          field: fields.type,
          type: 'nominal' as const,
          scale: {
            range: finalStyling.colors
          },
          legend: legend.show ? {
            title: legend.title,
            orient: legend.orient || 'top'
          } : null
        }
      } : {
        color: {
          value: finalStyling.colors[0]
        }
      }),
      stroke: {
        value: '#272729'
      },
      strokeWidth: {
        condition: [
          ...(interactions.select ? [{
            param: 'select',
            empty: false,
            value: 1
          }] : []),
          ...(interactions.hover ? [{
            param: 'highlight',
            empty: false,
            value: 1
          }] : [])
        ],
        value: 0
      },
      opacity: {
        condition: [
          ...(interactions.select ? [{
            param: 'select',
            empty: false,
            value: 1
          }] : []),
          ...(interactions.hover ? [{
            param: 'highlight',
            empty: false,
            value: 0.8
          }] : [])
        ],
        value: 0.6
      },
      tooltip: finalTooltip.fields
    },
    config: {
      background: 'transparent',
      view: {
        stroke: null
      }
    }
  };
};