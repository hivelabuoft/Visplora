'use client';

import React, { useCallback, useEffect, useImperativeHandle, forwardRef, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  Node,
  NodeResizer,
  ReactFlowInstance,
} from '@xyflow/react';
import { VegaLite } from 'react-vega';

import '@xyflow/react/dist/style.css';

// Add CSS animations for ViewGenerator node selection effects
const viewGeneratorStyles = `
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 12px 35px rgba(8, 145, 178, 0.4), 0 0 0 4px rgba(8, 145, 178, 0.3);
    }
    50% {
      box-shadow: 0 16px 45px rgba(8, 145, 178, 0.6), 0 0 0 6px rgba(8, 145, 178, 0.4);
    }
  }
  
  @keyframes pulse-border {
    0%, 100% {
      opacity: 0.15;
      transform: scale(1);
    }
    50% {
      opacity: 0.25;
      transform: scale(1.005);
    }
  }
  
  @keyframes pulse-outer-ring {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.1;
      transform: scale(1.01);
    }
  }
  
  @keyframes badge-pulse {
    0%, 100% {
      box-shadow: 0 2px 4px rgba(8, 145, 178, 0.3);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 4px 8px rgba(8, 145, 178, 0.5);
      transform: scale(1.05);
    }
  }
  
  .view-generator-node-selected {
    filter: brightness(1.05) saturate(1.1);
  }
`;

// Inject the styles into the document head
if (typeof document !== 'undefined' && !document.querySelector('#view-generator-animations')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'view-generator-animations';
  styleElement.innerHTML = viewGeneratorStyles;
  document.head.appendChild(styleElement);
}

// Dynamically import ViewGenerator to avoid SSR issues
const ViewGenerator = dynamic(() => import('../viewGenerator/page'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading ViewGenerator...</div>
});
import dynamic from 'next/dynamic';

// Utility function to calculate non-overlapping positions
interface NodeDimensions {
  width: number;
  height: number;
}

interface ExistingNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

const getNodeDimensions = (nodeType: string): NodeDimensions => {
  switch (nodeType) {
    case 'infoNode':
      return { width: 520, height: 400 }; // Max size for visualization plans
    case 'vegaChartNode':
      return { width: 400, height: 300 };
    case 'vegaDashboardNode':
      return { width: 600, height: 500 };
    case 'viewGeneratorNode':
      return { width: 1400, height: 600 }; // Start at 1400px width
    case 'dashboardNode':
      return { width: 1200, height: 1000 }; // London dashboard default
    default:
      return { width: 300, height: 200 };
  }
};

const findNonOverlappingPosition = (
  existingNodes: ExistingNode[],
  newNodeDimensions: NodeDimensions,
  canvasWidth: number = 2000,
  canvasHeight: number = 1500,
  margin: number = 80
): { x: number; y: number } => {
  const { width: nodeWidth, height: nodeHeight } = newNodeDimensions;
  
  // Try a grid-based approach first, but with larger spacing
  const gridSpacingX = Math.max(nodeWidth + margin * 2, 400);
  const gridSpacingY = Math.max(nodeHeight + margin * 2, 300);
  
  // Start from top-left and work systematically
  for (let row = 0; row < Math.ceil(canvasHeight / gridSpacingY); row++) {
    for (let col = 0; col < Math.ceil(canvasWidth / gridSpacingX); col++) {
      const x = col * gridSpacingX + margin;
      const y = row * gridSpacingY + margin;
      
      // Check if this position would fit within canvas bounds
      if (x + nodeWidth + margin > canvasWidth || y + nodeHeight + margin > canvasHeight) {
        continue;
      }
      
      // Check for overlaps with existing nodes (with extra margin)
      const hasOverlap = existingNodes.some(existing => {
        const overlapX = x < existing.x + existing.width + margin * 2 && 
                       x + nodeWidth + margin * 2 > existing.x;
        const overlapY = y < existing.y + existing.height + margin * 2 && 
                       y + nodeHeight + margin * 2 > existing.y;
        return overlapX && overlapY;
      });
      
      if (!hasOverlap) {
        console.log(`📍 Found position for node: x=${x}, y=${y} (grid: ${col},${row})`);
        return { x, y };
      }
    }
  }
  
  // Fallback: position to the right of all existing nodes with large spacing
  const maxX = existingNodes.reduce((max, node) => Math.max(max, node.x + node.width), 0);
  const fallbackX = maxX + margin * 3;
  const fallbackY = margin;
  
  console.log(`📍 Using fallback position: x=${fallbackX}, y=${fallbackY}`);
  return { x: fallbackX, y: fallbackY };
};

// Data interfaces for AI-generated chart nodes
export interface VegaChartData {
  title: string;
  vegaLiteSpec: object;
  chartData?: any;
  dataSource?: string;
  onInteraction?: (name: string, value: any) => void;
  isGreyedOut?: boolean;
}

export interface VegaDashboardData {
  dashboardTitle: string;
  views: Array<{
    description: string;
    vegaLiteSpec: object;
    chartData?: any;
  }>;
  insightPanels?: string[];
  datasetRecommendations?: string[];
  onInteraction?: (chartIndex: number, name: string, value: any) => void;
  isGreyedOut?: boolean;
}

// Interface for ViewGenerator data (from _data_output.json format - DemoChart structure)
export interface ViewGeneratorData {
  sentence_id: number;
  charts: Array<{
    id: string;
    name: string;
    request: any;
    chartSpec: any;
    vegaSpec: any;
    generationTime: number;
    success: boolean;
    error: string | null;
  }>;
  onInteraction?: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => void;
  isGreyedOut?: boolean;
}

// Expose methods for parent components to interact with the canvas
export interface ReactFlowCanvasRef {
  addInfoNode: (data: { title: string; content: string }) => void;
  hasActiveInfoNode: () => boolean;
  showLoadingState: (message?: string) => void;
  clearAllNodes: () => void;
  hideLoadingState: () => void;
  // NEW: AI-generated chart support
  addVegaChartNode: (data: VegaChartData) => void;
  addVegaDashboardNode: (data: VegaDashboardData) => void;
  // NEW: ViewGenerator support
  addViewGeneratorNode: (data: ViewGeneratorData, skipAutoZoom?: boolean) => void;
  // NEW: Direct ReactFlow control
  fitViewToAllNodes: () => void;
  hasViewGeneratorNode: (sentenceId: number) => boolean; // NEW: Check if ViewGenerator node exists by sentence ID
  selectAndZoomToViewGeneratorNode: (sentenceId: number) => boolean; // NEW: Select and zoom to ViewGenerator node by sentence ID
  // NEW: Load ViewGenerator nodes from output file
  loadViewGeneratorNodesFromOutput: (filePath?: string) => Promise<void>;
}

