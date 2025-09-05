// SpecCreator factory for creating chart specifications
import { ChartSpec, ChartConfig, LineChartParams, BarChartParams, PieChartParams, ScatterChartParams, MapChartParams, MultiTypeChartParams } from './types/interfaces';
import { createMultiLineLabelSpec } from './line/multiLineLabelSpec';
import { createMultiLineLabelWithMeanSpec, LineChartWithMeanParams } from './line/multiLineLabelWithMeanSpec';
import { createMultiLineLabelWithThresholdSpec, LineChartWithThresholdParams } from './line/multiLineLabelWithThresholdSpec';
import { createDivergingBarSpec } from './bar/divergingBarSpec';
import { createHorizontalBarSpec } from './bar/horizontalBarSpec';
import { createHorizontalBarWithMeanSpec, BarChartWithMeanParams } from './bar/horizontalBarWithMeanSpec';
import { createHorizontalBarWithThresholdSpec, BarChartWithThresholdParams } from './bar/horizontalBarWithThresholdSpec';
import { createInteractivePieSpec } from './pie/interactivePieSpec';
import { createBubblePlotScatterSpec } from './scatter/bubblePlotScatterSpec';
import { createWorldInteractiveMapSpec, createCountryDetailMapSpec } from './map/worldInteractiveMapSpec';
import { createBarChartWithLineSpec } from './multiType/barChartWithLineSpec';
import { createBarChartWithLineAndMeanSpec, MultiTypeChartWithMeanParams } from './multiType/barChartWithLineAndMeanSpec';
import { createBarChartWithLineAndThresholdSpec, MultiTypeChartWithThresholdParams } from './multiType/barChartWithLineAndThresholdSpec';
import { createMultiTypeSameYAxisSpec, MultiTypeSameYAxisParams } from './multiType/multiTypeSameYAxisSpec';

export class SpecCreator {
  /**
   * Create a chart specification based on type and configuration
   */
  static create(spec: ChartSpec): any {
    switch (spec.type) {
      case 'line':
        return SpecCreator.createLineChart(spec.subtype, spec.data, spec.config);
      case 'bar':
        return SpecCreator.createBarChart(spec.subtype, spec.data, spec.config);
      case 'pie':
        return SpecCreator.createPieChart(spec.subtype, spec.data, spec.config);
      case 'scatter':
        return SpecCreator.createScatterChart(spec.subtype, spec.data, spec.config);
      case 'map':
        return SpecCreator.createMapChart(spec.subtype, spec.data, spec.config);
      case 'multiType':
        return SpecCreator.createMultiTypeChart(spec.subtype, spec.data, spec.config);
      default:
        throw new Error(`Unsupported chart type: ${spec.type}`);
    }
  }

  /**
   * Create line chart specifications
   */
  private static createLineChart(subtype: string, data: any[], config: ChartConfig): any {
    switch (subtype) {
      case 'multiLineLabelSpec':
        return SpecCreator.createMultiLineLabelChart(data, config);
      case 'lineChartWithMean':
        return SpecCreator.createLineChartWithMean(data, config);
      case 'lineChartWithThreshold':
        return SpecCreator.createLineChartWithThreshold(data, config);
      case 'multiLineSpec':
        // TODO: Implement basic multi-line chart (without labels)
        throw new Error(`Line chart subtype "${subtype}" not yet implemented`);
      default:
        throw new Error(`Unsupported line chart subtype: ${subtype}`);
    }
  }

  /**
   * Create multi-line chart with hover labels
   */
  private static createMultiLineLabelChart(data: any[], config: ChartConfig): any {
    const params: LineChartParams = {
      data,
      xField: config.fields.x || config.fields.date || 'date',
      yField: config.fields.y || config.fields.value || 'value',
      seriesField: config.fields.series || 'series',
      colors: config.styling.colors,
      width: config.dimensions.width,
      height: config.dimensions.height,
      background: config.styling.background || 'transparent',
      xAxisConfig: config.styling.axes?.xAxis,
      yAxisConfig: config.styling.axes?.yAxis,
      legend: config.legend,
      dateFormat: config.styling.axes?.xAxis?.format || '%Y-%m',
      yFormat: config.styling.axes?.yAxis?.format || '$,.0f',
      interactions: config.interactions ? {
        hover: config.interactions.hover !== false,
        labels: config.interactions.labels !== false
      } : { hover: true, labels: true }
    };

    return createMultiLineLabelSpec(params);
  }

