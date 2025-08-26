import { getDashboardWithCharts, Dashboard, DashboardWithCharts } from './Dashboards';

export interface Question {
  id: string;
  text: string;
  dashboardId: string;
  category: string;
}

export const QUESTIONS: Question[] = [
  // Crime & Safety
  {
    id: "safety_question",
    text: "How safe are London boroughs?",
    dashboardId: "london_safety_overview",
    category: "Crime & Safety"
  },
  {
    id: "crime_patterns_question",
    text: "What are the crime patterns in London?",
    dashboardId: "london_crime_analysis", 
    category: "Crime & Safety"
  },
  {
    id: "safest_boroughs_question",
    text: "Which London boroughs are safest?",
    dashboardId: "borough_safety_comparison",
    category: "Crime & Safety"
  },

  // Demographics
  {
    id: "population_question",
    text: "Which areas have the highest population?",
    dashboardId: "london_population_analysis",
    category: "Demographics"
  },
  {
    id: "diversity_question",
    text: "What's the ethnic diversity like across London?",
    dashboardId: "london_diversity_overview",
    category: "Demographics"
  },
  {
    id: "population_trends_question", 
    text: "How has London's population changed over time?",
    dashboardId: "population_trends_analysis",
    category: "Demographics"
  },
  {
    id: "cultural_diversity_question",
    text: "What is London's cultural composition?",
    dashboardId: "cultural_diversity_study",
    category: "Demographics"
  },

  // Housing & Economy
  {
    id: "housing_question",
    text: "What are the housing costs across London?",
    dashboardId: "london_housing_costs",
    category: "Housing & Economy"
  },
  {
    id: "economic_question",
    text: "What are the economic indicators across London?",
    dashboardId: "london_economic_indicators",
    category: "Housing & Economy"
  },
  {
    id: "housing_affordability_question",
    text: "How affordable is housing in London?",
    dashboardId: "housing_affordability_analysis",
    category: "Housing & Economy"
  },
  {
    id: "property_trends_question",
    text: "What are the London property market trends?",
    dashboardId: "property_market_trends",
    category: "Housing & Economy"
  },

  // Education
  {
    id: "education_question",
    text: "How good are the schools in London?",
    dashboardId: "london_education_quality",
    category: "Education"
  },
  {
    id: "educational_resources_question",
    text: "What educational resources are available in London?",
    dashboardId: "educational_resources_analysis",
    category: "Education"
  },
  {
    id: "school_performance_question",
    text: "How do London schools compare in performance?",
    dashboardId: "school_performance_study",
    category: "Education"
  },
  {
    id: "library_services_question",
    text: "How are library services used across London?",
    dashboardId: "library_services_analysis",
    category: "Education"
  },

  // Transportation
  {
    id: "transport_question",
    text: "How accessible is public transport in London?",
    dashboardId: "london_transport_accessibility",
    category: "Transportation"
  },
  {
    id: "transport_network_question",
    text: "How well connected is London's transport network?",
    dashboardId: "transport_network_analysis",
    category: "Transportation"
  },

  // Healthcare
  {
    id: "health_question",
    text: "What healthcare facilities are available in London?",
    dashboardId: "london_health_facilities",
    category: "Healthcare"
  },
  {
    id: "healthcare_access_question",
    text: "How accessible is healthcare across London?",
    dashboardId: "healthcare_access_study",
    category: "Healthcare"
  }
];

export const getQuestionById = (id: string): Question | undefined => {
  return QUESTIONS.find(q => q.id === id);
};

export const getQuestionsByCategory = (category: string): Question[] => {
  return QUESTIONS.filter(q => q.category === category);
};

export const getDashboardByQuestion = (questionText: string): DashboardWithCharts | undefined => {
  const question = QUESTIONS.find(q => q.text === questionText);
  if (!question) return undefined;
  
  return getDashboardWithCharts(question.dashboardId);
};

export const getAllQuestions = (): string[] => {
  return QUESTIONS.map(q => q.text);
};

export const getAllCategories = (): string[] => {
  return Array.from(new Set(QUESTIONS.map(q => q.category)));
};