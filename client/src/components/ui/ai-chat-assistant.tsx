'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiX, FiSend, FiCpu, FiDatabase, FiEye, FiEyeOff, FiZap, FiRefreshCw, FiExternalLink, FiInfo, FiFilter, FiBarChart } from 'react-icons/fi';
import { VegaLite } from 'react-vega';
import { ConnectionNodes } from './connection-nodes';
import { generateDashboardElementsContext, findElementsForQuestion, generateQuestionGuidance } from '../../app/dashboard2/dashboardElementsRegistry';

export interface AIAssistantData {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: number;
  connectedElements: Array<{
    id: string;
    type: 'element' | 'note';
    data: any;
  }>;
  chatHistory: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    vegaSpec?: any;
    responseMode?: 'general' | 'guidance' | 'filter' | 'chart';
    filterCommands?: {
      department?: string;
      jobRole?: string;
      gender?: string;
      showOnlyAttrition?: boolean;
    };
    pendingFilters?: {
      department?: string;
      jobRole?: string;
      gender?: string;
      showOnlyAttrition?: boolean;
    };
    filtersApplied?: boolean;
  }>;
  showContext: boolean;
}

interface AIAssistantProps {
  assistant: AIAssistantData;
  cellSize: number;
  onUpdate: (assistantId: string, updates: Partial<AIAssistantData>) => void;
  onDelete: (assistantId: string) => void;
  onSelect?: (assistantId: string | null) => void;
  isResizing?: boolean;
  onResizeStart?: (assistantId: string) => void;
  onResizeEnd?: () => void;
  onMoveStart?: (assistantId: string) => void;
  onMoveEnd?: () => void;
  getOccupiedCells?: () => Set<string>;
  zoomLevel?: number;
  onConnectionDragStart?: (
    elementId: string, 
    type: 'element' | 'note' | 'ai-assistant', 
    position: 'top' | 'right' | 'bottom' | 'left',
    x: number,
    y: number
  ) => void;
  onConnectionDrop?: (targetId: string, targetType: 'element' | 'note' | 'ai-assistant', targetPosition: 'top' | 'right' | 'bottom' | 'left') => boolean;
  onConnectionDragEnd?: () => void;
  isDragging?: boolean;
  isDragTarget?: boolean;
  hrData?: any[];
  droppedElements?: any[];
  stickyNotes?: any[];
  onApplyFilters?: (filters: {
    department?: string;
    jobRole?: string;
    gender?: string;
    showOnlyAttrition?: boolean;
  }) => void;
  onCreateElement?: (elementData: {
    elementName: string;
    elementType: string;
    vegaSpec: any;
    description: string;
  }) => void;
}

// Helper functions for response modes
const getResponseModeIcon = (mode?: string) => {
  switch (mode) {
    case 'guidance': return <FiInfo size={12} className="text-green-400" />;
    case 'filter': return <FiFilter size={12} className="text-yellow-400" />;
    case 'chart': return <FiBarChart size={12} className="text-blue-400" />;
    default: return <FiCpu size={12} className="text-slate-400" />;
  }
};

const getResponseModeLabel = (mode?: string) => {
  switch (mode) {
    case 'guidance': return 'Dashboard Guidance';
    case 'filter': return 'Filter Assistance';
    case 'chart': return 'New Visualization';
    default: return 'AI Response';
  }
};

const getMessageBackgroundClass = (mode?: string) => {
  switch (mode) {
    case 'guidance': return 'bg-green-700 text-green-100 border border-green-600';
    case 'filter': return 'bg-yellow-700 text-yellow-100 border border-yellow-600';
    case 'chart': return 'bg-blue-700 text-blue-100 border border-blue-600';
    default: return 'bg-slate-700 text-slate-100';
  }
};

// Helper functions for analyzing chart specifications
const extractDataFields = (vegaSpec: any): string[] => {
  if (!vegaSpec?.encoding) return [];
  
  const fields: string[] = [];
  Object.values(vegaSpec.encoding).forEach((enc: any) => {
    if (enc?.field && typeof enc.field === 'string') {
      fields.push(enc.field);
    }
  });
  
  return [...new Set(fields)]; // Remove duplicates
};

const getChartDescription = (vegaSpec: any): string => {
  if (!vegaSpec) return 'No chart specification available';
  
  const mark = typeof vegaSpec.mark === 'string' ? vegaSpec.mark : vegaSpec.mark?.type;
  const fields = extractDataFields(vegaSpec);
  
  let chartType = 'chart';
  switch (mark) {
    case 'bar': chartType = 'bar chart'; break;
    case 'line': chartType = 'line chart'; break;
    case 'point': case 'circle': chartType = 'scatter plot'; break;
    case 'arc': chartType = 'pie chart'; break;
    case 'rect': chartType = 'heatmap'; break;
    case 'area': chartType = 'area chart'; break;
    default: chartType = mark || 'chart';
  }
  
  return `${chartType} showing ${fields.join(', ')}`;
};