  /**
   * Create line chart with mean line
   */
  private static createLineChartWithMean(data: any[], config: ChartConfig): any {
    const params: LineChartWithMeanParams = {
      data,
      xField: config.fields.x || config.fields.date || 'date',
      yField: config.fields.y || config.fields.value || 'value',
      seriesField: config.fields.series || 'series',
      colors: config.styling.colors,
      width: config.dimensions.width,
      height: config.dimensions.height,
      background: config.styling.background || 'transparent',
      xAxisConfig: config.styling.axes?.xAxis,
      yAxisConfig: config.styling.axes?.yAxis,
      legend: config.legend,
      dateFormat: config.styling.axes?.xAxis?.format || '%Y-%m',
      yFormat: config.styling.axes?.yAxis?.format || '$,.0f',
      interactions: config.interactions ? {
        hover: config.interactions.hover !== false,
        labels: config.interactions.labels !== false
      } : { hover: true, labels: true },
      meanValue: (config.styling as any).meanValue,
      meanColor: (config.styling as any).meanColor,
      meanStrokeWidth: (config.styling as any).meanStrokeWidth,
      meanStrokeDash: (config.styling as any).meanStrokeDash,
      meanLabel: (config.styling as any).meanLabel,
      showMeanLabel: (config.styling as any).showMeanLabel
    };

    return createMultiLineLabelWithMeanSpec(params);
  }

  /**
   * Create line chart with threshold line
   */
  private static createLineChartWithThreshold(data: any[], config: ChartConfig): any {
    const params: LineChartWithThresholdParams = {
      data,
      xField: config.fields.x || config.fields.date || 'date',
      yField: config.fields.y || config.fields.value || 'value',
      seriesField: config.fields.series || 'series',
      colors: config.styling.colors,
      width: config.dimensions.width,
      height: config.dimensions.height,
      background: config.styling.background || 'transparent',
      xAxisConfig: config.styling.axes?.xAxis,
      yAxisConfig: config.styling.axes?.yAxis,
      legend: config.legend,
      dateFormat: config.styling.axes?.xAxis?.format || '%Y-%m',
      yFormat: config.styling.axes?.yAxis?.format || '$,.0f',
      interactions: config.interactions ? {
        hover: config.interactions.hover !== false,
        labels: config.interactions.labels !== false
      } : { hover: true, labels: true },
      thresholdValue: (config.styling as any).thresholdValue,
      thresholdColor: (config.styling as any).thresholdColor,
      thresholdStrokeWidth: (config.styling as any).thresholdStrokeWidth,
      thresholdStrokeDash: (config.styling as any).thresholdStrokeDash,
      thresholdLabel: (config.styling as any).thresholdLabel,
      showThresholdLabel: (config.styling as any).showThresholdLabel,
      thresholdType: (config.styling as any).thresholdType
    };

    return createMultiLineLabelWithThresholdSpec(params);
  }

  /**
   * Helper method to transform cost timeline data for multi-line format
   */
  static transformCostTimelineData(data: any[]): any[] {
    return data.flatMap(d => [
      { 
        date: d.date, 
        year: d.year, 
        month: d.month, 
        cost: d.avgHotelPrice, 
        series: 'Hotel Cost', 
        destination: d.destination 
      },
      { 
        date: d.date, 
        year: d.year, 
        month: d.month, 
        cost: d.avgMealPrice, 
        series: 'Meal Cost', 
        destination: d.destination 
      },
      { 
        date: d.date, 
        year: d.year, 
        month: d.month, 
        cost: d.avgTransportCost, 
        series: 'Transport Cost', 
        destination: d.destination 
      }
    ]);
  }

