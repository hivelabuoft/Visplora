import { ScatterChartParams } from '../types/interfaces';

export interface ScatterChartData {
  [key: string]: string | number | undefined;
}

/**
 * Creates an interactive bubble/scatter plot with size and color encoding
 * Based on environmentalQualityScatterSpec pattern with hover and selection interactions
 */
export function createBubblePlotScatterSpec(
  data: ScatterChartData[],
  params: ScatterChartParams
): any {
  const {
    xField,
    yField,
    sizeField,
    colorField,
    width = 360,
    height = 120,
    background = "transparent",
    colors,
    xAxisConfig,
    yAxisConfig,
    legend,
    sizeLegend,
    colorLegend,
    tooltip,
    sizeRange = [200, 800],
    sizeDomain = [50, 100],
    interactions
  } = params;

  // Build parameters for interactions
  const vegaParams: any[] = [];
  
  if (interactions?.hover !== false) {
    vegaParams.push({
      name: "hover_scatter",
      select: {
        type: "point",
        on: "pointerover",
        clear: "pointerout"
      }
    });
  }

  if (interactions?.select !== false) {
    vegaParams.push({
      name: "select_point",
      select: {
        type: "point"
      }
    });
  }

  // Build encoding object
  const encoding: any = {
    x: {
      field: xField,
      type: "quantitative",
      ...(xAxisConfig && {
        scale: xAxisConfig.scale,
        axis: {
          labelColor: xAxisConfig.labelColor || "#888",
          titleColor: xAxisConfig.titleColor || "#888",
          labelFontSize: xAxisConfig.labelFontSize || 8,
          titleFontSize: xAxisConfig.titleFontSize || 10,
          grid: xAxisConfig.grid !== false,
          gridColor: xAxisConfig.gridColor || "#888",
          gridDash: xAxisConfig.gridDash || [4, 10],
          ticks: xAxisConfig.ticks !== false,
          domain: xAxisConfig.domain !== false,
          title: xAxisConfig.title || xField,
          format: xAxisConfig.format
        }
      })
    },
    y: {
      field: yField,
      type: "quantitative",
      ...(yAxisConfig && {
        scale: yAxisConfig.scale,
        axis: {
          labelColor: yAxisConfig.labelColor || "#888",
          titleColor: yAxisConfig.titleColor || "#888",
          labelFontSize: yAxisConfig.labelFontSize || 8,
          titleFontSize: yAxisConfig.titleFontSize || 10,
          grid: yAxisConfig.grid !== false,
          gridColor: yAxisConfig.gridColor || "#888",
          gridDash: yAxisConfig.gridDash || [4, 50],
          ticks: yAxisConfig.ticks !== false,
          domain: yAxisConfig.domain !== false,
          title: yAxisConfig.title || yField,
          format: yAxisConfig.format
        }
      })
    }
  };

  // Add size encoding if sizeField is provided
  if (sizeField) {
    const effectiveSizeLegend = sizeLegend || legend;
    encoding.size = {
      field: sizeField,
      type: "quantitative",
      scale: {
        type: "linear",
        range: sizeRange,
        domain: sizeDomain,
        clamp: true
      },
      legend: effectiveSizeLegend && effectiveSizeLegend.showSize !== false ? {
        title: effectiveSizeLegend.sizeTitle || sizeField,
        titleColor: effectiveSizeLegend.titleColor || "#888",
        labelColor: effectiveSizeLegend.labelColor || "#888",
        titleFontSize: effectiveSizeLegend.titleFontSize || 9,
        labelFontSize: effectiveSizeLegend.labelFontSize || 8,
        orient: effectiveSizeLegend.orient || "right",
        offset: effectiveSizeLegend.offset || 15,
        padding: effectiveSizeLegend.padding || 0,
        ...(effectiveSizeLegend.values && { values: effectiveSizeLegend.values })
      } : null
    };
  }

  // Add color encoding if colorField is provided
  if (colorField) {
    const effectiveColorLegend = colorLegend || legend;
    
    // Determine if the color field is nominal or quantitative
    const sampleValue = data.length > 0 ? data[0][colorField] : null;
    const isNominal = typeof sampleValue === 'string' || 
                     data.some(d => typeof d[colorField] === 'string');
    
    if (isNominal) {
      // For nominal fields, use color array and ordinal scale
      encoding.color = {
        field: colorField,
        type: "nominal",
        scale: {
          range: Array.isArray(colors) ? colors : ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#F43F5E"]
        },
        legend: effectiveColorLegend && effectiveColorLegend.showColor !== false ? {
          title: effectiveColorLegend.colorTitle || colorField,
          titleColor: effectiveColorLegend.titleColor || "#888",
          labelColor: effectiveColorLegend.labelColor || "#888",
          titleFontSize: effectiveColorLegend.titleFontSize || 9,
          labelFontSize: effectiveColorLegend.labelFontSize || 8,
          orient: effectiveColorLegend.colorOrient || "top",
          offset: effectiveColorLegend.colorOffset || 0
        } : null
      };
    } else {
      // For quantitative fields, use color scheme
      encoding.color = {
        field: colorField,
        type: "quantitative",
        scale: {
          scheme: (Array.isArray(colors) && colors[0]) || "redyellowgreen",
          reverse: Array.isArray(colors) && colors[1] === "reverse"
        },
        legend: effectiveColorLegend && effectiveColorLegend.showColor !== false ? {
          title: effectiveColorLegend.colorTitle || colorField,
          titleColor: effectiveColorLegend.titleColor || "#888",
          labelColor: effectiveColorLegend.labelColor || "#888",
          titleFontSize: effectiveColorLegend.titleFontSize || 9,
          labelFontSize: effectiveColorLegend.labelFontSize || 8,
          orient: effectiveColorLegend.colorOrient || "top",
          offset: effectiveColorLegend.colorOffset || 0
        } : null
      };
    }
  } else if (colors) {
    encoding.color = { value: Array.isArray(colors) ? colors[0] : colors };
  }

  // Add interaction-based stroke and opacity
  if (vegaParams.length > 0) {
    const strokeConditions = [];
    const opacityConditions = [];

    if (interactions?.select !== false) {
      strokeConditions.push({
        param: "select_point",
        empty: false,
        value: "#272729"
      });
      opacityConditions.push({
        param: "select_point", 
        empty: false,
        value: 1
      });
    }

    if (interactions?.hover !== false) {
      strokeConditions.push({
        param: "hover_scatter",
        empty: false,
        value: "#272729"
      });
      opacityConditions.push({
        param: "hover_scatter",
        empty: false,
        value: 0.9
      });
    }

    if (strokeConditions.length > 0) {
      encoding.stroke = {
        condition: strokeConditions,
        value: "white"
      };
    }

    if (opacityConditions.length > 0) {
      encoding.opacity = {
        condition: opacityConditions,
        value: 0.7
      };
    }
  }

  // Add tooltip
  encoding.tooltip = tooltip?.fields || [
    { field: xField, type: "quantitative", title: xField, format: ".1f" },
    { field: yField, type: "quantitative", title: yField, format: ".1f" },
    ...(sizeField ? [{ field: sizeField, type: "quantitative", title: sizeField, format: ".0f" }] : []),
    ...(colorField ? [{ field: colorField, type: "quantitative", title: colorField, format: ".0f" }] : [])
  ];

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    width,
    height,
    background,
    data: { values: data },
    ...(vegaParams.length > 0 && { params: vegaParams }),
    mark: {
      type: "circle",
      cursor: "pointer",
      strokeWidth: 2
    },
    encoding,
    config: {
      view: {
        stroke: null
      }
    }
  };
}