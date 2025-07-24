// Default dashboard configurations that are always present on the canvas
import { DashboardState } from './DashboardDatabase';

export interface DefaultDashboardConfig {
  id: string;
  name: string;
  description: string;
  dashboards: DashboardState[];
  connections: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
  }>;
}

// Dashboard 1 - London Analytics Dashboard (Using real London data)
const defaultDashboard1: DefaultDashboardConfig = {
  id: 'default-dashboard-1',
  name: 'London Analytics',
  description: 'Real London data dashboard with demographics, population, and economic metrics',
  dashboards: [
    {
      id: 'dashboard-london-main',
      name: 'London Numbers Dashboard',
      type: 'dashboard',
      position: { x: 50, y: 50 },
      size: { width: 1200, height: 782 },
      data: {
        title: 'London Numbers Dashboard',
        type: 'London Analytics',
        component: 'LondonDashboard', // This will be mapped to the actual component
        selectedBorough: 'Brent',
        showCompactView: false
      },
      config: {
        theme: 'dark',
        showMetrics: true,
        showCharts: true,
        interactive: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  connections: []
};

// Dashboard 2 - HR Analytics Dashboard
const defaultDashboard2: DefaultDashboardConfig = {
  id: 'default-dashboard-2',
  name: 'HR Analytics',
  description: 'Human resources analytics dashboard with employee metrics',
  dashboards: [
    {
      id: 'dashboard-hr-1',
      name: 'HR Overview',
      type: 'dashboard',
      position: { x: 50, y: 50 },
      size: { width: 380, height: 260 },
      data: {
        title: 'HR Dashboard',
        type: 'HR Analytics',
        metrics: {
          totalEmployees: '1,247',
          monthlyHires: '23',
          attritionRate: '8.2%',
          avgSalary: '$75,000'
        }
      },
      config: {
        theme: 'green',
        showMetrics: true,
        showCharts: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'chart-department-1',
      name: 'Department Distribution',
      type: 'chart',
      position: { x: 450, y: 50 },
      size: { width: 300, height: 200 },
      data: {
        title: 'Department Distribution',
        chartType: 'Pie Chart',
        data: [
          { department: 'Engineering', count: 420 },
          { department: 'Sales', count: 315 },
          { department: 'Marketing', count: 180 },
          { department: 'HR', count: 95 },
          { department: 'Finance', count: 125 },
          { department: 'Support', count: 112 }
        ]
      },
      config: {
        angleField: 'count',
        colorField: 'department',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'widget-attrition-1',
      name: 'Attrition Widget',
      type: 'widget',
      position: { x: 780, y: 50 },
      size: { width: 200, height: 120 },
      data: {
        title: 'Attrition Tracking',
        widgetType: 'Progress',
        metrics: {
          currentRate: '8.2%',
          targetRate: '5.0%',
          trend: 'decreasing',
          monthlyChange: '-0.5%'
        }
      },
      config: {
        displayType: 'gauge',
        showTarget: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'chart-salary-1',
      name: 'Salary Distribution',
      type: 'chart',
      position: { x: 50, y: 350 },
      size: { width: 300, height: 200 },
      data: {
        title: 'Salary Distribution',
        chartType: 'Histogram',
        data: [
          { salaryRange: '40-50k', count: 125 },
          { salaryRange: '50-60k', count: 220 },
          { salaryRange: '60-70k', count: 280 },
          { salaryRange: '70-80k', count: 315 },
          { salaryRange: '80-90k', count: 180 },
          { salaryRange: '90-100k', count: 95 },
          { salaryRange: '100k+', count: 32 }
        ]
      },
      config: {
        xField: 'salaryRange',
        yField: 'count',
        color: '#10b981'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  connections: [
    {
      id: 'e1-2',
      source: 'dashboard-hr-1',
      target: 'chart-department-1',
      type: 'shows breakdown'
    },
    {
      id: 'e1-3',
      source: 'dashboard-hr-1',
      target: 'widget-attrition-1',
      type: 'tracks metric'
    },
    {
      id: 'e1-4',
      source: 'dashboard-hr-1',
      target: 'chart-salary-1',
      type: 'analyzes compensation'
    }
  ]
};

// Export default dashboards
export const defaultDashboards: { [key: string]: DefaultDashboardConfig } = {
  '1': defaultDashboard1,
  '2': defaultDashboard2
};

// Function to get the active default dashboard based on environment variable
export function getDefaultDashboard(): DefaultDashboardConfig {
  // Use window check for client-side environment variable access
  const dashboardNumber = (typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD 
    : process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD) || '1';
  
  console.log('Loading default dashboard:', dashboardNumber);
  return defaultDashboards[dashboardNumber] || defaultDashboards['1'];
}
