'use client';

import React, { useState } from 'react';
import { VegaLite } from 'react-vega';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import DashboardControls from '../components/DashboardControls';
import DashboardPlayground from '../components/DashboardPlayground';

// Sample data - in a real application, you would fetch this from an API
const sampleData = {
  values: [
    { category: 'A', value: 28, region: 'North' },
    { category: 'B', value: 55, region: 'North' },
    { category: 'C', value: 43, region: 'North' },
    { category: 'D', value: 91, region: 'North' },
    { category: 'E', value: 81, region: 'North' },
    { category: 'A', value: 53, region: 'South' },
    { category: 'B', value: 74, region: 'South' },
    { category: 'C', value: 62, region: 'South' },
    { category: 'D', value: 19, region: 'South' },
    { category: 'E', value: 35, region: 'South' },
    { category: 'A', value: 44, region: 'East' },
    { category: 'B', value: 58, region: 'East' },
    { category: 'C', value: 29, region: 'East' },
    { category: 'D', value: 66, region: 'East' },
    { category: 'E', value: 47, region: 'East' },
    { category: 'A', value: 14, region: 'West' },
    { category: 'B', value: 43, region: 'West' },
    { category: 'C', value: 91, region: 'West' },
    { category: 'D', value: 25, region: 'West' },
    { category: 'E', value: 62, region: 'West' }
  ]
};

// Time series data for line chart
const timeSeriesData = {
  values: Array.from({ length: 50 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().slice(0, 10),
    value: Math.random() * 100 + 50,
    trend: 'Actual'
  })).concat(
    Array.from({ length: 50 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString().slice(0, 10),
      value: Math.random() * 80 + 60,
      trend: 'Forecast'
    }))
  )
};

// Vega-Lite specs for different chart types - fixed for TypeScript compatibility
const barChartSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json' as const,
  width: 500,
  height: 300,
  mark: { type: 'bar' as const },
  encoding: {
    x: { field: 'category', type: 'nominal' as const, title: 'Category' },
    y: { field: 'value', type: 'quantitative' as const, title: 'Value' },
    color: { field: 'category', type: 'nominal' as const, legend: null },
    tooltip: [
      { field: 'category', type: 'nominal' as const, title: 'Category' },
      { field: 'value', type: 'quantitative' as const, title: 'Value' }
    ]
  },
  data: { name: 'values' },
  config: {
    axis: {
      labelFont: 'Inter',
      titleFont: 'Inter',
      labelFontSize: 12,
      titleFontSize: 14,
    }
  }
};

const lineChartSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 500,
  height: 300,
  mark: {
    type: 'line' as const,
    point: true,
    strokeWidth: 2,
    opacity: 0.8
  },
  encoding: {
    x: { 
      field: 'date', 
      type: 'temporal' as const, 
      title: 'Date',
      axis: {
        format: '%b %d',
        labelAngle: -45,
      }
    },
    y: { 
      field: 'value', 
      type: 'quantitative' as const, 
      title: 'Value',
      scale: { zero: false }
    },
    color: { 
      field: 'trend', 
      type: 'nominal' as const,
      scale: {
        domain: ['Actual', 'Forecast'],
        range: ['#4361ee', '#f72585']
      }
    },
    strokeDash: {
      field: 'trend',
      scale: {
        domain: ['Actual', 'Forecast'],
        range: [[0], [3, 3]]
      }
    },
    tooltip: [
      { field: 'date', type: 'temporal' as const, title: 'Date', format: '%b %d, %Y' },
      { field: 'value', type: 'quantitative' as const, title: 'Value' },
      { field: 'trend', type: 'nominal' as const, title: 'Type' }
    ]
  },
  data: { name: 'values' },
  config: {
    axis: {
      labelFont: 'Inter',
      titleFont: 'Inter',
      labelFontSize: 12,
      titleFontSize: 14,
    }
  }
};

const heatmapSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 500,
  height: 300,
  mark: 'rect' as const,
  encoding: {
    x: { field: 'category', type: 'nominal' as const, title: 'Category' },
    y: { field: 'region', type: 'nominal' as const, title: 'Region' },
    color: {
      field: 'value',
      type: 'quantitative' as const,
      title: 'Value',
      scale: {
        scheme: 'blues'
      }
    },
    tooltip: [
      { field: 'category', type: 'nominal' as const, title: 'Category' },
      { field: 'region', type: 'nominal' as const, title: 'Region' },
      { field: 'value', type: 'quantitative' as const, title: 'Value' }
    ]
  },
  data: { name: 'values' },
  config: {
    axis: {
      labelFont: 'Inter',
      titleFont: 'Inter',
      labelFontSize: 12,
      titleFontSize: 14,
    }
  }
};

const pieChartSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json' as const,
  width: 400,
  height: 400,
  transform: [
    {
      aggregate: [{ op: 'sum' as const, field: 'value', as: 'sum_value' }],
      groupby: ['region']
    }
  ],
  mark: { 
    type: 'arc' as const, 
    innerRadius: 50, 
    outerRadius: 150 
  },
  encoding: {
    theta: { field: 'sum_value', type: 'quantitative' as const },
    color: {
      field: 'region',
      type: 'nominal' as const,
      scale: {
        domain: ['North', 'South', 'East', 'West'],
        range: ['#0077b6', '#0096c7', '#00b4d8', '#48cae4']
      }
    },
    tooltip: [
      { field: 'region', type: 'nominal' as const, title: 'Region' },
      { field: 'sum_value', type: 'quantitative' as const, title: 'Total Value' }
    ]
  },
  data: { name: 'values' },
  config: {
    axis: {
      labelFont: 'Inter',
      titleFont: 'Inter',
      labelFontSize: 12,
      titleFontSize: 14,
    }
  }
};

export default function Dashboard1() {
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [isPlaygroundMode, setIsPlaygroundMode] = useState(false);
  
  // Filter data based on selected region
  const filteredData = {
    values: activeRegion === 'all' 
      ? sampleData.values 
      : sampleData.values.filter(d => d.region === activeRegion)
  };

  // Define KPI metrics (in a real app, these would be calculated from actual data)
  const kpiData = {
    totalValue: filteredData.values.reduce((sum, d) => sum + d.value, 0),
    averageValue: Math.round(filteredData.values.reduce((sum, d) => sum + d.value, 0) / filteredData.values.length),
    maxValue: Math.max(...filteredData.values.map(d => d.value)),
    categories: new Set(filteredData.values.map(d => d.category)).size
  };

  const dashboardContent = (
    <div className="p-6 space-y-6 bg-[#f8f9fa]">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Performance Analytics Dashboard</h1>
        <p className="text-gray-600 max-w-3xl">
          This interactive dashboard provides insights into regional performance metrics across different categories.
          Use the filters and tabs to explore different visualizations and gain deeper understanding of the data patterns.
        </p>
        
        {/* Region filter */}
        <div className="flex items-center gap-2 w-64">
          <span className="text-sm font-semibold">Region:</span>
          <Select value={activeRegion} onValueChange={setActiveRegion}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Across all categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.averageValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Per data point</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Maximum Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.maxValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Highest recorded value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.categories}</div>
            <p className="text-xs text-gray-500 mt-1">Distinct categories</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main visualization area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Value by Category</CardTitle>
            <p className="text-sm text-gray-500">
              Distribution of values across different categories
            </p>
          </CardHeader>
          <CardContent>
            <VegaLite spec={barChartSpec} data={filteredData} />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
            <p className="text-sm text-gray-500">
              Value distribution by region
            </p>
          </CardHeader>
          <CardContent>
            <VegaLite spec={pieChartSpec} data={filteredData} />
          </CardContent>
        </Card>
      </div>
      
      {/* Additional visualizations */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList>
          <TabsTrigger value="trend">Historical Trend</TabsTrigger>
          <TabsTrigger value="heatmap">Category Heatmap</TabsTrigger>
        </TabsList>
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Historical Performance</CardTitle>
              <p className="text-sm text-gray-500">
                Trends and forecasts over time
              </p>
            </CardHeader>
            <CardContent>
              <VegaLite spec={lineChartSpec} data={timeSeriesData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Category-Region Heat Map</CardTitle>
              <p className="text-sm text-gray-500">
                Value intensity across categories and regions
              </p>
            </CardHeader>
            <CardContent>
              <VegaLite spec={heatmapSpec} data={sampleData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-2">Dashboard Notes</h3>
        <p className="text-sm text-gray-600">
          This dashboard provides a comprehensive view of performance metrics across different regions and categories.
          The data shown is sample data and would typically be replaced with real-time data from your data sources.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          The visualizations are created using Vega-Lite, a high-level visualization grammar that enables rapid creation
          of interactive visualizations. In a production environment, these visualizations would be connected to live data
          sources and could include additional interactivity features.
        </p>
      </div>
      {/* Dashboard Controls for Canvas Integration */}
      {!isPlaygroundMode && (
        <DashboardControls 
          dashboardTitle="Analytics Dashboard"
          dashboardType="analytics"
          onAddToCanvas={() => {
            console.log('Analytics Dashboard added to canvas');
          }}
          onPlaygroundMode={() => setIsPlaygroundMode(true)}
        />
      )}
    </div>
  );

  return (
    <>
      {dashboardContent}
        <DashboardPlayground
        isActive={isPlaygroundMode}
        onClose={() => setIsPlaygroundMode(false)}
        dashboardTitle="Analytics Dashboard"
        dashboardType="analytics"
        onAddToCanvas={() => {
          console.log('Dashboard added to canvas from playground');
        }}
      >
        {dashboardContent}
      </DashboardPlayground>
    </>
  );
}
