// Bar Chart Templates - Ranking & Comparison
// Required slots: category, metric
// Optional slots: series

export interface BarChartData {
  [key: string]: any;
  // category field (borough, type, etc.)
  // metric field (numeric value)
  // series field (optional grouping)
}

export interface BarChartOptions {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  colors?: string[];
  metricFormat?: string;
  orientation?: 'horizontal' | 'vertical';
  sortBy?: 'metric' | 'category' | 'none';
  sortOrder?: 'ascending' | 'descending';
  showValues?: boolean;
}

// Grouped bar chart data interface
export interface GroupedBarChartData extends BarChartData {
  series: string;
}

// Stacked bar chart data interface
export interface StackedBarChartData extends BarChartData {
  series: string;
  stackValue: number;
}

// Divergent bar chart data interface
export interface DivergentBarChartData extends BarChartData {
  positiveValue: number;
  negativeValue: number;
  year?: string;
  comparisonField?: string;
}

// Main Bar Chart Parameters Interface
export interface BarChartParams {
  charttitle: string;
  description: string;
  categories: {
    csv: string;
    column: string;
  };
  metric: string;
  dimension?: string;
  size: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  sortOrder?: 'ascending' | 'descending' | 'none';
  showMean?: boolean;
  meanValue?: number;
  showThreshold?: boolean;
  thresholdValue?: number;
  thresholdAnimation?: 'highlight' | 'pulse' | 'color_change';
  type?: 'simple' | 'with_mean' | 'with_threshold' | 'with_both';
}

// Grouped Bar Chart Parameters Interface
export interface GroupedBarChartParams {
  charttitle: string;
  description: string;
  categories: {
    csv: string;
    column: string;
  };
  metric: string;
  seriesField: string;
  dimension?: string;
  size: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  sortOrder?: 'ascending' | 'descending' | 'none';
  showMean?: boolean;
  meanCalculation?: 'overall' | 'per_series' | 'per_category';
  meanValue?: number;
  showThreshold?: boolean;
  thresholdValue?: number;
  thresholdAnimation?: 'highlight' | 'pulse' | 'color_change';
  numberOfGroups?: number;
  type?: 'simple' | 'with_mean' | 'with_threshold' | 'with_both';
}

// Stacked Bar Chart Parameters Interface
export interface StackedBarChartParams {
  charttitle: string;
  description: string;
  categories: {
    csv: string;
    column: string;
  };
  metric: string;
  seriesField: string;
  dimension?: string;
  size: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  sortOrder?: 'ascending' | 'descending' | 'none';
  showMean?: boolean;
  meanCalculation?: 'overall' | 'per_series' | 'per_category';
  meanValue?: number;
  showThreshold?: boolean;
  thresholdValue?: number;
  thresholdAnimation?: 'highlight' | 'pulse' | 'color_change';
  numberOfStacks?: number;
  showTotal?: boolean;
  normalize?: boolean; // For 100% stacked bars
  type?: 'simple' | 'with_mean' | 'with_threshold' | 'with_both' | 'normalized';
}

// Divergent Bar Chart Parameters Interface
export interface DivergentBarChartParams {
  charttitle: string;
  description: string;
  categories: {
    csv: string;
    column: string;
  };
  positiveMetric: string;
  negativeMetric: string;
  dimension?: string;
  size: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  sortOrder?: 'ascending' | 'descending' | 'none';
  comparisonYears?: [string, string]; // e.g., ['2022', '2023']
  showMean?: boolean;
  meanValue?: number;
  showThreshold?: boolean;
  thresholdValue?: number;
  thresholdAnimation?: 'highlight' | 'pulse' | 'color_change';
  colors?: [string, string]; // Colors for positive and negative values
  type?: 'simple';
}

// Sample data generators
const generateSampleBarData = (count: number = 6): BarChartData[] => {
  const boroughs = ['Camden', 'Westminster', 'Hackney', 'Islington', 'Tower Hamlets', 'Southwark', 'Greenwich', 'Lambeth'];
  return boroughs.slice(0, count).map((borough, index) => ({
    category: borough,
    value: Math.floor(Math.random() * 800) + 200
  }));
};

const generateSample3DBarData = (): { [dimension: string]: BarChartData[] } => {
  return {
    "Crime Type": [
      { category: "Anti-social behaviour", value: 2400 },
      { category: "Violent crime", value: 1980 },
      { category: "Burglary", value: 1650 },
      { category: "Vehicle crime", value: 1420 },
      { category: "Other theft", value: 1180 }
    ],
    "Borough Ranking": [
      { category: "Camden", value: 1240 },
      { category: "Westminster", value: 980 },
      { category: "Hackney", value: 850 },
      { category: "Islington", value: 720 },
      { category: "Tower Hamlets", value: 650 }
    ],
    "Seasonal Analysis": [
      { category: "Winter", value: 1850 },
      { category: "Spring", value: 1620 },
      { category: "Summer", value: 1950 },
      { category: "Autumn", value: 1780 }
    ],
    "Age Group Analysis": [
      { category: "18-24", value: 890 },
      { category: "25-34", value: 1240 },
      { category: "35-44", value: 980 },
      { category: "45-54", value: 760 },
      { category: "55+", value: 650 }
    ]
  };
};

// Sample data generators for grouped bar charts
const generateSampleGroupedBarData = (numberOfGroups: number = 2, count: number = 5): GroupedBarChartData[] => {
  const categories = ['Camden', 'Westminster', 'Hackney', 'Islington', 'Tower Hamlets', 'Southwark'];
  const seriesNames = ['2022', '2023', '2024', 'Q1'];
  const actualGroups = Math.min(Math.max(numberOfGroups, 1), 4); // Clamp between 1-4
  const selectedSeries = seriesNames.slice(0, actualGroups);
  
  const data: GroupedBarChartData[] = [];
  categories.slice(0, count).forEach(category => {
    selectedSeries.forEach(series => {
      data.push({
        category,
        series,
        value: Math.floor(Math.random() * 800) + 200
      });
    });
  });
  
  return data;
};

const generateSample3DGroupedBarData = (numberOfGroups: number = 2): { [dimension: string]: GroupedBarChartData[] } => {
  const actualGroups = Math.min(Math.max(numberOfGroups, 1), 4);
  
  return {
    "Year Comparison": [
      { category: "Camden", series: "2022", value: 1240 },
      { category: "Camden", series: "2023", value: 1180 },
      ...(actualGroups >= 3 ? [{ category: "Camden", series: "2024", value: 1320 }] : []),
      ...(actualGroups >= 4 ? [{ category: "Camden", series: "Q1", value: 1100 }] : []),
      { category: "Westminster", series: "2022", value: 980 },
      { category: "Westminster", series: "2023", value: 920 },
      ...(actualGroups >= 3 ? [{ category: "Westminster", series: "2024", value: 1040 }] : []),
      ...(actualGroups >= 4 ? [{ category: "Westminster", series: "Q1", value: 890 }] : []),
      { category: "Hackney", series: "2022", value: 850 },
      { category: "Hackney", series: "2023", value: 810 },
      ...(actualGroups >= 3 ? [{ category: "Hackney", series: "2024", value: 920 }] : []),
      ...(actualGroups >= 4 ? [{ category: "Hackney", series: "Q1", value: 780 }] : []),
      { category: "Islington", series: "2022", value: 720 },
      { category: "Islington", series: "2023", value: 690 },
      ...(actualGroups >= 3 ? [{ category: "Islington", series: "2024", value: 760 }] : []),
      ...(actualGroups >= 4 ? [{ category: "Islington", series: "Q1", value: 650 }] : [])
    ],
    "Crime Type Analysis": [
      { category: "Anti-social behaviour", series: "Violent", value: 1200 },
      { category: "Anti-social behaviour", series: "Property", value: 800 },
      ...(actualGroups >= 3 ? [{ category: "Anti-social behaviour", series: "Drug", value: 400 }] : []),
      ...(actualGroups >= 4 ? [{ category: "Anti-social behaviour", series: "Other", value: 300 }] : []),
      { category: "Burglary", series: "Violent", value: 300 },
      { category: "Burglary", series: "Property", value: 1200 },
      ...(actualGroups >= 3 ? [{ category: "Burglary", series: "Drug", value: 150 }] : []),
      ...(actualGroups >= 4 ? [{ category: "Burglary", series: "Other", value: 100 }] : []),
      { category: "Vehicle crime", series: "Violent", value: 200 },
      { category: "Vehicle crime", series: "Property", value: 1000 },
      ...(actualGroups >= 3 ? [{ category: "Vehicle crime", series: "Drug", value: 120 }] : []),
      ...(actualGroups >= 4 ? [{ category: "Vehicle crime", series: "Other", value: 100 }] : [])
    ],
    "Regional Analysis": [
      { category: "North", series: "Urban", value: 1400 },
      { category: "North", series: "Suburban", value: 900 },
      ...(actualGroups >= 3 ? [{ category: "North", series: "Rural", value: 300 }] : []),
      ...(actualGroups >= 4 ? [{ category: "North", series: "Mixed", value: 600 }] : []),
      { category: "South", series: "Urban", value: 1600 },
      { category: "South", series: "Suburban", value: 1100 },
      ...(actualGroups >= 3 ? [{ category: "South", series: "Rural", value: 200 }] : []),
      ...(actualGroups >= 4 ? [{ category: "South", series: "Mixed", value: 800 }] : []),
      { category: "East", series: "Urban", value: 1200 },
      { category: "East", series: "Suburban", value: 750 },
      ...(actualGroups >= 3 ? [{ category: "East", series: "Rural", value: 450 }] : []),
      ...(actualGroups >= 4 ? [{ category: "East", series: "Mixed", value: 500 }] : []),
      { category: "West", series: "Urban", value: 1100 },
      { category: "West", series: "Suburban", value: 850 },
      ...(actualGroups >= 3 ? [{ category: "West", series: "Rural", value: 350 }] : []),
      ...(actualGroups >= 4 ? [{ category: "West", series: "Mixed", value: 450 }] : [])
    ]
  };
};

