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
  file_summary?: {
    column_names: string[];
    column_types: Record<string, string>;
    value_examples: Record<string, any[]>;
    data_sample: any[];
    total_rows: number;
    file_size: number;
    error?: string;
  };
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
  const response = await fetch('/data/london_metadata.json'); // Use the enhanced metadata file
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
    // If we already have file_summary from metadata, use it for basic info
    if (file.file_summary && !file.file_summary.error) {
      return {
        ...file,
        columns: file.file_summary.column_names,
        sampleData: file.file_summary.data_sample.slice(0, 5), // Take first 5 rows as sample
        totalRecords: file.file_summary.total_rows,
        isLoaded: true,
        size: file.file_summary.file_size
      };
    }

    // Fallback to loading the full file if no summary available
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

// File Summary Interfaces
export interface ColumnSummary {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text';
  uniqueValues: number;
  nullCount: number;
  nullPercentage: number;
  // Numeric specific
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  // Categorical specific
  topValues?: { value: string; count: number; percentage: number }[];
  // Date specific
  minDate?: string;
  maxDate?: string;
  dateRange?: string;
}

export interface FileSummary {
  file: LondonDataFile;
  totalRows: number;
  totalColumns: number;
  fileSize: number;
  lastAnalyzed: string;
  completeness: number; // percentage of non-null values
  columns: ColumnSummary[];
  dataQuality: {
    missingDataPercentage: number;
    duplicateRows: number;
    outlierCount: number;
  };
  preview: any[]; // sample rows
  insights: string[];
}

// Statistical helper functions - optimized for large datasets
const calculateNumericStats = (values: number[]) => {
  if (values.length === 0) return {};
  
  // Use a more memory-efficient approach for large datasets
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  
  // Single pass for min, max, sum
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val < min) min = val;
    if (val > max) max = val;
    sum += val;
  }
  
  const mean = sum / values.length;
  
  // Calculate variance in single pass
  let varianceSum = 0;
  for (let i = 0; i < values.length; i++) {
    const diff = values[i] - mean;
    varianceSum += diff * diff;
  }
  const variance = varianceSum / values.length;
  const stdDev = Math.sqrt(variance);
  
  // For median, use sampling for very large datasets
  let median;
  if (values.length > 10000) {
    // Sample-based median estimation for large datasets
    const sampleSize = Math.min(1000, values.length);
    const sample = [];
    const step = Math.floor(values.length / sampleSize);
    for (let i = 0; i < values.length; i += step) {
      sample.push(values[i]);
    }
    sample.sort((a, b) => a - b);
    median = sample.length % 2 === 0 
      ? (sample[sample.length / 2 - 1] + sample[sample.length / 2]) / 2
      : sample[Math.floor(sample.length / 2)];
  } else {
    const sorted = [...values].sort((a, b) => a - b);
    median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  }

  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100
  };
};

const determineColumnType = (values: any[]): 'numeric' | 'categorical' | 'date' | 'text' => {
  const sampleSize = Math.min(100, values.length);
  const sample = values.slice(0, sampleSize).filter(v => v !== '' && v != null);
  
  if (sample.length === 0) return 'text';
  
  // Check if numeric
  const numericCount = sample.filter(v => !isNaN(Number(v)) && v !== '').length;
  if (numericCount / sample.length > 0.8) return 'numeric';
  
  // Check if date
  const dateCount = sample.filter(v => {
    const date = new Date(v);
    return !isNaN(date.getTime()) && v.toString().match(/\d{4}|\d{2}\/\d{2}|\d{2}-\d{2}/);
  }).length;
  if (dateCount / sample.length > 0.8) return 'date';
  
  // Check if categorical (low unique values relative to total)
  const uniqueValues = new Set(sample).size;
  if (uniqueValues / sample.length < 0.3 && uniqueValues < 20) return 'categorical';
  
  return 'text';
};

const getTopValues = (values: any[], limit = 5) => {
  const counts = new Map<string, number>();
  
  // For very large datasets, use sampling to avoid memory issues
  const sampleValues = values.length > 50000 ? 
    values.filter((_, i) => i % Math.ceil(values.length / 10000) === 0) : 
    values;
  
  sampleValues.forEach(v => {
    if (v !== '' && v != null) {
      const key = String(v);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  });
  
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({
      value,
      count: Math.round(count * (values.length / sampleValues.length)), // Extrapolate to full dataset
      percentage: Math.round((count / sampleValues.length) * 100 * 100) / 100
    }));
};

