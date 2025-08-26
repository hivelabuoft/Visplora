// Vega-Lite specifications for Travel Numbers dashboard
import { CostTimelineData, SafetyComparisonData, VisitorFlowSeasonalData, DestinationMetrics } from './travelDataTypes';

// Clickable countries for world travel map (150+ popular destinations)
export const CLICKABLE_COUNTRIES = [
  // North America
  'United States', 'Canada', 'Mexico', 'Guatemala', 'Costa Rica', 'Panama',
  
  // Caribbean
  'Cuba', 'Jamaica', 'Dominican Republic', 'Haiti', 'Bahamas', 'Barbados', 'Trinidad and Tobago',
  
  // South America  
  'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Ecuador', 'Uruguay', 'Venezuela', 
  'Bolivia', 'Paraguay', 'Guyana', 'Suriname',
  
  // Western Europe
  'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium',
  'Switzerland', 'Austria', 'Ireland', 'Luxembourg',
  
  // Northern Europe
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland', 'Estonia', 'Latvia', 'Lithuania',
  
  // Central Europe
  'Poland', 'Czech Republic', 'Hungary', 'Slovakia', 'Romania', 'Bulgaria',
  
  // Southern Europe
  'Greece', 'Croatia', 'Slovenia', 'Bosnia and Herzegovina', 'Serbia', 'Montenegro', 
  'North Macedonia', 'Albania', 'Malta', 'Cyprus',
  
  // Eastern Europe
  'Russia', 'Ukraine', 'Belarus', 'Moldova',
  
  // East Asia
  'China', 'Japan', 'South Korea', 'North Korea', 'Mongolia',
  
  // South Asia
  'India', 'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Bhutan', 'Maldives',
  
  // Southeast Asia
  'Thailand', 'Vietnam', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines', 'Myanmar', 
  'Cambodia', 'Laos', 'Brunei', 'Timor-Leste',
  
  // Central Asia
  'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Afghanistan',
  
  // Middle East
  'Turkey', 'United Arab Emirates', 'Saudi Arabia', 'Israel', 'Jordan', 'Qatar', 'Kuwait', 
  'Bahrain', 'Oman', 'Lebanon', 'Iran', 'Iraq',
  
  // North Africa
  'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan',
  
  // Sub-Saharan Africa
  'South Africa', 'Kenya', 'Tanzania', 'Ethiopia', 'Uganda', 'Rwanda', 'Ghana', 'Nigeria', 
  'Senegal', 'Mali', 'Burkina Faso', 'Côte d\'Ivoire', 'Botswana', 'Namibia', 'Zimbabwe', 
  'Zambia', 'Madagascar', 'Mauritius',
  
  // Oceania
  'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands', 'Vanuatu', 
  'Samoa', 'Tonga', 'Palau', 'Micronesia', 'Marshall Islands'
];

// Static world map with hardcoded data for testing
export const staticWorldMapSpec = () => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 400,
  "height": 200,
  "data": {
    "values": [
      {"country": "USA", "x": 100, "y": 100, "size": 50},
      {"country": "Canada", "x": 80, "y": 80, "size": 40},
      {"country": "Mexico", "x": 90, "y": 130, "size": 30},
      {"country": "Brazil", "x": 150, "y": 180, "size": 45},
      {"country": "UK", "x": 200, "y": 90, "size": 25},
      {"country": "France", "x": 210, "y": 100, "size": 30},
      {"country": "Germany", "x": 220, "y": 95, "size": 25},
      {"country": "China", "x": 350, "y": 110, "size": 60},
      {"country": "Japan", "x": 380, "y": 120, "size": 20},
      {"country": "Australia", "x": 370, "y": 170, "size": 35}
    ]
  },
  "mark": {
    "type": "circle",
    "stroke": "white",
    "strokeWidth": 2
  },
  "encoding": {
    "x": {"field": "x", "type": "quantitative", "scale": {"domain": [0, 400]}, "axis": null},
    "y": {"field": "y", "type": "quantitative", "scale": {"domain": [0, 200]}, "axis": null},
    "size": {"field": "size", "type": "quantitative", "scale": {"range": [100, 1000]}, "legend": null},
    "color": {"value": "#d1d5db"},
    "tooltip": {"field": "country", "type": "nominal"}
  }
});

