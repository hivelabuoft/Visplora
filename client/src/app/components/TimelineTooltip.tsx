'use client';

import React from 'react';

interface TimelineNode {
  node_id: number;
  sentence_id: string;
  sentence_content: string;
  parent_id: string;
  child_ids: string[];
  activeChild?: string | null;
  changed_from_previous: {
    drift_types: string[];
    severity: string;
    dimensions: Record<string, string>;
  } | null;
  hover: {
    title: string;
    reflect: Array<{
      prompt: string;
      reason: string;
      related_sentence: {
        node_id: number;
        sentence_content: string;
      } | null;
    }>;
  };
}

interface DriftType {
  id: string;
  label: string;
  shape: string;
  color: string;
  description: string;
}

interface TimelineTooltipProps {
  node: TimelineNode;
  driftType: DriftType;
}

export const TimelineTooltip: React.FC<TimelineTooltipProps> = ({ node, driftType }) => {
  // Debug logging to see what data we have
  console.log('🔍 TimelineTooltip node data:', {
    sentence_id: node.sentence_id,
    changed_from_previous: node.changed_from_previous,
    dimensions: node.changed_from_previous?.dimensions
  });

  const truncatedSentence = node.sentence_content.length > 100 
    ? node.sentence_content.substring(0, 100) + "..." 
    : node.sentence_content;

  const dimensionChanges = node.changed_from_previous?.dimensions || {};
  const hasDimensionChanges = Object.keys(dimensionChanges).length > 0;
  const reflectionsCount = node.hover?.reflect?.length || 0;

  console.log('🔍 Dimensions found:', dimensionChanges, 'Has changes:', hasDimensionChanges);

  return (
    <div style={{
      maxWidth: '320px',
      padding: '12px',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: '13px',
      lineHeight: '1.4',
      color: '#374151'
    }}>
      {/* Sentence content with completed-sentence class */}
      <div 
        className="completed-sentence"
        style={{
          marginBottom: '8px',
          fontWeight: '500'
        }}
      >
        {truncatedSentence}
      </div>

      {/* Dimension changes - show if available */}
      {hasDimensionChanges && (
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '8px',
          marginBottom: '8px'
        }}>
          <div style={{ 
            fontWeight: '600', 
            marginBottom: '4px',
            color: '#4b5563'
          }}>
            Changes:
          </div>
          {Object.entries(dimensionChanges).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '2px' }}>
              <span style={{ fontWeight: '500' }}>{key}:</span> {value}
            </div>
          ))}
        </div>
      )}
      
      {/* No dimensions message */}
      {!hasDimensionChanges && (
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '8px',
          marginBottom: '8px',
          fontStyle: 'italic'
        }}>
          No dimension changes detected
        </div>
      )}

      {/* Reflection and interaction info */}
      <div style={{
        fontSize: '11px',
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {reflectionsCount} reflection{reflectionsCount !== 1 ? 's' : ''}
        </span>
        <span style={{ fontStyle: 'italic' }}>
          Click node for details
        </span>
      </div>
    </div>
  );
};
