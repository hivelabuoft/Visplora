'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LinkableCard } from '@/components/ui/card-linkable';
import { boroughIdToName } from '../dashboard3/boroughMapping';
import { boroughMapSpec, smallBoroughMapSpec, populationTimelineChartSpec, incomeTimelineChartSpec, crimeBarChartComparisonSpec, crimePieChartComparisonSpec, countryOfBirthPieChartSpec, schoolEducationFacilitiesSpec, housePriceTimelineChartSpec, ethnicityMinorityGroupsBarChartSpec, gymPieChartSpec, libraryLineChartSpec } from '../dashboard3/vegaSpecs';

// Dynamically import LSOAMap with SSR disabled
const LSOAMap = dynamic(() => import('../dashboard3/LSOAMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading map...</div>
});

// Dynamically import VegaLite to avoid SSR issues with Set objects
const VegaLite = dynamic(() => import('react-vega').then(mod => ({ default: mod.VegaLite })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading chart...</div>
});

// Memoized VegaLite wrapper to prevent Set serialization issues
const MemoizedVegaLite = React.memo(({ spec, actions = false, signalListeners, style }: any) => {
  return <VegaLite spec={spec} actions={actions} signalListeners={signalListeners} style={style} />;
});
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
  getIncomeChangePercentage,
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

