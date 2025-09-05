// Horizontal bar chart with mean line template
import { BarChartParams } from '../types/interfaces';

export interface BarChartWithMeanParams extends BarChartParams {
  meanValue?: number;
  meanColor?: string;
  meanStrokeWidth?: number;
  meanStrokeDash?: number[];
  meanLabel?: string;
  showMeanLabel?: boolean;
}

export const createHorizontalBarWithMeanSpec = (params: BarChartWithMeanParams) => {
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
    meanValue,
    meanColor = '#ef4444',
    meanStrokeWidth = 2,
    meanStrokeDash = [4, 4],
    meanLabel = 'Mean',
    showMeanLabel = true
  } = params;

  // Calculate mean value from data if not provided
  const calculatedMeanValue = meanValue ?? (data.length > 0 ? 
    data.reduce((sum: number, d: any) => sum + (d[valueField] as number), 0) / data.length : 0);

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

  // Create color scale based on data
  const colorField = data[0]?.change !== undefined ? 'change' : 
                     data[0]?.percentage !== undefined ? 'percentage' : 
                     valueField;

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
      values: sortedData
    },
    layer: [
      // Mean line layer
      {
        data: { values: [{}] },
        mark: {
          type: 'rule' as const,
          color: meanColor,
          strokeWidth: meanStrokeWidth,
          strokeDash: meanStrokeDash
        },
        encoding: {
          ...(orientation === 'horizontal' ? {
            x: {
              datum: calculatedMeanValue,
              type: 'quantitative' as const
            }
          } : {
            y: {
              datum: calculatedMeanValue,
              type: 'quantitative' as const
            }
          }),
          tooltip: [
            { field: 'datum', type: 'quantitative' as const, title: meanLabel, format: defaultXAxis.format }
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
            { field: valueField, type: 'quantitative' as const, title: 'Value', format: ',.0f' }
          ]
        }
      },
      // Mean label layer (optional)
      ...(showMeanLabel ? [{
        data: { values: [{ meanValue: calculatedMeanValue, meanLabel }] },
        mark: {
          type: 'text' as const,
          align: 'left' as const,
          dx: 5,
          dy: -5,
          color: meanColor,
          fontSize: 10,
          fontWeight: 'bold' as const
        },
        encoding: {
          ...(orientation === 'horizontal' ? {
            x: {
              field: 'meanValue',
              type: 'quantitative' as const
            },
            y: { value: 10 }
          } : {
            y: {
              field: 'meanValue',
              type: 'quantitative' as const
            },
            x: { value: width - 10 }
          }),
          text: { 
            field: 'meanLabel', 
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