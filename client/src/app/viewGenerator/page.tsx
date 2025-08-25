'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LinkableCard } from '@/components/ui/card-linkable';

// Dynamically import VegaLite to avoid SSR issues
const VegaLite = dynamic(() => import('react-vega').then(mod => ({ default: mod.VegaLite })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading chart...</div>
});

// Memoized VegaLite wrapper to prevent Set serialization issues
const MemoizedVegaLite = React.memo(({ spec, actions = false, signalListeners, style, renderer }: any) => {
  return <VegaLite spec={spec} actions={actions} signalListeners={signalListeners} style={style} renderer={renderer} />;
});

// Interface for chart data from example2_data.json format
interface ChartConfig {
  chart_type: string;
  description: string;
  variation?: string[];
  size?: string;
  data?: any;
}

interface SentenceCharts {
  sentence_id: number;
  charts: ChartConfig[];
}

// Props interface for ViewGenerator
interface ViewGeneratorProps {
  sentence_id: number;
  charts: ChartConfig[];
  onInteraction?: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => void;
}

// Helper function to generate Vega-Lite specs for different chart types
const generateVegaSpec = (chart: ChartConfig, index: number) => {
  const baseSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    width: chart.size === "large" ? 400 : chart.size === "medium" ? 300 : 200,
    height: chart.size === "large" ? 300 : chart.size === "medium" ? 200 : 150,
    title: {
      text: chart.description,
      fontSize: 12,
      anchor: "start"
    }
  };

  // Generate sample data based on chart type
  let spec: any = { ...baseSpec };

  switch (chart.chart_type.toLowerCase()) {
    case 'choropleth':
      spec = {
        ...baseSpec,
        data: {
          url: "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
          format: { type: "topojson", feature: "countries1" }
        },
        mark: { type: "geoshape" },
        encoding: {
          color: {
            field: "properties.POP_EST",
            type: "quantitative",
            scale: { scheme: "blues" }
          },
          tooltip: [
            { field: "properties.NAME", type: "nominal", title: "Country" },
            { field: "properties.POP_EST", type: "quantitative", title: "Population" }
          ]
        }
      };
      break;

    case 'bar':
      const barData = [
        { category: "Borough A", value: Math.floor(Math.random() * 100) + 50 },
        { category: "Borough B", value: Math.floor(Math.random() * 100) + 50 },
        { category: "Borough C", value: Math.floor(Math.random() * 100) + 50 },
        { category: "Borough D", value: Math.floor(Math.random() * 100) + 50 },
        { category: "Borough E", value: Math.floor(Math.random() * 100) + 50 }
      ];
      
      spec = {
        ...baseSpec,
        data: { values: barData },
        mark: chart.variation?.includes("3d") ? { type: "bar", color: "#4c78a8", stroke: "#1f2937", strokeWidth: 1 } : "bar",
        encoding: {
          x: { field: "category", type: "nominal", axis: { labelAngle: -45 } },
          y: { field: "value", type: "quantitative" },
          color: chart.variation?.includes("3d") ? 
            { value: "#4c78a8" } : 
            { field: "category", type: "nominal", scale: { scheme: "category10" } },
          tooltip: [
            { field: "category", type: "nominal" },
            { field: "value", type: "quantitative" }
          ]
        }
      };

      // Add mean line if variation includes "with_mean"
      if (chart.variation?.includes("with_mean")) {
        const meanValue = barData.reduce((sum, d) => sum + d.value, 0) / barData.length;
        spec.layer = [
          spec,
          {
            data: { values: [{}] },
            mark: { type: "rule", color: "red", strokeDash: [5, 5], strokeWidth: 2 },
            encoding: {
              y: { datum: meanValue, type: "quantitative" }
            }
          }
        ];
        delete spec.mark;
        delete spec.encoding;
      }
      break;

    case 'line':
      const lineData = Array.from({ length: 10 }, (_, i) => ({
        x: 2014 + i,
        y: Math.floor(Math.random() * 50) + 25 + Math.sin(i) * 10
      }));
      
      spec = {
        ...baseSpec,
        data: { values: lineData },
        mark: "line",
        encoding: {
          x: { field: "x", type: "ordinal" },
          y: { field: "y", type: "quantitative" },
          tooltip: [
            { field: "x", type: "ordinal", title: "Year" },
            { field: "y", type: "quantitative", title: "Value" }
          ]
        }
      };
      break;

    case 'pie':
      const pieData = [
        { category: "Category A", value: 30 },
        { category: "Category B", value: 25 },
        { category: "Category C", value: 20 },
        { category: "Category D", value: 15 },
        { category: "Category E", value: 10 }
      ];
      
      spec = {
        ...baseSpec,
        data: { values: pieData },
        mark: { type: "arc", innerRadius: 20 },
        encoding: {
          theta: { field: "value", type: "quantitative" },
          color: { field: "category", type: "nominal", scale: { scheme: "category10" } },
          tooltip: [
            { field: "category", type: "nominal" },
            { field: "value", type: "quantitative" }
          ]
        }
      };
      break;

    case 'scatter':
      const scatterData = Array.from({ length: 50 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        category: `Group ${String.fromCharCode(65 + (i % 4))}`
      }));
      
      spec = {
        ...baseSpec,
        data: { values: scatterData },
        mark: "circle",
        encoding: {
          x: { field: "x", type: "quantitative" },
          y: { field: "y", type: "quantitative" },
          color: { field: "category", type: "nominal", scale: { scheme: "category10" } },
          size: { value: 60 },
          tooltip: [
            { field: "x", type: "quantitative" },
            { field: "y", type: "quantitative" },
            { field: "category", type: "nominal" }
          ]
        }
      };
      break;

    default:
      // Default to a simple bar chart for unknown types
      spec = {
        ...baseSpec,
        data: { values: [{ category: "No Data", value: 0 }] },
        mark: "bar",
        encoding: {
          x: { field: "category", type: "nominal" },
          y: { field: "value", type: "quantitative" }
        }
      };
  }

  return spec;
};

