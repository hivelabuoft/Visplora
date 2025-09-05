// Multi-line chart with hover labels template
import { LineChartParams } from '../types/interfaces';

export const createMultiLineLabelSpec = (params: LineChartParams) => {
  const {
    data,
    xField,
    yField,
    seriesField = 'series',
    colors = ['#aea630ff', '#3b82f6', '#16a34a'],
    width = 380,
    height = 200,
    background = 'transparent',
    xAxisConfig = {},
    yAxisConfig = {},
    legend = {},
    dateFormat = '%Y-%m',
    yFormat = '$,.0f',
    interactions = { hover: true, labels: true }
  } = params;

  // Default axis configurations
  const defaultXAxis = {
    labelColor: '#888',
    titleColor: '#888',
    labelFontSize: 8,
    labelAngle: -45,
    grid: false,
    ticks: true,
    domain: true,
    title: null,
    format: dateFormat,
    ...xAxisConfig
  };

  const defaultYAxis = {
    labelColor: '#888',
    titleColor: '#888',
    labelFontSize: 8,
    gridColor: '#888',
    gridDash: [2, 2],
    grid: true,
    ticks: true,
    domain: true,
    title: null,
    format: yFormat,
    ...yAxisConfig
  };

  // Default legend configuration
  const defaultLegend = {
    title: null,
    labelFontSize: 10,
    symbolSize: 80,
    orient: 'right' as const,
    padding: 10,
    offset: 0,
    symbolType: 'circle' as const,
    ...legend
  };

  // Build unique series domain from data
  const seriesDomain = [...new Set(data.map(d => d[seriesField] as string))].filter(Boolean);

  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json' as const,
    width,
    height,
    background,
    data: {
      values: data
    },
    layer: [
      {
        encoding: {
          x: {
            field: xField,
            type: 'temporal' as const,
            axis: defaultXAxis
          },
          y: {
            field: yField,
            type: 'quantitative' as const,
            axis: defaultYAxis
          },
          color: {
            field: seriesField,
            type: 'nominal' as const,
            scale: {
              domain: seriesDomain,
              range: colors.slice(0, seriesDomain.length)
            },
            legend: defaultLegend
          }
        },
        layer: [
          {
            mark: {
              type: 'line' as const,
              strokeWidth: 2,
              cursor: 'pointer' as const
            }
          },
          ...(interactions.hover ? [{
            params: [{
              name: 'label',
              select: {
                type: 'point' as const,
                encodings: ['x'] as ('x')[],
                nearest: true,
                on: 'pointerover' as const
              }
            }],
            mark: {
              type: 'point' as const,
              size: 40,
              cursor: 'pointer' as const
            },
            encoding: {
              opacity: {
                condition: {
                  param: 'label',
                  empty: false,
                  value: 1
                },
                value: 0
              }
            }
          }] : [])
        ]
      },
      ...(interactions.labels ? [{
        transform: [{ filter: { param: 'label', empty: false } }],
        layer: [
          {
            mark: { type: 'rule' as const, color: '#666', strokeWidth: 1 },
            encoding: {
              x: { type: 'temporal' as const, field: xField, aggregate: 'min' as const }
            }
          },
          {
            encoding: {
              text: { type: 'quantitative' as const, field: yField, format: yFormat },
              x: { type: 'temporal' as const, field: xField },
              y: { type: 'quantitative' as const, field: yField }
            },
            layer: [
              {
                mark: {
                  type: 'text' as const,
                  stroke: 'transparent',
                  strokeWidth: 3,
                  align: 'left' as const,
                  dx: 8,
                  dy: -8,
                  fontSize: 10,
                  fontWeight: 'bold' as const
                }
              },
              {
                mark: {
                  type: 'text' as const,
                  align: 'left' as const,
                  dx: 8,
                  dy: -8,
                  fontSize: 10,
                  fontWeight: 'bold' as const
                },
                encoding: {
                  color: { type: 'nominal' as const, field: seriesField }
                }
              }
            ]
          }
        ]
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