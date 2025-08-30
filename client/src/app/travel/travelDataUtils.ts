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

// Major cities data for country detail map
export const getMajorCities = (country: string): Array<{city: string, longitude: number, latitude: number}> => {
  const cityData: Record<string, Array<{city: string, longitude: number, latitude: number}>> = {
    'France': [
      {city: 'Paris', longitude: 2.3522, latitude: 48.8566},
      {city: 'Lyon', longitude: 4.8357, latitude: 45.7640},
      {city: 'Marseille', longitude: 5.3698, latitude: 43.2965},
      {city: 'Nice', longitude: 7.2619, latitude: 43.7102},
      {city: 'Toulouse', longitude: 1.4442, latitude: 43.6047}
    ],
    'Germany': [
      {city: 'Berlin', longitude: 13.4050, latitude: 52.5200},
      {city: 'Munich', longitude: 11.5820, latitude: 48.1351},
      {city: 'Hamburg', longitude: 9.9937, latitude: 53.5511},
      {city: 'Frankfurt', longitude: 8.6821, latitude: 50.1109},
      {city: 'Cologne', longitude: 6.9603, latitude: 50.9375}
    ],
    'Italy': [
      {city: 'Rome', longitude: 12.4964, latitude: 41.9028},
      {city: 'Milan', longitude: 9.1900, latitude: 45.4642},
      {city: 'Florence', longitude: 11.2558, latitude: 43.7696},
      {city: 'Venice', longitude: 12.3155, latitude: 45.4408},
      {city: 'Naples', longitude: 14.2681, latitude: 40.8518}
    ],
    'Spain': [
      {city: 'Madrid', longitude: -3.7038, latitude: 40.4168},
      {city: 'Barcelona', longitude: 2.1734, latitude: 41.3851},
      {city: 'Seville', longitude: -5.9845, latitude: 37.3891},
      {city: 'Valencia', longitude: -0.3763, latitude: 39.4699},
      {city: 'Bilbao', longitude: -2.9253, latitude: 43.2627}
    ],
    'United Kingdom': [
      {city: 'London', longitude: -0.1276, latitude: 51.5074},
      {city: 'Edinburgh', longitude: -3.1883, latitude: 55.9533},
      {city: 'Manchester', longitude: -2.2426, latitude: 53.4808},
      {city: 'Liverpool', longitude: -2.9916, latitude: 53.4084},
      {city: 'Bath', longitude: -2.3601, latitude: 51.3811}
    ],
    'Japan': [
      {city: 'Tokyo', longitude: 139.6917, latitude: 35.6895},
      {city: 'Osaka', longitude: 135.5023, latitude: 34.6937},
      {city: 'Kyoto', longitude: 135.7681, latitude: 35.0116},
      {city: 'Hiroshima', longitude: 132.4596, latitude: 34.3853},
      {city: 'Nara', longitude: 135.8048, latitude: 34.6851}
    ],
    'Thailand': [
      {city: 'Bangkok', longitude: 100.5018, latitude: 13.7563},
      {city: 'Chiang Mai', longitude: 98.9817, latitude: 18.7883},
      {city: 'Phuket', longitude: 98.3923, latitude: 7.8804},
      {city: 'Pattaya', longitude: 100.8698, latitude: 12.9236},
      {city: 'Krabi', longitude: 99.0632, latitude: 8.0863}
    ],
    'United States': [
      {city: 'New York', longitude: -74.0060, latitude: 40.7128},
      {city: 'Los Angeles', longitude: -118.2437, latitude: 34.0522},
      {city: 'San Francisco', longitude: -122.4194, latitude: 37.7749},
      {city: 'Chicago', longitude: -87.6298, latitude: 41.8781},
      {city: 'Miami', longitude: -80.1918, latitude: 25.7617}
    ],
    'Canada': [
      {city: 'Toronto', longitude: -79.3832, latitude: 43.6532},
      {city: 'Vancouver', longitude: -123.1207, latitude: 49.2827},
      {city: 'Montreal', longitude: -73.5673, latitude: 45.5017},
      {city: 'Calgary', longitude: -114.0719, latitude: 51.0447},
      {city: 'Ottawa', longitude: -75.6972, latitude: 45.4215}
    ],
    'Australia': [
      {city: 'Sydney', longitude: 151.2093, latitude: -33.8688},
      {city: 'Melbourne', longitude: 144.9631, latitude: -37.8136},
      {city: 'Brisbane', longitude: 153.0251, latitude: -27.4698},
      {city: 'Perth', longitude: 115.8605, latitude: -31.9505},
      {city: 'Adelaide', longitude: 138.6007, latitude: -34.9285}
    ]
  };
  
  return cityData[country] || [{city: 'Capital', longitude: 0, latitude: 0}];
};

