'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReusableNode from '../../components/ReusableNode';
import ReusableGrid from '../../components/ReusableGrid';
import dynamic from 'next/dynamic';

// Import travel data utilities and types
import {
  generateMockCostData,
  generateMockSafetyData,
  generateMockFlowData,
  generateMockReviewsData,
  getCostTimelineForDestination,
  getSafetyComparisonByRegion,
  getVisitorFlowForDestination,
  getDestinationMetrics,
  getMockReviewsDistribution,
  getMockTravelGrowthDataByCountryYear,
  getMockTravelGrowthData,
  getMockCulturalDiversity,
  getEnvironmentalQualityForCity,
  generateSafetyBreakdown,
  TRAVEL_DESTINATIONS
} from '../travel/travelDataUtils';

import {
  TravelDashboardFilters,
  TravelCostData,
  TravelSafetyData,
  TravelFlowData,
  TravelReviewsData,
  DestinationMetrics,
  CostTimelineData,
  SafetyComparisonData,
  VisitorFlowSeasonalData
} from '../travel/travelDataTypes';

// Import Vega specs
import {
  worldTravelMapSpec,
  countryDetailMapSpec,
  reviewsDistributionPieSpec,
  visitorFlowSeasonalChartSpec,
  safetyBreakdownPieSpec,
  safetyComparisonBarChartSpec,
  environmentalQualityScatterSpec,
  culturalDiversityBarSpec,
  travelGrowthTrendsSpec
} from '../travel/travelVegaSpecs';

// Import new SpecCreator for chart templates
import { SpecCreator } from '../../vegaTemplates/SpecCreator';

// Dynamically import CountryDetailMap component
// const CountryDetailMap = dynamic(() => import('../travel/CountryDetailMap'), {
//   ssr: false,
//   loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading country map...</div>
// });

interface Travel2Props {
  onInteraction?: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => void;
}

