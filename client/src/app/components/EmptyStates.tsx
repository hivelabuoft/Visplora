'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import '../../styles/dataExplorer.css';
import { ReactFlowTimeline } from './ReactFlowTimeline';

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
        </p>
      </div>
    </div>
  );
};

export const EmptyDashboard: React.FC = () => {
  return (
    <div className="empty-dashboard">
      <div className="empty-dashboard-content">
        <svg className="empty-dashboard-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
        <p className="empty-dashboard-text">No dashboard items to display</p>
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

// Interface for timeline visualization
interface TimelineVisualizationProps {
  nodes: {
    node_id: number;
    sentence_id: string;
    sentence_content: string;
    parent_id: string;
    child_ids: string[];
    changed_from_previous: {
      drift_types: string[];
      severity: string;
      dimensions: Record<string, string>;
    } | null;
    hover: {
      title: string;
      source: any;
      reflect: Array<{
        prompt: string;
        reason: string;
        related_sentence: {
          node_id: number;
          sentence_content: string;
        } | null;
      }>;
    };
  }[];
  pageId: string;
  activePath?: string[]; // Active path for highlighting
  isLoading?: boolean; // Loading state for LLM processing
  onPathSwitch?: (nodeId: string, newActivePath: string[]) => void; // Add callback for path switching
  onNodeHighlight?: (sentenceContent: string) => void; // NEW: Callback to highlight sentence in narrative layer
}

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({ nodes, pageId, activePath = [], isLoading = false, onPathSwitch, onNodeHighlight }) => {
  // Use React Flow for better zoom/pan control and automatic layout management
  return (
    <div className="h-full w-full">
      <ReactFlowTimeline 
        nodes={nodes}
        pageId={pageId}
        activePath={activePath}
        isLoading={isLoading}
        onPathSwitch={onPathSwitch}
        onNodeHighlight={onNodeHighlight}
      />
    </div>
  );
};
