import { ChartSpec } from '../Charts';

// COVID Housing Affordability Dashboard Charts
export const DASHBOARD1_CHARTS: { [key: string]: ChartSpec } = {
  covid_affordability_heatmap: {
    id: "covid_affordability_heatmap",
    title: "London Borough Population Density",
    category: "COVID & Housing",
    spec: {
      "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
      "title": "Housing Density by London Borough (2023)",
      "width": 500,
      "height": 400,
      "background": "transparent",
      "data": {
        "url": "/dataset/london/processed/borough_demographics_2023.csv"
      },
      "mark": {
        "type": "bar",
        "cursor": "pointer"
      },
      "encoding": {
        "x": {
          "field": "Borough",
          "type": "nominal",
          "title": "Borough",
          "axis": { 
            "labelAngle": -45, 
            "labelLimit": 120,
            "labelColor": "#888",
            "titleColor": "#888"
          }
        },
        "y": {
          "field": "Population_Density",
          "type": "quantitative",
          "title": "Population Density (per hectare)",
          "scale": { "zero": true },
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "gridColor": "#888",
            "gridDash": [2, 2]
          }
        },
        "color": {
          "field": "Population_Density",
          "type": "quantitative",
          "title": "Density",
          "scale": { 
            "scheme": "blues"
          }
        },
        "tooltip": [
          { "field": "Borough", "title": "Borough" },
          { "field": "Population_Density", "title": "Population Density (per hectare)", "format": ".1f" },
          { "field": "Population", "title": "Population", "format": ",.0f" },
          { "field": "Area_Hectares", "title": "Area (hectares)", "format": ",.0f" }
        ]
      },
      "config": {
        "background": "transparent",
        "view": {
          "stroke": null,
          "renderer": "svg"
        }
      }
    }
  },

  income_vs_rent_scatter: {
    id: "income_vs_rent_scatter",
    title: "Borough Housing Density Ranking",
    category: "COVID & Housing",
    spec: {
      "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
      "title": "Top 10 Most Densely Populated London Boroughs",
      "width": 450,
      "height": 350,
      "background": "transparent",
      "data": {
        "url": "/dataset/london/processed/top_dense_boroughs.csv"
      },
      "mark": { 
        "type": "circle", 
        "size": 200, 
        "opacity": 0.8,
        "cursor": "pointer"
      },
      "encoding": {
        "x": {
          "field": "Rank",
          "type": "ordinal",
          "title": "Ranking",
          "scale": { "domain": [1,2,3,4,5,6,7,8,9,10] },
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888"
          }
        },
        "y": {
          "field": "Population_Density",
          "type": "quantitative",
          "title": "Population Density (per hectare)",
          "scale": { "zero": false },
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "gridColor": "#888",
            "gridDash": [2, 2]
          }
        },
        "color": {
          "field": "Population_Density",
          "type": "quantitative",
          "title": "Density Level",
          "scale": { 
            "scheme": "orangered"
          }
        },
        "tooltip": [
          { "field": "Borough", "title": "Borough" },
          { "field": "Rank", "title": "Ranking" },
          { "field": "Population_Density", "title": "Density (per hectare)", "format": ".1f" },
          { "field": "Population", "title": "Population", "format": ",.0f" }
        ]
      },
      "config": {
        "background": "transparent",
        "view": {
          "stroke": null,
          "renderer": "svg"
        }
      }
    }
  },

  affordability_timeline: {
    id: "affordability_timeline",
    title: "Population vs Density Comparison",
    category: "COVID & Housing",
    spec: {
      "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
      "title": "Population vs Housing Density Comparison",
      "width": 500,
      "height": 350,
      "background": "transparent",
      "data": {
        "url": "/dataset/london/processed/high_population_boroughs.csv"
      },
      "mark": { 
        "type": "point", 
        "size": 100, 
        "filled": true,
        "cursor": "pointer"
      },
      "encoding": {
        "x": {
          "field": "Population",
          "type": "quantitative",
          "title": "Population",
          "scale": { "zero": false },
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "gridColor": "#888",
            "gridDash": [2, 2]
          }
        },
        "y": {
          "field": "Population_Density",
          "type": "quantitative",
          "title": "Population Density (per hectare)",
          "scale": { "zero": false },
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "gridColor": "#888",
            "gridDash": [2, 2]
          }
        },
        "color": {
          "field": "Area_Hectares",
          "type": "quantitative",
          "title": "Area Size (hectares)",
          "scale": { "scheme": "viridis" }
        },
        "tooltip": [
          { "field": "Borough", "title": "Borough" },
          { "field": "Population", "title": "Population", "format": ",.0f" },
          { "field": "Population_Density", "title": "Density", "format": ".1f" },
          { "field": "Area_Hectares", "title": "Area (hectares)", "format": ",.0f" }
        ]
      },
      "config": {
        "background": "transparent",
        "view": {
          "stroke": null,
          "renderer": "svg"
        }
      }
    }
  },

  borough_affordability_map: {
    id: "borough_affordability_map",
    title: "London Borough Population Density Map",
    category: "COVID & Housing",
    spec: {
      "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
      "title": "Population Density by Borough (2023)",
      "width": 400,
      "height": 350,
      "background": "transparent",
      "data": {
        "url": "/data/londonBoroughs.json",
        "format": {
          "type": "topojson",
          "feature": "boroughs"
        }
      },
      "transform": [
        {
          "lookup": "id",
          "from": {
            "data": {
              "url": "/dataset/london/processed/borough_demographics_2023.csv"
            },
            "key": "Borough",
            "fields": ["Population_Density", "Population", "Area_Hectares"]
          }
        }
      ],
      "mark": { 
        "type": "geoshape", 
        "stroke": "white", 
        "strokeWidth": 1,
        "cursor": "pointer"
      },
      "encoding": {
        "color": {
          "field": "Population_Density",
          "type": "quantitative",
          "title": "Population Density (per hectare)",
          "scale": {
            "scheme": "blues",
            "range": ["#f0f9ff", "#1e40af"]
          }
        },
        "opacity": {
          "value": 0.8
        },
        "tooltip": [
          { "field": "id", "title": "Borough" },
          { "field": "Population_Density", "title": "Density (per hectare)", "format": ".1f" },
          { "field": "Population", "title": "Population", "format": ",.0f" },
          { "field": "Area_Hectares", "title": "Area (hectares)", "format": ",.0f" }
        ]
      },
      "config": {
        "background": "transparent",
        "view": {
          "stroke": null,
          "renderer": "svg"
        }
      }
    }
  },

  affordability_ranking: {
    id: "affordability_ranking",
    title: "Population Ranking by Size",
    category: "COVID & Housing",
    spec: {
      "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
      "title": "Top 12 Most Populated London Boroughs",
      "width": 450,
      "height": 350,
      "background": "transparent",
      "data": {
        "url": "/dataset/london/processed/top_populated_boroughs.csv"
      },
      "mark": { 
        "type": "bar", 
        "color": "#3498db",
        "cursor": "pointer"
      },
      "encoding": {
        "y": {
          "field": "Borough",
          "type": "nominal",
          "title": "Borough",
          "sort": { "field": "Population", "order": "descending" },
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888"
          }
        },
        "x": {
          "field": "Population",
          "type": "quantitative",
          "title": "Population",
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "gridColor": "#888",
            "gridDash": [2, 2],
            "format": ",.0f"
          }
        },
        "tooltip": [
          { "field": "Borough", "title": "Borough" },
          { "field": "Population", "title": "Population", "format": ",.0f" },
          { "field": "Rank", "title": "Ranking" },
          { "field": "Population_Density", "title": "Density", "format": ".1f" }
        ]
      },
      "config": {
        "background": "transparent",
        "view": {
          "stroke": null,
          "renderer": "svg"
        }
      }
    }
  },

  housing_stress_demographics: {
    id: "housing_stress_demographics",
    title: "Borough Area Statistics",
    category: "COVID & Housing",
    spec: {
      "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
      "title": "Borough Area Size Comparison",
      "width": 450,
      "height": 350,
      "background": "transparent",
      "data": {
        "url": "/dataset/london/processed/large_area_boroughs.csv"
      },
      "mark": { 
        "type": "bar", 
        "color": "#2ecc71",
        "cursor": "pointer"
      },
      "encoding": {
        "x": {
          "field": "Borough",
          "type": "nominal",
          "title": "Borough",
          "axis": { 
            "labelAngle": -45, 
            "labelLimit": 120,
            "labelColor": "#888",
            "titleColor": "#888"
          }
        },
        "y": {
          "field": "Area_Hectares",
          "type": "quantitative",
          "title": "Area (hectares)",
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "gridColor": "#888",
            "gridDash": [2, 2],
            "format": ",.0f"
          }
        },
        "color": {
          "field": "Area_Hectares",
          "type": "quantitative",
          "title": "Area Size",
          "scale": { "scheme": "greens" }
        },
        "tooltip": [
          { "field": "Borough", "title": "Borough" },
          { "field": "Area_Hectares", "title": "Area (hectares)", "format": ",.0f" },
          { "field": "Population", "title": "Population", "format": ",.0f" },
          { "field": "Population_Density", "title": "Density", "format": ".1f" }
        ]
      },
      "config": {
        "background": "transparent",
        "view": {
          "stroke": null,
          "renderer": "svg"
        }
      }
    }
  }
};

// Helper function to get all dashboard1 chart IDs
export const getDashboard1ChartIds = (): string[] => {
  return Object.keys(DASHBOARD1_CHARTS);
};

// Helper function to get chart by ID
export const getDashboard1ChartById = (id: string): ChartSpec | undefined => {
  return DASHBOARD1_CHARTS[id];
};
