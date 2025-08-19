'use client';

import React, { useCallback, useImperativeHandle, forwardRef, useRef, useState, useEffect } from 'react';
import { TiFlowChildren } from 'react-icons/ti';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeChange,
  Handle,
  Position,
  ReactFlowInstance,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, RotateCcw, Network } from 'lucide-react';
import { isDemoMode, logDemoModeStatus } from '../utils/demoMode';

// Updated interface for unified issue structure
export interface InquiryIssue {
  qid: string;
  title: string;
  status: 'open' | 'stalled' | 'resolved';
  
  // Sentence references from the first layer API
  sentenceRefs?: string[];
  
  // Unified content fields from enrichment
  position_suggested_by?: {
    text: string;
    confidence: 'low' | 'medium' | 'high';
  };
  argument_suggested_by?: {
    text: string;
    basis: 'data' | 'mechanism' | 'pattern' | 'comparison' | 'other';
  };
  
  links: IssueLink[];
}

// New relationship types for issue-to-issue connections
export interface IssueLink {
  qid: string; // target issue node
  type: 'suggested_by' | 'generalized_from' | 'specialized_from' | 'replaces';
  explanation: string;
}

// Expose methods for parent components to interact with the inquiry board
export interface InquiryBoardRef {
  goBackToViews: () => void;
}

// Helper function to get suggested content sections for display
const getSuggestedSections = (issue: InquiryIssue) => {
  const sections = [];
  if (issue.position_suggested_by) {
    sections.push({
      type: 'position',
      text: issue.position_suggested_by.text,
      color: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    });
  }
  if (issue.argument_suggested_by) {
    sections.push({
      type: 'argument', 
      text: issue.argument_suggested_by.text,
      color: 'rgba(139, 69, 193, 0.1)',
      borderColor: 'rgba(139, 69, 193, 0.3)'
    });
  }
  return sections;
};

