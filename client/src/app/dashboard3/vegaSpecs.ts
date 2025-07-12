import { title } from "process";

// Vega-Lite specification for London boroughs map
export const boroughMapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 400,
  "height": 350,
  "view": {
    "stroke": "transparent"
  },
  "params": [
    {
      "name": "borough_click",
      "select": {
        "type": "point",
        "on": "click"
      }
    },
    {
      "name": "borough_hover",
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
        "url": "data/londonBoroughs.json",
        "format": {
          "type": "topojson",
          "feature": "boroughs"
        }
      },
      "mark": {
        "type": "geoshape",
        "stroke": "white",
        "strokeWidth": 1,
        "cursor": "pointer"
      },
      "encoding": {
        "color": {
          "condition": [
            {
              "param": "borough_click",
              "value": "#8B5CF6"
            }
          ],
          "value": "#333"
        },
        "strokeWidth": {
          "condition": [
            {
              "param": "borough_hover",
              "value": 2
            },
            {
              "param": "borough_click",
              "value": 2
            }
          ],
          "value": 1
        },
        "stroke": {
          "condition": [
            {
              "param": "borough_hover",
              "value": "#ffffff"
            }
          ],
          "value": "white"
        },
        "opacity": {
          "condition": [
            {
              "param": "borough_hover",
              "value": 0.9
            },
            {
              "param": "borough_click",
              "value": 1
            }
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
    "view": {
      "stroke": null
    }
  }
};

// Small borough map specification for the KPI card
export const smallBoroughMapSpec = (selectedBorough: string) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 40,
  "height": 40,
  "data": {
    "url": "data/londonBoroughs.json",
    "format": {
      "type": "topojson" as const,
      "feature": "boroughs"
    }
  },
  "transform": [
    {
      "filter": `datum.id === '${selectedBorough}'`
    }
  ],
  "mark": {
    "type": "geoshape" as const,
    "stroke": "#8B5CF6",
    "strokeWidth": 2,
    "fill": "#8B5CF6",
    "fillOpacity": 0.5
  },
  "config": {
    "background": "transparent",
    "view": {
      "stroke": null
    }
  }
});

// LSOA map specification for the selected borough
export const lsoaMapSpec = (selectedBorough: string) => {
  // Use the exact borough name as it appears in file names (with spaces)
  const url = `data/lsoa-london-optimized/${selectedBorough}.json`;  
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
    "width": 400,
    "height": 300,
    "view": {
      "stroke": "transparent"
    },
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
          "url": url,
          "format": {
            "type": "json"
          }
        },
        "mark": {
          "type": "geoshape",
          "stroke": "white",
          "strokeWidth": 0.5,
          "cursor": "pointer"
        },
        "encoding": {
          "color": {
            "condition": [
              {
                "param": "lsoa_click",
                "value": "#8B5CF6"
              },
              {
                "param": "lsoa_hover",
                "value": "#A855F7"
              }
            ],
            "value": "#4338CA"
          },
          "strokeWidth": {
            "condition": [
              {
                "param": "lsoa_hover",
                "value": 1
              },
              {
                "param": "lsoa_click",
                "value": 1
              }
            ],
            "value": 0.5
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
      "view": {
        "stroke": null
      }
    }
  };
};

// Population Growth & Projections Chart specification
export const populationTimelineChartSpec = (data: Array<{year: number, population: number, type: string}>) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json" as const,
  "width": 420,
  "height": 130,
  "background": "transparent",
  "data": {
    "values": data
  },
  "params": [
    {
      "name": "hover_population",
      "select": {
        "type": "point",
        "on": "mouseover",
        "clear": "mouseout"
      }
    }
  ],
  "mark": {
    "type": "bar" as const,
    "width": 7,
    "cursor": "pointer" as const
  },
  "encoding": {
    "x": {
      "field": "year",
      "type": "ordinal" as const,
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "labelAngle": -45,
        "grid": false,
        "ticks": true,
        "domain": true,
        "values": [1999, 2003, 2007, 2011, 2015, 2019, 2023, 2027, 2031],
        "title": null
      }
    },
    "y": {
      "field": "population",
      "type": "quantitative" as const,
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "grid": false,
        "ticks": true,
        "domain": true,
        "format": ".2s",
        "title": null
      }
    },
    "color": {
      "field": "type",
      "type": "nominal" as const,
      "scale": {
        "domain": ["Historical", "Projected"],
        "range": ["#8B5CF6", "#4C1D95"]
      },
      "legend": null
    },
    "stroke": {
      "condition": {
        "param": "hover_population",
        "value": "#ffffffff"
      },
      "value": "transparent"
    },
    "strokeWidth": {
      "condition": {
        "param": "hover_population",
        "value": 0.1
      },
      "value": 0
    },
    "opacity": {
      "condition": {
        "param": "hover_population",
        "value": 1
      },
      "value": 0.5
    },
    "tooltip": [
      {"field": "year", "type": "ordinal" as const, "title": "Year"},
      {"field": "population", "type": "quantitative" as const, "title": "Population", "format": ","},
      {"field": "type", "type": "nominal" as const, "title": "Data Type"}
    ]
  },
  "config": {
    "background": "transparent",
    "view": {
      "stroke": null
    }
  }
});

// Income Timeline Chart specification
export const incomeTimelineChartSpec = (data: Array<{year: string, meanIncome: number, medianIncome: number, borough: string}>) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json" as const,
  "width": 420,
  "height": 130,
  "background": "transparent",
  "data": {
    "values": data
  },
  "transform": [
    {
      "fold": ["meanIncome", "medianIncome"],
      "as": ["incomeType", "income"] as [string, string]
    },
    {
      "calculate": "datum.incomeType === 'meanIncome' ? 'Mean' : 'Median'",
      "as": "incomeLabel"
    }
  ],
  "params": [
    {
      "name": "hover_point",
      "select": {
        "type": "point",
        "on": "mouseover",
        "clear": "mouseout",
        "fields": ["year", "incomeType"]
      }
    }
  ],
  "mark": {
    "type": "area" as const,
    "point": {
      "size": 40,
      "filled": true
    },
    "strokeWidth": 0.1,
    "cursor": "pointer" as const
  },
  "encoding": {
    "x": {
      "field": "year",
      "type": "ordinal" as const,
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "labelAngle": -45,
        "grid": false,
        "ticks": true,
        "domain": true,
        "values": ["1999", "2003", "2007", "2011", "2015", "2019", "2023"],
        "title": null
      }
    },
    "y": {
      "field": "income",
      "type": "quantitative" as const,
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "grid": false,
        "ticks": true,
        "domain": true,
        "title": null
      }
    },
    "color": {
      "field": "incomeType",
      "type": "nominal" as const,
      "scale": {
        "domain": ["meanIncome", "medianIncome"],
        "range": ["#8B5CF6", "#4C1D95"]
      },
      "legend": null
    },
    "stroke": {
      "value": "black"
    },
    "strokeWidth": {
      "condition": {
        "param": "hover_point",
        "value": 1
      },
      "value": 0.5
    },
    "opacity": {
      "condition": {
        "param": "hover_point",
        "value": 1
      },
      "value": 0.8
    },
    "tooltip": [
      {"field": "year", "type": "ordinal" as const, "title": "Year"},
      {"field": "income", "type": "quantitative" as const, "title": "Income (£)", "format": ",.0f"},
      {"field": "incomeLabel", "type": "nominal" as const, "title": "Type"}
    ]
  },
  "config": {
    "background": "transparent",
    "view": {
      "stroke": null
    }
  }
});
