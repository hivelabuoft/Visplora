// House Prices Data Processing
export interface HousePriceData {
  code: string;
  area: string;
  year: string;
  measure: string;
  value: number;
}

export interface HousePriceTimelineData {
  year: number;
  date: string;
  mean: number;
  median: number;
  sales: number;
  borough: string;
}

// Parse house price value (removes commas and converts to number)
const parsePrice = (priceString: string): number => {
  return parseInt(priceString.replace(/[",]/g, '')) || 0;
};

// Extract year from "Year ending Dec 2017" format
const extractYear = (yearString: string): number => {
  const match = yearString.match(/(\d{4})/);
  return match ? parseInt(match[1]) : 0;
};

// Generate mock data for years 2018-2023 based on trends
const generateMockData = (lastKnownData: HousePriceTimelineData[], borough: string): HousePriceTimelineData[] => {
  const mockData: HousePriceTimelineData[] = [];
  const lastYear = Math.max(...lastKnownData.map(d => d.year));
  const lastYearData = lastKnownData.find(d => d.year === lastYear);
  
  if (!lastYearData) return [];
  
  // Calculate average yearly growth rates from 2010-2017 for more realistic projections
  const recentData = lastKnownData.filter(d => d.year >= 2010).sort((a, b) => a.year - b.year);
  let meanGrowthRate = 0.04; // Default 4% growth
  let medianGrowthRate = 0.04;
  let salesGrowthRate = 0.02;
  
  if (recentData.length > 1) {
    const firstRecent = recentData[0];
    const lastRecent = recentData[recentData.length - 1];
    const years = lastRecent.year - firstRecent.year;
    
    meanGrowthRate = Math.pow(lastRecent.mean / firstRecent.mean, 1/years) - 1;
    medianGrowthRate = Math.pow(lastRecent.median / firstRecent.median, 1/years) - 1;
    salesGrowthRate = Math.pow(lastRecent.sales / firstRecent.sales, 1/years) - 1;
  }
  
  // Add some variability and market events
  for (let year = lastYear + 1; year <= 2023; year++) {
    const yearsFromLast = year - lastYear;
    let volatility = 1;
    
    // Market events simulation
    if (year === 2020) volatility = 0.95; // COVID impact
    if (year === 2021) volatility = 1.15; // Post-COVID boom
    if (year === 2022) volatility = 1.08; // Continued growth
    if (year === 2023) volatility = 0.98; // Market cooling
    
    // Add random factor (-5% to +5%)
    const randomFactor = 1 + (Math.random() - 0.5) * 0.1;
    
    const mean = Math.round(lastYearData.mean * Math.pow(1 + meanGrowthRate, yearsFromLast) * volatility * randomFactor);
    const median = Math.round(lastYearData.median * Math.pow(1 + medianGrowthRate, yearsFromLast) * volatility * randomFactor);
    const sales = Math.round(lastYearData.sales * Math.pow(1 + salesGrowthRate, yearsFromLast) * volatility * randomFactor);
    
    mockData.push({
      year,
      date: `${year}-12-01`,
      mean,
      median,
      sales,
      borough
    });
  }
  
  return mockData;
};

// Parse CSV data
export const parseHousePriceCSV = (csvText: string): HousePriceData[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const housePriceData: HousePriceData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      // Handle CSV parsing with quoted values
      const line = lines[i];
      const parts = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current);
      
      if (parts.length >= 5) {
        const housePriceRecord: HousePriceData = {
          code: parts[0].trim(),
          area: parts[1].trim(),
          year: parts[2].trim(),
          measure: parts[3].trim(),
          value: parsePrice(parts[4])
        };
        
        // Filter for London boroughs only (codes starting with E09)
        if (housePriceRecord.code.startsWith('E09') && housePriceRecord.value > 0) {
          housePriceData.push(housePriceRecord);
        }
      }
    } catch (error) {
      console.warn(`Error parsing line ${i}:`, error);
      continue;
    }
  }
  
  console.log(`Parsed ${housePriceData.length} house price records`);
  return housePriceData;
};

// Get house price timeline data for a specific borough
export const getHousePriceTimelineForBorough = (housePriceData: HousePriceData[], borough: string): HousePriceTimelineData[] => {
  const boroughData = housePriceData.filter(record => record.area === borough);
  
  // Group by year and measure
  const yearlyData: { [year: number]: { mean?: number, median?: number, sales?: number } } = {};
  
  boroughData.forEach(record => {
    const year = extractYear(record.year);
    if (year === 0) return;
    
    if (!yearlyData[year]) {
      yearlyData[year] = {};
    }
    
    if (record.measure === 'Mean') {
      yearlyData[year].mean = record.value;
    } else if (record.measure === 'Median') {
      yearlyData[year].median = record.value;
    } else if (record.measure === 'Sales') {
      yearlyData[year].sales = record.value;
    }
  });
  
  // Convert to timeline format
  const timeline: HousePriceTimelineData[] = Object.entries(yearlyData)
    .filter(([year, data]) => data.mean && data.median && data.sales)
    .map(([year, data]) => ({
      year: parseInt(year),
      date: `${year}-12-01`,
      mean: data.mean!,
      median: data.median!,
      sales: data.sales!,
      borough
    }))
    .sort((a, b) => a.year - b.year);
  
  // Add mock data for 2018-2023
  const mockData = generateMockData(timeline, borough);
  const completeTimeline = [...timeline, ...mockData].sort((a, b) => a.year - b.year);
  
  return completeTimeline;
};

// Load house price data
export const loadHousePriceData = async (): Promise<HousePriceData[]> => {
  try {
    console.log('Loading house price data from CSV...');
    const response = await fetch('/dataset/london/house-prices/land-registry-house-prices-borough.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch house price data: ${response.status}`);
    }
    
    const csvText = await response.text();
    const data = parseHousePriceCSV(csvText);
    console.log(`Successfully loaded ${data.length} house price records`);
    return data;
  } catch (error) {
    console.error('Error loading house price data:', error);
    return [];
  }
};

// Format price for display
export const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `£${(price / 1000000).toFixed(1)}M`;
  } else if (price >= 1000) {
    return `£${(price / 1000).toFixed(0)}K`;
  } else {
    return `£${price.toLocaleString()}`;
  }
};