// Sample data generators for stacked bar charts
const generateSampleStackedBarData = (numberOfStacks: number = 3, count: number = 5): StackedBarChartData[] => {
  const categories = ['Camden', 'Westminster', 'Hackney', 'Islington', 'Tower Hamlets', 'Southwark'];
  const stackNames = ['Crime', 'Traffic', 'Noise', 'Waste'];
  const actualStacks = Math.min(Math.max(numberOfStacks, 2), 4); // Clamp between 2-4
  const selectedStacks = stackNames.slice(0, actualStacks);
  
  const data: StackedBarChartData[] = [];
  categories.slice(0, count).forEach(category => {
    selectedStacks.forEach(stack => {
      data.push({
        category,
        series: stack,
        stackValue: Math.floor(Math.random() * 400) + 100,
        value: Math.floor(Math.random() * 400) + 100 // Keep for compatibility
      });
    });
  });
  
  return data;
};

const generateSample3DStackedBarData = (numberOfStacks: number = 3): { [dimension: string]: StackedBarChartData[] } => {
  const actualStacks = Math.min(Math.max(numberOfStacks, 2), 4);
  
  return {
    "Issue Categories": [
      { category: "Camden", series: "Crime", stackValue: 620, value: 620 },
      { category: "Camden", series: "Traffic", stackValue: 380, value: 380 },
      { category: "Camden", series: "Noise", stackValue: 240, value: 240 },
      ...(actualStacks >= 4 ? [{ category: "Camden", series: "Waste", stackValue: 180, value: 180 }] : []),
      { category: "Westminster", series: "Crime", stackValue: 540, value: 540 },
      { category: "Westminster", series: "Traffic", stackValue: 320, value: 320 },
      { category: "Westminster", series: "Noise", stackValue: 120, value: 120 },
      ...(actualStacks >= 4 ? [{ category: "Westminster", series: "Waste", stackValue: 100, value: 100 }] : []),
      { category: "Hackney", series: "Crime", stackValue: 480, value: 480 },
      { category: "Hackney", series: "Traffic", stackValue: 270, value: 270 },
      { category: "Hackney", series: "Noise", stackValue: 100, value: 100 },
      ...(actualStacks >= 4 ? [{ category: "Hackney", series: "Waste", stackValue: 80, value: 80 }] : []),
      { category: "Islington", series: "Crime", stackValue: 410, value: 410 },
      { category: "Islington", series: "Traffic", stackValue: 230, value: 230 },
      { category: "Islington", series: "Noise", stackValue: 80, value: 80 },
      ...(actualStacks >= 4 ? [{ category: "Islington", series: "Waste", stackValue: 60, value: 60 }] : [])
    ],
    "Severity Analysis": [
      { category: "High Priority", series: "Critical", stackValue: 800, value: 800 },
      { category: "High Priority", series: "Major", stackValue: 450, value: 450 },
      { category: "High Priority", series: "Minor", stackValue: 150, value: 150 },
      ...(actualStacks >= 4 ? [{ category: "High Priority", series: "Low", stackValue: 100, value: 100 }] : []),
      { category: "Medium Priority", series: "Critical", stackValue: 600, value: 600 },
      { category: "Medium Priority", series: "Major", stackValue: 550, value: 550 },
      { category: "Medium Priority", series: "Minor", stackValue: 300, value: 300 },
      ...(actualStacks >= 4 ? [{ category: "Medium Priority", series: "Low", stackValue: 200, value: 200 }] : []),
      { category: "Low Priority", series: "Critical", stackValue: 200, value: 200 },
      { category: "Low Priority", series: "Major", stackValue: 350, value: 350 },
      { category: "Low Priority", series: "Minor", stackValue: 400, value: 400 },
      ...(actualStacks >= 4 ? [{ category: "Low Priority", series: "Low", stackValue: 450, value: 450 }] : [])
    ],
    "Time Period Analysis": [
      { category: "Q1", series: "Reported", stackValue: 900, value: 900 },
      { category: "Q1", series: "Resolved", stackValue: 750, value: 750 },
      { category: "Q1", series: "Pending", stackValue: 150, value: 150 },
      ...(actualStacks >= 4 ? [{ category: "Q1", series: "Escalated", stackValue: 100, value: 100 }] : []),
      { category: "Q2", series: "Reported", stackValue: 1100, value: 1100 },
      { category: "Q2", series: "Resolved", stackValue: 900, value: 900 },
      { category: "Q2", series: "Pending", stackValue: 200, value: 200 },
      ...(actualStacks >= 4 ? [{ category: "Q2", series: "Escalated", stackValue: 120, value: 120 }] : []),
      { category: "Q3", series: "Reported", stackValue: 1300, value: 1300 },
      { category: "Q3", series: "Resolved", stackValue: 1050, value: 1050 },
      { category: "Q3", series: "Pending", stackValue: 250, value: 250 },
      ...(actualStacks >= 4 ? [{ category: "Q3", series: "Escalated", stackValue: 180, value: 180 }] : []),
      { category: "Q4", series: "Reported", stackValue: 1000, value: 1000 },
      { category: "Q4", series: "Resolved", stackValue: 850, value: 850 },
      { category: "Q4", series: "Pending", stackValue: 150, value: 150 },
      ...(actualStacks >= 4 ? [{ category: "Q4", series: "Escalated", stackValue: 90, value: 90 }] : [])
    ]
  };
};

// Sample data generators for divergent bar charts
const generateSampleDivergentBarData = (count: number = 6): DivergentBarChartData[] => {
  const boroughs = ['Camden', 'Westminster', 'Hackney', 'Islington', 'Tower Hamlets', 'Southwark', 'Greenwich', 'Lambeth'];
  return boroughs.slice(0, count).map(borough => ({
    category: borough,
    positiveValue: Math.floor(Math.random() * 800) + 200, // 2022 data
    negativeValue: Math.floor(Math.random() * 900) + 250, // 2023 data (negative for divergent display)
    value: Math.floor(Math.random() * 800) + 200, // Keep for compatibility
    year: '2022/2023',
    comparisonField: 'year_comparison'
  }));
};