// Dashboard 3 - London Numbers Style Dashboard
const Dashboard3: React.FC = () => {
  // Dashboard filter state that AI can control
  const [dashboardFilters, setDashboardFilters] = useState({
    selectedBorough: 'Brent',
    selectedCrimeCategory: 'Anti-social behaviour',
    selectedBirthYear: 2023,
    selectedBaseYear: 2004,
    selectedLSOA: '',
    selectedLSOAName: ''
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

  const isLSOASelected = !!selectedLSOA;

  // --- LSOA SELECTION HANDLER ---
  const handleLSOASelect = (lsoaCode: string, lsoaName: string) => {
    updateDashboardFilter('selectedLSOA', lsoaCode);
    updateDashboardFilter('selectedLSOAName', lsoaName);
    setMockLibraries(generateMockLibrariesData());
    setMockSchoolStats(generateMockSchoolStats(lsoaName));
    // Filter ethnicity data for LSOA
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

  // --- CLEAR LSOA SELECTION ---
  const handleClearLSOA = () => {
    updateDashboardFilter('selectedLSOA', '');
    updateDashboardFilter('selectedLSOAName', '');
    setMockLibraries([]);
    setMockSchoolStats(null);
    setLsoaEthnicityStats(null);
  };
  const GYM_COLOR_RANGE = ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#1E40AF", "#F59E42", "#F472B6", "#F87171"];

  function useGymFacilities({ lsoa, borough, viewLevel }: { lsoa: string, borough: string, viewLevel: 'lsoa' | 'borough' }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
      let url = '';
      if (viewLevel === 'lsoa' && lsoa) {
        url = `/api/gym-facilities?lsoa=${encodeURIComponent(lsoa)}`;
      } else if (viewLevel === 'borough' && borough) {
        url = `/api/gym-facilities?borough=${encodeURIComponent(borough)}`;
      }
      if (!url) {
        setData([]);
        setLoading(false);
        return;
      }
      fetch(url)
        .then(res => res.json())
        .then(setData)
        .finally(() => setLoading(false));
    }, [lsoa, borough, viewLevel]);

    return { data, loading };
  }

  const [gymViewLevel, setGymViewLevel] = useState<'lsoa' | 'borough'>('lsoa');
  const { data: gymFacilities, loading: gymLoading } = useGymFacilities({
    lsoa: selectedLSOAName,
    borough: selectedBorough,
    viewLevel: gymViewLevel
  });

  return (
    <div className="london-dashboard p-6 rounded-lg text-[#1A3C4A]" style={{
      width: '100%',
      backgroundColor: '#E3F2FA',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Header */}
      {/* <div className='flex items-center justify-between mb-4' style={{ borderBottom: '1px solid #888' }}>
        <div>
          <h1 className="relative text-[32px] font-light tracking-widest mb-2 p-0 text-[#2B7A9B]">
            LONDON IN <span className="bg-[#2B7A9B] font-semibold bg-clip-text text-transparent">NUMBERS</span>
          </h1>
          <p className="absolute top-15 left-6 text-[14px] text-[#4A6A7B] font-light">
            Data Driven Insights for the Capital City - One Borough at a Time
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-[12px] text-[#4A6A7B] text-right">
            Charts based on data from the<br />
            <strong>2023</strong> census, where applicable
          </div>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">💬</div>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">📄</div>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">❓</div>
        </div>
      </div> */}
      {/* Grid Container */}
      <div className="grid grid-cols-8 grid-rows-8 gap-4" style={{ gridTemplateRows: '100px repeat(7, 110px)'}}>
        {/* Row 1: KPI Indicators (1x1 each) */}
        <div className="col-span-8 row-span-1 grid grid-cols-6 gap-4">
            {/* Borough Details */}
            <LinkableCard 
              className='text-center p-2 col-span-1 row-span-1 bg-white border border-[#BFD9EA] text-[#1A3C4A]'
              styles={{}}
              elementId="borough-details"
              elementName="Borough Details"
              elementType="borough"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className='flex items-center justify-center gap-2 h-full'>
                <div className='text-md font-semibold text-[#2B7A9B]'>
                  {selectedBorough}
                </div>
                <div className='w-[50px] h-[50px]'>
                  <MemoizedVegaLite 
                    spec={smallBoroughMapSpec(selectedBorough)}
                    actions={false}
                  />
                </div>
              </div>
            </LinkableCard>

            {/* Total Population */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-[#BFD9EA] text-[#1A3C4A]"
              styles={{}}
              elementId="total-population"
              elementName="Total Population"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-lg font-bold text-[#2B7A9B]">
                {isLoadingPopulation ? 'Loading...' : 
                 currentMetrics ? formatNumber(currentMetrics.population2023) : 'N/A'}
              </div>
              <div className="text-xs text-[#4A6A7B]">Borough Total Population</div>
            </LinkableCard>

            {/* Population Change */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-[#BFD9EA] text-[#1A3C4A]"
              styles={{}}
              elementId="population-change"
              elementName="Population Change"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="flex items-center gap-1">
                {isLoadingPopulation ? (
                  <span className="text-lg font-semibold text-[#2B7A9B]">Loading...</span>
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
                  <span className="text-lg font-semibold text-[#2B7A9B]">N/A</span>
                )}
              </div>
              <div className="text-center text-xs text-[#4A6A7B]">Population Difference from 2022</div>
            </LinkableCard>

            {/* Population Density */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-[#BFD9EA] text-[#1A3C4A]"
              styles={{}}
              elementId="population-density"
              elementName="Population Density"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-lg font-bold text-[#2B7A9B]">
                {isLoadingPopulation ? 'Loading...' : 
                 currentMetrics ? formatDensity(currentMetrics.populationDensityPer10000) : 'N/A'}
              </div>
              <div className="text-center text-xs text-[#4A6A7B]">Population Density <br />(persons per 10,000m²)</div>
            </LinkableCard>

            {/* Mean House Price */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-[#BFD9EA] text-[#1A3C4A]"
              styles={{}}
              elementId="mean-house-price"
              elementName="Mean House Price"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-lg font-bold text-[#2B7A9B]">{formatPrice(housePriceTimelineData[housePriceTimelineData.length - 1]?.mean || 0)}</div>
              <div className="text-xs text-[#4A6A7B]">Mean House Price</div>
            </LinkableCard>

            {/* Mean Household Income */}
            <LinkableCard 
              className="col-span-1 row-span-1 bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-[#BFD9EA] text-[#1A3C4A]"
              styles={{}}
              elementId="mean-household-income"
              elementName="Mean Household Income"
              elementType="kpi"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-lg font-bold text-[#2B7A9B]">
                {formatIncome(getCurrentMeanIncome(selectedBorough))}
              </div>
              <div className="text-xs text-[#4A6A7B]">Mean Household Income</div>
            </LinkableCard>
          </div>

          {/* Row 2: Large Map (4x4) + Right Side Charts (2x2 each) */}
          {/* LSOA Level Borough Map */}
          <LinkableCard 
            className="col-start-1 col-end-4 row-start-2 row-end-5 bg-white rounded-lg p-5 border border-[#BFD9EA] relative text-[#1A3C4A]"
            styles={{}}
            elementId="lsoa-map"
            elementName="LSOA Level Borough Map"
            elementType="map"
            onAddToSidebar={handleAddToSidebar}
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
              <button onClick={handleClearLSOA} className="absolute bottom-4 right-50 left-50 z-1000 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs">Clear Selection</button>
            )}
          </LinkableCard>

          {/* Middle: Borough Map */}
          <LinkableCard 
            className="col-start-4 col-end-7 row-start-2 row-end-5 bg-white rounded-lg p-5 border border-[#BFD9EA] relative text-[#1A3C4A]"
            styles={{}}
            elementId="borough-map"
            elementName="Borough Map"
            elementType="map"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="absolute top-4 left-5 text-sm font-semibold" style={{color: '#2B7A9B'}}>
              LONDON BOROUGH MAP
            </div>
            <div className="absolute top-4 right-5 text-xs text-gray-400">
              (Click to filter dashboard)
            </div>
            
            {/* Map Content */}
            <div className="absolute top-2 left-12 right-5 bottom-5" title='Click outside to reset selection'>
              <MemoizedVegaLite 
                spec={boroughMapSpec} 
                actions={false}
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
              />
            </div>

            {/* Borough Filter */}
            <div className="absolute bottom-4 left-4 text-gray-400">
              <div className="text-xs text-gray-400">Total Population</div>
              <div className="text-xl font-bold text-[#2B7A9B]">
                {isLoadingPopulation ? 'Loading...' : 
                 totalLondonPopulation > 0 ? 
                   (totalLondonPopulation / 1000000).toFixed(2) + 'M' : 
                   'N/A'}
              </div>
            </div>
          </LinkableCard>

          {/* Bottom Left: Population Growth & Projections and Gyms in LSOA */}
          {!isLSOASelected ? (
            <LinkableCard 
              className="col-start-3 col-end-5 row-start-7 row-end-9 bg-white rounded-lg p-4 border border-[#BFD9EA] relative overflow-hidden text-[#1A3C4A]"
              styles={{}}
              elementId="population-growth-projections"
              elementName="Population Growth & Projections"
              elementType="chart"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-xs font-semibold" style={{color: '#2B7A9B'}}>
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
                  <MemoizedVegaLite
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
          ) : (
            <LinkableCard 
              className="col-start-3 col-end-5 row-start-7 row-end-9 bg-white rounded-lg p-4 border border-[#BFD9EA] text-[#1A3C4A]"
              styles={{}}
              elementId="lsoa-gyms"
              elementName="Gyms in LSOA"
              elementType="chart"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-xs font-semibold" style={{color: '#2B7A9B'}}>SPORTS AND RECREATION FACILITIES</div>
              <div className="text-xs text-gray-400">Counts of facilities in {gymViewLevel === 'lsoa' ? selectedLSOAName : selectedBorough}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Select to filter:</span>
                <button onClick={() => setGymViewLevel('lsoa')} className={`px-2 py-0.5 rounded text-xs ${gymViewLevel === 'lsoa' ? 'bg-purple-600 text-white hover:bg-purple-700 font-semibold' : 'bg-gray-600 text-gray-200 hover:bg-gray-700'}`}>LSOA</button>
                <button onClick={() => setGymViewLevel('borough')} className={`px-2 py-0.5 rounded text-xs ${gymViewLevel === 'borough' ? 'bg-purple-600 text-white hover:bg-purple-700 font-semibold' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}>Borough</button>
              </div>
              { gymLoading ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading...</div>
              ) : gymFacilities && gymFacilities.length > 0 ? (
                <div className={`absolute bottom-2 left-3 flex items-center ${gymViewLevel == "lsoa" ? 'gap-1' : 'gap-4'} flex-wrap`}>
                  <MemoizedVegaLite spec={gymPieChartSpec(gymFacilities, GYM_COLOR_RANGE)} actions={false} />
                  <div className="">
                    {gymFacilities.slice(0, 10).map((f: { facility_type: string; count: number }, i: number) => (
                      <div key={f.facility_type} className={`flex items-center gap-1 ${gymViewLevel == "lsoa" ? 'text-xs' : 'text-[9px]'} text-gray-500`}>
                        <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: GYM_COLOR_RANGE[i % GYM_COLOR_RANGE.length] }}></span>
                        <span>{f.facility_type}</span>
                      </div>
                    ))}
                    {gymFacilities.length > 10 && (
                      <div className={`text-xs ${gymViewLevel == "lsoa" ? 'text-gray-300' : 'text-[9px] text-gray-500'}`}>
                        +{gymFacilities.length - 10} more...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  No such facilities exist in { selectedLSOAName }
                </div>
              )}
            </LinkableCard>
          )}
          {/* Top Far Right: Borough Crime Stats */}
          <LinkableCard 
            className="col-start-7 col-end-9 row-start-2 row-end-5 bg-white rounded-lg p-4 border border-[#BFD9EA] flex flex-col text-[#1A3C4A]"
            styles={{ position: 'relative', zIndex: 1 }}
            elementId="borough-crime-stats"
            elementName="Borough Crime Stats"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-sm font-semibold" style={{color: '#2B7A9B'}}>
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
                        : 'bg-gray-200 text-gray-700 font-medium text-[9px] hover:bg-gray-300'
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
                <MemoizedVegaLite
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
            className="col-start-4 col-end-7 row-start-5 row-end-7 bg-white rounded-lg p-4 border border-[#BFD9EA] text-[#1A3C4A]"
            styles={{}}
            elementId="mean-income-timeline"
            elementName="Mean Income Timeline"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-sm font-semibold" style={{color: '#2B7A9B'}}>
              INCOME TRENDS OVER TIME
            </div>
            <div className="text-xs text-gray-400 mb-1">
              Mean and median income for {selectedBorough}
            </div>
            
            {/* Custom Legend */}
            <div className="flex justify-center items-center gap-4 text-[10px] text-gray-300 mb-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span className='text-gray-500'>Mean Income</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className='text-gray-500'>Median Income</span>
              </div>
            </div>
            
            {/* Vega-Lite Line Chart */}
            <div className="absolute -bottom-1 left-4 right-4">
              {incomeTimelineData.length > 0 ? (
                <MemoizedVegaLite
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
            className="col-start-7 col-end-9 row-start-5 row-end-7 bg-white rounded-lg p-4 border border-[#BFD9EA] text-[#1A3C4A]"
            styles={{}}
            elementId="borough-crime-categories"
            elementName="Borough Crime Categories"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-sm font-semibold" style={{color: '#2B7A9B'}}>
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
                <MemoizedVegaLite
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
            className="col-start-7 col-end-9 row-start-7 row-end-9 bg-white rounded-lg p-4 border border-[#BFD9EA] relative text-[#1A3C4A]"
            styles={{}}
            elementId="school-education-facilities"
            elementName="School Education Facilities"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-xs font-semibold" style={{color: '#2B7A9B'}}>
              SCHOOL EDUCATION FACILITIES
            </div>
            <div className="text-xs text-gray-400">
              Types of schools in {isLSOASelected ? selectedLSOAName : selectedBorough}
            </div>
            
            {/* School Type Summary */}
            <div className="flex justify-between text-[11px] text-gray-400 mb-2">
              <div>
                Primary: {isLSOASelected ? mockSchoolStats?.primarySchools || 0 : boroughSchoolStats?.primarySchools || 0}
              </div>
              <div>
                Secondary: {isLSOASelected ? mockSchoolStats?.secondarySchools || 0 : boroughSchoolStats?.secondarySchools || 0}
              </div>
              <div>
                Total: {isLSOASelected ? mockSchoolStats?.totalSchools || 0 : boroughSchoolStats?.totalSchools || 0}
              </div>
            </div>
            
            {/* Vega-Lite School Bar Chart */}
            <div className="absolute bottom-2 left-4 right-4">
              {isLSOASelected ? (
                mockSchoolStats ? (
                  <MemoizedVegaLite spec={schoolEducationFacilitiesSpec(mockSchoolStats)} actions={false} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-xs">No school data available</div>
                )
              ) : (
                boroughSchoolStats ? (
                  <MemoizedVegaLite spec={schoolEducationFacilitiesSpec(boroughSchoolStats)} actions={false} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-xs">No school data available</div>
                )
              )}
            </div>
          </LinkableCard>

          {/* House Price Timeline Chart */}
          <LinkableCard 
            className="col-start-1 col-end-4 row-start-5 row-end-7 bg-white rounded-lg p-4 border border-[#BFD9EA] text-[#1A3C4A]"
            styles={{}}
            elementId="house-price-timeline"
            elementName="House Price Timeline"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-sm font-semibold" style={{color: '#2B7A9B'}}>
              HOUSE PRICE TRENDS
            </div>
            <div className="text-xs text-gray-400 mb-1">
              Mean, median prices & sales volume for {selectedBorough}
            </div>            
            
            {/* Custom Legend */}
            <div className="flex justify-center items-center gap-4 text-[10px] text-gray-300">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span className='text-gray-500'>Mean Price</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className='text-gray-500'>Median Price</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-cyan-500"></div>
                <span className='text-gray-500'>Sales Volume</span>
              </div>
            </div>
            
            {/* Vega-Lite House Price Timeline Chart */}
            <div className="absolute -bottom-1 left-4 right-4">
              {isLoadingHousePrice ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  Loading house price data...
                </div>
              ) : housePriceTimelineData.length > 0 ? (
                <MemoizedVegaLite
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
            className="col-start-5 col-end-7 row-start-7 row-end-9 bg-white rounded-lg p-4 border border-[#BFD9EA] text-[#1A3C4A]"
            styles={{}}
            elementId="ethnicity-minority-groups"
            elementName="Ethnicity Minority Groups"
            elementType="chart"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="text-xs font-semibold" style={{color: '#2B7A9B'}}>
              ETHNICITY MINORITY GROUPS
            </div>
            <div className="text-xs text-gray-400">
              Breakdown for {isLSOASelected ? selectedLSOAName : selectedBorough}
            </div>
            
            {/* BAME Statistics */}
            <div className="flex justify-between text-[11px] text-gray-400 mb-2">
              <div>
                BAME Population: {isLSOASelected ? (lsoaEthnicityStats ? formatEthnicityNumber(lsoaEthnicityStats.bameTotal) : 'N/A') : (boroughEthnicityStats ? formatEthnicityNumber(boroughEthnicityStats.bameTotal) : 'N/A')} ({isLSOASelected ? (lsoaEthnicityStats ? formatEthnicityPercentage(lsoaEthnicityStats.bamePercentage) : 'N/A') : (boroughEthnicityStats ? formatEthnicityPercentage(boroughEthnicityStats.bamePercentage) : 'N/A')} of total)
              </div>
              <div></div>
            </div>
            
            {/* Vega-Lite Ethnicity Bar Chart */}
            <div className="absolute bottom-2 left-4 right-4">
              {isLSOASelected ? (
                lsoaEthnicityStats && lsoaEthnicityStats.minorityGroups.length > 0 ? (
                  <MemoizedVegaLite spec={ethnicityMinorityGroupsBarChartSpec(lsoaEthnicityStats)} actions={false} />
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-xs">No ethnicity data available</div>
                )
              ) : (
                boroughEthnicityStats && boroughEthnicityStats.minorityGroups.length > 0 ? (
                  <MemoizedVegaLite spec={ethnicityMinorityGroupsBarChartSpec(boroughEthnicityStats)} actions={false} />
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-xs">No ethnicity data available</div>
                )
              )}
            </div>
            
            <div className="text-[8px] text-gray-400 absolute bottom-1 left-4">
              BAME = Black, Asian & Minority Ethnicity
            </div>
          </LinkableCard>

          {/* Bottom Far Left: Library Chart (LSOA) or Country of Birth (borough) */}
          {!isLSOASelected ? (
            <LinkableCard 
              className="col-start-1 col-end-3 row-start-7 row-end-9 bg-white rounded-lg p-4 border border-[#BFD9EA] text-[#1A3C4A]"
              styles={{}}
              elementId="country-of-birth"
              elementName="Country of Birth"
              elementType="chart"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-xs font-semibold" style={{color: '#2B7A9B'}}>
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
                        : 'bg-gray-200 text-gray-600 font-regular hover:bg-gray-300'
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
                    <MemoizedVegaLite
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
                        <span className="text-[11px] text-gray-500">
                          {region.region}: {region.percentage.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </LinkableCard>
          ) : (
            <LinkableCard 
              className="col-start-1 col-end-3 row-start-7 row-end-9 bg-white rounded-lg p-4 border border-[#BFD9EA] text-[#1A3C4A]"
              styles={{}}
              elementId="lsoa-libraries"
              elementName="Libraries in LSOA"
              elementType="chart"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-xs font-semibold" style={{color: '#2B7A9B'}}>LIBRARY VISITS</div>
              <div className="text-xs text-gray-400 mb-1">Visits per 1,000 people | {selectedLSOAName}</div>
              <div className="absolute bottom-0 left-4 right-4">
                <MemoizedVegaLite spec={libraryLineChartSpec(mockLibraries)} actions={false} />
              </div>
            </LinkableCard>
          )}
        </div>
      </div>
  );
};

export default Dashboard3;
