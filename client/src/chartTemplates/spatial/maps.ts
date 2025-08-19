// Spatial Chart Templates
// Borough Map, Choropleth Map, Point Map, LSOA Map

export interface SpatialData {
  [key: string]: any;
  // geo field (geographic identifier)
  // metric field (optional numeric value for choropleth)
  // lat/lon fields (for point maps)
}

export interface SpatialOptions {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  colors?: string[];
  colorScheme?: string;
  metricFormat?: string;
  projection?: string;
  pointSize?: number;
  strokeWidth?: number;
  strokeColor?: string;
}

// Borough Map Template (basic geographic boundaries)
export const createBoroughMapSpec = (
  geoDataUrl: string = "data/londonBoroughs.json",
  options: SpatialOptions = {},
  selectedBoroughs?: string[]
) => {
  const {
    title = 'London Borough Map',
    subtitle,
    width = 400,
    height = 350,
    colors = ['#E5E7EB', '#3B82F6', '#1E40AF'], // gray, blue, dark blue
    strokeWidth = 1,
    strokeColor = '#FFFFFF'
  } = options;

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": 14,
      "anchor": "start"
    },
    "width": width,
    "height": height,
    "view": { "stroke": "transparent" },
    "params": [
      {
        "name": "highlight",
        "select": {
          "type": "point",
          "on": "mouseover",
          "clear": "mouseout"
        }
      },
      {
        "name": "select",
        "select": {
          "type": "point",
          "on": "click"
        }
      }
    ],
    "layer": [
      {
        "data": {
          "url": geoDataUrl,
          "format": {
            "type": "topojson",
            "feature": "boroughs"
          }
        },
        "mark": {
          "type": "geoshape",
          "stroke": strokeColor,
          "strokeWidth": strokeWidth,
          "cursor": "pointer"
        },
        "encoding": {
          "color": {
            "condition": [
              {
                "param": "select",
                "empty": false,
                "value": colors[2]
              },
              {
                "param": "highlight",
                "empty": false,
                "value": colors[1]
              },
              // Condition for pre-selected boroughs
              ...(selectedBoroughs && selectedBoroughs.length > 0 ? [{
                "test": selectedBoroughs.map(borough => `datum.id === '${borough}'`).join(' || '),
                "value": colors[1]
              }] : [])
            ],
            "value": colors[0]
          },
          "strokeWidth": {
            "condition": [
              {
                "param": "highlight",
                "empty": false,
                "value": strokeWidth * 1.5
              },
              {
                "param": "select",
                "empty": false,
                "value": strokeWidth * 1.2
              },
              // Condition for pre-selected boroughs
              ...(selectedBoroughs && selectedBoroughs.length > 0 ? [{
                "test": selectedBoroughs.map(borough => `datum.id === '${borough}'`).join(' || '),
                "value": strokeWidth * 1.2
              }] : [])
            ],
            "value": strokeWidth * 0.5
          },
          "stroke": {
            "condition": [
              {
                "param": "highlight",
                "empty": false,
                "value": "#1A3C4A"
              }
            ],
            "value": strokeColor
          },
          "opacity": {
            "condition": [
              {
                "param": "highlight",
                "empty": false,
                "value": 0.9
              },
              {
                "param": "select",
                "empty": false,
                "value": 1
              },
              // Condition for pre-selected boroughs
              ...(selectedBoroughs && selectedBoroughs.length > 0 ? [{
                "test": selectedBoroughs.map(borough => `datum.id === '${borough}'`).join(' || '),
                "value": 0.8
              }] : [])
            ],
            "value": 0.7
          },
          "tooltip": {
            "field": "id",
            "type": "nominal",
            "title": "Borough"
          }
        }
      }
    ],
    "config": {
      "background": "transparent",
      "view": { "stroke": null }
    }
  };
};