const generateSample3DDivergentBarData = (): { [dimension: string]: DivergentBarChartData[] } => {
  return {
    "Crime Comparison (2022 vs 2023)": [
      { category: "Camden", positiveValue: 1240, negativeValue: 1180, value: 1240, year: '2022/2023', comparisonField: 'crime_change' },
      { category: "Westminster", positiveValue: 980, negativeValue: 1040, value: 980, year: '2022/2023', comparisonField: 'crime_change' },
      { category: "Hackney", positiveValue: 850, negativeValue: 920, value: 850, year: '2022/2023', comparisonField: 'crime_change' },
      { category: "Islington", positiveValue: 720, negativeValue: 760, value: 720, year: '2022/2023', comparisonField: 'crime_change' },
      { category: "Tower Hamlets", positiveValue: 650, negativeValue: 680, value: 650, year: '2022/2023', comparisonField: 'crime_change' },
      { category: "Southwark", positiveValue: 590, negativeValue: 620, value: 590, year: '2022/2023', comparisonField: 'crime_change' }
    ],
    "Budget vs Actual Spending": [
      { category: "Housing", positiveValue: 1200, negativeValue: 1350, value: 1200, year: 'Budget/Actual', comparisonField: 'budget_variance' },
      { category: "Transport", positiveValue: 800, negativeValue: 750, value: 800, year: 'Budget/Actual', comparisonField: 'budget_variance' },
      { category: "Education", positiveValue: 1500, negativeValue: 1620, value: 1500, year: 'Budget/Actual', comparisonField: 'budget_variance' },
      { category: "Healthcare", positiveValue: 2000, negativeValue: 1980, value: 2000, year: 'Budget/Actual', comparisonField: 'budget_variance' },
      { category: "Environment", positiveValue: 600, negativeValue: 580, value: 600, year: 'Budget/Actual', comparisonField: 'budget_variance' },
      { category: "Safety", positiveValue: 900, negativeValue: 950, value: 900, year: 'Budget/Actual', comparisonField: 'budget_variance' }
    ],
    "Income vs Expenditure": [
      { category: "Q1", positiveValue: 3500, negativeValue: 3200, value: 3500, year: 'Income/Expense', comparisonField: 'financial_flow' },
      { category: "Q2", positiveValue: 3800, negativeValue: 3600, value: 3800, year: 'Income/Expense', comparisonField: 'financial_flow' },
      { category: "Q3", positiveValue: 4200, negativeValue: 4100, value: 4200, year: 'Income/Expense', comparisonField: 'financial_flow' },
      { category: "Q4", positiveValue: 4000, negativeValue: 4200, value: 4000, year: 'Income/Expense', comparisonField: 'financial_flow' }
    ],
    "Population Growth/Decline": [
      { category: "Central London", positiveValue: 250, negativeValue: 180, value: 250, year: 'In/Out Migration', comparisonField: 'population_change' },
      { category: "East London", positiveValue: 320, negativeValue: 150, value: 320, year: 'In/Out Migration', comparisonField: 'population_change' },
      { category: "West London", positiveValue: 180, negativeValue: 200, value: 180, year: 'In/Out Migration', comparisonField: 'population_change' },
      { category: "South London", positiveValue: 210, negativeValue: 160, value: 210, year: 'In/Out Migration', comparisonField: 'population_change' },
      { category: "North London", positiveValue: 190, negativeValue: 220, value: 190, year: 'In/Out Migration', comparisonField: 'population_change' }
    ]
  };
};

// Advanced Bar Chart with Mean and Threshold Support
const createAdvancedBarChartSpec = (
  data: BarChartData[],
  categoryField: string,
  metricField: string,
  options: BarChartOptions & {
    showMean?: boolean;
    meanValue?: number;
    showThreshold?: boolean;
    thresholdValue?: number;
    thresholdAnimation?: string;
  } = {}
) => {
  const {
    title = 'Bar Chart',
    subtitle,
    width = 300,
    height = 200,
    colors = ['#3B82F6'],
    metricFormat = '.0f',
    orientation = 'horizontal',
    sortBy = 'metric',
    sortOrder,
    showValues = true,
    showMean = false,
    meanValue,
    showThreshold = false,
    thresholdValue,
    thresholdAnimation = 'highlight'
  } = options;

  const isHorizontal = orientation === 'horizontal';
  const calculatedMean = meanValue || data.reduce((sum, d) => sum + d[metricField], 0) / data.length;

  // Determine sort configuration
  const sortConfig = sortBy !== 'none' && sortOrder ? {
    field: sortBy === 'metric' ? metricField : categoryField,
    order: sortOrder
  } : null;

  // Size-dependent configurations
  const sizeConfig = {
    small: { labelFont: 8, titleFont: 10, helperFont: 7 },
    medium: { labelFont: 10, titleFont: 12, helperFont: 9 },
    large: { labelFont: 12, titleFont: 14, helperFont: 11 }
  };

  const currentSize = width <= 150 ? 'small' : width <= 250 ? 'medium' : 'large';
  const fonts = sizeConfig[currentSize];

  // Create layers array
  const layers: any[] = [];

  // Base bar chart layer
  layers.push({
    "data": { "values": data },
    "params": [
      {
        "name": "hover_bar",
        "select": {
          "type": "point",
          "on": "pointerover",
          "clear": "pointerout"
        }
      }
    ],
    "mark": {
      "type": "bar",
      "cursor": "pointer",
      "cornerRadiusEnd": isHorizontal ? 2 : 0,
      "cornerRadiusTopLeft": isHorizontal ? 0 : 2,
      "cornerRadiusTopRight": isHorizontal ? 0 : 2,
      "size": isHorizontal ? 25 : 30
    },
    "encoding": {
      [isHorizontal ? 'y' : 'x']: {
        "field": categoryField,
        "type": "nominal",
        "sort": sortConfig,
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelFontSize": fonts.labelFont,
          "labelLimit": isHorizontal ? 100 : 80,
          "title": null,
          "grid": false,
          "ticks": true,
          "domain": true
        }
      },
      [isHorizontal ? 'x' : 'y']: {
        "field": metricField,
        "type": "quantitative",
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelFontSize": fonts.labelFont,
          "grid": true,
          "gridColor": "#E5E7EB",
          "gridDash": [2, 2],
          "ticks": true,
          "domain": true,
          "title": null,
          "format": metricFormat
        }
      },
      "color": {
        "condition": showThreshold && thresholdValue ? {
          "test": `datum.${metricField} > ${thresholdValue}`,
          "value": "#DC2626"
        } : undefined,
        "value": colors[0]
      },
      "stroke": {
        "condition": {
          "param": "hover_bar",
          "value": "#2B7A9B"
        },
        "value": "transparent"
      },
      "strokeWidth": {
        "condition": {
          "param": "hover_bar",
          "value": 1
        },
        "value": 0
      },
      "opacity": {
        "condition": [
          {
            "param": "hover_bar",
            "value": 1.0
          }
        ],
        "value": 0.8
      },
      "tooltip": [
        { "field": categoryField, "type": "nominal", "title": "Category" },
        { "field": metricField, "type": "quantitative", "title": "Value", "format": metricFormat }
      ]
    }
  });

  // Value labels layer
  if (showValues) {
    layers.push({
      "data": { "values": data },
      "mark": {
        "type": "text",
        "align": isHorizontal ? "left" : "center",
        "baseline": isHorizontal ? "middle" : "bottom",
        "dx": isHorizontal ? 5 : 0,
        "dy": isHorizontal ? 0 : -5,
        "fontSize": fonts.labelFont,
        "color": "#1A3C4A",
        "fontWeight": 500
      },
      "encoding": {
        [isHorizontal ? 'y' : 'x']: {
          "field": categoryField,
          "type": "nominal",
          "sort": sortConfig
        },
        [isHorizontal ? 'x' : 'y']: {
          "field": metricField,
          "type": "quantitative"
        },
        "text": {
          "field": metricField,
          "type": "quantitative",
          "format": metricFormat
        }
      }
    });
  }

  // Mean line layer
  if (showMean) {
    layers.push({
      "data": { "values": [{ "meanValue": calculatedMean }] },
      "mark": {
        "type": "rule",
        "color": "#EF4444",
        "strokeWidth": 2,
        "strokeDash": [5, 5]
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "meanValue",
          "type": "quantitative"
        }
      }
    });

    // Mean label layer
    layers.push({
      "data": { "values": [{ "meanValue": calculatedMean, "label": `Mean: ${calculatedMean.toFixed(0)}` }] },
      "mark": {
        "type": "text",
        "align": isHorizontal ? "left" : "center",
        "baseline": isHorizontal ? "bottom" : "top",
        "dx": isHorizontal ? 5 : 0,
        "dy": isHorizontal ? -5 : 5,
        "fontSize": fonts.helperFont,
        "color": "#EF4444",
        "fontWeight": 600
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "meanValue",
          "type": "quantitative"
        },
        [isHorizontal ? 'y' : 'x']: {
          "value": isHorizontal ? height - 20 : width - 50
        },
        "text": {
          "field": "label",
          "type": "nominal"
        }
      }
    });
  }

  // Threshold line layer
  if (showThreshold && thresholdValue) {
    layers.push({
      "data": { "values": [{ "thresholdValue": thresholdValue }] },
      "mark": {
        "type": "rule",
        "color": "#F59E0B",
        "strokeWidth": 2,
        "strokeDash": [3, 3]
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "thresholdValue",
          "type": "quantitative"
        }
      }
    });

    // Threshold label layer
    layers.push({
      "data": { "values": [{ "thresholdValue": thresholdValue, "label": `Threshold: ${thresholdValue.toFixed(0)}` }] },
      "mark": {
        "type": "text",
        "align": isHorizontal ? "left" : "center",
        "baseline": isHorizontal ? "top" : "bottom",
        "dx": isHorizontal ? 5 : 0,
        "dy": isHorizontal ? 5 : -5,
        "fontSize": fonts.helperFont,
        "color": "#F59E0B",
        "fontWeight": 600
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "thresholdValue",
          "type": "quantitative"
        },
        [isHorizontal ? 'y' : 'x']: {
          "value": isHorizontal ? height - 35 : width - 30
        },
        "text": {
          "field": "label",
          "type": "nominal"
        }
      }
    });
  }

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "transparent",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": fonts.titleFont,
      "anchor": "start",
      "color": "#2B7A9B",
      "fontWeight": 600
    },
    "width": width,
    "height": height,
    "layer": layers,
    "config": {
      "background": "transparent",
      "view": {
        "stroke": null
      }
    }
  };
};

