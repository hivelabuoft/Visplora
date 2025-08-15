'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  ReactFlowProvider,
  useReactFlow,
  ReactFlowInstance,
  MarkerType,
  Handle,
  Position,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../styles/timeline.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { Target } from 'lucide-react';
import { TbTextPlus, TbRoute, TbCrop, TbGitBranch } from 'react-icons/tb';

// Drift types configuration
const DRIFT_TYPES = [
  {
    id: "elaboration",
    label: "Elaboration",
    icon: TbTextPlus,
    shape: "circle",
    color: "#CBD5E0",
    description: "Adds detail without changing topic, scope, time, or measure."
  },
  {
    id: "context_shift",
    label: "Context Shift", 
    icon: TbRoute,
    shape: "hexagon",
    color: "#BEE3F8",
    description: "Keeps topic but shifts time or geo (the analysis frame)."
  },
  {
    id: "reframing",
    label: "Reframing",
    icon: TbCrop,
    shape: "square", 
    color: "#FEFCBF",
    description: "Keeps topic/scope but changes measure, unit, or subgroup."
  },
  {
    id: "topic_change",
    label: "Topic Change",
    icon: TbGitBranch,
    shape: "diamond",
    color: "#FED7D7", 
    description: "Switches subject/domain; begins a new branch."
  }
];

// Function to randomly assign drift type to a node (dev mode)
const getRandomDriftType = (nodeId: string) => {
  // Use node ID as seed for consistent assignment across renders
  const seed = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = seed % DRIFT_TYPES.length;
  return DRIFT_TYPES[index];
};

// Interface for timeline nodes - keeping old structure with activeChild added
interface TimelineNode {
  node_id: number;
  sentence_id: string;
  sentence_content: string;
  parent_id: string;
  child_ids: string[];
  activeChild?: string | null; // Added activeChild property
  changed_from_previous: {
    drift_types: string[];
    severity: string;
    dimensions: Record<string, string>;
  } | null;
  hover: {
    title: string;
    source: any;
    reflect: string[];
  };
}

interface ReactFlowTimelineProps {
  nodes: TimelineNode[];
  pageId: string;
  activePath?: string[];
}

// Custom node component for timeline nodes
const TimelineNodeComponent = ({ data }: { data: any }) => {
  const { node, isActive } = data;
  
  // Get random drift type for this node (dev mode)
  const driftType = getRandomDriftType(node.sentence_id);
  
  // Minimal node styling with drift type
  const getNodeStyle = () => {
    const baseStyle = {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '500',
      cursor: 'pointer',
      position: 'relative' as const,
      border: '2px solid',
    };

    // Apply drift type shape
    let shapeStyle = {};
    switch (driftType.shape) {
      case 'circle':
        shapeStyle = { borderRadius: '50%' };
        break;
      case 'square':
        shapeStyle = { borderRadius: '2px' };
        break;
      case 'hexagon':
        shapeStyle = { 
          borderRadius: '4px',
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
        };
        break;
      case 'diamond':
        shapeStyle = { 
          borderRadius: '2px',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
        };
        break;
      default:
        shapeStyle = { borderRadius: '50%' };
    }

    if (isActive) {
      // Active path - use drift type color but with active styling
      return {
        ...baseStyle,
        ...shapeStyle,
        backgroundColor: driftType.color,
        borderColor: '#0891b2', // cyan-600 border for active
        color: '#0e7490', // cyan-700 text
      };
    } else {
      // Inactive path - use drift type color with muted styling
      return {
        ...baseStyle,
        ...shapeStyle,
        backgroundColor: driftType.color,
        borderColor: '#cbd5e1', // slate-300 border
        color: '#64748b', // slate-500 text
      };
    }
  };

  return (
    <div
      style={getNodeStyle()}
      data-tooltip-id="timeline-tooltip"
      data-tooltip-content={`${node.sentence_content} - Node ${node.node_id} (${driftType.label})`}
      className="timeline-node"
    >
      {/* React Flow Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'transparent',
          border: 'none',
          width: '6px',
          height: '6px',
          left: '-3px',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'transparent',
          border: 'none',
          width: '6px',
          height: '6px',
          right: '-3px',
        }}
      />
      
      {/* Display drift type icon */}
      <driftType.icon size={14} />
    </div>
  );
};

// Node types for React Flow
const nodeTypes = {
  timelineNode: TimelineNodeComponent,
};