// Alternative simple world map with different data source
export const altWorldMapSpec = () => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 400,
  "height": 200,
  "data": {
    "url": "https://raw.githubusercontent.com/vega/vega/master/docs/data/world-110m.json",
    "format": {
      "type": "topojson",
      "feature": "countries"
    }
  },
  "mark": {
    "type": "geoshape",
    "stroke": "white",
    "strokeWidth": 0.5,
    "fill": "#ccc"
  }
});

// Simple test world map specification
export const simpleWorldMapSpec = () => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 500,
  "height": 300,
  "data": {
    "url": "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
    "format": {
      "type": "topojson",
      "feature": "countries"
    }
  },
  "mark": {
    "type": "geoshape",
    "stroke": "white",
    "strokeWidth": 0.5
  },
  "encoding": {
    "color": {
      "value": "#d1d5db"
    }
  }
});

// Country ID to name mapping for topojson data (ISO 3166-1 numeric codes)
const COUNTRY_ID_TO_NAME: { [key: string]: string } = {
  // North America
  '840': 'United States',
  '124': 'Canada',
  '484': 'Mexico',
  '320': 'Guatemala',
  '188': 'Costa Rica',
  '222': 'El Salvador',
  '340': 'Honduras',
  '558': 'Nicaragua',
  '591': 'Panama',
  
  // South America
  '076': 'Brazil',
  '032': 'Argentina',
  '152': 'Chile',
  '170': 'Colombia',
  '604': 'Peru',
  '218': 'Ecuador',
  '858': 'Uruguay',
  '862': 'Venezuela',
  '068': 'Bolivia',
  '328': 'Guyana',
  '740': 'Suriname',
  '600': 'Paraguay',
  
  // Western Europe
  '826': 'United Kingdom',
  '250': 'France',
  '276': 'Germany',
  '380': 'Italy',
  '724': 'Spain',
  '620': 'Portugal',
  '528': 'Netherlands',
  '056': 'Belgium',
  '756': 'Switzerland',
  '040': 'Austria',
  '372': 'Ireland',
  '440': 'Lithuania',
  '428': 'Latvia',
  '233': 'Estonia',
  '442': 'Luxembourg',
  '020': 'Andorra',
  '492': 'Monaco',
  '674': 'San Marino',
  '336': 'Holy See',
  
  // Northern Europe
  '578': 'Norway',
  '752': 'Sweden',
  '208': 'Denmark',
  '246': 'Finland',
  '352': 'Iceland',
  
  // Central Europe
  '616': 'Poland',
  '203': 'Czech Republic',
  '348': 'Hungary',
  '703': 'Slovakia',
  '705': 'Slovenia',
  '191': 'Croatia',
  '070': 'Bosnia and Herzegovina',
  '688': 'Serbia',
  '499': 'Montenegro',
  '807': 'North Macedonia',
  '008': 'Albania',
  '642': 'Romania',
  '100': 'Bulgaria',
  '498': 'Moldova',
  
  // Southern Europe  
  '300': 'Greece',
  '292': 'Gibraltar',
  '470': 'Malta',
  '196': 'Cyprus',
  
  // Eastern Europe
  '643': 'Russia',
  '804': 'Ukraine',
  '112': 'Belarus',
  
  // Asia
  '156': 'China',
  '392': 'Japan',
  '410': 'South Korea',
  '408': 'North Korea',
  '496': 'Mongolia',
  '356': 'India',
  '586': 'Pakistan',
  '144': 'Sri Lanka',
  '050': 'Bangladesh',
  '524': 'Nepal',
  '064': 'Bhutan',
  '462': 'Maldives',
  
  // Southeast Asia
  '764': 'Thailand',
  '704': 'Vietnam',
  '702': 'Singapore',
  '458': 'Malaysia',
  '360': 'Indonesia',
  '608': 'Philippines',
  '104': 'Myanmar',
  '116': 'Cambodia',
  '418': 'Laos',
  '096': 'Brunei',
  '626': 'Timor-Leste',
  
  // Middle East
  '792': 'Turkey',
  '784': 'United Arab Emirates',
  '682': 'Saudi Arabia',
  '376': 'Israel',
  '400': 'Jordan',
  '634': 'Qatar',
  '414': 'Kuwait',
  '048': 'Bahrain',
  '512': 'Oman',
  '887': 'Yemen',
  '368': 'Iraq',
  '364': 'Iran',
  '031': 'Azerbaijan',
  '268': 'Georgia',
  '051': 'Armenia',
  '760': 'Syria',
  '422': 'Lebanon',
  
  // Central Asia
  '860': 'Uzbekistan',
  '762': 'Tajikistan',
  '795': 'Turkmenistan',
  '417': 'Kyrgyzstan',
  '398': 'Kazakhstan',
  '004': 'Afghanistan',
  
  // Africa
  '710': 'South Africa',
  '818': 'Egypt',
  '504': 'Morocco',
  '012': 'Algeria',
  '788': 'Tunisia',
  '434': 'Libya',
  '729': 'Sudan',
  '404': 'Kenya',
  '834': 'Tanzania',
  '800': 'Uganda',
  '646': 'Rwanda',
  '108': 'Burundi',
  '231': 'Ethiopia',
  '706': 'Somalia',
  '262': 'Djibouti',
  '232': 'Eritrea',
  '204': 'Benin',
  '854': 'Burkina Faso',
  '384': 'Côte d\'Ivoire',
  '288': 'Ghana',
  '270': 'Gambia',
  '324': 'Guinea',
  '624': 'Guinea-Bissau',
  '430': 'Liberia',
  '466': 'Mali',
  '478': 'Mauritania',
  '562': 'Niger',
  '566': 'Nigeria',
  '686': 'Senegal',
  '694': 'Sierra Leone',
  '768': 'Togo',
  '132': 'Cape Verde',
  '140': 'Central African Republic',
  '148': 'Chad',
  '178': 'Congo',
  '180': 'Congo (DRC)',
  '226': 'Equatorial Guinea',
  '266': 'Gabon',
  '678': 'São Tomé and Príncipe',
  '024': 'Angola',
  '072': 'Botswana',
  '748': 'Eswatini',
  '426': 'Lesotho',
  '454': 'Malawi',
  '480': 'Mauritius',
  '508': 'Mozambique',
  '516': 'Namibia',
  '690': 'Seychelles',
  '894': 'Zambia',
  '716': 'Zimbabwe',
  '175': 'Mayotte',
  '638': 'Réunion',
  '174': 'Comoros',
  '450': 'Madagascar',
  
  // Oceania
  '036': 'Australia',
  '554': 'New Zealand',
  '242': 'Fiji',
  '548': 'Vanuatu',
  '583': 'Micronesia',
  '584': 'Marshall Islands',
  '585': 'Palau',
  '598': 'Papua New Guinea',
  '090': 'Solomon Islands',
  '776': 'Tonga',
  '798': 'Tuvalu',
  '882': 'Samoa',
  '296': 'Kiribati',
  '520': 'Nauru',
  '184': 'Cook Islands',
  '570': 'Niue',
  '612': 'Pitcairn',
  '016': 'American Samoa',
  '316': 'Guam',
  '580': 'Northern Mariana Islands',
  '258': 'French Polynesia',
  '540': 'New Caledonia',
  '876': 'Wallis and Futuna',
  
  // Caribbean
  '832': 'Curaçao',
  '533': 'Aruba',
  '534': 'Sint Maarten',
  '652': 'Saint Barthélemy',
  '663': 'Saint Martin',
  '312': 'Guadeloupe',
  '474': 'Martinique',
  '254': 'French Guiana',
  '044': 'Bahamas',
  '052': 'Barbados',
  '084': 'Belize',
  '192': 'Cuba',
  '212': 'Dominica',
  '214': 'Dominican Republic',
  '308': 'Grenada',
  '332': 'Haiti',
  '388': 'Jamaica',
  '659': 'Saint Kitts and Nevis',
  '662': 'Saint Lucia',
  '670': 'Saint Vincent and the Grenadines',
  '780': 'Trinidad and Tobago'
};