  /**
   * Create bar chart specifications
   */
  private static createBarChart(subtype: string, data: any[], config: ChartConfig): any {
    switch (subtype) {
      case 'divergingBarSpec':
        return SpecCreator.createDivergingBarChart(data, config);
      case 'horizontalBarSpec':
        return SpecCreator.createHorizontalBarChart(data, config);
      case 'barChartWithMean':
        return SpecCreator.createBarChartWithMean(data, config);
      case 'barChartWithThreshold':
        return SpecCreator.createBarChartWithThreshold(data, config);
      default:
        throw new Error(`Unsupported bar chart subtype: ${subtype}`);
    }
  }

  /**
   * Create diverging bar chart
   */
  private static createDivergingBarChart(data: any[], config: ChartConfig): any {
    const params: BarChartParams = {
      data,
      categoryField: config.fields.category || 'category',
      positiveField: config.fields.value ? `${config.fields.value}_positive` : 'positiveValue',
      negativeField: config.fields.value ? `${config.fields.value}_negative` : 'negativeValue',
      positiveLabel: config.fields.positiveLabel || (config.fields.value ? `${config.fields.value}_positive` : 'positiveValue'),
      negativeLabel: config.fields.negativeLabel || (config.fields.value ? `${config.fields.value}_negative` : 'negativeValue'),
      colors: config.styling.colors,
      width: config.dimensions.width,
      height: config.dimensions.height,
      background: config.styling.background || 'transparent',
      orientation: 'horizontal',
      xAxisConfig: config.styling.axes?.xAxis,
      yAxisConfig: config.styling.axes?.yAxis,
      legend: config.legend,
      tooltip: config.tooltip,
      interactions: config.interactions
    };

    return createDivergingBarSpec(params);
  }

  /**
   * Create horizontal bar chart
   */
  private static createHorizontalBarChart(data: any[], config: ChartConfig): any {
    const params: BarChartParams = {
      data,
      categoryField: config.fields.category || 'category',
      valueField: config.fields.value || 'value',
      colors: config.styling.colors,
      width: config.dimensions.width,   // Pass through actual config dimensions
      height: config.dimensions.height, // Pass through actual config dimensions
      background: config.styling.background || 'transparent',
      orientation: 'horizontal',
      xAxisConfig: config.styling.axes?.xAxis,
      yAxisConfig: config.styling.axes?.yAxis,
      legend: config.legend,
      tooltip: config.tooltip,
      interactions: config.interactions
    };

    return createHorizontalBarSpec(params);
  }

  /**
   * Create horizontal bar chart with mean line
   */
  private static createBarChartWithMean(data: any[], config: ChartConfig): any {
    const params: BarChartWithMeanParams = {
      data,
      categoryField: config.fields.category || 'category',
      valueField: config.fields.value || 'value',
      colors: config.styling.colors,
      width: config.dimensions.width,   // Pass through actual config dimensions
      height: config.dimensions.height, // Pass through actual config dimensions
      background: config.styling.background || 'transparent',
      orientation: 'horizontal',
      xAxisConfig: config.styling.axes?.xAxis,
      yAxisConfig: config.styling.axes?.yAxis,
      legend: config.legend,
      tooltip: config.tooltip,
      interactions: config.interactions,
      meanValue: (config.styling as any).meanValue,
      meanColor: (config.styling as any).meanColor,
      meanStrokeWidth: (config.styling as any).meanStrokeWidth,
      meanStrokeDash: (config.styling as any).meanStrokeDash,
      meanLabel: (config.styling as any).meanLabel,
      showMeanLabel: (config.styling as any).showMeanLabel
    };

    return createHorizontalBarWithMeanSpec(params);
  }

