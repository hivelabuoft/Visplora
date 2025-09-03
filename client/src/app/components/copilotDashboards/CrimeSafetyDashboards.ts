export interface Dashboard {
  id: string;
  title: string;
  category: string;
  chartIds: string[];
  insights: string[];
}

export const CRIME_SAFETY_DASHBOARDS: Dashboard[] = [
  {
    id: "london_safety_overview",
    title: "How safe are London boroughs?",
    category: "Crime & Safety",
    chartIds: ["crime_by_borough", "crime_categories_pie", "crime_trends_timeline", "safety_heatmap"],
    insights: [
      "Crime rates vary significantly across London boroughs",
      "Anti-social behaviour and theft are the most common crime types",
      "Central London areas tend to have higher crime rates due to higher footfall",
      "Some boroughs show improving trends while others have concerning patterns"
    ]
  },
  {
    id: "london_crime_analysis",
    title: "What are the crime patterns in London?",
    category: "Crime & Safety",
    chartIds: ["crime_categories_pie", "crime_trends_timeline", "safety_heatmap"],
    insights: [
      "Violence and sexual offences are among the most reported crimes",
      "Crime patterns vary significantly by time of year and location",
      "Anti-social behaviour peaks during certain months"
    ]
  },
  {
    id: "borough_safety_comparison",
    title: "Which London boroughs are safest?",
    category: "Crime & Safety", 
    chartIds: ["crime_by_borough", "safety_heatmap"],
    insights: [
      "Outer London boroughs tend to have lower crime rates",
      "Central London has higher crime density but also higher population density",
      "Crime rates must be considered relative to population and visitor numbers"
    ]
  }
];