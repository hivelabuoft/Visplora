export interface Dashboard {
  id: string;
  title: string;
  category: string;
  chartIds: string[];
  insights: string[];
}

export const EDUCATION_DASHBOARDS: Dashboard[] = [
  {
    id: "london_education_quality",
    title: "How good are the schools in London?",
    category: "Education",
    chartIds: ["school_performance_ratings", "schools_by_borough"],
    insights: [
      "The majority of London schools are rated 'Good' or 'Outstanding' by Ofsted",
      "School distribution varies across boroughs based on population density",
      "London has a diverse mix of school types including academies, maintained schools, and independents",
      "Educational outcomes vary significantly across different areas"
    ]
  },
  {
    id: "educational_resources_analysis",
    title: "What educational resources are available in London?",
    category: "Education",
    chartIds: ["schools_by_borough", "library_usage_trends"],
    insights: [
      "Educational resources are distributed unevenly across boroughs",
      "Library usage has changed significantly over recent years",
      "Some areas have better access to educational facilities than others"
    ]
  },
  {
    id: "school_performance_study",
    title: "How do London schools compare in performance?",
    category: "Education",
    chartIds: ["school_performance_ratings", "schools_by_borough"],
    insights: [
      "School performance varies significantly across London",
      "Ofsted ratings provide insight into educational quality",
      "Some boroughs consistently outperform others in educational outcomes"
    ]
  },
  {
    id: "library_services_analysis",
    title: "How are library services used across London?",
    category: "Education",
    chartIds: ["library_usage_trends"],
    insights: [
      "Library usage patterns have evolved significantly in recent years",
      "Digital services are changing how residents use libraries",
      "Different boroughs show varying levels of library engagement"
    ]
  }
];