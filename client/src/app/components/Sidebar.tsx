import React, { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiX, FiSend, FiPlusCircle, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { ChartTemplate } from '../types/visualization';
import styles from './Sidebar.module.css';

interface SidebarProps {
  selectedElements?: Array<{id: string, name: string, type: string}>;
  onElementRemove?: (id: string) => void;
  chartTemplates?: ChartTemplate[];
  onTemplateSelect?: (template: ChartTemplate) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  selectedElements = [], 
  onElementRemove = () => {},
  chartTemplates = [],
  onTemplateSelect = () => {}
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{text: string, isUser: boolean}>>([
    { text: "Welcome! I can help visualize your data. What would you like to know?", isUser: false },
  ]);
  
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  
  const suggestedPrompts = [
    "Create a bar chart showing sales by region",
    "Compare revenue between 2023 and 2024",
    "Visualize user engagement over time",
    "Show distribution of customer demographics"
  ];
  
  const handleSendMessage = () => {
    if (chatInput.trim() === '') return;
    
    // Add user message
    setChatMessages([...chatMessages, { text: chatInput, isUser: true }]);
    
    // Simulate AI response (in a real app, this would call your LLM API)
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        text: "I'll help you visualize that. Would you like to see some options?", 
        isUser: false 
      }]);
    }, 800);
    
    setChatInput('');
  };
  
  const handlePromptClick = (prompt: string) => {
    setChatMessages([...chatMessages, { text: prompt, isUser: true }]);
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        text: `I can help with "${prompt}". Here are some visualization options you might consider.`, 
        isUser: false 
      }]);
    }, 800);
  };
  
  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  return (
    <div className="flex">
      {/* Left sidebar - fixed position with 80% height, 2rem from left */}
      <div className={styles.dashboardElements}>
        <div className={styles.dashboardHeader}>
          <h2 className={styles.dashboardTitle}>Dashboard Elements</h2>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {selectedElements.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <FiPlusCircle size={24} />
              </div>
              <p className="text-center">No dashboard elements selected yet</p>
              <p className="text-center text-sm mt-2">Add elements from your dashboard to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-400">Selected Elements</h3>
              {selectedElements.map(element => (
                <div 
                  key={element.id} 
                  className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-slate-700">{element.name}</p>
                    <button 
                      onClick={() => onElementRemove(element.id)}
                      className="p-1 text-slate-400 hover:text-red-500" 
                      aria-label="Remove element"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{element.type}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Chat toggle button - fixed at bottom of sidebar */}
        <div className="p-3 border-t border-slate-200">
          <button 
            onClick={() => {
              console.log("Current state:", isChatOpen);
              setIsChatOpen(!isChatOpen);
            }}
            className="w-full py-2 px-3 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
          >
            <FiMessageCircle size={18} />
            <span>{isChatOpen ? "Hide AI Assistant" : "Show AI Assistant"}</span>
          </button>
        </div>
      </div>
      
      {/* Chat panel - slides in from the right side, 50% height */}
      <div 
        className={`${styles.chatPanel} ${isChatOpen ? styles.chatPanelVisible : styles.chatPanelHidden}`}
      >
        <div className={styles.chatHeader}>
          <h2 className={styles.chatTitle}>AI Assistant</h2>
          <button 
            onClick={() => setIsChatOpen(false)}
            className={styles.chatCloseBtn}
            aria-label="Close chat"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Chat messages */}
        <div className={styles.chatMessagesContainer}>
          {chatMessages.map((message, index) => (
            <div 
              key={index}
              className={`${styles.messageContainer} ${message.isUser ? styles.messageContainerUser : styles.messageContainerAI}`}
            >
              <div 
                className={`${styles.messageBubble} ${
                  message.isUser 
                    ? styles.messageBubbleUser
                    : styles.messageBubbleAI
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
          
          {/* Suggested prompts */}
          {chatMessages.length <= 2 && (
            <div className={styles.suggestedPromptsContainer}>
              <p className={styles.suggestedPromptsTitle}>Try asking:</p>
              <div className={styles.promptsList}>
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className={styles.promptButton}
                  >
                    <span className={styles.promptText}>{prompt}</span>
                    <FiChevronRight size={14} className={styles.promptIcon} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Chat input */}
        <div className={styles.chatInputContainer}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={styles.chatInputForm}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask any other questions..."
              className={styles.chatInput}
            />
            <button
              type="submit"
              disabled={chatInput.trim() === ''}
              className={`${styles.sendButton} ${
                chatInput.trim() === '' 
                  ? styles.sendButtonDisabled
                  : styles.sendButtonEnabled
              }`}
              aria-label="Send message"
            >
              <FiSend size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
