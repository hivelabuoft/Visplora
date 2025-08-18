'use client';

import React, { useState } from 'react';
import '../../utils/semantic-spans.css';

// Loading spinner component
const LoadingSpinner: React.FC = () => {
  return (
    <div 
      className="spinner"
      style={{
        display: 'inline-block',
        width: '20px',
        height: '20px',
        border: '2px solid #e5e7eb',
        borderRadius: '50%',
        borderTopColor: '#0891b2',
        marginRight: '12px'
      }}
    />
  );
};

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
    dataDrivenSummary?: string; // Optional property for the generated summary
  };
}

interface ReflectionModalProps {
  node: TimelineNode;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number } | null;
  isSummaryLoading?: boolean;
}

interface ReflectionItemProps {
  item: any;
  index: number;
}

const ReflectionItem: React.FC<ReflectionItemProps> = ({ item, index }) => {
  const [showReasoning, setShowReasoning] = useState(false);

  // Handle both old string format and new object format
  if (typeof item === 'string') {
    return (
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '12px 16px',
        margin: '8px 0',
        borderRadius: '8px',
        borderLeft: '4px solid #059669',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#374151'
      }}>
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          marginBottom: '6px',
          fontWeight: '600'
        }}>
          #{index + 1}
        </div>
        {item}
      </div>
    );
  }

  if (item && typeof item === 'object' && item.prompt) {
    return (
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '12px 16px',
        margin: '8px 0',
        borderRadius: '8px',
        borderLeft: '4px solid #059669',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#374151'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            fontWeight: '600'
          }}>
            #{index + 1}
          </div>
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            style={{
              background: 'none',
              border: 'none',
              color: showReasoning ? '#059669' : '#6b7280',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {showReasoning ? 'Hide' : 'Why?'}
          </button>
        </div>

        <div style={{ marginBottom: '6px' }}>
          {item.prompt}
        </div>

        {showReasoning && (
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            fontStyle: 'italic',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #e5e7eb'
          }}>
            {item.reason}
          </div>
        )}

        {item.related_sentence && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#4b5563'
          }}>
            <strong>Related:</strong> "{item.related_sentence.sentence_content}"
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#fef2f2',
      padding: '12px 16px',
      margin: '8px 0',
      borderRadius: '8px',
      borderLeft: '4px solid #ef4444',
      fontSize: '14px',
      color: '#991b1b'
    }}>
      Invalid reflection item format
    </div>
  );
};

export const ReflectionModal: React.FC<ReflectionModalProps> = ({ node, isOpen, onClose, position, isSummaryLoading = false }) => {
  if (!isOpen) return null;

  const reflectItems = node.hover?.reflect || [];

  // Calculate positioning with viewport boundaries
  const calculatePosition = (pos: { x: number; y: number }) => {
    const panelWidth = 400;
    const panelHeight = Math.min(window.innerHeight * 0.6, 500); // Max 60vh or 500px
    const padding = 20; // Minimum distance from screen edges

    let left = pos.x + 50; // Default: to the right of the node
    let top = Math.max(padding, pos.y - 100); // Default: above the node

    // Check if panel would go off the right edge
    if (left + panelWidth > window.innerWidth - padding) {
      left = pos.x - panelWidth - 50; // Position to the left of the node
    }

    // If still off-screen to the left, position at left edge with padding
    if (left < padding) {
      left = padding;
    }

    // Check if panel would go off the bottom edge
    if (top + panelHeight > window.innerHeight - padding) {
      top = window.innerHeight - panelHeight - padding;
    }

    // If still off-screen at top, position at top edge with padding
    if (top < padding) {
      top = padding;
    }

    return { left, top };
  };

  // Calculate positioning - default to center if no position provided
  const panelStyle: React.CSSProperties = position 
    ? (() => {
        const { left, top } = calculatePosition(position);
        return {
          position: 'fixed',
          left: `${left}px`,
          top: `${top}px`,
          maxWidth: '400px',
          maxHeight: '60vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #d1d5db',
          overflow: 'hidden',
          zIndex: 1000,
          transform: 'none'
        };
      })()
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '400px',
        maxHeight: '60vh',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        border: '1px solid #d1d5db',
        overflow: 'hidden',
        zIndex: 1000
      };

  return (
    <>
      {/* Light overlay only if positioned in center (fallback) */}
      {!position && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999
          }}
          onClick={onClose}
        />
      )}
      
      {/* Click-away area for positioned panel */}
      {position && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998,
            background: 'transparent'
          }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div style={panelStyle}>
        {/* Content - No Header */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          maxHeight: '60vh'
        }}>
          {/* Close button moved to summary section */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: '1',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  zIndex: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#6b7280';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                ×
              </button>
          {/* Data-Driven Summary Section */}
          {(node.hover?.dataDrivenSummary || isSummaryLoading) && (
            <div style={{
              backgroundColor: '#fefefe',
              padding: '20px',
              margin: '0 0 20px 0',
              position: 'relative'
            }}>
              
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#0891b2',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                letterSpacing: '0.025em',
                textTransform: 'uppercase' as const
              }}>
                Data-Driven Summary
              </div>
              
              {isSummaryLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingRight: '32px',
                  minHeight: '60px'
                }}>
                  <LoadingSpinner />
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    Analyzing insights...
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: '15px',
                  lineHeight: '1.7',
                  color: '#1f2937',
                  fontWeight: '400',
                  paddingRight: '32px' // Account for close button
                }}
                dangerouslySetInnerHTML={{ __html: node.hover.dataDrivenSummary || '' }}
                />
              )}
            </div>
          )}
          
          {/* Reflections Section */}
          {reflectItems.length > 0 && (
            <>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                letterSpacing: '0.025em',
                textTransform: 'uppercase' as const
              }}>
                Reflections ({reflectItems.length})
              </div>
              {reflectItems.map((item: any, index: number) => (
                <ReflectionItem key={index} item={item} index={index} />
              ))}
            </>
          )}
          
          {/* If only summary section exists without reflections, still show close button */}
          {reflectItems.length === 0 && (node.hover?.dataDrivenSummary || isSummaryLoading) && (
            <div />
          )}
          
          {/* Fallback for no content */}
          {reflectItems.length === 0 && !node.hover?.dataDrivenSummary && !isSummaryLoading && (
            <div style={{
              color: '#6b7280',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '32px 16px',
              fontSize: '14px'
            }}>
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: '1',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#6b7280';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                ×
              </button>
              No analysis data available
            </div>
          )}
        </div>
      </div>
    </>
  );
};
