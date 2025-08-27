// Travel data utilities and mock data generators
import {
  TravelCostData,
  TravelSafetyData,
  TravelAccessibilityData,
  TravelAttractionsData,
  TravelFlowData,
  TravelReviewsData,
  TravelCultureData,
  TravelEnvironmentData,
  DestinationMetrics,
  CostTimelineData,
  SafetyComparisonData,
  AttractionCategoryData,
  VisitorFlowSeasonalData,
  ReviewsDistributionData,
  CulturalDiversityData,
  EnvironmentalQualityData
} from './travelDataTypes';

// Popular travel destinations data - expanded to match clickable countries
export const TRAVEL_DESTINATIONS = [
  // Asia - East Asia
  { country: 'Japan', city: 'Tokyo', region: 'East Asia', continent: 'Asia' },
  { country: 'China', city: 'Beijing', region: 'East Asia', continent: 'Asia' },
  { country: 'South Korea', city: 'Seoul', region: 'East Asia', continent: 'Asia' },
  { country: 'North Korea', city: 'Pyongyang', region: 'East Asia', continent: 'Asia' },
  { country: 'Mongolia', city: 'Ulaanbaatar', region: 'East Asia', continent: 'Asia' },
  
  // Asia - South Asia
  { country: 'India', city: 'Mumbai', region: 'South Asia', continent: 'Asia' },
  { country: 'Pakistan', city: 'Karachi', region: 'South Asia', continent: 'Asia' },
  { country: 'Bangladesh', city: 'Dhaka', region: 'South Asia', continent: 'Asia' },
  { country: 'Nepal', city: 'Kathmandu', region: 'South Asia', continent: 'Asia' },
  { country: 'Sri Lanka', city: 'Colombo', region: 'South Asia', continent: 'Asia' },
  { country: 'Bhutan', city: 'Thimphu', region: 'South Asia', continent: 'Asia' },
  { country: 'Maldives', city: 'Male', region: 'South Asia', continent: 'Asia' },
  
  // Asia - Southeast Asia
  { country: 'Thailand', city: 'Bangkok', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Singapore', city: 'Singapore', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Malaysia', city: 'Kuala Lumpur', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Indonesia', city: 'Jakarta', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Philippines', city: 'Manila', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Vietnam', city: 'Ho Chi Minh City', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Myanmar', city: 'Yangon', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Cambodia', city: 'Phnom Penh', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Laos', city: 'Vientiane', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Brunei', city: 'Bandar Seri Begawan', region: 'Southeast Asia', continent: 'Asia' },
  { country: 'Timor-Leste', city: 'Dili', region: 'Southeast Asia', continent: 'Asia' },
  
  // Europe - Western Europe
  { country: 'France', city: 'Paris', region: 'Western Europe', continent: 'Europe' },
  { country: 'United Kingdom', city: 'London', region: 'Western Europe', continent: 'Europe' },
  { country: 'Germany', city: 'Berlin', region: 'Western Europe', continent: 'Europe' },
  { country: 'Netherlands', city: 'Amsterdam', region: 'Western Europe', continent: 'Europe' },
  { country: 'Belgium', city: 'Brussels', region: 'Western Europe', continent: 'Europe' },
  { country: 'Switzerland', city: 'Zurich', region: 'Western Europe', continent: 'Europe' },
  { country: 'Austria', city: 'Vienna', region: 'Western Europe', continent: 'Europe' },
  { country: 'Ireland', city: 'Dublin', region: 'Western Europe', continent: 'Europe' },
  { country: 'Luxembourg', city: 'Luxembourg', region: 'Western Europe', continent: 'Europe' },
  
  // Europe - Southern Europe
  { country: 'Italy', city: 'Rome', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Spain', city: 'Barcelona', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Portugal', city: 'Lisbon', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Greece', city: 'Athens', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Croatia', city: 'Zagreb', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Slovenia', city: 'Ljubljana', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Bosnia and Herzegovina', city: 'Sarajevo', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Serbia', city: 'Belgrade', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Montenegro', city: 'Podgorica', region: 'Southern Europe', continent: 'Europe' },
  { country: 'North Macedonia', city: 'Skopje', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Albania', city: 'Tirana', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Malta', city: 'Valletta', region: 'Southern Europe', continent: 'Europe' },
  { country: 'Cyprus', city: 'Nicosia', region: 'Southern Europe', continent: 'Europe' },
  
  // Europe - Northern Europe
  { country: 'Norway', city: 'Oslo', region: 'Northern Europe', continent: 'Europe' },
  { country: 'Sweden', city: 'Stockholm', region: 'Northern Europe', continent: 'Europe' },
  { country: 'Denmark', city: 'Copenhagen', region: 'Northern Europe', continent: 'Europe' },
  { country: 'Finland', city: 'Helsinki', region: 'Northern Europe', continent: 'Europe' },
  { country: 'Iceland', city: 'Reykjavik', region: 'Northern Europe', continent: 'Europe' },
  { country: 'Estonia', city: 'Tallinn', region: 'Northern Europe', continent: 'Europe' },
  { country: 'Latvia', city: 'Riga', region: 'Northern Europe', continent: 'Europe' },
  { country: 'Lithuania', city: 'Vilnius', region: 'Northern Europe', continent: 'Europe' },
  
  // Europe - Central Europe
  { country: 'Poland', city: 'Warsaw', region: 'Central Europe', continent: 'Europe' },
  { country: 'Czech Republic', city: 'Prague', region: 'Central Europe', continent: 'Europe' },
  { country: 'Hungary', city: 'Budapest', region: 'Central Europe', continent: 'Europe' },
  { country: 'Slovakia', city: 'Bratislava', region: 'Central Europe', continent: 'Europe' },
  { country: 'Romania', city: 'Bucharest', region: 'Central Europe', continent: 'Europe' },
  { country: 'Bulgaria', city: 'Sofia', region: 'Central Europe', continent: 'Europe' },
  
  // Europe - Eastern Europe
  { country: 'Russia', city: 'Moscow', region: 'Eastern Europe', continent: 'Europe' },
  { country: 'Ukraine', city: 'Kiev', region: 'Eastern Europe', continent: 'Europe' },
  { country: 'Belarus', city: 'Minsk', region: 'Eastern Europe', continent: 'Europe' },
  { country: 'Moldova', city: 'Chisinau', region: 'Eastern Europe', continent: 'Europe' },
  
  // North America  
  { country: 'United States', city: 'New York', region: 'North America', continent: 'North America' },
  { country: 'Canada', city: 'Toronto', region: 'North America', continent: 'North America' },
  { country: 'Mexico', city: 'Mexico City', region: 'North America', continent: 'North America' },
  { country: 'Guatemala', city: 'Guatemala City', region: 'Central America', continent: 'North America' },
  { country: 'Costa Rica', city: 'San José', region: 'Central America', continent: 'North America' },
  { country: 'Panama', city: 'Panama City', region: 'Central America', continent: 'North America' },
  
  // South America
  { country: 'Brazil', city: 'São Paulo', region: 'South America', continent: 'South America' },
  { country: 'Argentina', city: 'Buenos Aires', region: 'South America', continent: 'South America' },
  { country: 'Chile', city: 'Santiago', region: 'South America', continent: 'South America' },
  { country: 'Colombia', city: 'Bogotá', region: 'South America', continent: 'South America' },
  { country: 'Peru', city: 'Lima', region: 'South America', continent: 'South America' },
  { country: 'Ecuador', city: 'Quito', region: 'South America', continent: 'South America' },
  { country: 'Uruguay', city: 'Montevideo', region: 'South America', continent: 'South America' },
  { country: 'Venezuela', city: 'Caracas', region: 'South America', continent: 'South America' },
  { country: 'Bolivia', city: 'La Paz', region: 'South America', continent: 'South America' },
  { country: 'Paraguay', city: 'Asunción', region: 'South America', continent: 'South America' },
  { country: 'Guyana', city: 'Georgetown', region: 'South America', continent: 'South America' },
  { country: 'Suriname', city: 'Paramaribo', region: 'South America', continent: 'South America' },
  
  // Middle East
  { country: 'Turkey', city: 'Istanbul', region: 'Middle East', continent: 'Asia/Europe' },
  { country: 'United Arab Emirates', city: 'Dubai', region: 'Middle East', continent: 'Asia' },
  { country: 'Saudi Arabia', city: 'Riyadh', region: 'Middle East', continent: 'Asia' },
  { country: 'Israel', city: 'Tel Aviv', region: 'Middle East', continent: 'Asia' },
  { country: 'Jordan', city: 'Amman', region: 'Middle East', continent: 'Asia' },
  { country: 'Qatar', city: 'Doha', region: 'Middle East', continent: 'Asia' },
  { country: 'Kuwait', city: 'Kuwait City', region: 'Middle East', continent: 'Asia' },
  { country: 'Bahrain', city: 'Manama', region: 'Middle East', continent: 'Asia' },
  { country: 'Oman', city: 'Muscat', region: 'Middle East', continent: 'Asia' },
  { country: 'Lebanon', city: 'Beirut', region: 'Middle East', continent: 'Asia' },
  { country: 'Iran', city: 'Tehran', region: 'Middle East', continent: 'Asia' },
  { country: 'Iraq', city: 'Baghdad', region: 'Middle East', continent: 'Asia' },
  
  // Central Asia
  { country: 'Kazakhstan', city: 'Almaty', region: 'Central Asia', continent: 'Asia' },
  { country: 'Uzbekistan', city: 'Tashkent', region: 'Central Asia', continent: 'Asia' },
  { country: 'Kyrgyzstan', city: 'Bishkek', region: 'Central Asia', continent: 'Asia' },
  { country: 'Tajikistan', city: 'Dushanbe', region: 'Central Asia', continent: 'Asia' },
  { country: 'Turkmenistan', city: 'Ashgabat', region: 'Central Asia', continent: 'Asia' },
  { country: 'Afghanistan', city: 'Kabul', region: 'Central Asia', continent: 'Asia' },
  
  // Africa - North Africa
  { country: 'Egypt', city: 'Cairo', region: 'North Africa', continent: 'Africa' },
  { country: 'Morocco', city: 'Casablanca', region: 'North Africa', continent: 'Africa' },
  { country: 'Algeria', city: 'Algiers', region: 'North Africa', continent: 'Africa' },
  { country: 'Tunisia', city: 'Tunis', region: 'North Africa', continent: 'Africa' },
  { country: 'Libya', city: 'Tripoli', region: 'North Africa', continent: 'Africa' },
  { country: 'Sudan', city: 'Khartoum', region: 'North Africa', continent: 'Africa' },
  
  // Africa - Sub-Saharan Africa
  { country: 'South Africa', city: 'Cape Town', region: 'Southern Africa', continent: 'Africa' },
  { country: 'Kenya', city: 'Nairobi', region: 'East Africa', continent: 'Africa' },
  { country: 'Tanzania', city: 'Dar es Salaam', region: 'East Africa', continent: 'Africa' },
  { country: 'Ethiopia', city: 'Addis Ababa', region: 'East Africa', continent: 'Africa' },
  { country: 'Uganda', city: 'Kampala', region: 'East Africa', continent: 'Africa' },
  { country: 'Rwanda', city: 'Kigali', region: 'East Africa', continent: 'Africa' },
  { country: 'Ghana', city: 'Accra', region: 'West Africa', continent: 'Africa' },
  { country: 'Nigeria', city: 'Lagos', region: 'West Africa', continent: 'Africa' },
  { country: 'Senegal', city: 'Dakar', region: 'West Africa', continent: 'Africa' },
  { country: 'Mali', city: 'Bamako', region: 'West Africa', continent: 'Africa' },
  { country: 'Burkina Faso', city: 'Ouagadougou', region: 'West Africa', continent: 'Africa' },
  { country: 'Côte d\'Ivoire', city: 'Abidjan', region: 'West Africa', continent: 'Africa' },
  { country: 'Botswana', city: 'Gaborone', region: 'Southern Africa', continent: 'Africa' },
  { country: 'Namibia', city: 'Windhoek', region: 'Southern Africa', continent: 'Africa' },
  { country: 'Zimbabwe', city: 'Harare', region: 'Southern Africa', continent: 'Africa' },
  { country: 'Zambia', city: 'Lusaka', region: 'Southern Africa', continent: 'Africa' },
  { country: 'Madagascar', city: 'Antananarivo', region: 'East Africa', continent: 'Africa' },
  { country: 'Mauritius', city: 'Port Louis', region: 'East Africa', continent: 'Africa' },
  
  // Oceania
  { country: 'Australia', city: 'Sydney', region: 'Oceania', continent: 'Australia' },
  { country: 'New Zealand', city: 'Auckland', region: 'Oceania', continent: 'Oceania' },
  { country: 'Fiji', city: 'Suva', region: 'Oceania', continent: 'Oceania' },
  { country: 'Papua New Guinea', city: 'Port Moresby', region: 'Oceania', continent: 'Oceania' },
  { country: 'Solomon Islands', city: 'Honiara', region: 'Oceania', continent: 'Oceania' },
  { country: 'Vanuatu', city: 'Port Vila', region: 'Oceania', continent: 'Oceania' },
  { country: 'Samoa', city: 'Apia', region: 'Oceania', continent: 'Oceania' },
  { country: 'Tonga', city: 'Nuku\'alofa', region: 'Oceania', continent: 'Oceania' },
  { country: 'Palau', city: 'Ngerulmud', region: 'Oceania', continent: 'Oceania' },
  { country: 'Micronesia', city: 'Palikir', region: 'Oceania', continent: 'Oceania' },
  { country: 'Marshall Islands', city: 'Majuro', region: 'Oceania', continent: 'Oceania' },
  
  // Caribbean
  { country: 'Cuba', city: 'Havana', region: 'Caribbean', continent: 'North America' },
  { country: 'Jamaica', city: 'Kingston', region: 'Caribbean', continent: 'North America' },
  { country: 'Dominican Republic', city: 'Santo Domingo', region: 'Caribbean', continent: 'North America' },
  { country: 'Haiti', city: 'Port-au-Prince', region: 'Caribbean', continent: 'North America' },
  { country: 'Bahamas', city: 'Nassau', region: 'Caribbean', continent: 'North America' },
  { country: 'Barbados', city: 'Bridgetown', region: 'Caribbean', continent: 'North America' },
  { country: 'Trinidad and Tobago', city: 'Port of Spain', region: 'Caribbean', continent: 'North America' }
];

export const REGIONS = [
  'Western Europe',
  'Southern Europe', 
  'Central Europe',
  'Northern Europe',
  'Eastern Europe',
  'East Asia',
  'South Asia',
  'Southeast Asia',
  'Central Asia',
  'North America',
  'Central America',
  'South America',
  'Middle East',
  'North Africa',
  'West Africa',
  'East Africa',
  'Southern Africa',
  'Oceania',
  'Caribbean'
];

// Generate mock cost data
export const generateMockCostData = (): TravelCostData[] => {
  const data: TravelCostData[] = [];
  
  TRAVEL_DESTINATIONS.forEach(dest => {
    for (let year = 2020; year <= 2025; year++) {
      for (let month = 1; month <= 12; month++) {
        // Base costs vary by destination
        const baseCosts = {
          'Tokyo': { hotel: 180, meal: 15, transport: 50 },
          'Paris': { hotel: 200, meal: 18, transport: 45 },
          'Bangkok': { hotel: 60, meal: 8, transport: 25 },
          'New York': { hotel: 250, meal: 22, transport: 60 },
          'Rome': { hotel: 140, meal: 16, transport: 35 },
          'Barcelona': { hotel: 120, meal: 14, transport: 30 },
          'Istanbul': { hotel: 80, meal: 10, transport: 20 },
          'London': { hotel: 220, meal: 20, transport: 55 },
          'Berlin': { hotel: 110, meal: 13, transport: 35 },
          'Sydney': { hotel: 190, meal: 19, transport: 45 },
          'Amsterdam': { hotel: 170, meal: 17, transport: 40 },
          'Singapore': { hotel: 160, meal: 16, transport: 35 },
          'Dubai': { hotel: 200, meal: 18, transport: 30 },
          'Seoul': { hotel: 130, meal: 12, transport: 25 },
          'Lisbon': { hotel: 100, meal: 12, transport: 25 }
        };
        
        const base = baseCosts[dest.city as keyof typeof baseCosts];
        if (!base) continue;
        
        // Add seasonal variation and inflation
        const seasonalMultiplier = [6, 7, 8, 9, 10, 11].includes(month) ? 1.2 : 1.0; // Summer boost
        const inflationMultiplier = 1 + (year - 2020) * 0.05; // 5% per year
        const randomVariation = 0.9 + Math.random() * 0.2; // ±10% random
        
        const hotelPrice = Math.round(base.hotel * seasonalMultiplier * inflationMultiplier * randomVariation);
        const mealPrice = Math.round(base.meal * seasonalMultiplier * inflationMultiplier * randomVariation);
        const transportPrice = Math.round(base.transport * inflationMultiplier * randomVariation);
        
        // Cost index: weighted average normalized to 100 = global average
        const costIndex = Math.round(
          (hotelPrice * 0.5 + mealPrice * 3 * 0.3 + transportPrice * 0.2) / 2
        );
        
        data.push({
          country: dest.country,
          city: dest.city,
          year,
          month,
          hotelPriceUSD: hotelPrice,
          mealPriceUSD: mealPrice,
          transportPassUSD: transportPrice,
          costIndex
        });
      }
    }
  });
  
  return data;
};

// Generate mock safety data
export const generateMockSafetyData = (): TravelSafetyData[] => {
  const safetyProfiles = {
    'Tokyo': { crime: 15, homicide: 0.3, political: 10, health: 20, terrorism: 15 },
    'Paris': { crime: 35, homicide: 1.2, political: 20, health: 15, terrorism: 30 },
    'Bangkok': { crime: 45, homicide: 2.1, political: 35, health: 40, terrorism: 25 },
    'New York': { crime: 40, homicide: 3.4, political: 15, health: 25, terrorism: 35 },
    'Rome': { crime: 38, homicide: 0.8, political: 25, health: 20, terrorism: 25 },
    'Barcelona': { crime: 42, homicide: 0.9, political: 20, health: 18, terrorism: 30 },
    'Istanbul': { crime: 35, homicide: 1.5, political: 45, health: 35, terrorism: 50 },
    'London': { crime: 32, homicide: 1.1, political: 18, health: 15, terrorism: 40 },
    'Berlin': { crime: 28, homicide: 0.9, political: 15, health: 12, terrorism: 25 },
    'Sydney': { crime: 25, homicide: 1.0, political: 10, health: 15, terrorism: 20 },
    'Amsterdam': { crime: 30, homicide: 0.7, political: 12, health: 10, terrorism: 20 },
    'Singapore': { crime: 12, homicide: 0.2, political: 8, health: 10, terrorism: 15 },
    'Dubai': { crime: 20, homicide: 0.5, political: 25, health: 15, terrorism: 30 },
    'Seoul': { crime: 22, homicide: 0.6, political: 20, health: 18, terrorism: 20 },
    'Lisbon': { crime: 30, homicide: 0.8, political: 15, health: 15, terrorism: 20 }
  };

  return TRAVEL_DESTINATIONS.map(dest => {
    const profile = safetyProfiles[dest.city as keyof typeof safetyProfiles];
    if (!profile) return null;
    
    const advisoryLevels = ['1-Low', '2-Caution', '3-Reconsider', '4-DoNotTravel'];
    const avgRisk = (profile.crime + profile.political + profile.health + profile.terrorism) / 4;
    const advisoryLevel = avgRisk < 20 ? advisoryLevels[0] : 
                         avgRisk < 35 ? advisoryLevels[1] :
                         avgRisk < 50 ? advisoryLevels[2] : advisoryLevels[3];
    
    const overallSafetyScore = Math.max(5, 100 - avgRisk); // Higher = safer
    
    return {
      country: dest.country,
      city: dest.city,
      year: 2025,
      crimeIndex: profile.crime,
      homicideRatePer100k: profile.homicide,
      politicalRiskIndex: profile.political,
      healthRiskIndex: profile.health,
      travelAdvisoryLevel: advisoryLevel,
      terrorismRiskIndex: profile.terrorism,
      overallSafetyScore
    };
  }).filter(Boolean) as TravelSafetyData[];
};

// Generate mock visitor flow data 
export const generateMockFlowData = (): TravelFlowData[] => {
  const data: TravelFlowData[] = [];
  
  const visitorProfiles = {
    'Tokyo': 15000000, 'Paris': 18000000, 'Bangkok': 12000000, 'New York': 13000000,
    'Rome': 9000000, 'Barcelona': 8000000, 'Istanbul': 11000000, 'London': 16000000,
    'Berlin': 7000000, 'Sydney': 4000000, 'Amsterdam': 6000000, 'Singapore': 10000000,
    'Dubai': 14000000, 'Seoul': 8500000, 'Lisbon': 3500000
  };
  
  TRAVEL_DESTINATIONS.forEach(dest => {
    const annualVisitors = visitorProfiles[dest.city as keyof typeof visitorProfiles];
    if (!annualVisitors) return;
    
    for (let month = 1; month <= 12; month++) {
      // Seasonal patterns
      const seasonalMultipliers = [0.7, 0.8, 0.9, 1.0, 1.1, 1.3, 1.4, 1.3, 1.1, 1.0, 0.9, 0.8];
      const monthlyVisitors = Math.round(annualVisitors * seasonalMultipliers[month - 1] / 12);
      
      const seasons = ['Low', 'Low', 'Shoulder', 'Shoulder', 'Shoulder', 'High', 'High', 'High', 'Shoulder', 'Shoulder', 'Low', 'Low'];
      const season = seasons[month - 1];
      
      const occupancyRate = Math.min(95, 50 + (monthlyVisitors / annualVisitors) * 12 * 40);
      const crowdingIndex = Math.round(occupancyRate * 1.2);
      
      data.push({
        country: dest.country,
        city: dest.city,
        year: 2025,
        month,
        intlArrivals: monthlyVisitors,
        hotelOccupancyRatePct: Math.round(occupancyRate),
        peakCrowdingIndex: crowdingIndex,
        season,
        eventsFlag: Math.random() > 0.8
      });
    }
  });
  
  return data;
};

// Generate mock reviews data
export const generateMockReviewsData = (): TravelReviewsData[] => {
  const platforms = ['Google', 'TripAdvisor', 'Booking.com'];
  const data: TravelReviewsData[] = [];
  
  const reviewProfiles = {
    'Tokyo': { avg: 4.6, count: 45000, sentiment: 0.8 },
    'Paris': { avg: 4.3, count: 52000, sentiment: 0.7 },
    'Bangkok': { avg: 4.4, count: 38000, sentiment: 0.75 },
    'New York': { avg: 4.2, count: 48000, sentiment: 0.65 },
    'Rome': { avg: 4.4, count: 41000, sentiment: 0.75 },
    'Barcelona': { avg: 4.5, count: 35000, sentiment: 0.78 },
    'Istanbul': { avg: 4.1, count: 32000, sentiment: 0.7 },
    'London': { avg: 4.3, count: 46000, sentiment: 0.72 },
    'Berlin': { avg: 4.4, count: 29000, sentiment: 0.76 },
    'Sydney': { avg: 4.5, count: 21000, sentiment: 0.8 },
    'Amsterdam': { avg: 4.4, count: 28000, sentiment: 0.77 },
    'Singapore': { avg: 4.6, count: 31000, sentiment: 0.82 },
    'Dubai': { avg: 4.3, count: 35000, sentiment: 0.75 },
    'Seoul': { avg: 4.5, count: 27000, sentiment: 0.78 },
    'Lisbon': { avg: 4.4, count: 18000, sentiment: 0.78 }
  };
  
  TRAVEL_DESTINATIONS.forEach(dest => {
    const profile = reviewProfiles[dest.city as keyof typeof reviewProfiles];
    if (!profile) return;
    
    platforms.forEach(platform => {
      // Platform variations
      const platformMultiplier = platform === 'Google' ? 1.0 : 
                                platform === 'TripAdvisor' ? 0.8 : 0.6;
      
      data.push({
        country: dest.country,
        city: dest.city,
        platform,
        year: 2025,
        month: 6, // Mid-year snapshot
        avgRating: Math.round((profile.avg + (Math.random() - 0.5) * 0.2) * 10) / 10,
        ratingCount: Math.round(profile.count * platformMultiplier),
        ratingStddev: 0.8 + Math.random() * 0.6,
        recentReviewShare90d: 0.15 + Math.random() * 0.1,
        sentimentScore: profile.sentiment + (Math.random() - 0.5) * 0.1
      });
    });
  });
  
  return data;
};

// Utility functions for data processing
export const getCostTimelineForDestination = (costData: TravelCostData[], destination: string): CostTimelineData[] => {
  return costData
    .filter(d => d.city === destination)
    .map(d => ({
      year: d.year,
      month: d.month,
      date: `${d.year}-${String(d.month).padStart(2, '0')}`,
      avgHotelPrice: d.hotelPriceUSD,
      avgMealPrice: d.mealPriceUSD,
      avgTransportCost: d.transportPassUSD,
      costIndex: d.costIndex,
      destination: d.city
    }));
};

export const getSafetyComparisonByRegion = (safetyData: TravelSafetyData[]): SafetyComparisonData[] => {
  const regionMap: Record<string, string> = {};
  TRAVEL_DESTINATIONS.forEach(d => regionMap[d.city] = d.region);
  
  const regionStats: Record<string, { crime: number[], political: number[], health: number[], cities: number }> = {};
  
  safetyData.forEach(d => {
    const region = regionMap[d.city];
    if (!region) return;
    
    if (!regionStats[region]) {
      regionStats[region] = { crime: [], political: [], health: [], cities: 0 };
    }
    
    regionStats[region].crime.push(d.crimeIndex);
    regionStats[region].political.push(d.politicalRiskIndex);
    regionStats[region].health.push(d.healthRiskIndex);
    regionStats[region].cities++;
  });
  
  return Object.entries(regionStats).map(([region, stats]) => ({
    region,
    crimeIndex: Math.round(stats.crime.reduce((a, b) => a + b, 0) / stats.crime.length),
    politicalRisk: Math.round(stats.political.reduce((a, b) => a + b, 0) / stats.political.length),
    healthRisk: Math.round(stats.health.reduce((a, b) => a + b, 0) / stats.health.length),
    overallSafety: Math.round(100 - (
      (stats.crime.reduce((a, b) => a + b, 0) / stats.crime.length +
       stats.political.reduce((a, b) => a + b, 0) / stats.political.length +
       stats.health.reduce((a, b) => a + b, 0) / stats.health.length) / 3
    ))
  }));
};

export const getVisitorFlowForDestination = (flowData: TravelFlowData[], destination: string): VisitorFlowSeasonalData[] => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return flowData
    .filter(d => d.city === destination)
    .map(d => ({
      month: d.month,
      monthName: monthNames[d.month - 1],
      arrivals: d.intlArrivals,
      occupancyRate: d.hotelOccupancyRatePct,
      season: d.season,
      destination: d.city
    }));
};

