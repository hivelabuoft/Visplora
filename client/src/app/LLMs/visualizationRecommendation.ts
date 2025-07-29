export interface VisualizationView {
  viewType: string;
  description: string;
  dataColumns: string[];
  aggregations: string[];
  interactions: string[];
  purpose: string;
}

// Dashboard format
export interface DashboardRecommendation {
  dashboardTitle: string;
  views: VisualizationView[];
  insightPanels: string[];
  overallNarrative: string;
  datasetRecommendations: string[];
}

// Charts-only format
export interface ChartsOnlyRecommendation {
  totalViews: number;
  views: VisualizationView[];
  overallStrategy: string;
  datasetRecommendations: string[];
}

// Union type for the response
export type VisualizationRecommendation = DashboardRecommendation | ChartsOnlyRecommendation;

// Type guard to check if it's a dashboard
export function isDashboardRecommendation(rec: VisualizationRecommendation): rec is DashboardRecommendation {
  return 'dashboardTitle' in rec;
}

export async function getVisualizationRecommendation(
  sentence: string,
  dataContext: string = '',
  availableDatasets: string[] = []
): Promise<VisualizationRecommendation> {
  try {
    console.log('🎯 Getting visualization recommendations for:', sentence);

    const response = await fetch('/api/visualization-recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sentence,
        dataContext,
        availableDatasets
      }),
    });

    if (!response.ok) {
      console.error('❌ HTTP error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const recommendation: VisualizationRecommendation = await response.json();
    console.log('✅ Received visualization recommendation from API:', recommendation);
    
    // Log format-specific details
    if (isDashboardRecommendation(recommendation)) {
      console.log('📊 Dashboard format:', recommendation.dashboardTitle);
      console.log('📋 Views count:', recommendation.views.length);
      console.log('💡 Insight panels:', recommendation.insightPanels.length);
    } else {
      console.log('📊 Charts-only format, total views:', recommendation.totalViews);
      console.log('📋 Views count:', recommendation.views.length);
    }
    
    return recommendation;

  } catch (error) {
    console.error('❌ Error getting visualization recommendation:', error);
    
    // Return fallback recommendation (charts-only format)
    return {
      totalViews: 1,
      views: [{
        viewType: "Bar Chart",
        description: "Basic visualization to support the narrative",
        dataColumns: ["Category", "Value"],
        aggregations: ["count"],
        interactions: ["filter"],
        purpose: "Provide visual evidence for the narrative statement"
      }],
      overallStrategy: "Basic analysis due to API error",
      datasetRecommendations: ["Default dataset"]
    } as ChartsOnlyRecommendation;
  }
}
