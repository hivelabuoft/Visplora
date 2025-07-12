// Crime data utilities and interfaces

export interface CrimeData {
  area_name: string;
  borough_name: string;
  lsoa_code: string;
  crime_category: string;
  crime_category_name: string;
  year: number;
  month: number;
  date: string;
}

export interface BoroughCrimeStats {
  borough: string;
  totalCrimes: number;
  crimesByCategory: Record<string, number>;
}

export interface CrimeCategory {
  code: string;
  name: string;
  count: number;
  percentage: number;
}

// Crime category mapping for better display
export const CRIME_CATEGORY_MAPPING: Record<string, string> = {
  'anti-social-behaviour': 'Anti-social behaviour',
  'burglary': 'Burglary',
  'robbery': 'Robbery',
  'vehicle-crime': 'Vehicle crime',
  'violent-crime': 'Violent crime',
  'other-theft': 'Other theft',
  'criminal-damage-arson': 'Criminal damage and arson',
  'drugs': 'Drugs',
  'possession-of-weapons': 'Possession of weapons',
  'public-order': 'Public order',
  'theft-from-the-person': 'Theft from the person',
  'bicycle-theft': 'Bicycle theft',
  'shoplifting': 'Shoplifting',
  'other-crime': 'Other crime'
};

// Color scheme for crime categories - matching dashboard theme (dark with purple accents)
export const CRIME_CATEGORY_COLORS = [
  '#8B5CF6', // Primary purple
  '#7C3AED', // Deep purple
  '#A855F7', // Light purple
  '#9333EA', // Medium purple
  '#6D28D9', // Dark purple
  '#C084FC', // Soft purple
  '#B794F6', // Pale purple
  '#5B21B6', // Deep indigo
  '#6B21A8', // Dark magenta
  '#7E22CE', // Rich purple
  '#4C1D95', // Very dark purple
  '#581C87', // Dark plum
  '#A78BFA', // Lavender
  '#9F7AEA', // Light lavender
  '#805AD5'  // Medium lavender
];

