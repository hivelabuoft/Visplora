'use client';

import React, { useState, useEffect } from 'react';
import DashboardPlayground from '../components/DashboardPlayground';
import { LinkableCard } from '@/components/ui/card-linkable';
import { VegaLite } from 'react-vega';
import { boroughIdToName } from './boroughMapping';
import { boroughMapSpec, smallBoroughMapSpec, lsoaMapSpec, populationTimelineChartSpec, incomeTimelineChartSpec, crimeBarChartSpec, crimePieChartSpec } from './vegaSpecs';
import { 
  loadPopulationData, 
  processPopulationData, 
  formatNumber, 
  formatPercentage, 
  formatDensity,
  generatePopulationTimelineData,
  BoroughPopulationMetrics,
  PopulationData,
  PopulationTimelineData
} from './populationData';
import { 
  getIncomeTimelineDataForBorough,
  getCurrentMeanIncome,
  getCurrentMedianIncome,
  formatIncome,
  getIncomeChangePercentage,
  IncomeTimelineData
} from './incomeData';
import { 
  loadCrimeData,
  processBoroughCrimeStats,
  CrimeData,
  BoroughCrimeStats,
  CrimeCategory,
  getTopBoroughsByCategory,
  getBoroughCrimeCategories,
  CRIME_CATEGORY_MAPPING,
  CRIME_CATEGORY_COLORS
} from './crimeData';

