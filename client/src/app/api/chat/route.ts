import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }
    
    const { message, systemPrompt, context } = await req.json();

    const response = await openai.responses.create({
      model: "gpt-4o",
      input: `${systemPrompt}

User request: ${message}

Assistant panel width: ${context.panelWidth || 400}px`,
      instructions: `You are an expert data visualization assistant that helps users explore HR data and understand their dashboard. You have THREE response modes based on the user's question:

MODE 1 - DASHBOARD GUIDANCE (Priority): If the user's question can be answered by existing dashboard elements:
- Provide clear instructions on which dashboard elements to examine
- Explain what insights they can derive from those elements
- Give specific guidance on how to interpret the visualizations
- Use format: GUIDANCE: [detailed instructions on which dashboard elements to check]

MODE 2 - FILTER ASSISTANCE: If the user's question requires filtering existing dashboard elements:
- Determine specific filter values to apply
- Provide filtering instructions and expected insights
- Use format: FILTER_GUIDANCE: [specific filtering instructions and expected insights]
- Include filter actions using: APPLY_FILTERS: {"department": "value", "jobRole": "value", "gender": "value", "showOnlyAttrition": true/false}

MODE 3 - NEW VISUALIZATION: Only if the question cannot be answered by existing elements or filtering:
- Create a new Vega-Lite chart to answer their specific question
- Use this EXACT format for charts:

CHART_EXPLANATION: [Provide a detailed explanation of the chart (3-4 sentences minimum). Include: 1) What the chart shows, 2) Which specific fields/columns are being used and their data types, 3) What insights or patterns the visualization reveals, 4) Why this type of chart is appropriate for this data]
CHART_TITLE: [A concise, descriptive title for the chart]
VEGA_SPEC: {"$schema": "https://vega.github.io/schema/vega-lite/v5.json", "data": {"values": []}, "mark": "...", "encoding": {..., "tooltip": [{"field": "*", "type": "nominal"}]}}

ALL DASHBOARD ELEMENTS (analyze these FIRST - these are what the user can already see):
${context.allDashboardElements ? context.allDashboardElements.map((el: any) => 
  `- ${el.name} (${el.elementType}): ${el.description} | Fields: ${el.dataFields.join(', ')} | Insights: ${el.insights}`
).join('\n') : 'No dashboard elements'}

ALL DASHBOARD NOTES:
${context.allDashboardNotes ? context.allDashboardNotes.map((note: any) => 
  `- Note: "${note.content.substring(0, 100)}..."`
).join('\n') : 'No dashboard notes'}

Connected Dashboard Elements (elements connected to this AI assistant):
${context.connectedData ? context.connectedData.map((el: any) => 
  el.type === 'visualization' ? 
    `- ${el.name} (${el.elementType}): Shows data visualization` :
    `- Note: "${el.content.substring(0, 100)}..."`
).join('\n') : 'No connected elements'}

Current Dashboard Context:
- Total dashboard elements: ${context.allDashboardElements ? context.allDashboardElements.length : 0}
- Connected elements: ${context.connectedElements || 0}
- Available data: ${context.totalRecords || 0} HR records
- Data columns: ${context.availableColumns ? context.availableColumns.join(', ') : 'Age, Attrition, BusinessTravel, DailyRate, Department, DistanceFromHome, Education, EducationField, EmployeeCount, EmployeeNumber, EnvironmentSatisfaction, Gender, HourlyRate, JobInvolvement, JobLevel, JobRole, JobSatisfaction, MaritalStatus, MonthlyIncome, MonthlyRate, NumCompaniesWorked, Over18, OverTime, PercentSalaryHike, PerformanceRating, RelationshipSatisfaction, StandardHours, StockOptionLevel, TotalWorkingYears, TrainingTimesLastYear, WorkLifeBalance, YearsAtCompany, YearsInCurrentRole, YearsSinceLastPromotion, YearsWithCurrManager'}

Available Filter Options:
- Department: "Sales", "Research & Development", "Human Resources"
- Job Role: "Healthcare Representative", "Research Scientist", "Sales Executive", "Human Resources", "Research Director", "Laboratory Technician", "Manufacturing Director", "Sales Representative", "Manager"
- Gender: "Male", "Female"
- Show Only Attrition: true/false

DECISION LOGIC:
1. First, check if ANY dashboard element (not just connected ones) can answer the question
2. If existing dashboard elements can answer the question, provide GUIDANCE to examine those specific elements by name
3. If partially answerable with filtering, suggest filtering existing elements and specify exact filter values
4. Only create new charts if the question requires data visualization not available in any existing dashboard element

Chart best practices (Mode 3 only):
- Use appropriate mark types (bar, point, line, area, arc for pie charts)
- Choose correct encoding types (nominal, ordinal, quantitative, temporal)
- Always include "$schema" and ensure valid JSON
- Include meaningful tooltips for interactivity`,
      temperature: 0.7,
      max_output_tokens: 2000,
    });

    // Get the response content based on the new API structure
    let responseContent = "I'm sorry, I couldn't process that request.";
    if (response.output && response.output.length > 0) {
      const output = response.output[0];
      if ('content' in output && output.content && output.content.length > 0) {
        const contentItem = output.content[0];
        if ('text' in contentItem) {
          responseContent = contentItem.text;
        }
      }
    }
    
    // Parse response to extract different response modes
    let content = responseContent;
    let vegaSpec = null;
    let chartTitle = null;
    let responseMode = 'general'; // general, guidance, filter, chart
    
    // Check for different response modes
    if (responseContent.includes('GUIDANCE:')) {
      responseMode = 'guidance';
      content = responseContent.replace('GUIDANCE:', '').trim();
    } else if (responseContent.includes('FILTER_GUIDANCE:')) {
      responseMode = 'filter';
      content = responseContent.replace('FILTER_GUIDANCE:', '').trim();
    } else if (responseContent.includes('VEGA_SPEC:')) {
      responseMode = 'chart';
      
      // Extract chart explanation
      const explanationMatch = responseContent.match(/CHART_EXPLANATION:\s*([\s\S]*?)(?=\nCHART_TITLE:|VEGA_SPEC:|$)/);
      if (explanationMatch) {
        content = explanationMatch[1].trim();
      }
      
      // Extract chart title
      const titleMatch = responseContent.match(/CHART_TITLE:\s*(.+?)(?=\n|VEGA_SPEC:|$)/);
      if (titleMatch) {
        chartTitle = titleMatch[1].trim();
      }
      
      // Extract Vega spec
      const specMatch = responseContent.match(/VEGA_SPEC:\s*({[\s\S]*?})(?=\n\n|$)/);
      if (specMatch) {
        try {
          let specText = specMatch[1].trim();
          
          // Clean up the JSON - remove any markdown formatting
          specText = specText.replace(/```json/g, '').replace(/```/g, '').trim();
          
          vegaSpec = JSON.parse(specText);
          
          // Ensure the chart uses the actual HR data and configure properly
          const hrData = context.hrData || context.hrDataSample || [];
          if (vegaSpec && hrData && hrData.length > 0) {
            vegaSpec.data = { values: hrData };
            
            // Calculate responsive dimensions based on current panel width
            const panelWidth = context.panelWidth || 400;
            const chartWidth = Math.max(250, Math.min(panelWidth - 40, 600));
            const chartHeight = Math.max(200, Math.min(chartWidth * 0.6, 400));
            
            vegaSpec.width = chartWidth;
            vegaSpec.height = chartHeight;
            
            // Make it responsive to container width with proper fitting
            vegaSpec.autosize = {
              type: "fit",
              contains: "padding",
              resize: true
            };
            
            // Disable Vega actions menu
            vegaSpec.actions = false;
            
            // Configure chart styling
            vegaSpec.config = {
              ...vegaSpec.config,
              view: {
                stroke: "transparent"
              }
            };
            
            // Ensure encoding has tooltips
            if (vegaSpec.encoding) {
              vegaSpec.encoding.tooltip = vegaSpec.encoding.tooltip || [
                {"field": "*", "type": "nominal"}
              ];
            }
            
            // Add the chart title if provided by AI
            if (chartTitle && !vegaSpec.title) {
              vegaSpec.title = {
                text: chartTitle,
                fontSize: 14,
                fontWeight: "bold",
                anchor: "start"
              };
            }
          }
        } catch (error) {
          console.error('Error parsing Vega spec:', error);
          console.error('Raw spec text:', specMatch[1]);
          vegaSpec = null;
        }
      }
    }

    // Extract filter commands if present
    let filterCommands = null;
    const filterMatch = content.match(/APPLY_FILTERS:\s*({[\s\S]*?})(?=\n|$)/);
    if (filterMatch) {
      try {
        filterCommands = JSON.parse(filterMatch[1]);
      } catch (e) {
        console.error('Failed to parse filter commands:', e);
      }
    }

    return NextResponse.json({
      content,
      vegaSpec,
      responseMode,
      filterCommands
    });

  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Handle specific OpenAI API errors
    let errorMessage = 'Failed to process request. Please try again.';
    let statusCode = 500;
    
    if (error?.error?.type === 'insufficient_quota') {
      errorMessage = 'OpenAI API quota exceeded. Please check your billing.';
      statusCode = 429;
    } else if (error?.error?.type === 'invalid_request_error') {
      errorMessage = 'Invalid request to OpenAI API. Please try a different message.';
      statusCode = 400;
    } else if (error?.status === 401) {
      errorMessage = 'Invalid OpenAI API key. Please check your configuration.';
      statusCode = 401;
    } else if (error?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      statusCode = 429;
    } else if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      errorMessage = 'Network error connecting to OpenAI. Please check your internet connection.';
      statusCode = 503;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.error?.type || 'unknown'
      },
      { status: statusCode }
    );
  }
}
