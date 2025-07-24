import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // throw new Error('test');
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }
    
    const { message, systemPrompt, context } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 1
    });

    // Get the response content from the proper OpenAI API response structure
    let responseContent = "I'm sorry, I couldn't process that request.";
    if (response.choices && response.choices.length > 0) {
      const choice = response.choices[0];
      if (choice.message && choice.message.content) {
        responseContent = choice.message.content;
      }
    }
    console.log("RAW RESPONSE:", responseContent);

    // Parse response to extract structured format
    let content = responseContent;
    let vegaSpec = null;
    let chartTitle = null;
    let responseMode = 'guidance'; // guidance, filter, chart
    let filterCommands = null;

    // Try to parse as JSON first (your current response format)
    try {
      const jsonResponse = JSON.parse(responseContent);
      
      if (jsonResponse && typeof jsonResponse === 'object') {
        // Extract TYPE
        if (jsonResponse.TYPE) {
          const type = jsonResponse.TYPE.toLowerCase();
          if (type === 'guidance') {
            responseMode = 'guidance';
          } else if (type === 'filter') {
            responseMode = 'filter';
          } else if (type === 'chart') {
            responseMode = 'chart';
          }
        }
        
        // Extract TITLE
        if (jsonResponse.TITLE) {
          chartTitle = jsonResponse.TITLE;
        }
        
        // Extract DESCRIPTION
        if (jsonResponse.DESCRIPTION) {
          content = jsonResponse.DESCRIPTION;
        }
        
        // Extract VEGA_SPEC
        if (jsonResponse.VEGA_SPEC) {
          vegaSpec = jsonResponse.VEGA_SPEC;
        }
        
        // Extract APPLY_FILTERS
        if (jsonResponse.APPLY_FILTERS) {
          filterCommands = jsonResponse.APPLY_FILTERS;
        }
      }
    } catch (jsonError) {
      // If JSON parsing fails, fall back to regex parsing (your original format)
      console.log('JSON parsing failed, falling back to regex parsing');
      
      // Extract TYPE
      const typeMatch = responseContent.match(/TYPE:\s*(.+?)(?=\n|$)/);
      if (typeMatch) {
        const type = typeMatch[1].trim().toLowerCase();
        if (type === 'guidance') {
          responseMode = 'guidance';
        } else if (type === 'filter') {
          responseMode = 'filter';
        } else if (type === 'chart') {
          responseMode = 'chart';
        }
      }

      // Extract TITLE
      const titleMatch = responseContent.match(/TITLE:\s*(.+?)(?=\n|$)/);
      if (titleMatch) {
        chartTitle = titleMatch[1].trim();
      }

      // Extract DESCRIPTION
      const descriptionMatch = responseContent.match(/DESCRIPTION:\s*([\s\S]*?)(?=\nAPPLY_FILTERS:|VEGA_SPEC:|$)/);
      if (descriptionMatch) {
        content = descriptionMatch[1].trim();
      }

      // Extract VEGA_SPEC
      const specMatch = responseContent.match(/VEGA_SPEC:\s*({[\s\S]*?})(?=\n\n|\nTYPE:|$)/);
      if (specMatch) {
        try {
          let specText = specMatch[1].trim();
          // Clean up the JSON - remove any markdown formatting and fix common issues
          specText = specText.replace(/```json/g, '').replace(/```/g, '').trim();
          specText = specText.replace(/,\s*}]/g, '}');
          specText = specText.replace(/,\s*}/g, '}');
          
          const jsonStart = specText.indexOf('{');
          const jsonEnd = specText.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            specText = specText.substring(jsonStart, jsonEnd + 1);
          }
          
          vegaSpec = JSON.parse(specText);
        } catch (error) {
          console.error('Error parsing Vega spec:', error);
          vegaSpec = null;
        }
      }

      // Extract APPLY_FILTERS
      const filterMatch = responseContent.match(/APPLY_FILTERS:\s*({[\s\S]*?})(?=\n|VEGA_SPEC:|TYPE:|$)/);
      if (filterMatch) {
        try {
          let filterText = filterMatch[1].trim();
          filterText = filterText.replace(/```json/g, '').replace(/```/g, '').trim();
          filterText = filterText.replace(/,\s*}]/g, '}');
          filterText = filterText.replace(/,\s*}/g, '}');
          
          const jsonStart = filterText.indexOf('{');
          const jsonEnd = filterText.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            filterText = filterText.substring(jsonStart, jsonEnd + 1);
          }
          
          filterCommands = JSON.parse(filterText);
        } catch (e) {
          console.error('Failed to parse filter commands:', e);
        }
      }
    }

    if (vegaSpec) {
      try {
        // ...existing code for dataset selection and chart config...
        // Determine which dataset to use based on dashboard context and set appropriate data URL
        let dataUrl = null;
        const selectedLondonFile = context.selectedLondonFile;
        const hasHRData = context.hrData && context.hrData.length > 0;
        const hasLondonData = context.londonDataSummary && Object.keys(context.londonDataSummary).length > 0;

        // Function to get correct CSV file path based on category and name
        // No longer needed: getCsvPath. Use file.path directly from selectedLondonFile or summary.

        // ...existing code for dataset selection and chart config...
        if (selectedLondonFile) {
          dataUrl = selectedLondonFile.path;
        } else if (hasLondonData && !hasHRData) {
          const userMessage = message.toLowerCase();
          const aiResponse = content.toLowerCase();
          const datasetKeywords = {
            'vehicles': ['vehicle', 'car', 'transport', 'traffic', 'licensing', 'automotive'],
            'crime-rates': ['crime', 'criminal', 'offense', 'police', 'arrest', 'theft'],
            'population': ['population', 'demographic', 'resident', 'people', 'housing density'],
            'house-prices': ['house', 'home', 'property', 'price', 'real estate', 'rent'],
            'income': ['income', 'salary', 'wage', 'earning', 'tax', 'pay'],
            'ethnicity': ['ethnic', 'race', 'diversity', 'cultural', 'background'],
            'gyms': ['gym', 'fitness', 'exercise', 'sport', 'recreation'],
            'libraries': ['library', 'book', 'reading', 'education'],
            'restaurants': ['restaurant', 'food', 'dining', 'cafe', 'catering'],
            'schools-colleges': ['school', 'education', 'student', 'college', 'university'],
            'private-rent': ['rent', 'rental', 'tenant', 'landlord', 'accommodation'],
            'country-of-births': ['birth', 'origin', 'nationality', 'migration', 'immigrant']
          };
          let bestMatch: any = null;
          let bestScore = 0;
          for (const [category, keywords] of Object.entries(datasetKeywords)) {
            let score = 0;
            for (const keyword of keywords) {
              if (userMessage.includes(keyword)) score += 2;
              if (aiResponse.includes(keyword)) score += 1;
            }
            const availableFile = Object.values(context.londonDataSummary).find((file: any) => file.category === category);
            if (availableFile && score > bestScore) {
              bestScore = score;
              bestMatch = availableFile;
            }
          }
          if (bestMatch) {
            dataUrl = bestMatch.path;
          } else {
            const firstFileId = Object.keys(context.londonDataSummary)[0];
            if (firstFileId) {
              const firstFile = context.londonDataSummary[firstFileId];
              dataUrl = firstFile.path;
            }
          }
        } else if (hasHRData && !hasLondonData) {
          dataUrl = "/dataset/HR-Employee-Attrition.csv";
        } else if (hasHRData && hasLondonData) {
          const userMessage = message.toLowerCase();
          const aiResponse = content.toLowerCase();
          const hrKeywords = ['employee', 'attrition', 'hr', 'human resources', 'department', 'job', 'salary', 'performance'];
          const hrScore = hrKeywords.reduce((score, keyword) => {
            if (userMessage.includes(keyword)) score += 2;
            if (aiResponse.includes(keyword)) score += 1;
            return score;
          }, 0);
          const londonKeywords = ['borough', 'london', 'crime', 'population', 'housing', 'vehicle', 'area'];
          const londonScore = londonKeywords.reduce((score, keyword) => {
            if (userMessage.includes(keyword)) score += 2;
            if (aiResponse.includes(keyword)) score += 1;
            return score;
          }, 0);
          if (hrScore > londonScore) {
            dataUrl = "/dataset/HR-Employee-Attrition.csv";
          } else {
            const datasetKeywords = {
              'vehicles': ['vehicle', 'car', 'transport', 'traffic', 'licensing', 'automotive'],
              'crime-rates': ['crime', 'criminal', 'offense', 'police', 'arrest', 'theft'],
              'population': ['population', 'demographic', 'resident', 'people', 'housing density'],
              'house-prices': ['house', 'home', 'property', 'price', 'real estate', 'rent'],
              'income': ['income', 'salary', 'wage', 'earning', 'tax', 'pay'],
              'ethnicity': ['ethnic', 'race', 'diversity', 'cultural', 'background'],
              'gyms': ['gym', 'fitness', 'exercise', 'sport', 'recreation'],
              'libraries': ['library', 'book', 'reading', 'education'],
              'restaurants': ['restaurant', 'food', 'dining', 'cafe', 'catering'],
              'schools-colleges': ['school', 'education', 'student', 'college', 'university'],
              'private-rent': ['rent', 'rental', 'tenant', 'landlord', 'accommodation'],
              'country-of-births': ['birth', 'origin', 'nationality', 'migration', 'immigrant']
            };
            let bestMatch: any = null;
            let bestScore = 0;
            for (const [category, keywords] of Object.entries(datasetKeywords)) {
              let score = 0;
              for (const keyword of keywords) {
                if (userMessage.includes(keyword)) score += 2;
                if (aiResponse.includes(keyword)) score += 1;
              }
              const availableFile = Object.values(context.londonDataSummary).find((file: any) => file.category === category);
              if (availableFile && score > bestScore) {
                bestScore = score;
                bestMatch = availableFile;
              }
            }
            if (bestMatch) {
              dataUrl = bestMatch.path;
            } else {
              const firstFileId = Object.keys(context.londonDataSummary)[0];
              const firstFile = context.londonDataSummary[firstFileId];
              dataUrl = firstFile.path;
            }
          }
        }

        // ...existing code for chart config...
        if (vegaSpec && dataUrl) {
          vegaSpec.data = { url: dataUrl };
          const panelWidth = context.panelWidth || 400;
          const chartWidth = Math.max(250, Math.min(panelWidth - 40, 600));
          const chartHeight = Math.max(200, Math.min(chartWidth * 0.6, 400));
          vegaSpec.width = chartWidth;
          vegaSpec.height = chartHeight;
          vegaSpec.autosize = {
            type: "fit",
            contains: "padding",
            resize: true
          };
          vegaSpec.actions = false;
          vegaSpec.config = {
            ...vegaSpec.config,
            view: {
              stroke: "transparent"
            }
          };
          if (vegaSpec.encoding) {
            vegaSpec.encoding.tooltip = vegaSpec.encoding.tooltip || [
              {"field": "*", "type": "nominal"}
            ];
          }
          if (chartTitle && !vegaSpec.title) {
            vegaSpec.title = {
              text: chartTitle,
              fontSize: 14,
              fontWeight: "bold",
              anchor: "start"
            };
          }
        } else {
          console.warn('No data URL could be determined for chart generation');
          if (vegaSpec && !dataUrl) {
            console.warn('Vega spec generated but no data URL available - chart may not render properly');
          }
        }
      } catch (error) {
        console.error('Error parsing Vega spec:', error);
        vegaSpec = null;
      }
    } else {
      if (responseMode === 'chart' || responseContent.toLowerCase().includes('chart') || 
          responseContent.toLowerCase().includes('visualization') || 
          responseContent.toLowerCase().includes('vega')) {
      }
    }
    
    // Auto-detect filters from user message and AI response if no explicit filters provided
    if (!filterCommands) {
      const hasLondonData = context.londonDataSummary && Object.keys(context.londonDataSummary).length > 0;
      const hasHRData = context.hrData && context.hrData.length > 0;
      
      let detectedFilters = {} as any;
      
      // London data filters
      if (hasLondonData) {
        const availableBoroughs = context.availableFilters?.boroughs || [];
        const availableCrimeCategories = context.availableFilters?.crimeCategories || [];
        const availableYears = context.availableFilters?.birthYears || context.availableFilters?.baseYears || [];
        
        // Check for borough names in user message
        for (const borough of availableBoroughs) {
          if (message.toLowerCase().includes(borough.toLowerCase())) {
            detectedFilters.borough = borough;
            break;
          }
        }
        
        // Check for crime categories in user message
        for (const category of availableCrimeCategories) {
          if (message.toLowerCase().includes(category.toLowerCase())) {
            detectedFilters.crimeCategory = category;
            break;
          }
        }
        
        // Check for years in user message
        const yearInMessage = message.match(/\b(19|20)\d{2}\b/);
        if (yearInMessage && availableYears.includes(yearInMessage[0])) {
          detectedFilters.baseYear = yearInMessage[0];
        }
        
        // Check AI response for London filter suggestions
        const boroughMatch = content.match(/(?:borough|Borough)[:\s]*['"]([^'"]+)['"]|(?:borough|Borough)[:\s]*(\w+(?:\s+\w+)*)/i);
        const crimeMatch = content.match(/(?:crime|Crime)[:\s]*['"]([^'"]+)['"]|(?:crime|Crime)[:\s]*(\w+(?:\s+\w+)*)/i);
        const yearMatch = content.match(/(?:year|Year)[:\s]*['"]?(\d{4})['"]?/i);
        
        if (boroughMatch && !detectedFilters.borough) {
          const value = boroughMatch[1] || boroughMatch[2];
          if (value && value.trim() && value.length >= 3) {
            const trimmedValue = value.trim();
            const matchedBorough = availableBoroughs.find((borough: string) => 
              borough.toLowerCase().includes(trimmedValue.toLowerCase()) || 
              trimmedValue.toLowerCase().includes(borough.toLowerCase())
            );
            if (matchedBorough) {
              detectedFilters.borough = matchedBorough;
            }
          }
        }
        
        if (crimeMatch && !detectedFilters.crimeCategory) {
          const value = crimeMatch[1] || crimeMatch[2];
          if (value && value.trim() && value.length >= 3) {
            const trimmedValue = value.trim();
            const matchedCategory = availableCrimeCategories.find((category: string) => 
              category.toLowerCase().includes(trimmedValue.toLowerCase()) || 
              trimmedValue.toLowerCase().includes(category.toLowerCase())
            );
            if (matchedCategory) {
              detectedFilters.crimeCategory = matchedCategory;
            }
          }
        }
        
        if (yearMatch && !detectedFilters.baseYear) {
          const value = yearMatch[1];
          if (value && value.trim()) {
            const year = value.trim();
            if (availableYears.includes(year)) {
              detectedFilters.baseYear = year;
            }
          }
        }
      }
      
      // HR data filters
      if (hasHRData) {
        const userMessage = message.toLowerCase();
        const aiResponse = content.toLowerCase();
        
        // Check for department mentions
        const commonDepartments = ['sales', 'research', 'development', 'human resources', 'hr', 'marketing', 'finance', 'engineering', 'operations', 'it', 'technology'];
        for (const dept of commonDepartments) {
          if (userMessage.includes(dept) || aiResponse.includes(dept)) {
            detectedFilters.department = dept;
            break;
          }
        }
        
        // Check for job role mentions
        const commonRoles = ['manager', 'executive', 'analyst', 'specialist', 'director', 'representative', 'developer', 'engineer', 'scientist', 'technician'];
        for (const role of commonRoles) {
          if (userMessage.includes(role) || aiResponse.includes(role)) {
            detectedFilters.jobRole = role;
            break;
          }
        }
        
        // Check for gender mentions
        if (userMessage.includes('male') || userMessage.includes('female') || aiResponse.includes('male') || aiResponse.includes('female')) {
          if (userMessage.includes('male') || aiResponse.includes('male')) {
            detectedFilters.gender = userMessage.includes('female') || aiResponse.includes('female') ? 'Female' : 'Male';
          }
        }
        
        // Check for attrition mentions
        if (userMessage.includes('attrition') || userMessage.includes('left') || userMessage.includes('quit') || 
            aiResponse.includes('attrition') || aiResponse.includes('left') || aiResponse.includes('quit')) {
          detectedFilters.showOnlyAttrition = true;
        }
      }
      
      // Apply detected filters if any were found
      if (Object.keys(detectedFilters).length > 0) {
        filterCommands = detectedFilters;
      }
    }

    return NextResponse.json({
      content,
      vegaSpec,
      responseMode,
      filterCommands,
      title: chartTitle
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
