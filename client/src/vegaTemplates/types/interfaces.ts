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
  sizeLegend?: LegendConfig;
  colorLegend?: LegendConfig;
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
  geoData?: any;
  selectedCountry?: string;
  positiveLabel?: string; // Custom label for positive field in diverging charts
  negativeLabel?: string; // Custom label for negative field in diverging charts
}

export interface StyleConfig {
  colors: string[];
  background?: string;
  axes?: AxisConfig;
  marks?: MarkConfig;
  sizeDomain?: [number, number]; // Custom domain for size scale
}

export interface AxisConfig {
  xAxis?: {
    title?: string | null;
    labelColor?: string;
    titleColor?: string;
    labelFontSize?: number;
    titleFontSize?: number;
    labelAngle?: number;
    grid?: boolean;
    gridColor?: string;
    gridDash?: number[];
    ticks?: boolean;
    domain?: boolean;
    format?: string;
    scale?: any;
    values?: (string | number)[];
  };
  yAxis?: {
    title?: string | null;
    labelColor?: string;
    titleColor?: string;
    labelFontSize?: number;
    titleFontSize?: number;
    grid?: boolean;
    gridColor?: string;
    gridDash?: number[];
    ticks?: boolean;
    domain?: boolean;
    format?: string;
    scale?: any;
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
  titleColor?: string;
  titleFontSize?: number;
  labelColor?: string;
  labelFontSize?: number;
  symbolSize?: number;
  orient?: 'left' | 'right' | 'top' | 'bottom';
  padding?: number;
  offset?: number;
  symbolType?: 'circle' | 'square' | 'cross' | 'diamond' | 'triangle-up' | 'triangle-down';
  showSize?: boolean;
  sizeTitle?: string;
  showColor?: boolean;
  colorTitle?: string;
  colorOrient?: 'left' | 'right' | 'top' | 'bottom';
  colorOffset?: number;
  values?: number[]; // Custom legend values for size legends
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

export interface BarChartParams {
  data: any[];
  categoryField: string;
  valueField?: string;
  positiveField?: string;
  negativeField?: string;
  positiveLabel?: string; // Custom label for positive field
  negativeLabel?: string; // Custom label for negative field
  seriesField?: string;
  colors?: string[];
  width?: number;
  height?: number;
  background?: string;
  orientation?: 'horizontal' | 'vertical';
  xAxisConfig?: AxisConfig['xAxis'];
  yAxisConfig?: AxisConfig['yAxis'];
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  interactions?: InteractionConfig;
}

export interface PieChartParams {
  data: any[];
  valueField: string;
  categoryField: string;
  colors?: string[];
  width?: number;
  height?: number;
  background?: string;
  innerRadius?: number;
  outerRadius?: number;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  interactions?: InteractionConfig;
  hoverParam?: string;
  showCenterText?: boolean;
  centerText?: string;
  centerSubtext?: string;
  strokeWidth?: number;
  hoverStrokeWidth?: number;
  opacity?: number;
  hoverOpacity?: number;
}

export interface ScatterChartParams {
  data: any[];
  xField: string;
  yField: string;
  sizeField?: string;
  colorField?: string;
  colors?: string[];
  width?: number;
  height?: number;
  background?: string;
  xAxisConfig?: AxisConfig['xAxis'];
  yAxisConfig?: AxisConfig['yAxis'];
  legend?: LegendConfig;
  sizeLegend?: LegendConfig;
  colorLegend?: LegendConfig;
  tooltip?: TooltipConfig;
  sizeRange?: [number, number];
  sizeDomain?: [number, number]; // Custom domain for size scale
  interactions?: InteractionConfig;
}

export interface MapChartParams {
  data?: any[];
  geoData?: any;
  colors?: string[];
  width?: number;
  height?: number;
  background?: string;
  projection?: string;
  tooltip?: TooltipConfig;
  legend?: LegendConfig;
  interactions?: InteractionConfig;
}

export interface MultiTypeChartParams {
  data: any[];
  dimensions: { width?: number; height?: number };
  fields: {
    x: string;
    xType?: 'nominal' | 'ordinal' | 'quantitative' | 'temporal';
    xSort?: string[] | { field: string; order: 'ascending' | 'descending' };
    yBar: string;
    yLine: string;
    colorField?: string;
  };
  styling: {
    background?: string;
    colors?: string[];
    colorDomain?: string[];
    lineColor?: string;
    lineWidth?: number;
    cornerRadius?: number;
  };
  interactions?: {
    hoverParam?: string;
    hoverOn?: string;
    hoverClear?: string;
    hoverOpacity?: number;
    defaultOpacity?: number;
  };
  axes?: {
    xAxis?: {
      title?: string | null;
      labelColor?: string;
      titleColor?: string;
      labelFontSize?: number;
      labelAngle?: number;
      labelPadding?: number;
      grid?: boolean;
      ticks?: boolean;
      domain?: boolean;
      tooltipTitle?: string;
    };
    yAxisLeft?: {
      title?: string;
      labelColor?: string;
      titleColor?: string;
      labelFontSize?: number;
      gridColor?: string;
      gridDash?: number[];
      grid?: boolean;
      format?: string;
      tooltipTitle?: string;
    };
    yAxisRight?: {
      title?: string;
      labelColor?: string;
      titleColor?: string;
      labelFontSize?: number;
      gridColor?: string;
      gridDash?: number[];
      grid?: boolean;
      format?: string;
      scale?: any;
      tooltipTitle?: string;
    };
  };
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
}