// Mock reviews distribution data
export const getMockReviewsDistribution = () => [
  { rating: '5 Stars', count: 12500, percentage: 45.2 },
  { rating: '4 Stars', count: 8700, percentage: 31.4 },
  { rating: '3 Stars', count: 4200, percentage: 15.2 },
  { rating: '2 Stars', count: 1800, percentage: 6.5 },
  { rating: '1 Star', count: 450, percentage: 1.7 }
];

// Generate consistent travel growth data based on the same source as KPIs
export const generateConsistentTravelGrowthData = () => {
  const baseVisitorData = {
    'New York': 13000000,
    'Los Angeles': 12000000, 
    'Chicago': 9500000,
    'San Francisco': 7800000,
    'Las Vegas': 8200000,
    'Miami': 6500000,
    'Washington DC': 5200000,
    'Boston': 4800000
  };
  
  return {
    2025: Object.entries(baseVisitorData).map(([city, visitors]) => ({
      city,
      year: 2025,
      visitors,
      change: 5 + Math.random() * 10 // 5-15% growth range
    })),
    2024: Object.entries(baseVisitorData).map(([city, visitors]) => ({
      city,
      year: 2024, 
      visitors: Math.round(visitors * 0.95), // 5% less than 2025
      change: 2 + Math.random() * 6 // 2-8% growth range
    })),
    2023: Object.entries(baseVisitorData).map(([city, visitors]) => ({
      city,
      year: 2023,
      visitors: Math.round(visitors * 0.88), // 12% less than 2025
      change: -5 + Math.random() * 8 // -5% to 3% range (pandemic recovery)
    }))
  };
};

// Mock travel growth data by country and year
export const getMockTravelGrowthDataByCountryYear = (): Record<string, Record<number, Array<{city: string, year: number, visitors: number, change: number}>>> => ({
  'United States': generateConsistentTravelGrowthData(),
  'Japan': {
    2025: [
      { city: 'Tokyo', year: 2025, visitors: 15000000, change: 12.5 },
      { city: 'Osaka', year: 2025, visitors: 11800000, change: 9.8 },
      { city: 'Kyoto', year: 2025, visitors: 8500000, change: 18.2 },
      { city: 'Sapporo', year: 2025, visitors: 2800000, change: 6.3 }
    ],
    2024: [
      { city: 'Tokyo', year: 2024, visitors: 13500000, change: 8.2 },
      { city: 'Osaka', year: 2024, visitors: 10750000, change: 6.4 },
      { city: 'Kyoto', year: 2024, visitors: 7200000, change: 14.8 },
      { city: 'Sapporo', year: 2024, visitors: 2600000, change: 3.9 }
    ],
    2023: [
      { city: 'Tokyo', year: 2023, visitors: 12480000, change: -5.3 },
      { city: 'Osaka', year: 2023, visitors: 10100000, change: -7.2 },
      { city: 'Kyoto', year: 2023, visitors: 6100000, change: -12.8 },
      { city: 'Sapporo', year: 2023, visitors: 2400000, change: -8.1 }
    ]
  },
  'United Kingdom': {
    2025: [
      { city: 'London', year: 2025, visitors: 18000000, change: 7.8 },
      { city: 'Edinburgh', year: 2025, visitors: 4500000, change: 9.2 },
      { city: 'Manchester', year: 2025, visitors: 1400000, change: 5.1 },
      { city: 'Liverpool', year: 2025, visitors: 1200000, change: 12.3 }
    ],
    2024: [
      { city: 'London', year: 2024, visitors: 16700000, change: 4.2 },
      { city: 'Edinburgh', year: 2024, visitors: 4120000, change: 6.8 },
      { city: 'Manchester', year: 2024, visitors: 1330000, change: 2.9 },
      { city: 'Liverpool', year: 2024, visitors: 1100000, change: 8.1 }
    ],
    2023: [
      { city: 'London', year: 2023, visitors: 15500000, change: -8.2 },
      { city: 'Edinburgh', year: 2023, visitors: 3860000, change: -12.3 },
      { city: 'Manchester', year: 2023, visitors: 1292000, change: -15.1 },
      { city: 'Liverpool', year: 2023, visitors: 980000, change: -18.7 }
    ]
  }
});

// Fallback travel growth data for countries not in the main dataset
export const getMockTravelGrowthData = () => [
  { city: 'Tokyo', year: 2025, visitors: 15200000, change: 12.5 },
  { city: 'Paris', year: 2025, visitors: 14800000, change: 8.3 },
  { city: 'London', year: 2025, visitors: 13600000, change: 6.7 },
  { city: 'Dubai', year: 2025, visitors: 12300000, change: 15.2 },
  { city: 'Singapore', year: 2025, visitors: 11900000, change: 9.8 },
  { city: 'New York', year: 2025, visitors: 11500000, change: 4.1 },
  { city: 'Barcelona', year: 2025, visitors: 10800000, change: 7.9 },
  { city: 'Amsterdam', year: 2025, visitors: 9200000, change: 11.3 }
];

