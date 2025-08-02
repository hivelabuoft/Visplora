'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiUser, FiCpu, FiZap, FiX, FiFile, FiDatabase, FiBarChart } from 'react-icons/fi';
import { FileSummary } from '../../utils/londonDataLoader';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CopilotChatPanelProps {
  onGenerateDashboard?: (prompt: string) => void;
  isGenerating?: boolean;
  className?: string;
  selectedFiles?: any[];
  fileSummaries?: FileSummary[];
  summaryLoading?: boolean;
  summaryError?: string;
}

const CopilotChatPanel: React.FC<CopilotChatPanelProps> = ({
  onGenerateDashboard,
  isGenerating = false,
  className = '',
  selectedFiles = [],
  fileSummaries = [],
  summaryLoading = false,
  summaryError = ''
}) => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you analyze your data and create insights. Tell me what you\'d like to explore or ask me to generate a dashboard visualization.',
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Suggested prompts for getting started
  const suggestedPrompts = [
    "Create a London housing analysis dashboard",
    "Show population and demographics trends", 
    "Generate crime statistics visualization",
    "Analyze income patterns across boroughs",
    "Build a comprehensive London overview"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 120; // Maximum height (about 5-6 lines)
      inputRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [userInput]);

  // Add message when files are selected
//   useEffect(() => {
//     if (selectedFiles.length > 0 && fileSummaries.length > 0) {
//       const fileNames = selectedFiles.map(f => f.name).join(', ');
//       const assistantMessage: Message = {
//         id: Date.now().toString(),
//         role: 'assistant',
//         content: `Great! I've analyzed ${selectedFiles.length} dataset(s): ${fileNames}. You can now ask me to generate a dashboard or ask questions about this data.`,
//         timestamp: Date.now()
//       };
//       setMessages(prev => {
//         // Check if we already have a message about these files
//         const hasFileMessage = prev.some(msg => 
//           msg.role === 'assistant' && msg.content.includes('analyzed') && msg.content.includes('dataset')
//         );
//         if (!hasFileMessage) {
//           return [...prev, assistantMessage];
//         }
//         return prev;
//       });
//     }
//   }, [selectedFiles, fileSummaries]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const message = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);

    // Check if the user is asking to generate a dashboard
    const dashboardKeywords = ['dashboard', 'generate', 'create', 'build', 'show', 'visualize', 'analyze'];
    const shouldGenerateDashboard = dashboardKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (shouldGenerateDashboard && onGenerateDashboard) {
      // Call the dashboard generation function
      onGenerateDashboard(message);
      
      // Add a response message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Perfect! I\'m generating a London dashboard based on your request. You\'ll see the interactive visualization appear on the canvas.',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } else {
      // Simulate AI response for other queries
      setTimeout(() => {
        let responseContent = '';
        
        if (selectedFiles.length > 0) {
          responseContent = `I can help you explore the ${selectedFiles.length} dataset(s) you've selected. `;
          
          if (message.toLowerCase().includes('question') || message.toLowerCase().includes('what')) {
            responseContent += `Based on your data, you could ask about population trends, crime statistics, housing prices, or demographic patterns. Would you like me to generate a dashboard to visualize these insights?`;
          } else {
            responseContent += `Your question "${message}" is interesting. Would you like me to create a dashboard visualization to explore this further?`;
          }
        } else {
          responseContent = `I understand you're asking about "${message}". To provide the best analysis, please select some datasets first, then I can generate a comprehensive dashboard for you.`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
    }

    if (!shouldGenerateDashboard) {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setUserInput(prompt);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <FiCpu className="text-white" size={14} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">AI Copilot</h2>
          </div>
        </div>
      </div>

      {/* File Summary Section
      {(selectedFiles.length > 0 || summaryLoading || summaryError) && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <FiDatabase className="mr-2" size={14} />
            Selected Datasets
          </h3>
          
          {summaryLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Analyzing datasets...</span>
            </div>
          )}
          
          {summaryError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Error: {summaryError}
            </div>
          )}
          
          {fileSummaries.length > 0 && (
            <div className="space-y-2">
              {fileSummaries.map((summary, index) => (
                <div key={index} className="bg-white p-3 rounded border text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <FiFile className="text-blue-500" size={14} />
                    <span className="font-medium text-gray-900">{summary.file.name}</span>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">{summary.file.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{summary.totalRows.toLocaleString()} records</span>
                    <span>{summary.columns.length} columns</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )} */}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-500' 
                  : 'bg-gray-500'
              }`}>
                {message.role === 'user' ? (
                  <FiUser className="text-white" size={12} />
                ) : (
                  <FiCpu className="text-white" size={12} />
                )}
              </div>
              
              {/* Message Bubble */}
              <div className={`px-3 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-[10px] mt-1 ${
                  message.role === 'user' 
                    ? 'text-blue-100' 
                    : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[85%]">
              <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCpu className="text-white" size={12} />
              </div>
              <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Generation Loading */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[85%]">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCpu className="text-white" size={12} />
              </div>
              <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                  <span className="text-sm font-medium">Generating Dashboard...</span>
                </div>
                <div className="text-xs text-blue-700">
                  Analyzing data and creating visualizations for your request
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (show when there are few messages) */}
      {messages.length <= 3 && selectedFiles.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2 flex items-center">
            <FiBarChart className="mr-1" size={12} />
            Try asking:
          </p>
          <div className="space-y-1">
            {suggestedPrompts.slice(0, 3).map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="w-full text-left text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition-colors flex items-center justify-between group"
              >
                <span>{prompt}</span>
                <FiZap className="text-gray-400 group-hover:text-blue-500" size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isGenerating ? "Generating dashboard..." : "Ask me to analyze data or generate a dashboard..."}
              disabled={isLoading || isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed resize-none min-h-[40px] max-h-[120px] overflow-y-auto"
              rows={1}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isLoading || isGenerating}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopilotChatPanel;
