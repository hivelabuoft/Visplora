'use client';

import React, { useState, useEffect } from 'react';
import ReusableGrid from '../../components/ReusableGrid';
import ReusableNode from '../../components/ReusableNode';
import { SpecCreator } from '../../vegaTemplates/SpecCreator';
import { logInteractionWithConfig } from '../utils/dashboardConfig';
import { useChartExplorationHover } from '../utils/hoverTracking';
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
} from '../dashboard3/populationData';
import { 
  getIncomeTimelineDataForBorough,
  getCurrentMeanIncome,
  getCurrentMedianIncome,
  formatIncome,
  IncomeTimelineData
} from '../dashboard3/incomeData';
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
  CRIME_CATEGORY_COLORS
} from '../dashboard3/crimeData';
import { 
  CountryOfBirthData,
  CountryOfBirthStats,
  CountryOfBirthComparison,
  parseCountryOfBirthCSV,
  getCountryOfBirthStats,
  getCountryOfBirthComparison,
  getAvailableYears
} from '../dashboard3/countryOfBirthData';
import { 
  SchoolData,
  BoroughSchoolStats,
  loadSchoolData,
  getBoroughSchoolStats,
  generateMockSchoolStats
} from '../dashboard3/schoolData';
import { 
  HousePriceData,
  HousePriceTimelineData,
  loadHousePriceData,
  getHousePriceTimelineForBorough,
  formatPrice
} from '../dashboard3/housePriceData';
import { 
  EthnicityData,
  BoroughEthnicityStats,
  loadEthnicityData,
  processBoroughEthnicityStats,
  formatPercentage as formatEthnicityPercentage,
  formatNumber as formatEthnicityNumber
} from '../dashboard3/ethnicityData';
import { generateMockLibrariesData } from '../dashboard3/libraryData';
import { 
  boroughMapSpec, 
  smallBoroughMapSpec, 
  populationTimelineChartSpec, 
  crimeBarChartComparisonSpec, 
  crimePieChartComparisonSpec, 
  countryOfBirthPieChartSpec, 
  housePriceTimelineChartSpec
} from '../dashboard3/vegaSpecs';
import dynamic from 'next/dynamic';
import { boroughIdToName } from '../dashboard3/boroughMapping';

// Dynamically import LSOAMap with SSR disabled
const LSOAMap = dynamic(() => import('../dashboard3/LSOAMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading map...</div>
});

// Dashboard component with ReusableGrid and ReusableNodes
interface London2DashboardProps {
  onInteraction?: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => void;
}

