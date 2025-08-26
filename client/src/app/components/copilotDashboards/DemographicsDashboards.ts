export interface Dashboard {
  id: string;
  title: string;
  category: string;
  chartIds: string[];
  insights: string[];
}

export const DEMOGRAPHICS_DASHBOARDS: Dashboard[] = [
  {
    id: "london_population_analysis",
    title: "Which areas have the highest population?",
    category: "Demographics",
    chartIds: ["population_by_borough", "population_growth_timeline"],
    insights: [
      "Croydon, Barnet, and Ealing are among the most populated boroughs",
      "London's population has grown significantly over the past decades",
      "Outer London boroughs generally have larger populations than central areas",
      "Population growth varies significantly across different areas"
    ]
  },
  {
    id: "london_diversity_overview",
    title: "What's the ethnic diversity like across London?",
    category: "Demographics",
    chartIds: ["ethnicity_distribution", "diversity_by_borough"],
    insights: [
      "London is one of the most ethnically diverse cities in the world",
      "Different boroughs have distinct demographic profiles",
      "Immigration patterns have significantly shaped London's demographics over time",
      "Some areas show higher concentrations of specific ethnic communities"
    ]
  },
  {
    id: "population_trends_analysis",
    title: "How has London's population changed over time?",
    category: "Demographics",
    chartIds: ["population_growth_timeline", "population_by_borough"],
    insights: [
      "London's population has experienced several waves of growth and decline",
      "Post-war periods show significant population shifts",
      "Recent decades show steady growth across most boroughs"
    ]
  },
  {
    id: "cultural_diversity_study",
    title: "What is London's cultural composition?",
    category: "Demographics",
    chartIds: ["ethnicity_distribution", "diversity_by_borough"],
    insights: [
      "London has residents from virtually every country in the world",
      "Different boroughs serve as cultural hubs for different communities",
      "Diversity patterns reflect historical migration and settlement patterns"
    ]
  }
];