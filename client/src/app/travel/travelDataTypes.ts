// Travel data types for the Travel Numbers dashboard

export interface TravelCostData {
  country: string;
  city: string;
  year: number;
  month: number;
  hotelPriceUSD: number;
  mealPriceUSD: number;
  transportPassUSD: number;
  costIndex: number;
}

export interface TravelSafetyData {
  country: string;
  city: string;
  year: number;
  crimeIndex: number;
  homicideRatePer100k: number;
  politicalRiskIndex: number;
  healthRiskIndex: number;
  travelAdvisoryLevel: string;
  terrorismRiskIndex: number;
  overallSafetyScore: number;
}

export interface TravelAccessibilityData {
  country: string;
  city: string;
  nearestAirportIATA: string;
  airportTravelTimeMin: number;
  intlFlightFreqWeekly: number;
  visaPolicy: string;
  visaOnArrival: boolean;
  eVisaAvailable: boolean;
  transitScore: number;
  walkScore: number;
  rideshareAvailability: boolean;
}

export interface TravelAttractionsData {
  country: string;
  city: string;
  year: number;
  poiTotal: number;
  museumsCount: number;
  heritageSitesCount: number;
  parksNatureCount: number;
  nightlifeCount: number;
  beachesCount: number;
  attractionDensityPerKm2: number;
  avgAdmissionCostUSD: number;
}

export interface TravelFlowData {
  country: string;
  city: string;
  year: number;
  month: number;
  intlArrivals: number;
  hotelOccupancyRatePct: number;
  peakCrowdingIndex: number;
  season: string;
  eventsFlag: boolean;
}

export interface TravelReviewsData {
  country: string;
  city: string;
  platform: string;
  year: number;
  month: number;
  avgRating: number;
  ratingCount: number;
  ratingStddev: number;
  recentReviewShare90d: number;
  sentimentScore: number;
}

export interface TravelCultureData {
  country: string;
  city: string;
  year: number;
  englishCoveragePct: number;
  languagesServiceable: number;
  cuisineVarietyIndex: number;
  restaurantsPer10k: number;
  festivalsPerYear: number;
  lgbtqFriendlinessIndex: number;
  culturalDiversityIndex: number;
}

export interface TravelEnvironmentData {
  country: string;
  city: string;
  year: number;
  aqiPm25Annual: number;
  no2Annual: number;
  noiseIndex: number;
  greenSpacePct: number;
  waterQualityIndex: number;
  climateRiskScore: number;
}

// Computed/Aggregated data types
export interface DestinationMetrics {
  country: string;
  city?: string;
  avgCostIndex: number;
  safetyScore: number;
  visaFreeAccess: number;
  avgReviewScore: number;
  totalVisitorFlow: number;
  environmentScore: number;
  travelAttractiveness: number; // composite score
}

export interface CostTimelineData {
  year: number;
  month: number;
  date: string;
  avgHotelPrice: number;
  avgMealPrice: number;
  avgTransportCost: number;
  costIndex: number;
  destination: string;
}

export interface SafetyComparisonData {
  region: string;
  crimeIndex: number;
  politicalRisk: number;
  healthRisk: number;
  overallSafety: number;
}

export interface AttractionCategoryData {
  category: string;
  count: number;
  percentage: number;
}

export interface VisitorFlowSeasonalData {
  month: number;
  monthName: string;
  arrivals: number;
  occupancyRate: number;
  season: string;
  destination: string;
}

export interface ReviewsDistributionData {
  ratingBucket: string;
  count: number;
  percentage: number;
  avgSentiment: number;
}

export interface CulturalDiversityData {
  metric: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface EnvironmentalQualityData {
  city: string;
  aqi: number;
  noiseIndex: number;
  greenSpacePct: number;
  waterQuality: number;
  overallScore: number;
}

// Filter states
export interface TravelDashboardFilters {
  selectedCountry: string;
  selectedCity: string;
  selectedYear: number;
  selectedMonth: number;
  selectedRegion: string;
}