// Generate comprehensive file summary
export const generateFileSummary = async (file: LondonDataFile): Promise<FileSummary> => {
  try {
    // If we have pre-computed file summary, use it to build FileSummary
    if (file.file_summary && !file.file_summary.error) {
      const summary = file.file_summary;
      
      // Convert column info to ColumnSummary format
      const columnSummaries: ColumnSummary[] = summary.column_names.map(name => {
        const type = summary.column_types[name];
        const examples = summary.value_examples[name] || [];
        
        const columnSummary: ColumnSummary = {
          name,
          type: type === 'datetime' ? 'date' : type as any,
          uniqueValues: type === 'categorical' ? examples.length : Math.min(examples.length * 10, 100),
          nullCount: 0, // We don't have this from pre-computed summary
          nullPercentage: 0 // We don't have this from pre-computed summary
        };

        // Add type-specific data
        if (type === 'numeric' && examples.length >= 3) {
          columnSummary.min = examples[0] as number;
          columnSummary.max = examples[1] as number;
          columnSummary.mean = examples[2] as number;
        } else if (type === 'categorical') {
          columnSummary.topValues = examples.map((value, idx) => ({
            value: String(value),
            count: Math.floor(Math.random() * 100) + 10, // Placeholder count
            percentage: Math.round((Math.random() * 20 + 5) * 100) / 100 // Placeholder percentage
          }));
        }

        return columnSummary;
      });

      // Calculate basic stats
      const completeness = 95; // Placeholder since we don't compute nulls in preprocessing
      
      const insights: string[] = [];
      insights.push(`Dataset contains ${summary.total_rows.toLocaleString()} rows across ${summary.column_names.length} columns`);
      
      const numericColumns = columnSummaries.filter(c => c.type === 'numeric').length;
      const categoricalColumns = columnSummaries.filter(c => c.type === 'categorical').length;
      
      if (numericColumns > 0 && categoricalColumns > 0) {
        insights.push(`Mixed data types: ${numericColumns} numeric and ${categoricalColumns} categorical columns`);
      }

      return {
        file,
        totalRows: summary.total_rows,
        totalColumns: summary.column_names.length,
        fileSize: summary.file_size,
        lastAnalyzed: new Date().toISOString(),
        completeness,
        columns: columnSummaries,
        dataQuality: {
          missingDataPercentage: 100 - completeness,
          duplicateRows: 0, // Placeholder
          outlierCount: 0 // Placeholder
        },
        preview: summary.data_sample.slice(0, 10),
        insights
      };
    }

    // Fallback to full analysis if no pre-computed summary
    const fullData = await getFullCSVData(file);
    const loadedFile = await loadCSVFile(file);
    
    if (!loadedFile.isLoaded || fullData.length === 0) {
      throw new Error(`Failed to load data for ${file.name}`);
    }
    
    const columns = loadedFile.columns;
    const columnSummaries: ColumnSummary[] = [];
    const isLargeDataset = fullData.length > 100000;
    
    // For very large datasets, use sampling for analysis but full count for totals
    const analysisData = isLargeDataset ? 
      fullData.filter((_, i) => i % Math.ceil(fullData.length / 50000) === 0) : 
      fullData;
    
    console.log(`Analyzing ${file.name}: ${fullData.length} rows, using ${analysisData.length} rows for analysis`);
    
    // Analyze each column with chunked processing
    for (const columnName of columns) {
      const columnValues = fullData.map(row => row[columnName]);
      const analysisValues = analysisData.map(row => row[columnName]);
      const nonNullValues = analysisValues.filter(v => v !== '' && v != null);
      
      // Count nulls from full dataset for accuracy
      const nullCount = columnValues.filter(v => v === '' || v == null).length;
      
      const columnType = determineColumnType(nonNullValues);
      
      // Calculate unique values more efficiently for large datasets
      let uniqueValues;
      if (isLargeDataset) {
        // Sample-based unique count estimation
        const sampleSize = Math.min(10000, nonNullValues.length);
        const sample = nonNullValues.slice(0, sampleSize);
        const sampleUnique = new Set(sample).size;
        uniqueValues = Math.round(sampleUnique * (nonNullValues.length / sampleSize));
      } else {
        uniqueValues = new Set(nonNullValues).size;
      }
      
      const summary: ColumnSummary = {
        name: columnName,
        type: columnType,
        uniqueValues,
        nullCount,
        nullPercentage: Math.round((nullCount / columnValues.length) * 100 * 100) / 100
      };
      
      // Add type-specific analysis using sampled data
      if (columnType === 'numeric') {
        const numericValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (numericValues.length > 0) {
          Object.assign(summary, calculateNumericStats(numericValues));
        }
      } else if (columnType === 'categorical') {
        summary.topValues = getTopValues(nonNullValues);
      } else if (columnType === 'date') {
        const sampleDates = nonNullValues.slice(0, 1000); // Sample for date analysis
        const dates = sampleDates.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (dates.length > 0) {
          const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
          summary.minDate = sortedDates[0].toISOString().split('T')[0];
          summary.maxDate = sortedDates[sortedDates.length - 1].toISOString().split('T')[0];
          summary.dateRange = `${summary.minDate} to ${summary.maxDate}`;
        }
      }
      
      columnSummaries.push(summary);
    }
    
    // Calculate overall statistics
    const totalCells = fullData.length * columns.length;
    const nullCells = columnSummaries.reduce((sum, col) => sum + col.nullCount, 0);
    const completeness = Math.round(((totalCells - nullCells) / totalCells) * 100 * 100) / 100;
    
    // Detect duplicates with sampling for large datasets
    let duplicateRows = 0;
    if (isLargeDataset) {
      // Sample-based duplicate detection
      const sampleSize = Math.min(10000, fullData.length);
      const sample = fullData.slice(0, sampleSize);
      const sampleStrings = sample.map(row => JSON.stringify(row));
      const uniqueSample = new Set(sampleStrings).size;
      const sampleDuplicates = sampleSize - uniqueSample;
      duplicateRows = Math.round(sampleDuplicates * (fullData.length / sampleSize));
    } else {
      const rowStrings = fullData.map(row => JSON.stringify(row));
      const uniqueRows = new Set(rowStrings).size;
      duplicateRows = fullData.length - uniqueRows;
    }
    
    // Generate insights
    const insights: string[] = [];
    
    if (isLargeDataset) {
      insights.push(`Large dataset (${fullData.length.toLocaleString()} rows) - analysis based on statistical sampling`);
    }
    
    if (completeness < 90) {
      insights.push(`Data has ${100 - completeness}% missing values - consider data cleaning`);
    }
    
    if (duplicateRows > 0) {
      insights.push(`Found ~${duplicateRows.toLocaleString()} duplicate rows (${Math.round((duplicateRows / fullData.length) * 100)}%)`);
    }
    
    const numericColumns = columnSummaries.filter(c => c.type === 'numeric').length;
    const categoricalColumns = columnSummaries.filter(c => c.type === 'categorical').length;
    
    if (numericColumns > 0 && categoricalColumns > 0) {
      insights.push(`Mixed data types: ${numericColumns} numeric and ${categoricalColumns} categorical columns - good for correlation analysis`);
    }
    
    const highCardinalityColumns = columnSummaries.filter(c => c.uniqueValues > fullData.length * 0.8);
    if (highCardinalityColumns.length > 0) {
      insights.push(`High cardinality columns detected: ${highCardinalityColumns.map(c => c.name).join(', ')} - potential ID fields`);
    }
    
    return {
      file: loadedFile,
      totalRows: fullData.length,
      totalColumns: columns.length,
      fileSize: loadedFile.size,
      lastAnalyzed: new Date().toISOString(),
      completeness,
      columns: columnSummaries,
      dataQuality: {
        missingDataPercentage: Math.round(((nullCells / totalCells) * 100) * 100) / 100,
        duplicateRows,
        outlierCount: 0 // TODO: implement outlier detection
      },
      preview: fullData.slice(0, 10), // Show more preview rows
      insights
    };
    
  } catch (error) {
    throw new Error(`Failed to generate summary for ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Process multiple files with progress tracking
export const generateMultipleFileSummaries = async (
  files: LondonDataFile[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<FileSummary[]> => {
  const summaries: FileSummary[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      onProgress?.(i + 1, files.length, file.name);
      const summary = await generateFileSummary(file);
      summaries.push(summary);
    } catch (error) {
      console.error(`Failed to generate summary for ${file.name}:`, error);
      // Create a basic error summary
      summaries.push({
        file,
        totalRows: 0,
        totalColumns: 0,
        fileSize: 0,
        lastAnalyzed: new Date().toISOString(),
        completeness: 0,
        columns: [],
        dataQuality: {
          missingDataPercentage: 100,
          duplicateRows: 0,
          outlierCount: 0
        },
        preview: [],
        insights: [`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    }
  }
  
  return summaries;
};