export const getDestinationMetrics = (
  costData: TravelCostData[], 
  safetyData: TravelSafetyData[], 
  flowData: TravelFlowData[], 
  reviewsData: TravelReviewsData[]
): DestinationMetrics[] => {
  return TRAVEL_DESTINATIONS.map(dest => {
    const costMetrics = costData.filter(d => d.city === dest.city);
    const safetyMetric = safetyData.find(d => d.city === dest.city);
    const flowMetrics = flowData.filter(d => d.city === dest.city);
    const reviewMetrics = reviewsData.filter(d => d.city === dest.city);
    
    const avgCostIndex = costMetrics.length > 0 
      ? Math.round(costMetrics.reduce((sum, d) => sum + d.costIndex, 0) / costMetrics.length)
      : 50;
      
    const safetyScore = safetyMetric?.overallSafetyScore || 50;
    
    const totalVisitorFlow = flowMetrics.reduce((sum, d) => sum + d.intlArrivals, 0);
    
    const avgReviewScore = reviewMetrics.length > 0
      ? Math.round(reviewMetrics.reduce((sum, d) => sum + d.avgRating, 0) / reviewMetrics.length * 10) / 10
      : 4.0;
    
    // Mock visa-free access (0-100 scale)
    const visaFreeAccess = Math.floor(20 + Math.random() * 60);
    
    // Mock environmental score (higher = better)
    const environmentScore = Math.floor(40 + Math.random() * 50);
    
    // Travel attractiveness composite (weighted average)
    const travelAttractiveness = Math.round(
      (100 - avgCostIndex) * 0.2 +  // Lower cost = more attractive
      safetyScore * 0.25 +
      avgReviewScore * 20 * 0.2 +   // Scale to 100
      (Math.log(totalVisitorFlow) * 10) * 0.15 + // Log scale for visitor flow
      visaFreeAccess * 0.1 +
      environmentScore * 0.1
    );
    
    return {
      country: dest.country,
      city: dest.city,
      avgCostIndex,
      safetyScore,
      visaFreeAccess,
      avgReviewScore,
      totalVisitorFlow,
      environmentScore,
      travelAttractiveness: Math.min(100, Math.max(0, travelAttractiveness))
    };
  });
};