// Advanced Grouped Bar Chart with Mean and Threshold Support
const createAdvancedGroupedBarChartSpec = (
  data: GroupedBarChartData[],
  categoryField: string,
  metricField: string,
  seriesField: string,
  numberOfGroups: number = 2,
  options: BarChartOptions & {
    showMean?: boolean;
    meanCalculation?: 'overall' | 'per_series' | 'per_category';
    meanValue?: number;
    showThreshold?: boolean;
    thresholdValue?: number;
    thresholdAnimation?: string;
  } = {}
) => {
  const {
    title = 'Grouped Bar Chart',
    subtitle,
    width = 350,
    height = 180,
    colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981'],
    metricFormat = '.0f',
    orientation = 'horizontal',
    sortBy = 'metric',
    sortOrder,
    showValues = true,
    showMean = false,
    meanCalculation = 'overall',
    meanValue,
    showThreshold = false,
    thresholdValue,
    thresholdAnimation = 'highlight'
  } = options;

  const isHorizontal = orientation === 'horizontal';
  const actualGroups = Math.min(Math.max(numberOfGroups, 1), 4);
  
  // Calculate bar width based on chart size and number of groups
  const sizeBasedWidth = {
    small: 20,   // Small charts get narrow bars
    medium: 12,  // Medium charts get much smaller bars
    large: 30    // Large charts get wider bars
  };
  
  const chartSize = width <= 200 ? 'small' : width <= 400 ? 'medium' : 'large';
  const baseWidth = sizeBasedWidth[chartSize];
  const barWidth = baseWidth / actualGroups;

  // Calculate means based on meanCalculation type
  let calculatedMean: number;
  if (meanValue) {
    calculatedMean = meanValue;
  } else {
    calculatedMean = data.reduce((sum, d) => sum + d[metricField], 0) / data.length;
  }

  // Determine sort configuration
  const sortConfig = sortBy !== 'none' && sortOrder ? {
    field: sortBy === 'metric' ? metricField : categoryField,
    order: sortOrder
  } : null;

  // Size-dependent configurations
  const sizeConfig = {
    small: { labelFont: 7, titleFont: 9, helperFont: 6 },
    medium: { labelFont: 9, titleFont: 11, helperFont: 8 },
    large: { labelFont: 11, titleFont: 13, helperFont: 10 }
  };

  const currentSize = width <= 200 ? 'small' : width <= 400 ? 'medium' : 'large';
  const fonts = sizeConfig[currentSize];

  // Create layers array
  const layers: any[] = [];

  // Base grouped bar chart layer
  layers.push({
    "data": { "values": data },
    "params": [
      {
        "name": "hover_grouped_bar",
        "select": {
          "type": "point",
          "on": "pointerover",
          "clear": "pointerout"
        }
      }
    ],
    "mark": {
      "type": "bar",
      "cursor": "pointer",
      "cornerRadiusEnd": isHorizontal ? 2 : 0,
      "cornerRadiusTopLeft": isHorizontal ? 0 : 2,
      "cornerRadiusTopRight": isHorizontal ? 0 : 2,
      "size": barWidth
    },
    "encoding": {
      [isHorizontal ? 'y' : 'x']: {
        "field": categoryField,
        "type": "nominal",
        "sort": sortConfig,
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelFontSize": fonts.labelFont,
          "labelLimit": isHorizontal ? 100 : 80,
          "title": null,
          "grid": false,
          "ticks": true,
          "domain": true
        }
      },
      [isHorizontal ? 'x' : 'y']: {
        "field": metricField,
        "type": "quantitative",
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelFontSize": fonts.labelFont,
          "grid": true,
          "gridColor": "#E5E7EB",
          "gridDash": [2, 2],
          "ticks": true,
          "domain": true,
          "title": null,
          "format": metricFormat
        }
      },
      "color": {
        "field": seriesField,
        "type": "nominal",
        "scale": {
          "range": colors.slice(0, actualGroups)
        },
        "legend": {
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelColor": "#4A6A7B",
          "labelFontSize": fonts.labelFont,
          "titleFontSize": fonts.titleFont,
          "orient": isHorizontal ? "top" : "right",
          "title": "Series"
        }
      },
      [isHorizontal ? 'yOffset' : 'xOffset']: {
        "field": seriesField,
        "type": "nominal"
      },
      "stroke": {
        "condition": {
          "param": "hover_grouped_bar",
          "value": "#2B7A9B"
        },
        "value": "transparent"
      },
      "strokeWidth": {
        "condition": {
          "param": "hover_grouped_bar",
          "value": 1
        },
        "value": 0
      },
      "opacity": {
        "condition": [
          {
            "param": "hover_grouped_bar",
            "value": 1.0
          },
          ...(showThreshold && thresholdValue ? [
            {
              "test": `datum.${metricField} > ${thresholdValue}`,
              "value": thresholdAnimation === 'color_change' ? 0.9 : 1.0
            }
          ] : [])
        ],
        "value": 0.8
      },
      "tooltip": [
        { "field": categoryField, "type": "nominal", "title": "Category" },
        { "field": seriesField, "type": "nominal", "title": "Series" },
        { "field": metricField, "type": "quantitative", "title": "Value", "format": metricFormat }
      ]
    }
  });

  // Value labels layer
  if (showValues && width > 200) { // Only show values for larger charts
    layers.push({
      "data": { "values": data },
      "mark": {
        "type": "text",
        "align": isHorizontal ? "left" : "center",
        "baseline": isHorizontal ? "middle" : "bottom",
        "dx": isHorizontal ? 3 : 0,
        "dy": isHorizontal ? 0 : -3,
        "fontSize": fonts.labelFont - 1,
        "color": "#1A3C4A",
        "fontWeight": 400
      },
      "encoding": {
        [isHorizontal ? 'y' : 'x']: {
          "field": categoryField,
          "type": "nominal",
          "sort": sortConfig
        },
        [isHorizontal ? 'x' : 'y']: {
          "field": metricField,
          "type": "quantitative"
        },
        [isHorizontal ? 'yOffset' : 'xOffset']: {
          "field": seriesField,
          "type": "nominal"
        },
        "text": {
          "field": metricField,
          "type": "quantitative",
          "format": metricFormat
        }
      }
    });
  }

  // Mean line layer
  if (showMean) {
    layers.push({
      "data": { "values": [{ "meanValue": calculatedMean }] },
      "mark": {
        "type": "rule",
        "color": "#EF4444",
        "strokeWidth": 2,
        "strokeDash": [5, 5]
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "meanValue",
          "type": "quantitative"
        }
      }
    });

    // Mean label layer
    layers.push({
      "data": { "values": [{ "meanValue": calculatedMean, "label": `Mean: ${calculatedMean.toFixed(0)}` }] },
      "mark": {
        "type": "text",
        "align": isHorizontal ? "left" : "center",
        "baseline": isHorizontal ? "bottom" : "top",
        "dx": isHorizontal ? 5 : 0,
        "dy": isHorizontal ? -5 : 5,
        "fontSize": fonts.helperFont,
        "color": "#EF4444",
        "fontWeight": 600
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "meanValue",
          "type": "quantitative"
        },
        [isHorizontal ? 'y' : 'x']: {
          "value": isHorizontal ? height - 15 : width - 40
        },
        "text": {
          "field": "label",
          "type": "nominal"
        }
      }
    });
  }

  // Threshold line layer
  if (showThreshold && thresholdValue) {
    layers.push({
      "data": { "values": [{ "thresholdValue": thresholdValue }] },
      "mark": {
        "type": "rule",
        "color": "#F59E0B",
        "strokeWidth": 2,
        "strokeDash": [3, 3]
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "thresholdValue",
          "type": "quantitative"
        }
      }
    });

    // Threshold label layer
    layers.push({
      "data": { "values": [{ "thresholdValue": thresholdValue, "label": `Threshold: ${thresholdValue.toFixed(0)}` }] },
      "mark": {
        "type": "text",
        "align": isHorizontal ? "left" : "center",
        "baseline": isHorizontal ? "top" : "bottom",
        "dx": isHorizontal ? 5 : 0,
        "dy": isHorizontal ? 5 : -5,
        "fontSize": fonts.helperFont,
        "color": "#F59E0B",
        "fontWeight": 600
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "thresholdValue",
          "type": "quantitative"
        },
        [isHorizontal ? 'y' : 'x']: {
          "value": isHorizontal ? height - 30 : width - 20
        },
        "text": {
          "field": "label",
          "type": "nominal"
        }
      }
    });
  }

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "transparent",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": fonts.titleFont,
      "anchor": "start",
      "color": "#2B7A9B",
      "fontWeight": 600
    },
    "width": width,
    "height": height,
    "layer": layers,
    "config": {
      "background": "transparent",
      "view": {
        "stroke": null
      }
    }
  };
};

