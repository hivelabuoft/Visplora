import {AttritionEmployee, FilterCriteria, HRData, KPIMetrics} from '../types/interfaces';

/**
 * Business logic and analytics functions for HR Dashboard
 */
export class HRAnalytics {
  // Field mapping utilities
  static getEducationLabel(value: number): string {
    const map = {
      1: 'Below College',
      2: 'College', 
      3: 'Bachelor',
      4: 'Master',
      5: 'Doctor'
    };
    return map[value as keyof typeof map] || 'Unknown';
  }

  /**
   * Filter HR data based on department, job role, gender, and attrition criteria
   */
  static filterEmployeeData(
    data: HRData[], 
    criteria: FilterCriteria
  ): HRData[] {
    let filtered = data;
    if (criteria.department !== 'all') {
      filtered = filtered.filter(row => row.Department === criteria.department);
    }
    if (criteria.jobRole !== 'all') {
      filtered = filtered.filter(row => row.JobRole === criteria.jobRole);
    }
    if (criteria.gender !== 'all') {
      filtered = filtered.filter(row => row.Gender === criteria.gender);
    }
    if (criteria.showOnlyAttrition) {
      filtered = filtered.filter(row => row.Attrition === 'Yes');
    }
    return filtered;
  }

  /**
   * Calculate key performance indicators from HR data
   */
  static calculateKPIMetrics(data: HRData[]): KPIMetrics {
    const totalEmployees = data.length;
    const attritionCount = data.filter(emp => emp.Attrition === 'Yes').length;
    const attritionRate = totalEmployees > 0 ? ((attritionCount / totalEmployees) * 100) : 0;
    
    return {
      attritionRate: parseFloat(attritionRate.toFixed(1)),
      totalAttrition: attritionCount,
      currentEmployees: totalEmployees - attritionCount,
      totalEmployees
    };
  }

  /**
   * Get unique departments from employee data
   */
  static getUniqueDepartments(data: HRData[]): string[] {
    return [...new Set(data.map(emp => emp.Department))].sort();
  }

  /**
   * Process department data for individual retention/attrition charts
   */
  static processDepartmentRetentionData(data: HRData[], department: string) {
    const deptData = data.filter(emp => emp.Department === department);
    const total = deptData.length;
    const attrition = deptData.filter(emp => emp.Attrition === 'Yes').length;
    const retention = total - attrition;

    return [
      {
        type: 'retention',
        count: retention,
        percentage: total > 0 ? `${Math.round((retention / total) * 100)}%` : '0%'
      },
      {
        type: 'attrition', 
        count: attrition,
        percentage: total > 0 ? `${Math.round((attrition / total) * 100)}%` : '0%'
      }
    ].filter(item => item.count > 0);
  }