const Travel2Page: React.FC<Travel2Props> = ({ onInteraction }) => {
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
  const updateDashboardFilter = (key: string, value: any) => {
    setDashboardFilters((prev: TravelDashboardFilters) => ({ ...prev, [key]: value }));
    
    // Log interaction
    if (onInteraction) {
      onInteraction('travel-filter', 'Travel Filter', 'filter', 'filter_change', {
        filterKey: key,
        filterValue: value,
        description: `Changed ${String(key)} to ${value}`
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
      const destination = TRAVEL_DESTINATIONS.find((d: any) => d.country === countryName);
      
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

  // Get all mock data from utility functions
  const mockReviewsDistribution = getMockReviewsDistribution();
  const mockTravelGrowthDataByCountryYear = getMockTravelGrowthDataByCountryYear();
  const mockTravelGrowthData = getMockTravelGrowthData();
  const mockCulturalDiversity = getMockCulturalDiversity();
  const currentSafetyScore = Math.round(currentDestinationMetrics?.safetyScore || 78);
  const safetyBreakdownData = generateSafetyBreakdown(currentSafetyScore);
  const mockEnvironmentalQuality = getEnvironmentalQualityForCity(
    dashboardFilters.selectedCity, 
    dashboardFilters.selectedCountry,
    currentDestinationMetrics?.environmentScore
  );

  // Year filter options for dropdowns
  const yearFilterOptions = [
    { label: '2023', value: 2023, displayName: '2023' },
    { label: '2024', value: 2024, displayName: '2024' },
    { label: '2025', value: 2025, displayName: '2025' }
  ];

  // Helper function to create cost timeline chart using new template system
  const createCostTimelineSpec = (data: CostTimelineData[]) => {
    if (!data.length) return null;

    const transformedData = SpecCreator.transformCostTimelineData(data);
    
    return SpecCreator.create({
      type: 'line',
      subtype: 'multiLineLabelSpec',
      data: transformedData,
      config: {
        dimensions: { width: 340, height: 160 },
        fields: { 
          x: 'date', 
          y: 'cost', 
          series: 'series'
        },
        styling: {
          colors: ['#aea630ff', '#3b82f6', '#16a34a'],
          background: 'transparent',
          axes: {
            xAxis: {
              labelColor: '#888',
              titleColor: '#888',
              labelFontSize: 8,
              labelAngle: -45,
              grid: false,
              ticks: true,
              domain: true,
              title: null,
              format: '%Y-%m'
            },
            yAxis: {
              labelColor: '#888',
              titleColor: '#888',
              labelFontSize: 8,
              gridColor: '#888',
              gridDash: [2, 2],
              grid: true,
              ticks: true,
              domain: true,
              title: null,
              format: '$,.0f'
            }
          }
        },
        legend: {
          title: null,
          labelFontSize: 10,
          symbolSize: 80,
          orient: 'right',
          padding: 10,
          offset: 0,
          symbolType: 'circle'
        },
        interactions: {
          labels: true
        }
      }
    });
  };

  return (
    <ReusableGrid 
      config="travel-dashboard"
      isLoading={isLoading}
      loadingState={
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading travel data...</p>
        </div>
      }
    >
      {/* KPI Row - Top 6 Cards */}
      
      {/* Cost Index KPI */}
      <ReusableNode
        size="xsmall"
        chartType="kpi"
        title="Cost Index"
        kpiValue={currentDestinationMetrics?.avgCostIndex || 85}
        kpiUnit="vs Global Avg"
        kpiTrend="positive"
      />

      {/* Safety Score KPI */}
      <ReusableNode
        size="xsmall"
        chartType="kpi"
        title="Safety Score"
        kpiValue={currentSafetyScore}
        kpiUnit="out of 100"
        kpiIcon="✓"
      />

      {/* Visa Access KPI */}
      <ReusableNode
        size="xsmall"
        chartType="kpi"
        title="Visa Access"
        kpiValue={currentDestinationMetrics?.visaFreeAccess || 67}
        kpiUnit="countries"
      />

      {/* Review Score KPI */}
      <ReusableNode
        size="xsmall"
        chartType="kpi"
        title="Review Score"
        kpiValue={currentDestinationMetrics?.avgReviewScore || 4.3}
        kpiUnit="/ 5.0 stars"
        kpiIcon={
          <div className="flex">
            {[1,2,3,4,5].map(star => (
              <span key={star} className={`text-[8px] ${star <= Math.round(currentDestinationMetrics?.avgReviewScore || 4.3) ? 'text-yellow-400' : 'text-gray-300'}`}>
                ★
              </span>
            ))}
          </div>
        }
      />

      {/* Visitor Flow KPI */}
      <ReusableNode
        size="small"
        chartType="kpi"
        title="Annual Visitor Flow"
        kpiValue={currentDestinationMetrics ? 
          `${(currentDestinationMetrics.totalVisitorFlow / 1000000).toFixed(1)}M` : 
          '12.3M'
        }
        kpiUnit="international arrivals"
        secondaryMetric={{
          value: dashboardFilters.selectedCity,
          label: `Peak: ${dashboardFilters.selectedMonth === 6 ? 'Jun' : 'Jul'}`
        }}
      />

      {/* Environmental Score KPI */}
      <ReusableNode
        size="small"
        chartType="kpi"
        title="Environmental Quality"
        kpiValue={currentDestinationMetrics?.environmentScore || 72}
        kpiUnit="composite score"
        secondaryMetric={{
          value: 'AQI • Green Space',
          label: 'Water Quality'
        }}
      />

      {/* World Map */}
      <ReusableNode
        size="xlarge"
        chartType="vega"
        title="WORLD TRAVEL MAP"
        subtitle="(Pan, zoom & click countries)"
        vegaSpec={worldTravelMapSpec()}
        vegaRenderer="svg"
        chartPosition="full"
        signalListeners={{
          clicked_country: handleDestinationClick
        }}
        tooltipText="Pan and zoom the map, click countries to select"
      />

      {/* Country Detail Map */}
      <ReusableNode
        size="xlarge"
        chartType="custom"
        title={`COUNTRY DETAIL MAP | ${dashboardFilters.selectedCountry || 'Select Country'}`}
        subtitle="(Click cities for details)"
        chartPosition="full"
        dataCondition={!!dashboardFilters.selectedCountry}
        fallbackContent={
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="text-4xl mb-4">🗺️</div>
            <div className="text-lg font-medium">Select a Country</div>
            <div className="text-sm">Click any country on the world map to see its major cities and travel information</div>
          </div>
        }
      >
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <div className="text-2xl mb-2">🏙️</div>
          <div className="text-sm font-medium">{dashboardFilters.selectedCity}</div>
          <div className="text-xs">{dashboardFilters.selectedCountry}</div>
          <div className="text-xs mt-2 bg-blue-100 px-2 py-1 rounded text-blue-600">
            Country Detail Map Placeholder
          </div>
        </div>
      </ReusableNode>

      {/* Travel Growth Trends */}
      <ReusableNode
        size="tall"
        chartType="vega-lite"
        title="Travel Growth Trends"
        description={`Annual visitor count for top cities in ${dashboardFilters.selectedCountry}`}
        vegaSpec={travelGrowthTrendsSpec(
          mockTravelGrowthDataByCountryYear[dashboardFilters.selectedCountry]?.[dashboardFilters.selectedYear] || 
          mockTravelGrowthData.filter((d: any) => d.year === dashboardFilters.selectedYear)
        )}
        chartPosition="bottom-0-right-4"
        hasFieldFilter={true}
        fieldFilterKey="selectedYear"
        filterOptions={yearFilterOptions}
        selectedFilter={dashboardFilters.selectedYear}
        onFilterChange={updateDashboardFilter}
      />

      {/* Cost Timeline */}
      <ReusableNode
        size="xlarge"
        chartType="vega-lite"
        title={`Cost Timeline - ${dashboardFilters.selectedCity}`}
        description="Monthly average costs for hotel, meals, and transport (in USD)"
        vegaSpec={createCostTimelineSpec(costTimelineData)}
        chartData={costTimelineData}
        dataCondition={costTimelineData.length > 0}
        chartPosition="left-4-bottom-0"
      />

      {/* Travel Categories */}
      <ReusableNode
        size="medium"
        chartType="vega-lite"
        title={`Travel Categories - ${dashboardFilters.selectedCity}`}
        vegaSpec={reviewsDistributionPieSpec(mockReviewsDistribution)}
        chartPosition="left-6-bottom-0"
        hasFieldFilter={false}
        fieldFilterKey="selectedYear"
        filterOptions={yearFilterOptions}
        selectedFilter={dashboardFilters.selectedYear}
        onFilterChange={updateDashboardFilter}
      />

      {/* Visitor Flow Timeline */}
      <ReusableNode
        size="xlarge"
        chartType="vega-lite"
        title={`Visitor Flow Timeline - ${dashboardFilters.selectedCity}`}
        description={`Seasonal trends for visitor arrivals in ${dashboardFilters.selectedCity}`}
        vegaSpec={visitorFlowData.length > 0 ? visitorFlowSeasonalChartSpec(visitorFlowData).spec : null}
        chartData={visitorFlowData}
        dataCondition={visitorFlowData.length > 0}
        chartPosition="left-4-bottom-0"
        showMeanValue={true}
      />

      {/* Safety Breakdown */}
      <ReusableNode
        size="medium"
        chartType="vega-lite"
        title={`Safety Breakdown - ${dashboardFilters.selectedCity}`}
        vegaSpec={safetyBreakdownPieSpec(safetyBreakdownData)}
        chartPosition="left-6-bottom-0"
        hasFieldFilter={false}
        fieldFilterKey="selectedYear"
        filterOptions={yearFilterOptions}
        selectedFilter={dashboardFilters.selectedYear}
        onFilterChange={updateDashboardFilter}
      />

      {/* Safety Distribution - Bar Chart */}
      <ReusableNode
        size="xlarge"
        chartType="vega-lite"
        title={`Safety Breakdown - ${dashboardFilters.selectedCity}`}
        description="Comprehensive safety assessment across multiple categories (0-100 scale)"
        vegaSpec={safetyComparisonBarChartSpec(safetyComparisonData)}
        chartPosition="left-6-bottom-0"
        hasFieldFilter={false}
        fieldFilterKey="selectedYear"
        filterOptions={yearFilterOptions}
        selectedFilter={dashboardFilters.selectedYear}
        onFilterChange={updateDashboardFilter}
      />

      {/* Environmental Metrics */}
      <ReusableNode
        size="xlarge"
        chartType="vega-lite"
        title="Environmental Quality"
        description="Shows how cities compare based on air quality, water quality, and green space to reflect overall living conditions"
        vegaSpec={environmentalQualityScatterSpec(mockEnvironmentalQuality)}
        chartPosition="left-4-bottom-0"
      />

      {/* Cultural Diversity */}
      <ReusableNode
        size="medium"
        chartType="vega-lite"
        title={`Cultural Diversity - ${dashboardFilters.selectedCity}`}
        vegaSpec={culturalDiversityBarSpec(mockCulturalDiversity)}
        // buttons={[{
        //   label: "+ Add",
        //   onClick: () => console.log("Add button clicked"),
        //   style: "text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
        // }]}
        chartPosition="left-4-bottom-0"
      />

    </ReusableGrid>
  );
};

export default Travel2Page;