// Advanced Stacked Bar Chart with Mean and Threshold Support
const createAdvancedStackedBarChartSpec = (
  data: StackedBarChartData[],
  categoryField: string,
  metricField: string,
  seriesField: string,
  numberOfStacks: number = 3,
  options: BarChartOptions & {
    showMean?: boolean;
    meanCalculation?: 'overall' | 'per_series' | 'per_category';
    meanValue?: number;
    showThreshold?: boolean;
    thresholdValue?: number;
    thresholdAnimation?: string;
    showTotal?: boolean;
    normalize?: boolean;
  } = {}
) => {
  const {
    title = 'Stacked Bar Chart',
    subtitle,
    width = 350,
    height = 180,
    colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981'],
    metricFormat = '.0f',
    orientation = 'horizontal',
    sortBy = 'metric',
    sortOrder,
    showValues = true,
    showMean = false,
    meanCalculation = 'overall',
    meanValue,
    showThreshold = false,
    thresholdValue,
    thresholdAnimation = 'highlight',
    showTotal = true,
    normalize = false
  } = options;

  const isHorizontal = orientation === 'horizontal';
  const actualStacks = Math.min(Math.max(numberOfStacks, 2), 4);
  
  // Calculate totals for each category if needed
  const categoryTotals = new Map<string, number>();
  data.forEach(d => {
    const current = categoryTotals.get(d[categoryField]) || 0;
    categoryTotals.set(d[categoryField], current + d[metricField]);
  });

  // Normalize data if percentage stacking is enabled
  const processedData = normalize ? data.map(d => ({
    ...d,
    normalizedValue: (d[metricField] / (categoryTotals.get(d[categoryField]) || 1)) * 100,
    percentage: ((d[metricField] / (categoryTotals.get(d[categoryField]) || 1)) * 100).toFixed(1)
  })) : data.map(d => ({...d, normalizedValue: d[metricField], percentage: d[metricField].toString()}));

  // Calculate means based on meanCalculation type
  let calculatedMean: number;
  if (meanValue) {
    calculatedMean = meanValue;
  } else {
    if (normalize) {
      calculatedMean = 50; // 50% for normalized stacked bars
    } else {
      calculatedMean = data.reduce((sum, d) => sum + d[metricField], 0) / data.length;
    }
  }

  // Determine sort configuration
  const sortConfig = sortBy !== 'none' && sortOrder ? {
    field: sortBy === 'metric' ? metricField : categoryField,
    order: sortOrder
  } : null;

  // Size-dependent configurations
  const sizeConfig = {
    small: { labelFont: 7, titleFont: 9, helperFont: 6 },
    medium: { labelFont: 9, titleFont: 11, helperFont: 8 },
    large: { labelFont: 11, titleFont: 13, helperFont: 10 }
  };

  const currentSize = width <= 200 ? 'small' : width <= 400 ? 'medium' : 'large';
  const fonts = sizeConfig[currentSize];

  // Create layers array
  const layers: any[] = [];

  // Base stacked bar chart layer
  layers.push({
    "data": { "values": processedData },
    "params": [
      {
        "name": "hover_stacked_bar",
        "select": {
          "type": "point",
          "on": "pointerover",
          "clear": "pointerout"
        }
      }
    ],
    "mark": {
      "type": "bar",
      "cursor": "pointer",
      "cornerRadiusEnd": isHorizontal ? 1 : 0,
      "cornerRadiusTopLeft": isHorizontal ? 0 : 1,
      "cornerRadiusTopRight": isHorizontal ? 0 : 1
    },
    "encoding": {
      [isHorizontal ? 'y' : 'x']: {
        "field": categoryField,
        "type": "nominal",
        "sort": sortConfig,
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelFontSize": fonts.labelFont,
          "labelLimit": isHorizontal ? 100 : 80,
          "title": null,
          "grid": false,
          "ticks": true,
          "domain": true
        }
      },
      [isHorizontal ? 'x' : 'y']: {
        "field": "normalizedValue",
        "type": "quantitative",
        "stack": "zero",
        "axis": {
          "labelColor": "#4A6A7B",
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelFontSize": fonts.labelFont,
          "grid": true,
          "gridColor": "#E5E7EB",
          "gridDash": [2, 2],
          "ticks": true,
          "domain": true,
          "title": null,
          "format": normalize ? ".0f" : metricFormat
        }
      },
      "color": {
        "field": seriesField,
        "type": "nominal",
        "scale": {
          "range": colors.slice(0, actualStacks)
        },
        "legend": {
          "titleColor": "#2B7A9B",
          "titleFontWeight": 600,
          "labelColor": "#4A6A7B",
          "labelFontSize": fonts.labelFont,
          "titleFontSize": fonts.titleFont,
          "orient": isHorizontal ? "top" : "right",
          "title": "Series"
        }
      },
      "stroke": {
        "condition": {
          "param": "hover_stacked_bar",
          "value": "#2B7A9B"
        },
        "value": "transparent"
      },
      "strokeWidth": {
        "condition": {
          "param": "hover_stacked_bar",
          "value": 1
        },
        "value": 0
      },
      "opacity": {
        "condition": [
          {
            "param": "hover_stacked_bar",
            "value": 1.0
          },
          ...(showThreshold && thresholdValue ? [
            {
              "test": `datum.${metricField} > ${thresholdValue}`,
              "value": thresholdAnimation === 'color_change' ? 0.9 : 1.0
            }
          ] : [])
        ],
        "value": 0.8
      },
      "tooltip": [
        { "field": categoryField, "type": "nominal", "title": "Category" },
        { "field": seriesField, "type": "nominal", "title": "Series" },
        { "field": metricField, "type": "quantitative", "title": "Value", "format": metricFormat },
        ...(normalize ? [{ "field": "percentage", "type": "nominal", "title": "Percentage" }] : [])
      ]
    }
  });

  // Value labels layer (only for larger charts and non-normalized)
  if (showValues && width > 200 && !normalize) {
    layers.push({
      "data": { "values": processedData },
      "mark": {
        "type": "text",
        "align": "center",
        "baseline": "middle",
        "fontSize": fonts.labelFont - 1,
        "color": "white",
        "fontWeight": 500
      },
      "encoding": {
        [isHorizontal ? 'y' : 'x']: {
          "field": categoryField,
          "type": "nominal",
          "sort": sortConfig
        },
        [isHorizontal ? 'x' : 'y']: {
          "field": "normalizedValue",
          "type": "quantitative",
          "stack": "zero"
        },
        "text": {
          "condition": {
            "test": `datum.${metricField} > ${Math.max(...data.map(d => d[metricField])) * 0.1}`,
            "field": metricField,
            "type": "quantitative",
            "format": ".0f"
          },
          "value": ""
        }
      }
    });
  }

  // Total labels layer
  if (showTotal && !normalize && width > 200) {
    const totalsData = Array.from(categoryTotals.entries()).map(([category, total]) => ({
      [categoryField]: category,
      total: total
    }));

    layers.push({
      "data": { "values": totalsData },
      "mark": {
        "type": "text",
        "align": isHorizontal ? "left" : "center",
        "baseline": isHorizontal ? "middle" : "bottom",
        "dx": isHorizontal ? 5 : 0,
        "dy": isHorizontal ? 0 : -5,
        "fontSize": fonts.labelFont,
        "color": "#1A3C4A",
        "fontWeight": 600
      },
      "encoding": {
        [isHorizontal ? 'y' : 'x']: {
          "field": categoryField,
          "type": "nominal"
        },
        [isHorizontal ? 'x' : 'y']: {
          "field": "total",
          "type": "quantitative"
        },
        "text": {
          "field": "total",
          "type": "quantitative",
          "format": metricFormat
        }
      }
    });
  }

  // Mean line layer
  if (showMean) {
    layers.push({
      "data": { "values": [{ "meanValue": calculatedMean }] },
      "mark": {
        "type": "rule",
        "color": "#EF4444",
        "strokeWidth": 2,
        "strokeDash": [5, 5]
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "meanValue",
          "type": "quantitative"
        }
      }
    });

    // Mean label layer
    layers.push({
      "data": { "values": [{ "meanValue": calculatedMean, "label": `Mean: ${calculatedMean.toFixed(0)}${normalize ? '%' : ''}` }] },
      "mark": {
        "type": "text",
        "align": isHorizontal ? "left" : "center",
        "baseline": isHorizontal ? "bottom" : "top",
        "dx": isHorizontal ? 5 : 0,
        "dy": isHorizontal ? -5 : 5,
        "fontSize": fonts.helperFont,
        "color": "#EF4444",
        "fontWeight": 600
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "meanValue",
          "type": "quantitative"
        },
        [isHorizontal ? 'y' : 'x']: {
          "value": isHorizontal ? height - 15 : width - 40
        },
        "text": {
          "field": "label",
          "type": "nominal"
        }
      }
    });
  }

  // Threshold line layer
  if (showThreshold && thresholdValue && !normalize) {
    layers.push({
      "data": { "values": [{ "thresholdValue": thresholdValue }] },
      "mark": {
        "type": "rule",
        "color": "#F59E0B",
        "strokeWidth": 2,
        "strokeDash": [3, 3]
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "thresholdValue",
          "type": "quantitative"
        }
      }
    });

    // Threshold label layer
    layers.push({
      "data": { "values": [{ "thresholdValue": thresholdValue, "label": `Threshold: ${thresholdValue.toFixed(0)}` }] },
      "mark": {
        "type": "text",
        "align": isHorizontal ? "left" : "center",
        "baseline": isHorizontal ? "top" : "bottom",
        "dx": isHorizontal ? 5 : 0,
        "dy": isHorizontal ? 5 : -5,
        "fontSize": fonts.helperFont,
        "color": "#F59E0B",
        "fontWeight": 600
      },
      "encoding": {
        [isHorizontal ? 'x' : 'y']: {
          "field": "thresholdValue",
          "type": "quantitative"
        },
        [isHorizontal ? 'y' : 'x']: {
          "value": isHorizontal ? height - 30 : width - 20
        },
        "text": {
          "field": "label",
          "type": "nominal"
        }
      }
    });
  }

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "background": "transparent",
    "title": {
      "text": title,
      ...(subtitle && { "subtitle": subtitle }),
      "fontSize": fonts.titleFont,
      "anchor": "start",
      "color": "#2B7A9B",
      "fontWeight": 600
    },
    "width": width,
    "height": height,
    "layer": layers,
    "config": {
      "background": "transparent",
      "view": {
        "stroke": null
      }
    }
  };
};