  /**
   * Process job role data for ranking visualization
   */
  static processJobRoleData(data: HRData[]) {
    const jobRoleData = data.reduce((acc, emp) => {
      const role = emp.JobRole;
      if (!acc[role]) acc[role] = { total: 0, attrition: 0 };
      acc[role].total++;
      if (emp.Attrition === 'Yes') acc[role].attrition++;
      return acc;
    }, {} as Record<string, { total: number; attrition: number }>);

    return Object.entries(jobRoleData)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 5)
      .map(([role, stats], index) => ({
        rank: index + 1,
        role: role,
        attrition: stats.attrition,
        total: stats.total
      }));
  }

  /**
   * Process gender data to show attrition vs retention
   */
  static processGenderAttritionData(data: HRData[], gender: string) {
    const genderData = data.filter(emp => emp.Gender === gender);
    const total = genderData.length;
    const attrition = genderData.filter(emp => emp.Attrition === 'Yes').length;
    const retention = total - attrition;

    return [
      {
        type: 'retention',
        count: retention,
        percentage: total > 0 ? `${Math.round((retention / total) * 100)}%` : '0%'
      },
      {
        type: 'attrition', 
        count: attrition,
        percentage: total > 0 ? `${Math.round((attrition / total) * 100)}%` : '0%'
      }
    ].filter(item => item.count > 0);
  }

  /**
   * Process age group distribution
   */
  static processAgeGroupData(data: HRData[]) {
    const ageGroupData = data.reduce((acc, emp) => {
      let ageGroup;
      if (emp.Age < 25) ageGroup = "< 25";
      else if (emp.Age <= 34) ageGroup = "25-34";
      else if (emp.Age <= 44) ageGroup = "35-44";
      else if (emp.Age <= 55) ageGroup = "45-55";
      else ageGroup = "> 55";
      
      if (!acc[ageGroup]) acc[ageGroup] = { total: 0, attrition: 0, retention: 0 };
      acc[ageGroup].total++;
      if (emp.Attrition === 'Yes') {
        acc[ageGroup].attrition++;
      } else {
        acc[ageGroup].retention++;
      }
      return acc;
    }, {} as Record<string, { total: number; attrition: number; retention: number }>);

    // Process data for stacking
    return ["< 25", "25-34", "35-44", "45-55", "> 55"]
        .filter(group => ageGroupData[group] && ageGroupData[group].total > 0)
        .flatMap(group => [
          {ageGroup: group, type: 'retention', count: ageGroupData[group].retention},
          {ageGroup: group, type: 'attrition', count: ageGroupData[group].attrition},
        ]);
  }

  /**
   * Process education level data
   */
  static processEducationData(data: HRData[]) {
    const educationData = data.reduce((acc, emp) => {
      const education = this.getEducationLabel(emp.Education);
      if (!acc[education]) acc[education] = { total: 0, attrition: 0, retention: 0 };
      acc[education].total++;
      if (emp.Attrition === 'Yes') {
        acc[education].attrition++;
      } else {
        acc[education].retention++;
      }
      return acc;
    }, {} as Record<string, { total: number; attrition: number; retention: number }>);

    // Sort by education level order
    const orderedEducation = ['Below College', 'College', 'Bachelor', 'Master', 'Doctor'];

    return orderedEducation
        .filter(edu => educationData[edu] && educationData[edu].total > 0)
        .flatMap(education => [
          {education, type: 'retention', count: educationData[education].retention},
          {education, type: 'attrition', count: educationData[education].attrition},
        ]);
  }

  /**
   * Get recent attrition employees
   */  static getRecentAttritionEmployees(data: HRData[], limit: number = 3): AttritionEmployee[] {
    return data
      .filter(emp => emp.Attrition === 'Yes')
      .slice(0, limit)
      .map((emp) => ({
        id: `E_${emp.EmployeeNumber}`,
        role: emp.JobRole,
        department: emp.Department === 'Research & Development' ? 'R & D' : emp.Department,
        satisfactionScore: emp.JobSatisfaction.toFixed(1),
        performanceRating: emp.PerformanceRating,
        monthlyIncome: `$${emp.MonthlyIncome.toLocaleString()}`,
        salaryHike: `${emp.PercentSalaryHike}%`
      }));
  }

  /**
   * Generate survey score data for visualization
   */
  static processSurveyScoreData(data: HRData[]) {
    const surveyCategories = [
      { key: "EnvironmentSatisfaction", label: "Environment\nSatisfaction" },
      { key: "JobSatisfaction", label: "Job\nSatisfaction" },
      { key: "JobInvolvement", label: "Job\nInvolvement" },
      { key: "RelationshipSatisfaction", label: "Relationship\nSatisfaction" },
      { key: "WorkLifeBalance", label: "Work Life\nBalance" }
    ];

    return surveyCategories.map(category => {
      const scoreCounts = [1, 2, 3, 4].map(score => ({
        score,
        attrition: data.filter(d => (d[category.key as keyof HRData] as number) === score && d.Attrition === 'Yes').length,
        retention: data.filter(d => (d[category.key as keyof HRData] as number) === score && d.Attrition === 'No').length,
      }));
      
      return {
        category: category.label,
        scoreCounts
      };
    });
  }

  /**
   * Process distance from home data for visualization
   */
  static processDistanceFromHomeData(data: HRData[]) {
    const distanceFromHomeData = data.reduce((acc, emp) => {
      const distance = emp.DistanceFromHome;
      // Determine 5km interval
      const interval = Math.floor((distance) / 5) * 5 + 1;
      const intervalKey = `${interval}-${interval + 4}km`;

      if (!acc[intervalKey]) acc[intervalKey] = { total: 0, attrition: 0, retention: 0 };
      acc[intervalKey].total++;
      if (emp.Attrition === 'Yes') {
        acc[intervalKey].attrition++;
      } else {
        acc[intervalKey].retention++;
      }
      return acc;
    }, {} as Record<string, { total: number; attrition: number; retention: number }>);

    // Convert to array of objects
    const processedData = Object.entries(distanceFromHomeData)
      .flatMap(([interval, counts]) => [
        { interval, type: 'retention', count: counts.retention },
        { interval, type: 'attrition', count: counts.attrition },
      ]);

    // Get unique intervals and sort them
    const sortedIntervals = Object.keys(distanceFromHomeData).sort((a, b) => {
      const getStart = (s: string) => parseInt(s.split('-')[0], 10);
      return getStart(a) - getStart(b);
    });
    return { processedData, sortedIntervals };
  }
}
