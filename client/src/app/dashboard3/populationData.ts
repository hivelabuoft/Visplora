// Population data interface based on CSV structure
export interface PopulationData {
  Code: string;
  Name: string;
  Year: number;
  Source: string;
  Population: number;
  Inland_Area_Hectares: number;
  Total_Area_Hectares: number;
  Population_per_hectare: number;
  Square_Kilometres: number;
  Population_per_square_kilometre: number;
}

// Population metrics for each borough
export interface BoroughPopulationMetrics {
  name: string;
  population2023: number;
  population2022: number;
  population2011: number;
  populationChange: number;
  populationChangePercent: number;
  populationChangeFromPrevYear: number;
  populationChangeFromPrevYearPercent: number;
  populationDensity: number;
  populationDensityPer10000: number;
  areaKm2: number;
}

// Load and parse population data
export const loadPopulationData = async (): Promise<PopulationData[]> => {
  try {
    const response = await fetch('/dataset/london/population/housing-density-borough.csv');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    const data: PopulationData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',');
        if (values.length >= headers.length) {
          data.push({
            Code: values[0],
            Name: values[1],
            Year: parseInt(values[2]),
            Source: values[3],
            Population: parseInt(values[4]),
            Inland_Area_Hectares: parseFloat(values[5]),
            Total_Area_Hectares: parseFloat(values[6]),
            Population_per_hectare: parseFloat(values[7]),
            Square_Kilometres: parseFloat(values[8]),
            Population_per_square_kilometre: parseFloat(values[9])
          });
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error loading population data:', error);
    return [];
  }
};

// Process population data for dashboard use
export const processPopulationData = (data: PopulationData[]): Map<string, BoroughPopulationMetrics> => {
  const boroughMetrics = new Map<string, BoroughPopulationMetrics>();
  
  // Group data by borough
  const boroughData = new Map<string, PopulationData[]>();
  data.forEach(record => {
    if (!boroughData.has(record.Name)) {
      boroughData.set(record.Name, []);
    }
    boroughData.get(record.Name)!.push(record);
  });
  
  // Calculate metrics for each borough
  boroughData.forEach((records, boroughName) => {
    // Get latest data (2023), previous year (2022), and earliest available data (1999) for comparison
    const latest2023 = records.find(r => r.Year === 2023);
    const data2022 = records.find(r => r.Year === 2022);
    const data2011 = records.find(r => r.Year === 2011);
    const data1999 = records.find(r => r.Year === 1999);
    
    if (latest2023 && data2022 && data2011) {
      // Use 1999 data for long-term change if available, otherwise fall back to 2011
      const baselineData = data1999 || data2011;
      const populationChange = latest2023.Population - baselineData.Population;
      const populationChangePercent = (populationChange / baselineData.Population) * 100;
      
      const populationChangeFromPrevYear = latest2023.Population - data2022.Population;
      const populationChangeFromPrevYearPercent = (populationChangeFromPrevYear / data2022.Population) * 100;
      
      boroughMetrics.set(boroughName, {
        name: boroughName,
        population2023: latest2023.Population,
        population2022: data2022.Population,
        population2011: data2011.Population,
        populationChange: populationChange,
        populationChangePercent: populationChangePercent,
        populationChangeFromPrevYear: populationChangeFromPrevYear,
        populationChangeFromPrevYearPercent: populationChangeFromPrevYearPercent,
        populationDensity: latest2023.Population_per_square_kilometre,
        populationDensityPer10000: latest2023.Population_per_hectare,
        areaKm2: latest2023.Square_Kilometres
      });
    }
  });
  
  return boroughMetrics;
};

// Format number with commas for display
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Format percentage for display
export const formatPercentage = (num: number): string => {
  return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
};

// Format density for display (per 10,000 m²)
export const formatDensity = (densityPerHectare: number): string => {
  return densityPerHectare.toFixed(1);
};

// Population timeline data point interface
export interface PopulationTimelineData {
  year: number;
  population: number;
  type: 'Historical' | 'Projected';
}

// Generate population timeline data including all historical data from 1999-2023 and projections 2024-2033
export const generatePopulationTimelineData = (data: PopulationData[], boroughName: string): PopulationTimelineData[] => {
  const boroughRecords = data.filter(record => record.Name === boroughName);
  const timelineData: PopulationTimelineData[] = [];
  
  // Get all available historical data from 1999-2023 (25 years of data)
  const historicalYears = Array.from({length: 25}, (_, i) => 1999 + i); // 1999 to 2023
  
  historicalYears.forEach(year => {
    const record = boroughRecords.find(r => r.Year === year);
    if (record) {
      timelineData.push({
        year: year,
        population: record.Population,
        type: 'Historical'
      });
    }
  });
  
  // Generate projections (2024-2033) based on recent growth trends
  const latest2023 = boroughRecords.find(r => r.Year === 2023);
  const data2022 = boroughRecords.find(r => r.Year === 2022);
  const data2021 = boroughRecords.find(r => r.Year === 2021);
  
  if (latest2023) {
    // Calculate average growth rate from available recent data
    let avgGrowthRate = 0.005; // default conservative growth rate
    
    if (data2022 && data2021) {
      const growth2022to2023 = (latest2023.Population - data2022.Population) / data2022.Population;
      const growth2021to2022 = (data2022.Population - data2021.Population) / data2021.Population;
      avgGrowthRate = (growth2022to2023 + growth2021to2022) / 2;
      
      // Cap the growth rate to reasonable bounds
      avgGrowthRate = Math.max(-0.01, Math.min(0.02, avgGrowthRate));
    }
    
    // Generate projections for 2024-2033
    const projectionYears = Array.from({length: 10}, (_, i) => 2024 + i); // 2024 to 2033
    
    projectionYears.forEach((year, index) => {
      const yearsFromBase = index + 1;
      const projectedPopulation = Math.round(latest2023.Population * Math.pow(1 + avgGrowthRate, yearsFromBase));
      
      timelineData.push({
        year: year,
        population: projectedPopulation,
        type: 'Projected'
      });
    });
  }
  
  return timelineData.sort((a, b) => a.year - b.year);
};

// Utility functions for dashboard
export const getBoroughMetrics = (populationMetrics: Map<string, BoroughPopulationMetrics>, borough: string): BoroughPopulationMetrics | null => {
  return populationMetrics.get(borough) || null;
};

export const getTotalLondonPopulation = (populationMetrics: Map<string, BoroughPopulationMetrics>): number => {
  let total = 0;
  populationMetrics.forEach((metrics) => {
    total += metrics.population2023;
  });
  return total;
};

export const getPopulationTimelineDataForBorough = (populationRawData: PopulationData[], borough: string): PopulationTimelineData[] => {
  if (populationRawData.length === 0) return [];
  return generatePopulationTimelineData(populationRawData, borough);
};

export const checkLsoaDataAvailability = async (selectedBorough: string): Promise<boolean> => {
  try {
    const url = `/data/lsoa-london/${selectedBorough}.json`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error('Error checking LSOA data:', error);
    return false;
  }
};
