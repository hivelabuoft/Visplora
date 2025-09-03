export interface Dashboard {
  id: string;
  title: string;
  category: string;
  chartIds: string[];
  insights: string[];
}

export const TRANSPORTATION_DASHBOARDS: Dashboard[] = [
  {
    id: "london_transport_accessibility",
    title: "How accessible is public transport in London?",
    category: "Transportation",
    chartIds: ["population_by_borough", "diversity_by_borough"], // Placeholder charts until transport charts are created
    insights: [
      "Central London has the highest density of transport links",
      "Zone 1 and 2 have excellent tube connectivity",
      "Bus routes provide comprehensive coverage across all boroughs",
      "Some outer areas have limited public transport options"
    ]
  },
  {
    id: "transport_network_analysis",
    title: "How well connected is London's transport network?",
    category: "Transportation",
    chartIds: ["population_by_borough", "diversity_by_borough"], // Placeholder charts until transport charts are created
    insights: [
      "London's transport network is one of the most comprehensive in the world",
      "Different modes of transport serve different areas effectively",
      "Transport accessibility affects property prices and economic development"
    ]
  }
];

export const HEALTHCARE_DASHBOARDS: Dashboard[] = [
  {
    id: "london_health_facilities",
    title: "What healthcare facilities are available in London?",
    category: "Healthcare",
    chartIds: ["population_by_borough", "income_distribution"], // Placeholder charts until healthcare charts are created
    insights: [
      "NHS services are distributed across all London boroughs",
      "Some areas have higher GP to population ratios than others",
      "Specialist hospitals are concentrated in central areas",
      "Healthcare accessibility varies significantly across the city"
    ]
  },
  {
    id: "healthcare_access_study",
    title: "How accessible is healthcare across London?",
    category: "Healthcare",
    chartIds: ["population_by_borough", "income_distribution"], // Placeholder charts until healthcare charts are created
    insights: [
      "Healthcare access correlates with population density",
      "Some boroughs face challenges in healthcare provision",
      "Specialized services are not equally distributed across London"
    ]
  }
];