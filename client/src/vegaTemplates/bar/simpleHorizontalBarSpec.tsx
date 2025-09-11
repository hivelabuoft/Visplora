// Simple horizontal bar chart for demographic and categorical data
// Designed to replace ethnicityMinorityGroupsBarChartSpec and schoolEducationFacilitiesSpec

export interface SimpleHorizontalBarConfig {
  data: Array<{ [key: string]: any }>;
  dimensions?: {
    width?: number;
    height?: number;
  };
  fields: {
    category: string;  // Field for Y-axis categories (e.g., 'name', 'type')
    value: string;     // Field for X-axis values (e.g., 'count', 'percentage')
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
        grid?: boolean;
        gridColor?: string;
        gridDash?: number[];
        format?: string;
      };
      yAxis?: {
        title?: string | null;
        labelColor?: string;
        titleColor?: string;
        labelFontSize?: number;
        labelLimit?: number;
        grid?: boolean;
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
}

export const createSimpleHorizontalBarSpec = (config: SimpleHorizontalBarConfig) => {
  const {
    data,
    dimensions = { width: 170, height: 200 },
    fields,
    styling = {},
    interactions = { hover: true, select: false },
    tooltip
  } = config;

  // Default styling to match travel growth chart
  const defaultStyling = {
    colors: ['#94a3b8', '#3b82f6', '#16a34a'],
    background: 'transparent',
    axes: {
      xAxis: {
        title: null,
        labelColor: '#888',
        titleColor: '#888',
        labelFontSize: 8,
        grid: true,
        gridColor: '#888',
        gridDash: [2, 2],
        format: '.1s'
      },
      yAxis: {
        title: null,
        labelColor: '#888',
        titleColor: '#888',
        labelFontSize: 10,
        labelLimit: 80,
        grid: false
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
      { field: fields.category, type: 'nominal' as const, title: 'Category' },
      { field: fields.value, type: 'quantitative' as const, title: 'Value', format: ',.0f' }
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
        name: 'hover_simple_bar',
        select: {
          type: 'point' as const,
          on: 'pointerover' as const,
          clear: 'pointerout' as const
        }
      }] : []),
      ...(interactions.select ? [{
        name: 'select_simple_bar',
        select: 'point' as const
      }] : [])
    ],
    mark: {
      type: 'bar' as const,
      cursor: 'pointer' as const,
      cornerRadiusEnd: 4,
      height: 8
    },
    encoding: {
      y: {
        field: fields.category,
        type: 'nominal' as const,
        sort: {
          field: fields.value,
          order: 'descending' as const
        },
        axis: {
          labelColor: finalStyling.axes.yAxis.labelColor,
          titleColor: finalStyling.axes.yAxis.titleColor,
          labelFontSize: finalStyling.axes.yAxis.labelFontSize,
          labelLimit: finalStyling.axes.yAxis.labelLimit,
          title: finalStyling.axes.yAxis.title,
          grid: finalStyling.axes.yAxis.grid,
          ticks: true,
          domain: true
        }
      },
      x: {
        field: fields.value,
        type: 'quantitative' as const,
        axis: {
          labelColor: finalStyling.axes.xAxis.labelColor,
          titleColor: finalStyling.axes.xAxis.titleColor,
          labelFontSize: finalStyling.axes.xAxis.labelFontSize,
          grid: finalStyling.axes.xAxis.grid,
          gridColor: finalStyling.axes.xAxis.gridColor,
          gridDash: finalStyling.axes.xAxis.gridDash,
          ticks: true,
          domain: true,
          title: finalStyling.axes.xAxis.title,
          format: finalStyling.axes.xAxis.format
        }
      },
      color: {
        value: finalStyling.colors[0] // Use first color for all bars
      },
      stroke: {
        condition: [
          ...(interactions.select ? [{
            param: 'select_simple_bar',
            empty: false,
            value: 'transparent'
          }] : []),
          ...(interactions.hover ? [{
            param: 'hover_simple_bar',
            empty: false,
            value: 'transparent'
          }] : [])
        ],
        value: 'transparent'
      },
      strokeWidth: {
        condition: [
          ...(interactions.select ? [{
            param: 'select_simple_bar',
            empty: false,
            value: 0
          }] : []),
          ...(interactions.hover ? [{
            param: 'hover_simple_bar',
            empty: false,
            value: 0
          }] : [])
        ],
        value: 0
      },
      opacity: {
        condition: [
          ...(interactions.select ? [{
            param: 'select_simple_bar',
            empty: false,
            value: 1
          }] : []),
          ...(interactions.hover ? [{
            param: 'hover_simple_bar',
            empty: false,
            value: 1
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