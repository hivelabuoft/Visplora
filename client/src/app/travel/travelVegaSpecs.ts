// Vega-Lite specifications for Travel Numbers dashboard
import { field, pad } from 'vega';
import { CostTimelineData, SafetyComparisonData, VisitorFlowSeasonalData, DestinationMetrics } from './travelDataTypes';
import { getMajorCities } from './travelDataUtils';
import { off, title } from 'process';
import { tooltip } from 'leaflet';

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
  'Turkey', 'United Arab Emirates', 'Saudi Arabia', 'Palestine', 'Jordan', 'Qatar', 'Kuwait', 
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
  '376': 'Palestine',
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

// Interactive zoomable world travel map specification using local world-110m.json file
export const worldTravelMapSpec = () => ({
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "An interactive world map supporting pan and zoom.",
  "width": 800,
  "height": 350,
  "autosize": "none",
  "background": "#7ec2ddff ",

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
    {
      "name": "clicked_country",
      "value": null,
      "on": [
        {
          "events": "@countries:click",
          "update": "datum"
        }
      ]
    }
  ],

  "projections": [
    {
      "name": "projection",
      "type": "mercator",
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
          },
        },
        "update": {
          "fill": [
            {
              "test": "clicked_country && clicked_country.id == datum.id",
              "value": "#69a656ff "
            },
            {"value": "#d1d5db"}
          ]
        },
        "hover": {
          "fill": {"value": "#69a656ff"},
          "strokeWidth": {"value": 1}
        }
      },
      "transform": [
        { "type": "geoshape", "projection": "projection" }
      ]
    }
  ]
});

