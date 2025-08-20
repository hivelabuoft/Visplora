// Complete Visualization Space Analysis

const CHART_VARIATION_COUNTS = {
  // Bar Charts Family
  "barChart": {
    "variations": ["simple", "with_mean", "with_threshold", "with_mean_threshold"],
    "modes": ["2D", "3D"],
    "total": 4 * 2 // = 8 variations
  },
  
  "groupedBarChart": {
    "variations": ["simple_grouped", "grouped_with_mean", "grouped_with_threshold", "grouped_with_mean_threshold"],
    "modes": ["2D", "3D"], 
    "total": 4 * 2 // = 8 variations
  },
  
  "stackedBarChart": {
    "variations": ["simple_stacked", "stacked_with_mean", "stacked_with_threshold", "stacked_with_mean_threshold"],
    "modes": ["2D", "3D"],
    "total": 4 * 2 // = 8 variations
  },
  
  "divergentBar": {
    "variations": ["simple"], // Less overlay options for divergent
    "modes": ["2D", "3D"],
    "total": 1 * 2 // = 2 variations
  },
  
  // Line Charts Family
  "lineChart": {
    "variations": ["simple"], // Basic line chart
    "modes": ["2D", "3D"],
    "total": 1 * 2 // = 2 variations
  },
  
  "multiLineChart": {
    "variations": ["simple"], // Multi-series line
    "modes": ["2D", "3D"], 
    "total": 1 * 2 // = 2 variations
  },
  
  "areaChart": {
    "variations": ["simple"], // Filled area
    "modes": ["2D", "3D"],
    "total": 1 * 2 // = 2 variations  
  },
  
  // Combo Charts
  "comboBarLineChart": {
    "variations": ["simple"], // Bar + line combination
    "modes": ["2D", "3D"],
    "total": 1 * 2 // = 2 variations
  },
  
  // Proportion Charts
  "donutChart": {
    "variations": ["simple"], // Pie/donut
    "modes": ["2D", "3D"],
    "total": 1 * 2 // = 2 variations
  },
  
  // Correlation Charts  
  "scatterPlot": {
    "variations": ["simple"], // X-Y correlation
    "modes": ["2D", "3D"],
    "total": 1 * 2 // = 2 variations
  },
  
  "bubbleChart": {
    "variations": ["simple"], // X-Y-size correlation
    "modes": ["2D", "3D"],
    "total": 1 * 2 // = 2 variations
  },
  
  // Distribution Charts
  "histogram": {
    "variations": ["simple"], // Distribution
    "modes": ["2D", "3D"],
    "total": 1 * 2 // = 2 variations
  },
  
  "histogramHeatmap": {
    "variations": ["simple"], // 2D distribution
    "modes": ["2D"], // Only 2D makes sense
    "total": 1 * 1 // = 1 variation
  }
};

// Calculate Total Visualization Space
const TOTAL_VISUALIZATION_SPACE = Object.values(CHART_VARIATION_COUNTS)
  .reduce((sum, chart) => sum + chart.total, 0);

console.log(`Total Visualization Variations: ${TOTAL_VISUALIZATION_SPACE}`);
// Result: ~42 distinct chart variations