// Choropleth Map Template (data-driven color mapping)
export const createChoroplethMapSpec = (
  data: SpatialData[],
  geoDataUrl: string,
  geoField: string,
  metricField: string,
  options: SpatialOptions = {}
) => {
  const {
    title = 'Choropleth Map',
    subtitle,
    width = 400,
    height = 350,
    colorScheme = 'blues',
    metricFormat = '.2s',
    strokeWidth = 1,
    strokeColor = '#FFFFFF'
  } = options;

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": 14,
      "anchor": "start"
    },
    "width": width,
    "height": height,
    "view": { "stroke": "transparent" },
    "params": [
      { "name": "highlight", "select": { "type": "point", "on": "mouseover" } }
    ],
    "layer": [
      // Base geography
      {
        "data": {
          "url": geoDataUrl,
          "format": {
            "type": "topojson",
            "feature": "boroughs"
          }
        },
        "mark": {
          "type": "geoshape",
          "stroke": "#E5E7EB",
          "strokeWidth": 0.5,
          "fill": "#F3F4F6"
        }
      },
      // Data overlay
      {
        "data": {
          "url": geoDataUrl,
          "format": {
            "type": "topojson",
            "feature": "boroughs"
          }
        },
        "transform": [
          {
            "lookup": `properties.${geoField}`,
            "from": {
              "data": { "values": data },
              "key": geoField,
              "fields": [metricField]
            }
          }
        ],
        "mark": {
          "type": "geoshape",
          "stroke": strokeColor,
          "strokeWidth": strokeWidth,
          "cursor": "pointer"
        },
        "encoding": {
          "color": {
            "field": metricField,
            "type": "quantitative",
            "title": "Value",
            "scale": { "scheme": colorScheme },
            "legend": {
              "titleColor": "#2B7A9B",
              "titleFontWeight": 600,
              "labelColor": "#4A6A7B"
            }
          },
          "stroke": {
            "condition": { "param": "highlight", "value": "#1A3C4A" },
            "value": strokeColor
          },
          "strokeWidth": {
            "condition": { "param": "highlight", "value": strokeWidth * 2 },
            "value": strokeWidth
          },
          "tooltip": [
            { "field": `properties.${geoField}`, "type": "nominal", "title": "Location" },
            { "field": metricField, "type": "quantitative", "title": "Value", "format": metricFormat }
          ]
        }
      }
    ],
    "config": {
      "background": "transparent",
      "view": { "stroke": null }
    }
  };
};

// Point Map Template (scatter plot on map)
export const createPointMapSpec = (
  data: SpatialData[],
  latField: string,
  lonField: string,
  options: SpatialOptions = {},
  metricField?: string,
  categoryField?: string
) => {
  const {
    title = 'Point Map',
    subtitle,
    width = 400,
    height = 350,
    colors = ['#2B7A9B', '#8B5CF6', '#1A3C4A', '#4A6A7B'],
    pointSize = 50,
    metricFormat = '.2s',
    projection = 'mercator'
  } = options;

  const spec: any = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": 14,
      "anchor": "start"
    },
    "width": width,
    "height": height,
    "view": { "stroke": "transparent" },
    "projection": { "type": projection },
    "params": [
      { "name": "highlight", "select": { "type": "point", "on": "mouseover" } }
    ],
    "data": { "values": data },
    "mark": {
      "type": "circle",
      "opacity": 0.7,
      "stroke": "#FFFFFF",
      "strokeWidth": 1
    },
    "encoding": {
      "longitude": {
        "field": lonField,
        "type": "quantitative"
      },
      "latitude": {
        "field": latField,
        "type": "quantitative"
      },
      "opacity": {
        "condition": { "param": "highlight", "value": 1.0 },
        "value": 0.7
      },
      "tooltip": [
        { "field": latField, "type": "quantitative", "title": "Latitude", "format": ".4f" },
        { "field": lonField, "type": "quantitative", "title": "Longitude", "format": ".4f" }
      ]
    }
  };

  // Add size encoding if metric field is provided
  if (metricField) {
    spec.encoding.size = {
      "field": metricField,
      "type": "quantitative",
      "title": "Size",
      "scale": {
        "type": "sqrt",
        "range": [pointSize * 0.5, pointSize * 2]
      },
      "legend": {
        "titleColor": "#2B7A9B",
        "titleFontWeight": 600,
        "labelColor": "#4A6A7B"
      }
    };
    spec.encoding.tooltip.push({
      "field": metricField,
      "type": "quantitative",
      "title": "Value",
      "format": metricFormat
    });
  } else {
    spec.mark.size = pointSize;
  }

  // Add color encoding if category field is provided
  if (categoryField) {
    spec.encoding.color = {
      "field": categoryField,
      "type": "nominal",
      "title": "Category",
      "scale": { "range": colors },
      "legend": {
        "titleColor": "#2B7A9B",
        "titleFontWeight": 600,
        "labelColor": "#4A6A7B"
      }
    };
    spec.encoding.tooltip.unshift({
      "field": categoryField,
      "type": "nominal",
      "title": "Category"
    });
  } else {
    spec.mark.color = colors[0];
  }

  return spec;
};

