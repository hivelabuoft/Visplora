import { MapChartParams } from '../types/interfaces';

export interface MapChartData {
  [key: string]: string | number | undefined;
}

export interface WorldMapOptions {
  selectableCountries?: string[]; // List of countries that should be interactive
  countryField?: string; // Field name containing country names in geo data
}

/**
 * Creates an interactive world map with country selection and hover effects
 * Based on workingWorldMapSpec and fallbackWorldMapSpec patterns from travel dashboard
 */
export function createWorldInteractiveMapSpec(
  params: MapChartParams & { options?: WorldMapOptions }
): any {
  const {
    data,
    geoData,
    width = 600,
    height = 350,
    background = "transparent",
    projection = "naturalEarth1",
    colors = ["#d1d5db", "#a78bfa", "#8b5a87"], // default, hover, selected
    tooltip,
    interactions,
    legend,
    options
  } = params;

  // Extract options for selectable countries
  const selectableCountries = options?.selectableCountries || [];
  const countryField = options?.countryField || 'properties.NAME';

  // Build parameters for interactions
  const vegaParams: any[] = [];
  
  if (interactions?.select !== false) {
    vegaParams.push({
      name: "clicked",
      select: {
        type: "point",
        fields: ["properties.NAME", "properties.NAME_EN"]
      }
    });
  }

  if (interactions?.hover !== false) {
    vegaParams.push({
      name: "hover",
      select: {
        type: "point",
        on: "mouseover",
        clear: "mouseout"
      }
    });
  }

  // Build data source - use provided geoData or fallback to reliable source
  const dataSource = geoData || {
    url: "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  };

  // Handle topojson format if specified
  let processedDataSource: any;
  if (typeof dataSource === "object" && dataSource.format?.type === "topojson") {
    processedDataSource = {
      url: dataSource.url,
      format: {
        type: "topojson",
        feature: dataSource.format.feature || "countries"
      }
    };
  } else if (typeof dataSource === "string") {
    // Assume it's a URL to geojson
    processedDataSource = { url: dataSource };
  } else {
    processedDataSource = dataSource;
  }

  // Build color encoding with conditional states
  const colorEncoding: any = {
    condition: []
  };

  // Add non-clickable countries styling if we have a selectable list
  if (selectableCountries.length > 0) {
    colorEncoding.condition.push({
      test: "!datum.isClickable",
      value: "#f5f5f5" // Light gray for non-clickable countries
    });
  }

  if (interactions?.select !== false && colors.length > 2) {
    colorEncoding.condition.push({
      param: "clicked",
      value: colors[2] // selected color
    });
  }

  if (interactions?.hover !== false && colors.length > 1) {
    colorEncoding.condition.push({
      param: "hover",
      value: colors[1] // hover color
    });
  }

  colorEncoding.value = colors[0]; // default color

  // Build tooltip configuration
  let tooltipConfig: any = [];
  if (tooltip?.fields) {
    tooltipConfig = tooltip.fields;
  } else {
    // Default tooltip showing country name
    tooltipConfig = [
      {
        field: "properties.NAME",
        type: "nominal",
        title: "Country"
      }
    ];
  }

  // Add country ID mapping transform if using topojson
  const transforms: any[] = [];
  if (processedDataSource.format?.type === "topojson") {
    // Add transform to handle country ID to name mapping if needed
    transforms.push({
      calculate: "datum.properties.NAME || datum.properties.NAME_EN || datum.properties.ADMIN || 'Unknown'",
      as: "countryName"
    });
  }
  
  // Add transform to determine if country is selectable
  if (selectableCountries.length > 0) {
    // Use a safer approach by checking individual countries with OR conditions
    const countryTests = selectableCountries
      .map(country => {
        // Escape single quotes in country names
        const escapedCountry = country.replace(/'/g, "\\'");
        return `(datum.${countryField} && datum.${countryField} === '${escapedCountry}')`;
      })
      .join(' || ');
    
    transforms.push({
      calculate: `(${countryTests})`,
      as: "isClickable"
    });
  }

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    width,
    height,
    background,
    ...(vegaParams.length > 0 && { params: vegaParams }),
    data: processedDataSource,
    ...(transforms.length > 0 && { transform: transforms }),
    mark: {
      type: "geoshape",
      stroke: "white",
      strokeWidth: 0.5,
      cursor: interactions?.select !== false ? "pointer" : "default"
    },
    ...(projection && {
      projection: {
        type: projection,
        ...(projection === "naturalEarth1" && { fit: true })
      }
    }),
    encoding: {
      color: colorEncoding,
      // Add opacity for non-clickable countries
      ...(selectableCountries.length > 0 && {
        opacity: {
          condition: {
            test: "datum.isClickable",
            value: 1
          },
          value: 0.3
        }
      }),
      // Conditional tooltip - only show for clickable countries if we have a list
      ...(tooltipConfig.length > 0 && {
        tooltip: selectableCountries.length > 0 ? {
          condition: {
            test: "datum.isClickable",
            field: countryField.split('.').pop(),
            type: "nominal"
          },
          value: null
        } : tooltipConfig
      })
    },
    config: {
      view: {
        stroke: null
      }
    }
  };
}

/**
 * Creates a country detail map showing a specific selected country
 * Based on countryDetailMapSpec pattern
 */
export function createCountryDetailMapSpec(
  selectedCountry: string,
  params: MapChartParams
): any {
  const {
    width = 400,
    height = 300,
    background = "transparent",
    projection = "naturalEarth1",
    colors = ["#8B5CF6"],
    geoData
  } = params;

  // Use provided geoData or fallback to topojson source
  const dataSource = geoData || {
    url: "/travel/world-110m.json",
    format: {
      type: "topojson",
      feature: "countries"
    }
  };

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    width,
    height,
    background,
    data: dataSource,
    transform: [
      {
        filter: `datum.properties.NAME === '${selectedCountry}' || datum.properties.NAME_LONG === '${selectedCountry}' || datum.properties.ADMIN === '${selectedCountry}' || datum.properties.NAME_EN === '${selectedCountry}'`
      }
    ],
    mark: {
      type: "geoshape",
      stroke: colors[0],
      strokeWidth: 2,
      fill: colors[0],
      fillOpacity: 0.5
    },
    projection: {
      type: projection,
      fit: true
    },
    config: {
      view: {
        stroke: null
      }
    }
  };
}

