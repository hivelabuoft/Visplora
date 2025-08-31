// Common interfaces and types for VegaTemplates

export interface ChartSpec {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'map' | 'multiType';
  subtype: string;
  data: any[];
  config: ChartConfig;
}

export interface ChartConfig {
  dimensions: { width: number; height: number };
  fields: FieldMapping;
  styling: StyleConfig;
  interactions?: InteractionConfig;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
}

export interface FieldMapping {
  x?: string;
  y?: string;
  series?: string;
  category?: string;
  value?: string;
  size?: string;
  color?: string;
  date?: string;
}

export interface StyleConfig {
  colors: string[];
  background?: string;
  axes?: AxisConfig;
  marks?: MarkConfig;
}

export interface AxisConfig {
  xAxis?: {
    title?: string | null;
    labelColor?: string;
    titleColor?: string;
    labelFontSize?: number;
    labelAngle?: number;
    grid?: boolean;
    gridColor?: string;
    gridDash?: number[];
    ticks?: boolean;
    domain?: boolean;
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
    ticks?: boolean;
    domain?: boolean;
    format?: string;
  };
}

export interface MarkConfig {
  strokeWidth?: number;
  cursor?: string;
  opacity?: number;
}

export interface InteractionConfig {
  hover?: boolean;
  select?: boolean;
  labels?: boolean;
  tooltip?: boolean;
}

export interface LegendConfig {
  title?: string | null;
  labelFontSize?: number;
  symbolSize?: number;
  orient?: 'left' | 'right' | 'top' | 'bottom';
  padding?: number;
  offset?: number;
  symbolType?: 'circle' | 'square' | 'cross' | 'diamond' | 'triangle-up' | 'triangle-down';
}

export interface TooltipConfig {
  fields?: Array<{
    field: string;
    type: 'nominal' | 'ordinal' | 'quantitative' | 'temporal';
    title?: string;
    format?: string;
  }>;
}

// Specific data interfaces for templates
export interface MultiLineData {
  [key: string]: string | number | undefined;
}

export interface LineChartParams {
  data: MultiLineData[];
  xField: string;
  yField: string;
  seriesField?: string;
  colors?: string[];
  width?: number;
  height?: number;
  background?: string;
  xAxisConfig?: AxisConfig['xAxis'];
  yAxisConfig?: AxisConfig['yAxis'];
  legend?: LegendConfig;
  dateFormat?: string;
  yFormat?: string;
  interactions?: {
    hover?: boolean;
    labels?: boolean;
  };
}