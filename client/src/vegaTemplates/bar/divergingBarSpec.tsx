// Diverging bar chart template for comparing two metrics across categories
import { BarChartParams } from '../types/interfaces';

export const createDivergingBarSpec = (params: BarChartParams) => {
  const {
    data,
    categoryField,
    positiveField = 'positiveValue',
    negativeField = 'negativeValue',
    positiveLabel = positiveField,
    negativeLabel = negativeField,
    colors = ['#ef4444', '#f59e0b'],
    width = 450,
    height = 170,
    background = 'transparent',
    xAxisConfig = {},
    yAxisConfig = {},
    legend = {},
    interactions = { hover: true, select: true }
  } = params;

  if (!positiveField || !negativeField) {
    throw new Error('Both positiveField and negativeField are required for diverging bar chart');
  }

  // Sort data by positive values in descending order and add index
  const sortedData = data
    .sort((a: any, b: any) => (b[positiveField] as number) - (a[positiveField] as number))
    .map((d: any, index: number) => ({ ...d, sortIndex: index }));

  // Default axis configurations
  const defaultXAxis = {
    labelColor: '#888',
    titleColor: '#888',
    labelFontSize: 8,
    grid: true,
    gridColor: '#888',
    gridDash: [2, 2],
    ticks: true,
    domain: true,
    title: null,
    format: 's',
    ...xAxisConfig
  };

  // Default legend configuration
  const defaultLegend = {
    title: null,
    direction: 'horizontal',
    orient: 'top',
    titleColor: '#888',
    labelColor: '#888',
    titleFontSize: 10,
    labelFontSize: 9,
    symbolSize: 80,
    offset: 5,
    ...legend
  };

  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json' as const,
    width,
    height,
    background,
    data: {
      values: sortedData
    },
    transform: [
      { calculate: `datum.${positiveField}`, as: `${positiveField}_positive` },
      { calculate: `-datum.${negativeField}`, as: `${negativeField}_negative` }
    ],
    layer: [
      {
        ...(interactions.hover || interactions.select ? {
          params: [
            ...(interactions.hover ? [{
              name: 'hover_safety_bar',
              select: {
                type: 'point' as const,
                on: 'pointerover' as const,
                clear: 'pointerout' as const
              }
            }] : []),
            ...(interactions.select ? [{
              name: 'select_safety',
              select: 'point' as const
            }] : [])
          ]
        } : {}),
        transform: [
          { fold: [`${positiveField}_positive`, `${negativeField}_negative`], as: ['risk_type', 'risk_value'] },
          { 
            calculate: `datum.risk_type == '${positiveField}_positive' ? '${positiveLabel}' : '${negativeLabel}'`, 
            as: 'riskLabel' 
          },
          { calculate: 'abs(datum.risk_value)', as: 'absolute_risk' }
        ],
        mark: {
          type: 'bar' as const,
          cursor: 'pointer' as const,
          cornerRadiusEnd: 2
        },
        encoding: {
          y: {
            field: categoryField,
            type: 'nominal' as const,
            scale: {
              domain: sortedData.map((d: any) => d[categoryField] as string)
            },
            axis: null
          },
          x: {
            field: 'risk_value',
            type: 'quantitative' as const,
            axis: defaultXAxis
          },
          color: {
            field: 'riskLabel',
            type: 'nominal' as const,
            scale: {
              domain: [positiveLabel, negativeLabel],
              range: colors
            },
            legend: defaultLegend
          },
          stroke: {
            value: '#ffffff'
          },
          strokeWidth: {
            condition: [
              ...(interactions.select ? [{
                param: 'select_safety',
                empty: false,
                value: 1
              }] : []),
              ...(interactions.hover ? [{
                param: 'hover_safety_bar',
                empty: false,
                value: 1
              }] : [])
            ],
            value: 0
          },
          opacity: {
            condition: [
              ...(interactions.select ? [{
                param: 'select_safety',
                empty: false,
                value: 1
              }] : []),
              ...(interactions.hover ? [{
                param: 'hover_safety_bar',
                empty: false,
                value: 0.8
              }] : [])
            ],
            value: 0.7
          },
          tooltip: [
            { field: categoryField, type: 'nominal' as const, title: 'Category' },
            { field: 'riskLabel', type: 'nominal' as const, title: 'Metric Type' },
            { 
              field: 'absolute_risk', 
              type: 'quantitative' as const, 
              title: 'Value', 
              format: '.1f' 
            }
          ]
        }
      },
      {
        mark: {
          type: 'text' as const,
          align: 'center' as const,
          baseline: 'middle' as const,
          dx: width * 0.5,
          dy: 0,
          fontSize: 9,
          fontWeight: 'bold' as const,
          color: '#444'
        },
        encoding: {
          y: {
            field: categoryField,
            type: 'nominal' as const,
            scale: {
              domain: sortedData.map((d: any) => d[categoryField] as string)
            }
          },
          x: {
            value: 0
          },
          text: {
            field: categoryField,
            type: 'nominal' as const
          }
        }
      }
    ],
    config: {
      background: 'transparent',
      view: {
        stroke: null
      }
    }
  };
};