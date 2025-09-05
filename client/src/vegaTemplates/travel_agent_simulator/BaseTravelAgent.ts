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

  protected validateResponse(response: string): TravelChartSpec | null {
    try {
      const parsed = JSON.parse(response);
      
      // Validate required fields
      if (!parsed.type || !parsed.subtype || !parsed.data || !parsed.config) {
        return null;
      }

      // Validate chart type matches agent type
      if (parsed.type !== this.chartType) {
        return null;
      }

      // Validate subtype is available
      if (!this.availableSubtypes.includes(parsed.subtype)) {
        return null;
      }

      return parsed as TravelChartSpec;
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      return null;
    }
  }

  protected getDefaultDimensions(): { width: number; height: number } {
    return { width: 400, height: 200 };
  }

  protected getCorrectDimensions(): string {
    // Return dimensions as JSON string based on chart type
    switch (this.chartType) {
      case 'line':
      case 'scatter':
        return '{"width": 390, "height": 160}'; // xlarge nodes
      case 'bar':
        return '{"width": 340, "height": 160}'; // large nodes  
      case 'pie':
        return '{"width": 120, "height": 120}'; // medium nodes
      case 'multiType':
        return '{"width": 350, "height": 180}'; // Most multiType subtypes use this
      default:
        return '{"width": 400, "height": 200}'; // fallback
    }
  }
}