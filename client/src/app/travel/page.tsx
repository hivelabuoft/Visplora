'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  TravelCostData,
  TravelSafetyData,
  TravelFlowData,
  TravelReviewsData,
  DestinationMetrics,
  CostTimelineData,
  SafetyComparisonData,
  VisitorFlowSeasonalData,
  TravelDashboardFilters
} from './travelDataTypes';
import {
  generateMockCostData,
  generateMockSafetyData,
  generateMockFlowData,
  generateMockReviewsData,
  getCostTimelineForDestination,
  getSafetyComparisonByRegion,
  getVisitorFlowForDestination,
  getDestinationMetrics,
  TRAVEL_DESTINATIONS,
  REGIONS
} from './travelDataUtils';
import {
  worldMapSpec,
  worldTravelMapSpec,
  workingWorldMapSpec,
  fallbackWorldMapSpec,
  simpleWorldMapSpec,
  altWorldMapSpec,
  staticWorldMapSpec,
  costTimelineChartSpec,
  safetyComparisonBarChartSpec,
  visitorFlowSeasonalChartSpec,
  reviewsDistributionPieSpec,
  safetyBreakdownPieSpec,
  travelGrowthTrendsSpec,
  countryDetailMapSpec,
  culturalDiversityBarSpec,
  environmentalQualityBarSpec,
  environmentalQualityScatterSpec
} from './travelVegaSpecs';

// Dynamically import VegaLite and Vega to avoid SSR issues
const VegaLite = dynamic(() => import('react-vega').then(mod => ({ default: mod.VegaLite })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading map...</div>
});

const Vega = dynamic(() => import('react-vega').then(mod => ({ default: mod.Vega })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading map...</div>
});

// Dynamically import CountryDetailMap with SSR disabled
const CountryDetailMap = dynamic(() => import('./CountryDetailMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading country map...</div>
});

// Memoized VegaLite wrapper
const MemoizedVegaLite = React.memo(({ spec, actions = false, signalListeners, style, renderer }: any) => {
  return <VegaLite spec={spec} actions={actions} signalListeners={signalListeners} style={style} renderer={renderer} />;
});

// Memoized Vega wrapper
const MemoizedVega = React.memo(({ spec, actions = false, signalListeners, style, renderer }: any) => {
  return <Vega spec={spec} actions={actions} signalListeners={signalListeners} style={style} renderer={renderer} />;
});

interface Dashboard4Props {
  onInteraction?: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => void;
}