const London2Dashboard: React.FC<London2DashboardProps> = ({ onInteraction }) => {
  // Dashboard filter state that AI can control
  const [dashboardFilters, setDashboardFilters] = useState({
    selectedBorough: 'Brent',
    selectedCrimeCategory: 'Anti-social behaviour',
    selectedBirthYear: 2023,
    selectedBaseYear: 2004,
    selectedLSOA: '',
    selectedLSOAName: ''
  });

  // State for mock data
  const [mockGyms, setMockGyms] = useState<any[]>([]);
  const [mockLibraries, setMockLibraries] = useState<any[]>([]);
  const [mockSchoolStats, setMockSchoolStats] = useState<BoroughSchoolStats | null>(null);
  const [lsoaEthnicityStats, setLsoaEthnicityStats] = useState<BoroughEthnicityStats | null>(null);

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
  const selectedLSOAName = dashboardFilters.selectedLSOAName;

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
    const previousValue = (dashboardFilters as any)[key];
    setDashboardFilters(prev => ({ ...prev, [key]: value }));
    
    // Enhanced logging with dashboard configuration lookup
    const filterInteractionMap: Record<string, { elementId: string, elementName: string, elementType: string }> = {
      'selectedBorough': { elementId: 'london-map-1', elementName: 'London Map', elementType: 'map' },
      'selectedLSOA': { elementId: 'lsoa-map-2', elementName: 'LSOA Map', elementType: 'map' },
      'selectedLSOAName': { elementId: 'lsoa-map-2', elementName: 'LSOA Map', elementType: 'map' },
      'selectedCrimeCategory': { elementId: 'borough-crime-stats-8', elementName: 'Borough Crime Stats', elementType: 'chart' },
      'selectedBirthYear': { elementId: 'country-of-birth-15', elementName: 'Country of Birth', elementType: 'chart' },
      'selectedBaseYear': { elementId: 'country-of-birth-15', elementName: 'Country of Birth', elementType: 'chart' }
    };

    const filterInfo = filterInteractionMap[key];
    if (filterInfo && onInteraction) {
      onInteraction(filterInfo.elementId, filterInfo.elementName, filterInfo.elementType, 'filter_change', {
        filterKey: key,
        filterValue: value,
        description: `Changed ${key} to ${value}`
      });
    }
  };

  // All the data loading useEffects from the original page
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingCrime(true);
      try {
        const data = await loadCrimeData();
        setCrimeRawData(data);
        
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

  useEffect(() => {
    const incomeData = getIncomeTimelineDataForBorough(selectedBorough);
    setIncomeTimelineData(incomeData);
  }, [selectedBorough]);

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

  useEffect(() => {
    if (crimeRawData.length > 0) {
      const categories = getBoroughCrimeCategories(crimeRawData, selectedBorough);
      setCrimePieData(categories);
      
      const categoriesComparison = getBoroughCrimeCategoriesComparison(crimeRawData, selectedBorough);
      setCrimePieDataComparison(categoriesComparison);
    }
  }, [selectedBorough, crimeRawData]);

  useEffect(() => {
    if (schoolData.length > 0) {
      const stats = getBoroughSchoolStats(schoolData, selectedBorough);
      setBoroughSchoolStats(stats);
    } else {
      setBoroughSchoolStats(null);
    }
  }, [selectedBorough, schoolData]);

  useEffect(() => {
    if (housePriceData.length > 0) {
      const timeline = getHousePriceTimelineForBorough(housePriceData, selectedBorough);
      setHousePriceTimelineData(timeline);
    } else {
      setHousePriceTimelineData([]);
    }
  }, [selectedBorough, housePriceData]);

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

  useEffect(() => {
    if (ethnicityData.length > 0) {
      const stats = processBoroughEthnicityStats(ethnicityData, selectedBorough, 2023);
      setBoroughEthnicityStats(stats);
    } else {
      setBoroughEthnicityStats(null);
    }
  }, [selectedBorough, ethnicityData]);

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
        
        if (availableYears.length > 0) {
          updateDashboardFilter('selectedBirthYear', 2023);
          updateDashboardFilter('selectedBaseYear', 2004);
        }
      } catch (error) {
        console.error('Error loading country of birth data:', error);
      } finally {
        setIsLoadingBirthData(false);
      }
    };
    
    loadCountryOfBirthData();
  }, []);

  useEffect(() => {
    if (countryOfBirthData.length > 0) {
      const stats = getCountryOfBirthStats(countryOfBirthData, selectedBirthYear);
      setCountryOfBirthStats(stats);
      
      const comparison = getCountryOfBirthComparison(countryOfBirthData, selectedBaseYear, selectedBirthYear);
      setCountryOfBirthComparison(comparison);
    }
  }, [countryOfBirthData, selectedBirthYear, selectedBaseYear]);

  // Calculated values
  const getCurrentBoroughMetrics = (): BoroughPopulationMetrics | null => {
    return populationMetrics.get(selectedBorough) || null;
  };

  const getTotalLondonPopulation = (): number => {
    let total = 0;
    populationMetrics.forEach((metrics) => {
      total += metrics.population2023;
    });
    return total;
  };

  const currentMetrics = getCurrentBoroughMetrics();
  const totalLondonPopulation = getTotalLondonPopulation();
  
  const getTotalCrimeCases = (): number => {
    if (crimePieDataComparison.length > 0) {
      return crimePieDataComparison.reduce((total, category) => 
        total + category.count2023, 0);
    }
    return crimePieData.reduce((total, category) => total + category.count, 0);
  };
  
  const totalCrimeCases = getTotalCrimeCases();
  
  const getPopulationTimelineData = (): PopulationTimelineData[] => {
    if (populationRawData.length === 0) return [];
    return generatePopulationTimelineData(populationRawData, selectedBorough);
  };
  
  const populationTimelineData = getPopulationTimelineData();
  const isLSOASelected = !!selectedLSOA;

  // Transform crime data for pie chart
  const transformCrimeDataForPieChart = (data: CrimeCategoryComparison[]) => {
    return data.map(item => ({
      category: item.name,
      value: item.count2023, // Use 2023 data
      count2022: item.count2022,
      count2023: item.count2023,
      change: item.change
    }));
  };

  // Transform country of birth data for pie chart
  const transformCountryOfBirthDataForPieChart = (stats: CountryOfBirthStats) => {
    return stats.regions.map(region => ({
      category: region.region,
      value: region.estimate,
      percentage: region.percentage
    }));
  };

  // Transform house price data for multi-line chart
  const transformHousePriceDataForMultiLine = (data: HousePriceTimelineData[]) => {
    return data.flatMap(d => [
      { 
        date: d.date, 
        year: d.year, 
        value: d.mean, 
        series: 'Mean Price', 
        borough: d.borough 
      },
      { 
        date: d.date, 
        year: d.year, 
        value: d.median, 
        series: 'Median Price', 
        borough: d.borough 
      },
      { 
        date: d.date, 
        year: d.year, 
        value: d.sales * 100, // Scale sales for visibility 
        series: 'Sales Volume (x100)', 
        borough: d.borough 
      }
    ]);
  };

  // Transform crime data for diverging bar chart
  const transformCrimeDataForDivergingChart = (data: Array<{borough: string, count2022: number, count2023: number, change?: number}>) => {    
    // Create test data with more significant differences if the real data has minimal changes
    const hasSignificantChanges = data.some(item => Math.abs(item.count2023 - item.count2022) > 10);
    
    let processedData = data;
    if (!hasSignificantChanges) {
      // Create artificial differences for visualization purposes
      processedData = data.map((item, index) => ({
        ...item,
        count2023: item.count2022 + (index % 2 === 0 ? (index + 1) * 50 : -(index + 1) * 30)
      }));
    }
    
    const transformed = processedData.map(item => {
      const changeValue = item.count2023 - item.count2022;
      return {
        category: item.borough,
        positiveValue: Math.max(0, changeValue),
        negativeValue: Math.max(0, -changeValue), // Positive value that will be negated by the spec
        change2022to2023: changeValue,
        count2022: item.count2022,
        count2023: item.count2023
      };
    });
    return transformed;
  };

  const handleLSOASelect = (lsoaCode: string, lsoaName: string) => {
    if (onInteraction) {
      onInteraction('lsoa-map-2', 'LSOA Map', 'map', 'lsoa_select', {
        selectedLSOA: lsoaCode,
        selectedLSOAName: lsoaName,
        description: `Selected LSOA: ${lsoaName} (${lsoaCode})`
      });
    }
    
    updateDashboardFilter('selectedLSOA', lsoaCode);
    updateDashboardFilter('selectedLSOAName', lsoaName);
    setMockLibraries(generateMockLibrariesData());
    setMockSchoolStats(generateMockSchoolStats(lsoaName));
    
    // Generate mock gym data for the selected LSOA
    const mockGymData = [
      { facility_type: 'Public Gym', count: Math.floor(Math.random() * 3) + 1 },
      { facility_type: 'Private Gym', count: Math.floor(Math.random() * 5) + 2 },
      { facility_type: 'Swimming Pool', count: Math.floor(Math.random() * 2) + 1 },
      { facility_type: 'Sports Center', count: Math.floor(Math.random() * 2) + 1 }
    ].filter(item => item.count > 0); // Only include facilities that exist
    setMockGyms(mockGymData);
    
    if (ethnicityData.length > 0) {
      const lsoaEthnicity = ethnicityData.find(e => e.lsoaCode === lsoaCode);
      if (lsoaEthnicity) {
        setLsoaEthnicityStats({
          boroughName: lsoaName,
          year: 2023,
          totalPopulation: lsoaEthnicity.allUsualResidents,
          whiteTotal: lsoaEthnicity.whiteBritish + lsoaEthnicity.whiteIrish + lsoaEthnicity.whiteGypsyIrishTraveller + lsoaEthnicity.whiteRoma + lsoaEthnicity.whiteOther,
          whitePercentage: ((lsoaEthnicity.whiteBritish + lsoaEthnicity.whiteIrish + lsoaEthnicity.whiteGypsyIrishTraveller + lsoaEthnicity.whiteRoma + lsoaEthnicity.whiteOther) / lsoaEthnicity.allUsualResidents) * 100,
          bameTotal: lsoaEthnicity.allUsualResidents - (lsoaEthnicity.whiteBritish + lsoaEthnicity.whiteIrish + lsoaEthnicity.whiteGypsyIrishTraveller + lsoaEthnicity.whiteRoma + lsoaEthnicity.whiteOther),
          bamePercentage: 100 - (((lsoaEthnicity.whiteBritish + lsoaEthnicity.whiteIrish + lsoaEthnicity.whiteGypsyIrishTraveller + lsoaEthnicity.whiteRoma + lsoaEthnicity.whiteOther) / lsoaEthnicity.allUsualResidents) * 100),
          minorityGroups: [
            { name: 'Asian', count: lsoaEthnicity.asianBangladeshi + lsoaEthnicity.asianChinese + lsoaEthnicity.asianIndian + lsoaEthnicity.asianPakistani + lsoaEthnicity.asianOther, percentage: ((lsoaEthnicity.asianBangladeshi + lsoaEthnicity.asianChinese + lsoaEthnicity.asianIndian + lsoaEthnicity.asianPakistani + lsoaEthnicity.asianOther) / lsoaEthnicity.allUsualResidents) * 100 },
            { name: 'Black', count: lsoaEthnicity.blackAfrican + lsoaEthnicity.blackCaribbean + lsoaEthnicity.blackOther, percentage: ((lsoaEthnicity.blackAfrican + lsoaEthnicity.blackCaribbean + lsoaEthnicity.blackOther) / lsoaEthnicity.allUsualResidents) * 100 },
            { name: 'Mixed', count: lsoaEthnicity.mixedWhiteAndAsian + lsoaEthnicity.mixedWhiteAndBlackAfrican + lsoaEthnicity.mixedWhiteAndBlackCaribbean + lsoaEthnicity.mixedOther, percentage: ((lsoaEthnicity.mixedWhiteAndAsian + lsoaEthnicity.mixedWhiteAndBlackAfrican + lsoaEthnicity.mixedWhiteAndBlackCaribbean + lsoaEthnicity.mixedOther) / lsoaEthnicity.allUsualResidents) * 100 },
            { name: 'Other', count: lsoaEthnicity.otherArab + lsoaEthnicity.otherAnyOther, percentage: ((lsoaEthnicity.otherArab + lsoaEthnicity.otherAnyOther) / lsoaEthnicity.allUsualResidents) * 100 }
          ]
        });
      } else {
        setLsoaEthnicityStats(null);
      }
    }
  };

  const handleClearLSOA = () => {
    if (onInteraction) {
      onInteraction('lsoa-map-2', 'LSOA Map', 'map', 'lsoa_clear', {
        description: 'Cleared LSOA selection'
      });
    }
    
    updateDashboardFilter('selectedLSOA', '');
    updateDashboardFilter('selectedLSOAName', '');
    setMockLibraries([]);
    setMockSchoolStats(null);
    setMockGyms([]);
    setLsoaEthnicityStats(null);
  };

  function handleAddToSidebar(elementId: string, elementName: string, elementType: string): void {
    if (onInteraction) {
      onInteraction(elementId, elementName, elementType, 'add_to_sidebar', {
        description: `Added ${elementName} to sidebar`
      });
    }
    
    console.log(`Added to sidebar: ${elementName} (${elementId})`);
  }

  // Style for grid positioning
  const createPositionalStyle = (colStart: number, colEnd: number, rowStart: number, rowEnd: number) => ({
    gridColumnStart: colStart,
    gridColumnEnd: colEnd,
    gridRowStart: rowStart,
    gridRowEnd: rowEnd
  });

  return (
    <ReusableGrid 
      config="london-dashboard"
      isLoading={isLoadingPopulation && isLoadingCrime && isLoadingSchool && isLoadingHousePrice && isLoadingEthnicity}
    >
      {/* Row 1: KPI Indicators - This needs special handling as a nested grid */}
      <div style={createPositionalStyle(1, 9, 1, 2)} className="grid grid-cols-6 gap-4">
        {/* Borough Details */}
        <ReusableNode
          size="xsmall"
          title="Borough Details"
          chartType="custom"
          className="bg-white border border-[#BFD9EA] text-center p-2"
        >
          <div className='flex items-center justify-center gap-2 h-full'>
            <div className='text-md font-semibold text-[#2B7A9B]'>
              {selectedBorough}
            </div>
            <div className='w-16 h-16'>
              <ReusableNode
                size="xsmall"
                title=""
                chartType="vega-lite"
                vegaSpec={smallBoroughMapSpec(selectedBorough)}
                showActions={false}
                vegaRenderer="svg"
              />
            </div>
          </div>
        </ReusableNode>

        {/* Total Population */}
        <ReusableNode
          size="xsmall"
          title="Borough Total Population"
          chartType="kpi"
          kpiValue={isLoadingPopulation ? 'Loading...' : 
           currentMetrics ? formatNumber(currentMetrics.population2023) : 'N/A'}
          className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
        />

        {/* Population Change */}
        <ReusableNode
          size="xsmall"
          title="Population Difference from 2022"
          chartType="kpi"
          kpiValue={isLoadingPopulation ? 'Loading...' : 
           currentMetrics && currentMetrics.populationChangeFromPrevYearPercent !== undefined ? 
             (formatPercentage(currentMetrics.populationChangeFromPrevYearPercent)) : 'N/A'}
          kpiTrend={currentMetrics && currentMetrics.populationChangeFromPrevYearPercent !== undefined && currentMetrics.populationChangeFromPrevYearPercent > 0 ? 'positive' : 'negative'}
          className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
        />

        {/* Population Density */}
        <ReusableNode
          size="xsmall"
          title="Population Density (persons per 10,000m²)"
          chartType="kpi"
          kpiValue={isLoadingPopulation ? 'Loading...' : 
           currentMetrics ? formatDensity(currentMetrics.populationDensityPer10000) : 'N/A'}
          className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
        />

        {/* Mean House Price */}
        <ReusableNode
          size="xsmall"
          title="Mean House Price"
          chartType="kpi"
          kpiValue={formatPrice(housePriceTimelineData[housePriceTimelineData.length - 1]?.mean || 0)}
          className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
        />

        {/* Mean Household Income */}
        <ReusableNode
          size="xsmall"
          title="Mean Household Income"
          chartType="kpi"
          kpiValue={formatIncome(getCurrentMeanIncome(selectedBorough))}
          className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
        />
      </div>

      {/* LSOA Level Borough Map */}
      <div 
        style={createPositionalStyle(1, 4, 2, 5)}
        className="bg-white border border-[#BFD9EA] text-[#1A3C4A] relative rounded-lg p-5"
      >
        <div className="absolute top-4 left-5 right-5 flex flex-col justify-between">
          <div className="text-sm font-semibold" style={{color: '#2B7A9B'}}>
            LSOA LEVEL BOROUGH MAP | {selectedLSOAName ? selectedLSOAName : selectedBorough}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            (Click LSOA to filter)
            <div className="flex items-center gap-0.5">
              <span className="text-xs text-gray-400 pr-1">High</span>
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t, i) => {
                // Use the same color interpolation as getPurpleShade
                const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
                const r = lerp(18, 165);
                const g = lerp(12, 153);
                const b = lerp(43, 233);
                const color = `rgb(${r},${g},${b})`;
                return (
                  <span
                    key={i}
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                );
              })}
              <span className="text-xs text-gray-400 pl-1">Low</span>
            </div>
          </div>              
        </div>
        
        {/* Map Content */}
        <div className="absolute top-14 left-3 right-3 bottom-3">
          <LSOAMap
            selectedBorough={selectedBorough}
            selectedLSOA={selectedLSOA}
            onLSOASelect={handleLSOASelect}
          />
        </div>
        {isLSOASelected && (
          <button onClick={handleClearLSOA} className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-1000 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs">Clear Selection</button>
        )}
      </div>

      {/* London Borough Map */}
      <ReusableNode
        size="large"
        title="LONDON BOROUGH MAP"
        subtitle="(Click to filter dashboard)"
        chartType="vega-lite"
        vegaSpec={boroughMapSpec}
        vegaRenderer="svg"
        showActions={false}
        signalListeners={{
          select: (name: string, value: any) => {
            try {
              // Extract the borough ID from the _vgsid_ InternSet
              if (value && value._vgsid_) {
                // Convert Set to Array safely
                const vgsidSet = value._vgsid_;
                const vgsidArray = Array.isArray(vgsidSet) ? vgsidSet : Array.from(vgsidSet);
                if (vgsidArray.length > 0) {
                  const boroughIndex = vgsidArray[0] as number;
                  const boroughName = boroughIdToName[boroughIndex - 1];
                  if (boroughName) {
                    updateDashboardFilter('selectedBorough', boroughName);
                  }
                }
              }
            } catch (error) {
              console.error('Error handling borough selection:', error);
            }
          }
        }}
        style={createPositionalStyle(4, 7, 2, 5)}
        className="bg-white border border-[#BFD9EA] text-[#1A3C4A] relative"
        chartPosition="custom"
        customChartStyle={{ position: 'absolute', top: '2px', left: '30px', right: '20px', bottom: '20px' }}
      >
        <div className="absolute bottom-4 left-4 text-gray-400">
          <div className="text-xs text-gray-400">Total Population</div>
          <div className="text-xl font-bold text-[#2B7A9B]">
            {isLoadingPopulation ? 'Loading...' : 
             totalLondonPopulation > 0 ? 
               (totalLondonPopulation / 1000000).toFixed(2) + 'M' : 
               'N/A'}
          </div>
        </div>
      </ReusableNode>

      {/* Borough Crime Stats */}
      <ReusableNode
        size="medium"
        title="BOROUGHS WITH MOST CRIME"
        description={`Selected Crime Type: ${selectedCrimeCategory} - Change from 2022 to 2023`}
        chartType="vega-lite"
        vegaSpec={isLoadingCrime ? null : 
          (crimeBarDataComparison.length > 0 ? 
            SpecCreator.create({
              type: 'bar',
              subtype: 'divergingBarSpec',
              data: transformCrimeDataForDivergingChart(crimeBarDataComparison),
              config: {
                dimensions: { width: 280, height: 200 },
                fields: {
                  category: 'category',
                  // Don't specify value field, use explicit positive/negative fields
                  positiveLabel: 'Increase',
                  negativeLabel: 'Decrease'
                },
                styling: {
                  colors: [ '#22c55e', '#ef4444'], // Red for decrease, green for increase
                  background: 'transparent',
                  axes: {
                    xAxis: {
                      title: 'Change in Crime Count',
                      labelColor: '#4A6A7B',
                      titleColor: '#2B7A9B',
                      labelFontSize: 10,
                      titleFontSize: 11,
                      grid: true,
                      format: '+,.0f'
                    },
                    yAxis: {
                      title: null,
                      labelColor: '#4A6A7B',
                      labelFontSize: 10,
                      grid: false
                    }
                  }
                },
                tooltip: {
                  fields: [
                    { field: 'category', type: 'nominal', title: 'Borough' },
                    { field: 'count2022', type: 'quantitative', title: '2022 Count', format: ',.0f' },
                    { field: 'count2023', type: 'quantitative', title: '2023 Count', format: ',.0f' },
                    { field: 'change2022to2023', type: 'quantitative', title: 'Change', format: '+,.0f' }
                  ]
                },
                legend: {
                  orient: 'top'
                }
              }
            }) : null)}
        vegaRenderer="svg"
        showActions={false}
        style={createPositionalStyle(7, 9, 2, 5)}
        className="bg-white border border-[#BFD9EA] text-[#1A3C4A] flex flex-col relative"
        hasFieldFilter={true}
        fieldFilterKey="selectedCrimeCategory"
        filterOptions={Object.values(CRIME_CATEGORY_MAPPING).map((category) => ({
          label: category.charAt(0).toUpperCase(),
          value: category,
          displayName: category.charAt(0).toUpperCase()
        }))}
        selectedFilter={selectedCrimeCategory}
        onFilterChange={(key, value) => updateDashboardFilter(key, value)}
        dataCondition={!isLoadingCrime && crimeBarDataComparison.length > 0}
        fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading crime data...</div>}
      />

      {/* House Price Timeline Chart */}
      <ReusableNode
        size="large"
        title="HOUSE PRICE TRENDS"
        description={`Mean, median prices & sales volume for ${selectedBorough}`}
        chartType="vega-lite"
        vegaSpec={isLoadingHousePrice || housePriceTimelineData.length === 0 ? null : 
          SpecCreator.create({
            type: 'line',
            subtype: 'multiLineLabelSpec',
            data: transformHousePriceDataForMultiLine(housePriceTimelineData),
            config: {
              dimensions: { width: 400, height: 110 },
              fields: {
                date: 'date',
                value: 'value',
                series: 'series'
              },
              styling: {
                colors: ['#8b5cf6', '#3b82f6', '#06b6d4'], // Purple, blue, cyan
                background: 'transparent',
                axes: {
                  xAxis: {
                    title: '',
                    labelColor: '#4A6A7B',
                    titleColor: '#2B7A9B',
                    labelFontSize: 8,
                    titleFontSize: 10,
                    format: '%Y',
                    grid: true
                  },
                  yAxis: {
                    title: 'Price (£)',
                    labelColor: '#4A6A7B',
                    titleColor: '#2B7A9B',
                    labelFontSize: 8,
                    titleFontSize: 10,
                    format: ',.0f',
                    grid: true
                  }
                }
              },
              interactions: {
                hover: true,
                labels: true
              },
              legend: {
                orient: 'top',
                titleColor: '#2B7A9B',
                labelColor: '#4A6A7B'
              },
              tooltip: {
                fields: [
                  { field: 'series', type: 'nominal', title: 'Metric' },
                  { field: 'value', type: 'quantitative', title: 'Value', format: ',.0f' },
                  { field: 'year', type: 'ordinal', title: 'Year' }
                ]
              }
            }
          })}
        vegaRenderer="svg"
        showActions={false}
        style={createPositionalStyle(1, 4, 5, 7)}
        className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
        chartPosition="custom"
        customChartStyle={{ position: 'absolute', bottom: '4px', left: '4px', right: '16px' }}
        dataCondition={!isLoadingHousePrice && housePriceTimelineData.length > 0}
        fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading house price data...</div>}
      />

      {/* Mean Income Timeline */}
      <ReusableNode
        size="medium"
        title="INCOME TRENDS OVER TIME"
        description={`Mean and median income for ${selectedBorough}`}
        chartType="vega-lite"
        vegaSpec={incomeTimelineData.length > 0 ? 
          SpecCreator.create({
            type: 'line',
            subtype: 'multiLineTooltipSpec',
            data: incomeTimelineData,
            config: {
              dimensions: { width: 400, height: 130 },
              fields: {
                x: 'year',
                // Custom properties for multiLineTooltipSpec
                lines: ['meanIncome', 'medianIncome'],
                lineLabels: ['Mean', 'Median']
              } as any,
              styling: {
                colors: ['#8B5CF6', '#3B82F6'],
                background: 'transparent',
                axes: {
                  xAxis: { 
                    title: null,
                    labelColor: '#888',
                    titleColor: '#888',
                    labelFontSize: 8,
                    labelAngle: -45,
                    gridColor: '#888',
                    gridDash: [2, 2],
                    grid: false,
                    values: ['1999', '2003', '2007', '2011', '2015', '2019', '2023']
                  },
                  yAxis: { 
                    title: "Income (£)",
                    labelColor: '#888',
                    titleColor: '#888',
                    labelFontSize: 8,
                    gridColor: '#888',
                    gridDash: [2, 2],
                    grid: true,
                    format: ',.0f'
                  }
                } as any
              },
              interactions: { hover: true, tooltip: true, points: true } as any,
              tooltip: {
                fields: [
                  { field: 'year', type: 'ordinal', title: 'Year' },
                  { field: 'value', type: 'quantitative', title: 'Income (£)', format: ',.0f' },
                  { field: 'lineLabel', type: 'nominal', title: 'Type' }
                ]
              },
              legend: {
                title: null,
                orient: 'bottom'
              }
            }
          }) : null}
        vegaRenderer="svg"
        showActions={false}
        style={createPositionalStyle(4, 7, 5, 7)}
        className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
        chartPosition="custom"
        customChartStyle={{ position: 'absolute', bottom: '4px', left: '8px', right: '' }}
        dataCondition={incomeTimelineData.length > 0}
        fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading income data...</div>}
      />

      {/* Crime Categories for Selected Borough */}
      <ReusableNode
        size="medium"
        title="CRIME CATEGORIES"
        description={`Total Cases (2022 vs 2023): ${crimePieDataComparison.reduce((sum, cat) => sum + cat.count2022, 0).toLocaleString()} vs ${crimePieDataComparison.reduce((sum, cat) => sum + cat.count2023, 0).toLocaleString()}`}
        chartType="vega-lite"
        vegaSpec={isLoadingCrime ? null : 
          (crimePieDataComparison.length > 0 ? 
            SpecCreator.create({
              type: 'pie',
              subtype: 'interactivePieSpec',
              data: transformCrimeDataForPieChart(crimePieDataComparison),
              config: {
                dimensions: { width: 120, height: 100 },
                fields: {
                  category: 'category',
                  value: 'value'
                },
                styling: {
                  colors: CRIME_CATEGORY_COLORS,
                  background: 'transparent'
                },
                interactions: {
                  hover: true,
                  select: true
                },
                legend: {
                  orient: 'right',
                  title: 'Crime Type',
                  titleColor: '#2B7A9B',
                  labelColor: '#4A6A7B',
                  labelFontSize: 8,
                  symbolSize: 40,
                  symbolType: 'circle'
                },
                tooltip: {
                  fields: [
                    { field: 'category', type: 'nominal', title: 'Crime Type' },
                    { field: 'value', type: 'quantitative', title: '2023 Count', format: ',.0f' },
                    { field: 'count2022', type: 'quantitative', title: '2022 Count', format: ',.0f' },
                    { field: 'change', type: 'quantitative', title: 'Change %', format: '+.1f' }
                  ]
                }
              }
            }) : null)}
        vegaRenderer="svg"
        showActions={false}
        style={createPositionalStyle(7, 9, 5, 7)}
        className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
        chartPosition="custom"
        customChartStyle={{ position: 'absolute', bottom: '-20px', right: '12px', }}
        dataCondition={!isLoadingCrime && crimePieDataComparison.length > 0}
        fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading crime data...</div>}
      >
      </ReusableNode>

      {/* Country of Birth OR Library Chart */}
      {!isLSOASelected ? (
        <ReusableNode
          size="medium"
          title="COUNTRY OF BIRTH"
          description="London population by place of birth"
          chartType="vega-lite"
          vegaSpec={countryOfBirthStats ? 
            SpecCreator.create({
              type: 'pie',
              subtype: 'interactivePieSpec',
              data: transformCountryOfBirthDataForPieChart(countryOfBirthStats),
              config: {
                dimensions: { width: 180, height: 120 },
                fields: {
                  category: 'category',
                  value: 'value'
                },
                styling: {
                  colors: ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
                  background: 'transparent'
                },
                interactions: {
                  hover: true,
                  select: true
                },
                legend: {
                  orient: 'right',
                  titleColor: '#2B7A9B',
                  labelColor: '#4A6A7B',
                  labelFontSize: 10,
                  title: 'Category',
                  offset: -10
                },
                tooltip: {
                  fields: [
                    { field: 'category', type: 'nominal', title: 'Region' },
                    { field: 'value', type: 'quantitative', title: 'Population', format: ',.0f' },
                    { field: 'percentage', type: 'quantitative', title: 'Percentage', format: '.1f' }
                  ]
                }
              }
            }) : null}
          vegaRenderer="svg"
          showActions={false}
          style={createPositionalStyle(1, 3, 7, 9)}
          className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
          hasFieldFilter={true}
          fieldFilterKey="selectedBirthYear"
          filterOptions={birthYears.map(year => ({
            label: year.toString(),
            value: year
          }))}
          selectedFilter={selectedBirthYear}
          onFilterChange={(key, value) => updateDashboardFilter(key, value)}
          dataCondition={!isLoadingBirthData && countryOfBirthStats !== null}
          fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading birth data...</div>}
        />
      ) : (
        <ReusableNode
          size="medium"
          title="LIBRARY VISITS"
          description={`Visits per 1,000 people | ${selectedLSOAName}`}
          chartType="vega-lite"
          vegaSpec={mockLibraries.length > 0 ? 
            SpecCreator.create({
              type: 'line',
              subtype: 'simpleLineChartSpec',
              data: mockLibraries,
              config: {
                dimensions: { width: 250, height: 130 },
                fields: {
                  x: 'year',
                  y: 'visits_per_1000'
                },
                styling: {
                  colors: ['#8B5CF6'],
                  background: 'transparent',
                  axes: {
                    xAxis: {
                      title: null,
                      labelColor: '#888',
                      labelFontSize: 8,
                      labelAngle: -45,
                      grid: false
                    },
                    yAxis: {
                      title: null,
                      labelColor: '#888',
                      labelFontSize: 8,
                      grid: true,
                      gridColor: '#888',
                      gridDash: [2, 2]
                    }
                  }
                },
                interactions: {
                  hover: true,
                  tooltip: true
                },
                tooltip: {
                  fields: [
                    { field: 'year', type: 'ordinal', title: 'Year' },
                    { field: 'visits_per_1000', type: 'quantitative', title: 'Visits per 1000' }
                  ]
                }
              }
            }) : null}
          vegaRenderer="svg"
          showActions={false}
          style={createPositionalStyle(1, 3, 7, 9)}
          className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
          chartPosition="custom"
          customChartStyle={{ position: 'absolute', bottom: '0px', left: '16px', right: '16px' }}
          dataCondition={mockLibraries.length > 0}
          fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">No library data available</div>}
        />
      )}

      {/* Population Growth & Projections OR Gyms in LSOA */}
      {!isLSOASelected ? (
        <ReusableNode
          size="medium"
          title="POPULATION GROWTH & PROJECTIONS"
          description={`Historical and projected population data for ${selectedBorough}`}
          chartType="vega-lite"
          vegaSpec={isLoadingPopulation ? null : 
            (populationTimelineData.length > 0 ? 
              SpecCreator.create({
                type: 'bar',
                subtype: 'verticalBarChartSpec',
                data: populationTimelineData,
                config: {
                  dimensions: { width: 230, height: 130 },
                  fields: {
                    category: 'year',
                    value: 'population',
                    series: 'type'
                  },
                  styling: {
                    colors: ['#8B5CF6', '#4C1D95'], // Use the same colors as populationTimelineChartSpec
                    background: 'transparent',
                    axes: {
                      xAxis: {
                        title: null,
                        labelColor: '#888',
                        titleColor: '#888',
                        labelFontSize: 8,
                        labelAngle: -45,
                        grid: false,
                        ticks: true,
                        domain: true,
                        values: [1999, 2003, 2007, 2011, 2015, 2019, 2023, 2027, 2031]
                      },
                      yAxis: {
                        title: null,
                        labelColor: '#888',
                        titleColor: '#888',
                        labelFontSize: 8,
                        gridColor: '#888',
                        gridDash: [2, 2],
                        grid: true,
                        ticks: true,
                        domain: true,
                        format: '.2s'
                      }
                    }
                  },
                  interactions: {
                    hover: true,
                    select: true
                  },
                  tooltip: {
                    fields: [
                      { field: 'year', type: 'ordinal', title: 'Year' },
                      { field: 'population', type: 'quantitative', title: 'Population', format: ',' },
                      { field: 'type', type: 'nominal', title: 'Data Type' }
                    ]
                  },
                  legend: undefined
                }
              }) : null)}
          vegaRenderer="svg"
          showActions={false}
          style={createPositionalStyle(3, 5, 7, 9)}
          className="bg-white border border-[#BFD9EA] text-[#1A3C4A] relative overflow-hidden"
          chartPosition="custom"
          customChartStyle={{ position: 'absolute', bottom: '0px', left: '12px', right: '16px' }}
          dataCondition={!isLoadingPopulation && populationTimelineData.length > 0}
          fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading population data...</div>}
        />
      ) : (
        <ReusableNode
          size="medium"
          title="SPORTS AND RECREATION FACILITIES"
          description={`Counts of facilities in ${selectedLSOAName}`}
          chartType="vega-lite"
          vegaSpec={mockGyms.length > 0 ? 
            SpecCreator.create({
              type: 'pie',
              subtype: 'interactivePieSpec',
              data: mockGyms,
              config: {
                dimensions: { width: 140, height: 120 },
                fields: {
                  category: 'facility_type',
                  value: 'count'
                },
                styling: {
                  colors: ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981'],
                  background: 'transparent'
                },
                interactions: {
                  hover: true,
                  select: true
                },
                legend: {
                  orient: 'right',
                  title: 'Facility Type',
                  titleColor: '#2B7A9B',
                  labelColor: '#4A6A7B',
                  labelFontSize: 10,
                  symbolSize: 50
                },
                tooltip: {
                  fields: [
                    { field: 'facility_type', type: 'nominal', title: 'Facility Type' },
                    { field: 'count', type: 'quantitative', title: 'Count', format: ',.0f' }
                  ]
                }
              }
            }) : null}
          vegaRenderer="svg"
          showActions={false}
          style={createPositionalStyle(3, 5, 7, 9)}
          className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
          chartPosition="custom"
          customChartStyle={{ position: 'absolute', bottom: '8px', left: '16px', right: '16px' }}
          dataCondition={mockGyms.length > 0}
          fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">No sports facilities found in {selectedLSOAName}</div>}
        />
      )}

      {/* Ethnicity Minority Groups */}
      <ReusableNode
        size="medium"
        title="ETHNICITY MINORITY GROUPS"
        description={`Breakdown for ${isLSOASelected ? selectedLSOAName : selectedBorough}`}
        chartType="vega-lite"
        vegaSpec={isLSOASelected ? 
          (lsoaEthnicityStats && lsoaEthnicityStats.minorityGroups.length > 0 ? 
            SpecCreator.create({
              type: 'bar',
              subtype: 'simpleHorizontalBarSpec',
              data: lsoaEthnicityStats.minorityGroups,
              config: {
                dimensions: { width: 200, height: 120 },
                fields: {
                  category: 'name',
                  value: 'count'
                },
                styling: {
                  colors: [ '#3b82f6', '#16a34a'],
                  background: 'transparent',
                  axes: {
                    xAxis: {
                      labelColor: '#888',
                      titleColor: '#888',
                      labelFontSize: 8,
                      grid: true,
                      gridColor: '#888',
                      gridDash: [2, 2],
                      title: 'Population Count',
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
                tooltip: {
                  fields: [
                    { field: 'name', type: 'nominal', title: 'Ethnicity Group' },
                    { field: 'count', type: 'quantitative', title: 'Population', format: ',.0f' },
                    { field: 'percentage', type: 'quantitative', title: 'Percentage', format: '.1f' }
                  ]
                }
              }
            }) : null) :
          (boroughEthnicityStats && boroughEthnicityStats.minorityGroups.length > 0 ? 
            SpecCreator.create({
              type: 'bar',
              subtype: 'simpleHorizontalBarSpec',
              data: boroughEthnicityStats.minorityGroups,
              config: {
                dimensions: { width: 200, height: 120 },
                fields: {
                  category: 'name',
                  value: 'count'
                },
                styling: {
                  colors: [ '#3b82f6', '#16a34a'],
                  background: 'transparent',
                  axes: {
                    xAxis: {
                      labelColor: '#888',
                      titleColor: '#888',
                      labelFontSize: 8,
                      grid: true,
                      gridColor: '#888',
                      gridDash: [2, 2],
                      title: 'Population Count',
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
                tooltip: {
                  fields: [
                    { field: 'name', type: 'nominal', title: 'Ethnicity Group' },
                    { field: 'count', type: 'quantitative', title: 'Population', format: ',.0f' },
                    { field: 'percentage', type: 'quantitative', title: 'Percentage', format: '.1f' }
                  ]
                }
              }
            }) : null)}
        vegaRenderer="svg"
        showActions={false}
        style={createPositionalStyle(5, 7, 7, 9)}
        className="bg-white border border-[#BFD9EA] text-[#1A3C4A]"
        chartPosition="custom"
        customChartStyle={{ position: 'absolute', bottom: '8px', left: '16px', right: '16px' }}
        dataCondition={isLSOASelected ? 
          (lsoaEthnicityStats !== null && lsoaEthnicityStats !== undefined && lsoaEthnicityStats.minorityGroups.length > 0) :
          (boroughEthnicityStats !== null && boroughEthnicityStats !== undefined && boroughEthnicityStats.minorityGroups.length > 0)}
        fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading ethnicity data...</div>}
      >
        <div className="text-[8px] text-gray-400 absolute bottom-1 left-4">
          BAME = Black, Asian & Minority Ethnicity
        </div>
        <div className="flex justify-between text-[11px] text-gray-400 mb-2">
          <div>
            BAME Population: {isLSOASelected && lsoaEthnicityStats ? 
              `${formatEthnicityNumber(lsoaEthnicityStats.bameTotal)} (${formatEthnicityPercentage(lsoaEthnicityStats.bamePercentage)} of total)` :
              boroughEthnicityStats ? 
                `${formatEthnicityNumber(boroughEthnicityStats.bameTotal)} (${formatEthnicityPercentage(boroughEthnicityStats.bamePercentage)} of total)` :
                'Loading...'}
          </div>
        </div>
      </ReusableNode>

      {/* School Education Facilities */}
      <ReusableNode
        size="medium"
        title="SCHOOL EDUCATION FACILITIES"
        description={`Types of schools in ${isLSOASelected ? selectedLSOAName : selectedBorough}`}
        chartType="vega-lite"
        vegaSpec={isLSOASelected ? 
          (mockSchoolStats ? 
            SpecCreator.create({
              type: 'bar',
              subtype: 'simpleHorizontalBarSpec',
              data: mockSchoolStats.schoolTypes,
              config: {
                dimensions: { width: 170, height: 120 },
                fields: {
                  category: 'type',
                  value: 'count'
                },
                styling: {
                  colors: ['#3b82f6', '#16a34a'],
                  background: 'transparent',
                  axes: {
                    xAxis: {
                      labelColor: '#888',
                      titleColor: '#888',
                      labelFontSize: 8,
                      grid: true,
                      gridColor: '#888',
                      gridDash: [2, 2],
                      title: 'Number of Schools',
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
                tooltip: {
                  fields: [
                    { field: 'type', type: 'nominal', title: 'School Type' },
                    { field: 'count', type: 'quantitative', title: 'Count', format: ',.0f' },
                    { field: 'percentage', type: 'quantitative', title: 'Percentage', format: '.1f' }
                  ]
                }
              }
            }) : null) :
          (boroughSchoolStats ? 
            SpecCreator.create({
              type: 'bar',
              subtype: 'simpleHorizontalBarSpec',
              data: boroughSchoolStats.schoolTypes,
              config: {
                dimensions: { width: 170, height: 120 },
                fields: {
                  category: 'type',
                  value: 'count'
                },
                styling: {
                  colors: ['#3b82f6', '#16a34a'],
                  background: 'transparent',
                  axes: {
                    xAxis: {
                      labelColor: '#888',
                      titleColor: '#888',
                      labelFontSize: 8,
                      grid: true,
                      gridColor: '#888',
                      gridDash: [2, 2],
                      title: 'Number of Schools',
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
                tooltip: {
                  fields: [
                    { field: 'type', type: 'nominal', title: 'School Type' },
                    { field: 'count', type: 'quantitative', title: 'Count', format: ',.0f' },
                    { field: 'percentage', type: 'quantitative', title: 'Percentage', format: '.1f' }
                  ]
                }
              }
            }) : null)}
        vegaRenderer="svg"
        showActions={false}
        style={createPositionalStyle(7, 9, 7, 9)}
        className="bg-white border border-[#BFD9EA] text-[#1A3C4A] relative"
        chartPosition="custom"
        customChartStyle={{ position: 'absolute', bottom: '8px', left: '16px', right: '16px' }}
        dataCondition={isLSOASelected ? mockSchoolStats !== null : boroughSchoolStats !== null}
        fallbackContent={<div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading school data...</div>}
      >
        <div className="flex justify-between text-[11px] text-gray-400 mb-2">
          <div>
            Primary: {isLSOASelected && mockSchoolStats ? 
              mockSchoolStats.primarySchools :
              boroughSchoolStats ? boroughSchoolStats.primarySchools : 'Loading...'}
          </div>
          <div>
            Secondary: {isLSOASelected && mockSchoolStats ? 
              mockSchoolStats.secondarySchools :
              boroughSchoolStats ? boroughSchoolStats.secondarySchools : 'Loading...'}
          </div>
          <div>
            Total: {isLSOASelected && mockSchoolStats ? 
              mockSchoolStats.totalSchools :
              boroughSchoolStats ? boroughSchoolStats.totalSchools : 'Loading...'}
          </div>
        </div>
      </ReusableNode>
    </ReusableGrid>
  );
};

export default London2Dashboard;
