import { HRData } from '../types/interfaces';

/**
 * Service for loading and parsing HR employee data from CSV files
 */
export class DataLoader {
  /**
   * Fetches CSV data from the given URL and parses it into HRData objects
   */
  static async loadEmployeeData(csvUrl: string = '/dataset/HR-Employee-Attrition.csv'): Promise<HRData[]> {
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('Error loading employee data:', error);
      throw error;
    }
  }

  /**
   * Parses CSV text into HRData objects with proper type conversion
   */
  private static parseCSV(csvText: string): HRData[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    const numericFields = [
      'Age', 'DailyRate', 'DistanceFromHome', 'Education', 'EmployeeCount', 
      'EmployeeNumber', 'EnvironmentSatisfaction', 'HourlyRate', 'JobInvolvement',
      'JobLevel', 'JobSatisfaction', 'MonthlyIncome', 'MonthlyRate', 
      'NumCompaniesWorked', 'PercentSalaryHike', 'PerformanceRating',
      'RelationshipSatisfaction', 'StandardHours', 'StockOptionLevel',
      'TotalWorkingYears', 'TrainingTimesLastYear', 'WorkLifeBalance',
      'YearsAtCompany', 'YearsInCurrentRole', 'YearsSinceLastPromotion',
      'YearsWithCurrManager'
    ];
    
    return lines.slice(1).map((line, index) => {
      try {
        const values = line.split(',');
        const row: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || '';
          
          if (numericFields.includes(header)) {
            row[header] = parseInt(value) || 0;
          } else {
            row[header] = value;
          }
        });
        
        return row as HRData;
      } catch (error) {
        console.warn(`Error parsing row ${index + 1}:`, error);
        return null;
      }
    }).filter(Boolean) as HRData[];
  }

  /**
   * Validates that the parsed data has the expected structure
   */
  static validateData(data: HRData[]): boolean {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    const requiredFields = ['Age', 'Attrition', 'Department', 'Gender', 'JobRole'];
    const firstRecord = data[0];
    
    return requiredFields.every(field => field in firstRecord);
  }
}