/**
 * Creates an interactive world travel map using Vega (not Vega-Lite) with selectable countries
 * Based on worldTravelMapSpec but with configurable selectable countries
 * Maintains compatibility with clicked_country signal
 */
export function createWorldTravelMapVegaSpec(
  params: MapChartParams & { options?: WorldMapOptions }
): any {
  const {
    width = 800,
    height = 350,
    background = "#7ec2ddff",
    options
  } = params;

  // Extract options for selectable countries
  const selectableCountries = options?.selectableCountries || [];

  // Create the base Vega spec based on worldTravelMapSpec
  const spec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "An interactive world map supporting pan and zoom with selectable countries.",
    "width": width,
    "height": height,
    "autosize": "none",
    "background": background,

    "signals": [
      { "name": "tx", "update": "width / 2" },
      { "name": "ty", "update": "height / 2" },
      {
        "name": "scale",
        "value": 100,
        "on": [{
          "events": {"type": "wheel", "consume": true},
          "update": "clamp(scale * pow(1.0005, -event.deltaY * pow(16, event.deltaMode)), 80, 2000)"
        }]
      },
      {
        "name": "angles",
        "value": [0, 0],
        "on": [{
          "events": "pointerdown",
          "update": "[rotateX, centerY]"
        }]
      },
      {
        "name": "cloned",
        "value": null,
        "on": [{
          "events": "pointerdown",
          "update": "copy('projection')"
        }]
      },
      {
        "name": "start",
        "value": null,
        "on": [{
          "events": "pointerdown",
          "update": "invert(cloned, xy())"
        }]
      },
      {
        "name": "drag", 
        "value": null,
        "on": [{
          "events": "[pointerdown, window:pointerup] > window:pointermove",
          "update": "invert(cloned, xy())"
        }]
      },
      {
        "name": "delta",
        "value": null,
        "on": [{
          "events": {"signal": "drag"},
          "update": "[drag[0] - start[0], start[1] - drag[1]]"
        }]
      },
      {
        "name": "rotateX",
        "value": 0,
        "on": [{
          "events": {"signal": "delta"},
          "update": "angles[0] + delta[0]"
        }]
      },
      {
        "name": "centerY",
        "value": 0,
        "on": [{
          "events": {"signal": "delta"},
          "update": "clamp(angles[1] + delta[1], -60, 60)"
        }]
      },
      // Add the clicked_country signal that travel2 expects
      {
        "name": "clicked_country",
        "value": null,
        "on": [
          {
            "events": "@countries:click",
            // Only emit signal if country is clickable (when we have a list) or always (when no list)
            "update": selectableCountries.length > 0 
              ? "datum.isClickable ? datum : null"
              : "datum"
          }
        ]
      }
    ],

    "projections": [
      {
        "name": "projection",
        "type": "naturalEarth1",
        "scale": {"signal": "scale"},
        "rotate": [{"signal": "rotateX"}, 0, 0],
        "center": [0, {"signal": "centerY"}],
        "translate": [{"signal": "tx"}, {"signal": "ty"}]
      }
    ],

    "data": [
      {
        "name": "country_names",
        "values": [
          {"id": "4", "name": "Afghanistan"}, {"id": "8", "name": "Albania"}, {"id": "12", "name": "Algeria"},
          {"id": "16", "name": "American Samoa"}, {"id": "20", "name": "Andorra"}, {"id": "24", "name": "Angola"},
          {"id": "31", "name": "Azerbaijan"}, {"id": "32", "name": "Argentina"}, {"id": "36", "name": "Australia"},
          {"id": "40", "name": "Austria"}, {"id": "44", "name": "Bahamas"}, {"id": "48", "name": "Bahrain"},
          {"id": "50", "name": "Bangladesh"}, {"id": "51", "name": "Armenia"}, {"id": "52", "name": "Barbados"},
          {"id": "56", "name": "Belgium"}, {"id": "64", "name": "Bhutan"}, {"id": "68", "name": "Bolivia"},
          {"id": "70", "name": "Bosnia and Herzegovina"}, {"id": "72", "name": "Botswana"}, {"id": "76", "name": "Brazil"},
          {"id": "84", "name": "Belize"}, {"id": "90", "name": "Solomon Islands"}, {"id": "96", "name": "Brunei"},
          {"id": "100", "name": "Bulgaria"}, {"id": "104", "name": "Myanmar"}, {"id": "108", "name": "Burundi"},
          {"id": "112", "name": "Belarus"}, {"id": "116", "name": "Cambodia"}, {"id": "120", "name": "Cameroon"},
          {"id": "124", "name": "Canada"}, {"id": "132", "name": "Cape Verde"}, {"id": "140", "name": "Central African Republic"},
          {"id": "144", "name": "Sri Lanka"}, {"id": "148", "name": "Chad"}, {"id": "152", "name": "Chile"},
          {"id": "156", "name": "China"}, {"id": "170", "name": "Colombia"}, {"id": "174", "name": "Comoros"},
          {"id": "175", "name": "Mayotte"}, {"id": "178", "name": "Congo"}, {"id": "180", "name": "Democratic Republic of the Congo"},
          {"id": "184", "name": "Cook Islands"}, {"id": "188", "name": "Costa Rica"}, {"id": "191", "name": "Croatia"},
          {"id": "192", "name": "Cuba"}, {"id": "196", "name": "Cyprus"}, {"id": "203", "name": "Czech Republic"},
          {"id": "204", "name": "Benin"}, {"id": "208", "name": "Denmark"}, {"id": "212", "name": "Dominica"},
          {"id": "214", "name": "Dominican Republic"}, {"id": "218", "name": "Ecuador"}, {"id": "222", "name": "El Salvador"},
          {"id": "226", "name": "Equatorial Guinea"}, {"id": "231", "name": "Ethiopia"}, {"id": "232", "name": "Eritrea"},
          {"id": "233", "name": "Estonia"}, {"id": "242", "name": "Fiji"}, {"id": "246", "name": "Finland"},
          {"id": "250", "name": "France"}, {"id": "254", "name": "French Guiana"}, {"id": "258", "name": "French Polynesia"},
          {"id": "262", "name": "Djibouti"}, {"id": "266", "name": "Gabon"}, {"id": "268", "name": "Georgia"},
          {"id": "270", "name": "Gambia"}, {"id": "276", "name": "Germany"}, {"id": "288", "name": "Ghana"},
          {"id": "292", "name": "Gibraltar"}, {"id": "296", "name": "Kiribati"}, {"id": "300", "name": "Greece"},
          {"id": "308", "name": "Grenada"}, {"id": "312", "name": "Guadeloupe"}, {"id": "316", "name": "Guam"},
          {"id": "320", "name": "Guatemala"}, {"id": "324", "name": "Guinea"}, {"id": "328", "name": "Guyana"},
          {"id": "332", "name": "Haiti"}, {"id": "336", "name": "Holy See"}, {"id": "340", "name": "Honduras"},
          {"id": "348", "name": "Hungary"}, {"id": "352", "name": "Iceland"}, {"id": "356", "name": "India"},
          {"id": "360", "name": "Indonesia"}, {"id": "364", "name": "Iran"}, {"id": "368", "name": "Iraq"},
          {"id": "372", "name": "Ireland"}, {"id": "376", "name": "Palestine"}, {"id": "380", "name": "Italy"},
          {"id": "384", "name": "Côte d'Ivoire"}, {"id": "388", "name": "Jamaica"}, {"id": "392", "name": "Japan"},
          {"id": "398", "name": "Kazakhstan"}, {"id": "400", "name": "Jordan"}, {"id": "404", "name": "Kenya"},
          {"id": "408", "name": "North Korea"}, {"id": "410", "name": "South Korea"}, {"id": "414", "name": "Kuwait"},
          {"id": "417", "name": "Kyrgyzstan"}, {"id": "418", "name": "Laos"}, {"id": "422", "name": "Lebanon"},
          {"id": "426", "name": "Lesotho"}, {"id": "428", "name": "Latvia"}, {"id": "430", "name": "Liberia"},
          {"id": "434", "name": "Libya"}, {"id": "440", "name": "Lithuania"}, {"id": "442", "name": "Luxembourg"},
          {"id": "450", "name": "Madagascar"}, {"id": "454", "name": "Malawi"}, {"id": "458", "name": "Malaysia"},
          {"id": "462", "name": "Maldives"}, {"id": "466", "name": "Mali"}, {"id": "470", "name": "Malta"},
          {"id": "474", "name": "Martinique"}, {"id": "478", "name": "Mauritania"}, {"id": "480", "name": "Mauritius"},
          {"id": "484", "name": "Mexico"}, {"id": "492", "name": "Monaco"}, {"id": "496", "name": "Mongolia"},
          {"id": "498", "name": "Moldova"}, {"id": "499", "name": "Montenegro"}, {"id": "504", "name": "Morocco"},
          {"id": "508", "name": "Mozambique"}, {"id": "512", "name": "Oman"}, {"id": "516", "name": "Namibia"},
          {"id": "520", "name": "Nauru"}, {"id": "524", "name": "Nepal"}, {"id": "528", "name": "Netherlands"},
          {"id": "533", "name": "Aruba"}, {"id": "534", "name": "Sint Maarten"}, {"id": "540", "name": "New Caledonia"},
          {"id": "548", "name": "Vanuatu"}, {"id": "554", "name": "New Zealand"}, {"id": "558", "name": "Nicaragua"},
          {"id": "562", "name": "Niger"}, {"id": "566", "name": "Nigeria"}, {"id": "570", "name": "Niue"},
          {"id": "578", "name": "Norway"}, {"id": "580", "name": "Northern Mariana Islands"}, {"id": "583", "name": "Micronesia"},
          {"id": "584", "name": "Marshall Islands"}, {"id": "585", "name": "Palau"}, {"id": "586", "name": "Pakistan"},
          {"id": "591", "name": "Panama"}, {"id": "598", "name": "Papua New Guinea"}, {"id": "600", "name": "Paraguay"},
          {"id": "604", "name": "Peru"}, {"id": "608", "name": "Philippines"}, {"id": "612", "name": "Pitcairn"},
          {"id": "616", "name": "Poland"}, {"id": "620", "name": "Portugal"}, {"id": "624", "name": "Guinea-Bissau"},
          {"id": "626", "name": "Timor-Leste"}, {"id": "634", "name": "Qatar"}, {"id": "638", "name": "Réunion"},
          {"id": "642", "name": "Romania"}, {"id": "643", "name": "Russia"}, {"id": "646", "name": "Rwanda"},
          {"id": "652", "name": "Saint Barthélemy"}, {"id": "659", "name": "Saint Kitts and Nevis"}, {"id": "662", "name": "Saint Lucia"},
          {"id": "663", "name": "Saint Martin"}, {"id": "670", "name": "Saint Vincent and the Grenadines"}, {"id": "674", "name": "San Marino"},
          {"id": "678", "name": "São Tomé and Príncipe"}, {"id": "682", "name": "Saudi Arabia"}, {"id": "686", "name": "Senegal"},
          {"id": "688", "name": "Serbia"}, {"id": "690", "name": "Seychelles"}, {"id": "694", "name": "Sierra Leone"},
          {"id": "702", "name": "Singapore"}, {"id": "703", "name": "Slovakia"}, {"id": "704", "name": "Vietnam"},
          {"id": "705", "name": "Slovenia"}, {"id": "706", "name": "Somalia"}, {"id": "710", "name": "South Africa"},
          {"id": "716", "name": "Zimbabwe"}, {"id": "724", "name": "Spain"}, {"id": "729", "name": "Sudan"},
          {"id": "740", "name": "Suriname"}, {"id": "748", "name": "Eswatini"}, {"id": "752", "name": "Sweden"},
          {"id": "756", "name": "Switzerland"}, {"id": "760", "name": "Syria"}, {"id": "762", "name": "Tajikistan"},
          {"id": "764", "name": "Thailand"}, {"id": "768", "name": "Togo"}, {"id": "776", "name": "Tonga"},
          {"id": "780", "name": "Trinidad and Tobago"}, {"id": "784", "name": "United Arab Emirates"}, {"id": "788", "name": "Tunisia"},
          {"id": "792", "name": "Turkey"}, {"id": "795", "name": "Turkmenistan"}, {"id": "798", "name": "Tuvalu"},
          {"id": "800", "name": "Uganda"}, {"id": "804", "name": "Ukraine"}, {"id": "807", "name": "North Macedonia"},
          {"id": "818", "name": "Egypt"}, {"id": "826", "name": "United Kingdom"}, {"id": "832", "name": "Curaçao"},
          {"id": "834", "name": "Tanzania"}, {"id": "840", "name": "United States"}, {"id": "854", "name": "Burkina Faso"},
          {"id": "858", "name": "Uruguay"}, {"id": "860", "name": "Uzbekistan"}, {"id": "862", "name": "Venezuela"},
          {"id": "876", "name": "Wallis and Futuna"}, {"id": "882", "name": "Samoa"}, {"id": "887", "name": "Yemen"},
          {"id": "894", "name": "Zambia"}
        ]
      },
      {
        "name": "world",
        "url": "/travel/world-110m.json",
        "format": {
          "type": "topojson",
          "feature": "countries"
        },
        "transform": [
          {
            "type": "lookup",
            "from": "country_names",
            "key": "id",
            "fields": ["id"],
            "values": ["name"],
            "as": ["country_name"],
            "default": "Unknown Country"
          }
        ]
      }
    ],

    "marks": [
      {
        "type": "shape",
        "name": "countries", 
        "from": {"data": "world"},
        "encode": {
          "enter": {
            "strokeWidth": {"value": 0.5},
            "stroke": {"value": "white"},
            "fill": {"value": "#d1d5db"},
            "cursor": {"value": "pointer"},
            "tooltip": {
              "signal": "{title: datum.country_name||'Country ' + datum.id}"
            }
          },
          "update": {
            "fill": [
              // If we have selectable countries, style non-clickable ones differently
              ...(selectableCountries.length > 0 ? [{
                "test": "!datum.isClickable",
                "value": "#f5f5f5"
              }] : []),
              {
                "test": "clicked_country && clicked_country.id == datum.id",
                "value": "#69a656ff"
              },
              {"value": "#d1d5db"}
            ],
            "opacity": selectableCountries.length > 0 ? [
              {"test": "datum.isClickable", "value": 1},
              {"value": 0.3}
            ] : {"value": 1}
          },
          "hover": {
            "fill": {"value": "#69a656ff"},
            "strokeWidth": {"value": 1}
          }
        },
        "transform": [
          {
            "type": "geoshape",
            "projection": "projection"
          }
        ]
      }
    ]
  };

  // Add selectable countries transform if we have a list
  if (selectableCountries.length > 0) {
    // Add the isClickable formula transform
    const worldData = spec.data.find(d => d.name === 'world');
    if (worldData && worldData.transform) {
      worldData.transform.push({
        "type": "formula",
        "expr": selectableCountries.map(country => 
          `datum.country_name === '${country.replace(/'/g, "\\'")}'`
        ).join(' || '),
        "as": "isClickable"
      } as any);
    }
  }

  return spec;
}