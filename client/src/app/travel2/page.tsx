'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReusableNode from '../../components/ReusableNode';
import ReusableGrid from '../../components/ReusableGrid';

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

import { CLICKABLE_COUNTRIES } from '../travel/travelVegaSpecs';
import { createWorldTravelMapVegaSpec } from '../../vegaTemplates/map/worldInteractiveMapSpec';

import { SpecCreator } from '../../vegaTemplates/SpecCreator';

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

  // Selected countries for the map
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['United States']);

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
      // Update selected countries list (toggle selection)
      setSelectedCountries(prev => {
        const isSelected = prev.includes(countryName);
        if (isSelected) {
          // Remove from selection
          return prev.filter(c => c !== countryName);
        } else {
          // Add to selection (replace current selection for now)
          return [countryName];
        }
      });

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

  // Helper function to create reviews distribution pie chart using template system
  const createReviewsDistributionSpec = (data: any[]) => {
    if (!data.length) return null;
    
    return SpecCreator.create({
      type: 'pie',
      subtype: 'interactivePieSpec',
      data,
      config: {
        dimensions: { width: 120, height: 120 },
        fields: {
          category: 'rating',
          value: 'count'
        },
        styling: {
          colors: ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B'],
          background: 'transparent'
        },
        legend: {
          title: 'Review Ratings',
          orient: 'right',
          titleColor: '#888',
          labelColor: '#888',
          titleFontSize: 11,
          labelFontSize: 10,
          symbolSize: 200,
          offset: 30,
          padding: 0,
          symbolType: 'circle'
        },
        interactions: {
          hover: true
        }
      }
    });
  };

  // Helper function to create safety breakdown pie chart using template system
  const createSafetyBreakdownSpec = (data: any[]) => {
    if (!data.length) return null;
    
    return SpecCreator.create({
      type: 'pie',
      subtype: 'interactivePieSpec',
      data,
      config: {
        dimensions: { width: 120, height: 120 },
        fields: {
          category: 'category',
          value: 'score'
        },
        styling: {
          colors: ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B'],
          background: 'transparent'
        },
        legend: {
          title: 'Safety Levels',
          orient: 'right',
          titleColor: '#888',
          labelColor: '#888',
          titleFontSize: 11,
          labelFontSize: 10,
          symbolSize: 200,
          offset: 30,
          padding: 0,
          symbolType: 'circle'
        },
        interactions: {
          hover: true
        }
      }
    });
  };

  // Helper function to create environmental quality scatter chart using template system
  const createEnvironmentalQualitySpec = (data: any[]) => {
    if (!data.length) return null;
    
    return SpecCreator.create({
      type: 'scatter',
      subtype: 'bubblePlotScatterSpec',
      data,
      config: {
        dimensions: { width: 360, height: 120 },
        fields: {
          x: 'greenSpacePct',
          y: 'waterQuality',
          size: 'overallScore',
          color: 'aqi'
        },
        styling: {
          colors: ['redyellowgreen', 'reverse'],
          background: 'transparent',
          sizeDomain: [40, 100],
          axes: {
            xAxis: {
              labelColor: '#888',
              titleColor: '#888',
              labelFontSize: 8,
              titleFontSize: 10,
              grid: true,
              gridColor: '#888',
              gridDash: [4, 10],
              ticks: true,
              domain: true,
              title: 'Green Space %',
              scale: { domain: [0, 60], nice: true }
            },
            yAxis: {
              labelColor: '#888',
              titleColor: '#888', 
              labelFontSize: 8,
              titleFontSize: 10,
              grid: false,
              gridColor: '#888',
              gridDash: [4, 50],
              ticks: true,
              domain: true,
              title: 'Water Quality Score',
              scale: { domain: [70, 100], nice: true }
            }
          }
        },
        legend: {
          showSize: true,
          sizeTitle: 'Overall Score',
          showColor: true,
          colorTitle: 'Air Quality (Lower AQI = Better)',
          titleColor: '#888',
          labelColor: '#888',
          titleFontSize: 9,
          labelFontSize: 8,
          orient: 'right',
          colorOrient: 'top',
          offset: 15,
          colorOffset: 0
        },
        sizeLegend: {
          sizeTitle: 'Overall Score',
          titleColor: '#888',
          labelColor: '#888',
          titleFontSize: 9,
          labelFontSize: 8,
          orient: 'right',
          values: [40, 60, 80, 100],
          offset: 15
        },
        colorLegend: {
          colorTitle: 'Air Quality (Lower AQI = Better)',
          titleColor: '#888',
          labelColor: '#888',
          titleFontSize: 9,
          labelFontSize: 8,
          colorOrient: 'top',
          colorOffset: 0
        },
        tooltip: {
          fields: [
            { field: 'city', type: 'nominal', title: 'City' },
            { field: 'aqi', type: 'quantitative', title: 'Air Quality Index', format: '.0f' },
            { field: 'greenSpacePct', type: 'quantitative', title: 'Green Space %', format: '.1f' },
            { field: 'waterQuality', type: 'quantitative', title: 'Water Quality Score', format: '.0f' },
            { field: 'overallScore', type: 'quantitative', title: 'Overall Environmental Score', format: '.0f' }
          ]
        },
        interactions: {
          hover: true,
          select: true
        }
      }
    });
  };

  // Helper function to create travel growth trends chart using SpecCreator
  const createTravelGrowthTrendsSpec = (data: any[]) => {
    if (!data.length) return null;
    
    return SpecCreator.create({
      type: 'bar',
      subtype: 'horizontalBarSpec',
      data,
      config: {
        dimensions: { width: 170, height: 200 },
        fields: {
          category: 'city',
          value: 'visitors'
        },
        styling: {
          colors: ['#94a3b8', '#3b82f6', '#16a34a'],
          background: 'transparent',
          axes: {
            xAxis: {
              labelColor: '#888',
              titleColor: '#888',
              labelFontSize: 8,
              grid: true,
              gridColor: '#888',
              gridDash: [2, 2],
              title: 'Annual Visitors (millions)',
              format: '.1s'
            },
            yAxis: {
              labelColor: '#888',
              titleColor: '#888',
              labelFontSize: 10,
              title: null
            }
          }
        },
        legend: {
          title: 'Growth %',
          titleColor: '#888',
          labelColor: '#888',
          titleFontSize: 9,
          labelFontSize: 8,
          offset: 10,
          orient: 'right'
        },
        tooltip: {
          fields: [
            { field: 'city', type: 'nominal', title: 'City' },
            { field: 'visitors', type: 'quantitative', title: 'Visitors', format: '.2s' },
            { field: 'change', type: 'quantitative', title: 'Growth Rate (%)', format: '.1f' },
            { field: 'year', type: 'quantitative', title: 'Year', format: '.0f' }
          ]
        },
        interactions: {
          hover: true,
          select: true
        }
      }
    });
  };

  // Helper function to create world travel map using SpecCreator
  const createWorldTravelMapSpec = () => {
    return createWorldTravelMapVegaSpec({
      width: 800,
      height: 350,
      background: "#7ec2ddff",
      options: { 
        selectableCountries: CLICKABLE_COUNTRIES,
        selectedCountries: selectedCountries
      }
    });
  };

  // Helper function to create visitor flow seasonal chart using template system  
  const createVisitorFlowSeasonalChartSpec = (data: any[]) => {
    if (!data.length) return null;
    
    // Transform data to include both city-specific arrivals (bars) and global average (line)
    const transformedData = data.map(d => ({
      monthName: d.monthName,
      month: d.month,
      season: d.season,
      cityArrivals: d.arrivals, // Bar chart values - city specific
      globalAverage: Math.round(d.arrivals * 0.85 + Math.random() * 0.3 * d.arrivals), // Line chart values - simulated global average
      occupancyRate: d.occupancyRate
    }));

    return SpecCreator.create({
      type: 'multiType',
      subtype: 'barChartWithLineSpec',
      data: transformedData,
      config: {
        dimensions: { width: 350, height: 180 },
        fields: {
          x: 'monthName',
          y: 'cityArrivals',      // Bar field
          series: 'globalAverage', // Line field (using same scale)
          color: 'season'
        },
        styling: {
          colors: ['#94a3b8', '#3b82f6', '#dc2626'], // Season colors
          lineColor: '#ef4444', // Red line for global average
          lineWidth: 3,
          background: 'transparent',
          axes: {
            xAxis: {
              labelColor: '#888',
              titleColor: '#888',
              labelFontSize: 10,
              title: 'Month'
            },
            yAxis: {
              labelColor: '#888',
              titleColor: '#888',
              labelFontSize: 8,
              gridColor: '#888',
              gridDash: [2, 2],
              grid: true,
              format: '.1s',
              title: 'Visitor Arrivals (thousands)'
            }
          }
        },
        legend: {
          title: 'Season',
          orient: 'right',
          titleColor: '#888',
          labelColor: '#888'
        },
        interactions: {
          hover: true
        }
      }
    });
  };

  // Helper function to create safety comparison bar chart using SpecCreator
  const createSafetyComparisonBarChartSpec = (data: any[]) => {
    if (!data.length) return null;
    
    // Transform data to include the required positive and negative fields for diverging bar
    const transformedData = data.map(d => ({
      ...d,
      crimeIndex_positive: d.crimeIndex,
      crimeIndex_negative: d.politicalRisk
    }));
    
    return SpecCreator.create({
      type: 'bar',
      subtype: 'divergingBarSpec',
      data: transformedData,
      config: {
        dimensions: { width: 450, height: 155 },
        fields: {
          category: 'region',
          value: 'crimeIndex',
          positiveLabel: 'Crime Risk',
          negativeLabel: 'Political Risk'
        },
        styling: {
          colors: ['#ef4444', '#f59e0b'],
          background: 'transparent',
          axes: {
            xAxis: {
              labelColor: '#888',
              titleColor: '#888',
              labelFontSize: 8,
              grid: true,
              gridColor: '#888',
              gridDash: [2, 2],
              title: 'Risk Index (Crime ← | → Political)',
              format: '.0f'
            }
          }
        },
        legend: {
          title: null,
          orient: 'top',
          titleColor: '#888',
          labelColor: '#888',
          titleFontSize: 11,
          labelFontSize: 10,
          symbolSize: 150,
          symbolType: 'square'
        },
        tooltip: {
          fields: [
            { field: 'region', type: 'nominal', title: 'Region' },
            { field: 'riskLabel', type: 'nominal', title: 'Risk Type' },
            { field: 'absolute_risk', type: 'quantitative', title: 'Risk Value', format: '.1f' },
            { field: 'overallSafety', type: 'quantitative', title: 'Overall Safety', format: '.0f' }
          ]
        },
        interactions: {
          hover: true,
          select: true
        }
      }
    });
  };

  // Helper function to create cultural diversity bar chart using SpecCreator
  const createCulturalDiversityBarSpec = (data: any[]) => {
    if (!data.length) return null;
    
    // Transform data to add percentage calculation, similar to the original culturalDiversityBarSpec
    const transformedData = data.map(d => ({
      metric: d.metric,
      score: d.score,
      maxScore: d.maxScore,
      percentage: (d.score / d.maxScore) * 100
    }));
    
    console.log('Cultural Diversity Data:', transformedData); // Debug log
    
    // Create a simple horizontal bar chart spec directly to avoid SpecCreator issues
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v6.json' as const,
      width: 200,
      height: 100,
      background: 'transparent',
      data: {
        values: transformedData
      },
      params: [{
        name: 'hover_culture_bar',
        select: {
          type: 'point' as const,
          on: 'pointerover' as const,
          clear: 'pointerout' as const
        }
      }],
      mark: {
        type: 'bar' as const,
        cursor: 'pointer' as const,
        cornerRadiusEnd: 4,
        height: 12
      },
      encoding: {
        y: {
          field: 'metric',
          type: 'nominal' as const,
          sort: {
            field: 'score',
            order: 'descending' as const
          },
          axis: {
            labelColor: '#888',
            titleColor: '#888',
            labelFontSize: 10,
            labelLimit: 120,
            title: null,
            grid: false,
            ticks: true,
            domain: true
          }
        },
        x: {
          field: 'percentage',
          type: 'quantitative' as const,
          scale: {
            domain: [0, 100]
          },
          axis: {
            labelColor: '#888',
            titleColor: '#888',
            labelFontSize: 8,
            grid: true,
            gridColor: '#888',
            gridDash: [2, 2],
            ticks: true,
            domain: true,
            title: null,
            format: '.0f'
          }
        },
        color: {
          value: '#16a34a' // Simple solid color instead of complex scale
        },
        stroke: {
          condition: {
            param: 'hover_culture_bar',
            value: 'transparent'
          },
          value: 'transparent'
        },
        strokeWidth: {
          condition: {
            param: 'hover_culture_bar',
            value: 0
          },
          value: 0
        },
        opacity: {
          condition: {
            param: 'hover_culture_bar',
            value: 1
          },
          value: 0.7
        },
        tooltip: [
          { field: 'metric', type: 'nominal' as const, title: 'Cultural Metric' },
          { field: 'score', type: 'quantitative' as const, title: 'Score', format: '.0f' },
          { field: 'maxScore', type: 'quantitative' as const, title: 'Max Score', format: '.0f' },
        ]
      },
      config: {
        background: 'transparent',
        view: {
          stroke: null
        }
      }
    };
    
    console.log('Generated Cultural Diversity Spec:', spec); // Debug log
    return spec;
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
        subtitle={`Selected countries: {${selectedCountries.join(', ')}}`}
        vegaSpec={createWorldTravelMapSpec()}
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
        vegaSpec={createTravelGrowthTrendsSpec(
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
        vegaSpec={createReviewsDistributionSpec(mockReviewsDistribution)}
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
        vegaSpec={visitorFlowData.length > 0 ? createVisitorFlowSeasonalChartSpec(visitorFlowData) : null}
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
        vegaSpec={createSafetyBreakdownSpec(safetyBreakdownData)}
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
        vegaSpec={createSafetyComparisonBarChartSpec(safetyComparisonData)}
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
        vegaSpec={createEnvironmentalQualitySpec(mockEnvironmentalQuality)}
        chartPosition="left-4-bottom-0"
      />

      {/* Cultural Diversity */}
      <ReusableNode
        size="medium"
        chartType="vega-lite"
        title={`Cultural Diversity - ${dashboardFilters.selectedCity}`}
        vegaSpec={createCulturalDiversityBarSpec(mockCulturalDiversity)}
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