// Mock cultural diversity data
export const getMockCulturalDiversity = () => [
  { metric: 'Cuisine Variety', score: 85, maxScore: 100 },
  { metric: 'Language Support', score: 72, maxScore: 100 },
  { metric: 'Cultural Events', score: 78, maxScore: 100 },
  { metric: 'LGBTQ+ Friendly', score: 92, maxScore: 100 },
  { metric: 'Religious Diversity', score: 68, maxScore: 100 }
];

// Environmental quality data for major cities by country
const COUNTRY_ENVIRONMENTAL_DATA: Record<string, Array<{city: string, aqi: number, greenSpacePct: number, waterQuality: number, overallScore: number}>> = {
  'United States': [
    { city: 'New York', aqi: 35, greenSpacePct: 27, waterQuality: 85, overallScore: 73 },
    { city: 'Los Angeles', aqi: 45, greenSpacePct: 15, waterQuality: 78, overallScore: 65 },
    { city: 'Chicago', aqi: 32, greenSpacePct: 25, waterQuality: 82, overallScore: 71 },
    { city: 'San Francisco', aqi: 28, greenSpacePct: 20, waterQuality: 88, overallScore: 75 },
    { city: 'Seattle', aqi: 22, greenSpacePct: 35, waterQuality: 92, overallScore: 80 },
    { city: 'Miami', aqi: 38, greenSpacePct: 18, waterQuality: 79, overallScore: 68 },
    { city: 'Denver', aqi: 25, greenSpacePct: 30, waterQuality: 90, overallScore: 78 },
    { city: 'Boston', aqi: 29, greenSpacePct: 22, waterQuality: 86, overallScore: 74 }
  ],
  'Japan': [
    { city: 'Tokyo', aqi: 22, greenSpacePct: 24, waterQuality: 89, overallScore: 78 },
    { city: 'Osaka', aqi: 26, greenSpacePct: 20, waterQuality: 87, overallScore: 75 },
    { city: 'Kyoto', aqi: 18, greenSpacePct: 42, waterQuality: 91, overallScore: 82 },
    { city: 'Sapporo', aqi: 15, greenSpacePct: 38, waterQuality: 94, overallScore: 85 },
    { city: 'Yokohama', aqi: 24, greenSpacePct: 22, waterQuality: 88, overallScore: 77 },
    { city: 'Hiroshima', aqi: 19, greenSpacePct: 35, waterQuality: 90, overallScore: 81 },
    { city: 'Fukuoka', aqi: 21, greenSpacePct: 28, waterQuality: 89, overallScore: 79 },
    { city: 'Sendai', aqi: 16, greenSpacePct: 40, waterQuality: 93, overallScore: 84 }
  ],
  'United Kingdom': [
    { city: 'London', aqi: 31, greenSpacePct: 33, waterQuality: 83, overallScore: 72 },
    { city: 'Edinburgh', aqi: 20, greenSpacePct: 45, waterQuality: 91, overallScore: 82 },
    { city: 'Manchester', aqi: 28, greenSpacePct: 28, waterQuality: 85, overallScore: 74 },
    { city: 'Liverpool', aqi: 27, greenSpacePct: 30, waterQuality: 84, overallScore: 75 },
    { city: 'Birmingham', aqi: 33, greenSpacePct: 25, waterQuality: 81, overallScore: 70 },
    { city: 'Bristol', aqi: 24, greenSpacePct: 37, waterQuality: 87, overallScore: 78 },
    { city: 'Glasgow', aqi: 22, greenSpacePct: 42, waterQuality: 89, overallScore: 81 },
    { city: 'Brighton', aqi: 26, greenSpacePct: 32, waterQuality: 86, overallScore: 76 }
  ],
  'Canada': [
    { city: 'Toronto', aqi: 20, greenSpacePct: 35, waterQuality: 92, overallScore: 82 },
    { city: 'Vancouver', aqi: 18, greenSpacePct: 42, waterQuality: 95, overallScore: 85 },
    { city: 'Montreal', aqi: 22, greenSpacePct: 38, waterQuality: 89, overallScore: 80 },
    { city: 'Calgary', aqi: 16, greenSpacePct: 40, waterQuality: 93, overallScore: 84 },
    { city: 'Ottawa', aqi: 19, greenSpacePct: 45, waterQuality: 91, overallScore: 83 },
    { city: 'Edmonton', aqi: 17, greenSpacePct: 37, waterQuality: 90, overallScore: 81 },
    { city: 'Winnipeg', aqi: 21, greenSpacePct: 33, waterQuality: 88, overallScore: 78 },
    { city: 'Quebec City', aqi: 15, greenSpacePct: 48, waterQuality: 94, overallScore: 86 }
  ],
  'Australia': [
    { city: 'Sydney', aqi: 18, greenSpacePct: 46, waterQuality: 92, overallScore: 82 },
    { city: 'Melbourne', aqi: 21, greenSpacePct: 41, waterQuality: 90, overallScore: 80 },
    { city: 'Brisbane', aqi: 23, greenSpacePct: 38, waterQuality: 88, overallScore: 78 },
    { city: 'Perth', aqi: 19, greenSpacePct: 43, waterQuality: 91, overallScore: 81 },
    { city: 'Adelaide', aqi: 20, greenSpacePct: 40, waterQuality: 89, overallScore: 79 },
    { city: 'Canberra', aqi: 15, greenSpacePct: 50, waterQuality: 95, overallScore: 87 },
    { city: 'Gold Coast', aqi: 22, greenSpacePct: 35, waterQuality: 87, overallScore: 77 },
    { city: 'Darwin', aqi: 12, greenSpacePct: 52, waterQuality: 93, overallScore: 89 }
  ]
};

