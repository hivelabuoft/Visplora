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

// New: Type for the JSON structure
export interface LondonDatasetsJSON {
  categories: LondonDataCategory[];
}

// Fetch and cache the JSON metadata
let cachedLondonDatasets: LondonDatasetsJSON | null = null;

export const fetchLondonDatasetsJSON = async (): Promise<LondonDatasetsJSON> => {
  if (cachedLondonDatasets) return cachedLondonDatasets;
  const response = await fetch('/data/london_datasets.json');
  if (!response.ok) throw new Error('Failed to load London datasets metadata JSON');
  const json = await response.json();
  cachedLondonDatasets = json;
  return json;
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
      path: file.path,
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

// Load all CSV files metadata (from JSON)
export const loadAllLondonData = async (): Promise<LondonDataCategory[]> => {
  const json = await fetchLondonDatasetsJSON();
  // For each file, try to load columns/sampleData/size/totalRecords
  const categories: LondonDataCategory[] = await Promise.all(
    json.categories.map(async (category) => {
      const files = await Promise.all(
        category.files.map(async (file) => {
          try {
            return await loadCSVFile({
              ...file,
              category: category.name,
              columns: [],
              sampleData: [],
              size: 0,
              totalRecords: 0,
              isLoaded: false
            });
          } catch (error) {
            return {
              ...file,
              category: category.name,
              columns: [],
              sampleData: [],
              size: 0,
              totalRecords: 0,
              isLoaded: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );
      return {
        name: category.name,
        description: category.description,
        files
      };
    })
  );
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

// Search for files by name or category (from loaded categories)
export const searchLondonData = (categories: LondonDataCategory[], query: string): LondonDataFile[] => {
  const results: LondonDataFile[] = [];
  const lowerQuery = query.toLowerCase();
  categories.forEach(category => {
    category.files.forEach(file => {
      if (
        file.name.toLowerCase().includes(lowerQuery) ||
        (file.description && file.description.toLowerCase().includes(lowerQuery)) ||
        (file.category && file.category.toLowerCase().includes(lowerQuery)) ||
        (file.columns && file.columns.some(col => col.toLowerCase().includes(lowerQuery)))
      ) {
        results.push(file);
      }
    });
  });
  return results;
};

// Generate context summary for AI (from loaded categories)
export const generateLondonDataContext = (categories: LondonDataCategory[]): string => {
  let context = 'AVAILABLE LONDON DATASETS:\n\n';
  categories.forEach(category => {
    context += `📁 ${category.name.toUpperCase()}\n`;
    context += `Description: ${category.description}\n`;
    context += `Files (${category.files.length}):\n`;
    category.files.forEach(file => {
      const status = file.isLoaded ? '✅' : file.error ? '❌' : '⏳';
      context += `  ${status} ${file.name} (${file.totalRecords || 0} records)\n`;
      if (file.isLoaded && file.columns && file.columns.length > 0) {
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