// Simple fallback world map with most reliable data source
export const fallbackWorldMapSpec = () => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 600,
  "height": 350,
  "params": [
    {
      "name": "clicked",
      "select": {
        "type": "point"
      }
    },
    {
      "name": "hover",
      "select": {
        "type": "point",
        "on": "mouseover",
        "clear": "mouseout"
      }
    }
  ],
  "data": {
    "url": "https://raw.githubusercontent.com/vega/vega-datasets/master/data/world-110m.json",
    "format": {
      "type": "topojson",
      "feature": "countries"
    }
  },
  "transform": [
    {
      "calculate": `{${Object.entries(COUNTRY_ID_TO_NAME).map(([id, name]) => `'${id}': '${name}'`).join(', ')}}[datum.id] || 'Unknown Country'`,
      "as": "countryName"
    }
  ],
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
          "param": "clicked",
          "value": "#8b5a87"
        },
        {
          "param": "hover",
          "value": "#a78bfa"
        }
      ],
      "value": "#d1d5db"
    },
    "tooltip": [
      {
        "field": "countryName",
        "type": "nominal",
        "title": "Country"
      }
    ]
  }
});

// Working world map based on reliable Vega example
export const workingWorldMapSpec = () => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 600,
  "height": 350,
  "background": "transparent",
  "params": [
    {
      "name": "clicked",
      "select": {
        "type": "point",
        "fields": ["properties.NAME", "properties.NAME_EN"]
      }
    },
    {
      "name": "hover",
      "select": {
        "type": "point",
        "on": "mouseover",
        "clear": "mouseout"
      }
    }
  ],
  "data": {
    "url": "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  },
  "mark": {
    "type": "geoshape",
    "stroke": "white",
    "strokeWidth": 0.5
  },
  "encoding": {
    "color": {
      "condition": [
        {
          "param": "clicked",
          "value": "#8b5a87"
        },
        {
          "param": "hover",
          "value": "#a78bfa"
        }
      ],
      "value": "#d1d5db"
    },
    "tooltip": {
      "field": "properties.NAME",
      "type": "nominal"
    }
  }
});

