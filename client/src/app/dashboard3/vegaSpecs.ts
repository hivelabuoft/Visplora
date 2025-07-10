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