// Custom node component for inquiry items
const InquiryNodeComponent: React.FC<{
  data: any;
  selected?: boolean;
  onClick?: (nodeId: string) => void;
  isLinksVisible?: boolean;
  showHandles?: boolean; // New prop to control ReactFlow handles
  maxWidth?: string; // Optional max width for network view
}> = ({ data, selected, onClick, showHandles = false, maxWidth }) => {
  const inquiry = data as InquiryIssue;
  const suggestedSections = getSuggestedSections(inquiry);
  
  console.log(`🎨 Rendering node ${inquiry.qid}: status=${inquiry.status}, hasSuggested=${suggestedSections.length > 0}`);

  // Color scheme based on status only (all are issues)
  const getIssueColors = (status: string) => {
    const schemes = {
      'open': {
        bg: 'rgba(239, 246, 255, 0.8)',
        headerBg: 'rgba(59, 130, 246, 0.1)',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        accent: '#2563eb',
        icon: '❓',
        label: 'ISSUE'
      },
      'investigating': {
        bg: 'rgba(255, 247, 237, 0.8)',
        headerBg: 'rgba(245, 158, 11, 0.1)',
        border: '2px solid rgba(245, 158, 11, 0.3)',
        accent: '#d97706',
        icon: '🔍',
        label: 'ISSUE'
      },
      'resolved': {
        bg: 'rgba(240, 253, 244, 0.8)',
        headerBg: 'rgba(34, 197, 94, 0.1)',
        border: '2px solid rgba(34, 197, 94, 0.3)',
        accent: '#16a34a',
        icon: '✅',
        label: 'ISSUE'
      },
      'stalled': {
        bg: 'rgba(255, 251, 235, 0.8)',
        headerBg: 'rgba(251, 191, 36, 0.1)',
        border: '2px solid rgba(251, 191, 36, 0.3)',
        accent: '#d97706',
        icon: '⏸️',
        label: 'ISSUE'
      },
      'closed': {
        bg: 'rgba(249, 250, 251, 0.8)',
        headerBg: 'rgba(107, 114, 128, 0.1)',
        border: '2px solid rgba(107, 114, 128, 0.3)',
        accent: '#6b7280',
        icon: '�',
        label: 'ISSUE'
      }
    };
    return schemes[status as keyof typeof schemes] || schemes.open;
  };
  
  const colors = getIssueColors(inquiry.status);

  return (
    <div className="inquiry-node-wrapper" style={{ position: 'relative', zIndex: 1000 }}>
      <div 
        className="inquiry-node" 
        onClick={() => onClick && onClick(inquiry.qid)}
        style={{
          background: colors.bg,
          border: colors.border,
          borderRadius: '12px',
          padding: '0px',
          width: '100%', // Changed from fixed 240px to full width
          maxWidth: maxWidth || 'none', // Apply max width if provided
          minHeight: '140px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)',
        }}
      >

        {/* Content Section */}
        <div style={{
          padding: '12px 12px 40px 12px', // Added extra bottom padding for footer space
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {/* Title */}
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: colors.accent,
            lineHeight: '1.3',
            marginBottom: '8px',
          }}>
            {inquiry.title}
          </div>

          {/* Suggested Content Sections */}
          {suggestedSections.map((section, index) => (
            <div key={index} style={{
              fontSize: '11px',
              backgroundColor: section.color,
              padding: '8px',
              borderRadius: '6px',
              lineHeight: '1.3',
              border: `1px solid ${section.borderColor}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px',
                  opacity: 0.8,
                }}>
                  {section.type}
                </div>
                <div style={{ fontStyle: 'italic' }}>
                  {section.text}
                </div>
              </div>
            </div>
          ))}

          {/* Links Count Badge */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            fontSize: '9px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.2px',
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#6366f1',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <TiFlowChildren size={12} />
            {inquiry.links.length}
          </div>

          {/* Status Badge */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            fontSize: '9px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.2px',
            background: inquiry.status === 'open' ? 'rgba(251, 191, 36, 0.2)' : 
                       inquiry.status === 'stalled' ? 'rgba(239, 68, 68, 0.2)' : 
                       'rgba(34, 197, 94, 0.2)',
            color: colors.accent,
          }}>
            {inquiry.status}
          </div>
        </div>
      </div>

      {/* React Flow Handles - only show when used in ReactFlow */}
      {showHandles && (
        <>
          <Handle
            type="source"
            position={Position.Left}
            id="left"
            style={{
              background: '#555',
              width: 8,
              height: 8,
              border: '2px solid white',
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
        </>
      )}
    </div>
  );
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface InquiryBoardProps {
  onGoBack?: () => void;
  treeStructure?: {
    nodes: any[];
    activePath: string[];
  };
  pageId?: string;
}

const InquiryBoard = forwardRef<InquiryBoardRef, InquiryBoardProps>(({ 
  onGoBack,
  treeStructure,
  pageId 
}, ref) => {
  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [layoutMode, setLayoutMode] = useState<'status' | 'relationship'>('status');
  const [inquiries, setInquiries] = useState<InquiryIssue[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Custom node change handler that restricts movement in status mode
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (layoutMode === 'status') {
        const restrictedChanges = changes.map(change => {
          if (change.type === 'position' && change.dragging) {
            const node = nodes.find((n: Node) => n.id === change.id);
            if (node && node.data) {
              const inquiry = node.data as unknown as InquiryIssue;
              // Get the fixed Y position for this status
              const statusY = inquiry.status === 'open' ? 150 : 
                            inquiry.status === 'stalled' ? 350 : 550;
              
              return {
                ...change,
                position: change.position ? {
                  x: change.position.x, // Allow horizontal movement
                  y: statusY // Lock Y position based on status
                } : undefined
              };
            }
          }
          return change;
        });
        onNodesChangeOriginal(restrictedChanges);
      } else {
        // In relationship mode, allow free movement
        onNodesChangeOriginal(changes);
        
        // Update edges when nodes finish moving (not while dragging for performance)
        const hasPositionChange = changes.some(change => 
          change.type === 'position' && !('dragging' in change && change.dragging)
        );
        
        if (hasPositionChange && inquiries.length > 0) {
          // Use setTimeout to ensure nodes are updated before recreating edges
          setTimeout(() => {
            const updatedEdges = createEdgesFromLinks();
            setEdges(updatedEdges);
          }, 0);
        }
      }
    },
    [layoutMode, nodes, onNodesChangeOriginal, inquiries, setEdges]
  );

  // Tooltip state for edge hover
  const [edgeTooltip, setEdgeTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
    relationshipType: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
    relationshipType: '',
  });

  // Edge event handlers for tooltip
  const onEdgeMouseEnter = useCallback((event: React.MouseEvent, edge: Edge) => {
    const edgeData = edge.data as any;
    if (edgeData?.explanation) {
      setEdgeTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        content: edgeData.explanation,
        relationshipType: edgeData.relationshipType || (edge.label as string) || '',
      });
    }
  }, []);

  const onEdgeMouseLeave = useCallback(() => {
    setEdgeTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  // Create nodeTypes inside component
  const nodeTypes = {
    inquiryNode: (props: any) => (
      <InquiryNodeComponent
        {...props}
        onClick={(nodeId: string) => handleInquiryNodeClick(nodeId)}
        showHandles={true} // Enable handles when used in ReactFlow
        maxWidth="280px" // Limit width in network view
      />
    ),
  };

  // Load inquiry data - from API in production mode, from test file in demo mode
  useEffect(() => {
    const loadInquiries = async () => {
      logDemoModeStatus('InquiryBoard');
      setIsLoadingInquiries(true);
      setLoadingError(null);
      
      if (isDemoMode()) {
        // Demo mode: Load from test.json
        try {
          const response = await fetch('/testcases/test_inquiry_board/test.json');
          const data: InquiryIssue[] = await response.json();
          setInquiries(data);
        } catch (error) {
          setLoadingError('Failed to load test data');
          setInquiries([]);
        }
      } else {
        // Production mode: Call inquiry APIs
        try {
          
          // Use the tree structure passed from the narrative system
          const currentTreeStructure = treeStructure || {
            nodes: [],
            activePath: []
          };
          
          console.log('📝 Using tree structure with', currentTreeStructure.nodes.length, 'nodes and active path:', currentTreeStructure.activePath);
          
          // Check if we have any narrative content
          if (currentTreeStructure.nodes.length === 0) {
            setInquiries([]);
            setIsLoadingInquiries(false);
            return;
          }
          
          
          // Step 1: Call the first layer API to extract basic issues
          const basicIssuesResponse = await fetch('/api/inquiry-issues', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              treeStructure: currentTreeStructure,
              pageId: pageId || 'default-page'
            }),
          });
          
          if (!basicIssuesResponse.ok) {
            throw new Error(`Basic issues API failed: ${basicIssuesResponse.status}`);
          }
          
          const basicIssuesData = await basicIssuesResponse.json();
          
          if (!basicIssuesData.issues || basicIssuesData.issues.length === 0) {
            setInquiries([]);
            setIsLoadingInquiries(false);
            return;
          }
          
          
          // Step 2: Call the second layer API to enrich the issues
          const enrichmentResponse = await fetch('/api/inquiry-enrichment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              issues: basicIssuesData.issues,
              treeStructure: currentTreeStructure,
              pageId: pageId || 'default-page'
            }),
          });
          
          if (!enrichmentResponse.ok) {
            throw new Error(`Enrichment API failed: ${enrichmentResponse.status}`);
          }
          
          const enrichmentData = await enrichmentResponse.json();
          
          // Use enriched issues as final data
          const finalIssues = enrichmentData.enrichedIssues || [];
          setInquiries(finalIssues);
          
        } catch (error) {
          console.error('❌ Failed to load inquiry data from APIs:', error);
          setLoadingError(error instanceof Error ? error.message : 'Failed to load inquiries');
          setInquiries([]);
        }
      }
      
      setIsLoadingInquiries(false);
    };

    loadInquiries();
  }, [treeStructure, pageId]);

  // Create status-based layout (horizontal lanes)
  const createStatusLayout = () => {
    const rowHeight = 200;
    const nodeSpacing = 260;
    const startX = 120;
    const inquiryNodes: Node[] = [];

    // Group inquiries by status
    const openInquiries = inquiries.filter(i => i.status === 'open');
    const stalledInquiries = inquiries.filter(i => i.status === 'stalled');
    const resolvedInquiries = inquiries.filter(i => i.status === 'resolved');

    // Position open inquiries
    openInquiries.forEach((inquiry, index) => {
      inquiryNodes.push({
        id: inquiry.qid,
        position: { x: startX + (index * nodeSpacing), y: 60 },
        data: inquiry as any,
        type: 'inquiryNode',
        draggable: true,
        selectable: true,
      });
    });

    // Position stalled inquiries
    stalledInquiries.forEach((inquiry, index) => {
      inquiryNodes.push({
        id: inquiry.qid,
        position: { x: startX + (index * nodeSpacing), y: 260 },
        data: inquiry as any,
        type: 'inquiryNode',
        draggable: true,
        selectable: true,
      });
    });

    // Position resolved inquiries
    resolvedInquiries.forEach((inquiry, index) => {
      inquiryNodes.push({
        id: inquiry.qid,
        position: { x: startX + (index * nodeSpacing), y: 460 },
        data: inquiry as any,
        type: 'inquiryNode',
        draggable: true,
        selectable: true,
      });
    });

    return inquiryNodes;
  };

  // Create relationship-based layout (simple grid)
  const createRelationshipLayout = () => {
    const inquiryNodes: Node[] = [];
    const issuesPerRow = 3;
    const nodeSpacing = 420; // Increased from 300 to 420 for more space
    const rowSpacing = 300; // Increased from 250 to 300 for more vertical space
    const startX = 150;
    const startY = 100;
    
    inquiries.forEach((issue, index) => {
      const row = Math.floor(index / issuesPerRow);
      const col = index % issuesPerRow;
      
      inquiryNodes.push({
        id: issue.qid,
        position: { 
          x: startX + (col * nodeSpacing), 
          y: startY + (row * rowSpacing)
        },
        data: issue as any,
        type: 'inquiryNode',
        draggable: true,
        selectable: true,
      });
    });
    
    return inquiryNodes;
  };

  // Create edges based on links between inquiries
  const createEdgesFromLinks = () => {
    const edgeList: Edge[] = [];
    

    inquiries.forEach((inquiry) => {
      if (inquiry.links && inquiry.links.length > 0) {
        inquiry.links.forEach((link, linkIndex) => {
          // Check if the linked inquiry exists in our dataset
          const targetExists = inquiries.some(inq => inq.qid === link.qid);
          if (targetExists) {
            // Get actual node positions from current nodes state
            const sourceNode = nodes.find(n => n.id === inquiry.qid);
            const targetNode = nodes.find(n => n.id === link.qid);
            
            let sourceHandle = 'right';
            let targetHandle = 'left-target';
            
            if (sourceNode && targetNode) {
              const deltaX = targetNode.position.x - sourceNode.position.x;
              const deltaY = targetNode.position.y - sourceNode.position.y;
              
              // Choose handles based on relative position with smart logic
              if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal connection is dominant
                sourceHandle = deltaX > 0 ? 'right' : 'left';
                targetHandle = deltaX > 0 ? 'left-target' : 'right-target';
              } else {
                // Vertical connection is dominant
                sourceHandle = deltaY > 0 ? 'bottom' : 'top';
                targetHandle = deltaY > 0 ? 'top-target' : 'bottom-target';
              }
              
              // Additional logic for diagonal connections
              if (Math.abs(deltaX) > 50 && Math.abs(deltaY) > 50) {
                // For diagonal connections, prefer corner handles for better visual flow
                if (deltaX > 0 && deltaY > 0) {
                  // Target is bottom-right
                  sourceHandle = 'right';
                  targetHandle = 'top-target';
                } else if (deltaX > 0 && deltaY < 0) {
                  // Target is top-right
                  sourceHandle = 'right';
                  targetHandle = 'bottom-target';
                } else if (deltaX < 0 && deltaY > 0) {
                  // Target is bottom-left
                  sourceHandle = 'left';
                  targetHandle = 'top-target';
                } else {
                  // Target is top-left
                  sourceHandle = 'left';
                  targetHandle = 'bottom-target';
                }
              }
            } else {
              // Fallback to default positions if nodes not found
              console.warn(`🔗 Could not find positions for ${inquiry.qid} or ${link.qid}, using defaults`);
            }
            
            edgeList.push({
              id: `${inquiry.qid}-${link.qid}-${linkIndex}`,
              source: inquiry.qid,
              target: link.qid,
              sourceHandle,
              targetHandle,
              type: 'bezier', // Changed from 'smoothstep' to 'bezier' for softer curves
              animated: false,
              label: link.type.replace(/_/g, ' '), // Show relationship type as label
              labelStyle: {
                fontSize: '10px',
                fontWeight: '500',
                fill: 'rgba(107, 114, 128, 0.8)',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              },
              labelBgStyle: {
                fill: 'rgba(255, 255, 255, 0.9)',
                stroke: 'rgba(229, 231, 235, 0.8)',
                strokeWidth: 1,
                fillOpacity: 0.9,
              },
              data: {
                explanation: link.explanation,
                relationshipType: link.type,
              },
              style: {
                stroke: 'rgba(156, 163, 175, 0.4)', // Very subtle gray with transparency
                strokeWidth: 1.5, // Thinner lines
                strokeDasharray: '3,3', // Subtle dashed pattern
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: 'rgba(156, 163, 175, 0.6)', // Subtle gray arrows
                width: 12,
                height: 12,
              },
            });
          }
        });
      }
    });
    
    return edgeList;
  };

  // Initialize nodes based on layout mode
  useEffect(() => {
    if (inquiries.length === 0) return;

    let newNodes: Node[] = [];
    
    if (layoutMode === 'status') {
      newNodes = createStatusLayout();
      setEdges([]); // No edges in status view
    } else {
      newNodes = createRelationshipLayout();
      const newEdges = createEdgesFromLinks();
      setEdges(newEdges); // Create edges for network view
    }
    
    setNodes(newNodes);
  }, [inquiries, layoutMode, setNodes, setEdges]);

  // Handle inquiry node click - log sentence references
  const handleInquiryNodeClick = useCallback((nodeId: string) => {
    const clickedInquiry = inquiries.find(inquiry => inquiry.qid === nodeId);
    if (clickedInquiry) {
      if (clickedInquiry.sentenceRefs && clickedInquiry.sentenceRefs.length > 0) {
        clickedInquiry.sentenceRefs.forEach((sentenceId, index) => {
        });
      } 
    }
  }, [inquiries]);

  // Handle go back button
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
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Header with controls */}
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
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
      }}>
        {/* Left: Go Back Button */}
        <button
          onClick={handleGoBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <ArrowLeft size={14} />
          Back to Views
        </button>

        {/* Center: Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e293b',
        }}>
          <Network size={20} />
          Inquiry Board
          {isLoadingInquiries ? (
            <span style={{
              fontSize: '12px',
              fontWeight: '400',
              color: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '2px 8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                border: '2px solid transparent',
                borderTop: '2px solid currentColor',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              analyzing...
            </span>
          ) : (
            <span style={{
              fontSize: '12px',
              fontWeight: '400',
              color: '#64748b',
              background: '#f1f5f9',
              padding: '2px 8px',
              borderRadius: '12px',
            }}>
              {inquiries.length} issues
            </span>
          )}
        </div>

        {/* Right: Layout Toggle */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '2px',
        }}>
          <button
            onClick={() => setLayoutMode('status')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: layoutMode === 'status' ? '#0891b2' : 'transparent',
              color: layoutMode === 'status' ? 'white' : '#64748b',
            }}
          >
            Status
          </button>
          <button
            onClick={() => setLayoutMode('relationship')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: layoutMode === 'relationship' ? '#0891b2' : 'transparent',
              color: layoutMode === 'relationship' ? 'white' : '#64748b',
            }}
          >
            Network
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingInquiries ? (
        /* Loading State */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          paddingTop: '80px',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '24px 32px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#374151'
            }}>
              {isDemoMode() ? 'Loading demo inquiries...' : 'Analyzing narrative for inquiries...'}
            </div>
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: '1.5'
          }}>
            {isDemoMode() 
              ? 'Loading test inquiry data from demo files'
              : 'AI is extracting and enriching inquiry issues from your narrative content. This may take a moment.'
            }
          </div>
        </div>
      ) : loadingError ? (
        /* Error State */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          paddingTop: '80px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '20px 24px',
            background: 'rgba(254, 242, 242, 0.9)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            maxWidth: '500px'
          }}>
            <div style={{
              fontSize: '24px'
            }}>
              ⚠️
            </div>
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#dc2626',
                marginBottom: '4px'
              }}>
                Failed to Load Inquiries
              </div>
              <div style={{
                fontSize: '14px',
                color: '#7f1d1d'
              }}>
                {loadingError}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setLoadingError(null);
              // Trigger a reload by updating the effect
              const loadInquiries = async () => {
                // This will re-trigger the useEffect
                setInquiries([]);
              };
              loadInquiries();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            Try Again
          </button>
        </div>
      ) : inquiries.length === 0 ? (
        /* Empty State */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          paddingTop: '80px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '8px'
          }}>
            🤔
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px'
          }}>
            No Inquiries Found
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: '1.5'
          }}>
            {!treeStructure || treeStructure.nodes.length === 0
              ? 'Write some narrative content first to generate inquiry questions.'
              : 'No inquiry issues were found in your current narrative. Try adding more analytical content or questions.'
            }
          </div>
        </div>
      ) : layoutMode === 'status' ? (
        /* Status View - Vertical Columns with Vertical Scrolling (Kanban Style) */
        <div style={{ 
          display: 'flex', 
          width: '100%', 
          height: '100%',
          paddingTop: '80px', // Account for header
          gap: '8px', // Reduced gap between columns
          padding: '80px 8px 0px 8px', // Extended to bottom (removed bottom padding)
        }}>
          {/* Open Issues Column */}
          <div style={{
            flex: 1,
            background: 'rgba(59, 130, 246, 0.03)', // Changed to blue to match cards
            borderRadius: '8px 8px 0px 0px', // Only top corners rounded
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: '250px',
          }}>
                        <div style={{
              fontSize: '14px', // Reduced font size
              fontWeight: '700',
              color: '#2563eb', // Changed to blue to match cards
              letterSpacing: '0.5px', // Reduced letter spacing
              textTransform: 'uppercase',
              marginBottom: '12px', // Reduced margin
              display: 'flex',
              alignItems: 'center',
              gap: '6px', // Reduced gap
              flexShrink: 0, // Don't shrink the header
            }}>
              Open Inquiries
              <span style={{ 
                fontSize: '12px', 
                background: 'rgba(59, 130, 246, 0.1)', // Changed to blue
                padding: '2px 8px', 
                borderRadius: '12px',
                fontWeight: '500',
              }}>
                {inquiries.filter(i => i.status === 'open').length}
              </span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px', // Reduced gap between cards
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1, // Take remaining space
              paddingRight: '4px', // Reduced padding
            }}>
              {inquiries.filter(i => i.status === 'open').map(inquiry => (
                <div key={inquiry.qid} style={{ width: '100%' }}>
                  <InquiryNodeComponent
                    data={inquiry}
                    selected={false}
                    onClick={(nodeId: string) => handleInquiryNodeClick(nodeId)}
                  />
                </div>
              ))}
              {inquiries.filter(i => i.status === 'open').length === 0 && (
                <div style={{
                  color: 'rgba(59, 130, 246, 0.4)', // Changed to blue
                  fontStyle: 'italic',
                  padding: '40px 20px',
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  No open issues
                </div>
              )}
            </div>
          </div>

          {/* Stalled Issues Column */}
          <div style={{
            flex: 1,
            background: 'rgba(251, 191, 36, 0.03)',
            borderRadius: '8px 8px 0px 0px', // Only top corners rounded
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: '250px',
          }}>
            <div style={{
              fontSize: '14px', // Reduced font size
              fontWeight: '700',
              color: '#d97706',
              letterSpacing: '0.5px', // Reduced letter spacing
              textTransform: 'uppercase',
              marginBottom: '12px', // Reduced margin
              display: 'flex',
              alignItems: 'center',
              gap: '6px', // Reduced gap
              flexShrink: 0, // Don't shrink the header
            }}>
              Stalled Inquiries
              <span style={{ 
                fontSize: '12px', 
                background: 'rgba(251, 191, 36, 0.1)', 
                padding: '2px 8px', 
                borderRadius: '12px',
                fontWeight: '500',
              }}>
                {inquiries.filter(i => i.status === 'stalled').length}
              </span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px', // Reduced gap between cards
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1, // Take remaining space
              paddingRight: '4px', // Reduced padding
            }}>
              {inquiries.filter(i => i.status === 'stalled').map(inquiry => (
                <div key={inquiry.qid} style={{ width: '100%' }}>
                  <InquiryNodeComponent
                    data={inquiry}
                    selected={false}
                    onClick={(nodeId: string) => handleInquiryNodeClick(nodeId)}
                  />
                </div>
              ))}
              {inquiries.filter(i => i.status === 'stalled').length === 0 && (
                <div style={{
                  color: 'rgba(251, 191, 36, 0.4)',
                  fontStyle: 'italic',
                  padding: '40px 20px',
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  No stalled issues
                </div>
              )}
            </div>
          </div>

          {/* Resolved Issues Column */}
          <div style={{
            flex: 1,
            background: 'rgba(34, 197, 94, 0.03)',
            borderRadius: '8px 8px 0px 0px', // Only top corners rounded
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: '250px',
          }}>
            <div style={{
              fontSize: '14px', // Reduced font size
              fontWeight: '700',
              color: '#16a34a',
              letterSpacing: '0.5px', // Reduced letter spacing
              textTransform: 'uppercase',
              marginBottom: '12px', // Reduced margin
              display: 'flex',
              alignItems: 'center',
              gap: '6px', // Reduced gap
              flexShrink: 0, // Don't shrink the header
            }}>
              Resolved Inquiries
              <span style={{ 
                fontSize: '12px', 
                background: 'rgba(34, 197, 94, 0.1)', 
                padding: '2px 8px', 
                borderRadius: '12px',
                fontWeight: '500',
              }}>
                {inquiries.filter(i => i.status === 'resolved').length}
              </span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px', // Reduced gap between cards
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1, // Take remaining space
              paddingRight: '4px', // Reduced padding
            }}>
              {inquiries.filter(i => i.status === 'resolved').map(inquiry => (
                <div key={inquiry.qid} style={{ width: '100%' }}>
                  <InquiryNodeComponent
                    data={inquiry}
                    selected={false}
                    onClick={(nodeId: string) => handleInquiryNodeClick(nodeId)}
                  />
                </div>
              ))}
              {inquiries.filter(i => i.status === 'resolved').length === 0 && (
                <div style={{
                  color: 'rgba(34, 197, 94, 0.4)',
                  fontStyle: 'italic',
                  padding: '40px 20px',
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  No resolved issues
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Network View - ReactFlow Canvas */
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeMouseEnter={onEdgeMouseEnter}
            onEdgeMouseLeave={onEdgeMouseLeave}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
            style={{ width: '100%', height: '100%' }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={true}
            panOnScroll={false}
            preventScrolling={false}
          >
            <Controls
              position="bottom-right"
              showZoom
              showFitView
              showInteractive
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1}
              color="#e5e7eb"
            />
          </ReactFlow>
          
          {/* Edge Tooltip */}
          {edgeTooltip.visible && (
            <div
              style={{
                position: 'fixed',
                left: edgeTooltip.x + 10,
                top: edgeTooltip.y - 10,
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                maxWidth: '200px',
                zIndex: 10000,
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#60a5fa' }}>
                {edgeTooltip.relationshipType.replace(/_/g, ' ')}
              </div>
              <div style={{ lineHeight: '1.4' }}>
                {edgeTooltip.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
InquiryBoard.displayName = 'InquiryBoard';

export default InquiryBoard;
