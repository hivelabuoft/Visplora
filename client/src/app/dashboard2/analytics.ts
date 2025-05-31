import { HRData, KPIMetrics, AttritionEmployee, FilterCriteria } from '../types/interfaces';

/**
 * Business logic and analytics functions for HR Dashboard
 */
export class HRAnalytics {
  /**
   * Filter HR data based on department and attrition criteria
   */
  static filterEmployeeData(
    data: HRData[], 
    criteria: FilterCriteria
  ): HRData[] {
    let filtered = data;
    if (criteria.department !== 'all') {
      filtered = filtered.filter(row => row.Department === criteria.department);
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
   * Process department data for visualization
   */
  static processDepartmentData(data: HRData[]) {
    const departmentData = data.reduce((acc, emp) => {
      const dept = emp.Department;
      if (!acc[dept]) acc[dept] = { total: 0, attrition: 0 };
      acc[dept].total++;
      if (emp.Attrition === 'Yes') acc[dept].attrition++;
      return acc;
    }, {} as Record<string, { total: number; attrition: number }>);

    return Object.entries(departmentData).map(([dept, stats]) => ({
      department: dept.replace('Research & Development', 'R & D').replace('Human Resources', 'HR'),
      total: stats.total,
      attrition: stats.attrition,
      retention: stats.total - stats.attrition
    }));
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
   * Process gender distribution data
   */
  static processGenderData(data: HRData[]) {
    const genderData = data.reduce((acc, emp) => {
      acc[emp.Gender] = (acc[emp.Gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(genderData).map(([gender, count]) => ({
      gender,
      count,
      percentage: ((count / data.length) * 100).toFixed(0) + '%'
    }));
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
      
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return ["< 25", "25-34", "35-44", "45-55", "> 55"].map(group => ({
      ageGroup: group,
      count: ageGroupData[group] || 0
    }));
  }

  /**
   * Process education level data
   */
  static processEducationData(data: HRData[]) {
    const educationMap = {
      1: "High School",
      2: "Associates Degree", 
      3: "Bachelor's Degree",
      4: "Master's Degree",
      5: "Doctoral Degree"
    };

    const educationData = data.reduce((acc, emp) => {
      const education = educationMap[emp.Education as keyof typeof educationMap] || "Unknown";
      acc[education] = (acc[education] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(educationData).map(([education, count]) => ({
      education,
      count
    }));
  }

  /**
   * Get recent attrition employees
   */
  static getRecentAttritionEmployees(data: HRData[], limit: number = 3): AttritionEmployee[] {
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
      const scores = data.map(d => d[category.key as keyof HRData] as number);
      const scoreCounts = [1, 2, 3, 4].map(score => ({
        score,
        count: scores.filter(s => s === score).length
      }));
      
      return {
        category: category.label,
        scoreCounts
      };
    });
  }

  /**
   * Generate simulated monthly attrition trend data
   */
  static generateAttritionTrendData() {
    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      const month = new Date(2021, 4 + i, 1).toLocaleDateString('en', { month: 'short', year: 'numeric' });
      const attritionCount = Math.floor(Math.random() * 60) + 10; // Simulate data
      monthlyData.push({ month, attrition: attritionCount });
    }
    return monthlyData;
  }
}
