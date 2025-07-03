'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiX, FiSend, FiCpu, FiDatabase, FiEye, FiEyeOff, FiZap, FiRefreshCw } from 'react-icons/fi';
import { VegaLite } from 'react-vega';
import { ConnectionNodes } from './connection-nodes';

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
}

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
  stickyNotes = []
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
      connectedData: assistant.connectedElements.map(element => {
        if (element.type === 'element') {
          const droppedElement = droppedElements.find(el => el.id === element.id);
          return {
            type: 'visualization',
            name: droppedElement?.elementName || 'Unknown',
            elementType: droppedElement?.elementType || 'chart'
          };
        } else {
          const note = stickyNotes.find(note => note.id === element.id);
          return {
            type: 'note',
            content: note?.content || 'No content',
            created: note?.createdAt ? new Date(note.createdAt).toLocaleString() : 'Unknown'
          };
        }
      })
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
      
      // Create a prompt for the AI to generate suggestions
      const suggestionPrompt = `Based on the following HR dataset and context, generate 8 diverse and insightful data visualization prompts that would be useful for exploring this data. 

Dataset Information:
- Total Records: ${context.totalRecords}
- Available Columns: ${context.availableColumns.join(', ')}
- Column Types: ${Object.entries(context.columnTypes).map(([col, type]) => `${col} (${type})`).join(', ')}
- Connected Elements: ${context.connectedElements}

Please generate exactly 8 short, actionable prompts (1-2 sentences each) that:
1. Explore different aspects of the HR data
2. Use various chart types (bar, pie, scatter, histogram, etc.)
3. Focus on business insights like attrition, salary, performance, demographics
4. Include both simple and advanced analysis requests
5. Are specific to the available columns

Return ONLY the prompts, one per line, without numbering or formatting.`;

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
        panelWidth: actualWidth // Use current actual width of the panel
      };
      
      // Prepare system prompt with context
      const systemPrompt = `You are an AI assistant helping with data visualization using Vega-Lite. 
      
Available dataset: HR Employee data with ${context.totalRecords} records
Available columns: ${context.availableColumns.join(', ')}
Current panel width: ${actualWidth}px

Connected elements: ${context.connectedData.map(el => 
  el.type === 'visualization' ? `${el.name} (${el.elementType})` : `Note: ${el.content}`
).join(', ')}

When asked to create charts, respond with valid Vega-Lite JSON specifications using the HR dataset.
Always ensure the chart specifications use only the available columns.
The chart will be sized based on the panel width of ${actualWidth}px.

Sample data structure:
${JSON.stringify(context.hrDataSample.slice(0, 3), null, 2)}`;

      // Call OpenAI API
      console.log('Calling /api/chat');
      console.log('Request payload:', { message, systemPrompt, context: contextWithPanelWidth });
      
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

      console.log('Response received:', response.status, response.statusText);

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
        vegaSpec: data.vegaSpec
      };

      console.log('Assistant message with vegaSpec:', assistantMessage.vegaSpec);

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
                  : 'bg-slate-700 text-slate-100'
              }`} style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.vegaSpec && (
                  <div className="mt-2 bg-white rounded p-2 overflow-hidden" style={{ maxWidth: '100%' }}>
                    <VegaLite spec={message.vegaSpec} />
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
