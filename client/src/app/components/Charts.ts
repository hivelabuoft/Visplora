// All Vega-Lite Chart Specifications for London Data

export interface ChartSpec {
  id: string;
  title: string;
  category: string;
  spec: object; // Vega-Lite specification
}

export const CHARTS: { [key: string]: ChartSpec } = {
  // CRIME & SAFETY CHARTS
  crime_by_borough: {
    id: "crime_by_borough",
    title: "Crime Count by Borough",
    category: "Crime & Safety",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Crime Count by Borough (2022-2023)",
      width: 240,
      height: 180,
      data: {
        url: "/dataset/london/crime-rates/london_crime_data_2022_2023.csv"
      },
      transform: [
        {
          aggregate: [{ op: "count", as: "crime_count" }],
          groupby: ["borough_name"]
        },
        { window: [{ op: "rank", as: "rank" }], sort: [{ field: "crime_count", order: "descending" }] },
        { filter: "datum.rank <= 10" }
      ],
      mark: { type: "bar", color: "#e74c3c" },
      encoding: {
        x: {
          field: "borough_name",
          type: "nominal",
          title: "Borough",
          sort: { field: "crime_count", order: "descending" },
          axis: { labelAngle: -45 }
        },
        y: {
          field: "crime_count",
          type: "quantitative",
          title: "Total Crimes"
        },
        tooltip: [
          { field: "borough_name", type: "nominal", title: "Borough" },
          { field: "crime_count", type: "quantitative", title: "Crime Count" }
        ]
      }
    }
  },

  crime_categories_pie: {
    id: "crime_categories_pie",
    title: "Crime Categories Distribution",
    category: "Crime & Safety",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Crime Categories Distribution",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/crime-rates/london_crime_data_2022_2023.csv"
      },
      transform: [
        {
          aggregate: [{ op: "count", as: "crime_count" }],
          groupby: ["crime_category_name"]
        }
      ],
      mark: { type: "arc", innerRadius: 50, stroke: "#fff" },
      encoding: {
        theta: { field: "crime_count", type: "quantitative" },
        color: {
          field: "crime_category_name",
          type: "nominal",
          title: "Crime Category",
          scale: { scheme: "category20" }
        },
        tooltip: [
          { field: "crime_category_name", type: "nominal", title: "Crime Type" },
          { field: "crime_count", type: "quantitative", title: "Count" }
        ]
      }
    }
  },

  crime_trends_timeline: {
    id: "crime_trends_timeline",
    title: "Crime Trends Over Time",
    category: "Crime & Safety",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Crime Trends Over Time (2022-2023)",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/crime-rates/london_crime_data_2022_2023.csv"
      },
      transform: [
        {
          aggregate: [{ op: "count", as: "crime_count" }],
          groupby: ["date", "crime_category_name"]
        },
        {
          filter: {
            field: "crime_category_name",
            oneOf: ["Violence and sexual offences", "Theft", "Anti-social behaviour", "Criminal damage and arson"]
          }
        }
      ],
      mark: { type: "line", point: true, strokeWidth: 2 },
      encoding: {
        x: {
          field: "date",
          type: "temporal",
          title: "Date",
          timeUnit: "yearmonth"
        },
        y: {
          field: "crime_count",
          type: "quantitative",
          title: "Crime Count"
        },
        color: {
          field: "crime_category_name",
          type: "nominal",
          title: "Crime Category",
          scale: { scheme: "category10" }
        },
        tooltip: [
          { field: "date", type: "temporal", title: "Date" },
          { field: "crime_category_name", type: "nominal", title: "Crime Type" },
          { field: "crime_count", type: "quantitative", title: "Count" }
        ]
      }
    }
  },

  safety_heatmap: {
    id: "safety_heatmap",
    title: "Borough Safety Overview",
    category: "Crime & Safety",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Borough Safety Overview (Lower is Safer)",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/crime-rates/london_crime_data_2022_2023.csv"
      },
      transform: [
        {
          aggregate: [{ op: "count", as: "total_crimes" }],
          groupby: ["borough_name"]
        },
        {
          window: [{ op: "percent_rank", as: "safety_percentile" }],
          sort: [{ field: "total_crimes", order: "ascending" }]
        }
      ],
      mark: { type: "rect", stroke: "#fff", strokeWidth: 1 },
      encoding: {
        x: {
          field: "borough_name",
          type: "nominal",
          title: "Borough",
          axis: { labelAngle: -45 }
        },
        y: {
          field: "safety_percentile",
          type: "quantitative",
          title: "Safety Rank (0=Safest, 1=Least Safe)",
          scale: { range: [0, 20] }
        },
        color: {
          field: "total_crimes",
          type: "quantitative",
          title: "Total Crimes",
          scale: { scheme: "reds" }
        },
        tooltip: [
          { field: "borough_name", type: "nominal", title: "Borough" },
          { field: "total_crimes", type: "quantitative", title: "Total Crimes" }
        ]
      }
    }
  },

  // DEMOGRAPHICS CHARTS
  population_by_borough: {
    id: "population_by_borough",
    title: "Top 10 Most Populated Boroughs",
    category: "Demographics",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Top 10 Most Populated Boroughs (2021)",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/population/population 1801 to 2021.csv"
      },
      transform: [
        { calculate: "toNumber(replace(datum['2021'], ',', ''))", as: "population_2021" },
        { filter: "datum.population_2021 != null" },
        { window: [{ op: "rank", as: "rank" }], sort: [{ field: "population_2021", order: "descending" }] },
        { filter: "datum.rank <= 10" }
      ],
      mark: { type: "bar", color: "#3498db" },
      encoding: {
        x: {
          field: "population_2021",
          type: "quantitative",
          title: "Population (2021)",
          format: ",.0f"
        },
        y: {
          field: "area",
          type: "nominal",
          title: "Borough",
          sort: { field: "population_2021", order: "descending" }
        },
        tooltip: [
          { field: "area", type: "nominal", title: "Borough" },
          { field: "population_2021", type: "quantitative", title: "Population", format: ",.0f" }
        ]
      }
    }
  },

  population_growth_timeline: {
    id: "population_growth_timeline",
    title: "London Population Growth",
    category: "Demographics",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "London Population Growth (1801-2021)",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/population/population 1801 to 2021.csv"
      },
      transform: [
        {
          fold: ["1801", "1811", "1821", "1831", "1841", "1851", "1861", "1871", "1881", "1891", "1901", "1911", "1921", "1931", "1939", "1951", "1961", "1971", "1981", "1991", "2001", "2011", "2021"],
          as: ["year", "population"]
        },
        { calculate: "toNumber(datum.year)", as: "year_num" },
        { calculate: "toNumber(replace(datum.population, ',', ''))", as: "population_num" },
        { filter: "datum.population_num != null" },
        {
          aggregate: [{ op: "sum", field: "population_num", as: "total_population" }],
          groupby: ["year_num"]
        }
      ],
      mark: { type: "line", point: true, strokeWidth: 3, color: "#2ecc71" },
      encoding: {
        x: {
          field: "year_num",
          type: "quantitative",
          title: "Year",
          scale: { domain: [1800, 2025] }
        },
        y: {
          field: "total_population",
          type: "quantitative",
          title: "Total Population",
          format: ",.0f"
        },
        tooltip: [
          { field: "year_num", type: "quantitative", title: "Year" },
          { field: "total_population", type: "quantitative", title: "Population", format: ",.0f" }
        ]
      }
    }
  },

  ethnicity_distribution: {
    id: "ethnicity_distribution",
    title: "Ethnicity Distribution Overview",
    category: "Demographics",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "London Ethnicity Distribution",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/ethnicity/Ethnic group.csv"
      },
      transform: [
        {
          aggregate: [
            { op: "sum", field: "White British", as: "White_British" },
            { op: "sum", field: "Asian Indian", as: "Asian_Indian" },
            { op: "sum", field: "Black African", as: "Black_African" },
            { op: "sum", field: "Asian Pakistani", as: "Asian_Pakistani" },
            { op: "sum", field: "White Other", as: "White_Other" }
          ]
        },
        { fold: ["White_British", "Asian_Indian", "Black_African", "Asian_Pakistani", "White_Other"], as: ["ethnicity", "population"] }
      ],
      mark: { type: "arc", innerRadius: 50 },
      encoding: {
        theta: { field: "population", type: "quantitative" },
        color: { field: "ethnicity", type: "nominal", scale: { scheme: "category10" } },
        tooltip: [
          { field: "ethnicity", type: "nominal", title: "Ethnicity" },
          { field: "population", type: "quantitative", title: "Population", format: ",.0f" }
        ]
      }
    }
  },

  diversity_by_borough: {
    id: "diversity_by_borough",
    title: "Country of Birth by Borough",
    category: "Demographics",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Country of Birth Distribution by Borough",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/country-of-births/cob-borough.csv"
      },
      transform: [
        { fold: ["UK born", "EU born", "Non-EU born"], as: ["birth_category", "population"] },
        { filter: { field: "Area", oneOf: ["Camden", "Westminster", "Hackney", "Tower Hamlets", "Southwark", "Lambeth"] } }
      ],
      mark: { type: "bar" },
      encoding: {
        x: { field: "Area", type: "nominal", axis: { labelAngle: -45 } },
        y: { field: "population", type: "quantitative", stack: "normalize" },
        color: { 
          field: "birth_category", 
          type: "nominal", 
          scale: { range: ["#27ae60", "#f39c12", "#e74c3c"] },
          title: "Birth Origin"
        },
        tooltip: [
          { field: "Area", type: "nominal", title: "Borough" },
          { field: "birth_category", type: "nominal", title: "Birth Category" },
          { field: "population", type: "quantitative", title: "Population", format: ",.0f" }
        ]
      }
    }
  },

  // HOUSING & ECONOMY CHARTS
  house_prices_by_borough: {
    id: "house_prices_by_borough",
    title: "Most Expensive Boroughs",
    category: "Housing & Economy",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Top 10 Most Expensive Boroughs (Latest Prices)",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/house-prices/land-registry-house-prices-borough.csv"
      },
      transform: [
        { calculate: "toNumber(replace(datum.Value, ',', ''))", as: "price_value" },
        { calculate: "parseInt(substring(datum.Year, 13, 17))", as: "year_num" },
        { filter: "datum.price_value != null && datum.year_num != null" },
        {
          aggregate: [{ op: "max", field: "year_num", as: "latest_year" }]
        },
        {
          window: [{ op: "rank", as: "rank" }], 
          sort: [{ field: "price_value", order: "descending" }]
        },
        { filter: "datum.rank <= 10" }
      ],
      mark: { type: "bar", color: "#e67e22" },
      encoding: {
        x: {
          field: "price_value",
          type: "quantitative",
          title: "Median House Price (£)",
          format: "£,.0f"
        },
        y: {
          field: "Area",
          type: "nominal",
          title: "Borough",
          sort: { field: "price_value", order: "descending" }
        },
        tooltip: [
          { field: "Area", type: "nominal", title: "Borough" },
          { field: "price_value", type: "quantitative", title: "Price", format: "£,.0f" }
        ]
      }
    }
  },

  price_trends_timeline: {
    id: "price_trends_timeline",
    title: "House Price Trends",
    category: "Housing & Economy",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "House Price Trends Over Time",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/house-prices/land-registry-house-prices-borough.csv"
      },
      transform: [
        { calculate: "toNumber(replace(datum.Value, ',', ''))", as: "price_value" },
        { calculate: "parseInt(substring(datum.Year, 13, 17))", as: "year_num" },
        { filter: "datum.price_value != null && datum.year_num >= 2010" },
        { filter: { field: "Area", oneOf: ["Camden", "Westminster", "Hackney", "Croydon"] } }
      ],
      mark: { type: "line", point: true },
      encoding: {
        x: { field: "year_num", type: "quantitative", title: "Year" },
        y: { field: "price_value", type: "quantitative", format: "£,.0f", title: "Price" },
        color: { field: "Area", type: "nominal", title: "Borough" },
        tooltip: [
          { field: "Area", type: "nominal", title: "Borough" },
          { field: "year_num", type: "quantitative", title: "Year" },
          { field: "price_value", type: "quantitative", title: "Price", format: "£,.0f" }
        ]
      }
    }
  },

  income_distribution: {
    id: "income_distribution",
    title: "Income Distribution by Borough",
    category: "Housing & Economy",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Income Distribution by Borough (2022-23)",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/income/income-of-tax-payers.csv"
      },
      transform: [
        { calculate: "toNumber(replace(datum['Mean £18'], ',', ''))", as: "mean_income" },
        { calculate: "toNumber(replace(datum['Median £18'], ',', ''))", as: "median_income" },
        { filter: "datum.mean_income != null && datum.median_income != null" },
        { filter: "datum.mean_income > 0 && datum.median_income > 0" }
      ],
      mark: { type: "point", size: 80, filled: true, color: "#27ae60" },
      encoding: {
        x: {
          field: "median_income",
          type: "quantitative",
          title: "Median Income (£)",
          format: "£,.0f"
        },
        y: {
          field: "mean_income",
          type: "quantitative",
          title: "Mean Income (£)",
          format: "£,.0f"
        },
        tooltip: [
          { field: "Area", type: "nominal", title: "Borough" },
          { field: "mean_income", type: "quantitative", title: "Mean Income", format: "£,.0f" },
          { field: "median_income", type: "quantitative", title: "Median Income", format: "£,.0f" }
        ]
      }
    }
  },

  // EDUCATION CHARTS
  school_performance_ratings: {
    id: "school_performance_ratings",
    title: "School Performance Ratings",
    category: "Education",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "School Performance by Ofsted Rating",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/schools-colleges/2022-2023_england_school_information.csv"
      },
      transform: [
        { filter: "datum.SCHSTATUS == 'Open'" },
        { filter: "datum.OFSTEDRATING != null && datum.OFSTEDRATING != ''" },
        {
          aggregate: [{ op: "count", as: "school_count" }],
          groupby: ["OFSTEDRATING"]
        }
      ],
      mark: { type: "arc", innerRadius: 50, stroke: "#fff" },
      encoding: {
        theta: { field: "school_count", type: "quantitative" },
        color: {
          field: "OFSTEDRATING",
          type: "nominal",
          title: "Ofsted Rating",
          scale: {
            domain: ["Outstanding", "Good", "Requires Improvement", "Inadequate"],
            range: ["#27ae60", "#f39c12", "#e67e22", "#e74c3c"]
          }
        },
        tooltip: [
          { field: "OFSTEDRATING", type: "nominal", title: "Rating" },
          { field: "school_count", type: "quantitative", title: "School Count" }
        ]
      }
    }
  },

  schools_by_borough: {
    id: "schools_by_borough",
    title: "Schools by Borough",
    category: "Education",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Number of Schools by Borough",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/schools-colleges/2022-2023_england_school_information.csv"
      },
      transform: [
        { filter: "datum.SCHSTATUS == 'Open'" },
        { filter: { field: "LANAME", oneOf: ["Camden", "Westminster", "Hackney", "Southwark", "Lambeth", "Islington"] } },
        { aggregate: [{ op: "count", as: "school_count" }], groupby: ["LANAME"] }
      ],
      mark: { type: "bar", color: "#16a085" },
      encoding: {
        x: { field: "LANAME", type: "nominal", axis: { labelAngle: -45 }, title: "Borough" },
        y: { field: "school_count", type: "quantitative", title: "School Count" },
        tooltip: [
          { field: "LANAME", type: "nominal", title: "Borough" },
          { field: "school_count", type: "quantitative", title: "Schools" }
        ]
      }
    }
  },

  library_usage_trends: {
    id: "library_usage_trends",
    title: "Library Usage Trends",
    category: "Education",
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Library Usage Trends (2017-2023)",
      width: 240,
      height: 180,
      config: {
        view: { renderer: 'svg' }
      },
      data: {
        url: "/dataset/london/libraries/libraries-by-areas-chart.csv"
      },
      transform: [
        {
          fold: ["fin_2017_18", "fin_2018_19", "fin_2019_20", "fin_2020_21", "fin_2021_22", "fin_2022_23"],
          as: ["year", "visits_per_1000"]
        },
        { calculate: "toNumber(replace(datum.visits_per_1000, ',', ''))", as: "visits_numeric" },
        { filter: "datum.visits_numeric != null && datum.visits_numeric > 0" },
        {
          calculate: "datum.year == 'fin_2017_18' ? '2017/18' : datum.year == 'fin_2018_19' ? '2018/19' : datum.year == 'fin_2019_20' ? '2019/20' : datum.year == 'fin_2020_21' ? '2020/21' : datum.year == 'fin_2021_22' ? '2021/22' : '2022/23'",
          as: "year_label"
        },
        { filter: { field: "area label", oneOf: ["Camden", "Westminster", "Hackney", "Tower Hamlets", "Southwark", "Lambeth"] } }
      ],
      mark: { type: "line", point: true, strokeWidth: 2 },
      encoding: {
        x: {
          field: "year_label",
          type: "nominal",
          title: "Year",
          sort: ["2017/18", "2018/19", "2019/20", "2020/21", "2021/22", "2022/23"]
        },
        y: {
          field: "visits_numeric",
          type: "quantitative",
          title: "Library Visits per 1,000 Population",
          format: ",.0f"
        },
        color: {
          field: "area label",
          type: "nominal",
          title: "Borough",
          scale: { scheme: "category10" }
        },
        tooltip: [
          { field: "area label", type: "nominal", title: "Borough" },
          { field: "year_label", type: "nominal", title: "Year" },
          { field: "visits_numeric", type: "quantitative", title: "Visits per 1,000", format: ",.0f" }
        ]
      }
    }
  }
};

// Helper function to get chart by ID
export const getChartById = (id: string): ChartSpec | undefined => {
  return CHARTS[id];
};

// Helper function to get charts by category
export const getChartsByCategory = (category: string): ChartSpec[] => {
  return Object.values(CHARTS).filter(chart => chart.category === category);
};

// Helper function to get all chart IDs
export const getAllChartIds = (): string[] => {
  return Object.keys(CHARTS);
};