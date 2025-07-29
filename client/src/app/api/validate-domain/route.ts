import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";
import fs from 'fs';
import path from 'path';

interface DatasetColumn {
  name: string;
  type: string;
  description: string;
}

interface DatasetFile {
  id: string;
  name: string;
  path: string;
  description: string;
  columns?: DatasetColumn[];
  note?: string;
}

interface DatasetCategory {
  name: string;
  description: string;
  files: DatasetFile[];
}

interface DatasetsInfo {
  categories: DatasetCategory[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Domain validation API called');
    
    // Parse and log request body
    let requestBody = null;
    try {
      const bodyText = await request.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
        console.log('📝 Received validation request:', requestBody);
        
        // Validate the expected structure
        if (!requestBody.sentence || typeof requestBody.sentence !== 'string') {
          throw new Error('Missing or invalid sentence string');
        }
        
        console.log('📝 Sentence to validate:', requestBody.sentence);
        
      } else {
        throw new Error('Request body is empty');
      }
    } catch (bodyError) {
      console.error('⚠️ Could not parse request body:', bodyError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body', 
          message: bodyError instanceof Error ? bodyError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Load the London datasets information with column details
    let datasetsInfo: DatasetsInfo | null = null;
    try {
      const datasetsPath = path.join(process.cwd(), 'public', 'data', 'london_columns.json');
      const datasetsContent = fs.readFileSync(datasetsPath, 'utf8');
      datasetsInfo = JSON.parse(datasetsContent) as DatasetsInfo;
      console.log('📂 Loaded datasets info with', datasetsInfo.categories?.length || 0, 'categories');
      console.log('📊 Total columns across all datasets:', 
        datasetsInfo.categories.reduce((total, cat) => 
          total + cat.files.reduce((fileTotal, file) => 
            fileTotal + (file.columns?.length || 0), 0), 0));
    } catch (fileError) {
      console.error('⚠️ Could not load datasets file:', fileError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to load datasets information', 
          message: fileError instanceof Error ? fileError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    console.log('🤖 Calling OpenAI for domain validation...');
    
    // Create the domain validation prompt
    const systemPrompt = `You are a domain validation assistant for a London housing data dashboard. Your task is to determine if a user's exploration question/statement is within the scope of the available datasets.

**Your role**: Analyze the user's sentence to determine if it can be answered using the available London datasets with their specific columns. Return a clear validation result with actionable feedback.

**Available Dataset Categories with Column Details:**
${datasetsInfo.categories.map((cat: DatasetCategory) => {
  const categoryInfo = `• ${cat.name}: ${cat.description}`;
  const filesInfo = cat.files.map((file: DatasetFile) => {
    const fileHeader = `  📁 ${file.name}: ${file.description}`;
    if (file.columns && file.columns.length > 0) {
      const columnsList = file.columns.slice(0, 10).map(col => `${col.name} (${col.type})`).join(', ');
      const extraColumns = file.columns.length > 10 ? `... and ${file.columns.length - 10} more columns` : '';
      return `${fileHeader}\n    Columns: ${columnsList}${extraColumns}`;
    }
    return fileHeader;
  }).join('\n');
  return `${categoryInfo}\n${filesInfo}`;
}).join('\n\n')}

**Data Types Available**:
- Numeric: Population counts, crime numbers, income values, house prices, vehicle counts
- Categorical: Borough names, crime types, ethnic groups, education levels
- Date: Crime dates, school opening dates, inspection dates
- Geographic: LSOA codes, postcode areas, coordinates

**Validation Criteria:**
1. **IN SCOPE**: Questions about London boroughs/areas that can be answered with the specific columns available
2. **OUT OF SCOPE**: Questions about other cities, unavailable data types, or topics not covered by the columns

**Input Format:**
{
  "sentence": "<user's exploration question or statement>"
}

**Your Response Format:**
{
  "is_data_driven_question": <boolean>,       // true if this is asking for data/analysis
  "inquiry_supported": <boolean>,             // true if we can answer with available datasets
  "matched_dataset": [<string>],              // array of dataset file names that can answer this
  "matched_columns": {                        // dictionary mapping dataset files to relevant columns
    "dataset_file.csv": [<string>]            // array of column names for each dataset
  },
  "explanation": "<string>"                   // explain why it was/wasn't matched or if it's not data-driven
}

**Examples:**

IN SCOPE Examples:
- "Show me crime rates in different London boroughs" → 
  {
    "is_data_driven_question": true,
    "inquiry_supported": true,
    "matched_dataset": ["london_crime_data_2022_2023.csv"],
    "matched_columns": {
      "london_crime_data_2022_2023.csv": ["borough_name", "crime_category_name", "year"]
    },
    "explanation": "This question asks for crime statistics by borough, which can be answered using our crime dataset."
  }

- "Compare housing prices with population density" → 
  {
    "is_data_driven_question": true,
    "inquiry_supported": true,
    "matched_dataset": ["land-registry-house-prices-borough.csv", "housing-density-borough.csv"],
    "matched_columns": {
      "land-registry-house-prices-borough.csv": ["Area", "Value"],
      "housing-density-borough.csv": ["Name", "Population_per_square_kilometre"]
    },
    "explanation": "This comparative analysis can be performed using house price and population density datasets."
  }

OUT OF SCOPE Examples:
- "Show me weather patterns in London" → 
  {
    "is_data_driven_question": true,
    "inquiry_supported": false,
    "matched_dataset": [],
    "matched_columns": {},
    "explanation": "This is a data question but we don't have weather data in our datasets."
  }

- "I love living in London" → 
  {
    "is_data_driven_question": false,
    "inquiry_supported": false,
    "matched_dataset": [],
    "matched_columns": {},
    "explanation": "This is a subjective personal statement, not a data question."
  }

**Guidelines:**
- Reference specific column names when available
- Be helpful but clear about data limitations
- If partially in scope, guide toward available columns
- Consider synonyms and related concepts (e.g., "safety" relates to crime columns)
- Remember this is for housing decision-making in London`;

    const userPrompt = `Please validate this user exploration sentence:

"${requestBody.sentence}"

Determine if this question/exploration can be answered using the available London datasets and their specific columns.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: userPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    console.log('🤖 Raw OpenAI response:', responseContent);

    // Parse the JSON response
    let validationResult;
    try {
      validationResult = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('⚠️ Could not parse OpenAI response as JSON:', parseError);
      console.log('📄 Raw response content:', responseContent);
      
      // Fallback: assume in scope with low confidence
      validationResult = {
        is_in_scope: true,
        confidence: 0.3,
        relevant_categories: [],
        specific_columns: [],
        feedback: "Unable to fully validate domain scope. Proceeding with analysis.",
        suggested_rephrase: null
      };
    }

    console.log('✅ Domain validation result:', validationResult);

    return NextResponse.json({
      success: true,
      validation: validationResult,
      datasets_info: {
        total_categories: datasetsInfo.categories.length,
        category_names: datasetsInfo.categories.map((cat: DatasetCategory) => cat.name)
      }
    });

  } catch (error) {
    console.error('❌ Domain validation API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Domain validation failed', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
