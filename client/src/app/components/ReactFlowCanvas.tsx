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
                    spec={view.vegaLiteSpec}
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

const nodeTypes = {
  dashboardNode: DashboardNode,
  infoNode: InfoNode,
  vegaChartNode: VegaChartNode,
  vegaDashboardNode: VegaDashboardNode,
};

const initialNodes: Node[] = [
  {
    id: 'placeholder',
    position: { x: 250, y: 200 },
    data: { label: '📊 Click "Generate Dashboard" to create visualization' },
    type: 'default',
    style: {
      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
      color: '#64748b',
      border: '2px dashed #94a3b8',
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
}

const ReactFlowCanvas = forwardRef<ReactFlowCanvasRef, ReactFlowCanvasProps>(({ 
  showDashboard, 
  children, 
  dashboardConfig
}, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [hasActiveInfoNode, setHasActiveInfoNode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [backupNodes, setBackupNodes] = useState<Node[]>([]);
  const [backupEdges, setBackupEdges] = useState<Edge[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Function to add info node (exposed via ref)
  const addInfoNode = useCallback((data: { title: string; content: string }) => {
    const nodeId = `info-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
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

    setNodes((nds) => {
      // Separate nodes by type to ensure info nodes always come last (on top)
      const infoNodes = nds.filter(node => node.type === 'infoNode');
      const otherNodes = nds.filter(node => node.type !== 'infoNode');
      
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
  }, [setNodes]);

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
  }, [setNodes, setEdges]);

  // Function to hide loading state
  const hideLoadingState = useCallback(() => {
    setIsLoading(false);
    // Don't restore backup nodes - they should stay cleared for the info node
  }, []);

  // Function to add Vega chart node
  const addVegaChartNode = useCallback((data: VegaChartData) => {
    const nodeId = `vega-chart-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: {
        ...data,
        nodeId: nodeId
      },
      type: 'vegaChartNode',
      draggable: true,
      selectable: true,
      zIndex: 1000,
    };

    setNodes((nds) => {
      // Separate nodes by type to ensure chart nodes always come last (on top)
      const chartNodes = nds.filter(node => node.type === 'vegaChartNode' || node.type === 'vegaDashboardNode');
      const otherNodes = nds.filter(node => node.type !== 'vegaChartNode' && node.type !== 'vegaDashboardNode');
      
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
  }, [setNodes]);

  // Function to add Vega dashboard node
  const addVegaDashboardNode = useCallback((data: VegaDashboardData) => {
    const nodeId = `vega-dashboard-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: {
        ...data,
        nodeId: nodeId
      },
      type: 'vegaDashboardNode',
      draggable: true,
      selectable: true,
      zIndex: 1000,
    };

    setNodes((nds) => {
      // Separate nodes by type to ensure dashboard nodes always come last (on top)
      const chartNodes = nds.filter(node => node.type === 'vegaChartNode' || node.type === 'vegaDashboardNode');
      const otherNodes = nds.filter(node => node.type !== 'vegaChartNode' && node.type !== 'vegaDashboardNode');
      
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
  }, [setNodes]);

  // Test functions to load simulated data
  const loadSimulatedDashboard = useCallback(async () => {
    try {
      const response = await fetch('/test_simulation/dashboard_example.json');
      const dashboardData = await response.json();
      
      // Transform the new format to match VegaDashboardData interface
      const transformedData: VegaDashboardData = {
        dashboardTitle: dashboardData.title,
        views: dashboardData.charts.map((chart: any) => ({
          description: chart.title,
          vegaLiteSpec: chart.spec,
        })),
        insightPanels: dashboardData.insights || [],
        datasetRecommendations: ['London Crime Statistics', 'Housing Price Data', 'Safety Index Reports'],
      };
      
      addVegaDashboardNode(transformedData);
    } catch (error) {
      console.error('Error loading simulated dashboard:', error);
    }
  }, [addVegaDashboardNode]);

  const loadSimulatedChart = useCallback(async () => {
    try {
      const response = await fetch('/test_simulation/chart_example.json');
      const chartData = await response.json();
      
      // Transform the new format to match VegaChartData interface
      const transformedData: VegaChartData = {
        title: chartData.title,
        vegaLiteSpec: chartData.spec,
        dataSource: 'London Housing Data',
      };
      
      addVegaChartNode(transformedData);
    } catch (error) {
      console.error('Error loading simulated chart:', error);
    }
  }, [addVegaChartNode]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addInfoNode,
    hasActiveInfoNode: () => hasActiveInfoNode,
    showLoadingState,
    clearAllNodes,
    hideLoadingState,
    addVegaChartNode,
    addVegaDashboardNode
  }), [addInfoNode, hasActiveInfoNode, showLoadingState, clearAllNodes, hideLoadingState, addVegaChartNode, addVegaDashboardNode]);

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
          // Create new dashboard node only if it doesn't exist
          const dashboardNode: Node = {
            id: 'london-dashboard',
            position: { x: 50, y: 50 },
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
  }, [showDashboard, setNodes, dashboardConfig]);

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

  return (
    <div className="w-full h-full relative">
      {/* Test Buttons */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        display: 'flex',
        gap: '8px',
      }}>
        <button
          onClick={loadSimulatedDashboard}
          disabled={hasActiveInfoNode || isLoading}
          style={{
            background: hasActiveInfoNode || isLoading ? '#94a3b8' : 'linear-gradient(135deg, #0891b2, #0e7490)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: hasActiveInfoNode || isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(8, 145, 178, 0.3)',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
          onMouseOver={(e) => {
            if (!hasActiveInfoNode && !isLoading) {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'scale(1.05)';
              target.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!hasActiveInfoNode && !isLoading) {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'scale(1)';
              target.style.boxShadow = '0 2px 8px rgba(8, 145, 178, 0.3)';
            }
          }}
          title={hasActiveInfoNode ? 'Close info panel first' : 'Load test dashboard with multiple charts'}
        >
          📊 Dashboard
        </button>
        
        <button
          onClick={loadSimulatedChart}
          disabled={hasActiveInfoNode || isLoading}
          style={{
            background: hasActiveInfoNode || isLoading ? '#94a3b8' : 'linear-gradient(135deg, #059669, #047857)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: hasActiveInfoNode || isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
          onMouseOver={(e) => {
            if (!hasActiveInfoNode && !isLoading) {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'scale(1.05)';
              target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!hasActiveInfoNode && !isLoading) {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'scale(1)';
              target.style.boxShadow = '0 2px 8px rgba(5, 150, 105, 0.3)';
            }
          }}
          title={hasActiveInfoNode ? 'Close info panel first' : 'Load test single chart'}
        >
          📈 Chart
        </button>
      </div>

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