// Environmental quality data for major cities in the selected country
export const getEnvironmentalQualityForCity = (selectedCity: string, selectedCountry: string, envScore?: number) => {
  const environmentScore = envScore || 72;
  
  // Get cities for the selected country, fallback to global cities if country not found
  let countryData = COUNTRY_ENVIRONMENTAL_DATA[selectedCountry];
  
  if (!countryData) {
    // Fallback to global cities if country not found
    countryData = [
      { city: 'Singapore', aqi: 15, greenSpacePct: 47, waterQuality: 95, overallScore: 85 },
      { city: 'Sydney', aqi: 18, greenSpacePct: 46, waterQuality: 92, overallScore: 82 },
      { city: 'Tokyo', aqi: 22, greenSpacePct: 24, waterQuality: 89, overallScore: 78 },
      { city: 'Amsterdam', aqi: 16, greenSpacePct: 43, waterQuality: 88, overallScore: 77 },
      { city: 'Seoul', aqi: 28, greenSpacePct: 34, waterQuality: 85, overallScore: 75 },
      { city: 'Barcelona', aqi: 26, greenSpacePct: 35, waterQuality: 84, overallScore: 74 },
      { city: 'Bangkok', aqi: 42, greenSpacePct: 22, waterQuality: 76, overallScore: 65 },
      { city: 'Global Average', aqi: 25, greenSpacePct: 28, waterQuality: 89, overallScore: environmentScore }
    ];
  }
  
  // If the selected city is in the data, adjust its score to match the KPI
  const adjustedData = countryData.map(cityData => {
    if (cityData.city === selectedCity) {
      return { ...cityData, overallScore: environmentScore };
    }
    return cityData;
  });
  
  return adjustedData;
};

// Generate consistent safety breakdown data based on current safety score
export const generateSafetyBreakdown = (safetyScore: number) => {
  // Higher safety score = more "Very Safe" and "Safe" categories
  if (safetyScore >= 80) {
    return [
      { category: 'Very Safe', score: 4500, percentage: 45.0 },
      { category: 'Safe', score: 3200, percentage: 32.0 },
      { category: 'Moderate', score: 1500, percentage: 15.0 },
      { category: 'Caution', score: 600, percentage: 6.0 },
      { category: 'High Risk', score: 200, percentage: 2.0 }
    ];
  } else if (safetyScore >= 70) {
    return [
      { category: 'Very Safe', score: 3500, percentage: 35.0 },
      { category: 'Safe', score: 3200, percentage: 32.0 },
      { category: 'Moderate', score: 2000, percentage: 20.0 },
      { category: 'Caution', score: 900, percentage: 9.0 },
      { category: 'High Risk', score: 400, percentage: 4.0 }
    ];
  } else if (safetyScore >= 60) {
    return [
      { category: 'Very Safe', score: 2500, percentage: 25.0 },
      { category: 'Safe', score: 3000, percentage: 30.0 },
      { category: 'Moderate', score: 2500, percentage: 25.0 },
      { category: 'Caution', score: 1500, percentage: 15.0 },
      { category: 'High Risk', score: 500, percentage: 5.0 }
    ];
  } else {
    return [
      { category: 'Very Safe', score: 1500, percentage: 15.0 },
      { category: 'Safe', score: 2000, percentage: 20.0 },
      { category: 'Moderate', score: 3000, percentage: 30.0 },
      { category: 'Caution', score: 2500, percentage: 25.0 },
      { category: 'High Risk', score: 1000, percentage: 10.0 }
    ];
  }
};