'use client';

import React, { useCallback, useImperativeHandle, forwardRef, useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
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
  ReactFlowInstance,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import { isDemoMode, logDemoModeStatus } from '../utils/demoMode';

import '@xyflow/react/dist/style.css';

// Inquiry Node interface following IBIS structure
export interface InquiryNode {
  qid: string; // Unique identifier
  title: string; // Natural language label or question
  type: 'issue' | 'position' | 'argument'; // issue = question/problem, position = answer/stance, argument = supporting/challenging evidence
  status: 'open' | 'stalled' | 'resolved'; // Workflow status
  answer?: string; // Optional, only present if status === 'resolved'
  links: InquiryLink[]; // Outgoing connections to other inquiries
  sentenceRefs: string[]; // References to supporting sentences/evidence
}

// Directed edge connecting one inquiry to another
export interface InquiryLink {
  qid: string; // Target node QID
  type: 'responds_to' | 'supports' | 'challenges' | 'clarifies' | 'depends_on'; // Semantic relationship
  explanation: string; // Short natural-language description of the relationship
  color?: string; // Optional color for the relationship
}

// Expose methods for parent components to interact with the inquiry board
export interface InquiryBoardRef {
  goBackToViews: () => void;
}

// Custom node component for inquiry items
const InquiryNodeComponent: React.FC<{ 
  data: any; 
  selected?: boolean;
  onClick?: (nodeId: string) => void;
  isLinksVisible?: boolean;
  isSourceNode?: boolean; // Node that was clicked to show links
  isTargetNode?: boolean; // Node that is linked to from the source
}> = ({ data, selected, onClick }) => {
  // Extract visual state from data (passed from node creation)
  const { isSourceNode, isTargetNode, isLinksVisible } = data;
  
  console.log(`🎨 Rendering node ${data.qid}: isSource=${isSourceNode}, isTarget=${isTargetNode}, isVisible=${isLinksVisible}`);
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return {
          background: 'rgba(251, 191, 36, 0.15)',
          border: 'rgba(251, 191, 36, 0.4)',
          color: '#a16207'
        };
      case 'stalled':
        return {
          background: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.4)',
          color: '#b91c1c'
        };
      case 'resolved':
        return {
          background: 'rgba(34, 197, 94, 0.15)',
          border: 'rgba(34, 197, 94, 0.4)',
          color: '#166534'
        };
      default:
        return {
          background: 'rgba(148, 163, 184, 0.15)',
          border: 'rgba(148, 163, 184, 0.4)',
          color: '#475569'
        };
    }
  };

  const getTypeStyle = (type: string) => {
    const baseStyle = {
      background: 'rgba(100, 116, 139, 0.15)',
      border: '1px solid rgba(100, 116, 139, 0.3)',
      color: '#475569',
    };

    switch (type.toLowerCase()) {
      case 'issue':
        return {
          ...baseStyle,
          icon: '❓',
          label: 'ISSUE'
        };
      case 'position':
        return {
          ...baseStyle,
          icon: '💭',
          label: 'POSITION'
        };
      case 'argument':
        return {
          ...baseStyle,
          icon: '📊',
          label: 'ARGUMENT'
        };
      default:
        return {
          ...baseStyle,
          icon: '📝',
          label: type.toUpperCase()
        };
    }
  };

  const statusStyle = getStatusColor(data.status);
  const typeStyle = getTypeStyle(data.type);
  const inquiry = data as InquiryNode;

  // Get border style based on node state
  const getBorderStyle = () => {
    if (isSourceNode) {
      return {
        border: '3px solid #3b82f6', // Blue border for clicked/source node
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), 0 4px 16px rgba(59, 130, 246, 0.2)',
        transform: 'scale(1.05)',
      };
    } else if (isTargetNode) {
      return {
        border: '3px solid #10b981', // Green border for linked/target nodes
        boxShadow: '0 0 16px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(16, 185, 129, 0.2)',
        transform: 'scale(1.02)',
      };
    } else if (isLinksVisible) {
      return {
        border: `1.5px solid ${statusStyle.border}`,
        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
        transform: 'scale(1.02)',
      };
    } else {
      return {
        border: `1.5px solid ${statusStyle.border}`,
        boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)',
        transform: 'scale(1)',
      };
    }
  };

  const borderStyle = getBorderStyle();

  return (
    <div className="inquiry-node-wrapper" style={{ position: 'relative', zIndex: 1000 }}>
      <div 
        className="inquiry-node" 
        onClick={() => onClick && onClick(inquiry.qid)}
        style={{
          background: statusStyle.background,
          ...borderStyle,
          borderRadius: '12px',
          padding: '0px',
          width: '240px',
          minHeight: '140px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header Section */}
        <div style={{
          background: typeStyle.background,
          border: typeStyle.border,
          borderBottom: 'none',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '36px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            color: typeStyle.color,
          }}>
            {typeStyle.label}
          </div>
        </div>

        {/* Content Section */}
        <div style={{
          padding: '12px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Inquiry Title */}
          <div className="inquiry-title" style={{
            fontSize: '13px',
            fontWeight: '600',
            color: statusStyle.color,
            marginBottom: '10px',
            lineHeight: '1.3',
            flex: 1,
          }}>
            {inquiry.title}
          </div>

          {/* Answer (if resolved) */}
          {inquiry.answer && (
            <div className="inquiry-answer" style={{
              fontSize: '11px',
              color: statusStyle.color,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              padding: '8px',
              borderRadius: '6px',
              marginBottom: '10px',
              fontStyle: 'italic',
              lineHeight: '1.3',
              border: `1px solid ${statusStyle.border}`,
            }}>
              <strong style={{ fontStyle: 'normal' }}>Answer:</strong> {inquiry.answer}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.5)',
          borderTop: `1px solid rgba(0, 0, 0, 0.05)`,
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '9px',
            color: statusStyle.color,
            opacity: 0.7,
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>
              {inquiry.links.length} link{inquiry.links.length !== 1 ? 's' : ''}
            </span>
            {inquiry.links.length > 0 && (
              <span style={{
                fontSize: '8px',
                color: isLinksVisible ? '#1e40af' : statusStyle.color,
                fontWeight: '600',
                opacity: 0.8,
              }}>
                {isLinksVisible ? 'HIDE' : 'SHOW'}
              </span>
            )}
            {isLinksVisible && (
              <span style={{
                padding: '1px 3px',
                borderRadius: '2px',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#1e40af',
                fontWeight: '600',
                fontSize: '7px',
              }}>
                VISIBLE
              </span>
            )}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <div style={{
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '8px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.2px',
              background: inquiry.status === 'open' ? 'rgba(251, 191, 36, 0.2)' : 
                         inquiry.status === 'stalled' ? 'rgba(239, 68, 68, 0.2)' : 
                         'rgba(34, 197, 94, 0.2)',
              color: statusStyle.color,
            }}>
              {inquiry.status}
            </div>
          </div>
        </div>
      </div>
      
      {/* ReactFlow Handles for edge connections - Multiple handles for better routing */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '50%'
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '50%'
        }}
      />
      {/* Additional left handles for avoiding overlaps */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-top"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '25%'
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-top-target"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '25%'
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-bottom"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '75%'
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-bottom-target"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '75%'
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '50%'
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '50%'
        }}
      />
      {/* Additional right handles for avoiding overlaps */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-top"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '25%'
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-top-target"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '25%'
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-bottom"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '75%'
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-bottom-target"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: '75%'
        }}
      />
      
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
    </div>
  );
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface InquiryBoardProps {
  onGoBack?: () => void;
}

const InquiryBoard = forwardRef<InquiryBoardRef, InquiryBoardProps>(({ 
  onGoBack 
}, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [inquiries, setInquiries] = useState<InquiryNode[]>([]);
  const [layoutMode, setLayoutMode] = useState<'status' | 'relationship'>('status');
  const [selectedNodeLinks, setSelectedNodeLinks] = useState<Set<string>>(new Set());
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Create nodeTypes inside component to access state
  const nodeTypes = {
    inquiryNode: (props: any) => (
      <InquiryNodeComponent 
        {...props} 
        onClick={(nodeId: string) => handleNodeClick(nodeId)}
        isLinksVisible={selectedNodeLinks.has(props.id)}
      />
    ),
  };

  // Load inquiry data from test file (only in demo mode)
  useEffect(() => {
    const loadInquiries = async () => {
      logDemoModeStatus('InquiryBoard');
      
      if (!isDemoMode()) {
        console.log('🚫 Production mode: No test data loaded for inquiry board');
        setInquiries([]);
        return;
      }

      try {
        console.log('📊 Demo mode: Loading inquiry data from test.json');
        const response = await fetch('/testcases/test_inquiry_board/test.json');
        const data: InquiryNode[] = await response.json();
        console.log('✅ Demo mode: Loaded', data.length, 'inquiries from test data');
        setInquiries(data);
      } catch (error) {
        console.error('❌ Failed to load inquiry test data:', error);
        setInquiries([]);
      }
    };

    loadInquiries();
  }, []);

  // Handle node click to toggle link visibility
  const handleNodeClick = useCallback((nodeId: string) => {
    console.log('🖱️ Node clicked:', nodeId);
    setSelectedNodeLinks(prev => {
      const newSet = new Set<string>();
      
      // If this node is already selected, deselect it (toggle off)
      if (prev.has(nodeId)) {
        console.log('🔄 Deactivating node:', nodeId);
        return newSet; // Return empty set to deactivate all
      } else {
        // Otherwise, activate only this node (deactivate any previous selection)
        console.log('🔄 Activating node:', nodeId, 'and deactivating previous selection');
        newSet.add(nodeId);
        return newSet;
      }
    });
  }, []);

  // Generate edges based on selected nodes
  const generateVisibleEdges = useCallback(() => {
    const visibleEdges: Edge[] = [];
    
    console.log('🔍 Generating edges for selected nodes:', Array.from(selectedNodeLinks));
    console.log('📊 Available inquiries:', inquiries.map(i => i.qid));
    
    selectedNodeLinks.forEach(nodeId => {
      const inquiry = inquiries.find(i => i.qid === nodeId);
      console.log(`🔎 Processing node ${nodeId}:`, inquiry ? `Found with ${inquiry.links.length} links` : 'Not found');
      
      if (inquiry) {
        inquiry.links.forEach(link => {
          const targetExists = inquiries.some(i => i.qid === link.qid);
          console.log(`  → Link to ${link.qid} (${link.type}): target exists = ${targetExists}`);
          
          if (targetExists) {
            const connectionColor = getRelationshipColor(link.type);
            console.log(`🔗 Creating edge: ${inquiry.qid} → ${link.qid}`);
            visibleEdges.push({
              id: `${inquiry.qid}-${link.qid}`,
              source: inquiry.qid,
              target: link.qid,
              sourceHandle: 'right',
              targetHandle: 'left-target',
              type: 'default',
              animated: true,
              style: { 
                stroke: connectionColor, 
                strokeWidth: 3,
                strokeDasharray: link.type === 'challenges' ? '8,4' : undefined,
              },
              label: link.type.replace('_', ' ').toUpperCase(),
              labelStyle: { 
                fontSize: '10px', 
                fontWeight: '700',
                fill: connectionColor,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
              labelBgStyle: { 
                fill: 'rgba(255, 255, 255, 0.95)',
                fillOpacity: 0.95,
                stroke: connectionColor,
                strokeWidth: 0.5,
              },
              labelBgPadding: [6, 8],
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 18,
                height: 18,
                color: connectionColor,
              },
            });
          }
        });
      }
    });
    
    console.log('✅ Generated visible edges:', visibleEdges);
    console.log('🔍 First edge details:', JSON.stringify(visibleEdges[0], null, 2));
    console.log('🔍 Edge structure check:', visibleEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      hasLabel: !!e.label,
      hasStyle: !!e.style,
      hasMarkerEnd: !!e.markerEnd
    })));
    return visibleEdges;
  }, [selectedNodeLinks, inquiries]);

  // Generate all edges for relationship/network mode
  const generateAllEdges = useCallback(() => {
    console.log('🔺 Generating triangular edges for network view');
    console.log('🔍 DEBUGGING - Total inquiries available:', inquiries.length);
    
    // Debug all inquiries and their links
    inquiries.forEach((inq, i) => {
      console.log(`  ${i + 1}. QID: ${inq.qid} (${inq.type}) - Links: ${inq.links?.length || 0}`);
      if (inq.links && inq.links.length > 0) {
        inq.links.forEach((link, j) => {
          console.log(`    Link ${j + 1}: → ${link.qid} (${link.type})`);
        });
      } else {
        console.log('    No links found for this inquiry');
      }
    });
    
    const allEdges: any[] = [];
    
    inquiries.forEach(inquiry => {
      inquiry.links.forEach(link => {
        const targetExists = inquiries.some(inq => inq.qid === link.qid);
        console.log(`🔗 Processing link: ${inquiry.qid} → ${link.qid} (${link.type}): target exists = ${targetExists}`);
        
        if (targetExists) {
          const sourceNode = inquiries.find(inq => inq.qid === inquiry.qid);
          const targetNode = inquiries.find(inq => inq.qid === link.qid);
          
          if (sourceNode && targetNode) {
            // Determine proper handles for triangle formation
            let sourceHandle = 'bottom';
            let targetHandle = 'top';
            
            // IBIS Triangle Logic with overlap prevention:
            // Issue (top) → Position (bottom-left): Issue.bottom → Position.top-target
            // Position (bottom-left) → Argument (bottom-right): Position.right-top → Argument.left-top-target (depends_on)  
            // Argument (bottom-right) → Position (bottom-left): Argument.left-bottom → Position.right-bottom-target (supports)
            
            if (sourceNode.type === 'issue' && targetNode.type === 'position') {
              sourceHandle = 'bottom';
              targetHandle = 'top-target';
            } else if (sourceNode.type === 'position' && targetNode.type === 'argument') {
              // Position → Argument: use top handles to avoid overlap with reverse direction
              if (link.type === 'depends_on') {
                sourceHandle = 'right-top';
                targetHandle = 'left-top-target';
              } else {
                sourceHandle = 'right';
                targetHandle = 'left-target';
              }
            } else if (sourceNode.type === 'argument' && targetNode.type === 'position') {
              // Argument → Position: use bottom handles to avoid overlap with reverse direction
              if (link.type === 'supports') {
                sourceHandle = 'left-bottom';
                targetHandle = 'right-bottom-target';
              } else {
                sourceHandle = 'left';
                targetHandle = 'right-target';
              }
            } else if (sourceNode.type === 'argument' && targetNode.type === 'issue') {
              sourceHandle = 'top';
              targetHandle = 'bottom-target';
            } else if (sourceNode.type === 'position' && targetNode.type === 'issue') {
              sourceHandle = 'top';
              targetHandle = 'bottom-target';
            } else {
              // Default fallback
              sourceHandle = 'right';
              targetHandle = 'left-target';
            }
            
            const connectionColor = getRelationshipColor(link.type);
            console.log(`� Triangle edge: ${sourceNode.type} → ${targetNode.type} (${sourceHandle} → ${targetHandle})`);
            
            allEdges.push({
              id: `${inquiry.qid}-${link.qid}`,
              source: inquiry.qid,
              target: link.qid,
              sourceHandle,
              targetHandle,
              type: 'straight', // Use straight lines for cleaner triangles
              animated: false, // Disable animation for cleaner look
              style: { 
                stroke: connectionColor, 
                strokeWidth: 2,
                strokeDasharray: link.type === 'challenges' ? '6,3' : undefined,
                opacity: 0.9,
              },
              label: link.type.replace('_', ' ').toUpperCase(),
              labelStyle: { 
                fontSize: '9px',
                fontWeight: '600',
                fill: connectionColor,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              },
              labelBgStyle: { 
                fill: 'rgba(255, 255, 255, 0.95)',
                fillOpacity: 0.95,
                stroke: connectionColor,
                strokeWidth: 0.5,
              },
              labelBgPadding: [4, 6],
              markerEnd: {
                type: 'arrowclosed',
                width: 14,
                height: 14,
                color: connectionColor,
              },
            });
          }
        }
      });
    });
    
    console.log('🌐 Generated all edges:', allEdges.length, allEdges);
    return allEdges;
  }, [inquiries]);

  // Helper function to get relationship colors - Updated with distinct colors
  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'supports': return '#16a34a'; // Strong green
      case 'challenges': return '#dc2626'; // Strong red  
      case 'responds_to': return '#2563eb'; // Strong blue
      case 'clarifies': return '#9333ea'; // Strong purple
      case 'depends_on': return '#ea580c'; // Strong orange
      default: return '#6b7280'; // Neutral gray
    }
  };

  // Layout by Status (current implementation)
  // Helper function to get node visual state
  const getNodeState = (nodeId: string) => {
    const isSourceNode = selectedNodeLinks.has(nodeId);
    const isTargetNode = !isSourceNode && Array.from(selectedNodeLinks).some(sourceId => {
      const sourceInquiry = inquiries.find(inq => inq.qid === sourceId);
      return sourceInquiry?.links.some(link => link.qid === nodeId) || false;
    });
    
    console.log(`🎯 Node ${nodeId}: isSource=${isSourceNode}, isTarget=${isTargetNode}, selectedNodes=${Array.from(selectedNodeLinks)}`);
    
    return {
      isSourceNode,
      isTargetNode,
      isLinksVisible: isSourceNode || isTargetNode
    };
  };

  const createStatusLayout = () => {
    const rowHeight = 200;
    const nodeWidth = 240;
    const nodeSpacing = 260;
    const startX = 120;

    const inquiryNodes: Node[] = [];

    // Group inquiries by status
    const openInquiries = inquiries.filter((i: InquiryNode) => i.status === 'open');
    const stalledInquiries = inquiries.filter((i: InquiryNode) => i.status === 'stalled');
    const resolvedInquiries = inquiries.filter((i: InquiryNode) => i.status === 'resolved');

    // Create lane divider nodes
    const laneNodes: Node[] = [
      {
        id: 'lane-open',
        position: { x: 20, y: 80 },
        data: { label: 'OPEN' },
        type: 'default',
        draggable: false,
        selectable: false,
        style: {
          background: 'rgba(251, 191, 36, 0.2)',
          color: '#a16207',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          borderRadius: '6px',
          padding: '8px 14px',
          fontSize: '11px',
          fontWeight: '600',
          textAlign: 'center',
          width: '75px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
      {
        id: 'lane-stalled',
        position: { x: 20, y: 280 },
        data: { label: 'STALLED' },
        type: 'default',
        draggable: false,
        selectable: false,
        style: {
          background: 'rgba(239, 68, 68, 0.2)',
          color: '#b91c1c',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '6px',
          padding: '8px 14px',
          fontSize: '11px',
          fontWeight: '600',
          textAlign: 'center',
          width: '75px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
      {
        id: 'lane-resolved',
        position: { x: 20, y: 480 },
        data: { label: 'RESOLVED' },
        type: 'default',
        draggable: false,
        selectable: false,
        style: {
          background: 'rgba(34, 197, 94, 0.2)',
          color: '#166534',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: '6px',
          padding: '8px 14px',
          fontSize: '11px',
          fontWeight: '600',
          textAlign: 'center',
          width: '75px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
    ];

    // Position open inquiries
    openInquiries.forEach((inquiry: InquiryNode, index: number) => {
      const nodeState = getNodeState(inquiry.qid);
      inquiryNodes.push({
        id: inquiry.qid,
        position: { x: startX + (index * nodeSpacing), y: 60 },
        data: { ...inquiry, ...nodeState } as any,
        type: 'inquiryNode',
        draggable: true,
        selectable: true,
      });
    });

    // Position stalled inquiries
    stalledInquiries.forEach((inquiry: InquiryNode, index: number) => {
      const nodeState = getNodeState(inquiry.qid);
      inquiryNodes.push({
        id: inquiry.qid,
        position: { x: startX + (index * nodeSpacing), y: 260 },
        data: { ...inquiry, ...nodeState } as any,
        type: 'inquiryNode',
        draggable: true,
        selectable: true,
      });
    });

    // Position resolved inquiries
    resolvedInquiries.forEach((inquiry: InquiryNode, index: number) => {
      const nodeState = getNodeState(inquiry.qid);
      inquiryNodes.push({
        id: inquiry.qid,
        position: { x: startX + (index * nodeSpacing), y: 460 },
        data: { ...inquiry, ...nodeState } as any,
        type: 'inquiryNode',
        draggable: true,
        selectable: true,
      });
    });

    return [...laneNodes, ...inquiryNodes];
  };

  // Layout by Relationship (network-based)
  const createRelationshipLayout = () => {
    console.log('🔺 Creating triangular cluster layout based on IBIS structure');
    
    // Find connected clusters (Issue → Position → Argument triangles)
    const clusters: Array<{
      issue: InquiryNode | null;
      positions: InquiryNode[];
      arguments: InquiryNode[];
    }> = [];
    
    const processedNodes = new Set<string>();
    
    // Start with each issue and find its connected positions and arguments
    const issues = inquiries.filter(inq => inq.type === 'issue');
    
    issues.forEach(issue => {
      if (processedNodes.has(issue.qid)) return;
      
      // Find positions that respond to this issue
      const connectedPositions = inquiries.filter(inq => 
        inq.type === 'position' && 
        inq.links.some(link => link.qid === issue.qid && link.type === 'responds_to')
      );
      
      // Find arguments that support these positions  
      const connectedArguments: InquiryNode[] = [];
      connectedPositions.forEach(position => {
        const args = inquiries.filter(inq => 
          inq.type === 'argument' && 
          inq.links.some(link => link.qid === position.qid && link.type === 'supports')
        );
        connectedArguments.push(...args);
      });
      
      clusters.push({
        issue: issue,
        positions: connectedPositions,
        arguments: connectedArguments
      });
      
      // Mark all nodes in this cluster as processed
      processedNodes.add(issue.qid);
      connectedPositions.forEach(p => processedNodes.add(p.qid));
      connectedArguments.forEach(a => processedNodes.add(a.qid));
    });
    
    // Handle orphaned positions and arguments
    const orphanedPositions = inquiries.filter(inq => 
      inq.type === 'position' && !processedNodes.has(inq.qid)
    );
    const orphanedArguments = inquiries.filter(inq => 
      inq.type === 'argument' && !processedNodes.has(inq.qid)
    );
    
    if (orphanedPositions.length > 0 || orphanedArguments.length > 0) {
      clusters.push({
        issue: null,
        positions: orphanedPositions,
        arguments: orphanedArguments
      });
    }
    
    console.log('� Found', clusters.length, 'triangular clusters');
    clusters.forEach((cluster, i) => {
      console.log(`Cluster ${i + 1}:`, {
        issue: cluster.issue?.title || 'None',
        positions: cluster.positions.length,
        arguments: cluster.arguments.length
      });
    });
    
    // Layout parameters - much more space for clear triangles
    const clusterSpacing = 800; // Much larger space between triangle centers
    const triangleSize = 350; // Larger triangle size
    const clustersPerRow = 2; // Fewer triangles per row for more space
    const startX = 400;
    const startY = 300;
    
    const inquiryNodes: Node[] = [];
    
    clusters.forEach((cluster, clusterIndex) => {
      // Calculate triangle center position
      const row = Math.floor(clusterIndex / clustersPerRow);
      const col = clusterIndex % clustersPerRow;
      const centerX = startX + (col * clusterSpacing);
      const centerY = startY + (row * clusterSpacing);
      
      console.log(`🔺 Positioning cluster ${clusterIndex + 1} at center (${centerX}, ${centerY})`);
      
      // Position Issue at top of triangle
      if (cluster.issue) {
        const nodeState = getNodeState(cluster.issue.qid);
        inquiryNodes.push({
          id: cluster.issue.qid,
          position: { 
            x: centerX, 
            y: centerY - triangleSize * 0.8 // Higher top vertex for clearer triangle
          },
          data: { ...cluster.issue, ...nodeState } as any,
          type: 'inquiryNode',
          draggable: true,
          selectable: true,
        });
      }
      
      // Position Positions at bottom-left of triangle
      cluster.positions.forEach((position, index) => {
        const nodeState = getNodeState(position.qid);
        const offsetX = cluster.positions.length > 1 ? (index - (cluster.positions.length - 1) / 2) * 100 : 0;
        const offsetY = cluster.positions.length > 1 ? index * 30 : 0;
        inquiryNodes.push({
          id: position.qid,
          position: { 
            x: centerX - triangleSize * 0.7 + offsetX, 
            y: centerY + triangleSize * 0.3 + offsetY // Moved up to create more space for edges
          },
          data: { ...position, ...nodeState } as any,
          type: 'inquiryNode',
          draggable: true,
          selectable: true,
        });
      });
      
      // Position Arguments at bottom-right of triangle
      cluster.arguments.forEach((argument, index) => {
        const nodeState = getNodeState(argument.qid);
        const offsetX = cluster.arguments.length > 1 ? (index - (cluster.arguments.length - 1) / 2) * 100 : 0;
        const offsetY = cluster.arguments.length > 1 ? index * 30 : 0;
        
        // If there are multiple relationships (position-argument pairs), stagger them vertically
        const verticalStagger = cluster.positions.length > 1 && cluster.arguments.length > 1 ? index * 80 : 0;
        
        inquiryNodes.push({
          id: argument.qid,
          position: { 
            x: centerX + triangleSize * 0.7 + offsetX, 
            y: centerY + triangleSize * 0.7 + offsetY + verticalStagger // Lower and staggered to avoid overlaps
          },
          data: { ...argument, ...nodeState } as any,
          type: 'inquiryNode',
          draggable: true,
          selectable: true,
        });
      });
    });
    
    console.log('🔺 Triangular layout created:', inquiryNodes.length, 'nodes in', clusters.length, 'triangles');
    return inquiryNodes;
  };

  // Initialize nodes based on layout mode
  useEffect(() => {
    if (inquiries.length === 0) return;

    let newNodes: Node[] = [];
    
    if (layoutMode === 'status') {
      newNodes = createStatusLayout();
    } else {
      newNodes = createRelationshipLayout();
    }

    console.log('🎯 Setting nodes with IDs:', newNodes.map(n => n.id));
    setNodes(newNodes);
  }, [setNodes, inquiries, layoutMode, selectedNodeLinks]); // Added selectedNodeLinks to dependencies

  // Update edges when selected nodes change
  useEffect(() => {
    console.log('🔄 Edge update effect triggered');
    console.log('📊 Current selectedNodeLinks:', Array.from(selectedNodeLinks));
    console.log('📊 Current edges state:', edges.length, edges);
    console.log('📊 Current layout mode:', layoutMode);
    
    let visibleEdges;
    
    if (layoutMode === 'relationship') {
      // In relationship mode, show ALL edges to create a network view
      console.log('🌐 Relationship mode: showing all edges');
      visibleEdges = generateAllEdges();
    } else {
      // In status mode, only show edges for selected nodes
      visibleEdges = generateVisibleEdges();
    }
    
    console.log('🔗 Updating edges for selected nodes:', Array.from(selectedNodeLinks), 'Generated edges:', visibleEdges.length);
    console.log('🎯 Setting edges:', visibleEdges.map(e => `${e.source} → ${e.target} (${e.label})`));
    
    setEdges(visibleEdges);
    
    // Log after setting
    setTimeout(() => {
      console.log('⏰ Edge state after setEdges:', edges.length);
    }, 100);
  }, [selectedNodeLinks, generateVisibleEdges, generateAllEdges, setEdges, layoutMode]);

  // Custom onEdgesChange to prevent interference with our manual edge management
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      console.log('🔗 ReactFlow edges change detected:', changes);
      console.log('🔍 Change types:', changes.map(c => c.type));
      
      // Only allow selection changes, not removal or other modifications
      const filteredChanges = changes.filter(change => 
        change.type === 'select' || change.type === 'position'
      );
      
      console.log('✅ Filtered changes:', filteredChanges);
      
      if (filteredChanges.length > 0) {
        onEdgesChange(filteredChanges);
      }
    },
    [onEdgesChange]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('🔗 ReactFlow onConnect called:', params);
      // Don't automatically add edges since we manage them manually
      // setEdges((eds) => addEdge(params, eds))
    },
    [setEdges],
  );

  const handleGoBack = useCallback(() => {
    if (onGoBack) {
      onGoBack();
    }
  }, [onGoBack]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    goBackToViews: handleGoBack,
  }), [handleGoBack]);

  return (
    <div className="w-full h-full relative">
      {/* Header with Go Back Button */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '12px 20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(226, 232, 240, 0.5)',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          Inquiry Board
          <span style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#64748b',
            background: 'rgba(100, 116, 139, 0.1)',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {inquiries.length} inquiries
            {isDemoMode() && <span style={{ marginLeft: '4px', color: '#f59e0b' }}>• DEMO</span>}
          </span>
        </h2>
        
        {/* Layout Mode Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(241, 245, 249, 0.8)',
            borderRadius: '8px',
            padding: '4px',
            gap: '2px',
          }}>
            <button
              onClick={() => setLayoutMode('status')}
              style={{
                background: layoutMode === 'status' ? 'white' : 'transparent',
                color: layoutMode === 'status' ? '#1e293b' : '#64748b',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                boxShadow: layoutMode === 'status' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              }}
            >
              By Status
            </button>
            <button
              onClick={() => setLayoutMode('relationship')}
              style={{
                background: layoutMode === 'relationship' ? 'white' : 'transparent',
                color: layoutMode === 'relationship' ? '#1e293b' : '#64748b',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                boxShadow: layoutMode === 'relationship' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              }}
            >
              By Relationship
            </button>
          </div>

          <button
            onClick={handleGoBack}
            style={{
              background: 'linear-gradient(135deg, #0891b2, #0e7490)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(8, 145, 178, 0.3)',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'scale(1.05)';
              target.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.4)';
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'scale(1)';
              target.style.boxShadow = '0 2px 8px rgba(8, 145, 178, 0.3)';
            }}
          >
            ← Go Back to Views
          </button>
        </div>
      </div>

      {/* Empty State for Non-Demo Mode */}
      {!isDemoMode() && inquiries.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '16px',
          fontWeight: '500',
        }}>
          <div>Inquiry Board</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
            No inquiries available in production mode
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.5 }}>
            Enable demo mode to see test inquiries
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        fitView
        className="inquiryboard-canvas"
        snapToGrid={true}
        snapGrid={[10, 10]}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
      >
        <Controls />
        <MiniMap 
          nodeStrokeWidth={2}
          nodeColor={(node) => {
            if (node.id.startsWith('lane-')) return '#94a3b8';
            const status = (node.data as any)?.status;
            if (typeof status === 'string') {
              switch (status.toLowerCase()) {
                case 'open': return 'rgba(251, 191, 36, 0.5)';
                case 'stalled': return 'rgba(239, 68, 68, 0.5)';
                case 'resolved': return 'rgba(34, 197, 94, 0.5)';
                default: return 'rgba(148, 163, 184, 0.5)';
              }
            }
            return 'rgba(148, 163, 184, 0.5)';
          }}
          maskColor="rgba(255, 255, 255, 0.85)"
          style={{ 
            border: '1px solid #e2e8f0',
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#64748b"
        />
      </ReactFlow>
    </div>
  );
});

// Add display name for debugging
InquiryBoard.displayName = 'InquiryBoard';

export default InquiryBoard;