  /**
   * Create horizontal bar chart with threshold line
   */
  private static createBarChartWithThreshold(data: any[], config: ChartConfig): any {
    const params: BarChartWithThresholdParams = {
      data,
      categoryField: config.fields.category || 'category',
      valueField: config.fields.value || 'value',
      colors: config.styling.colors,
      width: config.dimensions.width,   // Pass through actual config dimensions
      height: config.dimensions.height, // Pass through actual config dimensions
      background: config.styling.background || 'transparent',
      orientation: 'horizontal',
      xAxisConfig: config.styling.axes?.xAxis,
      yAxisConfig: config.styling.axes?.yAxis,
      legend: config.legend,
      tooltip: config.tooltip,
      interactions: config.interactions,
      thresholdValue: (config.styling as any).thresholdValue,
      thresholdColor: (config.styling as any).thresholdColor,
      thresholdStrokeWidth: (config.styling as any).thresholdStrokeWidth,
      thresholdStrokeDash: (config.styling as any).thresholdStrokeDash,
      thresholdLabel: (config.styling as any).thresholdLabel,
      showThresholdLabel: (config.styling as any).showThresholdLabel
    };

    return createHorizontalBarWithThresholdSpec(params);
  }

  /**
   * Create pie chart specifications
   */
  private static createPieChart(subtype: string, data: any[], config: ChartConfig): any {
    switch (subtype) {
      case 'interactivePieSpec':
        return SpecCreator.createInteractivePieChart(data, config);
      default:
        throw new Error(`Unsupported pie chart subtype: ${subtype}`);
    }
  }

  /**
   * Create interactive pie chart
   */
  private static createInteractivePieChart(data: any[], config: ChartConfig): any {
    const params: PieChartParams = {
      data,
      categoryField: config.fields.category || 'category',
      valueField: config.fields.value || 'value',
      colors: config.styling.colors,
      width: config.dimensions.width,
      height: config.dimensions.height,
      background: config.styling.background || 'transparent',
      innerRadius: 42, // Default for donut chart
      outerRadius: 60,
      legend: config.legend,
      tooltip: config.tooltip,
      interactions: config.interactions,
      showCenterText: true
    };

    return createInteractivePieSpec(data, params);
  }

  /**
   * Create scatter chart specifications
   */
  private static createScatterChart(subtype: string, data: any[], config: ChartConfig): any {
    switch (subtype) {
      case 'bubblePlotScatterSpec':
        return SpecCreator.createBubblePlotScatterChart(data, config);
      default:
        throw new Error(`Unsupported scatter chart subtype: ${subtype}`);
    }
  }

  /**
   * Create bubble plot scatter chart
   */
  private static createBubblePlotScatterChart(data: any[], config: ChartConfig): any {
    const params: ScatterChartParams = {
      data,
      xField: config.fields.x || 'x',
      yField: config.fields.y || 'y',
      sizeField: config.fields.size,
      colorField: config.fields.color,
      colors: config.styling.colors,
      width: config.dimensions.width,
      height: config.dimensions.height,
      background: config.styling.background || 'transparent',
      xAxisConfig: config.styling.axes?.xAxis,
      yAxisConfig: config.styling.axes?.yAxis,
      legend: config.legend,
      sizeLegend: config.sizeLegend,
      colorLegend: config.colorLegend,
      tooltip: config.tooltip,
      sizeRange: [200, 800],
      sizeDomain: config.styling.sizeDomain || [50, 100],
      interactions: config.interactions
    };

    return createBubblePlotScatterSpec(data, params);
  }

  /**
   * Create map chart specifications
   */
  private static createMapChart(subtype: string, data: any[], config: ChartConfig): any {
    switch (subtype) {
      case 'worldInteractiveMapSpec':
        return SpecCreator.createWorldInteractiveMap(data, config);
      case 'countryDetailMapSpec':
        return SpecCreator.createCountryDetailMap(data, config);
      default:
        throw new Error(`Unsupported map chart subtype: ${subtype}`);
    }
  }

  /**
   * Create interactive world map
   */
  private static createWorldInteractiveMap(data: any[], config: ChartConfig): any {
    const params: MapChartParams & { options?: any } = {
      data,
      geoData: config.fields.geoData,
      width: config.dimensions.width,
      height: config.dimensions.height,
      background: config.styling.background || 'transparent',
      projection: (config.styling as any).projection || 'naturalEarth1',
      colors: config.styling.colors || ["#d1d5db", "#a78bfa", "#8b5a87"],
      tooltip: config.tooltip,
      legend: config.legend,
      interactions: config.interactions,
      options: {
        selectableCountries: (config.fields as any).selectableCountries,
        countryField: (config.fields as any).countryField || 'properties.NAME'
      }
    };

    return createWorldInteractiveMapSpec(params);
  }

