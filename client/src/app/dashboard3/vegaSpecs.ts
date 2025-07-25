import { BoroughCrimeStats, CrimeCategory, CRIME_CATEGORY_COLORS, BoroughCrimeStatsComparison, CrimeCategoryComparison } from './crimeData';
import { CountryOfBirthStats, CountryOfBirthComparison } from './countryOfBirthData';
import { BoroughSchoolStats, SCHOOL_TYPE_COLORS } from './schoolData';
import { HousePriceTimelineData } from './housePriceData';
import { BoroughEthnicityStats, MinorityGroup } from './ethnicityData';

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
              "param": "select",
              "empty": false,
              "value": "#8B5CF6"
            },
            {
              "param": "highlight",
              "empty": false,
              "value": "#A855F7"
            }
          ],
          "value": "#cacacaff"
        },
        "strokeWidth": {
          "condition": [
            {
              "param": "highlight",
              "empty": false,
              "value": 1.5
            },
            {
              "param": "select",
              "empty": false,
              "value": 1
            }
          ],
          "value": 0.5
        },
        "stroke": {
          "condition": [
            {
              "param": "highlight",
              "empty": false,
              "value": "black"
            }
          ],
          "value": "black"
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
  "width": 250,
  "height": 130,
  "background": "transparent",
  "data": {
    "values": data
  },
  "params": [
    {
      "name": "highlight",
      "select": {
        "type": "point",
        "on": "pointerover"
      }
    },
    {
      "name": "select",
      "select": "point"
    }
  ],
  "mark": {
    "type": "bar" as const,
    "width": 5,
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
      "value": "#272729"
    },
    "strokeWidth": {
      "condition": [
        {
          "param": "select",
          "empty": false,
          "value": 1
        },
        {
          "param": "highlight",
          "empty": false,
          "value": 1
        }
      ],
      "value": 0
    },
    "opacity": {
      "condition": {
        "param": "select",
        "value": 1
      },
      "value": 0.6
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
        "range": ["#8B5CF6", "#3B82F6"]
      },
      "legend": null
    }
  },
  "layer": [
    {
      "mark": {
        "type": "line" as const,
        "strokeWidth": 2,
        "cursor": "pointer" as const
      }
    },
    {
      "params": [
        {
          "name": "hover",
          "select": {
            "type": "point" as const,
            "on": "pointerover" as const,
            "clear": "pointerout" as const
          }
        }
      ],
      "mark": {
        "type": "circle" as const,
        "tooltip": true
      },
      "encoding": {
        "opacity": {
          "condition": {
            "test": {
              "param": "hover",
              "empty": false
            },
            "value": 1
          },
          "value": 0
        },
        "size": {
          "condition": {
            "test": {
              "param": "hover",
              "empty": false
            },
            "value": 48
          },
          "value": 100
        },
        "tooltip": [
          {"field": "year", "type": "ordinal" as const, "title": "Year"},
          {"field": "income", "type": "quantitative" as const, "title": "Income (£)", "format": ",.0f"},
          {"field": "incomeLabel", "type": "nominal" as const, "title": "Type"}
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
          "name": "highlight",
          "select": {
            "type": "point" as const,
            "on": "pointerover" as const
          }
        },
        {
          "name": "select",
          "select": "point" as const
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
            "titleColor": "#333",
            "labelColor": "#333",
            "titleFontSize": 10,
            "labelFontSize": 9,
            "symbolSize": 80,
            "offset": 5
          }
        },
        "stroke": {
          "value": "#272729"
        },
        "strokeWidth": {
          "condition": [
            {
              "param": "select",
              "empty": false,
              "value": 1
            },
            {
              "param": "highlight",
              "empty": false,
              "value": 1
            }
          ],
          "value": 0
        },
        "opacity": {
          "condition": {
            "param": "select",
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
              "value": "white"
            },
            "value": "white"
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
          "color": "#888",
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
          "color": "#888",
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
            "range": ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#1E40AF"]
          },
          "legend": null
        },
        "stroke": {
          "condition": {
            "param": "hover_birth_pie",
            "value": "white"
          },
          "value": "white"
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
        "color": "#888"
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
        "color": "#888"
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
        "color": "#888"
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

// House Price Timeline Chart Specification with Highlighting
export const housePriceTimelineChartSpec = (data: HousePriceTimelineData[]) => {
  // Transform data for multi-series format
  const transformedData = data.flatMap(d => [
    { date: d.date, year: d.year, price: d.mean, series: 'Mean Price', borough: d.borough },
    { date: d.date, year: d.year, price: d.median, series: 'Median Price', borough: d.borough },
    { date: d.date, year: d.year, price: d.sales, series: 'Sales Volume', borough: d.borough }
  ]);

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
    "width": 440,
    "height": 130,
    "background": "transparent",
    "data": {
      "values": transformedData
    },
    "layer": [
      {
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
              "title": null,
              "values": [1995, 1999, 2003, 2007, 2011, 2015, 2019, 2023]
            }
          },
          "y": {
            "field": "price",
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
              "title": null,
              "format": ".0s"
            }
          },
          "color": {
            "field": "series",
            "type": "nominal" as const,
            "scale": {
              "domain": ["Mean Price", "Median Price", "Sales Volume"],
              "range": ["#8B5CF6", "#3B82F6", "#06B6D4"]
            },
            "legend": null
          }
        },
        "layer": [
          {
            "mark": {
              "type": "line" as const,
              "strokeWidth": 2,
              "cursor": "pointer" as const
            }
          },
          {
            "params": [{
              "name": "label",
              "select": {
                "type": "point" as const,
                "encodings": ["x"] as ("x")[],
                "nearest": true,
                "on": "pointerover" as const
              }
            }],
            "mark": {
              "type": "point" as const,
              "size": 40,
              "cursor": "pointer" as const
            },
            "encoding": {
              "opacity": {
                "condition": {
                  "param": "label",
                  "empty": false,
                  "value": 1
                },
                "value": 0
              }
            }
          }
        ]
      },
      {
        "transform": [{"filter": {"param": "label", "empty": false}}],
        "layer": [
          {
            "mark": {"type": "rule" as const, "color": "#666", "strokeWidth": 1},
            "encoding": {
              "x": {"type": "ordinal" as const, "field": "year", "aggregate": "min" as const}
            }
          },
          {
            "encoding": {
              "text": {"type": "quantitative" as const, "field": "price", "format": ".2s"},
              "x": {"type": "ordinal" as const, "field": "year"},
              "y": {"type": "quantitative" as const, "field": "price"}
            },
            "layer": [
              {
                "mark": {
                  "type": "text" as const,
                  "stroke": "transparent",
                  "strokeWidth": 3,
                  "align": "left" as const,
                  "dx": 8,
                  "dy": -8,
                  "fontSize": 10,
                  "fontWeight": "bold" as const
                }
              },
              {
                "mark": {
                  "type": "text" as const,
                  "align": "left" as const,
                  "dx": 8,
                  "dy": -8,
                  "fontSize": 10,
                  "fontWeight": "bold" as const
                },
                "encoding": {
                  "color": {"type": "nominal" as const, "field": "series"}
                }
              }
            ]
          }
        ]
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

// Vega-Lite specification for ethnicity minority groups bar chart
export const ethnicityMinorityGroupsBarChartSpec = (ethnicityStats: BoroughEthnicityStats): any => {
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json" as const,
    "width": 240,
    "height": 130,
    "background": "transparent",
    "data": {
      "values": ethnicityStats.minorityGroups
    },
    "params": [
      {
        "name": "hover_ethnicity_bar",
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
        "field": "name",
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
        "field": "percentage",
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
          "format": ".1f"
        }
      },
      "color": {
        "value": "#8B5CF6"
      },
      "stroke": {
        "condition": {
          "param": "hover_ethnicity_bar",
          "value": "transparent"
        },
        "value": "transparent"
      },
      "strokeWidth": {
        "condition": {
          "param": "hover_ethnicity_bar",
          "value": 0
        },
        "value": 0
      },
      "opacity": {
        "condition": {
          "param": "hover_ethnicity_bar",
          "value": 1
        },
        "value": 0.6
      },
      "tooltip": [
        {"field": "name", "type": "nominal" as const, "title": "Ethnic Group"},
        {"field": "count", "type": "quantitative" as const, "title": "Population", "format": ","},
        {"field": "percentage", "type": "quantitative" as const, "title": "Percentage", "format": ".1f"}
      ]
    },
    "config": {
      "background": "transparent",
      "view": {
        "stroke": null
      }
    }
  };
};

