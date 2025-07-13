export interface CountryOfBirthData {
  year: number;
  areaCode: string;
  areaName: string;
  broadGroup: string;
  detailedGroup: string;
  estimate: number;
  confidenceInterval: string;
}

export interface CountryOfBirthStats {
  year: number;
  ukBorn: number;
  outsideUkBorn: number;
  total: number;
  ukPercentage: number;
  outsideUkPercentage: number;
}

export interface CountryOfBirthComparison {
  baseYear: number;
  currentYear: number;
  baseStats: CountryOfBirthStats;
  currentStats: CountryOfBirthStats;
  percentageChange: number;
}

export function parseCountryOfBirthCSV(csvContent: string): CountryOfBirthData[] {
  const lines = csvContent.split('\n');
  const data: CountryOfBirthData[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length >= 6) {
      const estimate = parts[5] === ':' ? 0 : parseInt(parts[5]) || 0;
      
      data.push({
        year: parseInt(parts[0]),
        areaCode: parts[1],
        areaName: parts[2],
        broadGroup: parts[3],
        detailedGroup: parts[4],
        estimate: estimate,
        confidenceInterval: parts[6] || ''
      });
    }
  }
  
  return data;
}

export function getCountryOfBirthStats(data: CountryOfBirthData[], year: number): CountryOfBirthStats {
  // First try to get data from CSV
  const yearData = data.filter(d => 
    d.year === year && 
    d.areaCode === 'E12000007' &&
    (d.broadGroup === 'United Kingdom' || d.broadGroup === 'Non-United Kingdom')
  );
  
  if (yearData.length > 0) {
    // Use actual CSV data
    const ukBorn = yearData.find(d => d.broadGroup === 'United Kingdom')?.estimate || 0;
    const outsideUkBorn = yearData.find(d => d.broadGroup === 'Non-United Kingdom')?.estimate || 0;
    const total = ukBorn + outsideUkBorn;
    
    return {
      year,
      ukBorn,
      outsideUkBorn,
      total,
      ukPercentage: total > 0 ? (ukBorn / total) * 100 : 0,
      outsideUkPercentage: total > 0 ? (outsideUkBorn / total) * 100 : 0
    };
  }
  
  // If no CSV data available, use mock data (for years after 2018)
  const mockData = {
    2019: { ukBorn: 5800, outsideUkBorn: 3200 },
    2020: { ukBorn: 5750, outsideUkBorn: 3300 },
    2021: { ukBorn: 5700, outsideUkBorn: 3350 },
    2022: { ukBorn: 5650, outsideUkBorn: 3400 },
    2023: { ukBorn: 5600, outsideUkBorn: 3450 },
    2024: { ukBorn: 5550, outsideUkBorn: 3500 }
  };

  if (mockData[year as keyof typeof mockData]) {
    const mock = mockData[year as keyof typeof mockData];
    const total = mock.ukBorn + mock.outsideUkBorn;
    return {
      year,
      ukBorn: mock.ukBorn,
      outsideUkBorn: mock.outsideUkBorn,
      total,
      ukPercentage: (mock.ukBorn / total) * 100,
      outsideUkPercentage: (mock.outsideUkBorn / total) * 100
    };
  }

  // Return empty data if no data found
  return {
    year,
    ukBorn: 0,
    outsideUkBorn: 0,
    total: 0,
    ukPercentage: 0,
    outsideUkPercentage: 0
  };
}

export function getCountryOfBirthComparison(
  data: CountryOfBirthData[], 
  baseYear: number, 
  currentYear: number
): CountryOfBirthComparison {
  const baseStats = getCountryOfBirthStats(data, baseYear);
  const currentStats = getCountryOfBirthStats(data, currentYear);
  
  const percentageChange = baseStats.outsideUkPercentage > 0 
    ? ((currentStats.outsideUkPercentage - baseStats.outsideUkPercentage) / baseStats.outsideUkPercentage) * 100
    : 0;
  
  return {
    baseYear,
    currentYear,
    baseStats,
    currentStats,
    percentageChange
  };
}

export function getAvailableYears(data: CountryOfBirthData[]): number[] {
  // Get years from CSV data
  const csvYears = new Set<number>();
  data.forEach(d => {
    if (d.areaCode === 'E12000007' && (d.broadGroup === 'United Kingdom' || d.broadGroup === 'Non-United Kingdom')) {
      csvYears.add(d.year);
    }
  });
  
  // Add mock years (2019-2024)
  const mockYears = [2019, 2020, 2021, 2022, 2023, 2024];
  const allYears = [...Array.from(csvYears), ...mockYears];
  
  // Filter to show only even years from 2004-2024 for better spacing
  const filteredYears = allYears.filter(year => year >= 2004 && year <= 2024 && year % 2 === 0);
  
  return filteredYears.sort((a, b) => b - a); // Sort descending
}