// Helper function to determine grid layout based on chart count and sizes
const getGridLayout = (charts: ChartConfig[]) => {
  const chartCount = charts.length;
  
  if (chartCount <= 2) {
    return { cols: 2, rows: 1 };
  } else if (chartCount <= 4) {
    return { cols: 2, rows: 2 };
  } else if (chartCount <= 6) {
    return { cols: 3, rows: 2 };
  } else {
    return { cols: 4, rows: Math.ceil(chartCount / 4) };
  }
};

// Helper function to get chart size class
const getChartSizeClass = (size: string = "medium", layout: { cols: number; rows: number }) => {
  const { cols } = layout;
  
  if (size === "large") {
    return cols <= 2 ? "col-span-2 row-span-2" : "col-span-2";
  } else if (size === "small") {
    return "col-span-1";
  } else {
    // medium
    return cols <= 2 ? "col-span-1" : "col-span-1";
  }
};

const ViewGenerator: React.FC<ViewGeneratorProps> = ({ sentence_id, charts, onInteraction }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddToSidebar = (elementId: string, elementName: string, elementType: string) => {
    if (onInteraction) {
      onInteraction(elementId, elementName, elementType, 'add_to_sidebar', {
        description: `Added ${elementName} to sidebar`,
        sentence_id: sentence_id
      });
    }
    console.log(`Added to sidebar: ${elementName} (${elementId})`);
  };

  const layout = getGridLayout(charts);

  return (
    <div className="view-generator p-6 rounded-lg text-[#1A3C4A]" style={{
      width: '100%',
      backgroundColor: '#E3F2FA',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B7A9B] mx-auto mb-4"></div>
            <div className="text-[#4A6A7B]">Loading visualizations...</div>
          </div>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div 
            className={`grid gap-4 mb-6`}
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
              gridTemplateRows: `repeat(${layout.rows}, auto)`
            }}
          >
            {charts.map((chart, index) => (
              <LinkableCard
                key={index}
                className={`${getChartSizeClass(chart.size, layout)} bg-white rounded-lg p-4 border border-[#BFD9EA] text-[#1A3C4A]`}
                styles={{}}
                elementId={`chart-${sentence_id}-${index}`}
                elementName={`${chart.chart_type} Chart - ${chart.description.substring(0, 30)}...`}
                elementType="chart"
                onAddToSidebar={handleAddToSidebar}
              >
                {/* Chart Header */}
                <div className="mb-3">
                  <div className="text-sm font-semibold text-[#2B7A9B] mb-1">
                    {chart.chart_type.toUpperCase()} CHART
                  </div>
                  <div className="text-xs text-[#4A6A7B]">
                    {chart.description}
                  </div>
                  {chart.variation && chart.variation.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {chart.variation.map((variation, vIndex) => (
                        <span 
                          key={vIndex}
                          className="text-xs bg-[#2B7A9B] text-white px-2 py-0.5 rounded-full"
                        >
                          {variation}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chart Content */}
                <div className="flex-1 relative" style={{ minHeight: '200px' }}>
                  <MemoizedVegaLite
                    spec={generateVegaSpec(chart, index)}
                    actions={false}
                    renderer='svg'
                    style={{
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
                
              </LinkableCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ViewGenerator;