// Dashboard 3 - London Numbers Style Dashboard
const Dashboard3: React.FC = () => {
  const [selectedBorough, setSelectedBorough] = useState<string>('Brent');
  const [selectedLSOA, setSelectedLSOA] = useState<string>('');
  const [lsoaDataAvailable, setLsoaDataAvailable] = useState<boolean>(false);
  const [populationMetrics, setPopulationMetrics] = useState<Map<string, BoroughPopulationMetrics>>(new Map());
  const [populationRawData, setPopulationRawData] = useState<PopulationData[]>([]);
  const [isLoadingPopulation, setIsLoadingPopulation] = useState<boolean>(true);
  const [incomeTimelineData, setIncomeTimelineData] = useState<IncomeTimelineData[]>([]);
  
  // Crime-related state
  const [selectedCrimeCategory, setSelectedCrimeCategory] = useState<string>('Anti-social behaviour');
  const [crimeBarData, setCrimeBarData] = useState<Array<{borough: string, count: number}>>([]);
  const [crimePieData, setCrimePieData] = useState<CrimeCategory[]>([]);
  const [crimeRawData, setCrimeRawData] = useState<CrimeData[]>([]);
  const [boroughCrimeStats, setBoroughCrimeStats] = useState<BoroughCrimeStats[]>([]);
  const [isLoadingCrime, setIsLoadingCrime] = useState<boolean>(true);

  // Load population data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingPopulation(true);
      try {
        const data = await loadPopulationData();
        setPopulationRawData(data);
        const metrics = processPopulationData(data);
        setPopulationMetrics(metrics);
      } catch (error) {
        console.error('Error loading population data:', error);
      } finally {
        setIsLoadingPopulation(false);
      }
    };
    
    loadData();
  }, []);

  // Load crime data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingCrime(true);
      try {
        const data = await loadCrimeData();
        setCrimeRawData(data);
        const stats = processBoroughCrimeStats(data);
        setBoroughCrimeStats(stats);
      } catch (error) {
        console.error('Error loading crime data:', error);
      } finally {
        setIsLoadingCrime(false);
      }
    };
    
    loadData();
  }, []);

  // Check if LSOA data is available for the selected borough
  useEffect(() => {
    const checkLsoaData = async () => {
      try {
        // Don't URL encode - use the exact borough name as it appears in file names
        const url = `/data/lsoa-london/${selectedBorough}.json`;
        const response = await fetch(url);
        setLsoaDataAvailable(response.ok);
      } catch (error) {
        console.error('Error checking LSOA data:', error);
        setLsoaDataAvailable(false);
      }
    };
    
    checkLsoaData();
  }, [selectedBorough]);

  // Load income data when selected borough changes
  useEffect(() => {
    const incomeData = getIncomeTimelineDataForBorough(selectedBorough);
    setIncomeTimelineData(incomeData);
  }, [selectedBorough]);

  // Update crime bar chart data when crime category changes
  useEffect(() => {
    if (boroughCrimeStats.length > 0) {
      const topBoroughs = getTopBoroughsByCategory(boroughCrimeStats, selectedCrimeCategory, 10);
      setCrimeBarData(topBoroughs);
    }
  }, [selectedCrimeCategory, boroughCrimeStats]);

  // Update crime pie chart data when selected borough changes
  useEffect(() => {
    if (crimeRawData.length > 0) {
      const categories = getBoroughCrimeCategories(crimeRawData, selectedBorough);
      setCrimePieData(categories);
    }
  }, [selectedBorough, crimeRawData]);

  function handleAddToSidebar(elementId: string, elementName: string, elementType: string): void {
    throw new Error('Not implemented.');
  }

  const handleBoroughClick = (name: string, value: any) => {
    if (value && value.datum && value.datum.id) {
      setSelectedBorough(value.datum.id);
    }
  };

  // Get population metrics for the currently selected borough
  const getCurrentBoroughMetrics = (): BoroughPopulationMetrics | null => {
    return populationMetrics.get(selectedBorough) || null;
  };

  // Calculate total London population from all boroughs
  const getTotalLondonPopulation = (): number => {
    let total = 0;
    populationMetrics.forEach((metrics) => {
      total += metrics.population2023;
    });
    return total;
  };

  const currentMetrics = getCurrentBoroughMetrics();
  const totalLondonPopulation = getTotalLondonPopulation();
  
  // Calculate total crime cases for the selected borough
  const getTotalCrimeCases = (): number => {
    return crimePieData.reduce((total, category) => total + category.count, 0);
  };
  
  const totalCrimeCases = getTotalCrimeCases();
  
  // Generate population timeline data for the selected borough
  const getPopulationTimelineData = (): PopulationTimelineData[] => {
    if (populationRawData.length === 0) return [];
    return generatePopulationTimelineData(populationRawData, selectedBorough);
  };
  
  const populationTimelineData = getPopulationTimelineData();

  return (
    <DashboardPlayground
      isActive={true}
      dashboardTitle="London Numbers Dashboard"
      dashboardType="london-style"
    >
      <div className="london-dashboard p-6 rounded-lg text-white" style={{
        width: '100%',
        backgroundColor: '#0a0a0a',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        
        {/* Header */}
        <div className='flex items-center justify-between mb-4' style={{ borderBottom: '1px solid #333' }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '300',
              letterSpacing: '0.1em',
              margin: 0,
              color: '#fff'
            }}>
              LONDON IN <span style={{ 
                background: 'linear-gradient(45deg, #8B5CF6, #A855F7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '600'
              }}>NUMBERS
              </span>
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#888',
              margin: '5px 0 0 0',
              fontWeight: '300'
            }}>
              Data Driven Insights for the Capital City - One Borough at a Time
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#666',
              textAlign: 'right'
            }}>
              Charts based on data from the<br />
              <strong>2023</strong> census, where applicable
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#333',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>💬</div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#333',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>📄</div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#333',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>❓</div>
          </div>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-8 grid-rows-8 gap-4" style={{ gridTemplateRows: '100px repeat(7, 110px)'}}>
          {/* Row 1: KPI Indicators (1x1 each) */}
          <div className="col-span-8 row-span-1 grid grid-cols-6 gap-4">
            {/* Borough Details */}
            <LinkableCard 
              className='text-center p-2 col-span-1 row-span-1 bg-zinc-800 border border-gray-600'
              styles={{}}
              elementId="borough-details"
              elementName="Borough Details"
              elementType="borough"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className='flex items-center justify-center gap-2 h-full'>
                <div className='text-md font-semibold text-white'>
                  {selectedBorough}
                </div>
                <div className='w-[50px] h-[50px]'>
                  <VegaLite 
                    spec={smallBoroughMapSpec(selectedBorough)}
                    actions={false}
                  />
                </div>
              </div>
            </LinkableCard>

            {/* Total Population */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center border border-gray-600"
              styles={{}}
              elementId="total-population"
              elementName="Total Population"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-lg font-bold text-white">
                {isLoadingPopulation ? 'Loading...' : 
                 currentMetrics ? formatNumber(currentMetrics.population2023) : 'N/A'}
              </div>
              <div className="text-xs text-gray-400">Borough Total Population</div>
            </LinkableCard>

            {/* Population Change */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center border border-gray-600"
              styles={{}}
              elementId="population-change"
              elementName="Population Change"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="flex items-center gap-1">
                {isLoadingPopulation ? (
                  <span className="text-lg font-semibold text-white">Loading...</span>
                ) : currentMetrics ? (
                  <>
                    <span className={`text-lg ${currentMetrics.populationChangeFromPrevYearPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {currentMetrics.populationChangeFromPrevYearPercent >= 0 ? '↗' : '↘'}
                    </span>
                    <span className={`text-lg font-semibold ${currentMetrics.populationChangeFromPrevYearPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(currentMetrics.populationChangeFromPrevYearPercent)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-semibold text-white">N/A</span>
                )}
              </div>
              <div className="text-center text-xs text-gray-400">Population Difference from 2022</div>
            </LinkableCard>

            {/* Population Density */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center border border-gray-600"
              styles={{}}
              elementId="population-density"
              elementName="Population Density"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-lg font-bold text-white">
                {isLoadingPopulation ? 'Loading...' : 
                 currentMetrics ? formatDensity(currentMetrics.populationDensityPer10000) : 'N/A'}
              </div>
              <div className="text-center text-xs text-gray-400">Population Density <br />(per 10,000 m²)</div>
            </LinkableCard>

            {/* Mean House Price */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center border border-gray-600"
              styles={{}}
              elementId="mean-house-price"
              elementName="Mean House Price"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-lg font-bold text-white">£516,266</div>
              <div className="text-xs text-gray-400">Mean House Price</div>
            </LinkableCard>

            {/* Mean Household Income */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center border border-gray-600"
              styles={{}}
              elementId="mean-household-income"
              elementName="Mean Household Income"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-lg font-bold text-white">
                {formatIncome(getCurrentMeanIncome(selectedBorough))}
              </div>
              <div className="text-xs text-gray-400">Mean Household Income</div>
            </LinkableCard>
          </div>

          {/* Row 2: Large Map (4x4) + Right Side Charts (2x2 each) */}
          {/* LSOA Level Borough Map */}
          <LinkableCard 
            className="col-start-1 col-end-4 row-start-2 row-end-5 bg-zinc-800 rounded-lg p-5 border border-gray-600 relative"
            styles={{}}
            elementId="lsoa-map"
            elementName="LSOA Level Borough Map"
            elementType="map"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="absolute top-4 left-5 text-sm font-semibold text-white">
              LSOA LEVEL BOROUGH MAP | {selectedBorough.toUpperCase()}
            </div>
            <div className="absolute top-4 right-5 text-xs text-gray-400">
              (Click LSOA to filter)
            </div>
            
            {/* Map Content */}
            <div className="absolute top-10 left-10">
              {lsoaDataAvailable ? (
                <VegaLite 
                  spec={lsoaMapSpec(selectedBorough)} 
                  actions={false}
                  signalListeners={{
                    lsoa_click: (name: string, value: any) => {
                      // Handle LSOA selection
                      if (value && value.datum && value.datum.properties) {
                        const lsoaCode = value.datum.properties.lsoa21cd;
                        const lsoaName = value.datum.properties.lsoa21nm;
                        setSelectedLSOA(lsoaCode);
                        console.log('Selected LSOA:', lsoaName, lsoaCode);
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                />
              ) : (
                /* Fallback content when LSOA data is not available */
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm" 
                     style={{ 
                       background: 'linear-gradient(135deg, #1e1e2e 0%, #2d1b69 50%, #8B5CF6 100%)'
                     }}>
                  <div className="text-center">
                    <div className="mb-2">📍</div>
                    <div>LSOA data for {selectedBorough}</div>
                    <div className="text-xs mt-1">Run conversion script to load data</div>
                    <div className="text-xs mt-2 opacity-75">
                      /public/data/lsoa-london/convert_shapefiles_to_geojson.py
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* LSOA Info */}
            <div className="absolute bottom-4 left-4 text-gray-400">
              { selectedLSOA ? ( 
              <>
              <div className="text-xs text-gray-400">Selected LSOA</div>
              <div className="text-sm font-semibold text-purple-500">
                {selectedLSOA}
              </div>
              </> ) : (
                <></>
              )}
            </div>
          </LinkableCard>

          {/* Middle: Borough Map */}
          <LinkableCard 
            className="col-start-4 col-end-7 row-start-2 row-end-5 bg-zinc-800 rounded-lg p-5 border border-gray-600 relative"
            styles={{}}
            elementId="borough-map"
            elementName="Borough Map"
            elementType="map"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="absolute top-4 left-5 text-sm font-semibold text-white">
              LONDON BOROUGH MAP
            </div>
            <div className="absolute top-4 right-5 text-xs text-gray-400">
              (Click to filter dashboard)
            </div>
            
            {/* Map Content */}
            <div className="absolute top-2 left-12 right-5 bottom-5" title='Click outside to reset selection'>
              <VegaLite 
                spec={boroughMapSpec} 
                actions={false}
                signalListeners={{
                  borough_click: (name: string, value: any) => {                    
                    // Extract the borough ID from the _vgsid_ InternSet
                    if (value && value._vgsid_) {
                      const vgsidArray = Array.from(value._vgsid_);
                      if (vgsidArray.length > 0) {
                        const boroughIndex = vgsidArray[0] as number;
                        const boroughName = boroughIdToName[boroughIndex - 1];
                        if (boroughName) {
                          setSelectedBorough(boroughName);
                        }
                      }
                    }
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>

            {/* Borough Filter */}
            <div className="absolute bottom-4 left-4 text-gray-400">
              <div className="text-xs text-gray-400">Total Population</div>
              <div className="text-xl font-bold text-purple-500">
                {isLoadingPopulation ? 'Loading...' : 
                 totalLondonPopulation > 0 ? 
                   (totalLondonPopulation / 1000000).toFixed(2) + 'M' : 
                   'N/A'}
              </div>
            </div>
          </LinkableCard>

          {/* Bottom Left: Population Growth & Projections */}
          <LinkableCard 
            className="col-start-1 col-end-4 row-start-5 row-end-7 bg-zinc-800 rounded-lg p-4 border border-gray-600 relative overflow-hidden"
            styles={{}}
            elementId="population-growth-projections"
            elementName="Population Growth & Projections"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-sm font-semibold text-white">
              POPULATION GROWTH & PROJECTIONS
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Historical data (1999-2023) and projections (2024-2033) for {selectedBorough}
            </div>
            
            {/* Vega-Lite Bar Chart */}
            <div className="absolute bottom-0 left-4 right-4">
              {isLoadingPopulation ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Loading chart data...
                </div>
              ) : populationTimelineData.length > 0 ? (
                <VegaLite
                  spec={populationTimelineChartSpec(populationTimelineData)}
                  actions={false}
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No data available
                </div>
              )}
            </div>
          </LinkableCard>

          {/* Top Far Right: Borough Crime Stats */}
          <LinkableCard 
            className="col-start-7 col-end-9 row-start-2 row-end-5 bg-zinc-800 rounded-lg p-4 border border-gray-600 flex flex-col"
            styles={{ position: 'relative', zIndex: 1 }}
            elementId="borough-crime-stats"
            elementName="Borough Crime Stats"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-sm font-semibold text-white">
              BOROUGHS WITH MOST CRIME
            </div>
            
            {/* Crime Category Selector */}
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="text-xs text-gray-400 w-full">Selected Crime Type: {selectedCrimeCategory}</div>
              {Object.values(CRIME_CATEGORY_MAPPING).map((category) => {
                const isSelected = selectedCrimeCategory === category;
                const firstLetter = category.charAt(0).toUpperCase();
                
                return (
                  <button
                    key={category}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCrimeCategory(category);
                    }}
                    className={`w-[17px] h-[17px] rounded-full text-[10px] cursor-pointer transition-all duration-200 mb-1 ${
                      isSelected 
                        ? 'bg-purple-600 text-white font-bold' 
                        : 'bg-gray-600 text-gray-300 font-medium hover:bg-gray-500'
                    }`}
                    title={category}
                  >
                    {firstLetter}
                  </button>
                );
              })}
            </div>
            
            {/* Vega-Lite Crime Bar Chart */}
            <div className="">
              {isLoadingCrime ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  Loading crime data...
                </div>
              ) : crimeBarData.length > 0 ? (
                <VegaLite
                  spec={crimeBarChartSpec(crimeBarData, selectedCrimeCategory)}
                  actions={false}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  No crime data available
                </div>
              )}
            </div>
          </LinkableCard>

          {/* Bottom Middle: Mean Income Timeline */}
          <LinkableCard 
            className="col-start-4 col-end-7 row-start-5 row-end-7 bg-zinc-800 rounded-lg p-4 border border-gray-600"
            styles={{}}
            elementId="mean-income-timeline"
            elementName="Mean Income Timeline"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-sm font-semibold text-white">
              INCOME TRENDS OVER TIME
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Mean and median income for {selectedBorough} (1999-2023)
            </div>
            
            {/* Vega-Lite Line Chart */}
            <div className="absolute bottom-0 left-4 right-4">
              {incomeTimelineData.length > 0 ? (
                <VegaLite
                  spec={incomeTimelineChartSpec(incomeTimelineData)}
                  actions={false}
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No income data available
                </div>
              )}
            </div>
          </LinkableCard>
          
          {/* Bottom Right: Crime Categories for Selected Borough */}
          <LinkableCard 
            className="col-start-7 col-end-9 row-start-5 row-end-7 bg-zinc-800 rounded-lg p-4 border border-gray-600"
            styles={{}}
            elementId="borough-crime-categories"
            elementName="Borough Crime Categories"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-sm font-semibold text-white">
              CRIME CATEGORIES
            </div>
            <div className="text-xs text-gray-400">
              Total Cases: {totalCrimeCases.toLocaleString()}
            </div>
            
            {/* Vega-Lite Crime Pie Chart */}
            <div className="absolute bottom-2 left-3 flex-shrink-0">
              {isLoadingCrime ? (
                <div className="flex items-center justify-center h-32 w-32 text-gray-400 text-xs">
                  Loading...
                </div>
              ) : crimePieData.length > 0 ? (
                <VegaLite
                  spec={crimePieChartSpec(crimePieData)}
                  actions={false}
                  style={{}}
                />
              ) : (
                <div className="flex items-center justify-center h-32 w-32 text-gray-400 text-xs">
                  No data
                </div>
              )}
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-2 right-3 text-xs text-gray-400">
              {crimePieData.map((category, index) => (
                <div key={category.name} className="flex items-center gap-1 mb-0.5">
                  <div 
                    className="w-2 h-2 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: CRIME_CATEGORY_COLORS[index] }}
                  ></div>
                  <span className="text-[8px]">{category.name}: {category.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </LinkableCard>

          {/* Row 3: Bottom Charts (2x2 each) */}
          {/* Car Ownership */}
          <LinkableCard 
            className="col-start-1 col-end-3 row-start-7 row-end-9 bg-zinc-800 rounded-lg p-4 border border-gray-600 relative"
            styles={{}}
            elementId="car-ownership"
            elementName="Car Ownership"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-xs font-semibold text-white mb-2">
              CAR OWNERSHIP
            </div>
            <div className="text-xs text-gray-400 mb-4">
              Households with one or more vehicles
            </div>
            
            {/* Gauge Chart */}
            <div className="relative mx-auto overflow-hidden" style={{
              width: '120px',
              height: '60px',
              borderRadius: '120px 120px 0 0',
              border: '12px solid #333',
              borderBottom: 'none'
            }}>
              <div className="absolute bottom-0 left-0 bg-purple-500" style={{
                width: '43.6%',
                height: '12px',
                borderRadius: '6px'
              }}></div>
            </div>
            
            <div className="text-center mt-4">
              <div className="text-2xl font-bold text-purple-500">
                43.6%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                0 25 75 100
              </div>
            </div>
          </LinkableCard>

          {/* Mean House Price Chart */}
          <LinkableCard 
            className="col-start-3 col-end-5 row-start-7 row-end-9 bg-zinc-800 rounded-lg p-4 border border-gray-600"
            styles={{}}
            elementId="mean-house-price-chart"
            elementName="Mean House Price Chart"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-xs font-semibold text-white mb-1">
              MEAN HOUSE PRICE
            </div>
            <div className="text-xs text-gray-400 flex gap-2 mb-4">
              <span>● London</span>
              <span>● National Average</span>
            </div>
            
            {/* Bar Chart Simulation */}
            <div style={{
              height: '80px',
              display: 'flex',
              alignItems: 'end',
              gap: '4px',
              padding: '0 10px'
            }}>
              {[
                { year: '2005', height: '20px' },
                { year: '2007', height: '35px' },
                { year: '2009', height: '25px' },
                { year: '2011', height: '30px' },
                { year: '2013', height: '40px' },
                { year: '2015', height: '50px' },
                { year: '2017', height: '65px' },
                { year: '2019', height: '70px' },
                { year: '2021', height: '60px' },
                { year: '2023', height: '75px' }
              ].map((bar) => (
                <div key={bar.year} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <div style={{
                    width: '100%',
                    height: bar.height,
                    backgroundColor: '#8B5CF6',
                    borderRadius: '2px 2px 0 0'
                  }}></div>
                  <div style={{
                    fontSize: '7px',
                    color: '#888',
                    marginTop: '2px',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'center'
                  }}>
                    {bar.year}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              fontSize: '8px',
              color: '#888',
              textAlign: 'left',
              marginTop: '10px'
            }}>
              £0K £200K £400K
            </div>
          </LinkableCard>

          {/* All Ethnicity Types */}
          <LinkableCard 
            className="col-start-5 col-end-7 row-start-7 row-end-9 bg-zinc-800 rounded-lg p-4 border border-gray-600"
            styles={{}}
            elementId="all-ethnicity-types"
            elementName="All Ethnicity Types"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '10px'
            }}>
              ALL ETHNICITY TYPES
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '10px', color: '#888' }}>Select Chart Type ▼</div>
              <div style={{
                display: 'flex',
                gap: '5px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#8B5CF6',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>△</div>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#333',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>○</div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {[
                { label: 'White', percentage: '62.4%', width: '85%' },
                { label: 'Black', percentage: '15.9%', width: '25%' },
                { label: 'Asian', percentage: '11.1%', width: '18%' },
                { label: 'Mixed', percentage: '5.5%', width: '10%' },
                { label: 'Other', percentage: '5.1%', width: '8%' }
              ].map((item) => (
                <div key={item.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#fff',
                    minWidth: '40px'
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    flex: 1,
                    height: '6px',
                    backgroundColor: '#333',
                    borderRadius: '3px',
                    margin: '0 8px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: item.width,
                      height: '100%',
                      backgroundColor: '#8B5CF6',
                      borderRadius: '3px'
                    }}></div>
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: '#888',
                    minWidth: '35px',
                    textAlign: 'right'
                  }}>
                    {item.percentage}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              fontSize: '8px',
              color: '#888',
              marginTop: '8px'
            }}>
              BAME = Black, Asian & Minority Ethnicity
            </div>
          </LinkableCard>

          {/* Bottom Far Right: Health Level */}
          <LinkableCard 
            className="col-start-7 col-end-9 row-start-7 row-end-9 bg-zinc-800 rounded-lg p-4 border border-gray-600 relative"
            styles={{}}
            elementId="health-level"
            elementName="Health Level"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-xs font-semibold text-white mb-2">
              RECORDED HEALTH LEVEL
            </div>
            <div className="text-xs text-gray-400 mb-4">
              Where respond was classified as Good
            </div>
            
            {/* Gauge Chart Simulation */}
            <div className="relative w-25 h-12 mx-auto overflow-hidden" style={{
              borderRadius: '100px 100px 0 0',
              border: '8px solid #333',
              borderBottom: 'none'
            }}>
              <div className="absolute bottom-0 left-0 h-2 bg-purple-500 rounded"
                style={{ width: '83.9%' }}
              ></div>
            </div>
            
            <div className="text-center mt-2">
              <div className="text-2xl font-bold text-purple-500">
                83.9%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                0 25 75 100
              </div>
            </div>
          </LinkableCard>
        </div>
      </div>
    </DashboardPlayground>
  );
};

export default Dashboard3;