// Enhanced world map with proper sizing for larger container
export const worldMapSpec = () => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 600,
  "height": 350,
  "background": "transparent",
  "params": [
    {
      "name": "clicked",
      "select": {
        "type": "point",
        "fields": ["properties.NAME"]
      }
    },
    {
      "name": "hover",
      "select": {
        "type": "point",
        "on": "mouseover",
        "clear": "mouseout"
      }
    }
  ],
  "data": {
    "url": "https://raw.githubusercontent.com/vega/vega/master/docs/data/world-110m.json",
    "format": {
      "type": "topojson",
      "feature": "countries"
    }
  },
  "transform": [
    {
      "calculate": `indexof(['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Norway', 'Sweden', 'Denmark', 'Finland', 'Poland', 'Czech Republic', 'Hungary', 'Greece', 'Turkey', 'Russia', 'China', 'Japan', 'South Korea', 'India', 'Thailand', 'Vietnam', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines', 'Nepal', 'Sri Lanka', 'Australia', 'New Zealand', 'Fiji', 'South Africa', 'Egypt', 'Morocco', 'Kenya', 'Tanzania', 'Ghana', 'Nigeria', 'United Arab Emirates', 'Saudi Arabia', 'Israel', 'Jordan', 'Qatar'], datum.properties.NAME) >= 0`,
      "as": "isClickable"
    }
  ],
  "mark": {
    "type": "geoshape",
    "stroke": "#ffffff",
    "strokeWidth": 0.5,
    "cursor": "pointer"
  },
  "encoding": {
    "color": {
      "condition": [
        {
          "test": "!datum.isClickable",
          "value": "#f5f5f5"
        },
        {
          "param": "clicked",
          "value": "#8b5a87"
        },
        {
          "param": "hover", 
          "value": "#a78bfa"
        }
      ],
      "value": "#d1d5db"
    },
    "opacity": {
      "condition": {
        "test": "datum.isClickable",
        "value": 1
      },
      "value": 0.3
    },
    "tooltip": {
      "condition": {
        "test": "datum.isClickable",
        "field": "properties.NAME",
        "type": "nominal"
      },
      "value": null
    }
  }
});

