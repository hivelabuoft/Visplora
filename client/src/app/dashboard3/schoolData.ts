// School Education Data Processing
export interface SchoolData {
  urn: string;
  laName: string;
  schoolName: string;
  postcode: string;
  schoolStatus: string;
  schoolType: string;
  isPrimary: boolean;
  isSecondary: boolean;
  isPost16: boolean;
  ageLow: number;
  ageHigh: number;
  gender: string;
  religiousCharacter: string;
  ofstedRating: string;
}

export interface BoroughSchoolStats {
  borough: string;
  totalSchools: number;
  primarySchools: number;
  secondarySchools: number;
  post16Schools: number;
  schoolTypes: SchoolTypeStats[];
  ofstedRatings: OfstedRatingStats[];
}

export interface SchoolTypeStats {
  type: string;
  count: number;
  percentage: number;
  primaryCount: number;
  secondaryCount: number;
  post16Count: number;
  dominantLevel: string; // 'Primary', 'Secondary', 'Post-16', or 'Mixed'
}

export interface OfstedRatingStats {
  rating: string;
  count: number;
  percentage: number;
}

// Simplified school type mapping for better visualization
export const SCHOOL_TYPE_MAPPING: { [key: string]: string } = {
  'Academy converter': 'Academy',
  'Academy sponsor led': 'Academy',
  'Academy': 'Academy',
  'Academy special converter': 'Academy',
  'Academy special sponsor led': 'Academy',
  'Academy 16-19 converter': 'Academy',
  'Academy 16 to 19 sponsor led': 'Academy',
  'Community school': 'Community',
  'Community special school': 'Community',
  'Voluntary aided school': 'Voluntary Aided',
  'Voluntary controlled school': 'Voluntary Controlled',
  'Other independent school': 'Independent',
  'Independent school': 'Independent',
  'Other independent special school': 'Independent',
  'Foundation school': 'Foundation',
  'Foundation special school': 'Foundation',
  'Free schools': 'Free School',
  'Free schools special': 'Free School',
  'Free schools 16 to 19': 'Free School',
  'Further education': 'Further Education',
  'University technical college': 'Specialist',
  'Studio schools': 'Specialist',
  'City technology college': 'Specialist',
  'Sixth form centres': 'Specialist'
};

// Colors for different school types
export const SCHOOL_TYPE_COLORS = [
  '#8B5CF6', // Academy - Purple
  '#3B82F6', // Community - Blue
  '#06B6D4', // Voluntary Aided - Cyan
  '#10B981', // Independent - Green
  '#F59E0B', // Foundation - Amber
  '#EF4444', // Free School - Red
  '#6366F1', // Further Education - Indigo
  '#8B5CF6'  // Specialist - Purple variant
];

// London boroughs list
export const LONDON_BOROUGHS = [
  'Camden', 'Westminster', 'Kensington and Chelsea', 'Hammersmith and Fulham', 
  'Wandsworth', 'Lambeth', 'Southwark', 'Tower Hamlets', 'Hackney', 
  'Islington', 'Newham', 'Waltham Forest', 'Redbridge', 'Barking and Dagenham',
  'Havering', 'Bexley', 'Greenwich', 'Lewisham', 'Bromley', 'Croydon',
  'Sutton', 'Merton', 'Kingston upon Thames', 'Richmond upon Thames',
  'Hounslow', 'Hillingdon', 'Ealing', 'Brent', 'Harrow', 'Barnet',
  'Enfield', 'Haringey', 'City of London'
];

// Helper function to parse CSV with proper handling of quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
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

// Parse CSV data
export const parseSchoolCSV = (csvText: string): SchoolData[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  console.log('CSV Headers:', headers);
  
  const schoolData: SchoolData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      // Skip malformed lines
      if (values.length < 25) continue;
      
      const school: SchoolData = {
        urn: values[0] || '',
        laName: values[1] || '',
        schoolName: values[5] || '',
        postcode: values[10] || '',
        schoolStatus: values[11] || '',
        schoolType: values[15] || '',
        isPrimary: values[16] === '1',
        isSecondary: values[17] === '1',
        isPost16: values[18] === '1',
        ageLow: parseInt(values[19]) || 0,
        ageHigh: parseInt(values[20]) || 0,
        gender: values[21] || '',
        religiousCharacter: values[22] || '',
        ofstedRating: values[24] || ''
      };
      
      // Filter for open schools in London boroughs
      if (school.schoolStatus === 'Open' && 
          school.laName && 
          school.schoolType &&
          LONDON_BOROUGHS.includes(school.laName)) {
        schoolData.push(school);
      }
    } catch (error) {
      console.warn(`Error parsing line ${i}:`, error);
      continue;
    }
  }
  
  console.log(`Parsed ${schoolData.length} schools from CSV`);
  return schoolData;
};