// Advanced Divergent Bar Chart Specification
const createAdvancedDivergentBarChartSpec = (
  data: DivergentBarChartData[],
  categoryField: string,
  positiveField: string,
  negativeField: string,
  options: BarChartOptions & {
    showMean?: boolean;
    meanValue?: number;
    showThreshold?: boolean;
    thresholdValue?: number;
    thresholdAnimation?: string;
    comparisonYears?: [string, string];
  } = {}
) => {
  const {
    title = 'Divergent Bar Chart',
    subtitle,
    width = 350,
    height = 180,
    colors = ['#A855F7', '#4C1D95'], // Purple shades like the template
    metricFormat = '.0f',
    orientation = 'horizontal',
    sortBy = 'metric',
    sortOrder,
    showValues = true,
    showMean = false,
    meanValue,
    showThreshold = false,
    thresholdValue,
    thresholdAnimation = 'highlight',
    comparisonYears = ['2022', '2023']
  } = options;

  const isHorizontal = orientation === 'horizontal';

  // Sort data by positive values in descending order (most first) and add index
  const sortedData = data
    .sort((a, b) => b[positiveField] - a[positiveField])
    .map((d, index) => ({ ...d, sortIndex: index }));

  // Calculate means
  const positiveValues = sortedData.map(d => (d as any)[positiveField]);
  const negativeValues = sortedData.map(d => (d as any)[negativeField]);
  const calculatedMean = meanValue || (positiveValues.reduce((sum, val) => sum + val, 0) + negativeValues.reduce((sum, val) => sum + val, 0)) / (positiveValues.length + negativeValues.length);

  // Size-dependent configurations
  const sizeConfig = {
    small: { labelFont: 7, titleFont: 9, helperFont: 6 },
    medium: { labelFont: 9, titleFont: 11, helperFont: 8 },
    large: { labelFont: 11, titleFont: 13, helperFont: 10 }
  };

  const currentSize = width <= 200 ? 'small' : width <= 400 ? 'medium' : 'large';
  const fonts = sizeConfig[currentSize];

  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": title,
      "subtitle": subtitle || null,
      "fontSize": fonts.titleFont,
      "fontWeight": 600,
      "color": "#1F2937",
      "anchor": "start",
      "offset": 10
    },
    "width": width,
    "height": height,
    "background": "transparent",
    "data": {
      "values": sortedData
    },
    "transform": [
      {"calculate": `datum.${positiveField}`, "as": "positive_value"},
      {"calculate": `-datum.${negativeField}`, "as": "negative_value"}
    ],
    "layer": [
      {
        "params": [
          {
            "name": "hover_divergent_bar",
            "select": {
              "type": "point",
              "on": "pointerover",
              "clear": "pointerout"
            }
          },
          {
            "name": "select_divergent",
            "select": "point"
          }
        ],
        "transform": [
          {"fold": ["positive_value", "negative_value"], "as": ["value_type", "count"]},
          {"calculate": `datum.value_type == 'positive_value' ? '${comparisonYears[0]}' : '${comparisonYears[1]}'`, "as": "year"},
          {"calculate": "abs(datum.count)", "as": "absolute_count"}
        ],
        "mark": {
          "type": "bar",
          "cursor": "pointer",
          "cornerRadiusEnd": isHorizontal ? 2 : 0,
          "cornerRadiusTopLeft": isHorizontal ? 0 : 2,
          "cornerRadiusTopRight": isHorizontal ? 0 : 2
        },
        "encoding": {
          [isHorizontal ? 'y' : 'x']: {
            "field": categoryField,
            "type": "nominal",
            "scale": {
              "domain": sortedData.map(d => (d as any)[categoryField])
            },
            "axis": null
          },
          [isHorizontal ? 'x' : 'y']: {
            "field": "count",
            "type": "quantitative",
            "axis": {
              "labelColor": "#888",
              "titleColor": "#888",
              "labelFontSize": fonts.labelFont,
              "grid": true,
              "gridColor": "#888",
              "gridDash": [2, 2],
              "ticks": true,
              "domain": true,
              "title": null,
              "format": metricFormat
            }
          },
          "color": {
            "field": "year",
            "type": "nominal",
            "scale": {
              "domain": comparisonYears,
              "range": colors
            },
            "legend": {
              "title": null,
              "orient": isHorizontal ? "top" : "right",
              "titleColor": "#2B7A9B",
              "labelColor": "#4A6A7B",
              "titleFontSize": fonts.titleFont,
              "labelFontSize": fonts.labelFont,
              "symbolSize": 80,
              "offset": 5
            }
          },
          "stroke": {
            "condition": [
              {
                "param": "select_divergent",
                "empty": false,
                "value": "#2B7A9B"
              },
              {
                "param": "hover_divergent_bar",
                "empty": false,
                "value": "#2B7A9B"
              }
            ],
            "value": "transparent"
          },
          "strokeWidth": {
            "condition": [
              {
                "param": "select_divergent",
                "empty": false,
                "value": 1
              },
              {
                "param": "hover_divergent_bar",
                "empty": false,
                "value": 1
              }
            ],
            "value": 0
          },
          "opacity": {
            "condition": [
              {
                "param": "select_divergent",
                "empty": false,
                "value": 1
              },
              {
                "param": "hover_divergent_bar",
                "empty": false,
                "value": 0.8
              },
              ...(showThreshold && thresholdValue ? [
                {
                  "test": `abs(datum.count) > ${thresholdValue}`,
                  "value": thresholdAnimation === 'color_change' ? 0.9 : 1.0
                }
              ] : [])
            ],
            "value": 0.6
          },
          "tooltip": [
            { "field": categoryField, "type": "nominal", "title": "Category" },
            { "field": "year", "type": "nominal", "title": "Year" },
            { 
              "field": "absolute_count", 
              "type": "quantitative", 
              "title": "Value", 
              "format": metricFormat
            }
          ]
        }
      },
      // Category labels layer (positioned in center)
      {
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "middle",
          "dx": 0,
          "dy": 0,
          "fontSize": fonts.labelFont,
          "fontWeight": "normal",
          "color": "#fff"
        },
        "encoding": {
          [isHorizontal ? 'y' : 'x']: {
            "field": categoryField,
            "type": "nominal",
            "scale": {
              "domain": sortedData.map(d => (d as any)[categoryField])
            }
          },
          [isHorizontal ? 'x' : 'y']: {
            "value": isHorizontal ? width / 2 : height / 2
          },
          "text": {
            "field": categoryField,
            "type": "nominal"
          }
        }
      },
      // Value labels layer
      ...(showValues && width > 200 ? [{
        "data": { "values": sortedData },
        "transform": [
          {"calculate": `datum.${positiveField}`, "as": "positive_value"},
          {"calculate": `-datum.${negativeField}`, "as": "negative_value"},
          {"fold": ["positive_value", "negative_value"], "as": ["value_type", "count"]},
          {"calculate": "abs(datum.count)", "as": "absolute_count"}
        ],
        "mark": {
          "type": "text",
          "align": isHorizontal ? "left" : "center",
          "baseline": isHorizontal ? "middle" : "bottom",
          "dx": isHorizontal ? 5 : 0,
          "dy": isHorizontal ? 0 : -5,
          "fontSize": fonts.labelFont - 1,
          "color": "#1A3C4A",
          "fontWeight": 400
        },
        "encoding": {
          [isHorizontal ? 'y' : 'x']: {
            "field": categoryField,
            "type": "nominal"
          },
          [isHorizontal ? 'x' : 'y']: {
            "field": "count",
            "type": "quantitative"
          },
          "text": {
            "field": "absolute_count",
            "type": "quantitative",
            "format": metricFormat
          }
        }
      }] : []),
      // Mean line layer
      ...(showMean ? [{
        "data": { "values": [{ "meanValue": calculatedMean }] },
        "mark": {
          "type": "rule",
          "color": "#EF4444",
          "strokeWidth": 2,
          "strokeDash": [5, 5]
        },
        "encoding": {
          [isHorizontal ? 'x' : 'y']: {
            "field": "meanValue",
            "type": "quantitative"
          }
        }
      }] : []),
      // Threshold line layer
      ...(showThreshold && thresholdValue ? [{
        "data": { "values": [{ "thresholdValue": thresholdValue }] },
        "mark": {
          "type": "rule",
          "color": "#F59E0B",
          "strokeWidth": 2,
          "strokeDash": [3, 3]
        },
        "encoding": {
          [isHorizontal ? 'x' : 'y']: {
            "field": "thresholdValue",
            "type": "quantitative"
          }
        }
      }] : [])
    ],
    "config": {
      "background": "transparent",
      "view": {
        "stroke": null
      }
    }
  };
};

