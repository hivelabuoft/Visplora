import { CHARTS, ChartSpec } from './Charts';
import { DASHBOARD1_CHARTS } from './copilotDashboardCharts/dashboard1charts';
import { CRIME_SAFETY_DASHBOARDS } from './copilotDashboards/CrimeSafetyDashboards';
import { DEMOGRAPHICS_DASHBOARDS } from './copilotDashboards/DemographicsDashboards';
import { HOUSING_ECONOMY_DASHBOARDS } from './copilotDashboards/HousingEconomyDashboards';
import { EDUCATION_DASHBOARDS } from './copilotDashboards/EducationDashboards';
import { TRANSPORTATION_DASHBOARDS, HEALTHCARE_DASHBOARDS } from './copilotDashboards/TransportationHealthcareDashboards';

export interface Dashboard {
  id: string;
  title: string;
  category: string;
  chartIds: string[];
  insights: string[];
}

export interface DashboardWithCharts {
  id: string;
  title: string;
  category: string;
  charts: ChartSpec[];
  insights: string[];
}

// Combine all dashboard collections
export const DASHBOARDS: Dashboard[] = [
  ...CRIME_SAFETY_DASHBOARDS,
  ...DEMOGRAPHICS_DASHBOARDS,
  ...HOUSING_ECONOMY_DASHBOARDS,
  ...EDUCATION_DASHBOARDS,
  ...TRANSPORTATION_DASHBOARDS,
  ...HEALTHCARE_DASHBOARDS
];

export const getDashboardById = (id: string): Dashboard | undefined => {
  return DASHBOARDS.find(dashboard => dashboard.id === id);
};

export const getDashboardsByCategory = (category: string): Dashboard[] => {
  return DASHBOARDS.filter(dashboard => dashboard.category === category);
};

export const getDashboardWithCharts = (dashboardId: string): DashboardWithCharts | undefined => {
  const dashboard = getDashboardById(dashboardId);
  if (!dashboard) return undefined;

  // Combine charts from both sources
  const allCharts = { ...CHARTS, ...DASHBOARD1_CHARTS };
  const charts = dashboard.chartIds.map(chartId => allCharts[chartId]).filter(Boolean);
  
  return {
    id: dashboard.id,
    title: dashboard.title,
    category: dashboard.category,
    charts,
    insights: dashboard.insights
  };
};

export const getAllDashboards = (): Dashboard[] => {
  return DASHBOARDS;
};

export const getAllCategories = (): string[] => {
  return Array.from(new Set(DASHBOARDS.map(d => d.category)));
};