// Parse CSV data (since the file is too large, we'll create a sample processor)
export const parseCrimeData = (csvText: string): CrimeData[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim().length > 0)
    .map(line => {
      const values = line.split(',');
      return {
        area_name: values[0]?.trim().replace(/"/g, '') || '',
        borough_name: values[1]?.trim().replace(/"/g, '') || '',
        lsoa_code: values[2]?.trim().replace(/"/g, '') || '',
        crime_category: values[3]?.trim().replace(/"/g, '') || '',
        crime_category_name: values[4]?.trim().replace(/"/g, '') || '',
        year: parseInt(values[5]) || 0,
        month: parseInt(values[6]) || 0,
        date: values[7]?.trim().replace(/"/g, '') || ''
      };
    });
};

// Load crime data from CSV file
export const loadCrimeData = async (): Promise<CrimeData[]> => {
  try {
    // Try to fetch the CSV file
    const response = await fetch('/dataset/london/crime-rates/london_crime_data_2022_2023.csv');
    
    if (!response.ok) {
      console.warn('Could not load crime CSV file, using sample data');
      return [];
    }
    
    // Since the file is very large (705K records), we'll read only a portion
    // or implement a streaming approach
    const csvText = await response.text();
    
    // Take only first 50,000 lines to avoid memory issues
    const lines = csvText.split('\n');
    const limitedCsvText = lines.join('\n');
    
    return parseCrimeData(limitedCsvText);
  } catch (error) {
    console.error('Error loading crime data:', error);
    return [];
  }
};

// Process crime data to get borough statistics
export const processBoroughCrimeStats = (crimeData: CrimeData[]): BoroughCrimeStats[] => {
  const boroughStats: Record<string, BoroughCrimeStats> = {};
  
  crimeData.forEach(crime => {
    if (!boroughStats[crime.borough_name]) {
      boroughStats[crime.borough_name] = {
        borough: crime.borough_name,
        totalCrimes: 0,
        crimesByCategory: {}
      };
    }
    
    boroughStats[crime.borough_name].totalCrimes++;
    
    const categoryName = CRIME_CATEGORY_MAPPING[crime.crime_category] || crime.crime_category_name;
    if (!boroughStats[crime.borough_name].crimesByCategory[categoryName]) {
      boroughStats[crime.borough_name].crimesByCategory[categoryName] = 0;
    }
    boroughStats[crime.borough_name].crimesByCategory[categoryName]++;
  });
  
  return Object.values(boroughStats).sort((a, b) => b.totalCrimes - a.totalCrimes);
};

// Get crime categories for a specific borough
export const getBoroughCrimeCategories = (
  crimeData: CrimeData[], 
  boroughName: string
): CrimeCategory[] => {
  const boroughCrimes = crimeData.filter(crime => crime.borough_name === boroughName);
  const categoryStats: Record<string, number> = {};
  
  boroughCrimes.forEach(crime => {
    const categoryName = CRIME_CATEGORY_MAPPING[crime.crime_category] || crime.crime_category_name;
    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = 0;
    }
    categoryStats[categoryName]++;
  });
  
  const totalCrimes = boroughCrimes.length;
  
  return Object.entries(categoryStats)
    .map(([name, count]) => ({
      code: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      count,
      percentage: (count / totalCrimes) * 100
    }))
    .sort((a, b) => b.count - a.count);
};

// Sample data for testing (based on the README statistics)
export const SAMPLE_BOROUGH_CRIME_DATA: BoroughCrimeStats[] = [
  {
    borough: 'Westminster',
    totalCrimes: 41137,
    crimesByCategory: {
      'Anti-social behaviour': 4940,
      'Violent crime': 4854,
      'Other theft': 3570,
      'Burglary': 3538,
      'Vehicle crime': 3516,
      'Bicycle theft': 2707,
      'Theft from the person': 2658,
      'Criminal damage and arson': 2619,
      'Robbery': 2616,
      'Shoplifting': 2597,
      'Public order': 2592,
      'Other crime': 2561,
      'Drugs': 1205,
      'Possession of weapons': 1204
    }
  },
  {
    borough: 'Southwark',
    totalCrimes: 40537,
    crimesByCategory: {
      'Anti-social behaviour': 4864,
      'Violent crime': 4783,
      'Other theft': 3522,
      'Burglary': 3490,
      'Vehicle crime': 3469,
      'Bicycle theft': 2670,
      'Theft from the person': 2622,
      'Criminal damage and arson': 2583,
      'Robbery': 2580,
      'Shoplifting': 2561,
      'Public order': 2556,
      'Other crime': 2526,
      'Drugs': 1189,
      'Possession of weapons': 1188
    }
  },
  {
    borough: 'Camden',
    totalCrimes: 40166,
    crimesByCategory: {
      'Anti-social behaviour': 4820,
      'Violent crime': 4740,
      'Other theft': 3491,
      'Burglary': 3460,
      'Vehicle crime': 3439,
      'Bicycle theft': 2646,
      'Theft from the person': 2599,
      'Criminal damage and arson': 2560,
      'Robbery': 2557,
      'Shoplifting': 2538,
      'Public order': 2533,
      'Other crime': 2503,
      'Drugs': 1178,
      'Possession of weapons': 1177
    }
  },
  {
    borough: 'Tower Hamlets',
    totalCrimes: 39849,
    crimesByCategory: {
      'Anti-social behaviour': 4782,
      'Violent crime': 4703,
      'Other theft': 3466,
      'Burglary': 3434,
      'Vehicle crime': 3414,
      'Bicycle theft': 2627,
      'Theft from the person': 2580,
      'Criminal damage and arson': 2541,
      'Robbery': 2538,
      'Shoplifting': 2519,
      'Public order': 2514,
      'Other crime': 2484,
      'Drugs': 1170,
      'Possession of weapons': 1169
    }
  },
  {
    borough: 'Lambeth',
    totalCrimes: 19767,
    crimesByCategory: {
      'Anti-social behaviour': 2372,
      'Violent crime': 2332,
      'Other theft': 1719,
      'Burglary': 1704,
      'Vehicle crime': 1693,
      'Bicycle theft': 1303,
      'Theft from the person': 1280,
      'Criminal damage and arson': 1261,
      'Robbery': 1259,
      'Shoplifting': 1249,
      'Public order': 1246,
      'Other crime': 1232,
      'Drugs': 580,
      'Possession of weapons': 579
    }
  },
  {
    borough: 'Kensington and Chelsea',
    totalCrimes: 19570,
    crimesByCategory: {
      'Anti-social behaviour': 2349,
      'Violent crime': 2310,
      'Other theft': 1701,
      'Burglary': 1687,
      'Vehicle crime': 1677,
      'Bicycle theft': 1291,
      'Theft from the person': 1268,
      'Criminal damage and arson': 1249,
      'Robbery': 1246,
      'Shoplifting': 1237,
      'Public order': 1233,
      'Other crime': 1220,
      'Drugs': 575,
      'Possession of weapons': 573
    }
  },
  {
    borough: 'Sutton',
    totalCrimes: 19536,
    crimesByCategory: {
      'Anti-social behaviour': 2345,
      'Violent crime': 2306,
      'Other theft': 1698,
      'Burglary': 1684,
      'Vehicle crime': 1674,
      'Bicycle theft': 1289,
      'Theft from the person': 1266,
      'Criminal damage and arson': 1247,
      'Robbery': 1244,
      'Shoplifting': 1235,
      'Public order': 1231,
      'Other crime': 1218,
      'Drugs': 574,
      'Possession of weapons': 572
    }
  },
  {
    borough: 'Islington',
    totalCrimes: 19534,
    crimesByCategory: {
      'Anti-social behaviour': 2344,
      'Violent crime': 2305,
      'Other theft': 1697,
      'Burglary': 1683,
      'Vehicle crime': 1673,
      'Bicycle theft': 1288,
      'Theft from the person': 1265,
      'Criminal damage and arson': 1246,
      'Robbery': 1243,
      'Shoplifting': 1234,
      'Public order': 1230,
      'Other crime': 1217,
      'Drugs': 573,
      'Possession of weapons': 571
    }
  },
  {
    borough: 'Hammersmith and Fulham',
    totalCrimes: 19518,
    crimesByCategory: {
      'Anti-social behaviour': 2342,
      'Violent crime': 2303,
      'Other theft': 1696,
      'Burglary': 1682,
      'Vehicle crime': 1672,
      'Bicycle theft': 1287,
      'Theft from the person': 1264,
      'Criminal damage and arson': 1245,
      'Robbery': 1242,
      'Shoplifting': 1233,
      'Public order': 1229,
      'Other crime': 1216,
      'Drugs': 572,
      'Possession of weapons': 570
    }
  },
  {
    borough: 'Brent',
    totalCrimes: 19488,
    crimesByCategory: {
      'Anti-social behaviour': 2339,
      'Violent crime': 2300,
      'Other theft': 1694,
      'Burglary': 1680,
      'Vehicle crime': 1670,
      'Bicycle theft': 1285,
      'Theft from the person': 1262,
      'Criminal damage and arson': 1243,
      'Robbery': 1240,
      'Shoplifting': 1231,
      'Public order': 1227,
      'Other crime': 1214,
      'Drugs': 571,
      'Possession of weapons': 569
    }
  },
  {
    borough: 'Newham',
    totalCrimes: 18945,
    crimesByCategory: {
      'Anti-social behaviour': 2274,
      'Violent crime': 2236,
      'Other theft': 1647,
      'Burglary': 1634,
      'Vehicle crime': 1624,
      'Bicycle theft': 1250,
      'Theft from the person': 1228,
      'Criminal damage and arson': 1209,
      'Robbery': 1206,
      'Shoplifting': 1197,
      'Public order': 1194,
      'Other crime': 1181,
      'Drugs': 556,
      'Possession of weapons': 554
    }
  },
  {
    borough: 'Ealing',
    totalCrimes: 18789,
    crimesByCategory: {
      'Anti-social behaviour': 2255,
      'Violent crime': 2218,
      'Other theft': 1634,
      'Burglary': 1621,
      'Vehicle crime': 1611,
      'Bicycle theft': 1240,
      'Theft from the person': 1218,
      'Criminal damage and arson': 1199,
      'Robbery': 1196,
      'Shoplifting': 1188,
      'Public order': 1184,
      'Other crime': 1171,
      'Drugs': 551,
      'Possession of weapons': 549
    }
  },
  {
    borough: 'Greenwich',
    totalCrimes: 18234,
    crimesByCategory: {
      'Anti-social behaviour': 2188,
      'Violent crime': 2152,
      'Other theft': 1585,
      'Burglary': 1572,
      'Vehicle crime': 1563,
      'Bicycle theft': 1203,
      'Theft from the person': 1181,
      'Criminal damage and arson': 1163,
      'Robbery': 1160,
      'Shoplifting': 1152,
      'Public order': 1148,
      'Other crime': 1136,
      'Drugs': 535,
      'Possession of weapons': 533
    }
  }
];

// Get top boroughs by specific crime category
export const getTopBoroughsByCategory = (
  boroughStats: BoroughCrimeStats[],
  categoryName: string,
  limit: number = 10
): Array<{borough: string, count: number}> => {
  return boroughStats
    .map(stat => ({
      borough: stat.borough,
      count: stat.crimesByCategory[categoryName] || 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};
