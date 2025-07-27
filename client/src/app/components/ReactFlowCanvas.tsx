'use client';

import React, { useCallback, useEffect } from 'react';
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
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

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
      <div className="dashboard-node">
        <div className="dashboard-node-content">
          {data.dashboardComponent}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  dashboardNode: DashboardNode,
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

const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({ 
  showDashboard, 
  children, 
  dashboardConfig 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Add dashboard node when showDashboard becomes true
  useEffect(() => {
    if (showDashboard && children) {
      const dashboardNode: Node = {
        id: 'london-dashboard',
        position: { x: 50, y: 50 },
        data: { 
          label: 'London Dashboard',
          dashboardComponent: children 
        },
        type: 'dashboardNode',
        style: {
          width: '1200px',
          height: '1000px',
          border: '2px solid #0891b2',
          borderRadius: '8px',
          background: 'white',
          overflow: 'hidden',
        },
        draggable: true,
        selected: true, // Auto-select the node so resize handles appear
        selectable: true,
      };

      setNodes((nds) => {
        // Remove placeholder and add dashboard node
        const filtered = nds.filter(node => node.id !== 'placeholder');
        return [...filtered, dashboardNode];
      });
    } else {
      // Remove dashboard node and show placeholder
      setNodes((nds) => {
        const filtered = nds.filter(node => node.id !== 'london-dashboard');
        const hasPlaceholder = filtered.some(node => node.id === 'placeholder');
        if (!hasPlaceholder) {
          return [...filtered, initialNodes[0]];
        }
        return filtered;
      });
    }
  }, [showDashboard, children, setNodes]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="react-flow-canvas"
        snapToGrid={true}
        snapGrid={[10, 10]}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        nodesDraggable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
      >
        <Controls showInteractive={true} />
        <MiniMap 
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            return node.id === 'london-dashboard' ? 'rgba(255, 244, 204, 0.4)' : '#cbd5e1';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          style={{ border: '1px solid #e2e8f0' }}
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
};

export default ReactFlowCanvas;
