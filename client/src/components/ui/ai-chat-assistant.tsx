'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiX, FiSend, FiCpu, FiDatabase, FiEye, FiEyeOff, FiZap, FiRefreshCw, FiExternalLink, FiInfo, FiFilter, FiBarChart, FiFolder, FiFile, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { VegaLite } from 'react-vega';
import { ConnectionNodes } from './connection-nodes';
import { generateDashboardElementsContext, findElementsForQuestion, generateQuestionGuidance } from '../../app/dashboard2/dashboardElementsRegistry';
import { 
  LondonDataFile, 
  LondonDataCategory, 
  loadAllLondonData, 
  getFullCSVData, 
  generateLondonDataContext, 
  searchLondonData 
} from '../../utils/londonDataLoader';

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
    // London dashboard filters
    borough?: string;
    crimeCategory?: string;
    birthYear?: number;
    baseYear?: number;
    lsoa?: string;
  }) => void;
  onCreateElement?: (elementData: {
    elementName: string;
    elementType: string;
    vegaSpec: any;
    description: string;
  }) => void;
  dashboardFilters?: {
    selectedBorough?: string;
    selectedCrimeCategory?: string;
    selectedBirthYear?: number;
    selectedBaseYear?: number;
    selectedLSOA?: string;
  };
  availableFilters?: {
    boroughs?: string[];
    crimeCategories?: string[];
    birthYears?: number[];
    baseYears?: number[];
  };
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
  onCreateElement,
  dashboardFilters,
  availableFilters
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
  const [londonDataCategories, setLondonDataCategories] = useState<LondonDataCategory[]>([]);
  const [selectedDataFile, setSelectedDataFile] = useState<LondonDataFile | null>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [loadingFileData, setLoadingFileData] = useState(false);
  const [londonDataSummary, setLondonDataSummary] = useState<{[key: string]: any}>({});
  const [showDatasetFiles, setShowDatasetFiles] = useState(false);
  
  // Dropdown states for context panel sections
  const [showDatasetsDropdown, setShowDatasetsDropdown] = useState(false);
  const [showCurrentFiltersDropdown, setShowCurrentFiltersDropdown] = useState(false);
  const [showAvailableFiltersDropdown, setShowAvailableFiltersDropdown] = useState(false);
  const [showElementsDropdown, setShowElementsDropdown] = useState(false);
  const [showDatasetCategoriesDropdown, setShowDatasetCategoriesDropdown] = useState<{[key: string]: boolean}>({});

  const assistantRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [assistant.chatHistory]);

  // Load London data on component mount
  useEffect(() => {
    const loadLondonData = async () => {
      try {
        const categories = await loadAllLondonData();
        setLondonDataCategories(categories);
        
        // Store summary data for each loaded file
        const summaryData: {[key: string]: any} = {};
        categories.forEach(category => {
          category.files.forEach(file => {
            if (file.isLoaded && file.sampleData.length > 0) {
              summaryData[file.id] = {
                name: file.name,
                description: file.description,
                columns: file.columns,
                totalRecords: file.totalRecords,
                sampleData: file.sampleData.slice(0, 3), // Store first 3 records
                category: file.category
              };
            }
          });
        });
        setLondonDataSummary(summaryData);
      } catch (error) {
        console.error('Error loading London data:', error);
      }
    };
    
    loadLondonData();
  }, []);

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
        .filter(Boolean),
      
      // London data context
      londonDataSummary: londonDataSummary,
      londonDataCategories: londonDataCategories,
      selectedLondonFile: selectedDataFile,
      londonFileData: selectedDataFile ? fileData.slice(0, 10) : []
    };
    return context;
  }, [assistant.connectedElements, hrData, droppedElements, stickyNotes, londonDataCategories, selectedDataFile, fileData, londonDataSummary]);

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

  // Handle file selection and loading
  const handleFileSelect = async (file: LondonDataFile) => {
    setSelectedDataFile(file);
    setLoadingFileData(true);
    
    try {
      const data = await getFullCSVData(file);
      setFileData(data);
    } catch (error) {
      console.error('Error loading file data:', error);
      setFileData([]);
    } finally {
      setLoadingFileData(false);
    }
  };

  // Calculate top position for chat area based on visible panels
  const getTopPosition = () => {
    if (assistant.showContext || showDatasetFiles) {
      return '50%'; // Either context or dataset panel takes up 50% of the height
    }
    return '0px';
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

${context.londonDataSummary}

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

${context.selectedLondonFile ? `
CURRENTLY SELECTED LONDON FILE: ${context.selectedLondonFile.name}
Description: ${context.selectedLondonFile.description}
Columns: ${context.selectedLondonFile.columns.join(', ')}
Total Records: ${context.selectedLondonFile.totalRecords}
Sample Data: ${JSON.stringify(context.londonFileData.slice(0, 3), null, 2)}
` : ''}

CRITICAL INSTRUCTIONS:
1. You have access to HR employee data AND comprehensive London datasets
2. ALWAYS check the AVAILABLE DASHBOARD ELEMENTS section first to see what's already on the dashboard
3. Use the London datasets to create rich visualizations about London boroughs, demographics, crime, housing, etc.
4. If existing elements can answer the user's question, provide GUIDANCE to examine those specific elements
5. If existing elements need filtering to answer the question, provide FILTER_GUIDANCE with specific filter commands
6. ONLY create new visualizations if no existing element can answer the question
7. When creating charts with London data, make sure to use the correct dataset path and structure

Sample HR data structure:
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
            className={`p-1 rounded transition-colors ${
              assistant.showContext 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-600'
            }`}
            title="Toggle Context"
          >
            {assistant.showContext ? <FiEye size={16} /> : <FiEyeOff size={16} />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDatasetFiles(!showDatasetFiles);
            }}
            className={`p-1 rounded transition-colors ${
              showDatasetFiles 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-600'
            }`}
            title="Toggle Datasets"
          >
            <FiDatabase size={16} />
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
            className="absolute top-0 left-0 right-0 bg-slate-800 border-b-2 border-slate-500 p-3 overflow-y-auto" 
            style={{
              height: '50%',
              msOverflowStyle: 'none'
            }}
          >
            <div className="text-xs text-slate-300 space-y-2">
              {/* Available Datasets Section */}
              <div className="border-b border-slate-600 pb-2">
                <button
                  onClick={() => setShowDatasetsDropdown(!showDatasetsDropdown)}
                  className="flex items-center space-x-2 w-full text-left hover:bg-slate-700 p-1 rounded transition-colors"
                >
                  {showDatasetsDropdown ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                  <FiDatabase size={12} />
                  <span className="font-medium">Available Datasets</span>
                  <span className="text-slate-400 ml-auto">({(hrData.length > 0 ? 1 : 0) + Object.keys(londonDataSummary).length})</span>
                </button>
                {showDatasetsDropdown && (
                  <div className="mt-2 ml-4 space-y-1">
                    {hrData.length > 0 && (
                      <div className="text-slate-400">• HR Employee Data: {hrData.length} records</div>
                    )}
                    {Object.entries(londonDataSummary).map(([fileId, fileInfo]) => (
                      <div key={fileId} className="text-slate-400">• {fileInfo.name}: {fileInfo.totalRecords} records</div>
                    ))}
                    {(hrData.length === 0 && Object.keys(londonDataSummary).length === 0) && (
                      <div className="text-slate-500 italic">No datasets loaded</div>
                    )}
                  </div>
                )}
              </div>

              {/* Current Dashboard Filters Section */}
              {dashboardFilters && (
                <div className="border-b border-slate-600 pb-2">
                  <button
                    onClick={() => setShowCurrentFiltersDropdown(!showCurrentFiltersDropdown)}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700 p-1 rounded transition-colors"
                  >
                    {showCurrentFiltersDropdown ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                    <FiFilter size={12} className="text-yellow-400" />
                    <span className="font-medium">Current Filters</span>
                    <span className="text-slate-400 ml-auto">
                      ({Object.values(dashboardFilters).filter(Boolean).length})
                    </span>
                  </button>
                  {showCurrentFiltersDropdown && (
                    <div className="mt-2 ml-4 space-y-1">
                      {dashboardFilters.selectedBorough && (
                        <div className="text-slate-400">• Borough: <span className="text-blue-300">{dashboardFilters.selectedBorough}</span></div>
                      )}
                      {dashboardFilters.selectedCrimeCategory && (
                        <div className="text-slate-400">• Crime Category: <span className="text-red-300">{dashboardFilters.selectedCrimeCategory}</span></div>
                      )}
                      {dashboardFilters.selectedBirthYear && (
                        <div className="text-slate-400">• Birth Year: <span className="text-green-300">{dashboardFilters.selectedBirthYear}</span></div>
                      )}
                      {dashboardFilters.selectedBaseYear && (
                        <div className="text-slate-400">• Base Year: <span className="text-purple-300">{dashboardFilters.selectedBaseYear}</span></div>
                      )}
                      {dashboardFilters.selectedLSOA && (
                        <div className="text-slate-400">• LSOA: <span className="text-cyan-300">{dashboardFilters.selectedLSOA}</span></div>
                      )}
                      {Object.values(dashboardFilters).filter(Boolean).length === 0 && (
                        <div className="text-slate-500 italic">No filters applied</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Available Filters Section */}
              {availableFilters && (
                <div className="border-b border-slate-600 pb-2">
                  <button
                    onClick={() => setShowAvailableFiltersDropdown(!showAvailableFiltersDropdown)}
                    className="flex items-center space-x-2 w-full text-left hover:bg-slate-700 p-1 rounded transition-colors"
                  >
                    {showAvailableFiltersDropdown ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                    <FiFilter size={12} className="text-green-400" />
                    <span className="font-medium">Available Filters</span>
                    <span className="text-slate-400 ml-auto">
                      ({Object.keys(availableFilters).length})
                    </span>
                  </button>
                  {showAvailableFiltersDropdown && (
                    <div className="mt-2 ml-4 space-y-1">
                      {availableFilters.boroughs && (
                        <div className="text-slate-400">
                          • Boroughs: {availableFilters.boroughs.length} available
                          <div className="ml-3 mt-1 text-slate-500 text-xs">
                            {availableFilters.boroughs.slice(0, 5).map((borough: string, index: number) => (
                              <div key={index}>- {borough}</div>
                            ))}
                            {availableFilters.boroughs.length > 5 && (
                              <div className="text-slate-600">... and {availableFilters.boroughs.length - 5} more</div>
                            )}
                          </div>
                        </div>
                      )}
                      {availableFilters.crimeCategories && (
                        <div className="text-slate-400">
                          • Crime Categories: {availableFilters.crimeCategories.length} available
                          <div className="ml-3 mt-1 text-slate-500 text-xs">
                            {availableFilters.crimeCategories.slice(0, 5).map((category: string, index: number) => (
                              <div key={index}>- {category}</div>
                            ))}
                            {availableFilters.crimeCategories.length > 5 && (
                              <div className="text-slate-600">... and {availableFilters.crimeCategories.length - 5} more</div>
                            )}
                          </div>
                        </div>
                      )}
                      {availableFilters.birthYears && (
                        <div className="text-slate-400">
                          • Birth Years: {availableFilters.birthYears.length} available
                          <div className="ml-3 mt-1 text-slate-500 text-xs">
                            {availableFilters.birthYears.slice(0, 5).map((year: number, index: number) => (
                              <div key={index}>- {year}</div>
                            ))}
                            {availableFilters.birthYears.length > 5 && (
                              <div className="text-slate-600">... and {availableFilters.birthYears.length - 5} more</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dashboard Elements Section */}
              <div className="pb-2">
                <button
                  onClick={() => setShowElementsDropdown(!showElementsDropdown)}
                  className="flex items-center space-x-2 w-full text-left hover:bg-slate-700 p-1 rounded transition-colors"
                >
                  {showElementsDropdown ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                  <FiBarChart size={12} className="text-blue-400" />
                  <span className="font-medium">Dashboard Elements</span>
                  <span className="text-slate-400 ml-auto">
                    ({(droppedElements?.length || 0) + (stickyNotes?.length || 0)})
                  </span>
                </button>
                {showElementsDropdown && (
                  <div className="mt-2 ml-4 space-y-1">
                    {/* Connected Elements */}
                    {assistant.connectedElements.length > 0 && (
                      <div className="mb-2">
                        <div className="text-blue-300 font-medium mb-1">Connected to me ({assistant.connectedElements.length}):</div>
                        {assistant.connectedElements.map((element, index) => (
                          <div key={index} className="text-blue-300 ml-2">
                            • {element.type === 'element' ? 'Chart' : 'Note'}: {element.id.slice(0, 8)}...
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* All Dashboard Elements */}
                    {droppedElements && droppedElements.length > 0 && (
                      <div className="mb-2">
                        <div className="text-slate-400 font-medium mb-1">All Charts ({droppedElements.length}):</div>
                        {droppedElements.map((element, index) => (
                          <div key={index} className="text-slate-400 ml-2 text-xs">
                            • {element.elementName || 'Unnamed Chart'} 
                            {assistant.connectedElements.some(conn => conn.id === element.id) && (
                              <span className="text-blue-300 ml-1">[Connected]</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* All Sticky Notes */}
                    {stickyNotes && stickyNotes.length > 0 && (
                      <div className="mb-2">
                        <div className="text-slate-400 font-medium mb-1">All Notes ({stickyNotes.length}):</div>
                        {stickyNotes.map((note, index) => (
                          <div key={index} className="text-slate-400 ml-2 text-xs">
                            • {note.content ? `${note.content.substring(0, 30)}...` : 'Empty note'}
                            {assistant.connectedElements.some(conn => conn.id === note.id) && (
                              <span className="text-blue-300 ml-1">[Connected]</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(!droppedElements || droppedElements.length === 0) && (!stickyNotes || stickyNotes.length === 0) && (
                      <div className="text-slate-500 italic">No dashboard elements</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dataset Files Panel */}
        {showDatasetFiles && (
          <div 
            className="absolute top-0 left-0 right-0 bg-slate-800 border-b-2 border-slate-500 p-3 overflow-y-auto" 
            style={{
              height: '50%',
              msOverflowStyle: 'none'
            }}
          >
            <div className="text-xs text-slate-300">
              <div className="flex items-center space-x-2 mb-3">
                <FiFolder size={12} className="text-green-400" />
                <span className="font-medium">London Data Files ({Object.keys(londonDataSummary).length})</span>
              </div>
              
              {/* London Data Files by Category */}
              <div className="space-y-2 max-h-[60%] overflow-y-auto">
                {londonDataCategories.map((category) => {
                  const categoryFiles = category.files.filter(file => londonDataSummary[file.id]);
                  if (categoryFiles.length === 0) return null;
                  
                  const isCategoryOpen = showDatasetCategoriesDropdown[category.name] === true;
                  
                  return (
                    <div key={category.name} className="border border-slate-600 rounded">
                      <button
                        onClick={() => setShowDatasetCategoriesDropdown(prev => ({
                          ...prev,
                          [category.name]: prev[category.name] === true ? false : true
                        }))}
                        className="w-full flex items-center space-x-2 p-2 hover:bg-slate-700 transition-colors"
                      >
                        {isCategoryOpen ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                        <FiFolder size={12} className="text-green-400" />
                        <span className="font-medium">{category.name}</span>
                        <span className="text-slate-400 ml-auto">({categoryFiles.length})</span>
                      </button>
                      
                      {isCategoryOpen && (
                        <div className="p-2 pt-0 space-y-1">
                          {categoryFiles.map((file) => {
                            const fileInfo = londonDataSummary[file.id];
                            return (
                              <button
                                key={file.id}
                                onClick={() => {
                                  setSelectedDataFile(file);
                                  handleFileSelect(file);
                                }}
                                className={`block w-full text-left p-2 rounded border transition-colors ${
                                  selectedDataFile?.id === file.id 
                                    ? 'bg-slate-700 border-green-500' 
                                    : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                                }`}
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  <FiDatabase size={10} className="text-green-400" />
                                  <span className="text-slate-300 font-medium truncate">
                                    {fileInfo.name}
                                  </span>
                                </div>
                                <div className="text-slate-500 text-xs truncate mb-1">
                                  {fileInfo.description}
                                </div>
                                <div className="text-slate-400 text-xs">
                                  {fileInfo.totalRecords} records • {fileInfo.columns.length} columns
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* HR Data Section */}
                {hrData.length > 0 && (
                  <div className="border border-slate-600 rounded">
                    <button
                      onClick={() => setShowDatasetCategoriesDropdown(prev => ({
                        ...prev,
                        'HR Data': prev['HR Data'] === true ? false : true
                      }))}
                      className="w-full flex items-center space-x-2 p-2 hover:bg-slate-700 transition-colors"
                    >
                      {showDatasetCategoriesDropdown['HR Data'] === true ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                      <FiDatabase size={12} className="text-blue-400" />
                      <span className="font-medium">HR Data</span>
                      <span className="text-slate-400 ml-auto">(1)</span>
                    </button>
                    
                    {showDatasetCategoriesDropdown['HR Data'] === true && (
                      <div className="p-2 pt-0">
                        <div className="bg-slate-800 border border-slate-600 rounded p-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <FiDatabase size={10} className="text-blue-400" />
                            <span className="text-slate-300 font-medium">HR Employee Data</span>
                          </div>
                          <div className="text-slate-500 text-xs mb-1">
                            Employee attrition and performance data
                          </div>
                          <div className="text-slate-400 text-xs">
                            {hrData.length} records • {hrData.length > 0 ? Object.keys(hrData[0]).length : 0} columns
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {Object.keys(londonDataSummary).length === 0 && hrData.length === 0 && (
                  <div className="text-slate-500 italic text-center py-4">
                    No data files loaded
                  </div>
                )}
              </div>
              
              {/* Selected File Preview */}
              {selectedDataFile && londonDataSummary[selectedDataFile.id] && (
                <div className="mt-3 border-t border-slate-600 pt-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiFile size={12} className="text-yellow-400" />
                    <span className="font-medium">Preview: {selectedDataFile.name}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-xs">
                    <div className="text-slate-400 mb-2">
                      <span className="font-medium">Columns:</span> {londonDataSummary[selectedDataFile.id].columns.join(', ')}
                    </div>
                    <div className="text-slate-400 mb-1 font-medium">Sample Data:</div>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {londonDataSummary[selectedDataFile.id].sampleData.map((row: any, index: number) => {
                        const values = Object.values(row);
                        return (
                          <div key={index} className="text-slate-300 truncate font-mono bg-slate-800 p-1 rounded">
                            {values.join(' • ')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div 
          ref={chatContainerRef}
          className="absolute left-0 right-0 overflow-y-auto px-3 pt-3 pb-2 space-y-2"
          style={{
            top: getTopPosition(),
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
