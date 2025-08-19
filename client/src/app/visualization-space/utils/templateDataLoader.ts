/**
 * Template Data Loader
 * Utility to load and parse template chart data from visualization rules
 */

export interface ChartTemplate {
  id: string;
  dataset_id: string;
  dataset_name: string;
  template: string;
  template_name: string;
  description: string;
  proposition_types: string[];
  spec: any;
  slots: {
    required: string[];
    optional: string[];
    filled: Record<string, any>;
  };
}

export interface TemplateChartsData {
  generated_at: string;
  generation_method: string;
  templates_used: string[];
  statistics: {
    total_datasets: number;
    total_charts_generated: number;
    total_charts_skipped: number;
    datasets_with_charts: number;
  };
  charts: Array<{
    dataset_id: string;
    dataset_name: string;
    category: string;
    charts: ChartTemplate[];
  }>;
}

/**
 * Load template charts data from the generated JSON file
 */
export async function loadTemplateCharts(): Promise<TemplateChartsData> {
  try {
    const response = await fetch('/data/template_charts/template_based_charts.json');
    if (!response.ok) {
      throw new Error(`Failed to load template charts: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading template charts:', error);
    throw error;
  }
}

/**
 * Get charts by template type
 */
export function getChartsByType(data: TemplateChartsData, templateType: string): ChartTemplate[] {
  const allCharts: ChartTemplate[] = [];
  
  data.charts.forEach(dataset => {
    dataset.charts.forEach(chart => {
      if (chart.template === templateType) {
        allCharts.push(chart);
      }
    });
  });
  
  return allCharts;
}

/**
 * Get a representative chart for a specific template type
 */
export function getRepresentativeChart(data: TemplateChartsData, templateType: string): ChartTemplate | null {
  const charts = getChartsByType(data, templateType);
  
  // Prefer charts with more interesting data or better examples
  const priorities = [
    'london-crime-data-2022-2023',
    'ethnic-group',
    'population-1801-2021',
    'voa-average-rent-summary'
  ];
  
  for (const datasetId of priorities) {
    const chart = charts.find(c => c.dataset_id === datasetId);
    if (chart) return chart;
  }
  
  // Return first available chart if no priority match
  return charts.length > 0 ? charts[0] : null;
}

/**
 * Get all available template types
 */
export function getAvailableTemplateTypes(data: TemplateChartsData): string[] {
  return data.templates_used;
}