// Library Line Chart Spec (replaces bar chart)
export const libraryLineChartSpec = (libraries: Array<{ year: number; visits_per_1000: number }>) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  width: 250,
  height: 130,
  background: "transparent",
  data: { values: libraries },
  mark: { type: 'line' as const, interpolate: 'monotone' as const, point: true },
  encoding: {
    x: { 
      field: 'year', 
      type: 'ordinal' as const, 
      axis: { labelColor: '#888', title: null, labelFontSize: 8, labelAngle: -45 } },
    y: { 
      field: 'visits_per_1000',
      type: 'quantitative' as const, 
      axis: { labelColor: '#888', title: null, labelFontSize: 8, "gridDash": [2, 2], "gridColor": "#888" } },
    color: { value: '#8B5CF6' },
    tooltip: [
      { field: 'year', type: 'ordinal' as const, title: 'Year' },
      { field: 'visits_per_1000', type: 'quantitative' as const, title: 'Visits per 1000' }
    ]
  },
  params: [
    {
      name: 'hover',
      select: { type: 'point' as const, on: 'pointerover' as const, clear: 'pointerout' as const }
    }
  ],
  config: { background: 'transparent', view: { stroke: null } }
});

// Gym/Sports & Recreation Pie Chart Spec (styled like crime pie chart, legend external)
export const gymPieChartSpec = (
  facilities: Array<{ facility_type: string; count: number }>,
  colorRange: string[] = ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#1E40AF", "#F59E42", "#F472B6", "#F87171"]
) => {
  const total = facilities.reduce((sum, f) => sum + f.count, 0);
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json" as const,
    width: 150,
    height: 150,
    background: "transparent",
    layer: [
      {
        data: { values: facilities },
        params: [
          {
            name: "hover_gym_pie",
            select: { type: "point", on: "mouseover", clear: "mouseout" }
          }
        ],
        mark: { type: "arc" as const, innerRadius: 50, outerRadius: 70, cursor: "pointer" as const },
        encoding: {
          theta: { field: "count", type: "quantitative" as const },
          color: {
            field: "facility_type",
            type: "nominal" as const,
            scale: { range: colorRange },
            legend: null
          },
          stroke: {
            condition: { param: "hover_gym_pie", value: "white" },
            value: "white"
          },
          strokeWidth: {
            condition: { param: "hover_gym_pie", value: 1 },
            value: 0.5
          },
          opacity: {
            condition: { param: "hover_gym_pie", value: 1 },
            value: 0.6
          },
          tooltip: [
            { field: "facility_type", type: "nominal" as const, title: "Facility Type" },
            { field: "count", type: "quantitative" as const, title: "Count" }
          ]
        }
      },
      {
        data: { values: [{ total }] },
        mark: {
          type: "text",
          align: "center",
          baseline: "middle",
          fontSize: 18,
          fontWeight: "bold",
          color: "#000",
          dy: -8
        },
        encoding: {
          text: { field: "total", type: "quantitative" }
        }
      },
      {
        data: { values: [{ text: "Total Facilities" }] },
        mark: {
          type: "text",
          align: "center",
          baseline: "middle",
          fontSize: 10,
          color: "#888",
          dy: 10
        },
        encoding: {
          text: { field: "text", type: "nominal" }
        }
      }
    ],
    config: { background: "transparent", view: { stroke: null } }
  };
};