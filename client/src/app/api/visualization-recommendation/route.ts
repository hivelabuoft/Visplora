import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(request: NextRequest) {
  try {
    const { sentence, dataContext, availableDatasets } = await request.json();
    
    console.log('🎯 Getting visualization recommendations for:', sentence);

    const prompt = `You are an assistant data visualization strategist. 

They have a user narrative describing an analysis they want to explore with data visualization and a list of available datasets.

**Your Goal:**
Generate a structured visualization plan that specifies whether it should be presented as a dashboard or a collection of individual charts, including fully detailed chart definitions with descriptions, columns, aggregations, interactions, and narrative purpose.

**Your Role:**
Interpret the user's narrative and determine whether to output a dashboard JSON or a charts-only JSON.
Recommend 2–4 complementary visualizations that best support the narrative.
Include chart types, data columns, aggregations, and user interactions.
Suggest relevant datasets and optionally add insight panels for dashboards.

**Criteria for output format:**
Use a DASHBOARD if: 
1. The narrative involves multiple metrics or dimensions. 
Charts are interconnected and tell a holistic story.
2. Insights benefit from summary panels or trade‑off exploration.

**Use INDIVIDUAL CHARTS if:**
1. The narrative is simple or single‑question focused.
2. Only 1–3 self‑contained charts are needed.
3. Charts are not strongly interdependent.

**Avoid:**
Any explanations outside the JSON.
Vague visualizations without clear purpose.
Extra text beyond the required JSON structure.

############################
INPUT JSON
############################

{
  "sentence": "${sentence}",
  "dataContext": "${dataContext || 'General data analysis context'}",
  "availableDatasets": [${availableDatasets?.map((d: string) => `"${d}"`).join(', ') || '"London datasets (demographics, transport, housing, crime, etc.)"'}]
}

############################
INSTRUCTIONS
############################
1. Each view must include (for both individual views or dashboard):
[
    {
      "viewType": "chart type (e.g., bar chart, scatter plot, heatmap, line chart, etc.)",
      "description": "detailed description of what this view shows",
      "dataColumns": ["specific column names or data fields needed"],
      "aggregations": ["sum", "average", "count", "group by borough", etc."],
      "interactions": ["filter by date", "drill down by category", "hover for details", etc.],
      "purpose": "how this view specifically supports the narrative sentence"
    }
  ]
2.  If dashboard: Include dashboardTitle, insightPanels (2–3 key takeaways), and overallNarrative.
3. If charts‑only: Include totalViews and overallStrategy.
4. Always include datasetRecommendations.

Return only the JSON object.

############################
OUTPUT JSON FORMAT
############################

Dashboard Example:
{
  "dashboardTitle": "London Borough Relocation Insights",
  "views": [
    { "viewType": "...", "description": "...", "dataColumns": ["..."], "aggregations": ["..."], "interactions": ["..."], "purpose": "..." }
  ],
  "insightPanels": [
    "Richmond has the highest safety index at 87.",
    "Tower Hamlets offers the lowest average rent at £1,250/month."
  ],
  "overallNarrative": "The dashboard compares safety, housing, and income trends to help users choose the best borough.",
  "datasetRecommendations": ["London Housing Data", "Crime Statistics", "Income Data"]
}

Charts‑Only Example:
{
  "totalViews": 3,
  "views": [
    { "viewType": "...", "description": "...", "dataColumns": ["..."], "aggregations": ["..."], "interactions": ["..."], "purpose": "..." }
  ],
  "overallStrategy": "Start by identifying top neighborhoods by price, then compare crime rates, then analyze correlation between price and safety.",
  "datasetRecommendations": ["Housing Statistics", "Crime Reports"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system", 
          content: "You are an expert data visualization consultant specializing in creating comprehensive dashboard recommendations. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 2000,
      top_p: 0.9
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('🤖 Raw OpenAI response:', content);

    // Parse the JSON response
    let recommendation: VisualizationRecommendation;
    try {
      // Clean the content in case there are extra characters
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('🧹 Cleaned content for parsing:', cleanContent);
      
      recommendation = JSON.parse(cleanContent);
      console.log('✅ Successfully parsed recommendation:', JSON.stringify(recommendation, null, 2));
      
      // Validate the parsed object has required fields (either dashboard or charts-only format)
      if (!recommendation.views || !Array.isArray(recommendation.views)) {
        throw new Error('Invalid recommendation structure: missing or invalid views array');
      }
      
      // Check if it's dashboard format or charts-only format
      const hasDashboardFields = 'dashboardTitle' in recommendation;
      const hasChartsOnlyFields = 'totalViews' in recommendation;
      
      if (!hasDashboardFields && !hasChartsOnlyFields) {
        throw new Error('Invalid recommendation structure: must be either dashboard or charts-only format');
      }
      
      if (hasDashboardFields) {
        const dashRec = recommendation as DashboardRecommendation;
        if (!dashRec.dashboardTitle || !dashRec.insightPanels || !dashRec.overallNarrative || !dashRec.datasetRecommendations) {
          throw new Error('Invalid dashboard format: missing required fields');
        }
      } else {
        const chartsRec = recommendation as ChartsOnlyRecommendation;
        if (!chartsRec.totalViews || !chartsRec.overallStrategy || !chartsRec.datasetRecommendations) {
          throw new Error('Invalid charts-only format: missing required fields');
        }
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', parseError);
      console.log('Raw content that failed to parse:', content);
      
      // Fallback response (charts-only format)
      recommendation = {
        totalViews: 1,
        views: [{
          viewType: "Bar Chart",
          description: "Basic visualization to support the narrative",
          dataColumns: ["Category", "Value"],
          aggregations: ["count", "sum"],
          interactions: ["filter", "sort"],
          purpose: "Provide visual evidence for the narrative statement"
        }],
        overallStrategy: "Single view analysis",
        datasetRecommendations: ["Primary dataset"]
      } as ChartsOnlyRecommendation;
    }

    // console.log('✅ Parsed visualization recommendation:', recommendation);
    // console.log('📊 Total views in recommendation:', recommendation.totalViews);
    // console.log('📋 Views array length:', recommendation.views.length);
    
    return NextResponse.json(recommendation);

  } catch (error) {
    console.error('❌ Error getting visualization recommendation:', error);
    
    // Return fallback recommendation (charts-only format)
    const fallbackRecommendation: ChartsOnlyRecommendation = {
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
    };
    
    return NextResponse.json(fallbackRecommendation);
  }
}
