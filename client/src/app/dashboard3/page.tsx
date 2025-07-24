'use client';

import React, { useState, useEffect } from 'react';
import DashboardPlayground from '../components/DashboardPlayground';
import { LinkableCard } from '@/components/ui/card-linkable';
import { VegaLite } from 'react-vega';
import { boroughIdToName } from './boroughMapping';
import { boroughMapSpec, smallBoroughMapSpec, populationTimelineChartSpec, incomeTimelineChartSpec, crimeBarChartComparisonSpec, crimePieChartComparisonSpec, countryOfBirthPieChartSpec, schoolEducationFacilitiesSpec, housePriceTimelineChartSpec, ethnicityMinorityGroupsBarChartSpec } from './vegaSpecs';
import LSOAMap from './LSOAMap';
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
  processBoroughCrimeStatsComparison,
  CrimeData,
  BoroughCrimeStats,
  BoroughCrimeStatsComparison,
  CrimeCategory,
  CrimeCategoryComparison,
  getTopBoroughsByCategory,
  getTopBoroughsByCategoryComparison,
  getBoroughCrimeCategories,
  getBoroughCrimeCategoriesComparison,
  CRIME_CATEGORY_MAPPING,
  CRIME_CATEGORY_COLORS,
  SAMPLE_BOROUGH_CRIME_DATA_COMPARISON
} from './crimeData';
import { 
  CountryOfBirthData,
  CountryOfBirthStats,
  CountryOfBirthComparison,
  parseCountryOfBirthCSV,
  getCountryOfBirthStats,
  getCountryOfBirthComparison,
  getAvailableYears
} from './countryOfBirthData';
import { 
  SchoolData,
  BoroughSchoolStats,
  loadSchoolData,
  getBoroughSchoolStats
} from './schoolData';
import { 
  HousePriceData,
  HousePriceTimelineData,
  loadHousePriceData,
  getHousePriceTimelineForBorough,
  formatPrice
} from './housePriceData';
import { 
  EthnicityData,
  BoroughEthnicityStats,
  loadEthnicityData,
  processBoroughEthnicityStats,
  formatPercentage as formatEthnicityPercentage,
  formatNumber as formatEthnicityNumber
} from './ethnicityData';