  /**
   * Create country detail map
   */
  private static createCountryDetailMap(data: any[], config: ChartConfig): any {
    // Extract country name from config or data
    const selectedCountry = config.fields.selectedCountry || (data.length > 0 ? data[0].country : 'United States');
    
    const params: MapChartParams = {
      data,
      geoData: config.fields.geoData,
      width: config.dimensions.width,
      height: config.dimensions.height,
      background: config.styling.background || 'transparent',
      projection: 'naturalEarth1',
      colors: config.styling.colors || ["#8B5CF6"],
      tooltip: config.tooltip,
      legend: config.legend,
      interactions: config.interactions
    };

    return createCountryDetailMapSpec(selectedCountry, params);
  }

  /**
   * Create multi-type chart specifications
   */
  private static createMultiTypeChart(subtype: string, data: any[], config: ChartConfig): any {
    switch (subtype) {
      case 'barChartWithLineSpec':
        return SpecCreator.createBarChartWithLine(data, config);
      case 'multiTypeWithMean':
        return SpecCreator.createMultiTypeChartWithMean(data, config);
      case 'multiTypeWithThreshold':
        return SpecCreator.createMultiTypeChartWithThreshold(data, config);
      case 'multiType_same_y_diff_type':
        return SpecCreator.createMultiTypeSameYAxis(data, config);
      default:
        throw new Error(`Unsupported multi-type chart subtype: ${subtype}`);
    }
  }

  /**
   * Create bar chart with line combination
   */
  private static createBarChartWithLine(data: any[], config: ChartConfig): any {
    const params: MultiTypeChartParams = {
      data,
      dimensions: { 
        width: config.dimensions.width, 
        height: config.dimensions.height 
      },
      fields: {
        x: config.fields.x || 'x',
        xType: 'ordinal',
        yBar: config.fields.y || 'yBar',
        yLine: config.fields.series || 'yLine',
        colorField: config.fields.color
      },
      styling: {
        background: config.styling.background || 'transparent',
        colors: config.styling.colors,
        colorDomain: config.styling.marks?.opacity ? ['Low', 'Shoulder', 'High'] : undefined,
        lineColor: '#8b5cf6',
        lineWidth: 2,
        cornerRadius: 2
      },
      interactions: {
        hoverParam: 'hover_flow',
        hoverOn: 'pointerover',
        hoverClear: 'pointerout',
        hoverOpacity: 0.8,
        defaultOpacity: 0.6
      },
      axes: {
        xAxis: {
          labelColor: config.styling.axes?.xAxis?.labelColor,
          titleColor: config.styling.axes?.xAxis?.titleColor,
          labelFontSize: config.styling.axes?.xAxis?.labelFontSize,
          title: config.styling.axes?.xAxis?.title || undefined,
          grid: config.styling.axes?.xAxis?.grid,
          ticks: config.styling.axes?.xAxis?.ticks,
          domain: config.styling.axes?.xAxis?.domain
        },
        yAxisLeft: {
          labelColor: config.styling.axes?.yAxis?.labelColor,
          titleColor: config.styling.axes?.yAxis?.titleColor,
          labelFontSize: config.styling.axes?.yAxis?.labelFontSize,
          gridColor: config.styling.axes?.yAxis?.gridColor,
          gridDash: config.styling.axes?.yAxis?.gridDash,
          grid: config.styling.axes?.yAxis?.grid,
          format: config.styling.axes?.yAxis?.format,
          title: config.styling.axes?.yAxis?.title || undefined
        },
        yAxisRight: {
          title: 'Occupancy Rate (%)',
          scale: { domain: [0, 100] },
          format: '.2s',
          tooltipTitle: 'Occupancy Rate'
        }
      },
      legend: config.legend,
      tooltip: config.tooltip
    };

    return createBarChartWithLineSpec(params);
  }

