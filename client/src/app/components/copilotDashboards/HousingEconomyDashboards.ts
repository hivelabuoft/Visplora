export interface Dashboard {
  id: string;
  title: string;
  category: string;
  chartIds: string[];
  insights: string[];
}

export const HOUSING_ECONOMY_DASHBOARDS: Dashboard[] = [
  {
    id: "london_housing_costs",
    title: "What are the housing costs across London?",
    category: "Housing & Economy",
    chartIds: ["house_prices_by_borough", "price_trends_timeline"],
    insights: [
      "Central London boroughs like Westminster and Kensington have the highest house prices",
      "House prices have generally increased across all boroughs over time",
      "There's a significant price gap between inner and outer London areas",
      "Some areas show more volatile price movements than others"
    ]
  },
  {
    id: "london_economic_indicators",
    title: "What are the economic indicators across London?",
    category: "Housing & Economy",
    chartIds: ["income_distribution", "house_prices_by_borough"],
    insights: [
      "Income levels correlate strongly with housing costs",
      "Economic inequality varies significantly across boroughs",
      "Some areas show strong economic growth while others face challenges"
    ]
  },
  {
    id: "housing_affordability_analysis",
    title: "How affordable is housing in London?",
    category: "Housing & Economy",
    chartIds: ["house_prices_by_borough", "income_distribution", "price_trends_timeline"],
    insights: [
      "Housing affordability crisis affects most London boroughs",
      "Price-to-income ratios vary dramatically across the city",
      "Some areas are becoming increasingly unaffordable for average earners"
    ]
  },
  {
    id: "property_market_trends",
    title: "What are the London property market trends?",
    category: "Housing & Economy",
    chartIds: ["price_trends_timeline", "house_prices_by_borough"],
    insights: [
      "Property markets show cyclical patterns over time",
      "Different areas experience different market dynamics",
      "External factors significantly influence price movements"
    ]
  }
];