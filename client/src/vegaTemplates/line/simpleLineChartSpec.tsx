// Simple Line Chart Specification
// Based on libraryLineChartSpec from vegaSpecs.ts

export interface SimpleLineChartConfig {
  data: Array<{ [key: string]: any }>;
  dimensions: {
    width: number;
    height: number;
  };
  fields: {
    x: string;
    y: string;
  };
  styling: {
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
      };
    };
  };
  interactions?: {
    hover?: boolean;
    tooltip?: boolean;
    points?: boolean;
  };
  tooltip?: {
    fields: Array<{
      field: string;
      type: 'nominal' | 'ordinal' | 'quantitative';
      title: string;
      format?: string;
    }>;
  };
}

export const createSimpleLineChartSpec = (config: SimpleLineChartConfig): any => {
  const {
    data,
    dimensions,
    fields,
    styling,
    interactions = { hover: true, tooltip: true, points: true },
    tooltip
  } = config;

  const defaultColor = styling.colors?.[0] || '#8B5CF6';
  
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
    width: dimensions.width,
    height: dimensions.height,
    background: styling.background || "transparent",
    data: { values: data },
    mark: { 
      type: 'line',
      interpolate: 'monotone',
      point: interactions.points !== false,
      strokeWidth: 2,
      color: defaultColor
    },
    encoding: {
      x: { 
        field: fields.x, 
        type: 'ordinal',
        axis: {
          labelColor: styling.axes?.xAxis?.labelColor || '#888',
          titleColor: styling.axes?.xAxis?.titleColor || '#888',
          title: styling.axes?.xAxis?.title,
          labelFontSize: styling.axes?.xAxis?.labelFontSize || 8,
          labelAngle: styling.axes?.xAxis?.labelAngle || -45,
          grid: styling.axes?.xAxis?.grid !== false,
          gridColor: styling.axes?.xAxis?.gridColor || '#888',
          gridDash: styling.axes?.xAxis?.gridDash || [2, 2],
          format: styling.axes?.xAxis?.format
        }
      },
      y: { 
        field: fields.y,
        type: 'quantitative',
        axis: {
          labelColor: styling.axes?.yAxis?.labelColor || '#888',
          titleColor: styling.axes?.yAxis?.titleColor || '#888',
          title: styling.axes?.yAxis?.title,
          labelFontSize: styling.axes?.yAxis?.labelFontSize || 8,
          grid: styling.axes?.yAxis?.grid !== false,
          gridColor: styling.axes?.yAxis?.gridColor || '#888',
          gridDash: styling.axes?.yAxis?.gridDash || [2, 2],
          format: styling.axes?.yAxis?.format
        }
      },
      color: { value: defaultColor },
      tooltip: tooltip ? tooltip.fields : [
        { field: fields.x, type: 'ordinal', title: 'X' },
        { field: fields.y, type: 'quantitative', title: 'Y' }
      ]
    },
    params: interactions.hover !== false ? [
      {
        name: 'hover',
        select: { 
          type: 'point', 
          on: 'pointerover', 
          clear: 'pointerout' 
        }
      }
    ] : [],
    config: { 
      background: 'transparent', 
      view: { stroke: null } 
    }
  };
};