// Get school statistics for a specific borough
export const getBoroughSchoolStats = (schoolData: SchoolData[], borough: string): BoroughSchoolStats => {
  const boroughSchools = schoolData.filter(school => school.laName === borough);
  const totalSchools = boroughSchools.length;
  
  if (totalSchools === 0) {
    return {
      borough,
      totalSchools: 0,
      primarySchools: 0,
      secondarySchools: 0,
      post16Schools: 0,
      schoolTypes: [],
      ofstedRatings: []
    };
  }
  
  const primarySchools = boroughSchools.filter(school => school.isPrimary).length;
  const secondarySchools = boroughSchools.filter(school => school.isSecondary).length;
  const post16Schools = boroughSchools.filter(school => school.isPost16).length;
  
  // Calculate school type statistics with education level breakdown
  const typeCount: { [key: string]: number } = {};
  const typeLevelCount: { [key: string]: { primary: number, secondary: number, post16: number } } = {};
  
  boroughSchools.forEach(school => {
    const mappedType = SCHOOL_TYPE_MAPPING[school.schoolType] || 'Other';
    typeCount[mappedType] = (typeCount[mappedType] || 0) + 1;
    
    if (!typeLevelCount[mappedType]) {
      typeLevelCount[mappedType] = { primary: 0, secondary: 0, post16: 0 };
    }
    
    if (school.isPrimary) typeLevelCount[mappedType].primary++;
    if (school.isSecondary) typeLevelCount[mappedType].secondary++;
    if (school.isPost16) typeLevelCount[mappedType].post16++;
  });
  
  const schoolTypes: SchoolTypeStats[] = Object.entries(typeCount)
    .map(([type, count]) => {
      const levels = typeLevelCount[type];
      const primaryCount = levels.primary;
      const secondaryCount = levels.secondary;
      const post16Count = levels.post16;
      
      // Determine dominant level
      let dominantLevel = 'Mixed';
      const maxCount = Math.max(primaryCount, secondaryCount, post16Count);
      if (maxCount > 0) {
        if (primaryCount === maxCount && primaryCount > secondaryCount + post16Count) {
          dominantLevel = 'Primary';
        } else if (secondaryCount === maxCount && secondaryCount > primaryCount + post16Count) {
          dominantLevel = 'Secondary';
        } else if (post16Count === maxCount && post16Count > primaryCount + secondaryCount) {
          dominantLevel = 'Post-16';
        }
      }
      
      return {
        type,
        count,
        percentage: (count / totalSchools) * 100,
        primaryCount,
        secondaryCount,
        post16Count,
        dominantLevel
      };
    })
    .sort((a, b) => b.count - a.count);
  
  // Calculate Ofsted rating statistics
  const ratingCount: { [key: string]: number } = {};
  boroughSchools.forEach(school => {
    if (school.ofstedRating && school.ofstedRating !== 'Not applicable' && school.ofstedRating.trim()) {
      ratingCount[school.ofstedRating] = (ratingCount[school.ofstedRating] || 0) + 1;
    }
  });
  
  const ofstedRatings: OfstedRatingStats[] = Object.entries(ratingCount)
    .map(([rating, count]) => ({
      rating,
      count,
      percentage: (count / Object.values(ratingCount).reduce((a, b) => a + b, 0)) * 100
    }))
    .sort((a, b) => {
      const order = ['Outstanding', 'Good', 'Requires improvement', 'Inadequate'];
      return order.indexOf(a.rating) - order.indexOf(b.rating);
    });
  
  return {
    borough,
    totalSchools,
    primarySchools,
    secondarySchools,
    post16Schools,
    schoolTypes,
    ofstedRatings
  };
};

// Load school data
export const loadSchoolData = async (): Promise<SchoolData[]> => {
  try {
    console.log('Loading school data from CSV...');
    const response = await fetch('/dataset/london/schools-colleges/2022-2023_england_school_information.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch school data: ${response.status}`);
    }
    
    const csvText = await response.text();
    const data = parseSchoolCSV(csvText);
    console.log(`Successfully loaded ${data.length} school records`);
    return data;
  } catch (error) {
    console.error('Error loading school data:', error);
    return [];
  }
};