const getChartInsights = (vegaSpec: any): string => {
  if (!vegaSpec?.encoding) return '';
  
  const fields = extractDataFields(vegaSpec);
  const mark = typeof vegaSpec.mark === 'string' ? vegaSpec.mark : vegaSpec.mark?.type;
  
  // Generate insights based on chart type and fields
  switch (mark) {
    case 'bar':
      return `Shows distribution/comparison of ${fields.join(' by ')}`;
    case 'pie':
    case 'arc':
      return `Shows proportional breakdown of ${fields.join(', ')}`;
    case 'line':
      return `Shows trends over time for ${fields.join(', ')}`;
    case 'point':
    case 'circle':
      return `Shows relationship between ${fields.join(' and ')}`;
    default:
      return `Visualizes ${fields.join(', ')}`;
  }
};

const AIAssistant: React.FC<AIAssistantProps> = ({
  assistant,
  cellSize,
  onUpdate,
  onDelete,
  onSelect,
  isResizing,
  onResizeStart,
  onResizeEnd,
  onMoveStart,
  onMoveEnd,
  getOccupiedCells,
  zoomLevel = 100,
  onConnectionDragStart,
  onConnectionDrop,
  onConnectionDragEnd,
  isDragging = false,
  isDragTarget = false,
  hrData = [],
  droppedElements = [],
  stickyNotes = [],
  onApplyFilters,
  onCreateElement
}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [resizeMode, setResizeMode] = useState<'none' | 'corner' | 'right' | 'bottom'>('none');
  const [moveStartPos, setMoveStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [tempPosition, setTempPosition] = useState({ x: assistant.x, y: assistant.y });
  const [tempSize, setTempSize] = useState({ width: assistant.width, height: assistant.height });
  const [isHovered, setIsHovered] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<{
    department?: string;
    jobRole?: string;
    gender?: string;
    showOnlyAttrition?: boolean;
  } | null>(null);

  const assistantRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [assistant.chatHistory]);

  // Use fixed pixel dimensions
  const actualWidth = tempSize.width;
  const actualHeight = tempSize.height;

  // Generate context from connected elements
  const generateContext = useCallback(() => {
    const context = {
      connectedElements: assistant.connectedElements.length,
      hrDataSample: hrData,
      availableColumns: hrData.length > 0 ? Object.keys(hrData[0]) : [],
      totalRecords: hrData.length,
      columnTypes: hrData.length > 0 ? getColumnTypes(hrData[0]) : {},
      
      // All dashboard elements (for AI to know what's already available)
      allDashboardElements: droppedElements.map(element => ({
        type: 'visualization',
        id: element.id,
        name: element.elementName || 'Unknown',
        elementType: element.elementType || 'chart',
        description: element.vegaSpec ? getChartDescription(element.vegaSpec) : 'No description available',
        dataFields: element.vegaSpec ? extractDataFields(element.vegaSpec) : [],
        insights: element.vegaSpec ? getChartInsights(element.vegaSpec) : '',
        isConnected: assistant.connectedElements.some(connEl => connEl.id === element.id && connEl.type === 'element')
      })),
      
      // All sticky notes on dashboard
      allDashboardNotes: stickyNotes.map(note => ({
        type: 'note',
        id: note.id,
        content: note.content || 'No content',
        created: note.createdAt ? new Date(note.createdAt).toLocaleString() : 'Unknown',
        isConnected: assistant.connectedElements.some(connEl => connEl.id === note.id && connEl.type === 'note')
      })),
      
      // Connected data (for backwards compatibility)
      connectedData: assistant.connectedElements.map(element => {
        if (element.type === 'element') {
          const droppedElement = droppedElements.find(el => el.id === element.id);
          if (droppedElement) {
            return {
              type: 'visualization',
              name: droppedElement.elementName || 'Unknown',
              elementType: droppedElement.elementType || 'chart',
              description: droppedElement.vegaSpec ? getChartDescription(droppedElement.vegaSpec) : 'No description available',
              dataFields: droppedElement.vegaSpec ? extractDataFields(droppedElement.vegaSpec) : []
            };
          }
          return {
            type: 'visualization',
            name: 'Unknown Element',
            elementType: 'chart',
            description: 'Element data not available',
            dataFields: []
          };
        } else {
          const note = stickyNotes.find(note => note.id === element.id);
          return {
            type: 'note',
            content: note?.content || 'No content',
            created: note?.createdAt ? new Date(note.createdAt).toLocaleString() : 'Unknown'
          };
        }
      }),
      // Add information about what data insights are already available
      availableInsights: assistant.connectedElements
        .filter(el => el.type === 'element')
        .map(el => {
          const droppedElement = droppedElements.find(del => del.id === el.id);
          if (droppedElement?.vegaSpec) {
            return getChartInsights(droppedElement.vegaSpec);
          }
          return null;
        })
        .filter(Boolean)
    };
    return context;
  }, [assistant.connectedElements, hrData, droppedElements, stickyNotes]);

  // Helper function to determine column types
  const getColumnTypes = (sampleRow: any) => {
    const types: { [key: string]: string } = {};
    Object.keys(sampleRow).forEach(key => {
      const value = sampleRow[key];
      if (!isNaN(Number(value)) && value !== '') {
        types[key] = 'quantitative';
      } else {
        types[key] = 'nominal';
      }
    });
    return types;
  };

  // Generate AI-powered suggested prompts based on dataset fields and context
  const generateSuggestedPrompts = useCallback(async () => {
    if (!hrData.length) return [];

    setIsGeneratingSuggestions(true);
    
    try {
      const context = generateContext();
      
      // Create different prompts based on whether there are connected elements
      let suggestionPrompt;
      
      if (context.allDashboardElements.length > 0) {
        // When there are dashboard elements, focus on analysis and guidance
        suggestionPrompt = `Based on the following HR dashboard context, generate 8 diverse analysis prompts that help users understand their data better:

Dashboard Context:
- Total Records: ${context.totalRecords}
- Available Columns: ${context.availableColumns.join(', ')}
- ALL Dashboard Elements (${context.allDashboardElements.length}):
${context.allDashboardElements.map((el: any) => 
  `  * ${el.name} (${el.elementType}): ${el.description} | Insights: ${el.insights}`
).join('\n')}
- Connected Elements to me: ${context.connectedElements}
- Available Dashboard Notes: ${context.allDashboardNotes.length}

Generate prompts that:
1. Ask questions about existing dashboard elements (60% of prompts) - reference specific element names
2. Request filtering or deeper analysis of current data (30% of prompts)  
3. Suggest complementary visualizations not yet shown (10% of prompts)

Focus on business insights like attrition analysis, performance metrics, demographic patterns, and salary analysis.
Make prompts specific to the existing dashboard elements by referencing their names and insights.
Return ONLY the prompts, one per line, without numbering.`;
      } else {
        // When no dashboard elements, focus on initial exploration
        suggestionPrompt = `Based on the following HR dataset, generate 8 diverse and insightful data visualization prompts:

Dataset Information:
- Total Records: ${context.totalRecords}
- Available Columns: ${context.availableColumns.join(', ')}
- Column Types: ${Object.entries(context.columnTypes).map(([col, type]) => `${col} (${type})`).join(', ')}
- Dashboard Elements: None yet

Generate prompts that:
1. Explore different aspects of the HR data
2. Use various chart types (bar, pie, scatter, histogram, etc.)
3. Focus on business insights like attrition, salary, performance, demographics
4. Include both simple and advanced analysis requests
5. Are specific to the available columns

Return ONLY the prompts, one per line, without numbering.`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: suggestionPrompt,
          systemPrompt: 'You are a data visualization expert. Generate clear, actionable prompts for exploring HR data.',
          context: {
            ...context,
            panelWidth: actualWidth
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const prompts = data.content
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0 && !line.match(/^\d+\./)) // Remove empty lines and numbered items
          .slice(0, 8); // Ensure we only get 8 prompts
        
        return prompts;
      } else {
        // Fallback to static prompts if AI fails
        return getFallbackPrompts(context);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      // Fallback to static prompts if AI fails
      const context = generateContext();
      return getFallbackPrompts(context);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [hrData, generateContext, actualWidth]);

  // Fallback static prompts in case AI generation fails
  const getFallbackPrompts = (context: any) => {
    const quantitativeFields = Object.entries(context.columnTypes)
      .filter(([_, type]) => type === 'quantitative')
      .map(([field, _]) => field);
    const nominalFields = Object.entries(context.columnTypes)
      .filter(([_, type]) => type === 'nominal')
      .map(([field, _]) => field);

    // Generate different prompts based on whether there are dashboard elements
    if (context.allDashboardElements.length > 0) {
      // Focus on analysis and guidance when dashboard elements exist
      const elementNames = context.allDashboardElements.map((el: any) => el.name);
      return [
        'What insights can I get from the existing dashboard elements?',
        `How do I interpret the ${elementNames[0] || 'charts'} on the dashboard?`,
        'Can you filter the current data to show only high-performing employees?',
        'What patterns should I look for in the dashboard visualizations?',
        `Explain what the ${elementNames[1] || 'dashboard elements'} are showing me`,
        'How do the dashboard elements relate to employee retention?',
        'What filtering options can help me understand attrition better?',
        'Guide me through analyzing the dashboard step by step'
      ];
    } else {
      // Focus on initial exploration when no elements exist
      return [
        `Show me the distribution of ${quantitativeFields[0] || 'Age'}`,
        `Create a pie chart of ${nominalFields[0] || 'Department'}`,
        `Show the relationship between ${quantitativeFields[0] || 'Age'} and ${quantitativeFields[1] || 'MonthlyIncome'}`,
        'Show attrition rates by department',
        `Create a histogram of ${quantitativeFields[1] || 'MonthlyIncome'}`,
        `Compare ${quantitativeFields[2] || 'YearsAtCompany'} across different ${nominalFields[0] || 'Department'}`,
        'Create a chart showing factors affecting employee attrition',
        'Show trends in job satisfaction over years at company'
      ];
    }
  };

  // Handle suggested prompt selection
  const handleSuggestionClick = (suggestion: string) => {
    setUserInput(suggestion);
    setShowSuggestions(false);
  };

  // Toggle suggestions panel
  const toggleSuggestions = async () => {
    if (!showSuggestions) {
      setShowSuggestions(true);
      // Only generate prompts if we don't have any existing ones
      if (suggestedPrompts.length === 0) {
        const prompts = await generateSuggestedPrompts();
        setSuggestedPrompts(prompts);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Regenerate suggestions
  const regenerateSuggestions = async () => {
    const prompts = await generateSuggestedPrompts();
    setSuggestedPrompts(prompts);
  };

  // Convert AI response to movable element
  const convertToElement = useCallback((message: any) => {
    if (!message.vegaSpec || !onCreateElement) return;

    // Extract chart title from content or generate one
    let chartTitle = 'AI Generated Chart';
    const contentLines = message.content.split('\n');
    for (const line of contentLines) {
      if (line.includes('title') || line.includes('Title') || line.includes('chart') || line.includes('Chart')) {
        chartTitle = line.replace(/[#*\-\s]+/g, ' ').trim();
        if (chartTitle.length > 50) {
          chartTitle = chartTitle.substring(0, 50) + '...';
        }
        break;
      }
    }

    // If no title found in content, try to extract from vega spec
    if (chartTitle === 'AI Generated Chart' && message.vegaSpec.title) {
      chartTitle = typeof message.vegaSpec.title === 'string' 
        ? message.vegaSpec.title 
        : message.vegaSpec.title.text || 'AI Generated Chart';
    }

    // Determine chart type from vega spec
    let chartType = 'Chart';
    if (message.vegaSpec.mark) {
      const mark = typeof message.vegaSpec.mark === 'string' 
        ? message.vegaSpec.mark 
        : message.vegaSpec.mark.type;
      
      switch (mark) {
        case 'bar':
          chartType = 'Bar Chart';
          break;
        case 'line':
          chartType = 'Line Chart';
          break;
        case 'point':
        case 'circle':
          chartType = 'Scatter Plot';
          break;
        case 'arc':
          chartType = 'Pie Chart';
          break;
        case 'rect':
          chartType = 'Heatmap';
          break;
        case 'area':
          chartType = 'Area Chart';
          break;
        default:
          chartType = 'Chart';
      }
    }

    const elementData = {
      elementName: chartTitle,
      elementType: `AI ${chartType}`,
      vegaSpec: message.vegaSpec,
      description: message.content.substring(0, 200) + (message.content.length > 200 ? '...' : '')
    };

    onCreateElement(elementData);
  }, [onCreateElement]);

  // Apply filter commands from AI
  const applyFilterCommands = useCallback((filterCommands: any) => {
    if (onApplyFilters && filterCommands) {
      onApplyFilters(filterCommands);
    }
  }, [onApplyFilters]);

  // Handle filter permission - store filters as pending instead of applying immediately
  const handlePendingFilters = useCallback((filterCommands: any) => {
    if (filterCommands) {
      setPendingFilters(filterCommands);
    }
  }, []);

  // Apply pending filters when user gives permission
  const applyPendingFilters = useCallback(() => {
    if (pendingFilters && onApplyFilters) {
      onApplyFilters(pendingFilters);
      setPendingFilters(null);
      
      // Update the last message to mark filters as applied
      const updatedHistory = assistant.chatHistory.map((message, index) => {
        if (index === assistant.chatHistory.length - 1 && message.role === 'assistant' && message.filterCommands) {
          return { ...message, filtersApplied: true };
        }
        return message;
      });
      onUpdate(assistant.id, { chatHistory: updatedHistory });
    }
  }, [pendingFilters, onApplyFilters, assistant.chatHistory, assistant.id, onUpdate]);

  // Decline pending filters
  const declinePendingFilters = useCallback(() => {
    setPendingFilters(null);
  }, []);

  // Handle OpenAI API call
  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const message = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: Date.now()
    };

    const updatedHistory = [...assistant.chatHistory, userMessage];
    onUpdate(assistant.id, { chatHistory: updatedHistory });

    try {
      const context = generateContext();
      
      // Add current panel width to context for truly responsive chart sizing
      const contextWithPanelWidth = {
        ...context,
        panelWidth: actualWidth, // Use current actual width of the panel
        hrData: hrData, // Ensure hrData is available for chart generation (both names for compatibility)
        hrDataSample: context.hrDataSample // Keep original name too
      };
      
      // Prepare system prompt with context
      const systemPrompt = `You are an AI assistant helping with data visualization using Vega-Lite. 

${generateDashboardElementsContext()}

CURRENT DASHBOARD STATE:
Available dataset: HR Employee data with ${context.totalRecords} records
Available columns: ${context.availableColumns.join(', ')}
Current panel width: ${actualWidth}px

ALL DASHBOARD ELEMENTS (${context.allDashboardElements.length} total):
${context.allDashboardElements.map((el: any) => 
  `- ${el.name} (${el.elementType}): ${el.description} | Fields: ${el.dataFields.join(', ')} | Insights: ${el.insights}${el.isConnected ? ' [CONNECTED TO ME]' : ''}`
).join('\n')}

ALL DASHBOARD NOTES (${context.allDashboardNotes.length} total):
${context.allDashboardNotes.map((note: any) => 
  `- Note: "${note.content.substring(0, 100)}..."${note.isConnected ? ' [CONNECTED TO ME]' : ''}`
).join('\n')}

CONNECTED ELEMENTS TO THIS AI ASSISTANT (${context.connectedData.length}):
${context.connectedData.map((el: any) => 
  el.type === 'visualization' ? 
    `- ${el.name} (${el.elementType}): ${el.description} | Fields: ${el.dataFields.join(', ')}` : 
    `- Note: "${el.content.substring(0, 100)}..."`
).join('\n')}

CRITICAL INSTRUCTIONS:
1. ALWAYS check the AVAILABLE DASHBOARD ELEMENTS section first to see what's already on the dashboard
2. If existing elements can answer the user's question, provide GUIDANCE to examine those specific elements
3. If existing elements need filtering to answer the question, provide FILTER_GUIDANCE with specific filter commands
4. ONLY create new visualizations if no existing element can answer the question

Sample data structure:
${JSON.stringify(context.hrDataSample.slice(0, 3), null, 2)}`;

      // Call OpenAI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          systemPrompt,
          context: contextWithPanelWidth
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API response error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received data from API:', data);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.content,
        timestamp: Date.now(),
        vegaSpec: data.vegaSpec,
        responseMode: data.responseMode || 'general',
        filterCommands: data.filterCommands,
        pendingFilters: data.filterCommands,
        filtersApplied: false
      };

      console.log('Assistant message with vegaSpec:', assistantMessage.vegaSpec);
      console.log('Filter commands:', assistantMessage.filterCommands);

      // Store filters as pending instead of applying them immediately
      if (data.filterCommands) {
        handlePendingFilters(data.filterCommands);
      }

      const finalHistory = [...updatedHistory, assistantMessage];
      onUpdate(assistant.id, { chatHistory: finalHistory });

    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      
      const finalHistory = [...updatedHistory, errorMessage];
      onUpdate(assistant.id, { chatHistory: finalHistory });
    } finally {
      setIsLoading(false);
    }
  };

  // Movement handlers
  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsMoving(true);
    
    // Get canvas container for proper coordinate calculation
    const canvasContainer = document.querySelector('[data-dashboard-container]')?.parentElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();
    
    if (canvasRect) {
      // Calculate offset considering zoom level
      const scale = zoomLevel / 100;
      const offsetX = (e.clientX - canvasRect.left) / scale - assistant.x;
      const offsetY = (e.clientY - canvasRect.top) / scale - assistant.y;
      
      setMoveStartPos({ x: offsetX, y: offsetY });
    } else {
      setMoveStartPos({
        x: e.clientX - assistant.x,
        y: e.clientY - assistant.y
      });
    }
    
    setTempPosition({ x: assistant.x, y: assistant.y });
    
    if (onMoveStart) {
      onMoveStart(assistant.id);
    }
  }, [assistant.x, assistant.y, onMoveStart, zoomLevel]);

  const handleMoveMove = useCallback((e: MouseEvent) => {
    if (!isMoving) return;
    
    // Get canvas container for proper coordinate calculation
    const canvasContainer = document.querySelector('[data-dashboard-container]')?.parentElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();
    
    if (canvasRect) {
      // Calculate position considering zoom level
      const scale = zoomLevel / 100;
      const newX = (e.clientX - canvasRect.left) / scale - moveStartPos.x;
      const newY = (e.clientY - canvasRect.top) / scale - moveStartPos.y;
      
      // Snap to grid
      const col = Math.floor(newX / cellSize);
      const row = Math.floor(newY / cellSize);
      const gridX = col * cellSize;
      const gridY = row * cellSize;
      
      setTempPosition({ x: gridX, y: gridY });
    }
  }, [isMoving, moveStartPos, cellSize, zoomLevel]);

  const handleMoveEnd = useCallback((e: MouseEvent) => {
    if (!isMoving) return;
    
    // Get canvas container for proper coordinate calculation
    const canvasContainer = document.querySelector('[data-dashboard-container]')?.parentElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();
    
    if (canvasRect) {
      // Calculate final position considering zoom level
      const scale = zoomLevel / 100;
      const newX = (e.clientX - canvasRect.left) / scale - moveStartPos.x;
      const newY = (e.clientY - canvasRect.top) / scale - moveStartPos.y;
      
      // Snap to grid
      const col = Math.floor(newX / cellSize);
      const row = Math.floor(newY / cellSize);
      const gridX = col * cellSize;
      const gridY = row * cellSize;
      
      setIsMoving(false);
      
      onUpdate(assistant.id, {
        x: gridX,
        y: gridY,
        row: row,
        col: col
      });
      
      setTempPosition({ x: gridX, y: gridY });
      
      if (onMoveEnd) {
        onMoveEnd();
      }
    }
  }, [isMoving, moveStartPos, cellSize, onUpdate, assistant.id, onMoveEnd, zoomLevel]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, mode: 'corner' | 'right' | 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    
    setResizeMode(mode);
    setMoveStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: assistant.width, height: assistant.height });
    setTempSize({ width: assistant.width, height: assistant.height });
    
    if (onResizeStart) {
      onResizeStart(assistant.id);
    }
  }, [assistant.width, assistant.height, onResizeStart]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (resizeMode === 'none') return;
    
    const deltaX = e.clientX - moveStartPos.x;
    const deltaY = e.clientY - moveStartPos.y;
    const scale = zoomLevel / 100;
    
    const scaledDeltaX = deltaX / scale;
    const scaledDeltaY = deltaY / scale;
    
    let newWidth = startSize.width;
    let newHeight = startSize.height;
    
    if (resizeMode === 'corner' || resizeMode === 'right') {
      newWidth = Math.max(400, startSize.width + scaledDeltaX); // Minimum 400px width
    }
    
    if (resizeMode === 'corner' || resizeMode === 'bottom') {
      newHeight = Math.max(300, startSize.height + scaledDeltaY); // Minimum 300px height
    }
    
    setTempSize({ width: newWidth, height: newHeight });
  }, [resizeMode, moveStartPos, startSize, zoomLevel]);

  const handleResizeEnd = useCallback(() => {
    if (resizeMode === 'none') return;
    
    setResizeMode('none');
    
    onUpdate(assistant.id, {
      width: tempSize.width,
      height: tempSize.height
    });
    
    if (onResizeEnd) {
      onResizeEnd();
    }
  }, [resizeMode, tempSize, onUpdate, assistant.id, onResizeEnd]);

  // Mouse event listeners
  useEffect(() => {
    if (isMoving) {
      document.addEventListener('mousemove', handleMoveMove);
      document.addEventListener('mouseup', handleMoveEnd);
      return () => {
        document.removeEventListener('mousemove', handleMoveMove);
        document.removeEventListener('mouseup', handleMoveEnd);
      };
    }
  }, [isMoving, handleMoveMove, handleMoveEnd]);

  useEffect(() => {
    if (resizeMode !== 'none') {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizeMode, handleResize, handleResizeEnd]);

  // Get AI assistant styles
  const getAssistantStyle = () => {
    const currentPosition = isMoving ? tempPosition : { x: assistant.x, y: assistant.y };
    
    return {
      position: 'absolute' as const,
      left: `${currentPosition.x}px`,
      top: `${currentPosition.y}px`,
      width: `${actualWidth}px`,
      height: `${actualHeight}px`,
      backgroundColor: '#1e293b',
      border: isDragTarget ? '3px solid #3b82f6' : '2px solid #475569',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      cursor: isMoving ? 'move' : 'default',
      zIndex: isMoving ? 1000 : 999,
      overflow: 'hidden',
      transition: isDragging || isMoving ? 'none' : 'all 0.2s ease',
      transform: isDragTarget ? 'scale(1.02)' : 'scale(1)',
    };
  };

  return (
    <div
      ref={assistantRef}
      style={getAssistantStyle()}
      data-ai-assistant={assistant.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect(assistant.id);
      }}
    >
      {/* Connection Nodes */}
      <ConnectionNodes
        elementId={assistant.id}
        onDragStart={onConnectionDragStart}
        onDrop={onConnectionDrop}
        onDragEnd={onConnectionDragEnd}
        isDragging={isDragging}
        isVisible={isHovered || isDragTarget}
        isAIAssistant={true}
        isDragTarget={isDragTarget}
        className="ai-assistant-connections"
      />

      {/* Header */}
      <div 
        className="bg-slate-700 hover:bg-gray-700 px-3 py-2 border-b border-slate-600 flex items-center justify-between"
        onMouseDown={handleMoveStart}
      >
        <div className="flex items-center space-x-2">
          <FiCpu className="text-blue-400" size={16} />
          <span className="text-white font-medium text-sm">AI Assistant</span>
          {assistant.connectedElements.length > 0 && (
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {assistant.connectedElements.length} connected
            </div>
          )}
        </div>
        
        <span className="text-slate-400 text-xs pr-12">Drag to move</span>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(assistant.id, { showContext: !assistant.showContext });
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            {assistant.showContext ? <FiEye size={16} /> : <FiEyeOff size={16} />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(assistant.id);
            }}
            className="text-slate-400 hover:text-red-400 p-1"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
      
      {/* Content Area - positioned below header */}
      <div className='absolute left-0 right-0' style={{ top: '40px', bottom: '0px' }}>
        {/* Context Panel */}
        {assistant.showContext && (
          <div 
            className="absolute top-0 left-0 right-0 bg-slate-800 border-b border-slate-600 p-3 overflow-y-auto" 
            style={{
              height: '80px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <style jsx>{`
              .scrollbar-none::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="text-xs text-slate-300">
              <div className="flex items-center space-x-2 mb-1">
                <FiDatabase size={12} />
                <span className="font-medium">Connected Context:</span>
              </div>
              <div className="space-y-1">
                <div>HR Dataset: {hrData.length} records</div>
                <div>Connected Elements: {assistant.connectedElements.length}</div>
                {assistant.connectedElements.map((element, index) => (
                  <div key={index} className="text-blue-300">
                    • {element.type === 'element' ? 'Chart' : 'Note'}: {element.id.slice(0, 8)}...
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div 
          ref={chatContainerRef}
          className="absolute left-0 right-0 overflow-y-auto px-3 pt-3 pb-2 space-y-2"
          style={{
            top: assistant.showContext ? '80px' : '0px',
            bottom: showSuggestions ? '220px' : '70px', // Adjust for dynamic input area height
          }}
        >
          {/* Pending Filters Notification */}
          {pendingFilters && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <FiFilter className="text-yellow-600" size={14} />
                <span className="text-yellow-800 font-medium text-xs">AI suggests applying filters</span>
              </div>
              <div className="text-yellow-700 text-xs space-y-1 mb-3">
                {pendingFilters.department && <div>• Department: {pendingFilters.department}</div>}
                {pendingFilters.jobRole && <div>• Job Role: {pendingFilters.jobRole}</div>}
                {pendingFilters.gender && <div>• Gender: {pendingFilters.gender}</div>}
                {pendingFilters.showOnlyAttrition !== undefined && (
                  <div>• Show Only Attrition: {pendingFilters.showOnlyAttrition ? 'Yes' : 'No'}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyPendingFilters}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                >
                  <FiFilter size={10} />
                  Apply Filters
                </button>
                <button
                  onClick={declinePendingFilters}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                >
                  <FiX size={10} />
                  Decline
                </button>
              </div>
            </div>
          )}

          {assistant.chatHistory.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-6">
              <FiCpu size={24} className="mx-auto mb-2" />
              <div className="font-medium mb-1">Hi! I'm your AI visualization assistant.</div>
              <div className="text-xs mt-1 space-y-1">
                <div>Ask me to create anything!</div>
                <div className="text-slate-500">Try: "Show me attrition by department" or "Create a salary distribution chart"</div>
              </div>
            </div>
          )}
          
          {assistant.chatHistory.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-2 rounded-lg text-sm break-words ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : getMessageBackgroundClass(message.responseMode)
              }`} style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
                {/* Response Mode Indicator */}
                {message.role === 'assistant' && message.responseMode && (
                  <div className="flex items-center gap-1 mb-2 text-xs opacity-75">
                    {getResponseModeIcon(message.responseMode)}
                    <span className="font-medium">{getResponseModeLabel(message.responseMode)}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Filter Commands Display */}
                {message.filterCommands && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-400 text-xs">
                    <div className="flex items-center gap-1 mb-1 text-blue-700 font-medium">
                      <FiFilter size={12} />
                      {message.filtersApplied ? 'Applied Filters:' : 'Suggested Filters:'}
                    </div>
                    <div className="space-y-1 text-blue-600">
                      {message.filterCommands.department && (
                        <div>• Department: {message.filterCommands.department}</div>
                      )}
                      {message.filterCommands.jobRole && (
                        <div>• Job Role: {message.filterCommands.jobRole}</div>
                      )}
                      {message.filterCommands.gender && (
                        <div>• Gender: {message.filterCommands.gender}</div>
                      )}
                      {message.filterCommands.showOnlyAttrition !== undefined && (
                        <div>• Show Only Attrition: {message.filterCommands.showOnlyAttrition ? 'Yes' : 'No'}</div>
                      )}
                    </div>
                    
                    {/* Filter Permission Buttons - only show if filters haven't been applied yet */}
                    {!message.filtersApplied && pendingFilters && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={applyPendingFilters}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                          title="Apply these filters to the dashboard"
                        >
                          <FiFilter size={10} />
                          Apply Filters
                        </button>
                        <button
                          onClick={declinePendingFilters}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                          title="Decline these filter suggestions"
                        >
                          <FiX size={10} />
                          Decline
                        </button>
                      </div>
                    )}
                    
                    {/* Show status if filters were applied */}
                    {message.filtersApplied && (
                      <div className="mt-2 text-green-700 text-xs font-medium">
                        ✓ Filters have been applied to the dashboard
                      </div>
                    )}
                  </div>
                )}
                {message.vegaSpec && (
                  <div className="mt-2">
                    <div className="bg-white rounded p-2 overflow-hidden" style={{ maxWidth: '100%' }}>
                      <VegaLite spec={message.vegaSpec} />
                    </div>
                    {/* Convert to Element Button */}
                    {onCreateElement && (
                      <div className="mt-1">
                        <button
                          onClick={() => convertToElement(message)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          title="Convert this chart to a movable element"
                        >
                          <FiExternalLink size={12} />
                          Convert to Element
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-slate-100 p-2 rounded-lg text-sm">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div 
          className="absolute bottom-0 left-0 right-0 border-t border-slate-600 bg-slate-800"
          style={{ height: showSuggestions ? '222px' : '62px' }}
          onMouseDown={(e) => {
            // Prevent the move handler from interfering with input interaction
            e.stopPropagation();
          }}
          onClick={(e) => {
            // Prevent the move handler from interfering with input interaction
            e.stopPropagation();
          }}
        >
          {/* Suggestions Panel */}
          {showSuggestions && (
            <div className="h-40 overflow-y-auto px-3 py-2 border-b border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FiZap className="text-yellow-400" size={14} />
                  <span className="text-slate-300 text-xs font-medium">
                    {isGeneratingSuggestions ? 'Generating AI Suggestions...' : 'AI-Generated Prompts'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {!isGeneratingSuggestions && (
                    <button
                      onClick={regenerateSuggestions}
                      className="text-slate-400 hover:text-yellow-400 p-1 rounded transition-colors"
                      title="Regenerate suggestions"
                    >
                      <FiRefreshCw size={12} />
                    </button>
                  )}
                  <button
                    onClick={toggleSuggestions}
                    className="text-slate-400 hover:text-red-400 text-xs"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              </div>
              
              {isGeneratingSuggestions ? (
                <div className="flex items-center justify-center h-24">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                    <span className="text-xs">Generating personalized suggestions...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(prompt)}
                      className="text-left text-xs p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Input Form */}
          <div className={`p-3`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                sendMessage();
              }}
              className="flex space-x-2"
            >
              <button
                type="button"
                onClick={toggleSuggestions}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-yellow-400 px-3 py-2 rounded transition-colors flex items-center justify-center"
                title="Show suggested prompts"
              >
                <FiZap size={14} />
              </button>
              <input
                type="text"
                value={userInput}
                onChange={(e) => {
                  e.stopPropagation();
                  setUserInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                }}
                onBlur={(e) => {
                  e.stopPropagation();
                }}
                placeholder="Ask me to create a visualization..."
                className="flex-1 bg-slate-700 text-white text-sm px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="submit"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  sendMessage();
                }}
                disabled={isLoading || !userInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded transition-colors flex items-center justify-center min-w-[40px]"
              >
                <FiSend size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* Resize handles */}
      <>
        {/* Corner resize */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize bg-slate-600 opacity-50 hover:opacity-100"
          onMouseDown={(e) => handleResizeStart(e, 'corner')}
          style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
        />
        
        {/* Right resize */}
        <div
          className="absolute top-8 right-0 w-1 bottom-4 cursor-e-resize bg-transparent hover:bg-slate-600 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        />
        
        {/* Bottom resize */}
        <div
          className="absolute bottom-0 left-3 right-4 h-1 cursor-s-resize bg-transparent hover:bg-slate-600 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
        />
      </>
    </div>
  );
};

export default AIAssistant;
