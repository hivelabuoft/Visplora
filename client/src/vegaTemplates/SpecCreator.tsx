// SpecCreator factory for creating chart specifications
import { ChartSpec, ChartConfig, LineChartParams } from './types/interfaces';
import { createMultiLineLabelSpec } from './line/multiLineLabelSpec';

export class SpecCreator {
  /**
   * Create a chart specification based on type and configuration
   */
  static create(spec: ChartSpec): any {
    switch (spec.type) {
      case 'line':
        return SpecCreator.createLineChart(spec.subtype, spec.data, spec.config);
      case 'bar':
        // TODO: Implement bar chart creation
        throw new Error(`Bar chart subtype "${spec.subtype}" not yet implemented`);
      case 'pie':
        // TODO: Implement pie chart creation
        throw new Error(`Pie chart subtype "${spec.subtype}" not yet implemented`);
      case 'scatter':
        // TODO: Implement scatter chart creation
        throw new Error(`Scatter chart subtype "${spec.subtype}" not yet implemented`);
      case 'map':
        // TODO: Implement map chart creation
        throw new Error(`Map chart subtype "${spec.subtype}" not yet implemented`);
      case 'multiType':
        // TODO: Implement multi-type chart creation
        throw new Error(`Multi-type chart subtype "${spec.subtype}" not yet implemented`);
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
}