// Enhanced world map with proper sizing for larger container
export const worldMapSpec = () => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 800,
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
    "url": "client\public\travel\world-110m.json",
    "format": {
      "type": "topojson",
      "feature": "countries"
    }
  },
  "transform": [
    {
      "calculate": `indexof(['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Norway', 'Sweden', 'Denmark', 'Finland', 'Poland', 'Czech Republic', 'Hungary', 'Greece', 'Turkey', 'Russia', 'China', 'Japan', 'South Korea', 'India', 'Thailand', 'Vietnam', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines', 'Nepal', 'Sri Lanka', 'Australia', 'New Zealand', 'Fiji', 'South Africa', 'Egypt', 'Morocco', 'Kenya', 'Tanzania', 'Ghana', 'Nigeria', 'United Arab Emirates', 'Saudi Arabia', 'Palestine', 'Jordan', 'Qatar'], datum.properties.NAME) >= 0`,
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

// Travel growth trends chart (visitor counts over time)
export const travelGrowthTrendsSpec = (data: Array<{city: string, year: number, visitors: number, change?: number}>) => {
  // Add hardcoded data with more information
  const hardcodedData = data && data.length > 0 ? data : [
    { city: 'New York', year: 2025, visitors: 15200000, change: 8.5, growth: 'High', category: 'Metro' },
    { city: 'Los Angeles', year: 2025, visitors: 12800000, change: 6.2, growth: 'Medium', category: 'Metro' },
    { city: 'Chicago', year: 2025, visitors: 9500000, change: 4.1, growth: 'Medium', category: 'Metro' },
    { city: 'Miami', year: 2025, visitors: 8200000, change: 12.3, growth: 'High', category: 'Coastal' },
    { city: 'San Francisco', year: 2025, visitors: 7800000, change: 3.8, growth: 'Low', category: 'Tech Hub' }
  ].map((d, index) => ({ ...d, sortIndex: index }));
  
  // Sort data by most recent year visitors in descending order
  const sortedData = hardcodedData
    .sort((a, b) => b.visitors - a.visitors)
    .map((d, index) => ({ ...d, sortIndex: index }));
  
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
    "width": 220,
    "height": 205,
    "background": "transparent",
    "data": {
      "values": sortedData
    },
    "params": [
      {
        "name": "hover_growth_bar",
        "select": {
          "type": "point" as const,
          "on": "pointerover" as const,
          "clear": "pointerout" as const
        }
      },
      {
        "name": "select_city",
        "select": "point" as const
      }
    ],
    "mark": {
      "type": "bar" as const,
      "cursor": "pointer" as const,
      "cornerRadiusEnd": 2
    },
    "encoding": {
      "y": {
        "field": "city",
        "type": "nominal" as const,
        "sort": {
          "field": "visitors",
          "order": "descending" as const
        },
        "axis": {
          "labelColor": "#888",
          "titleColor": "#888",
          "labelFontSize": 10,
          "labelLimit": 80,
          "title": null,
          "grid": false,
          "ticks": true,
          "domain": true
        }
      },
      "x": {
        "field": "visitors",
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
          "format": ".2s"
        }
      },
      "color": {
        "field": "change",
        "type": "quantitative" as const,
        "scale": {
          "domain": [0, 15],
          "range": ["#94a3b8", "#3b82f6", "#16a34a"]
        },
        "legend": null
      },
      "stroke": {
        "condition": [
          {
            "param": "select_city",
            "empty": false,
            "value": "#272729"
          },
          {
            "param": "hover_growth_bar",
            "empty": false,
            "value": "#272729"
          }
        ],
        "value": "transparent"
      },
      "strokeWidth": {
        "condition": [
          {
            "param": "select_city",
            "empty": false,
            "value": 1
          },
          {
            "param": "hover_growth_bar",
            "empty": false,
            "value": 1
          }
        ],
        "value": 0
      },
      "opacity": {
        "condition": [
          {
            "param": "select_city",
            "empty": false,
            "value": 1
          },
          {
            "param": "hover_growth_bar",
            "empty": false,
            "value": 0.8
          }
        ],
        "value": 0.6
      },
      "tooltip": [
        {"field": "city", "type": "nominal" as const, "title": "City"},
        {"field": "year", "type": "quantitative" as const, "title": "Year"},
        {"field": "visitors", "type": "quantitative" as const, "title": "Visitors", "format": ",.0f"},
        {"field": "change", "type": "quantitative" as const, "title": "Growth %", "format": "+.1f"},
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

// Cost timeline chart specification - enhanced with house price timeline structure
export const costTimelineChartSpec = (data: CostTimelineData[]) => {
  // Transform data for multi-series format similar to house price timeline
  const transformedData = data.flatMap(d => [
    { date: d.date, year: d.year, month: d.month, cost: d.avgHotelPrice, series: 'Hotel Cost', destination: d.destination },
    { date: d.date, year: d.year, month: d.month, cost: d.avgMealPrice, series: 'Meal Cost', destination: d.destination },
    { date: d.date, year: d.year, month: d.month, cost: d.avgTransportCost, series: 'Transport Cost', destination: d.destination }
  ]);

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
    "width": 340,
    "height": 160,
    "background": "transparent",
    "data": {
      "values": transformedData
    },
    "layer": [
      {
        "encoding": {
          "x": {
            "field": "date" ,
            "type": "temporal" as const,
            "axis": {
              "labelColor": "#888",
              "titleColor": "#888",
              "labelFontSize": 8,
              "labelAngle": -45,
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
              "ticks": true,
              "domain": true,
              "title": null,
              "format": "$,.0f"
            }
          },
          "color": {
            "field": "series",
            "type": "nominal" as const,
            "scale": {
              "domain": ["Hotel Cost", "Meal Cost", "Transport Cost"],
              "range": ["#aea630ff", "#3b82f6", "#16a34a"]
            },
            "legend": {
              "title": null,
              "labelFontSize": 10,
              "symbolSize": 80,
              "orient": "right" as const,
              "padding": 10,
              "offset": 0,
              "symbolType": "circle" as const
            }
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
              "x": {"type": "temporal" as const, "field": "date", "aggregate": "min" as const}
            }
          },
          {
            "encoding": {
              "text": {"type": "quantitative" as const, "field": "cost", "format": "$,.0f"},
              "x": {"type": "temporal" as const, "field": "date"},
              "y": {"type": "quantitative" as const, "field": "cost"}
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

// Safety comparison bar chart by region
export const safetyComparisonBarChartSpec = (data: SafetyComparisonData[]) => {
  // Sort data by overall safety score (descending) and add index
  const sortedData = data
    .sort((a, b) => b.overallSafety - a.overallSafety)
    .map((d, index) => ({ ...d, sortIndex: index }));

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
    "width": 450,
    "height": 230,
    "background": "transparent",
    "data": {
      "values": sortedData
    },
    "transform": [
      {"calculate": "datum.crimeIndex", "as": "crimeIndex_positive"},
      {"calculate": "-datum.politicalRisk", "as": "politicalRisk_negative"}
    ],
    "layer": [
      {
        "params": [
          {
            "name": "hover_safety_bar",
            "select": {
              "type": "point" as const,
              "on": "pointerover" as const,
              "clear": "pointerout" as const
            }
          },
          {
            "name": "select_safety",
            "select": "point" as const
          }
        ],
        "transform": [
          {"fold": ["crimeIndex_positive", "politicalRisk_negative"], "as": ["risk_type", "risk_value"] as [string, string]},
          {"calculate": "datum.risk_type == 'crimeIndex_positive' ? 'Crime Risk' : 'Political Risk'", "as": "riskLabel"},
          {"calculate": "abs(datum.risk_value)", "as": "absolute_risk"}
        ],
        "mark": {
          "type": "bar" as const,
          "cursor": "pointer" as const,
          "cornerRadiusEnd": 2
        },
        "encoding": {
          "y": {
            "field": "region",
            "type": "nominal" as const,
            "scale": {
              "domain": sortedData.map(d => d.region)
            },
            "axis": null
          },
          "x": {
            "field": "risk_value",
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
            "field": "riskLabel",
            "type": "nominal" as const,
            "scale": {
              "domain": ["Crime Risk", "Political Risk"],
              "range": ["#ef4444", "#f59e0b"]
            },
            "legend": {
              "title": null,
              "direction": "horizontal" as const,
              "orient": "top" as const,
              "titleColor": "#888",
              "labelColor": "#888",
              "titleFontSize": 10,
              "labelFontSize": 9,
              "symbolSize": 80,
              "offset": 10
            }
          },
          "stroke": {
            "value": "#ffffff"
          },
          "strokeWidth": {
            "condition": [
              {
                "param": "select_safety",
                "empty": false,
                "value": 1
              },
              {
                "param": "hover_safety_bar",
                "empty": false,
                "value": 1
              }
            ],
            "value": 0
          },
          "opacity": {
            "condition": [
              {
                "param": "select_safety",
                "empty": false,
                "value": 1
              },
              {
                "param": "hover_safety_bar",
                "empty": false,
                "value": 0.8
              }
            ],
            "value": 0.7
          },
          "tooltip": [
            {"field": "region", "type": "nominal" as const, "title": "Region"},
            {"field": "riskLabel", "type": "nominal" as const, "title": "Risk Type"},
            {
              "field": "absolute_risk", 
              "type": "quantitative" as const, 
              "title": "Risk Score", 
              "format": ".1f"
            },
            {"field": "overallSafety", "type": "quantitative" as const, "title": "Overall Safety", "format": ".1f"}
          ]
        }
      },
      {
        "mark": {
          "type": "text" as const,
          "align": "center" as const,
          "baseline": "middle" as const,
          "dx": 225,
          "dy": 0,
          "fontSize": 9,
          "fontWeight": "bold" as const,
          "color": "#444"
        },
        "encoding": {
          "y": {
            "field": "region",
            "type": "nominal" as const,
            "scale": {
              "domain": sortedData.map(d => d.region)
            }
          },
          "x": {
            "value": 0
          },
          "text": {
            "field": "region",
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

// Visitor flow seasonal chart
// Visitor flow seasonal chart with mean line
export const visitorFlowSeasonalChartSpec = (data: VisitorFlowSeasonalData[]) => {
  // Calculate mean visitor flow across all months
  const meanVisitorFlow = data.reduce((sum, d) => sum + d.arrivals, 0) / data.length;

  const spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
    "width": 390,
    "height": 160,
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
            "sort": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            "axis": {
              "labelColor": "#888",
              "titleColor": "#888",
              "labelFontSize": 10,
              "labelAngle": 0,
              "labelPadding": 5,
              "title": null,
              "grid": false,
              "ticks": true,
              "domain": true
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
              "title": "Arrival Count",
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
            "type": "ordinal" as const,
            "sort": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          },
          "y": {
            "field": "occupancyRate",
            "title": "Occupancy Rate (%)",
            "type": "quantitative" as const,
            "axis": {
              "labelColor": "#888",
              "titleColor": "#888",
              "labelFontSize": 8,
              "gridColor": "#888",
              "gridDash": [2, 2],
              "grid": false,
              "title": "Occupancy Rate (%)",
              "format": ".2s"
            },            
            "scale": {
              "domain": [0, 100]
            }
          },
          "tooltip": [
            {"field": "monthName", "type": "nominal" as const, "title": "Month"},
            {"field": "occupancyRate", "type": "quantitative" as const, "title": "Occupancy Rate", "format": ".0f"}
          ]
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
  };
  
  return {
    spec,
    meanVisitorFlow
  };
};

// Reviews distribution pie chart with enhanced legends and styling
export const reviewsDistributionPieSpec = (data: Array<{rating: string, count: number, percentage: number}>) => {
  const totalReviews = data.reduce((sum, d) => sum + d.count, 0);
  
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
    "width": 120,
    "height": 120,
    "background": "transparent",
    "layer": [
      {
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
          "innerRadius": 42,
          "outerRadius": 60,
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
              "domain": ["5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"],
              "range": ["#16a34a", "#22c55e", "#eab308", "#f59e0b", "#ef4444"]
            },
            "legend": {
              "title": "Rating Categories",
              "orient": "right" as const,
              "titleColor": "#888",
              "labelColor": "#888",
              "titleFontSize": 11,
              "labelFontSize": 10,
              "symbolSize": 200,
              "offset": 30,
              "padding": 0,
              "symbolType": "circle" as const
            }
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
        }
      },
      {
        "data": {
          "values": [{"text": totalReviews.toLocaleString(), "category": "Total"}]
        },
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 16,
          "fontWeight": "bold",
          "dy": -10,
          "color": "#333"
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
          "values": [{"text": "Total Reviews", "category": "Label"}]
        },
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 10,
          "dy": 8,
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
  };
};

// Safety breakdown pie chart with legends and enhanced styling
export const safetyBreakdownPieSpec = (data: Array<{category: string, score: number, percentage: number}>) => {
  const overallScore = data.reduce((sum, d) => sum + d.score, 0) / data.length;
  
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
    "width": 120,
    "height": 120,
    "background": "transparent",
    "layer": [
      {
        "data": {
          "values": data
        },
        "params": [
          {
            "name": "hover_safety",
            "select": {
              "type": "point",
              "on": "mouseover",
              "clear": "mouseout"
            }
          }
        ],
        "mark": {
          "type": "arc" as const,
          "innerRadius": 42,
          "outerRadius": 60,
          "cursor": "pointer" as const
        },
        "encoding": {
          "theta": {
            "field": "score",
            "type": "quantitative" as const
          },
          "color": {
            "field": "category",
            "type": "nominal" as const,
            "scale": {
              "domain": ["Very Safe", "Safe", "Moderate", "Caution", "High Risk"],
              "range": ["#16a34a", "#22c55e", "#eab308", "#f59e0b", "#ef4444"]
            },
            "legend": {
              "title": "Safety Levels",
              "orient": "right" as const,
              "titleColor": "#888",
              "labelColor": "#888",
              "titleFontSize": 11,
              "labelFontSize": 10,
              "symbolSize": 200,
              "offset": 30,
              "padding": 0,
              "symbolType": "circle" as const
            }
          },
          "stroke": {
            "condition": {
              "param": "hover_safety",
              "value": "white"
            },
            "value": "white"
          },
          "strokeWidth": {
            "condition": {
              "param": "hover_safety",
              "value": 2
            },
            "value": 0.5
          },
          "opacity": {
            "condition": {
              "param": "hover_safety",
              "value": 1
            },
            "value": 0.7
          },
          "tooltip": [
            {"field": "category", "type": "nominal" as const, "title": "Safety Level"},
            {"field": "score", "type": "quantitative" as const, "title": "Score", "format": ".0f"},
            {"field": "percentage", "type": "quantitative" as const, "title": "Percentage", "format": ".1f"}
          ]
        }
      },
      {
        "data": {
          "values": [{"text": Math.round(overallScore).toString(), "category": "Overall"}]
        },
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 16,
          "fontWeight": "bold",
          "dy": -10,
          "color": overallScore >= 80 ? "#16a34a" : overallScore >= 60 ? "#eab308" : "#ef4444"
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
          "values": [{"text": "Average Score", "category": "Label"}]
        },
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "fontSize": 10,
          "dy": 8,
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
  };
};

// Small destination map for KPI cards
// Country detail map - simplified to show only country boundaries
export const countryDetailMapSpec = (selectedDestination: string) => {
  console.log('Country detail map for:', selectedDestination);
  return {
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 400,
  "height": 300,
  "background": "transparent",
  "data": {
    "url": "/travel/world-110m.json",
    "format": {
      "type": "topojson" as const,
      "feature": "countries"
    }
  },
  "transform": [
    {
      "filter": `datum.properties.NAME === '${selectedDestination}' || datum.properties.NAME_LONG === '${selectedDestination}' || datum.properties.ADMIN === '${selectedDestination}' || datum.properties.NAME_EN === '${selectedDestination}'`
    }
  ],
  "mark": {
    "type": "geoshape" as const,
    "stroke": "#8B5CF6",
    "strokeWidth": 2,
    "fill": "#8B5CF6",
    "fillOpacity": 0.5
  },
  "projection": {
    "type": "naturalEarth1" as const,
    "fit": true
  },
  "config": {
    "background": "transparent",
    "view": {
      "stroke": null
    }
  }
};};

// Debug version - shows all countries to verify data loading
export const debugAllCountriesMapSpec = () => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 400,
  "height": 300,
  "background": "transparent",
  "data": {
    "url": "/travel/world-110m.json",
    "format": {
      "type": "topojson" as const,
      "feature": "countries"
    }
  },
  "mark": {
    "type": "geoshape" as const,
    "stroke": "white",
    "strokeWidth": 0.5,
    "fill": "#ccc"
  },
  "projection": {
    "type": "naturalEarth1" as const
  },
  "config": {
    "background": "transparent",
    "view": {
      "stroke": null
    }
  }
});

// Cultural diversity bar chart - enhanced with school education facilities styling
export const culturalDiversityBarSpec = (data: Array<{metric: string, score: number, maxScore: number}>) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 200,
  "height": 160,
  "background": "transparent",
  "data": {
    "values": data.map(d => ({
      ...d,
      percentage: (d.score / d.maxScore) * 100
    }))
  },
  "params": [
    {
      "name": "hover_culture_bar",
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
    "cornerRadiusEnd": 4,
    "height": 12
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
        "labelFontSize": 10,
        "labelLimit": 120,
        "title": null,
        "grid": false,
        "ticks": true,
        "domain": true
      }
    },
    "x": {
      "field": "percentage",
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
        "ticks": true,
        "domain": true,
        "title": null,
        "format": ".0f"
      }
    },
    "color": {
      "field": "metric",
      "type": "nominal" as const,
      "scale": {
        "range": ["#16a34a" ]
      },
      "legend": null
    },
    "stroke": {
      "condition": {
        "param": "hover_culture_bar",
        "value": "transparent"
      },
      "value": "transparent"
    },
    "strokeWidth": {
      "condition": {
        "param": "hover_culture_bar",
        "value": 0
      },
      "value": 0
    },
    "opacity": {
      "condition": {
        "param": "hover_culture_bar",
        "value": 1
      },
      "value": 0.7
    },
    "tooltip": [
      {"field": "metric", "type": "nominal" as const, "title": "Cultural Metric"},
      {"field": "score", "type": "quantitative" as const, "title": "Score", "format": ".0f"},
      {"field": "maxScore", "type": "quantitative" as const, "title": "Max Score", "format": ".0f"},
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

// Environmental quality multi-metric bar chart - enhanced with better interactions and scatter plot option
export const environmentalQualityScatterSpec = (data: Array<{city: string, aqi: number, greenSpacePct: number, waterQuality: number, overallScore: number}>) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 360,
  "height": 180,
  "background": "transparent",
  "data": {
    "values": data
  },
  "params": [
    {
      "name": "hover_env_scatter",
      "select": {
        "type": "point" as const,
        "on": "pointerover" as const,
        "clear": "pointerout" as const
      }
    },
    {
      "name": "select_city",
      "select": {
        "type": "point" as const
      }
    }
  ],
  "mark": {
    "type": "circle" as const,
    "cursor": "pointer" as const,
    "strokeWidth": 2
  },
  "encoding": {
    "x": {
      "field": "greenSpacePct",
      "type": "quantitative" as const,
      "scale": {
        "domain": [0, 60],
        "nice": true
      },
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "grid": true,
        "gridColor": "#888",
        "gridDash": [4, 10],
        "ticks": true,
        "domain": true,
        "title": "Green Space %",
        "titleFontSize": 10
      }
    },
    "y": {
      "field": "waterQuality",
      "type": "quantitative" as const,
      "scale": {
        "domain": [70, 100],
        "nice": true
      },
      "axis": {
        "labelColor": "#888",
        "titleColor": "#888",
        "labelFontSize": 8,
        "grid": false,
        "gridColor": "#888",
        "gridDash": [4, 50],
        "ticks": true,
        "domain": true,
        "title": "Water Quality Score",
        "titleFontSize": 10
      }
    },
    "size": {
      "field": "overallScore",
      "type": "quantitative" as const,
      "scale": {
        "type": "linear",
        "range": [200, 800],
        "domain": [50, 100],
        "clamp": true
      },
      "legend": {
        "title": "Overall Score",
        "titleColor": "#888",
        "labelColor": "#888",
        "titleFontSize": 9,
        "labelFontSize": 8,
        "orient": "right" as const,
        "offset": 15,
        "padding": 0,
        "values": [50, 60, 70, 80, 90, 100]
      }
    },
    "color": {
      "field": "aqi",
      "type": "quantitative" as const,
      "scale": {
        "scheme": "redyellowgreen",
        "domain": [50, 10],
        "reverse": true
      },
      "legend": {
        "title": "Air Quality (Lower AQI = Better)",
        "titleColor": "#888",
        "labelColor": "#888",
        "titleFontSize": 9,
        "labelFontSize": 8,
        "offset": 10,
        "orient": "top" as const
      }
    },
    "stroke": {
      "condition": [
        {
          "param": "select_city",
          "empty": false,
          "value": "#272729"
        },
        {
          "param": "hover_env_scatter",
          "empty": false,
          "value": "#272729"
        }
      ],
      "value": "white"
    },
    "opacity": {
      "condition": [
        {
          "param": "select_city",
          "empty": false,
          "value": 1
        },
        {
          "param": "hover_env_scatter",
          "empty": false,
          "value": 0.9
        }
      ],
      "value": 0.7
    },
    "tooltip": [
      {"field": "city", "type": "nominal" as const, "title": "City"},
      {"field": "aqi", "type": "quantitative" as const, "title": "Air Quality Index", "format": ".0f"},
      {"field": "greenSpacePct", "type": "quantitative" as const, "title": "Green Space %", "format": ".1f"},
      {"field": "waterQuality", "type": "quantitative" as const, "title": "Water Quality", "format": ".0f"},
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

// Environmental quality multi-metric bar chart - enhanced with better interactions
export const environmentalQualityBarSpec = (data: Array<{city: string, aqi: number, greenSpacePct: number, waterQuality: number, overallScore: number}>) => ({
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json" as const,
  "width": 280,
  "height": 180,
  "background": "transparent",
  "data": {
    "values": data.slice(0, 6) // Top 6 cities for better visibility
  },
  "transform": [
    {
      "fold": ["aqi", "greenSpacePct", "waterQuality"],
      "as": ["envType", "envScore"] as [string, string]
    },
    {
      "calculate": "datum.envType === 'aqi' ? (100 - datum.envScore) : datum.envScore", // Invert AQI so higher is better
      "as": "normalizedScore"
    },
    {
      "calculate": "datum.envType === 'aqi' ? 'Air Quality' : datum.envType === 'greenSpacePct' ? 'Green Space %' : 'Water Quality'",
      "as": "envLabel"
    }
  ],
  "params": [
    {
      "name": "hover_env_bar",
      "select": {
        "type": "point" as const,
        "on": "pointerover" as const,
        "clear": "pointerout" as const
      }
    },
    {
      "name": "select_city",
      "select": {
        "type": "point" as const,
        "encodings": ["y"] as ("y")[]
      }
    }
  ],
  "mark": {
    "type": "bar" as const,
    "cursor": "pointer" as const,
    "cornerRadiusEnd": 3
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
        "labelFontSize": 9,
        "labelLimit": 100,
        "title": null,
        "grid": false,
        "ticks": true,
        "domain": true
      }
    },
    "x": {
      "field": "normalizedScore",
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
        "ticks": true,
        "domain": true,
        "title": null,
        "format": ".0f"
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
        "title": "Environmental Metrics",
        "orient": "top" as const,
        "titleColor": "#888",
        "labelColor": "#888",
        "titleFontSize": 10,
        "labelFontSize": 9,
        "symbolSize": 80,
        "offset": 5,
        "values": ["aqi", "greenSpacePct", "waterQuality"],
        "labelExpr": "datum.value === 'aqi' ? 'Air Quality (inverted)' : datum.value === 'greenSpacePct' ? 'Green Space %' : 'Water Quality'"
      }
    },
    "stroke": {
      "condition": [
        {
          "param": "select_city",
          "empty": false,
          "value": "#272729"
        },
        {
          "param": "hover_env_bar",
          "empty": false,
          "value": "#272729"
        }
      ],
      "value": "transparent"
    },
    "strokeWidth": {
      "condition": [
        {
          "param": "select_city",
          "empty": false,
          "value": 1
        },
        {
          "param": "hover_env_bar",
          "empty": false,
          "value": 1
        }
      ],
      "value": 0
    },
    "opacity": {
      "condition": [
        {
          "param": "select_city",
          "empty": false,
          "value": 1
        },
        {
          "param": "hover_env_bar",
          "empty": false,
          "value": 0.9
        }
      ],
      "value": 0.7
    },
    "tooltip": [
      {"field": "city", "type": "nominal" as const, "title": "City"},
      {"field": "envLabel", "type": "nominal" as const, "title": "Metric"},
      {"field": "envScore", "type": "quantitative" as const, "title": "Raw Score", "format": ".1f"},
      {"field": "normalizedScore", "type": "quantitative" as const, "title": "Normalized Score", "format": ".1f"},
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