const Dashboard4: React.FC<Dashboard4Props> = ({ onInteraction }) => {
  // Dashboard filter state
  const [dashboardFilters, setDashboardFilters] = useState<TravelDashboardFilters>({
    selectedCountry: 'United States',
    selectedCity: 'New York',
    selectedYear: 2025,
    selectedMonth: 6,
    selectedRegion: 'North America'
  });

  // Data states
  const [costData, setCostData] = useState<TravelCostData[]>([]);
  const [safetyData, setSafetyData] = useState<TravelSafetyData[]>([]);
  const [flowData, setFlowData] = useState<TravelFlowData[]>([]);
  const [reviewsData, setReviewsData] = useState<TravelReviewsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Computed data states
  const [destinationMetrics, setDestinationMetrics] = useState<DestinationMetrics[]>([]);
  const [costTimelineData, setCostTimelineData] = useState<CostTimelineData[]>([]);
  const [safetyComparisonData, setSafetyComparisonData] = useState<SafetyComparisonData[]>([]);
  const [visitorFlowData, setVisitorFlowData] = useState<VisitorFlowSeasonalData[]>([]);

  // Load mock data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Generate all mock data
        const cost = generateMockCostData();
        const safety = generateMockSafetyData();
        const flow = generateMockFlowData();
        const reviews = generateMockReviewsData();
        
        setCostData(cost);
        setSafetyData(safety);
        setFlowData(flow);
        setReviewsData(reviews);
        
        // Compute derived metrics
        const metrics = getDestinationMetrics(cost, safety, flow, reviews);
        setDestinationMetrics(metrics);
        
        const safetyByRegion = getSafetyComparisonByRegion(safety);
        setSafetyComparisonData(safetyByRegion);
        
        console.log(`Loaded travel data: ${cost.length} cost records, ${safety.length} safety records, ${flow.length} flow records, ${reviews.length} review records`);
      } catch (error) {
        console.error('Error loading travel data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Update derived data when filters change
  useEffect(() => {
    if (costData.length > 0) {
      const timeline = getCostTimelineForDestination(costData, dashboardFilters.selectedCity);
      setCostTimelineData(timeline);
    }
    
    if (flowData.length > 0) {
      const seasonal = getVisitorFlowForDestination(flowData, dashboardFilters.selectedCity);
      setVisitorFlowData(seasonal);
    }
  }, [dashboardFilters.selectedCity, costData, flowData]);

  // Update dashboard filter function
  const updateDashboardFilter = (key: keyof TravelDashboardFilters, value: any) => {
    setDashboardFilters(prev => ({ ...prev, [key]: value }));
    
    // Log interaction
    if (onInteraction) {
      onInteraction('travel-filter', 'Travel Filter', 'filter', 'filter_change', {
        filterKey: key,
        filterValue: value,
        description: `Changed ${key} to ${value}`
      });
    }
  };

  // Handle city selection from the country detail map
  const handleCitySelect = (cityName: string, cityData: any) => {
    console.log('City selected:', cityName, cityData);
    updateDashboardFilter('selectedCity', cityName);
    
    if (onInteraction) {
      onInteraction('country-detail-map', 'Country Detail Map', 'map', 'city_select', {
        selectedCity: cityName,
        cityData,
        description: `Selected city: ${cityName}`
      });
    }
  };

  // Handle country/destination clicks
  const handleDestinationClick = (name: string, value: any) => {
    console.log('Click event received:', { name, value });
    
    // For Vega signals, the value is the datum directly
    let countryName = null;
    let countryId = null;
    
    if (value) {
      // Extract country name from lookup transform or fallback to ID
      countryName = value.country_name || value.name || `Country ${value.id}`;
      countryId = value.id;
                    
      console.log('Extracted country name:', countryName);
      console.log('Country ID:', countryId);
      console.log('Full datum:', value);
    }
    
    if (countryName && countryName !== 'Unknown Country') {
      // First check if it's in our predefined destinations
      const destination = TRAVEL_DESTINATIONS.find(d => d.country === countryName);
      
      if (destination) {
        // Use our detailed destination data
        updateDashboardFilter('selectedCountry', destination.country);
        updateDashboardFilter('selectedCity', destination.city);
        updateDashboardFilter('selectedRegion', destination.region);
        
        if (onInteraction) {
          onInteraction('world-map-1', 'World Map', 'map', 'destination_select', {
            selectedCountry: destination.country,
            selectedCity: destination.city,
            description: `Selected destination: ${destination.city}, ${destination.country}`
          });
        }
      } else {
        // For any other country, use generic data
        updateDashboardFilter('selectedCountry', countryName);
        updateDashboardFilter('selectedCity', countryName); // Use country name as city for now
        updateDashboardFilter('selectedRegion', 'Unknown'); // Default region
        
        if (onInteraction) {
          onInteraction('world-map-1', 'World Map', 'map', 'destination_select', {
            selectedCountry: countryName,
            selectedCity: countryName,
            description: `Selected country: ${countryName}`
          });
        }
      }
    } else {
      console.error('Could not extract country name from click event or country unknown');
    }
  };

  // Get current destination metrics
  const currentDestinationMetrics = useMemo(() => {
    return destinationMetrics.find(d => d.city === dashboardFilters.selectedCity) || null;
  }, [destinationMetrics, dashboardFilters.selectedCity]);

  // Mock data for various charts
  const mockReviewsDistribution = [
    { rating: '5 Stars', count: 12500, percentage: 45.2 },
    { rating: '4 Stars', count: 8700, percentage: 31.4 },
    { rating: '3 Stars', count: 4200, percentage: 15.2 },
    { rating: '2 Stars', count: 1800, percentage: 6.5 },
    { rating: '1 Star', count: 450, percentage: 1.7 }
  ];

  // Mock travel growth data for different countries and years
  const mockTravelGrowthDataByCountryYear: Record<string, Record<number, Array<{city: string, year: number, visitors: number, change: number}>>> = {
    'United States': {
      2025: [
        { city: 'New York', year: 2025, visitors: 65800000, change: 8.5 },
        { city: 'Los Angeles', year: 2025, visitors: 50000000, change: 6.2 },
        { city: 'Chicago', year: 2025, visitors: 57800000, change: 4.8 },
        { city: 'San Francisco', year: 2025, visitors: 25800000, change: 12.1 },
        { city: 'Las Vegas', year: 2025, visitors: 42300000, change: 15.3 },
        { city: 'Miami', year: 2025, visitors: 23400000, change: 9.7 },
        { city: 'Washington DC', year: 2025, visitors: 25200000, change: 5.4 },
        { city: 'Boston', year: 2025, visitors: 21800000, change: 7.2 }
      ],
      2024: [
        { city: 'New York', year: 2024, visitors: 60650000, change: 5.2 },
        { city: 'Los Angeles', year: 2024, visitors: 47100000, change: 3.8 },
        { city: 'Chicago', year: 2024, visitors: 55100000, change: 2.1 },
        { city: 'San Francisco', year: 2024, visitors: 23000000, change: 8.9 },
        { city: 'Las Vegas', year: 2024, visitors: 36700000, change: 11.2 },
        { city: 'Miami', year: 2024, visitors: 21300000, change: 6.4 },
        { city: 'Washington DC', year: 2024, visitors: 23900000, change: 2.8 },
        { city: 'Boston', year: 2024, visitors: 20300000, change: 4.6 }
      ],
      2023: [
        { city: 'New York', year: 2023, visitors: 57600000, change: -2.1 },
        { city: 'Los Angeles', year: 2023, visitors: 45400000, change: -1.8 },
        { city: 'Chicago', year: 2023, visitors: 53900000, change: -3.2 },
        { city: 'San Francisco', year: 2023, visitors: 21100000, change: 1.2 },
        { city: 'Las Vegas', year: 2023, visitors: 33000000, change: 7.8 },
        { city: 'Miami', year: 2023, visitors: 20000000, change: 3.1 },
        { city: 'Washington DC', year: 2023, visitors: 23250000, change: -4.5 },
        { city: 'Boston', year: 2023, visitors: 19400000, change: 1.8 }
      ]
    },
    'Japan': {
      2025: [
        { city: 'Tokyo', year: 2025, visitors: 15200000, change: 12.5 },
        { city: 'Osaka', year: 2025, visitors: 11800000, change: 9.8 },
        { city: 'Kyoto', year: 2025, visitors: 55000000, change: 18.2 },
        { city: 'Sapporo', year: 2025, visitors: 15800000, change: 6.3 },
        { city: 'Hiroshima', year: 2025, visitors: 3200000, change: 4.1 },
        { city: 'Nara', year: 2025, visitors: 17200000, change: 11.7 }
      ],
      2024: [
        { city: 'Tokyo', year: 2024, visitors: 13500000, change: 8.2 },
        { city: 'Osaka', year: 2024, visitors: 10750000, change: 6.4 },
        { city: 'Kyoto', year: 2024, visitors: 46500000, change: 14.8 },
        { city: 'Sapporo', year: 2024, visitors: 14850000, change: 3.9 },
        { city: 'Hiroshima', year: 2024, visitors: 3070000, change: 2.1 },
        { city: 'Nara', year: 2024, visitors: 15400000, change: 8.3 }
      ],
      2023: [
        { city: 'Tokyo', year: 2023, visitors: 12480000, change: -5.3 },
        { city: 'Osaka', year: 2023, visitors: 10100000, change: -7.2 },
        { city: 'Kyoto', year: 2023, visitors: 40500000, change: -12.8 },
        { city: 'Sapporo', year: 2023, visitors: 14290000, change: -8.1 },
        { city: 'Hiroshima', year: 2023, visitors: 3006000, change: -4.5 },
        { city: 'Nara', year: 2023, visitors: 14220000, change: -9.6 }
      ]
    },
    'United Kingdom': {
      2025: [
        { city: 'London', year: 2025, visitors: 21200000, change: 7.8 },
        { city: 'Edinburgh', year: 2025, visitors: 4500000, change: 9.2 },
        { city: 'Manchester', year: 2025, visitors: 1400000, change: 5.1 },
        { city: 'Liverpool', year: 2025, visitors: 61800000, change: 12.3 },
        { city: 'Bath', year: 2025, visitors: 6200000, change: 8.7 },
        { city: 'York', year: 2025, visitors: 7100000, change: 6.4 }
      ],
      2024: [
        { city: 'London', year: 2024, visitors: 19650000, change: 4.2 },
        { city: 'Edinburgh', year: 2024, visitors: 4120000, change: 6.8 },
        { city: 'Manchester', year: 2024, visitors: 1330000, change: 2.9 },
        { city: 'Liverpool', year: 2024, visitors: 55000000, change: 8.1 },
        { city: 'Bath', year: 2024, visitors: 5700000, change: 5.3 },
        { city: 'York', year: 2024, visitors: 6680000, change: 3.7 }
      ],
      2023: [
        { city: 'London', year: 2023, visitors: 18860000, change: -8.2 },
        { city: 'Edinburgh', year: 2023, visitors: 3860000, change: -12.3 },
        { city: 'Manchester', year: 2023, visitors: 1292000, change: -15.1 },
        { city: 'Liverpool', year: 2023, visitors: 50870000, change: -18.7 },
        { city: 'Bath', year: 2023, visitors: 5410000, change: -11.8 },
        { city: 'York', year: 2023, visitors: 6440000, change: -9.4 }
      ]
    }
  };

  const mockTravelGrowthData = [
    { city: 'Tokyo', year: 2025, visitors: 15200000, change: 12.5 },
    { city: 'Paris', year: 2025, visitors: 14800000, change: 8.3 },
    { city: 'London', year: 2025, visitors: 13600000, change: 6.7 },
    { city: 'Dubai', year: 2025, visitors: 12300000, change: 15.2 },
    { city: 'Singapore', year: 2025, visitors: 11900000, change: 9.8 },
    { city: 'New York', year: 2025, visitors: 11500000, change: 4.1 },
    { city: 'Barcelona', year: 2025, visitors: 10800000, change: 7.9 },
    { city: 'Amsterdam', year: 2025, visitors: 9200000, change: 11.3 }
  ];

  const mockCulturalDiversity = [
    { metric: 'Cuisine Variety', score: 85, maxScore: 100 },
    { metric: 'Language Support', score: 72, maxScore: 100 },
    { metric: 'Cultural Events', score: 78, maxScore: 100 },
    { metric: 'LGBTQ+ Friendly', score: 92, maxScore: 100 },
    { metric: 'Religious Diversity', score: 68, maxScore: 100 }
  ];

  const mockEnvironmentalQuality = [
    { city: 'Singapore', aqi: 15, greenSpacePct: 47, waterQuality: 95, overallScore: 85 },
    { city: 'Sydney', aqi: 18, greenSpacePct: 46, waterQuality: 92, overallScore: 82 },
    { city: 'Tokyo', aqi: 22, greenSpacePct: 24, waterQuality: 89, overallScore: 78 },
    { city: 'Amsterdam', aqi: 16, greenSpacePct: 43, waterQuality: 88, overallScore: 77 },
    { city: 'Seoul', aqi: 28, greenSpacePct: 34, waterQuality: 85, overallScore: 75 },
    { city: 'Barcelona', aqi: 26, greenSpacePct: 35, waterQuality: 84, overallScore: 74 },
    { city: 'Dubai', aqi: 35, greenSpacePct: 18, waterQuality: 79, overallScore: 68 },
    { city: 'Bangkok', aqi: 42, greenSpacePct: 22, waterQuality: 76, overallScore: 65 }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading travel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="travel-dashboard p-6 rounded-lg text-[#1A3C4A]" style={{
      width: '100%',
      backgroundColor: '#E3F2FA',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Grid Container */}
      <div className="grid grid-cols-8 grid-rows-8 gap-4" style={{ gridTemplateRows: '100px 330px repeat(4, 80px)'}}>
        {/* Top Row - KPI Cards */}
        {/* Average Cost Index */}
        <div className="col-span-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              Cost Index
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {currentDestinationMetrics?.avgCostIndex || 65}
              </div>
              <div className="text-[12px] text-green-600 font-medium">
                vs Global Avg
              </div>
            </div>
            <div className="w-8 h-8">
              {currentDestinationMetrics && (
                <MemoizedVegaLite 
                  spec={countryDetailMapSpec(dashboardFilters.selectedCountry)} 
                  actions={false}
                  style={{width: '100%', height: '100%'}}
                />
              )}
            </div>
          </div>
        </div>

        {/* Global Safety Score */}
        <div className="col-span-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              Safety Score
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {Math.round(currentDestinationMetrics?.safetyScore || 78)}
              </div>
              <div className="text-[12px] text-blue-600 font-medium">
                out of 100
              </div>
            </div>
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-green-600 font-bold">✓</span>
            </div>
          </div>
        </div>

        {/* Visa-Free Access Count */}
        <div className="col-span-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              Visa Access
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {currentDestinationMetrics?.visaFreeAccess || 45}
              </div>
              <div className="text-[12px] text-gray-500 font-medium">
                countries
              </div>
            </div>
          </div>
        </div>

        {/* Average Review Score */}
        <div className="col-span-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              Review Score
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {currentDestinationMetrics?.avgReviewScore || 4.5}
              </div>
              <div className="text-[12px] text-yellow-600 font-medium">
                / 5.0 stars
              </div>
            </div>
            <div className="flex">
              {[1,2,3,4,5].map(star => (
                <span key={star} className={`text-[8px] ${star <= Math.round(currentDestinationMetrics?.avgReviewScore || 4.5) ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Visitor Flow */}
        <div className="col-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              Annual Visitor Flow
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {currentDestinationMetrics ? 
                  `${(currentDestinationMetrics.totalVisitorFlow / 1000000).toFixed(1)}M` : 
                  '12.5M'
                }
              </div>
              <div className="text-[12px] text-orange-600 font-medium">
                international arrivals
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-700">
                {dashboardFilters.selectedCity}
              </div>
              <div className="text-[10px] text-gray-500">
                {dashboardFilters.selectedCountry}
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Score */}
        <div className="col-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              Environmental Quality
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {currentDestinationMetrics?.environmentScore || 72}
              </div>
              <div className="text-[12px] text-green-600 font-medium">
                composite score
              </div>
            </div>
            <div className="flex flex-col text-right text-[9px] text-gray-500">
              <div>AQI • Green Space</div>
              <div>Water Quality</div>
            </div>
          </div>
        </div>

        {/* Second Row */}
        {/* World Map - Similar to London Borough Map */}
        <div className="col-span-3 row-span-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200 relative">
          <div className="absolute top-4 left-5 text-sm font-semibold" style={{color: '#2B7A9B'}}>
            WORLD TRAVEL MAP
          </div>
          <div className="absolute top-4 right-5 text-xs text-gray-400">
            (Pan, zoom & click countries)
          </div>
          
          {/* Map Content */}
          <div 
            className="absolute top-9 left-2 right-2 bottom-2 rounded-lg overflow-hidden" 
            title='Pan and zoom the map, click countries to select'
          >
            <MemoizedVega 
              spec={worldTravelMapSpec()}
              actions={false}
              renderer='svg'
              style={{width: '100%', height: '100%'}}
              signalListeners={{
                clicked_country: handleDestinationClick
              }}
            />
          </div>
        </div>

        {/* Country Detail Map - Shows major cities within selected country */}
        <div className="col-span-3 row-span-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200 relative">
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <div className="text-sm font-semibold" style={{color: '#2B7A9B'}}>
              COUNTRY DETAIL MAP | {dashboardFilters.selectedCountry || 'Select Country'}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              (Click cities for details)
            </div>
          </div>
          
          {/* Map Content */}
          <div 
            className="absolute top-9 left-2 right-2 bottom-2" 
            title='Interactive country map with major cities'
          >
            <div className="h-full">
              {dashboardFilters.selectedCountry && (
                <CountryDetailMap
                  selectedCountry={dashboardFilters.selectedCountry}
                  selectedCity={dashboardFilters.selectedCity}
                  onCitySelect={handleCitySelect}
                />
              )}
              {!dashboardFilters.selectedCountry && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🗺️</div>
                    <div className="text-sm">
                      Select a country to view cities
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Click areas for details
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Population Growth & Projections equivalent - Travel Trends */}
        <div className="relative col-span-2 row-span-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-semibold text-gray-700">
            Travel Growth Trends
          </div>
          <div className="text-xs text-gray-500">
            Annual visitor count for top cities in {dashboardFilters.selectedCountry}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[2023, 2024, 2025].map(year => (
                <button
                  key={year}
                  className={`text-[10px] px-1.5 py-1 rounded ${
                    dashboardFilters.selectedYear === year 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => updateDashboardFilter('selectedYear', year)}
                >
                  {year}
                </button>
              ))}
            </div>
            
            {/* Manual Growth Legend */}
            <div className="flex flex-col items-center">
              <div className="text-[9px] text-gray-600 font-medium">Growth Rate (%)</div>
              <div className="flex items-center">
                <div 
                  className="w-18 h-2.5 border-1 border-gray-700"
                  style={{
                    background: 'linear-gradient(to right, #94a3b8 10%, #3b82f6 50%, #16a34a 90%)'
                  }}
                ></div>
              </div>
              <div className="flex justify-between w-18 mt-0.5">
                <span className="text-[8px] text-gray-500">0</span>
                <span className="text-[8px] text-gray-500">15</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-4">
            <MemoizedVegaLite 
              spec={travelGrowthTrendsSpec(
                mockTravelGrowthDataByCountryYear[dashboardFilters.selectedCountry]?.[dashboardFilters.selectedYear] || 
                mockTravelGrowthData.filter(d => d.year === dashboardFilters.selectedYear)
              )}
              actions={false}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        </div>

        {/* Third Row */}
        {/* Cost Timeline - Line Chart */}
        <div className="relative col-span-3 row-span-3 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-semibold text-gray-700">
            Cost Timeline - {dashboardFilters.selectedCity}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">
              Monthly average costs for hotel, meals, and transport (in USD)
            </div>
          </div>
          <div className='absolute left-4 bottom-0'>
            {costTimelineData.length > 0 && (
              <MemoizedVegaLite 
                spec={costTimelineChartSpec(costTimelineData)}
                actions={false}
                style={{width: '100%', height: '100%'}}
              />
            )}
          </div>
        </div>

        {/* Travel Categories - Donut Chart */}
        <div className="relative col-span-2 row-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">
              Travel Categories - {dashboardFilters.selectedCity}
            </div>
            <div className="flex gap-1 text-[10px]">
              <select 
                className="text-[10px] bg-gray-100 rounded px-1"
                value={dashboardFilters.selectedYear}
                onChange={(e) => updateDashboardFilter('selectedYear', parseInt(e.target.value))}
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>
          <div className="absolute left-6 bottom-0">
            <MemoizedVegaLite 
              spec={reviewsDistributionPieSpec(mockReviewsDistribution)}
              actions={false}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        </div>

        {/* Visitor Flow Timeline - Line Chart */}
        <div className="relative col-span-3 row-span-3 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-gray-700">
                Visitor Flow Timeline - {dashboardFilters.selectedCity}
              </div>
              <div className="text-xs text-gray-500">
                Seasonal trends for visitor arrivals in {dashboardFilters.selectedCountry}
              </div>
            </div>
            {/* Mean Display */}
            {visitorFlowData.length > 0 && (() => {
              const meanValue = visitorFlowData.reduce((sum, d) => sum + d.arrivals, 0) / visitorFlowData.length;
              return (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Mean Arrival Count</div>
                  <div className="text-lg font-semibold text-red-600">
                    {meanValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="absolute left-4 bottom-0">
            {visitorFlowData.length > 0 && (() => {
              const { spec } = visitorFlowSeasonalChartSpec(visitorFlowData);
              return (
                <MemoizedVegaLite 
                  spec={spec}
                  actions={false}
                  style={{width: '100%', height: '100%'}}
                />
              );
            })()}
          </div>
        </div>

        {/* Safety Breakdown - Donut Chart */}
        <div className="relative col-span-2 row-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">
              Safety Breakdown - {dashboardFilters.selectedCity}
            </div>
            <div className="flex gap-1 text-[10px]">
              <select 
                className="text-[10px] bg-gray-100 rounded px-1"
                value={dashboardFilters.selectedYear}
                onChange={(e) => updateDashboardFilter('selectedYear', parseInt(e.target.value))}
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>
          <div className="absolute left-6 bottom-0">
            <MemoizedVegaLite 
              spec={safetyBreakdownPieSpec([
                { category: 'Very Safe', score: 8500, percentage: 42.5 },
                { category: 'Safe', score: 6200, percentage: 31.0 },
                { category: 'Moderate', score: 3400, percentage: 17.0 },
                { category: 'Caution', score: 1500, percentage: 7.5 },
                { category: 'High Risk', score: 400, percentage: 2.0 }
              ])}
              actions={false}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        </div>

        {/* Fourth Row */}        
        {/* Safety Distribution - Donut Chart */}
        <div className="relative col-span-3 row-span-3 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">
              Safety Breakdown - {dashboardFilters.selectedCity}
            </div>
            <div className="flex gap-1 text-[10px]">
              <select 
                className="text-[10px] bg-gray-100 rounded px-1"
                value={dashboardFilters.selectedYear}
                onChange={(e) => updateDashboardFilter('selectedYear', parseInt(e.target.value))}
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Comprehensive safety assessment across multiple categories (0-100 scale)
          </div>
          <div className='absolute left-6 bottom-2'>
            <MemoizedVegaLite
              spec={safetyComparisonBarChartSpec(safetyComparisonData)}
              actions={false}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        </div>

        {/* Environmental Metrics - Stacked Bar */}
        <div className="relative col-span-3 row-span-3 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">
              Environmental Quality - {dashboardFilters.selectedCity}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Scores for Air Quality, Green Space, and Water Quality
          </div>
          <div className="absolute left-4 bottom-2">
            <MemoizedVegaLite 
              spec={environmentalQualityScatterSpec(mockEnvironmentalQuality)}
              actions={false}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        </div>
                       

        {/* Cultural Attractions - Bar Chart */}
        <div className="col-span-2 row-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">
              Cultural Attractions - {dashboardFilters.selectedCity}
            </div>
            <button className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">
              + Add
            </button>
          </div>
          <div className="h-[180px]">
            <MemoizedVegaLite 
              spec={culturalDiversityBarSpec(mockCulturalDiversity)}
              actions={false}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard4;