// Main render function for bar charts
export const renderBarChart = (params: BarChartParams) => {
  const {
    charttitle,
    description,
    size,
    orientation = 'horizontal',
    sortOrder = 'descending',
    showMean = false,
    meanValue,
    showThreshold = false,
    thresholdValue,
    thresholdAnimation = 'highlight',
    type = 'simple',
    dimension
  } = params;

  // Size configurations
  const sizeConfig = {
    small: { width: 100, height: 60 },
    medium: { width: 200, height: 120 },
    large: { width: 300, height: 200 }
  }[size];

  // Generate sample data
  const is3D = !!dimension;
  
  if (is3D) {
    const sample3DData = generateSample3DBarData();
    const dimensions = Object.keys(sample3DData);
    const currentData = sample3DData[dimensions[0]]; // Default to first dimension
    
    const processedData = currentData.map(d => ({ ...d }));
    const calculatedMean = meanValue || processedData.reduce((sum, d) => sum + d.value, 0) / processedData.length;
    const finalThreshold = thresholdValue || calculatedMean * 1.2;

    const createSpec = (selectedDimension: string) => {
      const dimData = sample3DData[selectedDimension] || currentData;
      return createAdvancedBarChartSpec(dimData, 'category', 'value', {
        title: `${charttitle} - ${selectedDimension}`,
        subtitle: description,
        width: sizeConfig.width,
        height: sizeConfig.height,
        orientation,
        sortOrder: sortOrder === 'none' ? undefined : sortOrder,
        showMean: showMean || type === 'with_mean' || type === 'with_both',
        meanValue: calculatedMean,
        showThreshold: showThreshold || type === 'with_threshold' || type === 'with_both',
        thresholdValue: finalThreshold,
        thresholdAnimation
      });
    };

    return {
      getSpec: createSpec,
      dimensions,
      currentDimension: dimensions[0],
      spec: createSpec(dimensions[0])
    };
  } else {
    // 2D chart
    const sampleData = generateSampleBarData();
    const calculatedMean = meanValue || sampleData.reduce((sum, d) => sum + d.value, 0) / sampleData.length;
    const finalThreshold = thresholdValue || calculatedMean * 1.2;

    return createAdvancedBarChartSpec(sampleData, 'category', 'value', {
      title: charttitle,
      subtitle: description,
      width: sizeConfig.width,
      height: sizeConfig.height,
      orientation,
      sortOrder: sortOrder === 'none' ? undefined : sortOrder,
      showMean: showMean || type === 'with_mean' || type === 'with_both',
      meanValue: calculatedMean,
      showThreshold: showThreshold || type === 'with_threshold' || type === 'with_both',
      thresholdValue: finalThreshold,
      thresholdAnimation
    });
  }
};

