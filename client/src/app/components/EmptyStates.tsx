'use client';

import React from 'react';
import '../../styles/dataExplorer.css';

interface AnalyzingStateProps {
  prompt: string;
  onStop: () => void;
}

export const AnalyzingState: React.FC<AnalyzingStateProps> = ({ prompt, onStop }) => {
  return (
    <div className="analyzing-state">
      <div className="analyzing-state-content">
        <div className="analyzing-spinner"></div>
        <h3 className="analyzing-title">Analyzing Data</h3>
        <div className="analyzing-prompt">"{prompt}"</div>
        <div className="analyzing-progress">
          <div className="analyzing-progress-bar"></div>
        </div>
        <p className="analyzing-description">
          Processing your request and generating visualizations...
        </p>
        <button 
          className="analyzing-stop-button"
          onClick={onStop}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export const EmptyCanvas: React.FC = () => {
  return (
    <div className="empty-canvas">
      <div className="empty-canvas-content">
        <div className="empty-canvas-illustration">
          <svg className="empty-canvas-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21H3V3" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 9L13 14L9.5 10.5L5 15" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" fill="#fff4cc" stroke="#0891b2" strokeWidth="1.5"/>
            <circle cx="16" cy="12" r="2" fill="#eecfbe" stroke="#0891b2" strokeWidth="1.5"/>
          </svg>
        </div>
        <h3 className="empty-canvas-title">Data Visualization Workspace</h3>
        <p className="empty-canvas-description">
          Explore London datasets and generate insights through visualization.
          <br />
          <span className="empty-canvas-steps">
            <span className="empty-canvas-step">1. Select a dataset</span>
            <span className="empty-canvas-step">2. Enter a prompt</span>
            <span className="empty-canvas-step">3. Generate dashboard</span>
          </span>
        </p>
        <div className="empty-canvas-arrow">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 5L19 12L12 19" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export const EmptyTimeline: React.FC = () => {
  return (
    <div className="empty-timeline">
      <svg className="empty-timeline-icon" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
      </svg>
      <p className="empty-timeline-text">Timeline will appear after analysis</p>
    </div>
  );
};