// Cost timeline chart specification
export const costTimelineChartSpec = (data: CostTimelineData[]) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 420,
  "height": 130,
  "background": "transparent",
  "data": {
    "values": data
  },
  "transform": [
    {
      "fold": ["avgHotelPrice", "avgMealPrice", "avgTransportCost"],
      "as": ["costType", "cost"] as [string, string]
    },
    {
      "calculate": "datum.costType === 'avgHotelPrice' ? 'Hotel' : datum.costType === 'avgMealPrice' ? 'Meals' : 'Transport'",
      "as": "costLabel"
    }
  ],
  "encoding": {
    "x": {
      "field": "date",
      "type": "temporal" as const,
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
        "title": null,
        "format": "%Y-%m"
      }
    },
    "y": {
      "field": "cost",
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
        "title": null,
        "format": "$,.0f"
      }
    },
    "color": {
      "field": "costType",
      "type": "nominal" as const,
      "scale": {
        "domain": ["avgHotelPrice", "avgMealPrice", "avgTransportCost"],
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
          {"field": "date", "type": "temporal" as const, "title": "Date", "format": "%Y-%m"},
          {"field": "cost", "type": "quantitative" as const, "title": "Cost ($)", "format": ",.0f"},
          {"field": "costLabel", "type": "nominal" as const, "title": "Type"}
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

// Safety comparison bar chart by region
export const safetyComparisonBarChartSpec = (data: SafetyComparisonData[]) => {
  // Sort data by overall safety score (descending)
  const sortedData = data
    .sort((a, b) => b.overallSafety - a.overallSafety)
    .map((d, index) => ({ ...d, sortIndex: index }));

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
    "width": 320,
    "height": 180,
    "background": "transparent",
    "data": {
      "values": sortedData
    },
    "transform": [
      {
        "fold": ["crimeIndex", "politicalRisk", "healthRisk"],
        "as": ["riskType", "riskScore"] as [string, string]
      },
      {
        "calculate": "datum.riskType === 'crimeIndex' ? 'Crime' : datum.riskType === 'politicalRisk' ? 'Political' : 'Health'",
        "as": "riskLabel"
      }
    ],
    "params": [
      {
        "name": "hover_safety_bar",
        "select": {
          "type": "point" as const,
          "on": "pointerover" as const,
          "clear": "pointerout" as const
        }
      }
    ],
    "mark": {
      "type": "bar" as const,
      "cursor": "pointer" as const
    },
    "encoding": {
      "y": {
        "field": "region",
        "type": "nominal" as const,
        "scale": {
          "domain": sortedData.map(d => d.region)
        },
        "axis": {
          "labelColor": "#888",
          "titleColor": "#888",
          "labelFontSize": 9,
          "title": null
        }
      },
      "x": {
        "field": "riskScore",
        "type": "quantitative" as const,
        "axis": {
          "labelColor": "#888",
          "titleColor": "#888",
          "labelFontSize": 8,
          "grid": true,
          "gridColor": "#888",
          "gridDash": [2, 2],
          "title": null
        }
      },
      "color": {
        "field": "riskType",
        "type": "nominal" as const,
        "scale": {
          "domain": ["crimeIndex", "politicalRisk", "healthRisk"],
          "range": ["#ef4444", "#f59e0b", "#8b5cf6"]
        },
        "legend": {
          "title": null,
          "orient": "top" as const,
          "titleColor": "#333",
          "labelColor": "#333",
          "titleFontSize": 10,
          "labelFontSize": 9
        }
      },
      "opacity": {
        "condition": {
          "param": "hover_safety_bar",
          "value": 0.8
        },
        "value": 0.6
      },
      "tooltip": [
        {"field": "region", "type": "nominal" as const, "title": "Region"},
        {"field": "riskLabel", "type": "nominal" as const, "title": "Risk Type"},
        {"field": "riskScore", "type": "quantitative" as const, "title": "Risk Score", "format": ".0f"},
        {"field": "overallSafety", "type": "quantitative" as const, "title": "Overall Safety", "format": ".0f"}
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

// Visitor flow seasonal chart
export const visitorFlowSeasonalChartSpec = (data: VisitorFlowSeasonalData[]) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 280,
  "height": 140,
  "background": "transparent",
  "data": {
    "values": data
  },
  "layer": [
    {
      "params": [
        {
          "name": "hover_flow",
          "select": {
            "type": "point" as const,
            "on": "pointerover" as const,
            "clear": "pointerout" as const
          }
        }
      ],
      "mark": {
        "type": "bar" as const,
        "cursor": "pointer" as const,
        "cornerRadiusEnd": 2
      },
      "encoding": {
        "x": {
          "field": "monthName",
          "type": "ordinal" as const,
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "labelFontSize": 8,
            "title": null
          }
        },
        "y": {
          "field": "arrivals",
          "type": "quantitative" as const,
          "axis": {
            "labelColor": "#888",
            "titleColor": "#888",
            "labelFontSize": 8,
            "gridColor": "#888",
            "gridDash": [2, 2],
            "grid": true,
            "title": null,
            "format": ".2s"
          }
        },
        "color": {
          "field": "season",
          "type": "nominal" as const,
          "scale": {
            "domain": ["Low", "Shoulder", "High"],
            "range": ["#94a3b8", "#3b82f6", "#dc2626"]
          },
          "legend": null
        },
        "opacity": {
          "condition": {
            "param": "hover_flow",
            "value": 0.8
          },
          "value": 0.6
        },
        "tooltip": [
          {"field": "monthName", "type": "nominal" as const, "title": "Month"},
          {"field": "arrivals", "type": "quantitative" as const, "title": "Arrivals", "format": ",.0f"},
          {"field": "occupancyRate", "type": "quantitative" as const, "title": "Occupancy Rate", "format": ".0f"},
          {"field": "season", "type": "nominal" as const, "title": "Season"}
        ]
      }
    },
    {
      "mark": {
        "type": "line" as const,
        "color": "#8b5cf6",
        "strokeWidth": 2
      },
      "encoding": {
        "x": {
          "field": "monthName",
          "type": "ordinal" as const
        },
        "y": {
          "field": "occupancyRate",
          "type": "quantitative" as const,
          "scale": {
            "domain": [0, 100]
          }
        }
      }
    }
  ],
  "resolve": {
    "scale": {
      "y": "independent"
    }
  },
  "config": {
    "background": "transparent",
    "view": {
      "stroke": null
    }
  }
});

// Reviews distribution pie chart
export const reviewsDistributionPieSpec = (data: Array<{rating: string, count: number, percentage: number}>) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 150,
  "height": 150,
  "background": "transparent",
  "data": {
    "values": data
  },
  "params": [
    {
      "name": "hover_reviews",
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
      "field": "rating",
      "type": "nominal" as const,
      "scale": {
        "range": ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#16a34a"]
      },
      "legend": null
    },
    "stroke": {
      "condition": {
        "param": "hover_reviews",
        "value": "white"
      },
      "value": "white"
    },
    "strokeWidth": {
      "condition": {
        "param": "hover_reviews",
        "value": 2
      },
      "value": 0.5
    },
    "opacity": {
      "condition": {
        "param": "hover_reviews",
        "value": 1
      },
      "value": 0.7
    },
    "tooltip": [
      {"field": "rating", "type": "nominal" as const, "title": "Rating"},
      {"field": "count", "type": "quantitative" as const, "title": "Reviews", "format": ","},
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

// Small destination map for KPI cards
export const smallDestinationMapSpec = (selectedDestination: string) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 40,
  "height": 40,
  "data": {
    "url": "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
    "format": {
      "type": "topojson" as const,
      "feature": "countries"
    }
  },
  "transform": [
    {
      "filter": `datum.properties.NAME === '${selectedDestination}'`
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

// Cultural diversity radar chart (simplified as bar for now)
export const culturalDiversityBarSpec = (data: Array<{metric: string, score: number, maxScore: number}>) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 200,
  "height": 130,
  "background": "transparent",
  "data": {
    "values": data
  },
  "params": [
    {
      "name": "hover_culture",
      "select": {
        "type": "point" as const,
        "on": "pointerover" as const,
        "clear": "pointerout" as const
      }
    }
  ],
  "mark": {
    "type": "bar" as const,
    "cursor": "pointer" as const,
    "cornerRadiusEnd": 2
  },
  "encoding": {
    "y": {
      "field": "metric",
      "type": "nominal" as const,
      "sort": {
        "field": "score",
        "order": "descending" as const
      },
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 9,
        "title": null
      }
    },
    "x": {
      "field": "score",
      "type": "quantitative" as const,
      "scale": {
        "domain": [0, 100]
      },
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "grid": true,
        "gridColor": "#888",
        "gridDash": [2, 2],
        "title": null
      }
    },
    "color": {
      "value": "#8B5CF6"
    },
    "opacity": {
      "condition": {
        "param": "hover_culture",
        "value": 0.8
      },
      "value": 0.6
    },
    "tooltip": [
      {"field": "metric", "type": "nominal" as const, "title": "Cultural Metric"},
      {"field": "score", "type": "quantitative" as const, "title": "Score", "format": ".0f"},
      {"field": "maxScore", "type": "quantitative" as const, "title": "Max Score", "format": ".0f"}
    ]
  },
  "config": {
    "background": "transparent",
    "view": {
      "stroke": null
    }
  }
});

// Environmental quality multi-metric bar chart
export const environmentalQualityBarSpec = (data: Array<{city: string, aqi: number, greenSpacePct: number, waterQuality: number, overallScore: number}>) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 280,
  "height": 160,
  "background": "transparent",
  "data": {
    "values": data.slice(0, 8) // Top 8 cities
  },
  "transform": [
    {
      "fold": ["aqi", "greenSpacePct", "waterQuality"],
      "as": ["envType", "envScore"] as [string, string]
    },
    {
      "calculate": "datum.envType === 'aqi' ? 'Air Quality' : datum.envType === 'greenSpacePct' ? 'Green Space' : 'Water Quality'",
      "as": "envLabel"
    }
  ],
  "params": [
    {
      "name": "hover_env",
      "select": {
        "type": "point" as const,
        "on": "pointerover" as const,
        "clear": "pointerout" as const
      }
    }
  ],
  "mark": {
    "type": "bar" as const,
    "cursor": "pointer" as const
  },
  "encoding": {
    "y": {
      "field": "city",
      "type": "nominal" as const,
      "sort": {
        "field": "overallScore",
        "order": "descending" as const
      },
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "title": null
      }
    },
    "x": {
      "field": "envScore",
      "type": "quantitative" as const,
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "grid": true,
        "gridColor": "#888",
        "gridDash": [2, 2],
        "title": null
      }
    },
    "color": {
      "field": "envType",
      "type": "nominal" as const,
      "scale": {
        "domain": ["aqi", "greenSpacePct", "waterQuality"],
        "range": ["#ef4444", "#22c55e", "#3b82f6"]
      },
      "legend": {
        "title": null,
        "orient": "top" as const,
        "labelColor": "#333",
        "labelFontSize": 9
      }
    },
    "opacity": {
      "condition": {
        "param": "hover_env",
        "value": 0.8
      },
      "value": 0.6
    },
    "tooltip": [
      {"field": "city", "type": "nominal" as const, "title": "City"},
      {"field": "envLabel", "type": "nominal" as const, "title": "Metric"},
      {"field": "envScore", "type": "quantitative" as const, "title": "Score", "format": ".1f"},
      {"field": "overallScore", "type": "quantitative" as const, "title": "Overall Score", "format": ".0f"}
    ]
  },
  "config": {
    "background": "transparent",
    "view": {
      "stroke": null
    }
  }
});