// Detailed Breakdown
const DETAILED_CHART_VARIATIONS = {
  
  // Bar Chart Family (26 variations)
  "barChart_simple_2D": { required_fields: 5, data_structure: "category-value" },
  "barChart_simple_3D": { required_fields: 6, data_structure: "category-value-dimension" },
  "barChart_with_mean_2D": { required_fields: 6, data_structure: "category-value + mean_line" },
  "barChart_with_mean_3D": { required_fields: 7, data_structure: "category-value-dimension + mean_per_dimension" },
  "barChart_with_threshold_2D": { required_fields: 7, data_structure: "category-value + threshold_line" },
  "barChart_with_threshold_3D": { required_fields: 8, data_structure: "category-value-dimension + threshold_per_dimension" },
  "barChart_with_mean_threshold_2D": { required_fields: 8, data_structure: "category-value + mean_line + threshold_line" },
  "barChart_with_mean_threshold_3D": { required_fields: 9, data_structure: "category-value-dimension + mean_per_dimension + threshold_per_dimension" },
  
  "groupedBarChart_simple_2D": { required_fields: 6, data_structure: "category-value-series" },
  "groupedBarChart_simple_3D": { required_fields: 7, data_structure: "category-value-series-dimension" },
  "groupedBarChart_with_mean_2D": { required_fields: 7, data_structure: "category-value-series + mean_per_series" },
  "groupedBarChart_with_mean_3D": { required_fields: 8, data_structure: "category-value-series-dimension + mean_per_series_per_dimension" },
  "groupedBarChart_with_threshold_2D": { required_fields: 8, data_structure: "category-value-series + threshold_line" },
  "groupedBarChart_with_threshold_3D": { required_fields: 9, data_structure: "category-value-series-dimension + threshold_per_dimension" },
  "groupedBarChart_with_mean_threshold_2D": { required_fields: 9, data_structure: "category-value-series + mean_per_series + threshold_line" },
  "groupedBarChart_with_mean_threshold_3D": { required_fields: 10, data_structure: "category-value-series-dimension + mean_per_series_per_dimension + threshold_per_dimension" },
  
  "stackedBarChart_simple_2D": { required_fields: 6, data_structure: "category-value-stack" },
  "stackedBarChart_simple_3D": { required_fields: 7, data_structure: "category-value-stack-dimension" },
  "stackedBarChart_with_mean_2D": { required_fields: 7, data_structure: "category-value-stack + mean_of_totals" },
  "stackedBarChart_with_mean_3D": { required_fields: 8, data_structure: "category-value-stack-dimension + mean_of_totals_per_dimension" },
  "stackedBarChart_with_threshold_2D": { required_fields: 8, data_structure: "category-value-stack + threshold_of_totals" },
  "stackedBarChart_with_threshold_3D": { required_fields: 9, data_structure: "category-value-stack-dimension + threshold_of_totals_per_dimension" },
  "stackedBarChart_with_mean_threshold_2D": { required_fields: 9, data_structure: "category-value-stack + mean_of_totals + threshold_of_totals" },
  "stackedBarChart_with_mean_threshold_3D": { required_fields: 10, data_structure: "category-value-stack-dimension + mean_of_totals_per_dimension + threshold_of_totals_per_dimension" },
  
  "divergentBar_simple_2D": { required_fields: 6, data_structure: "category-value (positive/negative)" },
  "divergentBar_simple_3D": { required_fields: 7, data_structure: "category-value-dimension (positive/negative)" },
  
  // Line Chart Family (6 variations)
  "lineChart_simple_2D": { required_fields: 5, data_structure: "time-value" },
  "lineChart_simple_3D": { required_fields: 6, data_structure: "time-value-dimension" },
  
  "multiLineChart_simple_2D": { required_fields: 6, data_structure: "time-value-series" },
  "multiLineChart_simple_3D": { required_fields: 7, data_structure: "time-value-series-dimension" },
  
  "areaChart_simple_2D": { required_fields: 5, data_structure: "time-value (filled)" },
  "areaChart_simple_3D": { required_fields: 6, data_structure: "time-value-dimension (filled)" },
  
  // Combo Charts (2 variations)
  "comboBarLineChart_simple_2D": { required_fields: 7, data_structure: "category-barValue-lineValue" },
  "comboBarLineChart_simple_3D": { required_fields: 8, data_structure: "category-barValue-lineValue-dimension" },
  
  // Proportion Charts (2 variations)
  "donutChart_simple_2D": { required_fields: 5, data_structure: "category-value-percentage" },
  "donutChart_simple_3D": { required_fields: 6, data_structure: "category-value-percentage-dimension" },
  
  // Correlation Charts (4 variations)
  "scatterPlot_simple_2D": { required_fields: 6, data_structure: "category-x_value-y_value" },
  "scatterPlot_simple_3D": { required_fields: 7, data_structure: "category-x_value-y_value-dimension" },
  
  "bubbleChart_simple_2D": { required_fields: 7, data_structure: "category-x_value-y_value-size_value" },
  "bubbleChart_simple_3D": { required_fields: 8, data_structure: "category-x_value-y_value-size_value-dimension" },
  
  // Distribution Charts (3 variations)
  "histogram_simple_2D": { required_fields: 5, data_structure: "bin-count" },
  "histogram_simple_3D": { required_fields: 6, data_structure: "bin-count-dimension" },
  
  "histogramHeatmap_simple_2D": { required_fields: 6, data_structure: "x_bin-y_bin-count" }
};

// Proposition Generation Strategy with Complete Space
const PROPOSITION_GENERATION_WITH_COMPLETE_SPACE = {
  "step_1": "Generate propositions with specific chart variation targeting",
  "step_2": "Each proposition maps to exactly one chart variation",
  "step_3": "Validation ensures all chart variations have relevant propositions",
  "step_4": "User queries retrieve specific chart variation, not generic chart type"
};

// Example Enhanced Propositions
const ENHANCED_PROPOSITION_EXAMPLES = {
  "basic_ranking": {
    "proposition": "Westminster has highest crime rates among London boroughs",
    "chart_variation": "barChart_simple_2D",
    "required_fields": ["borough_name", "crime_rate"],
    "reasoning": "Simple ranking without comparison lines"
  },
  
  "ranking_with_average": {
    "proposition": "Westminster crime rates are 40% above London average",
    "chart_variation": "barChart_with_mean_2D", 
    "required_fields": ["borough_name", "crime_rate", "london_average"],
    "reasoning": "Ranking with mean line for context"
  },
  
  "threshold_analysis": {
    "proposition": "Five boroughs exceed the safe crime rate threshold of 50 per 1000",
    "chart_variation": "barChart_with_threshold_2D",
    "required_fields": ["borough_name", "crime_rate", "safety_threshold"],
    "reasoning": "Ranking with threshold line and highlighting"
  },
  
  "multi_dimensional": {
    "proposition": "Crime patterns vary significantly across boroughs by crime type",
    "chart_variation": "barChart_simple_3D",
    "required_fields": ["borough_name", "crime_rate", "crime_type_dimension"],
    "reasoning": "Borough ranking with crime type switching"
  }
};

module.exports = {
  TOTAL_VISUALIZATION_SPACE,
  DETAILED_CHART_VARIATIONS,
  ENHANCED_PROPOSITION_EXAMPLES
};