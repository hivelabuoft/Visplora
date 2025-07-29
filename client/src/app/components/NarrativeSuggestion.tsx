'use client';

import React, { useState } from 'react';
import { NarrativeSuggestion } from '../LLMs/suggestion_from_interaction';

interface NarrativeSuggestionProps {
  suggestion: NarrativeSuggestion;
  onAccept: (suggestionText: string) => void;
  onDeny: () => void;
  position?: { top: number; left: number };
  isLoading?: boolean;
}

const NarrativeSuggestionBox: React.FC<NarrativeSuggestionProps> = ({
  suggestion,
  onAccept,
  onDeny,
  position,
  isLoading = false
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <div 
        className="narrative-suggestion-box ghost-style"
        style={position ? { 
          position: 'absolute', 
          top: position.top, 
          left: position.left,
          zIndex: 1000
        } : {}}
      >
        <div className="suggestion-content">
          <div className="suggestion-text">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">Generating narrative suggestion...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestion.narrative_suggestion) {
    return null;
  }

  return (
    <div 
      className="narrative-suggestion-box"
      style={position ? { 
        position: 'absolute', 
        top: position.top, 
        left: position.left,
        zIndex: 1000
      } : {}}
    >
      {/* Main suggestion content */}
      <div className="suggestion-content">
        <div className="suggestion-text">
          {suggestion.narrative_suggestion}
        </div>
        
        {/* Action buttons */}
        <div className="suggestion-actions">
          <button
            className="suggestion-btn accept-btn"
            onClick={() => onAccept(suggestion.narrative_suggestion!)}
            title="Accept this suggestion"
          >
            ✓ Accept
          </button>
          
          <button
            className="suggestion-btn deny-btn"
            onClick={onDeny}
            title="Dismiss this suggestion"
          >
            ✗ Deny
          </button>
          
          <button
            className="suggestion-btn explain-btn"
            onClick={() => setShowExplanation(!showExplanation)}
            title="Why this insight?"
          >
            ? Why
          </button>
        </div>
      </div>

      {/* Explanation panel (expandable) */}
      {showExplanation && (
        <div className="suggestion-explanation">
          <div className="explanation-content">
            <div className="explanation-section">
              <strong>Why this insight:</strong>
              <p>{suggestion.explanation}</p>
            </div>
            
            <div className="explanation-section">
              <strong>Based on view:</strong>
              <p>"{suggestion.source_view_title}" (ID: {suggestion.source_elementId})</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NarrativeSuggestionBox;
