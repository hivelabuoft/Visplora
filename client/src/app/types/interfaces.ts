/**
 * Core interface definitions for HR Dashboard
 */

export interface HRData {
  Age: number;
  Attrition: string;
  BusinessTravel: string;
  DailyRate: number;
  Department: string;
  DistanceFromHome: number;
  Education: number;
  EducationField: string;
  EmployeeCount: number;
  EmployeeNumber: number;
  EnvironmentSatisfaction: number;
  Gender: string;
  HourlyRate: number;
  JobInvolvement: number;
  JobLevel: number;
  JobRole: string;
  JobSatisfaction: number;
  MaritalStatus: string;
  MonthlyIncome: number;
  MonthlyRate: number;
  NumCompaniesWorked: number;
  Over18: string;
  OverTime: string;
  PercentSalaryHike: number;
  PerformanceRating: number;
  RelationshipSatisfaction: number;
  StandardHours: number;
  StockOptionLevel: number;
  TotalWorkingYears: number;
  TrainingTimesLastYear: number;
  WorkLifeBalance: number;
  YearsAtCompany: number;
  YearsInCurrentRole: number;
  YearsSinceLastPromotion: number;
  YearsWithCurrManager: number;
}

export interface KPIMetrics {
  attritionRate: number;
  totalAttrition: number;
  currentEmployees: number;
  totalEmployees: number;
}

export interface AttritionEmployee {
  id: string;
  role: string;
  department: string;
  satisfactionScore: string;
  performanceRating: number;
  monthlyIncome: string;
  salaryHike: string;
}

export interface FilterCriteria {
  department: string;
  jobRole: string;
  gender: string;
  showOnlyAttrition: boolean;
}

export interface VegaLiteSpec {
  $schema: string;
  width?: number;
  height?: number;
  data?: { values: any[] };
  mark: any;
  encoding: any;
  [key: string]: any;
}
