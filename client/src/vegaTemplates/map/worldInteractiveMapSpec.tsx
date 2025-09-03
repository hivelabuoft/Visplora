import { MapChartParams } from '../types/interfaces';

export interface MapChartData {
  [key: string]: string | number | undefined;
}

/**
 * Creates an interactive world map with country selection and hover effects
 * Based on workingWorldMapSpec and fallbackWorldMapSpec patterns from travel dashboard
 */
export function createWorldInteractiveMapSpec(
  params: MapChartParams
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
    legend
  } = params;

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
      ...(tooltipConfig.length > 0 && { tooltip: tooltipConfig })
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