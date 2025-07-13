import { BoroughCrimeStats, CrimeCategory, CRIME_CATEGORY_COLORS, BoroughCrimeStatsComparison, CrimeCategoryComparison } from './crimeData';
import { CountryOfBirthStats, CountryOfBirthComparison } from './countryOfBirthData';
import { BoroughSchoolStats, SCHOOL_TYPE_COLORS } from './schoolData';

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
        "gridColor": "#888",
        "gridDash": [2, 2],
        "grid": true,
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
        "gridColor": "#888",
        "gridDash": [2, 2],
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
        "gridColor": "#888",
        "gridDash": [2, 2],
        "grid": true,
        "ticks": false,
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

// Crime Bar Chart specification with year comparison - shows top boroughs by crime category for both years
export const crimeBarChartComparisonSpec = (
  data: Array<{borough: string, count2022: number, count2023: number, change?: number}>,
  categoryName: string
) => {
  // Sort data by count2023 in descending order (most crimes first) and add index
  const sortedData = data
    .sort((a, b) => b.count2023 - a.count2023)
    .map((d, index) => ({ ...d, sortIndex: index }));
  
  return {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json" as const,
  "width": 280,
  "height": 230,
  "background": "transparent",
  "data": {
    "values": sortedData
  },
  "transform": [
    {"calculate": "datum.count2022", "as": "count2022_positive"},
    {"calculate": "-datum.count2023", "as": "count2023_negative"}
  ],
  "layer": [
    {
      "params": [
        {
          "name": "hover_crime_bar",
          "select": {
            "type": "point" as const,
            "on": "mouseover" as const,
            "clear": "mouseout" as const
          }
        }
      ],
      "transform": [
        {"fold": ["count2022_positive", "count2023_negative"], "as": ["year_type", "count"] as [string, string]},
        {"calculate": "datum.year_type == 'count2022_positive' ? '2022' : '2023'", "as": "year"},
        {"calculate": "abs(datum.count)", "as": "absolute_count"}
      ],
      "mark": {
        "type": "bar" as const,
        "cursor": "pointer" as const,
        "cornerRadiusEnd": 2
      },
      "encoding": {
        "y": {
          "field": "borough",
          "type": "nominal" as const,
          "scale": {
            "domain": sortedData.map(d => d.borough)
          },
          "axis": null
        },
        "x": {
          "field": "count",
          "type": "quantitative" as const,
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "labelFontSize": 8,
            "grid": true,
            "gridColor": "#888",
            "gridDash": [2, 2],
            "ticks": true,
            "domain": true,
            "title": null,
            "format": "s"
          }
        },
        "color": {
          "field": "year",
          "type": "nominal" as const,
          "scale": {
            "domain": ["2022", "2023"],
            "range": ["#A855F7", "#4C1D95"]
          },
          "legend": {
            "title": null,
            "orient": "top" as const,
            "titleColor": "#fff",
            "labelColor": "#fff",
            "titleFontSize": 10,
            "labelFontSize": 9,
            "symbolSize": 80,
            "offset": 5
          }
        },
        "stroke": {
          "condition": {
            "param": "hover_crime_bar",
            "value": "#272729"
          },
          "value": "transparent"
        },
        "strokeWidth": {
          "condition": {
            "param": "hover_crime_bar",
            "value": 1
          },
          "value": 0.5
        },
        "opacity": {
          "condition": {
            "param": "hover_crime_bar",
            "value": 1
          },
          "value": 0.6
        },
        "tooltip": [
          {"field": "borough", "type": "nominal" as const, "title": "Borough"},
          {"field": "year", "type": "nominal" as const, "title": "Year"},
          {
            "field": "absolute_count", 
            "type": "quantitative" as const, 
            "title": "Cases", 
            "format": ","
          }
        ]
      }
    },
    {
      "mark": {
        "type": "text" as const,
        "align": "center" as const,
        "baseline": "middle" as const,
        "dx": 0,
        "dy": 0,
        "fontSize": 10,
        "fontWeight": "normal" as const,
        "color": "#fff"
      },
      "encoding": {
        "y": {
          "field": "borough",
          "type": "nominal" as const,
          "scale": {
            "domain": sortedData.map(d => d.borough)
          }
        },
        "x": {
          "value": 140
        },
        "text": {
          "field": "borough",
          "type": "nominal" as const
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
};

// Crime Pie Chart specification with year comparison - shows crime categories for selected borough and year
export const crimePieChartComparisonSpec = (data: CrimeCategoryComparison[], selectedYear: number) => {
  const totalChange = data.reduce((sum, d) => sum + d.change, 0) / data.length;
  
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json" as const,
    "width": 150,
    "height": 150,
    "background": "transparent",
    "layer": [
      {
        "data": {
          "values": data.map(d => ({
            name: d.name,
            count: selectedYear === 2022 ? d.count2022 : d.count2023,
            percentage: selectedYear === 2022 ? d.percentage2022 : d.percentage2023,
            change: d.change
          }))
        },
        "params": [
          {
            "name": "hover_crime_pie",
            "select": {
              "type": "point",
              "on": "mouseover",
              "clear": "mouseout"
            }
          }
        ],
        "mark": {
          "type": "arc" as const,
          "innerRadius": 50,
          "outerRadius": 70,
          "cursor": "pointer" as const
        },
        "encoding": {
          "theta": {
            "field": "count",
            "type": "quantitative" as const
          },
          "color": {
            "field": "name",
            "type": "nominal" as const,
            "scale": {
              "range": CRIME_CATEGORY_COLORS
            },
            "legend": null
          },
          "stroke": {
            "condition": {
              "param": "hover_crime_pie",
              "value": "#272729"
            },
            "value": "#272729"
          },
          "strokeWidth": {
            "condition": {
              "param": "hover_crime_pie",
              "value": 1
            },
            "value": 0.2
          },
          "opacity": {
            "condition": {
              "param": "hover_crime_pie",
              "value": 1
            },
            "value": 0.6
          },
          "tooltip": [
            {"field": "name", "type": "nominal" as const, "title": "Crime Type"},
            {"field": "count", "type": "quantitative" as const, "title": `Cases (${selectedYear})`, "format": ","},
            {"field": "percentage", "type": "quantitative" as const, "title": "Percentage", "format": ".1f"},
            {"field": "change", "type": "quantitative" as const, "title": "Change since 2022 (%)", "format": "+.1f"}
          ]
        }
      },
      {
        "data": {
          "values": [{"change": totalChange}]
        },
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 16,
          "fontWeight": "bold",
          "color": totalChange > 0 ? "#ef4444" : "#22c55e",
          "dy": -12
        },
        "encoding": {
          "text": {
            "field": "change",
            "type": "quantitative",
            "format": totalChange > 0 ? "+.1f" : ".1f"
          }
        }
      },
      {
        "data": {
          "values": [{"text": "Change from"}]
        },
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 10,
          "color": "#d1d5db",
          "dy": 4
        },
        "encoding": {
          "text": {
            "field": "text",
            "type": "nominal"
          }
        }
      },
      {
        "data": {
          "values": [{"text": "2022"}]
        },
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 10,
          "color": "#d1d5db",
          "dy": 16
        },
        "encoding": {
          "text": {
            "field": "text",
            "type": "nominal"
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
};

// Country of Birth Pie Chart Specification
export const countryOfBirthPieChartSpec = (stats: CountryOfBirthStats, comparison?: CountryOfBirthComparison) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json" as const,
  "width": 140,
  "height": 140,
  "background": "transparent",
  "layer": [
    {
      "data": {
        "values": stats.regions.map(region => ({
          "category": region.region,
          "value": region.estimate,
          "percentage": region.percentage
        }))
      },
      "params": [
        {
          "name": "hover_birth_pie",
          "select": {
            "type": "point",
            "on": "mouseover",
            "clear": "mouseout"
          }
        }
      ],
      "mark": {
        "type": "arc" as const,
        "innerRadius": 50,
        "outerRadius": 70,
        "cursor": "pointer" as const
      },
      "encoding": {
        "theta": {
          "field": "value",
          "type": "quantitative" as const
        },
        "color": {
          "field": "category",
          "type": "nominal" as const,
          "scale": {
            "domain": ["United Kingdom", "European Union", "Other Europe", "Asia", "Rest of the World"],
            "range": ["#8B5CF6", "#3B82F6", "#06B6D4", "#8B5CF6", "#1E40AF"]
          },
          "legend": null
        },
        "stroke": {
          "condition": {
            "param": "hover_birth_pie",
            "value": "#272729"
          },
          "value": "#272729"
        },
        "strokeWidth": {
          "condition": {
            "param": "hover_birth_pie",
            "value": 1
          },
          "value": 0.5
        },
        "opacity": {
          "condition": {
            "param": "hover_birth_pie",
            "value": 1
          },
          "value": 0.5
        },
        "tooltip": [
          {
            "field": "category",
            "type": "nominal",
            "title": "Region"
          },
          {
            "field": "value",
            "type": "quantitative",
            "title": "Population",
            "format": ".0f"
          },
          {
            "field": "percentage",
            "type": "quantitative",
            "title": "Percentage",
            "format": ".1f"
          }
        ]
      }
    },
    {
      "data": {
        "values": [
          {
            "text": comparison ? `${comparison.percentageChange >= 0 ? '+' : ''}${comparison.percentageChange.toFixed(1)}%` : `${stats.total.toLocaleString()}`,
            "category": "Total"
          }
        ]
      },
      "mark": {
        "type": "text",
        "align": "center",
        "baseline": "middle",
        "fontSize": 16,
        "fontWeight": "bold",
        "dy": -16,
        "color": comparison ? (comparison.percentageChange >= 0 ?  "#22c55e" : "#ef4444") : "white"
      },
      "encoding": {
        "text": {
          "field": "text",
          "type": "nominal"
        }
      }
    },
    {
      "data": {
        "values": [
          {
            "text": comparison ? `Change from` : "Total",
            "category": "Total"
          }
        ]
      },
      "mark": {
        "type": "text",
        "align": "center",
        "baseline": "middle",
        "fontSize": 10,
        "dy": 0,
        "color": "#d1d5db"
      },
      "encoding": {
        "text": {
          "field": "text",
          "type": "nominal"
        }
      }
    },
    {
      "data": {
        "values": [
          {
            "text": comparison ? `outside UK` : "Population",
            "category": "Total"
          }
        ]
      },
      "mark": {
        "type": "text",
        "align": "center",
        "baseline": "middle",
        "fontSize": 10,
        "dy": 11,
        "color": "#d1d5db"
      },
      "encoding": {
        "text": {
          "field": "text",
          "type": "nominal"
        }
      }
    },
    {
      "data": {
        "values": [
          {
            "text": comparison ? `since 2004` : "",
            "category": "Total"
          }
        ]
      },
      "mark": {
        "type": "text",
        "align": "center",
        "baseline": "middle",
        "fontSize": 10,
        "dy": 22,
        "color": "#d1d5db"
      },
      "encoding": {
        "text": {
          "field": "text",
          "type": "nominal"
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
});

// School Education Facilities Bar Chart Specification
export const schoolEducationFacilitiesSpec = (schoolStats: BoroughSchoolStats) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json" as const,
  "width": 200,
  "height": 130,
  "background": "transparent",
  "data": {
    "values": schoolStats.schoolTypes
  },
  "params": [
    {
      "name": "hover_school_bar",
      "select": {
        "type": "point" as const,
        "on": "mouseover" as const,
        "clear": "mouseout" as const
      }
    }
  ],
  "mark": {
    "type": "bar" as const,
    "cursor": "pointer" as const,
    "cornerRadiusEnd": 4,
    "height": 8
  },
  "encoding": {
    "y": {
      "field": "type",
      "type": "nominal" as const,
      "sort": {
        "field": "count",
        "order": "descending" as const
      },
      "axis": {
        "labelColor": "#888",
        "titleColor": "#fff",
        "labelFontSize": 10,
        "labelLimit": 80,
        "title": null,
        "grid": false,
        "ticks": true,
        "domain": true
      }
    },
    "x": {
      "field": "count",
      "type": "quantitative" as const,
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "grid": true,
        "gridColor": "#888",
        "gridDash": [2, 2],
        "ticks": true,
        "domain": true,
        "title": null
      }
    },
    "color": {
      "value": "#8B5CF6"
    },
    "stroke": {
      "condition": {
        "param": "hover_school_bar",
        "value": "transparent"
      },
      "value": "transparent"
    },
    "strokeWidth": {
      "condition": {
        "param": "hover_school_bar",
        "value": 0
      },
      "value": 0
    },
    "opacity": {
      "condition": {
        "param": "hover_school_bar",
        "value": 1
      },
      "value": 0.6
    },
    "tooltip": [
      {"field": "type", "type": "nominal" as const, "title": "School Type"},
      {"field": "count", "type": "quantitative" as const, "title": "Number of Schools"},
      {"field": "percentage", "type": "quantitative" as const, "title": "Percentage", "format": ".1f"}
    ]
  },
  "config": {
    "background": "transparent",
    "view": {
      "stroke": null
    }
  }
});