// LSOA Map Template (Lower Super Output Areas)
export const createLSOAMapSpec = (
  selectedBorough: string,
  lsoaDataUrl?: string,
  options: SpatialOptions = {}
) => {
  const {
    title = `LSOA Map - ${selectedBorough}`,
    subtitle,
    width = 400,
    height = 300,
    colors = ['#4338CA', '#8B5CF6', '#A855F7'],
    strokeWidth = 0.5,
    strokeColor = '#FFFFFF'
  } = options;

  const dataUrl = lsoaDataUrl || `data/lsoa-london-optimized/${selectedBorough}.json`;

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": 14,
      "anchor": "start"
    },
    "width": width,
    "height": height,
    "view": { "stroke": "transparent" },
    "params": [
      {
        "name": "lsoa_click",
        "select": {
          "type": "point",
          "on": "click"
        }
      },
      {
        "name": "lsoa_hover",
        "select": {
          "type": "point",
          "on": "mouseover",
          "clear": "mouseout"
        }
      }
    ],
    "layer": [
      {
        "data": {
          "url": dataUrl,
          "format": { "type": "json" }
        },
        "mark": {
          "type": "geoshape",
          "stroke": strokeColor,
          "strokeWidth": strokeWidth,
          "cursor": "pointer"
        },
        "encoding": {
          "color": {
            "condition": [
              {
                "param": "lsoa_click",
                "value": colors[1]
              },
              {
                "param": "lsoa_hover",
                "value": colors[2]
              }
            ],
            "value": colors[0]
          },
          "strokeWidth": {
            "condition": [
              {
                "param": "lsoa_hover",
                "value": strokeWidth * 2
              },
              {
                "param": "lsoa_click",
                "value": strokeWidth * 2
              }
            ],
            "value": strokeWidth
          },
          "opacity": {
            "condition": [
              {
                "param": "lsoa_hover",
                "value": 0.8
              },
              {
                "param": "lsoa_click",
                "value": 1
              }
            ],
            "value": 0.7
          },
          "tooltip": [
            {
              "field": "properties.lsoa21cd",
              "type": "nominal",
              "title": "LSOA Code"
            },
            {
              "field": "properties.lsoa21nm",
              "type": "nominal",
              "title": "LSOA Name"
            }
          ]
        }
      }
    ],
    "config": {
      "background": "transparent",
      "view": { "stroke": null }
    }
  };
};

// Small Borough Map Template (for KPI cards, etc.)
export const createSmallBoroughMapSpec = (
  selectedBorough: string,
  geoDataUrl: string = "data/londonBoroughs.json",
  options: Partial<SpatialOptions> = {}
) => {
  const {
    width = 40,
    height = 40,
    colors = ['#8B5CF6']
  } = options;

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": width,
    "height": height,
    "data": {
      "url": geoDataUrl,
      "format": {
        "type": "topojson",
        "feature": "boroughs"
      }
    },
    "transform": [
      {
        "filter": `datum.properties.NAME === '${selectedBorough}'`
      }
    ],
    "mark": {
      "type": "geoshape",
      "stroke": colors[0],
      "strokeWidth": 2,
      "fill": colors[0],
      "fillOpacity": 0.5
    },
    "config": {
      "background": "transparent",
      "view": { "stroke": null }
    }
  };
};

// Multi-layer Map Template (combine different data layers)
export const createMultiLayerMapSpec = (
  layers: Array<{
    data: any;
    type: 'geoshape' | 'circle' | 'text';
    encoding: any;
    mark?: any;
  }>,
  options: SpatialOptions = {}
) => {
  const {
    title = 'Multi-layer Map',
    subtitle,
    width = 400,
    height = 350,
    projection = 'mercator'
  } = options;

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "#FFFFFF",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": 14,
      "anchor": "start"
    },
    "width": width,
    "height": height,
    "view": { "stroke": "transparent" },
    "projection": { "type": projection },
    "layer": layers.map(layer => ({
      "data": layer.data,
      "mark": layer.mark || { "type": layer.type },
      "encoding": layer.encoding
    })),
    "config": {
      "background": "transparent",
      "view": { "stroke": null }
    }
  };
};