// Dashboard 3 - London Numbers Style Dashboard
const Dashboard3: React.FC = () => {
  // Dashboard filter state that AI can control
  const [dashboardFilters, setDashboardFilters] = useState({
    selectedBorough: 'Brent',
    selectedCrimeCategory: 'Anti-social behaviour',
    selectedBirthYear: 2023,
    selectedBaseYear: 2004,
    selectedLSOA: ''
  });

  // Update individual filter states when dashboardFilters changes
  useEffect(() => {
    // No need to set individual state since we're using dashboardFilters directly
  }, [dashboardFilters]);

  // AI filter handler
  const handleAIFilters = (filters: any) => {
    const newFilters = { ...dashboardFilters };
    
    if (filters.borough) {
      newFilters.selectedBorough = filters.borough;
    }
    if (filters.crimeCategory) {
      newFilters.selectedCrimeCategory = filters.crimeCategory;
    }
    if (filters.birthYear) {
      newFilters.selectedBirthYear = filters.birthYear;
    }
    if (filters.baseYear) {
      newFilters.selectedBaseYear = filters.baseYear;
    }
    if (filters.lsoa) {
      newFilters.selectedLSOA = filters.lsoa;
    }
    
    setDashboardFilters(newFilters);
  };

  // Update dashboardFilters when individual states change (for manual controls)
  const updateDashboardFilter = (key: string, value: any) => {
    setDashboardFilters(prev => ({ ...prev, [key]: value }));
  };

  const [populationMetrics, setPopulationMetrics] = useState<Map<string, BoroughPopulationMetrics>>(new Map());
  const [populationRawData, setPopulationRawData] = useState<PopulationData[]>([]);
  const [isLoadingPopulation, setIsLoadingPopulation] = useState<boolean>(true);
  const [incomeTimelineData, setIncomeTimelineData] = useState<IncomeTimelineData[]>([]);
  
  // Crime-related state
  const [crimeBarData, setCrimeBarData] = useState<Array<{borough: string, count: number}>>([]);
  const [crimeBarDataComparison, setCrimeBarDataComparison] = useState<Array<{borough: string, count2022: number, count2023: number, change?: number}>>([]);
  const [crimePieData, setCrimePieData] = useState<CrimeCategory[]>([]);
  const [crimePieDataComparison, setCrimePieDataComparison] = useState<CrimeCategoryComparison[]>([]);
  const [crimeRawData, setCrimeRawData] = useState<CrimeData[]>([]);

  // Country of Birth state
  const [countryOfBirthData, setCountryOfBirthData] = useState<CountryOfBirthData[]>([]);
  const [countryOfBirthStats, setCountryOfBirthStats] = useState<CountryOfBirthStats | null>(null);
  const [countryOfBirthComparison, setCountryOfBirthComparison] = useState<CountryOfBirthComparison | null>(null);
  const [birthYears, setBirthYears] = useState<number[]>([]);
  const [isLoadingBirthData, setIsLoadingBirthData] = useState<boolean>(false);
  const [boroughCrimeStats, setBoroughCrimeStats] = useState<BoroughCrimeStats[]>([]);
  const [boroughCrimeStatsComparison, setBoroughCrimeStatsComparison] = useState<BoroughCrimeStatsComparison[]>([]);
  const [isLoadingCrime, setIsLoadingCrime] = useState<boolean>(true);

  // School-related state
  const [schoolData, setSchoolData] = useState<SchoolData[]>([]);
  const [boroughSchoolStats, setBoroughSchoolStats] = useState<BoroughSchoolStats | null>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState<boolean>(true);

  // House price-related state
  const [housePriceData, setHousePriceData] = useState<HousePriceData[]>([]);
  const [housePriceTimelineData, setHousePriceTimelineData] = useState<HousePriceTimelineData[]>([]);
  const [isLoadingHousePrice, setIsLoadingHousePrice] = useState<boolean>(true);

  // Ethnicity-related state
  const [ethnicityData, setEthnicityData] = useState<EthnicityData[]>([]);
  const [boroughEthnicityStats, setBoroughEthnicityStats] = useState<BoroughEthnicityStats | null>(null);
  const [isLoadingEthnicity, setIsLoadingEthnicity] = useState<boolean>(true);

  // Extract individual filter values for easier access
  const selectedBorough = dashboardFilters.selectedBorough;
  const selectedCrimeCategory = dashboardFilters.selectedCrimeCategory;
  const selectedBirthYear = dashboardFilters.selectedBirthYear;
  const selectedBaseYear = dashboardFilters.selectedBaseYear;
  const selectedLSOA = dashboardFilters.selectedLSOA;

  // Load population data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingPopulation(true);
      try {
        const data = await loadPopulationData();
        setPopulationRawData(data);
        const metrics = processPopulationData(data);
        setPopulationMetrics(metrics);
        console.log(`Loaded ${data.length} population records`);
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
        
        // Process data for both individual year and comparison
        const stats = processBoroughCrimeStats(data);
        setBoroughCrimeStats(stats);
        
        const statsComparison = processBoroughCrimeStatsComparison(data);
        setBoroughCrimeStatsComparison(statsComparison);
        console.log(`Loaded ${data.length} crime records`);
      } catch (error) {
        console.error('Error loading crime data:', error);
      } finally {
        setIsLoadingCrime(false);
      }
    };
    
    loadData();
  }, []);

  // Load school data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingSchool(true);
      try {
        const data = await loadSchoolData();
        setSchoolData(data);
        console.log(`Loaded ${data.length} schools`);
      } catch (error) {
        console.error('Error loading school data:', error);
        setSchoolData([]);
      } finally {
        setIsLoadingSchool(false);
      }
    };
    
    loadData();
  }, []);

  // Load house price data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingHousePrice(true);
      try {
        const data = await loadHousePriceData();
        setHousePriceData(data);
        console.log(`Loaded ${data.length} house price records`);
      } catch (error) {
        console.error('Error loading house price data:', error);
        setHousePriceData([]);
      } finally {
        setIsLoadingHousePrice(false);
      }
    };
    
    loadData();
  }, []);

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
    
    if (boroughCrimeStatsComparison.length > 0) {
      const topBoroughsComparison = getTopBoroughsByCategoryComparison(boroughCrimeStatsComparison, selectedCrimeCategory, 10);
      setCrimeBarDataComparison(topBoroughsComparison);
    }
  }, [selectedCrimeCategory, boroughCrimeStats, boroughCrimeStatsComparison]);

  // Update crime pie chart data when selected borough changes
  useEffect(() => {
    if (crimeRawData.length > 0) {
      const categories = getBoroughCrimeCategories(crimeRawData, selectedBorough);
      setCrimePieData(categories);
      
      const categoriesComparison = getBoroughCrimeCategoriesComparison(crimeRawData, selectedBorough);
      setCrimePieDataComparison(categoriesComparison);
    }
  }, [selectedBorough, crimeRawData]);

  // Update school stats when selected borough changes
  useEffect(() => {
    if (schoolData.length > 0) {
      const stats = getBoroughSchoolStats(schoolData, selectedBorough);
      setBoroughSchoolStats(stats);
    } else {
      // No data available - set empty stats
      setBoroughSchoolStats(null);
    }
  }, [selectedBorough, schoolData]);

  // Load house price data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingHousePrice(true);
      try {
        const data = await loadHousePriceData();
        setHousePriceData(data);
        console.log(`Loaded ${data.length} house price records`);
      } catch (error) {
        console.error('Error loading house price data:', error);
        setHousePriceData([]);
      } finally {
        setIsLoadingHousePrice(false);
      }
    };
    
    loadData();
  }, []);

  // Update house price timeline when selected borough changes
  useEffect(() => {
    if (housePriceData.length > 0) {
      const timeline = getHousePriceTimelineForBorough(housePriceData, selectedBorough);
      setHousePriceTimelineData(timeline);
    } else {
      setHousePriceTimelineData([]);
    }
  }, [selectedBorough, housePriceData]);

  // Load ethnicity data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingEthnicity(true);
      try {
        const data = await loadEthnicityData();
        setEthnicityData(data);
        console.log(`Loaded ${data.length} ethnicity records`);
      } catch (error) {
        console.error('Error loading ethnicity data:', error);
        setEthnicityData([]);
      } finally {
        setIsLoadingEthnicity(false);
      }
    };
    
    loadData();
  }, []);

  // Update ethnicity stats when selected borough changes
  useEffect(() => {
    if (ethnicityData.length > 0) {
      const stats = processBoroughEthnicityStats(ethnicityData, selectedBorough, 2023);
      setBoroughEthnicityStats(stats);
    } else {
      setBoroughEthnicityStats(null);
    }
  }, [selectedBorough, ethnicityData]);

  // Load country of birth data on component mount
  useEffect(() => {
    const loadCountryOfBirthData = async () => {
      try {
        setIsLoadingBirthData(true);
        const response = await fetch('/dataset/london/country-of-births/cob-borough.csv');
        const csvText = await response.text();
        const data = parseCountryOfBirthCSV(csvText);
        setCountryOfBirthData(data);
        console.log(`Loaded ${data.length} country of birth records`);

        const availableYears = getAvailableYears(data);
        setBirthYears(availableYears);
        
        // Set default years (2023 as current, 2004 as base)
        if (availableYears.length > 0) {
          updateDashboardFilter('selectedBirthYear', 2023); // Latest available year
          updateDashboardFilter('selectedBaseYear', 2004); // Base year for comparison
        }
      } catch (error) {
        console.error('Error loading country of birth data:', error);
      } finally {
        setIsLoadingBirthData(false);
      }
    };
    
    loadCountryOfBirthData();
  }, []);

  // Update country of birth stats when year selection changes
  useEffect(() => {
    if (countryOfBirthData.length > 0) {
      const stats = getCountryOfBirthStats(countryOfBirthData, selectedBirthYear);
      setCountryOfBirthStats(stats);
      
      const comparison = getCountryOfBirthComparison(countryOfBirthData, selectedBaseYear, selectedBirthYear);
      setCountryOfBirthComparison(comparison);
    }
  }, [countryOfBirthData, selectedBirthYear, selectedBaseYear]);

  function handleAddToSidebar(elementId: string, elementName: string, elementType: string): void {
    throw new Error('Not implemented.');
  }

  const handleBoroughClick = (name: string, value: any) => {
    if (value && value.datum && value.datum.id) {
      updateDashboardFilter('selectedBorough', value.datum.id);
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
    if (crimePieDataComparison.length > 0) {
      return crimePieDataComparison.reduce((total, category) => 
        total + category.count2023, 0); // Default to 2023 data
    }
    return crimePieData.reduce((total, category) => total + category.count, 0);
  };
  
  const totalCrimeCases = getTotalCrimeCases();
  
  // Generate population timeline data for the selected borough
  const getPopulationTimelineData = (): PopulationTimelineData[] => {
    if (populationRawData.length === 0) return [];
    return generatePopulationTimelineData(populationRawData, selectedBorough);
  };
  
  const populationTimelineData = getPopulationTimelineData();

  // Define all dashboard elements for AI assistant
  const dashboardElements = [
    {
      id: 'borough-details',
      name: 'Borough Details',
      type: 'kpi',
      description: 'Shows the currently selected borough name and basic information',
      category: 'selector',
      dataFields: ['borough_name']
    },
    {
      id: 'total-population',
      name: 'Total Population',
      type: 'kpi',
      description: 'Shows the total population count for the selected borough',
      category: 'population',
      dataFields: ['population_count']
    },
    {
      id: 'population-change',
      name: 'Population Change',
      type: 'kpi',
      description: 'Shows the percentage change in population over time',
      category: 'population',
      dataFields: ['population_change_percentage']
    },
    {
      id: 'population-density',
      name: 'Population Density',
      type: 'kpi',
      description: 'Shows the population density per square kilometer',
      category: 'population',
      dataFields: ['population_density']
    },
    {
      id: 'mean-house-price',
      name: 'Mean House Price',
      type: 'kpi',
      description: 'Shows the average house price for the selected borough',
      category: 'housing',
      dataFields: ['mean_house_price']
    },
    {
      id: 'mean-household-income',
      name: 'Mean Household Income',
      type: 'kpi',
      description: 'Shows the average household income for the selected borough',
      category: 'income',
      dataFields: ['mean_household_income']
    },
    {
      id: 'lsoa-map',
      name: 'LSOA Level Borough Map',
      type: 'interactive map',
      description: 'Interactive map showing Lower Super Output Area (LSOA) boundaries within the selected borough',
      category: 'geography',
      dataFields: ['lsoa_boundaries', 'geographic_data']
    },
    {
      id: 'borough-map',
      name: 'Borough Map',
      type: 'interactive map',
      description: 'Interactive map showing the selected borough within London context',
      category: 'geography',
      dataFields: ['borough_boundaries', 'london_context']
    },
    {
      id: 'population-growth-projections',
      name: 'Population Growth & Projections',
      type: 'multi series line chart',
      description: 'Line chart showing population growth over time with projections',
      category: 'population',
      dataFields: ['year', 'population_count', 'projected_population']
    },
    {
      id: 'borough-crime-stats',
      name: 'Borough Crime Stats',
      type: 'modified bar chart',
      description: 'Bar chart comparing crime statistics across different boroughs',
      category: 'crime',
      dataFields: ['borough_name', 'crime_count', 'crime_rate']
    },
    {
      id: 'mean-income-timeline',
      name: 'Mean Income Timeline',
      type: 'multi series line chart',
      description: 'Line chart showing mean and medianhousehold income changes over time',
      category: 'income',
      dataFields: ['year', 'mean_income', 'income_change']
    },
    {
      id: 'borough-crime-categories',
      name: 'Borough Crime Categories',
      type: 'pie chart',
      description: 'Pie chart showing breakdown of different crime categories in the selected borough',
      category: 'crime',
      dataFields: ['crime_category', 'crime_count', 'crime_percentage']
    },
    {
      id: 'school-education-facilities',
      name: 'School Education Facilities',
      type: 'bar chart',
      description: 'Bar chart showing relationship between education facilities and other metrics',
      category: 'education',
      dataFields: ['education_facilities', 'population', 'quality_metrics']
    },
    {
      id: 'house-price-timeline',
      name: 'House Price Timeline',
      type: 'multi series line chart',
      description: 'Line chart showing house price changes over time for the selected borough',
      category: 'housing',
      dataFields: ['year', 'house_price', 'price_change']
    },
    {
      id: 'ethnicity-minority-groups',
      name: 'Ethnicity Minority Groups',
      type: 'bar chart',
      description: 'Bar chart showing ethnic diversity and minority group distributions',
      category: 'demographics',
      dataFields: ['ethnicity', 'population_count', 'percentage']
    },
    {
      id: 'country-of-birth',
      name: 'Country of Birth',
      type: 'pie chart',
      description: 'Pie chart showing distribution of residents by country of birth',
      category: 'demographics',
      dataFields: ['country_of_birth', 'population_count', 'percentage']
    }
  ];

  return (
    <DashboardPlayground
      isActive={true}
      dashboardTitle="London Numbers Dashboard"
      dashboardType="london-style"
      onApplyFilters={handleAIFilters}
      dashboardFilters={dashboardFilters}
      dashboardElements={dashboardElements}
      availableFilters={{
        boroughs: ['Brent', 'Camden', 'Westminster', 'Kensington and Chelsea', 'Hammersmith and Fulham', 'Wandsworth', 'Lambeth', 'Southwark', 'Tower Hamlets', 'Hackney', 'Islington', 'Haringey', 'Enfield', 'Barnet', 'Harrow', 'Hillingdon', 'Ealing', 'Hounslow', 'Richmond upon Thames', 'Kingston upon Thames', 'Merton', 'Sutton', 'Croydon', 'Bromley', 'Lewisham', 'Greenwich', 'Bexley', 'Havering', 'Redbridge', 'Newham', 'Waltham Forest', 'Barking and Dagenham', 'City of London'],
        crimeCategories: Object.values(CRIME_CATEGORY_MAPPING),
        birthYears: birthYears,
        baseYears: birthYears
      }}
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
              <div className="text-center text-xs text-gray-400">Population Density <br />(persons per 10,000m²)</div>
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
              <div className="text-lg font-bold text-white">{formatPrice(housePriceTimelineData[housePriceTimelineData.length - 1]?.mean || 0)}</div>
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
            <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
              <div className=" text-sm font-semibold text-white">
                LSOA LEVEL BOROUGH MAP | {selectedBorough.toUpperCase()}
              </div>
              <div className="text-xs text-gray-400">
                (Click LSOA to filter)
              </div>
            </div>
            
            {/* Map Content */}
            <div className="absolute top-10 left-4 right-4 bottom-4">
              <LSOAMap
                selectedBorough={selectedBorough}
                selectedLSOA={selectedLSOA}
                onLSOASelect={(lsoaCode, lsoaName) => {
                  updateDashboardFilter('selectedLSOA', lsoaCode);
                  console.log('Selected LSOA:', lsoaName, lsoaCode);
                }}
              />
            </div>
            
            {/* LSOA Info */}
            <div className="absolute bottom-0 left-4 text-gray-400 z-1000 flex">
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
                          updateDashboardFilter('selectedBorough', boroughName);
                        }
                      }
                    }
                  }
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
            className="col-start-3 col-end-5 row-start-7 row-end-9 bg-zinc-800 rounded-lg p-4 border border-gray-600 relative overflow-hidden"
            styles={{}}
            elementId="population-growth-projections"
            elementName="Population Growth & Projections"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-xs font-semibold text-white">
              POPULATION GROWTH & PROJECTIONS
            </div>
            <div className="text-xs text-gray-400">
              Historical and projected population data for {selectedBorough}
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
                      updateDashboardFilter('selectedCrimeCategory', category);
                    }}
                    className={`w-[17px] h-[17px] rounded-full cursor-pointer transition-all duration-200 mb-1 ${
                      isSelected 
                        ? 'bg-purple-600 text-white font-bold text-[11px]' 
                        : 'bg-gray-600 text-gray-300 font-medium text-[9px] hover:bg-gray-500'
                    }`}
                    title={category}
                  >
                    {firstLetter}
                  </button>
                );
              })}
            </div>
            
            {/* Vega-Lite Crime Bar Chart with Comparison */}
            <div className="">
              {isLoadingCrime ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  Loading crime data...
                </div>
              ) : crimeBarDataComparison.length > 0 ? (
                <VegaLite
                  spec={crimeBarChartComparisonSpec(crimeBarDataComparison, selectedCrimeCategory)}
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
            <div className="text-xs text-gray-400 mb-1">
              Mean and median income for {selectedBorough}
            </div>
            
            {/* Custom Legend */}
            <div className="flex justify-center items-center gap-4 text-[10px] text-gray-300 mb-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span>Mean Income</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span>Median Income</span>
              </div>
            </div>
            
            {/* Vega-Lite Line Chart */}
            <div className="absolute -bottom-1 left-4 right-4">
              {incomeTimelineData.length > 0 ? (
                <VegaLite
                  spec={incomeTimelineChartSpec(incomeTimelineData)}
                  actions={false}
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
            <div className="flex flex-col justify-between text-[11px] text-gray-400">
                Total Cases (2022 vs 2023): <br></br>
                {crimePieDataComparison.reduce((sum, cat) => sum + cat.count2022, 0).toLocaleString()} vs {crimePieDataComparison.reduce((sum, cat) => sum + cat.count2023, 0).toLocaleString()}
            </div>
            
            {/* Vega-Lite Crime Pie Chart with Comparison */}
            <div className="absolute bottom-0 left-3 flex-shrink-0">
              {isLoadingCrime ? (
                <div className="flex items-center justify-center h-32 w-32 text-gray-400 text-xs">
                  Loading...
                </div>
              ) : crimePieDataComparison.length > 0 ? (
                <VegaLite
                  spec={crimePieChartComparisonSpec(crimePieDataComparison, 2023)}
                  actions={false}
                  style={{}}
                />
              ) : (
                <div className="flex items-center justify-center h-32 w-32 text-gray-400 text-xs">
                  No data
                </div>
              )}
            </div>
            
            {/* Legend with comparison data */}
            <div className="absolute bottom-2 right-3 text-xs text-gray-400">
              {crimePieDataComparison.map((category, index) => (
                <div key={category.name} className="flex items-center gap-1 mb-0.5">
                  <div 
                    className="w-2 h-2 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: CRIME_CATEGORY_COLORS[index] }}
                  ></div>
                  <div className="text-[8px] flex flex-col">
                    <span>{category.name}: 
                    {category.change !== undefined && (
                      <span className={`${category.change > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {category.change > 0 ? '+' : ''}{category.change.toFixed(1)}%
                      </span>
                    )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </LinkableCard>

          {/* Row 3: Bottom Charts (2x2 each) */}
          {/* School Education Facilities */}
          <LinkableCard 
            className="col-start-7 col-end-9 row-start-7 row-end-9 bg-zinc-800 rounded-lg p-4 border border-gray-600 relative"
            styles={{}}
            elementId="school-education-facilities"
            elementName="School Education Facilities"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-xs font-semibold text-white">
              SCHOOL EDUCATION FACILITIES
            </div>
            <div className="text-xs text-gray-400">
              Types of schools in {selectedBorough}
            </div>
            
            {/* School Type Summary */}
            <div className="flex justify-between text-[11px] text-gray-400 mb-2">
              <div>
                Primary: {boroughSchoolStats?.primarySchools || 0}
              </div>
              <div>
                Secondary: {boroughSchoolStats?.secondarySchools || 0}
              </div>
              <div>
                Total: {boroughSchoolStats?.totalSchools || 0}
              </div>
            </div>
            
            {/* Vega-Lite School Bar Chart */}
            <div className="absolute bottom-2 left-4 right-4">
              {isLoadingSchool ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  Loading school data...
                </div>
              ) : boroughSchoolStats ? (
                <VegaLite
                  spec={schoolEducationFacilitiesSpec(boroughSchoolStats)}
                  actions={false}
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  No school data available
                </div>
              )}
            </div>
          </LinkableCard>

          {/* House Price Timeline Chart */}
          <LinkableCard 
            className="col-start-1 col-end-4 row-start-5 row-end-7 bg-zinc-800 rounded-lg p-4 border border-gray-600"
            styles={{}}
            elementId="house-price-timeline"
            elementName="House Price Timeline"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-sm font-semibold text-white">
              HOUSE PRICE TRENDS
            </div>
            <div className="text-xs text-gray-400 mb-1">
              Mean, median prices & sales volume for {selectedBorough}
            </div>            
            
            {/* Custom Legend */}
            <div className="flex justify-center items-center gap-4 text-[10px] text-gray-300">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span>Mean Price</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span>Median Price</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-cyan-500"></div>
                <span>Sales Volume</span>
              </div>
            </div>
            
            {/* Vega-Lite House Price Timeline Chart */}
            <div className="absolute -bottom-1 left-4 right-4">
              {isLoadingHousePrice ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  Loading house price data...
                </div>
              ) : housePriceTimelineData.length > 0 ? (
                <VegaLite
                  spec={housePriceTimelineChartSpec(housePriceTimelineData)}
                  actions={false}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  No house price data available
                </div>
              )}
            </div>
          </LinkableCard>

          {/* Ethnicity Minority Groups */}
          <LinkableCard 
            className="col-start-5 col-end-7 row-start-7 row-end-9 bg-zinc-800 rounded-lg p-4 border border-gray-600"
            styles={{}}
            elementId="ethnicity-minority-groups"
            elementName="Ethnicity Minority Groups"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-xs font-semibold text-white">
              ETHNICITY MINORITY GROUPS
            </div>
            <div className="text-xs text-gray-400">
              Ethnic minority breakdown for {selectedBorough} (2023)
            </div>
            
            {/* BAME Statistics */}
            <div className="flex justify-between text-[11px] text-gray-400 mb-2">
              <div>
                BAME Population: {boroughEthnicityStats ? formatEthnicityNumber(boroughEthnicityStats.bameTotal) : 'N/A'} ({boroughEthnicityStats ? formatEthnicityPercentage(boroughEthnicityStats.bamePercentage) : 'N/A'} of total)
              </div>
              <div>
              </div>
            </div>
            
            {/* Vega-Lite Ethnicity Bar Chart */}
            <div className="absolute bottom-2 left-4 right-4">
              {isLoadingEthnicity ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  Loading ethnicity data...
                </div>
              ) : boroughEthnicityStats && boroughEthnicityStats.minorityGroups.length > 0 ? (
                <VegaLite
                  spec={ethnicityMinorityGroupsBarChartSpec(boroughEthnicityStats)}
                  actions={false}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  No ethnicity data available
                </div>
              )}
            </div>
            
            <div className="text-[8px] text-gray-400 absolute bottom-1 left-4">
              BAME = Black, Asian & Minority Ethnicity
            </div>
          </LinkableCard>

          {/* Bottom Far Left: Country of Birth */}
          <LinkableCard 
            className="col-start-1 col-end-3 row-start-7 row-end-9 bg-zinc-800 rounded-lg p-4 border border-gray-600"
            styles={{}}
            elementId="country-of-birth"
            elementName="Country of Birth"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-xs font-semibold text-white">
              COUNTRY OF BIRTH
            </div>
            <div className="text-xs text-gray-400 mb-1">
              London population by place of birth
            </div>
            
            {/* Year selector circles */}
            <div className="flex justify-between items-center">
              {birthYears.map((year) => (
                <button
                  key={year}
                  onClick={() => updateDashboardFilter('selectedBirthYear', year)}
                  className={`flex justify-center items-center p-1 text-[8px] transition-colors ${
                    selectedBirthYear === year
                      ? 'bg-purple-500 text-white font-bold hover:bg-purple-600'
                      : 'bg-gray-600 text-gray-300 font-regular hover:bg-gray-500'
                  }`}
                >
                  20{year.toString().slice(-2)}
                </button>
              ))}
            </div>
            
            {/* Chart and Legend Container */}
            <div className="absolute flex justify-between items-start h-full">
              {/* Pie Chart */}
              <div className="flex-1 flex items-center justify-center">
                {isLoadingBirthData ? (
                  <div className="flex items-center justify-center h-32 w-32 text-gray-400 text-xs">
                    Loading...
                  </div>
                ) : countryOfBirthStats ? (
                  <VegaLite
                    spec={countryOfBirthPieChartSpec(countryOfBirthStats, countryOfBirthComparison || undefined)}
                    actions={false}
                    style={{}}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 w-32 text-gray-400 text-xs">
                    No data
                  </div>
                )}
              </div>
              
              {/* Legend and Comparison - fixed at bottom */}
              <div className="flex flex-col justify-center space-y-1 pt-4 h-32">
                {/* Legend */}
                {countryOfBirthStats?.regions.map((region, index) => {
                  const colors = ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#1E40AF"];
                  return (
                    <div key={region.region} className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-sm" 
                        style={{ backgroundColor: colors[index] }}
                      ></div>
                      <span className="text-[11px] text-gray-300">
                        {region.region}: {region.percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </LinkableCard>
        </div>
      </div>
    </DashboardPlayground>
  );
};

export default Dashboard3;