// Custom node component for info nodes
const InfoNode: React.FC<{ data: any; selected?: boolean }> = ({ data, selected }) => {
  const handleClose = () => {
    // Find the parent ReactFlow instance and remove this node
    const nodeElement = document.querySelector(`[data-id="${data.nodeId}"]`);
    if (nodeElement) {
      // Trigger a custom event that the parent component can listen to
      const closeEvent = new CustomEvent('closeInfoNode', { 
        detail: { nodeId: data.nodeId } 
      });
      window.dispatchEvent(closeEvent);
    }
  };

  // Determine if this is a detailed visualization plan
  const isVisualizationPlan = data.title === 'Visualization Plan';
  const nodeWidth = isVisualizationPlan ? '520px' : '420px';
  const nodeHeight = isVisualizationPlan ? '400px' : '320px';

  return (
    <div className="info-node-wrapper" style={{ position: 'relative', zIndex: 1000 }}>
      <div className="info-node" style={{
        background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: '12px',
        padding: '0',
        width: nodeWidth,
        height: nodeHeight,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Subtle top accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #64748b, #94a3b8, #cbd5e1)',
          borderRadius: '12px 12px 0 0',
        }} />

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: 'auto',
            height: '28px',
            padding: '0 12px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '600',
            zIndex: 1001,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'scale(1.05)';
            target.style.background = 'linear-gradient(135deg, #b91c1c, #991b1b)';
            target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'scale(1)';
            target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
            target.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
          }}
          title="Close info panel"
        >
          Close
        </button>

        {/* Compact Header */}
        <div className="info-node-header" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px 8px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#475569',
          paddingRight: '40px', // Make room for close button
          background: 'rgba(248, 250, 252, 0.8)',
          borderBottom: '1px solid rgba(203, 213, 225, 0.4)',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: 'linear-gradient(135deg, #64748b, #475569)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px',
            fontSize: '12px',
          }}>
            📊
          </div>
          <span style={{
            color: '#334155',
          }}>
            {data.title || 'Analysis Result'}
          </span>
        </div>

        {/* Content - Conditional scrolling for detailed plans */}
        <div className="info-node-content" style={{
          fontSize: '13px',
          color: '#64748b',
          lineHeight: '1.5',
          flex: 1,
          overflow: isVisualizationPlan ? 'auto' : 'hidden', // Allow scrolling for detailed plans
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
          {/* Custom scrollbar styles for detailed plans */}
          {isVisualizationPlan && (
            <style>{`
              .info-node-content::-webkit-scrollbar {
                width: 6px;
              }
              .info-node-content::-webkit-scrollbar-track {
                background: rgba(241, 245, 249, 0.5);
                border-radius: 3px;
              }
              .info-node-content::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #cbd5e1, #94a3b8);
                border-radius: 3px;
              }
              .info-node-content::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #94a3b8, #64748b);
              }
            `}</style>
          )}
          {data.content ? (
            <div style={{ 
              letterSpacing: '0.01em',
              textAlign: 'left',
              height: '100%', // Fill available space
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {data.content.split('\n\n').slice(0, isVisualizationPlan ? undefined : 3).map((paragraph: string, index: number) => ( // No limit for visualization plans
                <div key={index}>
                  {paragraph.split('\n').map((line: string, lineIndex: number) => {
                    // Style different types of content with muted colors
                    if (line.startsWith('Sentence:')) {
                      return (
                        <div key={lineIndex} style={{
                          fontWeight: '600',
                          color: '#334155',
                          marginBottom: '6px',
                          padding: '6px 10px',
                          background: 'rgba(148, 163, 184, 0.1)',
                          borderLeft: '2px solid #94a3b8',
                          borderRadius: '0 4px 4px 0',
                          fontSize: '12px',
                        }}>
                          {line}
                        </div>
                      );
                    } else if (line.startsWith('Supported:')) {
                      const isSupported = line.includes('Yes');
                      return (
                        <div key={lineIndex} style={{
                          fontWeight: '600',
                          color: isSupported ? '#059669' : '#dc2626',
                          marginBottom: '6px',
                          padding: '4px 8px',
                          background: isSupported ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                          borderRadius: '4px',
                          display: 'inline-block',
                          fontSize: '12px',
                        }}>
                          {isSupported ? '✓ ' : '✗ '}{line}
                        </div>
                      );
                    } else if (line.startsWith('📊 VISUALIZATION STRATEGY:') || line.startsWith('📈 RECOMMENDED VIEWS') || line.startsWith('💾 DATASETS NEEDED:')) {
                      return (
                        <div key={lineIndex} style={{
                          fontWeight: '700',
                          color: '#1e293b',
                          marginTop: '8px',
                          marginBottom: '4px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {line}
                        </div>
                      );
                    } else if (line.match(/^\d+\.\s+[A-Z\s]+$/)) {
                      // Chart type headers (e.g., "1. BAR CHART")
                      return (
                        <div key={lineIndex} style={{
                          fontWeight: '600',
                          color: '#3b82f6',
                          marginTop: '6px',
                          marginBottom: '3px',
                          fontSize: '12px',
                          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                          paddingBottom: '2px',
                        }}>
                          {line}
                        </div>
                      );
                    } else if (line.trim().startsWith('Description:') || line.trim().startsWith('Data:') || line.trim().startsWith('Analysis:') || line.trim().startsWith('Interactions:') || line.trim().startsWith('Purpose:')) {
                      // View details
                      return (
                        <div key={lineIndex} style={{
                          fontSize: '11px',
                          color: '#64748b',
                          marginLeft: '8px',
                          marginBottom: '2px',
                          lineHeight: '1.4',
                        }}>
                          <span style={{ fontWeight: '600', color: '#475569' }}>
                            {line.split(':')[0]}:
                          </span>
                          <span style={{ marginLeft: '4px' }}>
                            {line.split(':').slice(1).join(':').trim()}
                          </span>
                        </div>
                      );
                    } else if (line.startsWith('Explanation:')) {
                      return (
                        <div key={lineIndex} style={{
                          fontWeight: '600',
                          color: '#64748b',
                          marginBottom: '3px',
                          fontSize: '12px',
                        }}>
                          {line}
                        </div>
                      );
                    } else if (line.trim()) {
                      return (
                        <div key={lineIndex} style={{
                          marginBottom: lineIndex < paragraph.split('\n').length - 1 ? '3px' : '0',
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {line.length > 150 ? line.substring(0, 150) + '...' : line}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              color: '#94a3b8',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '20px',
              fontSize: '12px',
            }}>
              No content available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom node component for the dashboard
const DashboardNode: React.FC<{ data: any; selected?: boolean }> = ({ data, selected }) => {
  const config = data.config || {};
  
  return (
    <div className="dashboard-node-wrapper" style={{ position: 'relative' }}>
      {selected && (
        <NodeResizer 
          color="#0891b2" 
          isVisible={true} 
          minWidth={config.minWidth || 400} 
          minHeight={config.minHeight || 300}
          maxWidth={config.maxWidth || 1500}
          maxHeight={config.maxHeight || 1200}
          handleStyle={{ width: '12px', height: '12px' }}
          lineStyle={{ borderWidth: 2 }}
        />
      )}
      <div className="dashboard-node" style={{
        opacity: data.isGreyedOut ? 0.3 : 1,
        transition: 'opacity 0.3s ease',
        pointerEvents: data.isGreyedOut ? 'none' : 'auto',
      }}>
        <div className="dashboard-node-content" style={{pointerEvents: 'auto'}}>
          {data.dashboardComponent}
        </div>
      </div>
    </div>
  );
};

// Custom node component for AI-generated single Vega-Lite charts
const VegaChartNode: React.FC<{ data: any; selected?: boolean }> = ({ data, selected }) => {
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    // TODO: Implement chart export functionality
    console.log('Exporting chart:', data.title);
  };

  const handleInteraction = (name: string, value: any) => {
    // Handle Vega-Lite interactions (selections, filters, etc.)
    console.log('Chart interaction:', name, value);
    if (data.onInteraction) {
      data.onInteraction(name, value);
    }
  };

  return (
    <div
      className="vega-chart-node"
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: selected ? '2px solid #0891b2' : '2px solid #e2e8f0',
        minWidth: '400px',
        minHeight: '300px',
        opacity: data.isGreyedOut ? 0.3 : 1,
        transition: 'opacity 0.3s ease',
        pointerEvents: data.isGreyedOut ? 'none' : 'auto',
        zIndex: 2, // Ensure chart is above overlays
      }}
    >
      {selected && (
        <NodeResizer
          color="#0891b2"
          isVisible={true}
          minWidth={400}
          minHeight={300}
          maxWidth={800}
          maxHeight={600}
          handleStyle={{ width: '12px', height: '12px', pointerEvents: 'none' }}
          lineStyle={{ borderWidth: 2, pointerEvents: 'none' }}
        />
      )}

      {/* Chart Header */}
      <div className="chart-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(90deg, #f8fafc, #f1f5f9)',
        borderRadius: '12px 12px 0 0',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: '#334155',
        }}>
          {data.title || 'AI-Generated Chart'}
        </h3>
        <button
          onClick={handleExport}
          style={{
            background: '#0891b2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Export
        </button>
      </div>

      {/* Chart Container */}
      <div
        className="chart-container"
        style={{
          padding: '16px',
          height: 'calc(100% - 80px)',
          overflow: 'hidden',
          pointerEvents: 'auto', // Always allow pointer events for chart
          zIndex: 3, // Above overlays
        }}
      >
        {error ? (
          <div style={{
            color: '#dc2626',
            textAlign: 'center',
            padding: '20px',
            fontSize: '14px',
          }}>
            ⚠️ Error rendering chart: {error}
          </div>
        ) : data.vegaLiteSpec ? (
          <VegaLite
            spec={data.vegaLiteSpec}
            data={data.chartData}
            actions={false}
            onNewView={(view: any) => {
              // Handle Vega view interactions
              if (view && view.addSignalListener) {
                view.addSignalListener('*', handleInteraction);
              }
            }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div style={{
            color: '#64748b',
            textAlign: 'center',
            padding: '40px 20px',
            fontSize: '14px',
          }}>
            📊 Chart specification not available
          </div>
        )}
      </div>

      {/* Chart Footer */}
      <div className="chart-footer" style={{
        padding: '8px 16px',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc',
        borderRadius: '0 0 12px 12px',
        fontSize: '12px',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>📁 {data.dataSource || 'Unknown dataset'}</span>
        <span>🤖 AI Generated</span>
      </div>
    </div>
  );
};

// Custom node component for AI-generated multi-chart dashboards
const VegaDashboardNode: React.FC<{ data: any; selected?: boolean }> = ({ data, selected }) => {
  const [errors, setErrors] = useState<{ [key: number]: string }>({});

  const handleChartError = (index: number, error: string) => {
    setErrors(prev => ({ ...prev, [index]: error }));
  };

  const handleChartInteraction = (index: number, name: string, value: any) => {
    console.log('Dashboard chart interaction:', index, name, value);
    if (data.onInteraction) {
      data.onInteraction(index, name, value);
    }
  };

  const gridColumns = data.views?.length <= 2 ? 1 : 2;
  const gridRows = Math.ceil((data.views?.length || 0) / gridColumns);

  return (
    <div
      className="vega-dashboard-node"
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: selected ? '2px solid #0891b2' : '2px solid #e2e8f0',
        minWidth: '600px',
        minHeight: '500px',
        opacity: data.isGreyedOut ? 0.3 : 1,
        transition: 'opacity 0.3s ease',
        pointerEvents: data.isGreyedOut ? 'none' : 'auto',
        zIndex: 2, // Ensure dashboard is above overlays
      }}
    >
      {selected && (
        <NodeResizer
          color="#0891b2"
          isVisible={true}
          minWidth={600}
          minHeight={500}
          maxWidth={1200}
          maxHeight={1000}
          handleStyle={{ width: '12px', height: '12px', pointerEvents: 'none' }}
          lineStyle={{ borderWidth: 2, pointerEvents: 'none' }}
        />
      )}

      {/* Dashboard Header */}
      <div className="dashboard-header" style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(90deg, #f8fafc, #f1f5f9)',
        borderRadius: '12px 12px 0 0',
      }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '20px',
          fontWeight: '700',
          color: '#1e293b',
        }}>
          {data.dashboardTitle || 'AI-Generated Dashboard'}
        </h2>

        {/* Insight Panels */}
        {data.insightPanels && data.insightPanels.length > 0 && (
          <div className="insight-panels" style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '8px',
          }}>
            {data.insightPanels.map((insight: string, index: number) => (
              <div key={index} style={{
                background: 'rgba(8, 145, 178, 0.1)',
                color: '#0891b2',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                border: '1px solid rgba(8, 145, 178, 0.2)',
              }}>
                💡 {insight}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div
        className="charts-grid"
        style={{
          padding: '16px',
          height: 'calc(100% - 100px)',
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gap: '12px',
          overflow: 'auto',
          pointerEvents: 'auto', // Always allow pointer events for charts
          zIndex: 3, // Above overlays
        }}
      >
        {data.views && data.views.length > 0 ? (
          data.views.map((view: any, index: number) => (
            <div key={index} className="chart-cell" style={{
              background: '#fafafa',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
              }}>
                {view.description || `Chart ${index + 1}`}
              </h4>

              <div style={{ flex: 1, minHeight: '150px' }}>
                {errors[index] ? (
                  <div style={{
                    color: '#dc2626',
                    textAlign: 'center',
                    padding: '20px',
                    fontSize: '12px',
                  }}>
                    ⚠️ {errors[index]}
                  </div>
                ) : view.vegaLiteSpec ? (
                  <VegaLite
                    spec={{
                      ...view.vegaLiteSpec,
                      // Override width and height to make charts responsive within their grid cells
                      width: 'container',
                      height: 'container',
                      autosize: {
                        type: 'fit',
                        contains: 'padding'
                      }
                    }}
                    data={view.chartData}
                    actions={false}
                    onNewView={(vegaView: any) => {
                      // Handle Vega view interactions for this specific chart
                      if (vegaView && vegaView.addSignalListener) {
                        vegaView.addSignalListener('*', (name: string, value: any) =>
                          handleChartInteraction(index, name, value)
                        );
                      }
                    }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <div style={{
                    color: '#64748b',
                    textAlign: 'center',
                    padding: '20px',
                    fontSize: '12px',
                  }}>
                    📊 Chart not available
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{
            gridColumn: '1 / -1',
            color: '#64748b',
            textAlign: 'center',
            padding: '40px',
            fontSize: '14px',
          }}>
            📊 No charts available in this dashboard
          </div>
        )}
      </div>

      {/* Dashboard Footer */}
      <div className="dashboard-footer" style={{
        padding: '8px 20px',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc',
        borderRadius: '0 0 12px 12px',
        fontSize: '12px',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>📊 {data.views?.length || 0} charts • {data.datasetRecommendations?.join(', ') || 'Multiple datasets'}</span>
        <span>🤖 AI Generated Dashboard</span>
      </div>
    </div>
  );
};

// Custom node component for ViewGenerator (example2_data.json format)
const ViewGeneratorNode: React.FC<{ data: any; selected?: boolean }> = ({ data, selected }) => {
  const [error, setError] = useState<string | null>(null);
  const [gridConfig, setGridConfig] = useState<{columns: number, rows: number} | null>(null);

  const handleError = (error: any) => {
    console.error('ViewGenerator error:', error);
    setError(error.message || 'Unknown error occurred');
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    console.log(`🎯 ViewGenerator node clicked for sentence ${data.sentence_id}`);
    
    // Call the onNodeClick callback if provided
    if (data.onNodeClick) {
      data.onNodeClick(data.sentence_id, data.nodeId);
    }
    
    // Note: We don't stop event propagation here to allow ReactFlow's selection to work
  };

  const handleReduceColumns = () => {
    setGridConfig(prev => {
      const currentCols = prev?.columns || 8; // Default from travel-dashboard
      const newCols = Math.max(2, currentCols - 1); // Don't go below 2 for usability
      console.log(`🔄 Reducing columns from ${currentCols} to ${newCols}`);
      return { ...prev, columns: newCols, rows: prev?.rows || 8 };
    });
  };

  const handleReduceRows = () => {
    setGridConfig(prev => {
      const currentRows = prev?.rows || 8; // Default from travel-dashboard
      const newRows = Math.max(2, currentRows - 1); // Don't go below 2 for usability
      console.log(`🔄 Reducing rows from ${currentRows} to ${newRows}`);
      return { ...prev, columns: prev?.columns || 8, rows: newRows };
    });
  };

  // Get current grid dimensions for button display
  const currentCols = gridConfig?.columns || 8;
  const currentRows = gridConfig?.rows || 8;

  return (
    <div
      className={`view-generator-node ${selected ? 'view-generator-node-selected' : ''}`}
      onClick={handleNodeClick}
      style={{
        position: 'relative',
        background: selected 
          ? 'linear-gradient(145deg, #f0f9ff, #e0f2fe)' 
          : 'white',
        borderRadius: '12px',
        boxShadow: selected 
          ? '0 12px 35px rgba(8, 145, 178, 0.4), 0 0 0 4px rgba(8, 145, 178, 0.3)' 
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: selected 
          ? '3px solid #0891b2' 
          : '2px solid #e2e8f0',
        minWidth: '800px',
        minHeight: '300px',
        opacity: data.isGreyedOut ? 0.3 : 1,
        transition: 'all 0.3s ease',
        transform: selected ? 'scale(1.03)' : 'scale(1)',
        pointerEvents: data.isGreyedOut ? 'none' : 'auto',
        zIndex: selected ? 15 : 2,
        cursor: 'pointer',
        animation: selected ? 'pulse-glow 2s ease-in-out infinite' : 'none',
      }}
    >
      {selected && (
        <NodeResizer
          color="#0891b2"
          isVisible={true}
          minWidth={800}
          minHeight={300}
          maxWidth={2000}
          maxHeight={1200}
          handleStyle={{ width: '12px', height: '12px', pointerEvents: 'none' }}
          lineStyle={{ borderWidth: 3, pointerEvents: 'none' }}
        />
      )}

      {/* Enhanced Selection Glow Effect */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            right: '-8px',
            bottom: '-8px',
            background: 'linear-gradient(45deg, #0891b2, #06b6d4, #0891b2)',
            borderRadius: '20px',
            opacity: 0.15,
            pointerEvents: 'none',
            zIndex: -1,
            animation: 'pulse-border 3s ease-in-out infinite',
          }}
        />
      )}

      {/* Outer glow ring for selected state */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '-12px',
            right: '-12px',
            bottom: '-12px',
            border: '2px solid rgba(8, 145, 178, 0.2)',
            borderRadius: '24px',
            pointerEvents: 'none',
            zIndex: -2,
            animation: 'pulse-outer-ring 4s ease-in-out infinite',
          }}
        />
      )}

      {/* ViewGenerator Header */}
      <div className="view-generator-header" style={{
        padding: '20px 24px', // Increased padding for bigger appearance
        borderBottom: selected ? '3px solid #0891b2' : '2px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: selected 
          ? 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 50%, #91d5ff 100%)' 
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        borderRadius: '12px 12px 0 0',
        transition: 'all 0.3s ease',
        boxShadow: selected 
          ? '0 4px 12px rgba(8, 145, 178, 0.15)' 
          : '0 2px 8px rgba(0, 0, 0, 0.05)',
        minHeight: '72px', // Ensure minimum height for bigger appearance
      }}>
        <h3 style={{
          margin: 0,
          fontSize: selected ? '22px' : '20px', // Increased font sizes
          fontWeight: selected ? '800' : '700', // Bolder weights
          color: selected ? '#0369a1' : '#1e293b', // Stronger colors
          transition: 'all 0.3s ease',
          textShadow: selected ? '0 2px 4px rgba(3, 105, 161, 0.2)' : '0 1px 2px rgba(30, 41, 59, 0.1)',
          letterSpacing: '0.5px', // Add letter spacing for more presence
        }}>
          📊 Sentence #{data.sentence_id}
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px', // Increased gap for better spacing
          fontSize: '13px', // Slightly larger
          color: selected ? '#0369a1' : '#64748b',
          transition: 'all 0.3s ease',
        }}>
          {/* Grid Control Buttons - Subtle Design */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReduceColumns();
            }}
            disabled={currentCols <= 2}
            style={{
              background: currentCols <= 2 ? '#f3f4f6' : '#f9fafb',
              color: currentCols <= 2 ? '#9ca3af' : '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: currentCols <= 2 ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              opacity: currentCols <= 2 ? 0.5 : 0.8,
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={(e) => {
              if (currentCols > 2) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (currentCols > 2) {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
            title={`Remove column from right (${currentCols} cols)`}
          >
            ← {currentCols}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReduceRows();
            }}
            disabled={currentRows <= 2}
            style={{
              background: currentRows <= 2 ? '#f3f4f6' : '#f9fafb',
              color: currentRows <= 2 ? '#9ca3af' : '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: currentRows <= 2 ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              opacity: currentRows <= 2 ? 0.5 : 0.8,
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={(e) => {
              if (currentRows > 2) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (currentRows > 2) {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
            title={`Remove row from bottom (${currentRows} rows)`}
          >
            ↑ {currentRows}
          </button>
          {selected && (
            <span style={{
              backgroundColor: '#0891b2',
              color: 'white',
              padding: '6px 12px', // Larger padding
              borderRadius: '8px', // More rounded
              fontSize: '12px', // Slightly larger
              fontWeight: '700',
              letterSpacing: '0.8px', // More spacing
              boxShadow: '0 3px 8px rgba(8, 145, 178, 0.4), 0 1px 3px rgba(8, 145, 178, 0.2)',
              animation: 'badge-pulse 2s ease-in-out infinite',
              textTransform: 'uppercase',
            }}>
              ✓ ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* ViewGenerator Content */}
      <div
        className="view-generator-content"
        style={{
          padding: '0',
          height: 'calc(100% - 72px)', // Adjusted for bigger header (72px min-height)
          overflow: 'auto',
          pointerEvents: 'auto',
          zIndex: 3,
        }}
      >
        {error ? (
          <div style={{
            color: '#dc2626',
            textAlign: 'center',
            padding: '40px 20px',
            fontSize: '14px',
          }}>
            ⚠️ Error loading ViewGenerator: {error}
          </div>
        ) : (
          <ViewGenerator
            sentence_id={data.sentence_id}
            charts={data.charts || []}
            onInteraction={data.onInteraction}
            customGridConfig={gridConfig}
          />
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  dashboardNode: DashboardNode,
  infoNode: InfoNode,
  vegaChartNode: VegaChartNode,
  vegaDashboardNode: VegaDashboardNode,
  viewGeneratorNode: ViewGeneratorNode,
};

const initialNodes: Node[] = [
  {
    id: 'placeholder',
    position: { x: 250, y: 200 },
    data: { label: '� Loading generated dashboards...' },
    type: 'default',
    style: {
      background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
      color: '#0277bd',
      border: '2px solid #29b6f6',
      borderRadius: '8px',
      padding: '15px',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center' as const,
      width: '280px',
    },
  },
];

const initialEdges: Edge[] = [];

interface DashboardConfig {
  name: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface ReactFlowCanvasProps {
  showDashboard?: boolean;
  children?: React.ReactNode;
  dashboardConfig?: DashboardConfig;
  onViewGeneratorNodeClick?: (sentenceId: number, nodeId: string) => void;
  scenario?: string;
  example?: string;
}

const ReactFlowCanvas = forwardRef<ReactFlowCanvasRef, ReactFlowCanvasProps>(({ 
  showDashboard, 
  children, 
  dashboardConfig,
  onViewGeneratorNodeClick,
  scenario,
  example
}, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [hasActiveInfoNode, setHasActiveInfoNode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [backupNodes, setBackupNodes] = useState<Node[]>([]);
  const [backupEdges, setBackupEdges] = useState<Edge[]>([]);
  const [isAutoLoading, setIsAutoLoading] = useState(false); // Flag to prevent multiple auto-loads
  const hasAutoLoadedRef = useRef(false); // Ref to track if auto-loading has been completed

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Function to add info node (exposed via ref)
  const addInfoNode = useCallback((data: { title: string; content: string }) => {
    const nodeId = `info-${Date.now()}`;
    
    // Get fresh node state for accurate positioning
    setNodes((currentNodes) => {
      // Calculate position to avoid overlaps using current nodes
      const existingNodes: ExistingNode[] = currentNodes.map(node => {
        const dimensions = getNodeDimensions(node.type || 'default');
        return {
          x: node.position.x,
          y: node.position.y,
          width: dimensions.width,
          height: dimensions.height,
        };
      });
      
      const nodeType = data.title === 'Visualization Plan' ? 'infoNode' : 'infoNode';
      const newPosition = findNonOverlappingPosition(
        existingNodes,
        getNodeDimensions(nodeType)
      );
      
      console.log(`📍 Info node ${nodeId} positioned at:`, newPosition);
      
      const newNode: Node = {
        id: nodeId,
        position: newPosition,
        data: { 
          title: data.title,
          content: data.content,
          nodeId: nodeId // Pass nodeId to the component
        },
        type: 'infoNode',
        draggable: true,
        selectable: true,
        zIndex: 1000,
      };

      // Separate nodes by type to ensure info nodes always come last (on top)
      const infoNodes = currentNodes.filter(node => node.type === 'infoNode');
      const otherNodes = currentNodes.filter(node => node.type !== 'infoNode');
      
      // Add new info node and put all info nodes at the end
      return [...otherNodes, ...infoNodes, newNode];
    });

    // Set modal state - disable other interactions
    setHasActiveInfoNode(true);

    // After adding the node, zoom to it with a slight delay to ensure it's rendered
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({
          nodes: [{ id: nodeId }], // Focus only on the new info node
          duration: 800, // Smooth animation duration
          padding: 0.3, // Add some padding around the node
        });
      }
    }, 100);
  }, []);

  // Function to show loading state
  const showLoadingState = useCallback((message: string = 'Generating visualization recommendations...') => {
    // Backup current nodes and edges
    setBackupNodes(nodes);
    setBackupEdges(edges);
    
    // Clear all nodes and show loading
    setNodes([]);
    setEdges([]);
    setIsLoading(true);
    setLoadingMessage(message);
    setHasActiveInfoNode(false);
  }, [nodes, edges, setNodes, setEdges]);

  // Function to clear all nodes
  const clearAllNodes = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setHasActiveInfoNode(false);
    // Reset auto-loading flag so nodes can be loaded again if needed
    hasAutoLoadedRef.current = false;
  }, [setNodes, setEdges]);

  // Function to hide loading state
  const hideLoadingState = useCallback(() => {
    setIsLoading(false);
    // Don't restore backup nodes - they should stay cleared for the info node
  }, []);

  // Function to add Vega chart node
  const addVegaChartNode = useCallback((data: VegaChartData) => {
    const nodeId = `vega-chart-${Date.now()}`;
    
    // Get fresh node state for accurate positioning
    setNodes((currentNodes) => {
      // Calculate position to avoid overlaps using current nodes
      const existingNodes: ExistingNode[] = currentNodes.map(node => {
        const dimensions = getNodeDimensions(node.type || 'default');
        return {
          x: node.position.x,
          y: node.position.y,
          width: dimensions.width,
          height: dimensions.height,
        };
      });
      
      const newPosition = findNonOverlappingPosition(
        existingNodes,
        getNodeDimensions('vegaChartNode')
      );
      
      console.log(`📍 Vega chart ${nodeId} positioned at:`, newPosition);
      
      const newNode: Node = {
        id: nodeId,
        position: newPosition,
        data: {
          ...data,
          nodeId: nodeId
        },
        type: 'vegaChartNode',
        draggable: true,
        selectable: true,
        zIndex: 1000,
      };

      // Separate nodes by type to ensure chart nodes always come last (on top)
      const chartNodes = currentNodes.filter(node => node.type === 'vegaChartNode' || node.type === 'vegaDashboardNode');
      const otherNodes = currentNodes.filter(node => node.type !== 'vegaChartNode' && node.type !== 'vegaDashboardNode');
      
      return [...otherNodes, ...chartNodes, newNode];
    });

    // Auto-zoom to the new chart node
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({
          nodes: [{ id: nodeId }],
          duration: 800,
          padding: 0.3,
        });
      }
    }, 100);
  }, []);

  // Function to add Vega dashboard node
  const addVegaDashboardNode = useCallback((data: VegaDashboardData) => {
    const nodeId = `vega-dashboard-${Date.now()}`;
    
    // Get fresh node state for accurate positioning
    setNodes((currentNodes) => {
      // Calculate position to avoid overlaps using current nodes
      const existingNodes: ExistingNode[] = currentNodes.map(node => {
        const dimensions = getNodeDimensions(node.type || 'default');
        return {
          x: node.position.x,
          y: node.position.y,
          width: dimensions.width,
          height: dimensions.height,
        };
      });
      
      const newPosition = findNonOverlappingPosition(
        existingNodes,
        getNodeDimensions('vegaDashboardNode')
      );
      
      console.log(`📍 Vega dashboard ${nodeId} positioned at:`, newPosition);
      
      const newNode: Node = {
        id: nodeId,
        position: newPosition,
        data: {
          ...data,
          nodeId: nodeId
        },
        type: 'vegaDashboardNode',
        draggable: true,
        selectable: true,
        zIndex: 1000,
      };

      // Separate nodes by type to ensure dashboard nodes always come last (on top)
      const chartNodes = currentNodes.filter(node => node.type === 'vegaChartNode' || node.type === 'vegaDashboardNode');
      const otherNodes = currentNodes.filter(node => node.type !== 'vegaChartNode' && node.type !== 'vegaDashboardNode');
      
      return [...otherNodes, ...chartNodes, newNode];
    });

    // Auto-zoom to the new dashboard node
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({
          nodes: [{ id: nodeId }],
          duration: 800,
          padding: 0.3,
        });
      }
    }, 100);
  }, []);

  // Function to add ViewGenerator node
  const addViewGeneratorNode = useCallback((data: ViewGeneratorData, skipAutoZoom: boolean = false) => {
    const nodeId = `view-generator-${data.sentence_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get fresh node state for accurate positioning
    setNodes((currentNodes) => {
      // Calculate position to avoid overlaps using current nodes
      const existingNodes: ExistingNode[] = currentNodes.map(node => {
        const dimensions = getNodeDimensions(node.type || 'default');
        return {
          x: node.position.x,
          y: node.position.y,
          width: dimensions.width,
          height: dimensions.height,
        };
      });
      
      console.log(`📊 Adding ViewGenerator node ${nodeId}, existing nodes:`, existingNodes.length);
      
      const newPosition = findNonOverlappingPosition(
        existingNodes,
        getNodeDimensions('viewGeneratorNode')
      );
      
      console.log(`📍 ViewGenerator ${nodeId} positioned at:`, newPosition);
      
      // Calculate dynamic height based on number of xlarge charts
      const getInitialHeight = () => {
        if (!data.charts || data.charts.length === 0) return 300;
        
        const xlargeCount = data.charts.filter((chart: any) => {
          if (!chart.success) return true; // Failed charts also use xlarge size
          const configuredNodeSize = chart.request?.constraints?.nodeSize;
          if (configuredNodeSize) {
            return configuredNodeSize === 'xlarge';
          }
          // Most charts default to xlarge, so count them
          const chartType = chart.chartSpec?.type || chart.request?.constraints?.chartType || 'bar';
          return ['line', 'bar', 'scatter', 'multiType'].includes(chartType);
        }).length;

        if (xlargeCount <= 2) return 300;
        if (xlargeCount <= 4) return 600;
        return 900;
      };
      
      const newNode: Node = {
        id: nodeId,
        position: newPosition,
        width: 1400, // Set initial width
        height: getInitialHeight(), // Set initial dynamic height
        data: {
          ...data,
          nodeId: nodeId,
          onNodeClick: onViewGeneratorNodeClick
        },
        type: 'viewGeneratorNode',
        draggable: true,
        selectable: true,
        zIndex: 1000,
      };

      // Separate nodes by type to ensure ViewGenerator nodes always come last (on top)
      const generatorNodes = currentNodes.filter(node => node.type === 'viewGeneratorNode');
      const otherNodes = currentNodes.filter(node => node.type !== 'viewGeneratorNode');
      
      return [...otherNodes, ...generatorNodes, newNode];
    });

    // Auto-zoom to the new ViewGenerator node only if not skipping
    if (!skipAutoZoom) {
      setTimeout(() => {
        if (reactFlowInstance.current) {
          reactFlowInstance.current.fitView({
            nodes: [{ id: nodeId }],
            duration: 800,
            padding: 0.3,
          });
        }
      }, 100);
    }
  }, []);

  // Function to fit view to all nodes
  const fitViewToAllNodes = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({
        duration: 1000,
        padding: 0.1,
      });
    }
  }, []);

  // Function to load ViewGenerator nodes from output file
  const loadViewGeneratorNodesFromOutput = useCallback(async (filePath?: string) => {
    // Construct default path based on scenario and example props
    const defaultPath = scenario && example 
      ? `/examples/scenario${scenario}/example${example}_data_output.json`
      : '/examples/scenario1/example4_data_output.json'; // fallback
    
    const actualFilePath = filePath || defaultPath;
    // Prevent multiple simultaneous calls using both state and ref
    if (isAutoLoading || hasAutoLoadedRef.current) {
      console.log('⏳ Already loading or loaded ViewGenerator nodes, skipping duplicate call');
      return;
    }

    try {
      setIsAutoLoading(true);
      hasAutoLoadedRef.current = true; // Mark as loaded permanently
      console.log('🔄 Loading ViewGenerator nodes from:', actualFilePath);
      const response = await fetch(actualFilePath);
      
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
      }
      
      const outputData = await response.json();
      
      if (!outputData.sentences) {
        throw new Error('Invalid file format: no sentences found');
      }

      // Clear existing nodes first (including placeholder)
      setNodes([]);
      setEdges([]);

      // Get sentence IDs and sort them numerically
      const sentenceIds = Object.keys(outputData.sentences).sort((a, b) => parseInt(a) - parseInt(b));
      console.log('📊 Found sentence IDs:', sentenceIds);

      // Add ViewGenerator nodes for each sentence
      sentenceIds.forEach((sentenceId, index) => {
        const sentenceData = outputData.sentences[sentenceId];
        
        if (sentenceData && sentenceData.charts) {
          console.log(`📋 Adding ViewGenerator for sentence ${sentenceId} with ${sentenceData.charts.length} charts`);
          console.log(`📊 Chart success status:`, sentenceData.charts.map((c: any) => ({ id: c.id, success: c.success, error: c.error })));
          
          // Use the charts directly since they already have the correct DemoChart format
          // Add ViewGenerator node with delay to ensure proper positioning
          setTimeout(() => {
            addViewGeneratorNode({
              sentence_id: parseInt(sentenceId),
              charts: sentenceData.charts, // Keep original DemoChart format
              onInteraction: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => {
                console.log('📊 ViewGenerator interaction:', { elementId, elementName, elementType, action, metadata });
              }
            }, index > 0); // Skip auto-zoom for all but the first node
          }, index * 100); // Stagger the creation
        }
      });

      console.log('✅ Successfully loaded ViewGenerator nodes for all sentences');
      
    } catch (error) {
      console.error('❌ Error loading ViewGenerator nodes:', error);
      // Show error notification or add error info node
      addInfoNode({
        title: 'Loading Error',
        content: `Failed to load ViewGenerator nodes from ${actualFilePath}:\n\n${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      // Reset loading flag after a delay to ensure all nodes are created
      setTimeout(() => {
        setIsAutoLoading(false);
      }, 1000);
    }
  }, [isAutoLoading, addViewGeneratorNode, addInfoNode, setNodes, setEdges, scenario, example]);

  // Function to check if a ViewGenerator node exists by sentence ID
  const hasViewGeneratorNode = useCallback((sentenceId: number): boolean => {
    const targetNode = nodes.find(node => 
      node.type === 'viewGeneratorNode' && 
      node.data?.sentence_id === sentenceId
    );
    
    return !!targetNode;
  }, [nodes]);

  // Function to select and zoom to a ViewGenerator node by sentence ID
  const selectAndZoomToViewGeneratorNode = useCallback((sentenceId: number): boolean => {
    if (!reactFlowInstance.current) {
      console.warn('❌ ReactFlow instance not available');
      return false;
    }

    console.log(`🔍 Looking for ViewGenerator node with sentence_id: ${sentenceId}`);
    console.log(`🔍 Available nodes:`, nodes.map(n => ({ 
      id: n.id, 
      type: n.type, 
      sentence_id: n.data?.sentence_id,
      data: n.data 
    })));

    // Find the ViewGenerator node with the matching sentence ID
    const targetNode = nodes.find(node => {
      const isViewGenerator = node.type === 'viewGeneratorNode';
      const hasSentenceId = node.data?.sentence_id === sentenceId;
      console.log(`🔍 Checking node ${node.id}: type=${node.type}, sentence_id=${node.data?.sentence_id}, match=${isViewGenerator && hasSentenceId}`);
      return isViewGenerator && hasSentenceId;
    });

    if (!targetNode) {
      console.warn(`❌ No ViewGenerator node found for sentence ${sentenceId}`);
      console.warn(`❌ Available ViewGenerator nodes:`, nodes
        .filter(n => n.type === 'viewGeneratorNode')
        .map(n => ({ id: n.id, sentence_id: n.data?.sentence_id }))
      );
      return false;
    }

    console.log(`🎯 Found target node:`, { 
      id: targetNode.id, 
      type: targetNode.type, 
      sentence_id: targetNode.data?.sentence_id 
    });

    // Select the node by updating the nodes array
    setNodes((currentNodes) => 
      currentNodes.map(node => ({
        ...node,
        selected: node.id === targetNode.id
      }))
    );

    // Zoom to the node
    setTimeout(() => {
      if (reactFlowInstance.current) {
        console.log(`📍 Zooming to node ${targetNode.id}`);
        reactFlowInstance.current.fitView({
          nodes: [{ id: targetNode.id }],
          duration: 800,
          padding: 0.3,
        });
      }
    }, 100);

    return true;
  }, [nodes, setNodes]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addInfoNode,
    hasActiveInfoNode: () => hasActiveInfoNode,
    showLoadingState,
    clearAllNodes,
    hideLoadingState,
    addVegaChartNode,
    addVegaDashboardNode,
    addViewGeneratorNode,
    fitViewToAllNodes,
    hasViewGeneratorNode,
    selectAndZoomToViewGeneratorNode,
    loadViewGeneratorNodesFromOutput
  }), [addInfoNode, hasActiveInfoNode, showLoadingState, clearAllNodes, hideLoadingState, addVegaChartNode, addVegaDashboardNode, addViewGeneratorNode, fitViewToAllNodes, hasViewGeneratorNode, selectAndZoomToViewGeneratorNode, loadViewGeneratorNodesFromOutput]);

  // Handle close info node event
  useEffect(() => {
    const handleCloseInfoNode = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      setNodes((nds) => nds.filter(node => node.id !== nodeId));
      setHasActiveInfoNode(false);
    };

    window.addEventListener('closeInfoNode', handleCloseInfoNode as EventListener);
    
    return () => {
      window.removeEventListener('closeInfoNode', handleCloseInfoNode as EventListener);
    };
  }, [setNodes]);

  // Track info node count to manage modal state
  useEffect(() => {
    const infoNodeCount = nodes.filter(node => node.type === 'infoNode').length;
    const newHasActiveInfoNode = infoNodeCount > 0;
    setHasActiveInfoNode(newHasActiveInfoNode);

    // Grey out non-info nodes when info nodes are active
    if (newHasActiveInfoNode !== hasActiveInfoNode) {
      setNodes((nds) => 
        nds.map(node => {
          if (node.type !== 'infoNode') {
            return {
              ...node,
              data: {
                ...node.data,
                isGreyedOut: newHasActiveInfoNode
              }
            };
          }
          return node;
        })
      );
    }
  }, [nodes, hasActiveInfoNode, setNodes]);

  // Add dashboard node when showDashboard becomes true (only for initial creation)
  useEffect(() => {
    if (showDashboard) {
      setNodes((nds) => {
        const existingDashboard = nds.find(node => node.id === 'london-dashboard');
        
        if (!existingDashboard) {
          // Calculate position to avoid overlaps with existing nodes
          const existingNodes: ExistingNode[] = nds.map(node => {
            const dimensions = getNodeDimensions(node.type || 'default');
            return {
              x: node.position.x,
              y: node.position.y,
              width: dimensions.width,
              height: dimensions.height,
            };
          });
          
          const dashboardDimensions = {
            width: dashboardConfig?.width || 1200,
            height: dashboardConfig?.height || 1000
          };
          
          const newPosition = findNonOverlappingPosition(
            existingNodes,
            dashboardDimensions,
            1500, // canvas width
            1000, // canvas height
            50    // margin
          );
          
          // Create new dashboard node only if it doesn't exist
          const dashboardNode: Node = {
            id: 'london-dashboard',
            position: newPosition,
            data: { 
              label: 'London Dashboard',
              dashboardComponent: children,
              config: dashboardConfig
            },
            type: 'dashboardNode',
            style: {
              width: dashboardConfig?.width ? `${dashboardConfig.width}px` : '1200px',
              height: dashboardConfig?.height ? `${dashboardConfig.height}px` : '1000px',
              border: '2px solid #0891b2',
              borderRadius: '8px',
              background: 'white',
              overflow: 'hidden',
            },
            draggable: true,
            selected: true, // Auto-select the node so resize handles appear
            selectable: true,
          };

          // Remove placeholder and maintain proper ordering
          const filtered = nds.filter(node => node.id !== 'placeholder');
          
          // Separate nodes by type to ensure info nodes stay on top
          const infoNodes = filtered.filter(node => node.type === 'infoNode');
          const otherNodes = filtered.filter(node => node.type !== 'infoNode');
          
          // Add dashboard node before info nodes (info nodes always last/on top)
          return [...otherNodes, dashboardNode, ...infoNodes];
        }
        return nds; // No change if dashboard already exists
      });
    } else {
      // Remove dashboard node and show placeholder
      setNodes((nds) => {
        const filtered = nds.filter(node => node.id !== 'london-dashboard');
        const hasPlaceholder = filtered.some(node => node.id === 'placeholder');
        if (!hasPlaceholder) {
          // Maintain proper ordering when adding placeholder back
          const infoNodes = filtered.filter(node => node.type === 'infoNode');
          const otherNodes = filtered.filter(node => node.type !== 'infoNode');
          
          return [...otherNodes, initialNodes[0], ...infoNodes];
        }
        return filtered;
      });
    }
  }, [showDashboard, setNodes, dashboardConfig, children]);

  // Separate effect to update dashboard content without recreating the node
  useEffect(() => {
    if (showDashboard && children) {
      setNodes((nds) => 
        nds.map(node => 
          node.id === 'london-dashboard' 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  dashboardComponent: children 
                } 
              }
            : node
        )
      );
    }
  }, [children, showDashboard, setNodes]);

  // Auto-load ViewGenerator nodes on component mount
  useEffect(() => {
    // Only load if we haven't already auto-loaded (using ref for persistent check)
    const hasViewGeneratorNodes = nodes.some(node => node.type === 'viewGeneratorNode');
    const hasPlaceholder = nodes.some(node => node.id === 'placeholder');
    
    // Only auto-load once when the component first mounts with the placeholder
    if (hasPlaceholder && !hasViewGeneratorNodes && !isLoading && !hasActiveInfoNode && !isAutoLoading && !hasAutoLoadedRef.current) {
      console.log('🚀 Auto-loading ViewGenerator nodes on page load');
      loadViewGeneratorNodesFromOutput();
    }
  }, []); // Empty dependency array to run only once on mount

  return (
    <div className="w-full h-full relative">


      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        fitView
        className="react-flow-canvas"
        snapToGrid={true}
        snapGrid={[10, 10]}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        nodesDraggable={true}
        nodesConnectable={!hasActiveInfoNode} // Disable connecting when modal is active  
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={!hasActiveInfoNode} // Disable panning when modal is active
        zoomOnScroll={!hasActiveInfoNode} // Disable zoom when modal is active
        zoomOnPinch={!hasActiveInfoNode} // Disable pinch zoom when modal is active
        onNodeClick={(event, node) => {
          // Only allow clicking on info nodes when modal is active
          if (hasActiveInfoNode && node.type !== 'infoNode') {
            event.stopPropagation();
            return;
          }
        }}
        onPaneClick={(event) => {
          // Block pane clicks when modal is active
          if (hasActiveInfoNode) {
            event.stopPropagation();
            return;
          }
        }}
        onNodeDragStart={(event, node) => {
          // Only allow dragging info nodes when modal is active
          if (hasActiveInfoNode && node.type !== 'infoNode') {
            event.stopPropagation();
            return;
          }
        }}
      >
        <Controls showInteractive={!hasActiveInfoNode} />
        <MiniMap 
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            if (node.id === 'london-dashboard') return 'rgba(255, 244, 204, 0.4)';
            if (node.type === 'infoNode') return 'rgba(100, 116, 139, 0.6)'; // Gray to match the muted design
            return '#cbd5e1';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          style={{ 
            border: '1px solid #e2e8f0',
            pointerEvents: hasActiveInfoNode ? 'none' : 'auto' // Disable minimap when modal is active
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#0891b2"
        />
      </ReactFlow>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)',
        }}>
          {/* Spinner */}
          <div 
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #0891b2',
              borderRadius: '50%',
              marginBottom: '16px',
            }}
            className="animate-spin"
          />
          
          {/* Loading Message */}
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#334155',
            marginBottom: '8px',
            textAlign: 'center',
          }}>
            {loadingMessage}
          </div>
          
          <div style={{
            fontSize: '14px',
            color: '#64748b',
            textAlign: 'center',
            maxWidth: '300px',
          }}>
            Please wait while we analyze your narrative and generate visualization recommendations...
          </div>
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
ReactFlowCanvas.displayName = 'ReactFlowCanvas';

export default ReactFlowCanvas;