const ReactFlowTimelineInner: React.FC<ReactFlowTimelineProps> = ({ nodes, pageId, activePath = [] }) => {
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState<Node>([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView, setCenter } = useReactFlow();
  
  const activePathSet = useMemo(() => new Set(activePath), [activePath]);
  
  // Get the current/most recent active node
  const getCurrentActiveNode = useCallback(() => {
    if (activePath.length === 0) return null;
    const currentNodeId = activePath[activePath.length - 1];
    return reactFlowNodes.find(node => node.id === currentNodeId);
  }, [activePath, reactFlowNodes]);
  
  // Function to fit entire timeline in view
  const fitTimelineToView = useCallback(() => {
    fitView({ padding: 0.1, duration: 800 });
  }, [fitView]);
  
  // Function to restore view to current active node
  const restoreViewToCurrentNode = useCallback(() => {
    if (activePath.length === 0) {
      // If no active path, center on the first node
      if (reactFlowNodes.length > 0) {
        setCenter(reactFlowNodes[0].position.x, reactFlowNodes[0].position.y, { zoom: 1, duration: 800 });
      }
      return;
    }

    // Get the last 6 nodes from the active path (or all if less than 6)
    const recentActiveNodes = activePath.slice(-6);
    const recentNodePositions = recentActiveNodes
      .map(nodeId => reactFlowNodes.find(node => node.id === nodeId))
      .filter(node => node !== undefined)
      .map(node => node!.position);

    if (recentNodePositions.length === 0) {
      // Fallback to first node if no active nodes found
      if (reactFlowNodes.length > 0) {
        setCenter(reactFlowNodes[0].position.x, reactFlowNodes[0].position.y, { zoom: 1, duration: 800 });
      }
      return;
    }

    // Calculate the center point of the recent active nodes
    const centerX = recentNodePositions.reduce((sum, pos) => sum + pos.x, 0) / recentNodePositions.length;
    const centerY = recentNodePositions.reduce((sum, pos) => sum + pos.y, 0) / recentNodePositions.length;

    // Calculate the width span of the recent nodes
    const minX = Math.min(...recentNodePositions.map(pos => pos.x));
    const maxX = Math.max(...recentNodePositions.map(pos => pos.x));
    const nodeSpan = maxX - minX + 80; // Add 80px (one node spacing) for padding

    // Calculate zoom level to fit 6 nodes horizontally (assuming 80px spacing)
    // Target width for 6 nodes: 5 * 80px spacing + node width
    const targetWidth = 5 * 80 + 32; // 5 gaps * 80px + 32px node width
    const viewportWidth = window.innerWidth * 0.8; // Use 80% of viewport width
    const calculatedZoom = Math.min(viewportWidth / Math.max(nodeSpan, targetWidth), 2); // Cap at 2x zoom
    const finalZoom = Math.max(calculatedZoom, 0.3); // Minimum zoom of 0.3

    setCenter(centerX, centerY, { zoom: finalZoom, duration: 800 });
  }, [activePath, reactFlowNodes, setCenter]);
  
  // Calculate layout and convert to React Flow format
  const calculateFlowLayout = useCallback(() => {
    if (nodes.length === 0) return { nodes: [], edges: [] };
    
    
    const nodeSpacing = 80; // Horizontal spacing
    const branchOffset = 50; // Vertical offset for branches (reduced from 80)
    const centerY = 0; // Center at Y=0
    
    // Create a map for quick lookups
    const nodeMap = new Map(nodes.map(node => [node.sentence_id, node]));
    
    // Position all nodes using a breadth-first traversal to properly handle the tree structure
    const allPositions = new Map<string, { x: number; y: number }>();
    const processedNodes = new Set<string>();
    
    // Find the root node (node with no parent or empty parent_id)
    const rootNode = nodes.find(node => !node.parent_id || node.parent_id === "");
    if (!rootNode) return { nodes: [], edges: [] };
    
    
    // Start with root at position (0, 0)
    allPositions.set(rootNode.sentence_id, { x: 0, y: centerY });
    processedNodes.add(rootNode.sentence_id);
    
    // Queue for breadth-first processing: [nodeId, depth]
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: rootNode.sentence_id, depth: 0 }];
    
    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      const currentNode = nodeMap.get(nodeId);
      if (!currentNode) continue;
      
      const currentPosition = allPositions.get(nodeId);
      if (!currentPosition) continue;
      
      
      // Process all children of the current node
      const children = currentNode.child_ids || [];
      children.forEach((childId: string, childIndex: number) => {
        if (processedNodes.has(childId)) return; // Already processed
        
        const childNode = nodeMap.get(childId);
        if (!childNode) return;
        
        // Calculate position for this child
        const childX = currentPosition.x + nodeSpacing; // Always move right for children
        
        // For multiple children, spread them vertically around the parent
        let childY = currentPosition.y; // Start with parent's Y position
        
        if (children.length > 1) {
          // Find which child is in the active path (if any)
          const activeChildIndex = children.findIndex((cId: string) => activePath.includes(cId));
          
          if (activeChildIndex !== -1) {
            // Position active child at parent's Y level, others above/below
            if (childIndex === activeChildIndex) {
              childY = currentPosition.y; // Active child stays at parent's level
            } else {
              // Calculate offset for non-active children
              let branchOrder = childIndex;
              if (childIndex > activeChildIndex) {
                branchOrder = childIndex - 1; // Adjust for active child taking center
              }
              
              // Alternate above and below parent's level
              if (branchOrder % 2 === 0) {
                childY = currentPosition.y + (Math.floor(branchOrder / 2) + 1) * branchOffset; // Below
              } else {
                childY = currentPosition.y - (Math.floor(branchOrder / 2) + 1) * branchOffset; // Above
              }
            }
          } else {
            // No active child, spread evenly around parent's Y position
            const totalOffset = (children.length - 1) * branchOffset / 2;
            childY = currentPosition.y - totalOffset + (childIndex * branchOffset);
          }
        }
        
        
        allPositions.set(childId, { x: childX, y: childY });
        processedNodes.add(childId);
        
        // Add to queue for further processing
        queue.push({ nodeId: childId, depth: depth + 1 });
      });
    }
    
    // Convert to React Flow nodes
    const flowNodes: Node[] = nodes.map(node => {
      const position = allPositions.get(node.sentence_id) || { x: 0, y: 0 };
      const isActive = activePathSet.has(node.sentence_id);
      
      return {
        id: node.sentence_id,
        type: 'timelineNode',
        position,
        data: { node, isActive },
        draggable: false,
      };
    });
    
    
    // Convert to React Flow edges - only create parent-child connections
    const flowEdges: Edge[] = [];
    
    // Create edges based on parent-child relationships only
    nodes.forEach(node => {
      if (node.child_ids && node.child_ids.length > 0) {
        node.child_ids.forEach((childId: string) => {
          const childNode = nodes.find(n => n.sentence_id === childId);
          if (childNode) {
            const isActiveConnection = activePathSet.has(node.sentence_id) && activePathSet.has(childId);
            
            flowEdges.push({
              id: `${node.sentence_id}-${childId}`,
              source: node.sentence_id,
              target: childId,
              style: {
                stroke: isActiveConnection ? '#0891b2' : '#cbd5e1', // cyan-600 for active, slate-300 for inactive
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isActiveConnection ? '#0891b2' : '#cbd5e1',
              },
            });
          }
        });
      }
    });

    
    return { nodes: flowNodes, edges: flowEdges };
  }, [nodes, activePathSet]);
  
  // Update React Flow nodes and edges when data changes
  useEffect(() => {
    const { nodes: flowNodes, edges: flowEdges } = calculateFlowLayout();
    setReactFlowNodes(flowNodes);
    setReactFlowEdges(flowEdges);
    
    // Center on the most recent nodes (last 3-4 nodes of active path)
    if (activePath.length > 0) {
      setTimeout(() => {
        const recentNodes = activePath.slice(-3); // Focus on last 3 nodes
        if (recentNodes.length > 0) {
          const lastNodeId = recentNodes[recentNodes.length - 1];
          const lastNode = flowNodes.find(n => n.id === lastNodeId);
          if (lastNode) {
            setCenter(lastNode.position.x, lastNode.position.y, { zoom: 1, duration: 800 });
          }
        }
      }, 100);
    }
  }, [nodes, activePath, calculateFlowLayout, setReactFlowNodes, setReactFlowEdges, setCenter]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        snapToGrid={true}
        snapGrid={[20, 20]}
      >
        <Background color="#f1f5f9" gap={20} />
        
        {/* Drift Types Legend Panel */}
        <Panel position="top-left">
          <div className="drift-legend">
            <div className="drift-legend-items">
              {/* Elaboration */}
              <div className="drift-legend-item">
                <div className="drift-shape drift-elaboration">
                  <TbTextPlus size={12} />
                </div>
                <span className="drift-label">Elaboration</span>
              </div>
              
              {/* Context Shift */}
              <div className="drift-legend-item">
                <div className="drift-shape drift-context-shift">
                  <TbRoute size={12} />
                </div>
                <span className="drift-label">Context Shift</span>
              </div>
              
              {/* Reframing */}
              <div className="drift-legend-item">
                <div className="drift-shape drift-reframing">
                  <TbCrop size={12} />
                </div>
                <span className="drift-label">Reframing</span>
              </div>
              
              {/* Topic Change */}
              <div className="drift-legend-item">
                <div className="drift-shape drift-topic-change">
                  <TbGitBranch size={12} />
                </div>
                <span className="drift-label">Topic Change</span>
              </div>
            </div>
          </div>
        </Panel>
        
        {/* Custom panel for navigation */}
        <Panel position="top-right">
          <div className="timeline-controls">
            <button
              onClick={restoreViewToCurrentNode}
              className="restore-view-btn"
              title="Center view on current node"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30"><path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z"></path></svg>
            </button>
            <button
              onClick={fitTimelineToView}
              className="restore-view-btn"
              title="Fit entire timeline to view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </Panel>
      </ReactFlow>
      
      {/* Main Tooltip */}
      <Tooltip
        id="timeline-tooltip"
        place="top"
        style={{
          backgroundColor: '#374151',
          color: '#f9fafb',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
          maxWidth: '350px',
          zIndex: 1000,
          border: '1px solid #6b7280'
        }}
      />
    </div>
  );
};

// Wrapper component with ReactFlowProvider
export const ReactFlowTimeline: React.FC<ReactFlowTimelineProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowTimelineInner {...props} />
    </ReactFlowProvider>
  );
};
