import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMessageCircle,
  FiX,
  FiSend,
  FiPlusCircle,
  FiChevronRight,
  FiTrash2,
  FiLayout,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiMaximize2,
  FiMinimize2,
  FiPlus
} from 'react-icons/fi';
import { ChartTemplate } from '../types/visualization';
import { SelectedElement } from '../../components/context/SelectedElementsContext';
import { renderWidgetForSidebar } from '../dashboard2/widgets';
import styles from './Sidebar.module.css';

interface SidebarProps {
  selectedElements?: SelectedElement[];
  onElementRemove?: (id: string) => void;
  chartTemplates?: ChartTemplate[];
  onTemplateSelect?: (template: ChartTemplate) => void;
  hrData?: any[]; // HR data for widget rendering
  filterContext?: any; // Filter context for widgets
}

const Sidebar: React.FC<SidebarProps> = ({ 
  selectedElements = [], 
  onElementRemove = () => {},
  chartTemplates = [],
  onTemplateSelect = () => {},
  hrData = [],
  filterContext = {}
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [dashboardCount, setDashboardCount] = useState(0);
  const [expandedElementId, setExpandedElementId] = useState<string | null>(null);
  const [showAllFields, setShowAllFields] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [chatContextElements, setChatContextElements] = useState<SelectedElement[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{text: string, isUser: boolean}>>([
    { text: "Welcome! I can help visualize your data. What would you like to know?", isUser: false },
  ]);
  
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const toggleElementExpansion = (elementId: string) => {
    setExpandedElementId(prev => prev === elementId ? null : elementId);
    // Reset show all fields when switching elements
    setShowAllFields(false);
  };

  const addElementToChat = (element: SelectedElement) => {
    setChatContextElements(prev => {
      // Check if element is already in context
      if (prev.find(el => el.id === element.id)) {
        return prev;
      }
      return [...prev, element];
    });
    
    // Auto-open chat if it's not open
    if (!isChatOpen) {
      setIsChatOpen(true);
    }
  };

  const removeElementFromChat = (elementId: string) => {
    setChatContextElements(prev => prev.filter(el => el.id !== elementId));
  };

  const generateContextualPrompts = (): string[] => {
    if (chatContextElements.length === 0) {
      return [
        "Create a bar chart showing sales by region",
        "Compare revenue between 2023 and 2024", 
        "Visualize user engagement over time",
        "Show distribution of customer demographics"
      ];
    }

    const prompts: string[] = [];
    
    chatContextElements.forEach(element => {
      const fields = element.fields.join(', ');
      
      if (element.type === 'Chart') {
        prompts.push(`Analyze the ${element.name} chart and suggest improvements`);
        prompts.push(`Create a complementary visualization for ${fields}`);
        prompts.push(`Compare ${element.name} with another metric`);
      } else if (element.type === 'KPI') {
        prompts.push(`Create a trend chart for the ${element.name} KPI`);
        prompts.push(`Show breakdown of factors affecting ${element.name}`);
        prompts.push(`Compare ${element.name} across different segments`);
      } else if (element.type === 'Table') {
        prompts.push(`Convert ${element.name} table to an interactive chart`);
        prompts.push(`Show top insights from ${fields} data`);
        prompts.push(`Create a summary visualization for ${element.name}`);
      }
    });

    // Add some general prompts based on the context fields
    const allFields = [...new Set(chatContextElements.flatMap(el => el.fields))];
    if (allFields.length > 0) {
      prompts.push(`Create a correlation analysis between ${allFields.slice(0, 3).join(', ')}`);
      prompts.push(`Show distribution patterns in ${allFields[0]} data`);
      prompts.push(`Generate insights from ${chatContextElements.length} selected elements`);
    }

    return prompts.slice(0, 6); // Limit to 6 prompts
  };
  const suggestedPrompts = generateContextualPrompts();
  
  const handleSendMessage = () => {
    if (chatInput.trim() === '') return;
    
    // Redirect to visualization-design page
    window.location.href = '/dashboard-design/';
    
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
  
  // Load dashboard count from localStorage
  useEffect(() => {
    const loadDashboardCount = () => {
      const count = localStorage.getItem('dashboardCount');
      setDashboardCount(count ? parseInt(count) : 0);
    };
    
    loadDashboardCount();
    
    // Set up event listener for storage changes
    const handleStorageChange = () => {
      loadDashboardCount();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for a custom event that we'll dispatch when creating a dashboard
    window.addEventListener('dashboardsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dashboardsUpdated', handleStorageChange);
    };
  }, []);
  
  return (
    <div className="flex">
      {/* Left sidebar - fixed position with 80% height, 2rem from left */}
      <div className={styles.dashboardElements}>
        <div className={styles.dashboardHeader}>
          <h2 className={styles.dashboardTitle}>Dashboard Elements</h2>
        </div>
          <div className={styles.sidebarContent}>
          {selectedElements.length === 0 ? (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIconContainer}>
                <FiPlusCircle size={24} />
              </div>
              <p className={styles.emptyStateTitle}>No dashboard elements selected yet</p>
              <p className={styles.emptyStateSubtitle}>Add elements from your dashboard to see them here</p>
            </div>
          ) : (
            <div className={styles.elementsList}>
              {selectedElements.map(element => (
                <div 
                  key={element.id} 
                  className={`${styles.elementCard} ${
                    expandedElementId === element.id 
                      ? styles.elementCardExpanded
                      : styles.elementCardDefault
                  }`}
                  onClick={() => toggleElementExpansion(element.id)}
                >
                  <div className={styles.elementCardContent}>
                    <div className={styles.elementInfo}>
                      <p className={`${styles.elementName} ${
                        expandedElementId === element.id ? styles.elementNameExpanded : styles.elementNameDefault
                      }`}>
                        {element.name}
                      </p>
                      <p className={styles.elementType}>{element.type}</p>
                      <p className={styles.elementSource}>from {element.dashboardSource}</p>
                    </div>
                    <div className={styles.elementActions}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addElementToChat(element);
                        }}
                        className={`${styles.elementActionButton} ${styles.elementAddToChatButton}`}
                        title="Add to AI chat context"
                      >
                        <FiPlus size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleElementExpansion(element.id);
                        }}
                        className={`${styles.elementActionButton} ${styles.elementExpandButton} ${
                          expandedElementId === element.id ? styles.elementExpandButtonExpanded : ''
                        }`}
                        title={expandedElementId === element.id ? "Collapse" : "Show details"}
                      >
                        {expandedElementId === element.id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onElementRemove(element.id);
                        }}
                        className={`${styles.elementActionButton} ${styles.elementRemoveButton}`}
                        aria-label="Remove element"
                        title="Remove element"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Dashboard counter and Chat toggle button - fixed at bottom of sidebar */}
        <div className={styles.sidebarFooter}>
          <div className={styles.counterContainer}>
            <div className={styles.counterContent}>
              <FiLayout size={16} className={styles.counterIcon} />
              <span>Selected Elements: <span className={styles.counterNumber}>{selectedElements.length}</span></span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setIsChatOpen(!isChatOpen);
            }}
            className={styles.chatToggleButton}
          >
            <FiMessageCircle size={18} />
            <span>{isChatOpen ? "Hide AI Assistant" : "Show AI Assistant"}</span>
          </button>
        </div>
      </div>
        {/* Chat panel - slides in from the right side, 50% height */}
      <div 
        className={`${styles.chatPanel} ${isChatOpen ? styles.chatPanelVisible : styles.chatPanelHidden} ${
          expandedElementId ? styles.chatPanelBesideExpanded : styles.chatPanelStandalone
        } ${isChatExpanded ? styles.chatPanelExpanded : ''}`}
      >
        <div className={styles.chatHeader}>
          <h2 className={styles.chatTitle}>AI Assistant</h2>
          <div className={styles.chatHeaderActions}>
            <button 
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              className={styles.chatExpandBtn}
              aria-label={isChatExpanded ? "Minimize chat" : "Expand chat"}
              title={isChatExpanded ? "Minimize chat" : "Expand chat"}
            >
              {isChatExpanded ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
            </button>
            <button 
              onClick={() => setIsChatOpen(false)}
              className={styles.chatCloseBtn}
              aria-label="Close chat"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Context Elements Display */}
        {chatContextElements.length > 0 && (
          <div className={styles.chatContextSection}>
            <div className={styles.chatContextHeader}>
              <span className={styles.chatContextTitle}>Context Elements ({chatContextElements.length})</span>
            </div>
            <div className={styles.chatContextList}>
              {chatContextElements.map(element => (
                <div key={element.id} className={styles.chatContextItem}>
                  <div className={styles.chatContextInfo}>
                    <span className={styles.chatContextName}>{element.name}</span>
                    <span className={styles.chatContextType}>{element.type}</span>
                  </div>
                  <button
                    onClick={() => removeElementFromChat(element.id)}
                    className={styles.chatContextRemoveBtn}
                    title="Remove from context"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
              <p className={styles.suggestedPromptsTitle}>
                {chatContextElements.length > 0 
                  ? `Try asking about your ${chatContextElements.length} selected element${chatContextElements.length > 1 ? 's' : ''}:`
                  : "Try asking:"
                }
              </p>
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
              placeholder={chatContextElements.length > 0 
                ? `Ask about your ${chatContextElements.length} selected element${chatContextElements.length > 1 ? 's' : ''}...`
                : "Ask any other questions..."
              }
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

      {/* Expanded Element Panel - shows to the right of the sidebar */}
      <div 
        className={`${styles.expandedPanel} ${expandedElementId ? '' : styles.expandedPanelHidden}`}
      >
        {expandedElementId && (() => {
          const expandedElement = selectedElements.find(el => el.id === expandedElementId);
          if (!expandedElement) return null;
          
          // All possible HR data fields
          const allDataFields = [
            'Age', 'Attrition', 'BusinessTravel', 'DailyRate', 'Department', 
            'DistanceFromHome', 'Education', 'EducationField', 'EmployeeCount', 
            'EmployeeNumber', 'EnvironmentSatisfaction', 'Gender', 'HourlyRate', 
            'JobInvolvement', 'JobLevel', 'JobRole', 'JobSatisfaction', 
            'MaritalStatus', 'MonthlyIncome', 'MonthlyRate', 'NumCompaniesWorked', 
            'Over18', 'OverTime', 'PercentSalaryHike', 'PerformanceRating', 
            'RelationshipSatisfaction', 'StandardHours', 'StockOptionLevel', 
            'TotalWorkingYears', 'TrainingTimesLastYear', 'WorkLifeBalance', 
            'YearsAtCompany', 'YearsInCurrentRole', 'YearsSinceLastPromotion', 
            'YearsWithCurrManager'
          ];
          
          return (
            <>
              <div className={styles.expandedPanelHeader}>
                <div>
                  <h3 className={styles.expandedPanelTitle}>{expandedElement.name}</h3>
                  <p className={styles.expandedPanelType}>{expandedElement.type}</p>
                  <p className={styles.expandedPanelSource}>Source: {expandedElement.dashboardSource}</p>
                </div>
                <button
                  onClick={() => setExpandedElementId(null)}
                  className={styles.expandedPanelCloseBtn}
                  title="Close detailed view"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className={styles.expandedPanelContent}>
                <div className={styles.expandedPanelSection}>
                  <div className={styles.infoCard}>
                    <div className={styles.infoCardContent}>
                      <FiInfo size={16} className={styles.infoIcon} />
                      <span>{expandedElement.description}</span>
                    </div>
                  </div>
                  
                  {/* Original Widget in Enhanced Container */}
                  <div className={styles.widgetPreviewCard}>
                    <div className={styles.widgetPreviewHeader}>
                      <h4 className={styles.widgetPreviewTitle}>Element Preview</h4>
                    </div>
                    <div className={styles.widgetPreviewContent}>
                      <div className={styles.widgetContainer}>
                        {renderWidgetForSidebar(expandedElement.id, hrData, expandedElement.filterContext)}
                      </div>
                    </div>
                  </div>
                  {/* Data Fields */}
                  <div className={styles.dataFieldsCard}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className={styles.dataFieldsHeader}>
                        Data Fields ({allDataFields.length} total, {expandedElement.fields.length} used)
                      </h5>
                      <button
                        onClick={() => setShowAllFields(!showAllFields)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                        title={showAllFields ? "Show only used fields" : "Show all fields"}
                      >
                        {showAllFields ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                        <span>{showAllFields ? 'Show Less' : 'Show All'}</span>
                      </button>
                    </div>
                    <div className={styles.dataFieldsList}>
                      {/* Always show used fields */}
                      {expandedElement.fields.map((field, index) => (
                        <span 
                          key={`used-${index}`} 
                          className={`${styles.dataFieldTag} ${styles.dataFieldUsed}`}
                          title="Used in this element"
                        >
                          {field}
                        </span>
                      ))}
                      {/* Conditionally show unused fields */}
                      {showAllFields && allDataFields
                        .filter(field => !expandedElement.fields.includes(field))
                        .map((field, index) => (
                          <span 
                            key={`unused-${index}`} 
                            className={`${styles.dataFieldTag} ${styles.dataFieldUnused}`}
                            title="Unused field"
                          >
                            {field}
                          </span>
                        ))}
                    </div>
                  </div>
                    {/* Metadata */}
                  <div className={styles.metadataCard}>
                    <h5 className={styles.metadataHeader}>
                      Metadata
                    </h5>
                    <div className={styles.metadataGrid}>
                      <div className={styles.metadataItem}>
                        <span className={styles.metadataLabel}>Added on:</span>
                        <p className={styles.metadataValue}>{expandedElement.metadata.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div className={styles.metadataItem}>
                        <span className={styles.metadataLabel}>Filter Status</span>
                        <p className={styles.metadataValue}>
                          {expandedElement.filterContext && Object.keys(expandedElement.filterContext).length > 0
                            ? `${Object.keys(expandedElement.filterContext).length} filter${Object.keys(expandedElement.filterContext).length > 1 ? 's' : ''} applied`
                            : 'No filters applied'
                          }
                        </p>
                      </div>
                      <div className={styles.metadataItem}>
                        <span className={styles.metadataLabel}>Complexity</span>
                        <p className={styles.metadataValue}>
                          {expandedElement.fields.length <= 2 ? 'Simple' : 
                           expandedElement.fields.length <= 4 ? 'Moderate' : 'Complex'}
                        </p>
                      </div>
                      <div className={styles.metadataItem}>
                        <span className={styles.metadataLabel}>Data Source</span>
                        <p className={styles.metadataValue}>HR Employee Data</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default Sidebar;
