import { HRData } from '../types/interfaces';

/**
 * Registry of all dashboard elements with their descriptions and capabilities
 */
export interface DashboardElement {
  id: string;
  name: string;
  type: 'kpi' | 'chart' | 'widget' | 'filter' | 'data-table';
  description: string;
  dataFields: string[];
  chartType?: 'pie' | 'bar' | 'donut' | 'scatter' | 'line' | 'table';
  insights: string[];
  filterCapabilities?: string[];
  canAnswer: string[];
}

/**
 * Complete registry of all dashboard elements
 */
export const DASHBOARD_ELEMENTS_REGISTRY: DashboardElement[] = [
  // KPI Metrics
  {
    id: 'attrition-rate-kpi',
    name: 'Attrition Rate KPI',
    type: 'kpi',
    description: 'Shows the overall attrition rate percentage across the company',
    dataFields: ['Attrition'],
    insights: ['Overall company attrition rate', 'Percentage of employees who left'],
    canAnswer: [
      'What is the attrition rate?',
      'What percentage of employees left?',
      'How many employees left the company?'
    ]
  },
  {
    id: 'total-attrition-kpi',
    name: 'Total Attrition KPI',
    type: 'kpi',
    description: 'Shows the total number of employees who left the company',
    dataFields: ['Attrition'],
    insights: ['Total count of employees who left'],
    canAnswer: [
      'How many employees left?',
      'What is the total attrition count?',
      'How many people quit?'
    ]
  },
  {
    id: 'current-employees-kpi',
    name: 'Current Employees KPI',
    type: 'kpi',
    description: 'Shows the total number of current employees',
    dataFields: ['EmployeeCount'],
    insights: ['Total current workforce size'],
    canAnswer: [
      'How many employees do we have?',
      'What is the current headcount?',
      'How many people work here?'
    ]
  },

  // Chart Widgets
  {
    id: 'department-widget',
    name: 'Department Analysis',
    type: 'chart',
    chartType: 'donut',
    description: 'Donut charts showing attrition vs retention by department',
    dataFields: ['Department', 'Attrition'],
    filterCapabilities: ['department'],
    insights: [
      'Attrition rate by department',
      'Which departments have highest/lowest attrition',
      'Department-wise retention patterns'
    ],
    canAnswer: [
      'Which department has the highest attrition?',
      'Show me attrition by department',
      'How is each department performing in terms of retention?',
      'Compare departments by attrition rate'
    ]
  },
  {
    id: 'job-role-widget',
    name: 'Job Role Analysis',
    type: 'chart',
    chartType: 'bar',
    description: 'Horizontal bar chart showing attrition vs retention by job role',
    dataFields: ['JobRole', 'Attrition'],
    filterCapabilities: ['jobRole'],
    insights: [
      'Attrition rate by job role',
      'Which roles have highest turnover',
      'Role-based retention analysis'
    ],
    canAnswer: [
      'Which job roles have the highest attrition?',
      'Show me attrition by job role',
      'What roles are people leaving most?',
      'Compare job roles by retention'
    ]
  },
  {
    id: 'gender-widget',
    name: 'Gender Analysis',
    type: 'chart',
    chartType: 'donut',
    description: 'Donut chart showing attrition vs retention by gender',
    dataFields: ['Gender', 'Attrition'],
    filterCapabilities: ['gender'],
    insights: [
      'Gender-based attrition patterns',
      'Male vs female retention rates'
    ],
    canAnswer: [
      'Is there a gender difference in attrition?',
      'Show me attrition by gender',
      'Do men or women leave more often?',
      'Compare male and female retention'
    ]
  },
  {
    id: 'age-group-widget',
    name: 'Age Group Analysis',
    type: 'chart',
    chartType: 'bar',
    description: 'Bar chart showing attrition patterns across different age groups',
    dataFields: ['Age', 'Attrition'],
    insights: [
      'Age-based attrition trends',
      'Which age groups have higher turnover',
      'Generational retention patterns'
    ],
    canAnswer: [
      'What age groups have the highest attrition?',
      'Show me attrition by age',
      'Do younger or older employees leave more?',
      'Age-based retention analysis'
    ]
  },
  {
    id: 'education-widget',
    name: 'Education Analysis',
    type: 'chart',
    chartType: 'bar',
    description: 'Bar chart showing attrition by education level or education field (toggleable)',
    dataFields: ['Education', 'EducationField', 'Attrition'],
    insights: [
      'Education level impact on attrition',
      'Education field patterns in retention',
      'Academic background vs turnover'
    ],
    canAnswer: [
      'Does education level affect attrition?',
      'Show me attrition by education',
      'Which education fields have higher turnover?',
      'Education background and retention patterns'
    ]
  },
  {
    id: 'distance-widget',
    name: 'Distance From Home Analysis',
    type: 'chart',
    chartType: 'scatter',
    description: 'Scatter plot showing relationship between distance from home and attrition',
    dataFields: ['DistanceFromHome', 'Attrition'],
    insights: [
      'Distance from home impact on attrition',
      'Commute distance vs retention',
      'Geographic distribution of workforce'
    ],
    canAnswer: [
      'Does distance from home affect attrition?',
      'Show me distance from home patterns',
      'Do employees with longer commutes leave more?',
      'Distance and retention relationship'
    ]
  },
  {
    id: 'survey-score-widget',
    name: 'Survey Score Analysis',
    type: 'chart',
    chartType: 'bar',
    description: 'Bar charts showing various survey scores (job satisfaction, environment satisfaction, etc.) and their relationship to attrition',
    dataFields: [
      'JobSatisfaction',
      'EnvironmentSatisfaction',
      'WorkLifeBalance',
      'JobInvolvement',
      'RelationshipSatisfaction',
      'Attrition'
    ],
    insights: [
      'Job satisfaction impact on attrition',
      'Work environment satisfaction trends',
      'Work-life balance correlation with retention',
      'Overall employee satisfaction metrics'
    ],
    canAnswer: [
      'How does job satisfaction affect attrition?',
      'Show me satisfaction scores',
      'What satisfaction metrics predict attrition?',
      'Employee satisfaction and retention relationship'
    ]
  },
  {
    id: 'recent-attritions-widget',
    name: 'Recent Attritions',
    type: 'data-table',
    description: 'Scrollable table showing detailed information about employees who left',
    dataFields: [
      'EmployeeNumber',
      'Age',
      'Department',
      'JobRole',
      'YearsAtCompany',
      'MonthlyIncome',
      'OverTime',
      'Attrition'
    ],
    insights: [
      'Detailed attrition records',
      'Profile of employees who left',
      'Recent attrition trends'
    ],
    canAnswer: [
      'Show me who recently left',
      'What are the details of employees who left?',
      'Profile of departed employees',
      'Recent attrition data'
    ]
  }
];