// Main render function for grouped bar charts
export const renderGroupedBarChart = (params: GroupedBarChartParams) => {
  const {
    charttitle,
    description,
    size,
    orientation = 'horizontal',
    sortOrder = 'descending',
    showMean = false,
    meanCalculation = 'overall',
    meanValue,
    showThreshold = false,
    thresholdValue,
    thresholdAnimation = 'highlight',
    type = 'simple',
    dimension,
    numberOfGroups
  } = params;

  // Randomize number of groups if not specified
  const actualGroups = numberOfGroups || Math.floor(Math.random() * 4) + 1; // 1-4 groups

  // Size configurations
  const sizeConfig = {
    small: { width: 100, height: 50 },
    medium: { width: 250, height: 120 },
    large: { width: 400, height: 200 }
  }[size];

  // Generate sample data
  const is3D = !!dimension;
  
  if (is3D) {
    const sample3DData = generateSample3DGroupedBarData(actualGroups);
    const dimensions = Object.keys(sample3DData);
    const currentData = sample3DData[dimensions[0]]; // Default to first dimension
    
    const calculatedMean = meanValue || currentData.reduce((sum, d) => sum + d.value, 0) / currentData.length;
    const finalThreshold = thresholdValue || calculatedMean * 1.2;

    const createSpec = (selectedDimension: string) => {
      const dimData = sample3DData[selectedDimension] || currentData;
      return createAdvancedGroupedBarChartSpec(dimData, 'category', 'value', 'series', actualGroups, {
        title: `${charttitle} - ${selectedDimension}`,
        subtitle: description,
        width: sizeConfig.width,
        height: sizeConfig.height,
        orientation,
        sortOrder: sortOrder === 'none' ? undefined : sortOrder,
        showMean: showMean || type === 'with_mean' || type === 'with_both',
        meanCalculation,
        meanValue: calculatedMean,
        showThreshold: showThreshold || type === 'with_threshold' || type === 'with_both',
        thresholdValue: finalThreshold,
        thresholdAnimation
      });
    };

    return {
      getSpec: createSpec,
      dimensions,
      currentDimension: dimensions[0],
      spec: createSpec(dimensions[0]),
      numberOfGroups: actualGroups
    };
  } else {
    // 2D chart
    const sampleData = generateSampleGroupedBarData(actualGroups);
    const calculatedMean = meanValue || sampleData.reduce((sum, d) => sum + d.value, 0) / sampleData.length;
    const finalThreshold = thresholdValue || calculatedMean * 1.2;

    return createAdvancedGroupedBarChartSpec(sampleData, 'category', 'value', 'series', actualGroups, {
      title: charttitle,
      subtitle: description,
      width: sizeConfig.width,
      height: sizeConfig.height,
      orientation,
      sortOrder: sortOrder === 'none' ? undefined : sortOrder,
      showMean: showMean || type === 'with_mean' || type === 'with_both',
      meanCalculation,
      meanValue: calculatedMean,
      showThreshold: showThreshold || type === 'with_threshold' || type === 'with_both',
      thresholdValue: finalThreshold,
      thresholdAnimation
    });
  }
};

// Main render function for stacked bar charts
export const renderStackedBarChart = (params: StackedBarChartParams) => {
  const {
    charttitle,
    description,
    size,
    orientation = 'horizontal',
    sortOrder = 'descending',
    showMean = false,
    meanCalculation = 'overall',
    meanValue,
    showThreshold = false,
    thresholdValue,
    thresholdAnimation = 'highlight',
    type = 'simple',
    dimension,
    numberOfStacks,
    showTotal = true,
    normalize = false
  } = params;

  // Randomize number of stacks if not specified
  const actualStacks = numberOfStacks || Math.floor(Math.random() * 3) + 2; // 2-4 stacks

  // Size configurations
  const sizeConfig = {
    small: { width: 120, height: 60 },
    medium: { width: 250, height: 120 },
    large: { width: 400, height: 200 }
  }[size];

  // Generate sample data
  const is3D = !!dimension;
  
  if (is3D) {
    const sample3DData = generateSample3DStackedBarData(actualStacks);
    const dimensions = Object.keys(sample3DData);
    const currentData = sample3DData[dimensions[0]]; // Default to first dimension
    
    const calculatedMean = meanValue || currentData.reduce((sum, d) => sum + d.stackValue, 0) / currentData.length;
    const finalThreshold = thresholdValue || calculatedMean * 1.2;

    const createSpec = (selectedDimension: string) => {
      const dimData = sample3DData[selectedDimension] || currentData;
      return createAdvancedStackedBarChartSpec(dimData, 'category', 'stackValue', 'series', actualStacks, {
        title: `${charttitle} - ${selectedDimension}`,
        subtitle: description,
        width: sizeConfig.width,
        height: sizeConfig.height,
        orientation,
        sortOrder: sortOrder === 'none' ? undefined : sortOrder,
        showMean: showMean || type === 'with_mean' || type === 'with_both',
        meanCalculation,
        meanValue: calculatedMean,
        showThreshold: showThreshold || type === 'with_threshold' || type === 'with_both',
        thresholdValue: finalThreshold,
        thresholdAnimation,
        showTotal,
        normalize: normalize || type === 'normalized'
      });
    };

    return {
      getSpec: createSpec,
      dimensions,
      currentDimension: dimensions[0],
      spec: createSpec(dimensions[0]),
      numberOfStacks: actualStacks,
      showTotal,
      normalize
    };
  } else {
    // 2D chart
    const sampleData = generateSampleStackedBarData(actualStacks);
    const calculatedMean = meanValue || sampleData.reduce((sum, d) => sum + d.stackValue, 0) / sampleData.length;
    const finalThreshold = thresholdValue || calculatedMean * 1.2;

    return createAdvancedStackedBarChartSpec(sampleData, 'category', 'stackValue', 'series', actualStacks, {
      title: charttitle,
      subtitle: description,
      width: sizeConfig.width,
      height: sizeConfig.height,
      orientation,
      sortOrder: sortOrder === 'none' ? undefined : sortOrder,
      showMean: showMean || type === 'with_mean' || type === 'with_both',
      meanCalculation,
      meanValue: calculatedMean,
      showThreshold: showThreshold || type === 'with_threshold' || type === 'with_both',
      thresholdValue: finalThreshold,
      thresholdAnimation,
      showTotal,
      normalize: normalize || type === 'normalized'
    });
  }
};

// Main render function for divergent bar charts
export const renderDivergentBarChart = (params: DivergentBarChartParams) => {
  const {
    charttitle,
    description,
    size,
    orientation = 'horizontal',
    sortOrder = 'descending',
    showMean = false,
    meanValue,
    showThreshold = false,
    thresholdValue,
    thresholdAnimation = 'highlight',
    type = 'simple',
    dimension,
    comparisonYears = ['2022', '2023'],
    colors = ['#A855F7', '#4C1D95']
  } = params;

  // Size configurations
  const sizeConfig = {
    small: { width: 140, height: 70 },
    medium: { width: 320, height: 160 },
    large: { width: 480, height: 200 }
  }[size];

  // Generate sample data
  const is3D = !!dimension;
  
  if (is3D) {
    const sample3DData = generateSample3DDivergentBarData();
    const dimensions = Object.keys(sample3DData);
    const currentData = sample3DData[dimensions[0]]; // Default to first dimension
    
    const calculatedMean = meanValue || currentData.reduce((sum, d) => sum + d.positiveValue + d.negativeValue, 0) / (currentData.length * 2);
    const finalThreshold = thresholdValue || calculatedMean * 1.2;

    const createSpec = (selectedDimension: string) => {
      const dimData = sample3DData[selectedDimension] || currentData;
      return createAdvancedDivergentBarChartSpec(dimData, 'category', 'positiveValue', 'negativeValue', {
        title: `${charttitle} - ${selectedDimension}`,
        subtitle: description,
        width: sizeConfig.width,
        height: sizeConfig.height,
        orientation,
        colors,
        sortOrder: sortOrder === 'none' ? undefined : sortOrder,
        showMean: showMean || false,
        meanValue: calculatedMean,
        showThreshold: showThreshold || false,
        thresholdValue: finalThreshold,
        thresholdAnimation,
        comparisonYears
      });
    };

    return {
      getSpec: createSpec,
      dimensions,
      currentDimension: dimensions[0],
      spec: createSpec(dimensions[0]),
      comparisonYears,
      colors
    };
  } else {
    // 2D chart
    const sampleData = generateSampleDivergentBarData();
    const calculatedMean = meanValue || sampleData.reduce((sum, d) => sum + d.positiveValue + d.negativeValue, 0) / (sampleData.length * 2);
    const finalThreshold = thresholdValue || calculatedMean * 1.2;

    return createAdvancedDivergentBarChartSpec(sampleData, 'category', 'positiveValue', 'negativeValue', {
      title: charttitle,
      subtitle: description,
      width: sizeConfig.width,
      height: sizeConfig.height,
      orientation,
      colors,
      sortOrder: sortOrder === 'none' ? undefined : sortOrder,
      showMean: showMean || false,
      meanValue: calculatedMean,
      showThreshold: showThreshold || false,
      thresholdValue: finalThreshold,
      thresholdAnimation,
      comparisonYears
    });
  }
};