  /**
   * Create multi-type chart with mean line
   */
  private static createMultiTypeChartWithMean(data: any[], config: ChartConfig): any {
    const params: MultiTypeChartWithMeanParams = {
      data,
      dimensions: { 
        width: config.dimensions.width, 
        height: config.dimensions.height 
      },
      fields: {
        x: config.fields.x || 'x',
        xType: 'ordinal',
        yBar: config.fields.y || 'yBar',
        yLine: config.fields.series || 'yLine',
        colorField: config.fields.color
      },
      styling: {
        background: config.styling.background || 'transparent',
        colors: config.styling.colors,
        colorDomain: config.styling.marks?.opacity ? ['Low', 'Shoulder', 'High'] : undefined,
        lineColor: '#8b5cf6',
        lineWidth: 2,
        cornerRadius: 2
      },
      interactions: {
        hoverParam: 'hover_flow',
        hoverOn: 'pointerover',
        hoverClear: 'pointerout',
        hoverOpacity: 0.8,
        defaultOpacity: 0.6
      },
      axes: {
        xAxis: {
          labelColor: config.styling.axes?.xAxis?.labelColor,
          titleColor: config.styling.axes?.xAxis?.titleColor,
          labelFontSize: config.styling.axes?.xAxis?.labelFontSize,
          title: config.styling.axes?.xAxis?.title || undefined,
          grid: config.styling.axes?.xAxis?.grid,
          ticks: config.styling.axes?.xAxis?.ticks,
          domain: config.styling.axes?.xAxis?.domain
        },
        yAxisLeft: {
          labelColor: config.styling.axes?.yAxis?.labelColor,
          titleColor: config.styling.axes?.yAxis?.titleColor,
          labelFontSize: config.styling.axes?.yAxis?.labelFontSize,
          gridColor: config.styling.axes?.yAxis?.gridColor,
          gridDash: config.styling.axes?.yAxis?.gridDash,
          grid: config.styling.axes?.yAxis?.grid,
          format: config.styling.axes?.yAxis?.format,
          title: config.styling.axes?.yAxis?.title || undefined
        },
        yAxisRight: {
          title: 'Occupancy Rate (%)',
          scale: { domain: [0, 100] },
          format: '.2s',
          tooltipTitle: 'Occupancy Rate'
        }
      },
      legend: config.legend,
      tooltip: config.tooltip,
      meanValue: (config.styling as any).meanValue,
      meanField: (config.styling as any).meanField,
      meanColor: (config.styling as any).meanColor,
      meanStrokeWidth: (config.styling as any).meanStrokeWidth,
      meanStrokeDash: (config.styling as any).meanStrokeDash,
      meanLabel: (config.styling as any).meanLabel,
      showMeanLabel: (config.styling as any).showMeanLabel
    };

    return createBarChartWithLineAndMeanSpec(params);
  }

