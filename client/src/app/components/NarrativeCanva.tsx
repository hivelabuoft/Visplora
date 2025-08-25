'use client';

import React, { useCallback, useState, useEffect } from 'react';
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
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SampleDashboard, SampleChart, SampleWidget } from './dashboards';
import LondonDashboard from '../dashboard3/page';
import { DashboardState } from './dashboards/DashboardDatabase';
import { getDefaultDashboard } from './dashboards/DefaultDashboards';
import { userStudyTracker } from '@/lib/userStudyTracker';
import ViewGenerator from '../viewGenerator/page';

// Custom Node Types for Dashboards
const DashboardNode = ({ data }: { data: any }) => {
  // Special handling for LondonDashboard
  if (data.component === LondonDashboard) {
    return (
      <div className="w-[1200px] h-[900px] shadow-lg rounded-lg bg-black border-2 border-blue-200 hover:border-blue-400 transition-colors overflow-hidden">
        <LondonDashboard 
        //   compact={false}
        //   selectedBorough={data.dashboardData?.selectedBorough || 'Brent'}
        />
      </div>
    );
  }

  return (
    <div className="w-80 h-60 shadow-lg rounded-lg bg-white border-2 border-blue-200 hover:border-blue-400 transition-colors overflow-hidden">
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
        <div className="text-sm font-bold text-gray-800">{data.title}</div>
        <div className="text-xs text-gray-500">{data.type}</div>
      </div>
      <div className="p-4 h-full">
        {data.component ? (
          <data.component />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">Dashboard Content</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChartNode = ({ data }: { data: any }) => {
  return (
    <div className="w-64 h-48 shadow-lg rounded-lg bg-white border-2 border-orange-200 hover:border-orange-400 transition-colors overflow-hidden">
      <div className="bg-orange-50 px-3 py-2 border-b border-orange-100">
        <div className="text-sm font-bold text-gray-800">{data.title}</div>
        <div className="text-xs text-gray-500">{data.chartType}</div>
      </div>
      <div className="p-3 h-full">
        {data.component ? (
          <data.component />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-xl mb-1">📈</div>
              <div className="text-xs">Chart Visualization</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WidgetNode = ({ data }: { data: any }) => {
  return (
    <div className="w-48 h-32 shadow-lg rounded-lg bg-white border-2 border-green-200 hover:border-green-400 transition-colors overflow-hidden">
      <div className="bg-green-50 px-3 py-2 border-b border-green-100">
        <div className="text-sm font-bold text-gray-800">{data.title}</div>
        <div className="text-xs text-gray-500">{data.widgetType}</div>
      </div>
      <div className="p-3 h-full">
        {data.component ? (
          <data.component />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-lg mb-1">🔢</div>
              <div className="text-xs">Widget</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ViewGeneratorNode = ({ data }: { data: any }) => {
  return (
    <div className="w-80 h-60 shadow-lg rounded-lg bg-white border-2 border-purple-200 hover:border-purple-400 transition-colors overflow-hidden">
      <div className="bg-purple-50 px-4 py-2 border-b border-purple-100">
        <div className="text-sm font-bold text-gray-800">{data.title}</div>
        <div className="text-xs text-gray-500">Sentence #{data.sentence_id}</div>
      </div>
      <div className="p-4 h-full">
        <ViewGenerator
          sentence_id={data.sentence_id}
          charts={data.charts || []}
          onInteraction={data.onInteraction}
        />
      </div>
    </div>
  );
};

// Node types configuration
const nodeTypes = {
  dashboard: DashboardNode,
  chart: ChartNode,
  widget: WidgetNode,
  viewGenerator: ViewGeneratorNode,
};

const NarrativeCanva: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isStudyMode, setIsStudyMode] = useState(false);

  // Initialize user study tracking
  useEffect(() => {
    // Check if we're in study mode and have user session
    const studyMode = process.env.NEXT_PUBLIC_STUDY_MODE === 'true';
    if (studyMode) {
      setIsStudyMode(true);
      
      // Initialize with mock user data for now - replace with real auth
      const mockUserContext = {
        userId: 'user_' + Date.now(),
        participantId: 'P' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        sessionId: 'session_' + Date.now(),
        studyPhase: 'tutorial' as const,
      };

      userStudyTracker.initializeSession(mockUserContext);
      
      // Log initial page load
      userStudyTracker.logInteraction(
        'navigation',
        'page_loaded',
        { type: 'canvas', id: 'narrative-canvas', name: 'Narrative Canvas' },
        { nodeCount: 0, connectionCount: 0 }
      );
    }
  }, []);

  // Load initial view or default dashboard
  useEffect(() => {
    // Always start with the default dashboard
    loadDefaultDashboard();
  }, []);

  // Load default dashboard from environment configuration
  const loadDefaultDashboard = () => {
    const defaultConfig = getDefaultDashboard();
    const flowNodes = defaultConfig.dashboards.map(convertDashboardStateToNode);
    const flowEdges = defaultConfig.connections.map(conn => ({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      type: 'smoothstep',
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      label: conn.type,
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  // Convert dashboard state to React Flow nodes
  const convertDashboardStateToNode = (dashboard: DashboardState): Node => {
    const getComponent = (type: string, data?: any) => {
      // Check if specific component is requested
      if (data?.component === 'LondonDashboard') {
        return LondonDashboard;
      }
      
      switch (type) {
        case 'dashboard': return SampleDashboard;
        case 'chart': return SampleChart;
        case 'widget': return SampleWidget;
        default: return null;
      }
    };

    return {
      id: dashboard.id,
      type: dashboard.type,
      position: dashboard.position,
      data: {
        title: dashboard.name,
        type: dashboard.type,
        component: getComponent(dashboard.type, dashboard.data),
        dashboardData: dashboard.data,
        config: dashboard.config,
      },
    };
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Double clicked dashboard node:', node);
    // Here you can add logic to edit dashboard properties
  }, []);

  const addDashboard = useCallback(async () => {
    
    // Position new dashboards below the large London dashboard (1200x782px)
    const position = { x: Math.random() * 400 + 50, y: Math.random() * 200 + 900 };
    const newNode: Node = {
      id: `dashboard-${Date.now()}`,
      type: 'dashboard',
      position,
      data: { 
        title: 'New Dashboard', 
        type: 'Custom',
        component: SampleDashboard,
        dashboardData: {},
        config: {},
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    
    // Log node addition for user study
    if (isStudyMode) {
      await userStudyTracker.logNodeAdd('dashboard', newNode.id, position);
    }
  }, [setNodes, isStudyMode]);

  const addChart = useCallback(async () => {
    // Position new charts below the large London dashboard (1200x782px)
    const position = { x: Math.random() * 400 + 50, y: Math.random() * 200 + 900 };
    const newNode: Node = {
      id: `chart-${Date.now()}`,
      type: 'chart',
      position,
      data: { 
        title: 'New Chart', 
        chartType: 'Visualization',
        component: SampleChart,
        dashboardData: {},
        config: {},
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    
    // Log node addition for user study
    if (isStudyMode) {
      await userStudyTracker.logNodeAdd('chart', newNode.id, position);
    }
  }, [setNodes, isStudyMode]);

  const addWidget = useCallback(async () => {
    // Position new widgets below the large London dashboard (1200x782px)
    const position = { x: Math.random() * 400 + 50, y: Math.random() * 200 + 900 };
    const newNode: Node = {
      id: `widget-${Date.now()}`,
      type: 'widget',
      position,
      data: { 
        title: 'New Widget', 
        widgetType: 'Component',
        component: SampleWidget,
        dashboardData: {},
        config: {},
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    
    // Log node addition for user study
    if (isStudyMode) {
      await userStudyTracker.logNodeAdd('widget', newNode.id, position);
    }
  }, [setNodes, isStudyMode]);

  const addViewGenerator = useCallback(async () => {
    // Sample data from example2_data.json format
    const sampleData = {
      sentence_id: Math.floor(Math.random() * 10) + 1,
      charts: [
        {
          chart_type: "Choropleth",
          description: "Median housing price by borough",
          size: "large",
          data: {}
        },
        {
          chart_type: "Bar",
          description: "Average housing price per borough - Distance from the city center",
          variation: ["with_mean", "3d"],
          size: "medium",
          data: {}
        },
        {
          chart_type: "Bar",
          description: "Top 5 boroughs by average housing price",
          variation: ["with_mean"],
          size: "medium",
          data: {}
        }
      ]
    };
    
    // Position new ViewGenerators below the large London dashboard (1200x782px)
    const position = { x: Math.random() * 400 + 50, y: Math.random() * 200 + 900 };
    const newNode: Node = {
      id: `viewGenerator-${Date.now()}`,
      type: 'viewGenerator',
      position,
      data: { 
        title: `Sentence #${sampleData.sentence_id} Charts`, 
        sentence_id: sampleData.sentence_id,
        charts: sampleData.charts,
        onInteraction: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => {
          console.log('ViewGenerator interaction:', { elementId, elementName, elementType, action, metadata });
        }
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    
    // Log node addition for user study
    if (isStudyMode) {
      await userStudyTracker.logNodeAdd('viewGenerator', newNode.id, position);
    }
  }, [setNodes, isStudyMode]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Canvas Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
          minZoom={0.2}
          maxZoom={4}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2, stroke: '#94a3b8' },
          }}
        >
        {/* Top Add Dashboard Element Buttons */}
        <div className="absolute top-2 left-2 flex gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-20">
          <button
            onClick={addDashboard}
            className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors flex items-center gap-2"
          >
            <span>🏢</span>
            Dashboard
          </button>
          <button
            onClick={addChart}
            className="px-3 py-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-md transition-colors flex items-center gap-2"
          >
            <span>📊</span>
            Chart
          </button>
          <button
            onClick={addWidget}
            className="px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors flex items-center gap-2"
          >
            <span>🔢</span>
            Widget
          </button>
          <button
            onClick={addViewGenerator}
            className="px-3 py-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors flex items-center gap-2"
          >
            <span>🚀</span>
            ViewGen
          </button>
        </div>

        {/* Original React Flow Controls - Moved to Top */}
        <Controls 
          className="!bg-white !border !border-gray-200 !rounded-lg !shadow-sm"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          position="top-right"
        />

        {/* Smaller Mini Map - Bottom Right */}
        <MiniMap 
          className="!bg-white !border !border-gray-200 !rounded-lg !shadow-sm"
          style={{ width: 120, height: 80 }}
          nodeColor={(node) => {
            switch (node.type) {
              case 'chart': return '#fed7aa';
              case 'widget': return '#bbf7d0';
              default: return '#dbeafe';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-right"
        />
        
        {/* Enhanced Dotted Background */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={2}
          color="#cbd5e1"
          style={{
            opacity: 0.6
          }}
        />
      </ReactFlow>
      </div>

      {/* Canvas Info - Bottom Left */}
      {/* <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
        <div className="text-xs text-gray-600">
          <span className="font-medium">{nodes.length}</span> dashboards • 
          <span className="font-medium ml-1">{edges.length}</span> connections
        </div>
      </div> */}
    </div>
  );
};

export default NarrativeCanva;
