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

import '@xyflow/react/dist/style.css';

// Expose methods for parent components to interact with the canvas
export interface ReactFlowCanvasRef {
  addInfoNode: (data: { title: string; content: string }) => void;
  hasActiveInfoNode: () => boolean;
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

  return (
    <div className="info-node-wrapper" style={{ position: 'relative', zIndex: 1000 }}>
      <div className="info-node" style={{
        background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: '12px',
        padding: '0',
        width: '420px',
        height: '320px',
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
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            background: '#64748b',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 1001,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(100, 116, 139, 0.3)',
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'scale(1.05)';
            target.style.background = '#475569';
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'scale(1)';
            target.style.background = '#64748b';
          }}
          title="Close"
        >
          ×
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

        {/* Content - No scroll, fixed height */}
        <div className="info-node-content" style={{
          fontSize: '13px',
          color: '#64748b',
          lineHeight: '1.5',
          flex: 1,
          overflow: 'hidden', // Remove scrolling
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
          {data.content ? (
            <div style={{ 
              letterSpacing: '0.01em',
              textAlign: 'left',
              height: '100%', // Fill available space
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {data.content.split('\n\n').slice(0, 3).map((paragraph: string, index: number) => ( // Limit to 3 paragraphs
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

const nodeTypes = {
  dashboardNode: DashboardNode,
  infoNode: InfoNode,
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

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addInfoNode,
    hasActiveInfoNode: () => hasActiveInfoNode
  }), [addInfoNode, hasActiveInfoNode]);

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
    </div>
  );
});

// Add display name for debugging
ReactFlowCanvas.displayName = 'ReactFlowCanvas';

export default ReactFlowCanvas;
