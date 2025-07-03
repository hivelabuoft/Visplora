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
      instructions: `You are an expert data visualization assistant specializing in creating Vega-Lite charts. When users ask for charts, visualizations, or any data exploration, you should ALWAYS try to create a meaningful chart.

IMPORTANT: For ANY request that could benefit from a visual representation, create a chart. This includes:
- Requests for charts, graphs, plots, visualizations
- Questions about trends, patterns, distributions
- Comparisons between groups or categories
- Analysis requests that could be answered visually
- Exploratory data analysis questions

When creating charts, use this EXACT format:
CHART_EXPLANATION: [Provide a detailed explanation of the chart (3-4 sentences minimum). Include: 1) What the chart shows, 2) Which specific fields/columns are being used and their data types, 3) What insights or patterns the visualization reveals, 4) Why this type of chart is appropriate for this data]
CHART_TITLE: [A concise, descriptive title for the chart]
VEGA_SPEC: {"$schema": "https://vega.github.io/schema/vega-lite/v5.json", "data": {"values": []}, "mark": "...", "encoding": {..., "tooltip": [{"field": "*", "type": "nominal"}]}}

CRITICAL: The VEGA_SPEC must be valid JSON on a single line. Do not include any markdown formatting or code blocks.
- Always include tooltip encoding for interactivity
- Charts will be automatically sized based on the assistant panel width (responsive)
- Do not specify width, height, autosize, or config properties - these will be added automatically
- Always provide a meaningful CHART_TITLE
- Always provide detailed CHART_EXPLANATION with field descriptions

Example response:
CHART_EXPLANATION: This pie chart visualizes the distribution of employees across different education fields within the organization. It uses the 'EducationField' column (categorical/nominal data) to create segments, with each segment's size determined by the count of employees in that field. The chart reveals which educational backgrounds are most prevalent among employees, helping identify skill concentrations and potential areas for diversification. A pie chart is ideal for showing parts of a whole when you want to emphasize proportional relationships between categories.
CHART_TITLE: Employee Distribution by Education Field
VEGA_SPEC: {"$schema": "https://vega.github.io/schema/vega-lite/v5.json", "data": {"values": []}, "mark": {"type": "arc", "innerRadius": 0}, "encoding": {"theta": {"field": "Education", "type": "quantitative", "aggregate": "count"}, "color": {"field": "EducationField", "type": "nominal"}, "tooltip": [{"field": "EducationField", "type": "nominal"}, {"field": "Education", "type": "quantitative", "aggregate": "count"}]}}

Available columns: Age, Attrition, BusinessTravel, DailyRate, Department, DistanceFromHome, Education, EducationField, EmployeeCount, EmployeeNumber, EnvironmentSatisfaction, Gender, HourlyRate, JobInvolvement, JobLevel, JobRole, JobSatisfaction, MaritalStatus, MonthlyIncome, MonthlyRate, NumCompaniesWorked, Over18, OverTime, PercentSalaryHike, PerformanceRating, RelationshipSatisfaction, StandardHours, StockOptionLevel, TotalWorkingYears, TrainingTimesLastYear, WorkLifeBalance, YearsAtCompany, YearsInCurrentRole, YearsSinceLastPromotion, YearsWithCurrManager

Chart best practices:
- Use appropriate mark types (bar, point, line, area, arc for pie charts)
- Choose correct encoding types (nominal, ordinal, quantitative, temporal)
- For pie charts, use "arc" mark with "theta" encoding
- For bar charts, use "bar" mark with x/y encodings
- Always include "$schema" and ensure valid JSON`,
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
    
    // Parse response to extract chart explanation and Vega spec
    let content = responseContent;
    let vegaSpec = null;
    let chartTitle = null;
    
    if (responseContent.includes('VEGA_SPEC:')) {
      const parts = responseContent.split('VEGA_SPEC:');
      if (parts.length === 2) {
        const beforeSpec = parts[0];
        
        // Extract chart title if present
        if (beforeSpec.includes('CHART_TITLE:')) {
          const titleParts = beforeSpec.split('CHART_TITLE:');
          if (titleParts.length === 2) {
            chartTitle = titleParts[1].split('CHART_EXPLANATION:')[0].trim();
            content = beforeSpec.replace('CHART_EXPLANATION:', '').replace(`CHART_TITLE: ${chartTitle}`, '').trim();
          }
        } else {
          content = beforeSpec.replace('CHART_EXPLANATION:', '').trim();
        }
        
        try {
          let specText = parts[1].trim();
          
          // Clean up the JSON - remove any markdown formatting
          specText = specText.replace(/```json/g, '').replace(/```/g, '').trim();
          
          // Try to find JSON object if it's embedded in text
          const jsonMatch = specText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            specText = jsonMatch[0];
          }
          
          vegaSpec = JSON.parse(specText);
          
          // Ensure the chart uses the actual HR data and configure properly
          if (vegaSpec && context.hrDataSample && context.hrDataSample.length > 0) {
            vegaSpec.data = { values: context.hrDataSample };
            
            // Calculate responsive dimensions based on current panel width
            const panelWidth = context.panelWidth || 400;
            const chartWidth = Math.max(250, Math.min(panelWidth - 40, 600)); // Min 250px, max 600px, with padding
            const chartHeight = Math.max(200, Math.min(chartWidth * 0.6, 400)); // Maintain aspect ratio, min 200px, max 400px
            
            vegaSpec.width = chartWidth;
            vegaSpec.height = chartHeight;
            
            // Make it responsive to container width with proper fitting
            vegaSpec.autosize = {
              type: "fit",
              contains: "padding",
              resize: true
            };
            
            // Disable Vega actions menu at the top level
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
            } else if (!vegaSpec.title && content) {
              vegaSpec.title = {
                text: content.split('.')[0].substring(0, 50) + (content.length > 50 ? '...' : ''),
                fontSize: 14,
                fontWeight: "bold",
                anchor: "start"
              };
            }
          }
        } catch (error) {
          console.error('Error parsing Vega spec:', error);
          console.error('Raw spec text:', parts[1]);
          content += ' \n\nNote: There was an error parsing the chart specification. The chart may not display correctly.';
        }
      }
    }

    return NextResponse.json({
      content,
      vegaSpec
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