/**
 * Get dashboard element by ID
 */
export function getDashboardElement(elementId: string): DashboardElement | undefined {
  return DASHBOARD_ELEMENTS_REGISTRY.find(element => element.id === elementId);
}

/**
 * Get all dashboard elements by type
 */
export function getDashboardElementsByType(type: DashboardElement['type']): DashboardElement[] {
  return DASHBOARD_ELEMENTS_REGISTRY.filter(element => element.type === type);
}

/**
 * Find dashboard elements that can answer a specific question
 */
export function findElementsForQuestion(question: string): DashboardElement[] {
  const questionLower = question.toLowerCase();
  return DASHBOARD_ELEMENTS_REGISTRY.filter(element =>
    element.canAnswer.some(canAnswer => 
      questionLower.includes(canAnswer.toLowerCase()) ||
      canAnswer.toLowerCase().includes(questionLower)
    ) ||
    element.insights.some(insight =>
      questionLower.includes(insight.toLowerCase()) ||
      insight.toLowerCase().includes(questionLower)
    ) ||
    element.dataFields.some(field =>
      questionLower.includes(field.toLowerCase())
    )
  );
}

/**
 * Generate AI context about all dashboard elements
 */
export function generateDashboardElementsContext(): string {
  const kpis = getDashboardElementsByType('kpi');
  const charts = getDashboardElementsByType('chart');
  const widgets = getDashboardElementsByType('widget');
  const dataTables = getDashboardElementsByType('data-table');

  return `
AVAILABLE DASHBOARD ELEMENTS:

KPI METRICS (${kpis.length}):
${kpis.map(kpi => `- ${kpi.name}: ${kpi.description}
  • Can answer: ${kpi.canAnswer.join('; ')}
  • Data fields: ${kpi.dataFields.join(', ')}`).join('\n')}

CHART VISUALIZATIONS (${charts.length}):
${charts.map(chart => `- ${chart.name} (${chart.chartType}): ${chart.description}
  • Can answer: ${chart.canAnswer.join('; ')}
  • Data fields: ${chart.dataFields.join(', ')}
  • Insights: ${chart.insights.join('; ')}${chart.filterCapabilities ? `
  • Filter controls: ${chart.filterCapabilities.join(', ')}` : ''}`).join('\n')}

DATA TABLES (${dataTables.length}):
${dataTables.map(table => `- ${table.name}: ${table.description}
  • Can answer: ${table.canAnswer.join('; ')}
  • Data fields: ${table.dataFields.join(', ')}`).join('\n')}

FILTER CAPABILITIES:
- Department filter (affects all department-related charts)
- Job Role filter (affects job role analysis)
- Gender filter (affects gender analysis)
- Show Only Attrition toggle (affects all visualizations)
`;
}

/**
 * Generate specific guidance for a question
 */
export function generateQuestionGuidance(question: string): string {
  const relevantElements = findElementsForQuestion(question);
  
  if (relevantElements.length === 0) {
    return `I couldn't find existing dashboard elements that directly answer: "${question}". You may need to create a new visualization.`;
  }

  const guidance = relevantElements.map(element => {
    return `📊 Check the "${element.name}" ${element.type}:
   • ${element.description}
   • This ${element.type} shows: ${element.insights.join(', ')}
   • Located on the dashboard as: ${element.id}`;
  }).join('\n\n');

  return `To answer "${question}", look at these existing dashboard elements:\n\n${guidance}`;
}
