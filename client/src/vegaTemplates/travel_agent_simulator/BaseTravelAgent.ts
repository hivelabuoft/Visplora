// Base Agent Class for Travel Chart Generation
import OpenAI from 'openai';
import { TravelAgentRequest, AgentResponse, TravelChartSpec, TravelDataSample } from './types';
import { TRAVEL_DESTINATIONS, REGIONS } from '../../app/travel/travelDataUtils';

export abstract class BaseTravelAgent {
  protected openai: OpenAI;
  public chartType: string;
  public availableSubtypes: string[];
  public sampleDatasets: TravelDataSample[];

  constructor(chartType: string, subtypes: string[]) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true
    });
    this.chartType = chartType;
    this.availableSubtypes = subtypes;
    this.sampleDatasets = [];
    this.initializeSampleData();
  }

  abstract initializeSampleData(): void;
  abstract generateChart(request: TravelAgentRequest): Promise<AgentResponse>;

  protected async callLLM(prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: `You are a specialized travel data visualization expert for ${this.chartType} charts. 
            Your role is to generate precise chart specifications using the SpecCreator system.
            
            CRITICAL RULES:
            1. NEVER change dimensions - always use the provided dimensions exactly
            2. ALWAYS use the exact field names from the generated data
            3. DO NOT modify chart type or core structure
            4. ONLY modify: colors, styling, titles, field mappings, data values
            5. Generate realistic travel data that makes sense for the context
            6. Return ONLY valid JSON - no explanatory text
            
            Available subtypes: ${this.availableSubtypes.join(', ')}
            Travel destinations: ${TRAVEL_DESTINATIONS.slice(0, 20).map(d => `${d.city}, ${d.country}`).join(', ')} (and more)
            Regions: ${REGIONS.slice(0, 10).join(', ')} (and more)`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to call OpenAI API');
    }
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 8): any[] {
    // This will be implemented differently in each agent subclass
    return [];
  }

  protected buildPrompt(request: TravelAgentRequest): string {
    const sampleDataInfo = this.sampleDatasets.map(ds => 
      `${ds.type}: ${ds.description}\nFields: ${JSON.stringify(ds.fields)}\nSample: ${JSON.stringify(ds.sampleData.slice(0, 2))}`
    ).join('\n\n');

    return `
Generate a ${this.chartType} chart specification for this travel request:
"${request.userQuery}"

CONSTRAINTS:
${request.constraints ? JSON.stringify(request.constraints, null, 2) : 'None specified'}

AVAILABLE SUBTYPES FOR ${this.chartType.toUpperCase()}:
${this.availableSubtypes.map(subtype => `- ${subtype}`).join('\n')}

SAMPLE DATASETS YOU CAN USE:
${sampleDataInfo}

REQUIREMENTS:
1. Choose the most appropriate subtype from the list above
2. Generate realistic travel data (8-12 data points)
3. Use appropriate field names that match your data
4. Include proper styling with travel-appropriate colors
5. Add meaningful title (NO chart type prefix like "LINE CHART -") and brief description (under 10 words)
6. CRITICAL: Use appropriate dimensions based on the nodeSize constraint provided in the request
   - Each agent should calculate dimensions based on the actual nodeSize requirement
   - DO NOT use hardcoded dimensions - calculate them dynamically

Return a JSON object with this structure:
{
  "type": "${this.chartType}",
  "subtype": "chosen_subtype",
  "data": [...generated_data...],
  "config": {
    "dimensions": {...calculate_based_on_nodeSize...},
    "fields": {...field_mappings...},
    "styling": {...styling_config...},
    "legend": {...legend_config...},
    "interactions": {"hover": true}
  },
  "title": "Clean chart title (no chart type prefix)",
  "description": "Brief description under 10 words",
  "insights": ["short insight 1", "short insight 2"]
}`;
  }

  protected cleanJSON(response: string): string {
    // Remove any markdown code blocks
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove JavaScript-style comments (both // and /* */)
    cleaned = cleaned.replace(/\/\/.*$/gm, ''); // Single line comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments
    
    // Remove trailing commas before closing brackets/braces
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix common quote issues
    cleaned = cleaned.replace(/'/g, '"'); // Convert single quotes to double quotes
    cleaned = cleaned.replace(/\\"/g, '"'); // Fix escaped quotes
    
    // Handle truncated JSON by attempting to complete common patterns
    if (!cleaned.trim().endsWith('}') && !cleaned.trim().endsWith(']')) {
      // Try to identify if it's an incomplete object or array
      const openBraces = (cleaned.match(/{/g) || []).length;
      const closeBraces = (cleaned.match(/}/g) || []).length;
      const openBrackets = (cleaned.match(/\[/g) || []).length;
      const closeBrackets = (cleaned.match(/\]/g) || []).length;
      
      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        cleaned += '}';
      }
      
      // Add missing closing brackets
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        cleaned += ']';
      }
    }
    
    // Remove any non-JSON content before the first { or [
    const jsonStart = Math.min(
      cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
      cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('[')
    );
    if (jsonStart !== Infinity && jsonStart > 0) {
      cleaned = cleaned.substring(jsonStart);
    }
    
    // Remove any content after the last complete JSON object/array
    let lastValidChar = -1;
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && bracketCount === 0) {
            lastValidChar = i;
          }
        } else if (char === '[') {
          bracketCount++;
        } else if (char === ']') {
          bracketCount--;
          if (braceCount === 0 && bracketCount === 0) {
            lastValidChar = i;
          }
        }
      }
    }
    
    if (lastValidChar > -1) {
      cleaned = cleaned.substring(0, lastValidChar + 1);
    }
    
    return cleaned.trim();
  }

  protected validateResponse(response: string): TravelChartSpec | null {
    try {
      // Clean the JSON first
      const cleanedResponse = this.cleanJSON(response);
      
      // Attempt to parse the cleaned JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('JSON parsing failed even after cleaning:', parseError);
        console.error('Cleaned response:', cleanedResponse.substring(0, 500) + '...');
        
        // Try one more aggressive fix for common line chart issues
        if (this.chartType === 'line') {
          const ultraCleaned = this.aggressiveLineChartFix(cleanedResponse);
          try {
            parsed = JSON.parse(ultraCleaned);
          } catch (secondError) {
            console.error('Ultra cleaning also failed:', secondError);
            return null;
          }
        } else {
          return null;
        }
      }
      
      // Validate required fields
      if (!parsed.type || !parsed.subtype || !parsed.data || !parsed.config) {
        console.error('Missing required fields in parsed response:', {
          hasType: !!parsed.type,
          hasSubtype: !!parsed.subtype,
          hasData: !!parsed.data,
          hasConfig: !!parsed.config
        });
        return null;
      }

      // Validate chart type matches agent type
      if (parsed.type !== this.chartType) {
        console.error(`Chart type mismatch: expected ${this.chartType}, got ${parsed.type}`);
        return null;
      }

      // Validate subtype is available
      if (!this.availableSubtypes.includes(parsed.subtype)) {
        console.error(`Invalid subtype: ${parsed.subtype}. Available: ${this.availableSubtypes.join(', ')}`);
        return null;
      }

      return parsed as TravelChartSpec;
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Original response length:', response.length);
      console.error('Response preview:', response.substring(0, 200) + '...');
      return null;
    }
  }

  protected aggressiveLineChartFix(json: string): string {
    // Specific fixes for line chart JSON issues
    let fixed = json;
    
    // Fix color array comments that commonly break line charts
    fixed = fixed.replace(/"color":\s*\[\s*([^,\]]+),\s*\/\/[^\n]*\n/g, '"color": [$1,');
    fixed = fixed.replace(/("#[A-Fa-f0-9]{6}"),\s*\/\/[^\n]*\n/g, '$1,');
    
    // Fix data array issues with comments
    fixed = fixed.replace(/("country":\s*"[^"]+"),\s*\/\/[^\n]*\n/g, '$1,');
    fixed = fixed.replace(/("year":\s*\d+),\s*\/\/[^\n]*\n/g, '$1,');
    fixed = fixed.replace(/("visitors":\s*\d+),\s*\/\/[^\n]*\n/g, '$1,');
    
    // Remove any remaining comments that might be embedded in arrays
    fixed = fixed.replace(/,\s*\/\/[^\n]*\n\s*/g, ', ');
    
    // Fix any property names with comments
    fixed = fixed.replace(/"([^"]+)":\s*\/\/[^\n]*\n\s*/g, '"$1": ');
    
    return fixed;
  }

}