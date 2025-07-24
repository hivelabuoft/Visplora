'use client';

import React from 'react';
import '../../styles/dataExplorer.css';

interface AnalysisModalProps {
  isVisible: boolean;
  onStop: () => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isVisible, onStop }) => {
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
      
      {/* Modal */}
      <div className="analysis-bar">
        <div className="analysis-bar-content">
          <div className="analysis-spinner"></div>
          <span className="analysis-text">
            Analyzing your data and generating insights...
          </span>
          <button 
            className="analysis-stop-button"
            onClick={onStop}
          >
            Stop
          </button>
        </div>
      </div>
    </>
  );
};

export default AnalysisModal;
