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
  workingWorldMapSpec,
  fallbackWorldMapSpec,
  simpleWorldMapSpec,
  altWorldMapSpec,
  staticWorldMapSpec,
  costTimelineChartSpec,
  safetyComparisonBarChartSpec,
  visitorFlowSeasonalChartSpec,
  reviewsDistributionPieSpec,
  smallDestinationMapSpec,
  culturalDiversityBarSpec,
  environmentalQualityBarSpec
} from './travelVegaSpecs';

// Dynamically import VegaLite to avoid SSR issues
const VegaLite = dynamic(() => import('react-vega').then(mod => ({ default: mod.VegaLite })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading map...</div>
});

// Memoized VegaLite wrapper
const MemoizedVegaLite = React.memo(({ spec, actions = false, signalListeners, style, renderer }: any) => {
  return <VegaLite spec={spec} actions={actions} signalListeners={signalListeners} style={style} renderer={renderer} />;
});

interface Dashboard4Props {
  onInteraction?: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => void;
}

const Dashboard4: React.FC<Dashboard4Props> = ({ onInteraction }) => {
  // Dashboard filter state
  const [dashboardFilters, setDashboardFilters] = useState<TravelDashboardFilters>({
    selectedCountry: 'Japan',
    selectedCity: 'Tokyo',
    selectedYear: 2025,
    selectedMonth: 6,
    selectedRegion: 'Asia'
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

  // Handle country/destination clicks
  const handleDestinationClick = (name: string, value: any) => {
    console.log('Click event received:', { name, value });
    
    // Try different possible paths to get the country name
    let countryName = null;
    
    if (value && value.datum) {
      // Try the new countryName field we created, then fallback to other options
      countryName = value.datum.countryName || 
                    value.datum.properties?.NAME || 
                    value.datum.properties?.NAME_EN || 
                    value.datum.properties?.name || 
                    value.datum.properties?.country ||
                    value.datum.NAME ||
                    value.datum.name;
                    
      console.log('Extracted country name:', countryName);
      console.log('Full datum:', value.datum);
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
      <div className="grid grid-cols-8 grid-rows-8 gap-4" style={{ gridTemplateRows: '100px 330px 330px repeat(3, 110px)'}}>
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
                  spec={smallDestinationMapSpec(dashboardFilters.selectedCountry)} 
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
            (Click to filter dashboard)
          </div>
          
          {/* Map Content */}
          <div 
            className="absolute top-2 left-12 right-5 bottom-5" 
            title='Click outside to reset selection'
          >
            <MemoizedVegaLite 
              spec={fallbackWorldMapSpec()}
              actions={false}
              renderer='svg'
              style={{width: '100%', height: '100%'}}
              signalListeners={{
                clicked: handleDestinationClick
              }}
            />
          </div>
        </div>

        {/* City Detail Map - Similar to LSOA Map */}
        <div className="col-span-3 row-span-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200 relative">
          <div className="absolute top-4 left-5 right-5 flex flex-col justify-between">
            <div className="text-sm font-semibold" style={{color: '#2B7A9B'}}>
              CITY DETAIL MAP | {dashboardFilters.selectedCity || 'Select Country'}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              (Click districts to filter)
            </div>
          </div>
          
          {/* Map Content */}
          <div 
            className="absolute top-2 left-12 right-5 bottom-5" 
            title='Select a country from world map first'
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🏙️</div>
                <div className="text-sm">
                  {dashboardFilters.selectedCity ? 
                    `${dashboardFilters.selectedCity} Districts` : 
                    'Select a country first'
                  }
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Click areas for details
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Population Growth & Projections equivalent - Travel Trends */}
        <div className="col-span-2 row-span-1 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">
              Travel Growth Trends
            </div>
          </div>
          <div className="h-[280px]">
            {/* Mock visitor growth data */}
            <div className="text-center text-gray-500 flex items-center justify-center h-full">
              <div>
                <div className="text-2xl mb-2">📈</div>
                <div className="text-sm">Visitor Growth</div>
                <div className="text-xs">{dashboardFilters.selectedCity}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row */}
        {/* Cost Timeline - Line Chart */}
        <div className="col-span-3 row-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">
              Cost Timeline - {dashboardFilters.selectedCity}
            </div>
            <div className="flex gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                <span>Mean</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                <span>Median</span>
              </div>
            </div>
          </div>
          <div className="h-[180px]">
            {costTimelineData.length > 0 && (
              <MemoizedVegaLite 
                spec={costTimelineChartSpec(costTimelineData)}
                actions={false}
                style={{width: '100%', height: '100%'}}
              />
            )}
          </div>
        </div>

        {/* Visitor Flow Timeline - Line Chart */}
        <div className="col-span-3 row-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">
              Visitor Flow Timeline - {dashboardFilters.selectedCity}
            </div>
            <button className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">
              + Add
            </button>
          </div>
          <div className="h-[180px]">
            {visitorFlowData.length > 0 && (
              <MemoizedVegaLite 
                spec={visitorFlowSeasonalChartSpec(visitorFlowData)}
                actions={false}
                style={{width: '100%', height: '100%'}}
              />
            )}
          </div>
        </div>

        {/* Travel Categories - Donut Chart */}
        <div className="col-span-2 row-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
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
          <div className="h-[180px]">
            <MemoizedVegaLite 
              spec={reviewsDistributionPieSpec(mockReviewsDistribution)}
              actions={false}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        </div>

        {/* Fourth Row */}        
        {/* Safety Distribution - Donut Chart */}
        <div className="col-span-2 row-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
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
          <div className="h-[180px]">
            <MemoizedVegaLite 
              spec={reviewsDistributionPieSpec([
                { rating: 'Very Safe', count: 8500, percentage: 42.5 },
                { rating: 'Safe', count: 6200, percentage: 31.0 },
                { rating: 'Moderate', count: 3400, percentage: 17.0 },
                { rating: 'Caution', count: 1500, percentage: 7.5 },
                { rating: 'High Risk', count: 400, percentage: 2.0 }
              ])}
              actions={false}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        </div>

        {/* Cultural Attractions - Bar Chart */}
        <div className="col-span-3 row-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
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

        {/* Environmental Metrics - Stacked Bar */}
        <div className="col-span-3 row-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">
              Environmental Quality - {dashboardFilters.selectedCity}
            </div>
            <div className="flex gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span>AQI</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span>Green</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                <span>Water</span>
              </div>
            </div>
          </div>
          <div className="h-[180px]">
            <MemoizedVegaLite 
              spec={environmentalQualityBarSpec([
                mockEnvironmentalQuality.find(d => d.city === dashboardFilters.selectedCity) || mockEnvironmentalQuality[0]
              ])}
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