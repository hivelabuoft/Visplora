// Horizontal bar chart with threshold line template
import { BarChartParams } from '../types/interfaces';

export interface BarChartWithThresholdParams extends BarChartParams {
  thresholdValue: number;
  thresholdColor?: string;
  thresholdStrokeWidth?: number;
  thresholdStrokeDash?: number[];
  thresholdLabel?: string;
  showThresholdLabel?: boolean;
}

export const createHorizontalBarWithThresholdSpec = (params: BarChartWithThresholdParams) => {
  const {
    data,
    categoryField,
    valueField = 'value',
    colors = ['#94a3b8', '#3b82f6', '#16a34a'],
    width = 450,  // Updated default for better charts
    height = 200, // Updated default for better charts
    background = 'transparent',
    orientation = 'horizontal',
    xAxisConfig = {},
    yAxisConfig = {},
    legend = {},
    interactions = { hover: true, select: true },
    tooltip,
    thresholdValue,
    thresholdColor = '#dc2626',
    thresholdStrokeWidth = 2,
    thresholdStrokeDash = [6, 3],
    thresholdLabel = 'Threshold',
    showThresholdLabel = true
  } = params;

  // Sort data by value in descending order and add index
  const sortedData = data
    .sort((a: any, b: any) => (b[valueField] as number) - (a[valueField] as number))
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
    format: '.2s',
    ...xAxisConfig
  };

  const defaultYAxis = {
    labelColor: '#888',
    titleColor: '#888',
    labelFontSize: 10,
    labelLimit: 80,
    title: null,
    grid: false,
    ticks: true,
    domain: true,
    ...yAxisConfig
  };

  // Create color scale based on data - can color bars differently based on threshold
  const colorField = data[0]?.change !== undefined ? 'change' : 
                     data[0]?.percentage !== undefined ? 'percentage' : 
                     valueField;

  // Enhanced color scale that considers threshold for coloring
  const enhancedData = sortedData.map((d: any) => ({
    ...d,
    aboveThreshold: d[valueField] >= thresholdValue
  }));

  const colorScale = data[0]?.change !== undefined ? 
    { domain: [0, 15], range: colors } :
    data[0]?.percentage !== undefined ?
    { domain: [0, 100], range: [colors[0]] } :
    { range: [colors[0]] };

  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json' as const,
    width,
    height,
    background,
    data: {
      values: enhancedData
    },
    layer: [
      // Threshold line layer
      {
        data: { values: [{}] },
        mark: {
          type: 'rule' as const,
          color: thresholdColor,
          strokeWidth: thresholdStrokeWidth,
          strokeDash: thresholdStrokeDash
        },
        encoding: {
          ...(orientation === 'horizontal' ? {
            x: {
              datum: thresholdValue,
              type: 'quantitative' as const
            }
          } : {
            y: {
              datum: thresholdValue,
              type: 'quantitative' as const
            }
          }),
          tooltip: [
            { field: 'datum', type: 'quantitative' as const, title: thresholdLabel, format: defaultXAxis.format }
          ]
        }
      },
      // Bar chart layer
      {
        params: [
          ...(interactions.hover ? [{
            name: 'hover_bar',
            select: {
              type: 'point' as const,
              on: 'pointerover' as const,
              clear: 'pointerout' as const
            }
          }] : []),
          ...(interactions.select ? [{
            name: 'select_item',
            select: 'point' as const
          }] : [])
        ],
        mark: {
          type: 'bar' as const,
          cursor: 'pointer' as const,
          cornerRadiusEnd: orientation === 'horizontal' ? 2 : undefined,
          height: orientation === 'horizontal' ? 12 : undefined
        },
        encoding: {
          ...(orientation === 'horizontal' ? {
            y: {
              field: categoryField,
              type: 'nominal' as const,
              sort: {
                field: valueField,
                order: 'descending' as const
              },
              axis: defaultYAxis
            },
            x: {
              field: valueField,
              type: 'quantitative' as const,
              ...(defaultXAxis.scale && { scale: defaultXAxis.scale }),
              axis: defaultXAxis
            }
          } : {
            x: {
              field: categoryField,
              type: 'nominal' as const,
              sort: {
                field: valueField,
                order: 'descending' as const
              },
              axis: defaultYAxis
            },
            y: {
              field: valueField,
              type: 'quantitative' as const,
              ...(defaultXAxis.scale && { scale: defaultXAxis.scale }),
              axis: defaultXAxis
            }
          }),
          color: {
            field: colorField,
            type: data[0]?.percentage !== undefined ? 'nominal' as const : 'quantitative' as const,
            legend: legend.title !== null ? legend : null
          },
          stroke: {
            condition: [
              ...(interactions.select ? [{
                param: 'select_item',
                empty: false,
                value: '#272729'
              }] : []),
              ...(interactions.hover ? [{
                param: 'hover_bar',
                empty: false,
                value: '#272729'
              }] : [])
            ],
            value: 'transparent'
          },
          strokeWidth: {
            condition: [
              ...(interactions.select ? [{
                param: 'select_item',
                empty: false,
                value: 1
              }] : []),
              ...(interactions.hover ? [{
                param: 'hover_bar',
                empty: false,
                value: 1
              }] : [])
            ],
            value: 0
          },
          opacity: {
            condition: [
              ...(interactions.select ? [{
                param: 'select_item',
                empty: false,
                value: 1
              }] : []),
              ...(interactions.hover ? [{
                param: 'hover_bar',
                empty: false,
                value: 0.8
              }] : [])
            ],
            value: 0.6
          },
          tooltip: tooltip?.fields || [
            { field: categoryField, type: 'nominal' as const, title: 'Category' },
            { field: valueField, type: 'quantitative' as const, title: 'Value', format: ',.0f' },
            { field: 'aboveThreshold', type: 'nominal' as const, title: 'Above Threshold' }
          ]
        }
      },
      // Threshold label layer (optional)
      ...(showThresholdLabel ? [{
        data: { values: [{ thresholdValue, thresholdLabel }] },
        mark: {
          type: 'text' as const,
          align: 'left' as const,
          dx: 5,
          dy: -5,
          color: thresholdColor,
          fontSize: 10,
          fontWeight: 'bold' as const
        },
        encoding: {
          ...(orientation === 'horizontal' ? {
            x: {
              field: 'thresholdValue',
              type: 'quantitative' as const
            },
            y: { value: 10 }
          } : {
            y: {
              field: 'thresholdValue',
              type: 'quantitative' as const
            },
            x: { value: width - 10 }
          }),
          text: { 
            field: 'thresholdLabel', 
            type: 'nominal' as const 
          }
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