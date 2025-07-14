// London CSV Data Loader Utility
export interface LondonDataFile {
  id: string;
  name: string;
  path: string;
  category: string;
  description: string;
  size: number;
  lastModified?: string;
  columns: string[];
  sampleData: any[];
  totalRecords: number;
  isLoaded: boolean;
  error?: string;
}

export interface LondonDataCategory {
  name: string;
  description: string;
  files: LondonDataFile[];
}

// Known CSV files in London directory structure
const LONDON_CSV_FILES: { [key: string]: LondonDataFile[] } = {
  'crime-rates': [
    {
      id: 'london-crime-data-2022-2023',
      name: 'London Crime Data 2022-2023',
      path: '/dataset/london/crime-rates/london_crime_data_2022_2023.csv',
      category: 'crime-rates',
      description: 'Crime statistics for London 2022-2023',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'ethnicity': [
    {
      id: 'ethnic-group',
      name: 'Ethnic Group Distribution',
      path: '/dataset/london/ethnicity/Ethnic group.csv',
      category: 'ethnicity',
      description: 'Ethnic group distribution across London boroughs',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'country-of-births': [
    {
      id: 'cob-borough',
      name: 'Country of Birth by Borough',
      path: '/dataset/london/country-of-births/cob-borough.csv',
      category: 'country-of-births',
      description: 'Population by country of birth across London boroughs',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'population': [
    {
      id: 'population-1801-2021',
      name: 'Population 1801 to 2021',
      path: '/dataset/london/population/population 1801 to 2021.csv',
      category: 'population',
      description: 'Historical population data from 1801 to 2021',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'housing-density-borough',
      name: 'Housing Density by Borough',
      path: '/dataset/london/population/housing-density-borough.csv',
      category: 'population',
      description: 'Housing density statistics by borough',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'income': [
    {
      id: 'income-of-tax-payers',
      name: 'Income of Tax Payers',
      path: '/dataset/london/income/income-of-tax-payers.csv',
      category: 'income',
      description: 'Income statistics for tax payers',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'house-prices': [
    {
      id: 'land-registry-house-prices-borough',
      name: 'Land Registry House Prices by Borough',
      path: '/dataset/london/house-prices/land-registry-house-prices-borough.csv',
      category: 'house-prices',
      description: 'Land registry house price statistics by borough',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'schools-colleges': [
    {
      id: 'school-information-2022-2023',
      name: 'School Information 2022-2023',
      path: '/dataset/london/schools-colleges/2022-2023_england_school_information.csv',
      category: 'schools-colleges',
      description: 'School information for England 2022-2023',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'school-information-2021-2022',
      name: 'School Information 2021-2022',
      path: '/dataset/london/schools-colleges/2021-2022_england_school_information.csv',
      category: 'schools-colleges',
      description: 'School information for England 2021-2022',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'england-spine-2010-2011',
      name: 'England Spine 2010-2011',
      path: '/dataset/london/schools-colleges/2010-2011_england_spine.csv',
      category: 'schools-colleges',
      description: 'England spine data for 2010-2011',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'vehicles': [
    {
      id: 'vehicles-licensed-2023',
      name: 'Licensed Vehicles 2023',
      path: '/dataset/london/vehicles/vehicles-licensed-type-borough_2023.csv',
      category: 'vehicles',
      description: 'Licensed vehicles by type and borough for 2023',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'vehicles-licensed-2022',
      name: 'Licensed Vehicles 2022',
      path: '/dataset/london/vehicles/vehicles-licensed-type-borough_2022.csv',
      category: 'vehicles',
      description: 'Licensed vehicles by type and borough for 2022',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'vehicles-licensed-2021',
      name: 'Licensed Vehicles 2021',
      path: '/dataset/london/vehicles/vehicles-licensed-type-borough_2021.csv',
      category: 'vehicles',
      description: 'Licensed vehicles by type and borough for 2021',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'vehicles-licensed-2020',
      name: 'Licensed Vehicles 2020',
      path: '/dataset/london/vehicles/vehicles-licensed-type-borough_2020.csv',
      category: 'vehicles',
      description: 'Licensed vehicles by type and borough for 2020',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'vehicles-licensed-2019',
      name: 'Licensed Vehicles 2019',
      path: '/dataset/london/vehicles/vehicles-licensed-type-borough_2019.csv',
      category: 'vehicles',
      description: 'Licensed vehicles by type and borough for 2019',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'restaurants': [
    {
      id: 'licensed-restaurants-units',
      name: 'Licensed Restaurants Units',
      path: '/dataset/london/restaurants/licensed-restaurants-cafes-borough_Restaurants-units.csv',
      category: 'restaurants',
      description: 'Licensed restaurants and cafes units by borough',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'licensed-restaurants-employment',
      name: 'Licensed Restaurants Employment',
      path: '/dataset/london/restaurants/licensed-restaurants-cafes-borough_Restaurants-employment.csv',
      category: 'restaurants',
      description: 'Licensed restaurants and cafes employment by borough',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'unlicensed-restaurants-units',
      name: 'Unlicensed Restaurants Units',
      path: '/dataset/london/restaurants/unlicensed-restaurants-cafes-borough_Unlicensed-Restaurants-units.csv',
      category: 'restaurants',
      description: 'Unlicensed restaurants and cafes units by borough',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'unlicensed-restaurants-emp',
      name: 'Unlicensed Restaurants Employment',
      path: '/dataset/london/restaurants/unlicensed-restaurants-cafes-borough_Unlicensed-Restaurants-emp.csv',
      category: 'restaurants',
      description: 'Unlicensed restaurants and cafes employment by borough',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'private-rent': [
    {
      id: 'voa-average-rent-summary',
      name: 'VOA Average Rent Summary',
      path: '/dataset/london/private-rent/voa-average-rent-borough_Summary.csv',
      category: 'private-rent',
      description: 'VOA average rent summary by borough',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'voa-average-rent-raw-data',
      name: 'VOA Average Rent Raw Data',
      path: '/dataset/london/private-rent/voa-average-rent-borough_Raw-data.csv',
      category: 'private-rent',
      description: 'VOA average rent raw data by borough',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    },
    {
      id: 'voa-average-rent-pivot-table',
      name: 'VOA Average Rent Pivot Table',
      path: '/dataset/london/private-rent/voa-average-rent-borough_Pivot-Table.csv',
      category: 'private-rent',
      description: 'VOA average rent pivot table by borough',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'gyms': [
    {
      id: 'london-gym-facilities-2024',
      name: 'London Gym Facilities 2024',
      path: '/dataset/london/gyms/london_gym_facilities_2024.csv',
      category: 'gyms',
      description: 'London gym facilities data for 2024',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ],
  'libraries': [
    {
      id: 'libraries-by-areas-chart',
      name: 'Libraries by Areas Chart',
      path: '/dataset/london/libraries/libraries-by-areas-chart.csv',
      category: 'libraries',
      description: 'Libraries by areas chart data',
      size: 0,
      columns: [],
      sampleData: [],
      totalRecords: 0,
      isLoaded: false
    }
  ]
};

// Category descriptions
const CATEGORY_DESCRIPTIONS: { [key: string]: string } = {
  'crime-rates': 'Crime statistics and safety data across London boroughs',
  'ethnicity': 'Ethnic group distribution and diversity statistics',
  'country-of-births': 'Population demographics by country of birth',
  'population': 'Population counts, density, and demographic information',
  'income': 'Income statistics, wages, and economic indicators',
  'house-prices': 'Property prices, housing market data',
  'schools-colleges': 'Educational institutions and performance data',
  'vehicles': 'Vehicle registration and transportation statistics',
  'restaurants': 'Food service establishments and employment data',
  'private-rent': 'Private rental market statistics',
  'gyms': 'Fitness facilities and health infrastructure',
  'libraries': 'Library services and public facilities'
};

// Parse CSV data with better handling of quotes and special characters
export const parseCSV = (csvText: string): { headers: string[], data: any[] } => {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return { headers: [], data: [] };
  
  // Simple CSV parser that handles basic quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };
  
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const values = parseCSVLine(line).map(v => v.replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }
  
  return { headers, data };
};

// Load a specific CSV file
export const loadCSVFile = async (file: LondonDataFile): Promise<LondonDataFile> => {
  try {
    const response = await fetch(file.path);
    if (!response.ok) {
      throw new Error(`Failed to load ${file.name}: ${response.status}`);
    }
    
    const csvText = await response.text();
    const { headers, data } = parseCSV(csvText);
    
    return {
      ...file,
      columns: headers,
      sampleData: data.slice(10, 15), // Skip first 10 rows and take next 5 rows as sample
      totalRecords: data.length,
      isLoaded: true,
      size: csvText.length
    };
  } catch (error) {
    return {
      ...file,
      isLoaded: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Load all CSV files metadata
export const loadAllLondonData = async (): Promise<LondonDataCategory[]> => {
  const categories: LondonDataCategory[] = [];
  
  for (const [categoryName, files] of Object.entries(LONDON_CSV_FILES)) {
    const loadedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          return await loadCSVFile(file);
        } catch (error) {
          console.warn(`Failed to load ${file.name}:`, error);
          return {
            ...file,
            isLoaded: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    // Only include categories that have at least one successfully loaded file
    const successfulFiles = loadedFiles.filter(file => file.isLoaded || !file.error);
    
    if (successfulFiles.length > 0) {
      categories.push({
        name: categoryName,
        description: CATEGORY_DESCRIPTIONS[categoryName] || 'London data category',
        files: loadedFiles // Include all files, even failed ones for debugging
      });
    }
  }
  
  return categories;
};

// Get full data for a specific file
export const getFullCSVData = async (file: LondonDataFile): Promise<any[]> => {
  try {
    const response = await fetch(file.path);
    if (!response.ok) {
      throw new Error(`Failed to load ${file.name}: ${response.status}`);
    }
    
    const csvText = await response.text();
    const { data } = parseCSV(csvText);
    return data;
  } catch (error) {
    console.error('Error loading full CSV data:', error);
    return [];
  }
};

// Search for files by name or category
export const searchLondonData = (categories: LondonDataCategory[], query: string): LondonDataFile[] => {
  const results: LondonDataFile[] = [];
  const lowerQuery = query.toLowerCase();
  
  categories.forEach(category => {
    category.files.forEach(file => {
      if (
        file.name.toLowerCase().includes(lowerQuery) ||
        file.description.toLowerCase().includes(lowerQuery) ||
        file.category.toLowerCase().includes(lowerQuery) ||
        file.columns.some(col => col.toLowerCase().includes(lowerQuery))
      ) {
        results.push(file);
      }
    });
  });
  
  return results;
};

// Generate context summary for AI
export const generateLondonDataContext = (categories: LondonDataCategory[]): string => {
  let context = 'AVAILABLE LONDON DATASETS:\n\n';
  
  categories.forEach(category => {
    context += `📁 ${category.name.toUpperCase()}\n`;
    context += `Description: ${category.description}\n`;
    context += `Files (${category.files.length}):\n`;
    
    category.files.forEach(file => {
      const status = file.isLoaded ? '✅' : file.error ? '❌' : '⏳';
      context += `  ${status} ${file.name} (${file.totalRecords} records)\n`;
      if (file.isLoaded && file.columns.length > 0) {
        context += `     Columns: ${file.columns.slice(0, 5).join(', ')}${file.columns.length > 5 ? '...' : ''}\n`;
      }
      if (file.error) {
        context += `     Error: ${file.error}\n`;
      }
    });
    context += '\n';
  });
  
  return context;
};