  /**
   * Create multi-type chart with threshold line
   */
  private static createMultiTypeChartWithThreshold(data: any[], config: ChartConfig): any {
    const params: MultiTypeChartWithThresholdParams = {
      data,
      dimensions: { 
        width: config.dimensions.width, 
        height: config.dimensions.height 
      },
      fields: {
        x: config.fields.x || 'x',
        xType: 'ordinal',
        yBar: config.fields.y || 'yBar',
        yLine: config.fields.series || 'yLine',
        colorField: config.fields.color
      },
      styling: {
        background: config.styling.background || 'transparent',
        colors: config.styling.colors,
        colorDomain: config.styling.marks?.opacity ? ['Low', 'Shoulder', 'High'] : undefined,
        lineColor: '#8b5cf6',
        lineWidth: 2,
        cornerRadius: 2
      },
      interactions: {
        hoverParam: 'hover_flow',
        hoverOn: 'pointerover',
        hoverClear: 'pointerout',
        hoverOpacity: 0.8,
        defaultOpacity: 0.6
      },
      axes: {
        xAxis: {
          labelColor: config.styling.axes?.xAxis?.labelColor,
          titleColor: config.styling.axes?.xAxis?.titleColor,
          labelFontSize: config.styling.axes?.xAxis?.labelFontSize,
          title: config.styling.axes?.xAxis?.title || undefined,
          grid: config.styling.axes?.xAxis?.grid,
          ticks: config.styling.axes?.xAxis?.ticks,
          domain: config.styling.axes?.xAxis?.domain
        },
        yAxisLeft: {
          labelColor: config.styling.axes?.yAxis?.labelColor,
          titleColor: config.styling.axes?.yAxis?.titleColor,
          labelFontSize: config.styling.axes?.yAxis?.labelFontSize,
          gridColor: config.styling.axes?.yAxis?.gridColor,
          gridDash: config.styling.axes?.yAxis?.gridDash,
          grid: config.styling.axes?.yAxis?.grid,
          format: config.styling.axes?.yAxis?.format,
          title: config.styling.axes?.yAxis?.title || undefined
        },
        yAxisRight: {
          title: 'Occupancy Rate (%)',
          scale: { domain: [0, 100] },
          format: '.2s',
          tooltipTitle: 'Occupancy Rate'
        }
      },
      legend: config.legend,
      tooltip: config.tooltip,
      thresholdValue: (config.styling as any).thresholdValue,
      thresholdField: (config.styling as any).thresholdField,
      thresholdColor: (config.styling as any).thresholdColor,
      thresholdStrokeWidth: (config.styling as any).thresholdStrokeWidth,
      thresholdStrokeDash: (config.styling as any).thresholdStrokeDash,
      thresholdLabel: (config.styling as any).thresholdLabel,
      showThresholdLabel: (config.styling as any).showThresholdLabel
    };

    return createBarChartWithLineAndThresholdSpec(params);
  }

  /**
   * Create multi-type chart with same Y axis
   */
  private static createMultiTypeSameYAxis(data: any[], config: ChartConfig): any {
    const params: MultiTypeSameYAxisParams = {
      data,
      dimensions: { 
        width: config.dimensions.width, 
        height: config.dimensions.height 
      },
      fields: {
        x: config.fields.x || 'x',
        xType: 'ordinal',
        yBar: config.fields.y || 'yBar',
        yLine: config.fields.series || 'yLine',
        colorField: config.fields.color
      },
      styling: {
        background: config.styling.background || 'transparent',
        colors: config.styling.colors,
        colorDomain: config.styling.marks?.opacity ? ['Low', 'Shoulder', 'High'] : undefined,
        lineColor: '#8b5cf6',
        lineWidth: 2,
        cornerRadius: 2
      },
      interactions: {
        hoverParam: 'hover_flow',
        hoverOn: 'pointerover',
        hoverClear: 'pointerout',
        hoverOpacity: 0.8,
        defaultOpacity: 0.6
      },
      axes: {
        xAxis: {
          labelColor: config.styling.axes?.xAxis?.labelColor,
          titleColor: config.styling.axes?.xAxis?.titleColor,
          labelFontSize: config.styling.axes?.xAxis?.labelFontSize,
          title: config.styling.axes?.xAxis?.title || undefined,
          grid: config.styling.axes?.xAxis?.grid,
          ticks: config.styling.axes?.xAxis?.ticks,
          domain: config.styling.axes?.xAxis?.domain
        },
        yAxisLeft: {
          labelColor: config.styling.axes?.yAxis?.labelColor,
          titleColor: config.styling.axes?.yAxis?.titleColor,
          labelFontSize: config.styling.axes?.yAxis?.labelFontSize,
          gridColor: config.styling.axes?.yAxis?.gridColor,
          gridDash: config.styling.axes?.yAxis?.gridDash,
          grid: config.styling.axes?.yAxis?.grid,
          format: config.styling.axes?.yAxis?.format,
          title: config.styling.axes?.yAxis?.title || undefined
        }
      },
      legend: config.legend,
      tooltip: config.tooltip
    };

    return createMultiTypeSameYAxisSpec(params);
  }
}
