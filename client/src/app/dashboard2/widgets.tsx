import React, { useState } from 'react';
import { VegaLite } from 'react-vega';
import { HRAnalytics } from './analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HRData, 
  ChartWidgetProps, 
  DepartmentWidgetProps,
  JobRoleWidgetProps,
  GenderWidgetProps,
  EducationWidgetProps,
  VegaLiteSpec
} from '../types/interfaces';
import {
  createDepartmentRetentionChart,
  createAgeGroupBarChart, 
  createDistanceFromHomeChart,
  createGenderAttritionDonutChart,
  createEducationBarChart,
  createEducationFieldBarChart
} from '../data/chartSpecs';

export interface WidgetChartData {
  vegaSpec: VegaLiteSpec;
  data: any[];
  fields: string[];
  description: string;
  originalData: HRData[]; // Store original HR data for widget rendering
  filterContext?: any;
}

/**
 * Simplified function to get widget data by element ID - no duplication
 */
export function getWidgetDataForSidebar(elementId: string, data: HRData[], filterContext?: any): WidgetChartData | null {
  switch (elementId) {
    case 'department-widget': {
      const departments = HRAnalytics.getUniqueDepartments(data);
      const allDeptData = departments.map(dept => {
        const chartData = HRAnalytics.processDepartmentRetentionData(data, dept);
        return chartData.map(item => ({ ...item, department: dept }));
      }).flat();

      return {
        vegaSpec: {
          ...createDepartmentRetentionChart(),
          width: 250,
          height: 150,
          facet: { field: 'department', type: 'nominal', columns: 1 }
        },
        data: allDeptData,
        fields: ['department', 'type', 'count', 'percentage'],
        description: 'Employee retention and attrition breakdown by department showing the proportion of employees who stayed versus left the company in each department.',
        originalData: data
      };
    }
    
    case 'job-role-widget': {
      const roleData = HRAnalytics.processJobRoleData(data);
      const chartData = roleData.map(item => [
        { role: item.role, type: 'attrition', count: item.attrition },
        { role: item.role, type: 'retention', count: item.total - item.attrition }
      ]).flat();

      return {
        vegaSpec: {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          width: 280,
          height: 180,
          mark: 'bar',
          encoding: {
            x: { field: 'count', type: 'quantitative', axis: { title: 'Count' } },
            y: { field: 'role', type: 'nominal', axis: { title: 'Job Role', labelLimit: 80 } },
            color: {
              field: 'type',
              type: 'nominal',
              scale: { domain: ['retention', 'attrition'], range: ['#1b2a3a', '#ef9f56'] }
            }
          }
        },
        data: chartData,
        fields: ['role', 'type', 'count'],
        description: 'Employee counts by job role, showing retention vs attrition for each position type within the organization.',
        originalData: data
      };
    }
    
    case 'gender-widget': {
      const maleData = HRAnalytics.processGenderAttritionData(data, 'Male');
      const femaleData = HRAnalytics.processGenderAttritionData(data, 'Female');
      const combinedData = [
        ...maleData.map(item => ({ ...item, gender: 'Male' })),
        ...femaleData.map(item => ({ ...item, gender: 'Female' }))
      ];

      return {
        vegaSpec: {
          ...createGenderAttritionDonutChart(),
          width: 250,
          height: 120,
          facet: { field: 'gender', type: 'nominal', columns: 2 }
        },
        data: combinedData,
        fields: ['gender', 'type', 'count', 'percentage'],
        description: 'Gender-based analysis of employee attrition and retention, comparing how male and female employees are distributed across retention categories.',
        originalData: data
      };
    }
      case 'age-group-widget': {
      const chartData = HRAnalytics.processAgeGroupData(data);
      const spec = { ...createAgeGroupBarChart(), width: 280, height: 160 };
      return {
        vegaSpec: spec,
        data: chartData,
        fields: ['ageGroup', 'type', 'count'],
        description: 'Age group distribution showing employee retention and attrition patterns across different age demographics.',
        originalData: data
      };
    }
    
    case 'education-widget': {
      const showEducationField = filterContext?.showEducationField;
      const chartData = showEducationField 
        ? HRAnalytics.processEducationFieldData(data)
        : HRAnalytics.processEducationData(data);
      const spec = showEducationField 
        ? createEducationFieldBarChart()
        : createEducationBarChart();
      return {
        vegaSpec: { ...spec, width: 280, height: 160 },
        data: chartData,
        fields: showEducationField ? ['educationField', 'type', 'count'] : ['education', 'type', 'count'],
        description: showEducationField 
          ? 'Employee distribution by education field, showing retention and attrition patterns across different areas of study.'
          : 'Employee distribution by education level, showing how different educational backgrounds correlate with retention and attrition.',
        originalData: data,
        filterContext: { showEducationField }
      };
    }
      case 'distance-widget': {
      const { processedData } = HRAnalytics.processDistanceFromHomeData(data);
      const spec = { ...createDistanceFromHomeChart(), width: 280, height: 160 };
      return {
        vegaSpec: spec,
        data: processedData,
        fields: ['interval', 'type', 'count'],
        description: 'Analysis of employee commute distance impact on retention, showing attrition and retention patterns based on distance from home to workplace.',
        originalData: data
      };
    }
    
    case 'survey-score-widget': {
      const surveyData = HRAnalytics.processSurveyScoreData(data);
      const chartData = surveyData.map(item => 
        item.scoreCounts.map(sc => [
          { category: item.category, score: sc.score, type: 'retention', count: sc.retention },
          { category: item.category, score: sc.score, type: 'attrition', count: sc.attrition }
        ])
      ).flat(2);

      return {
        vegaSpec: {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          width: 280,
          height: 200,
          mark: 'bar',
          encoding: {
            x: { field: 'score', type: 'ordinal', axis: { title: 'Survey Score' } },
            y: { field: 'count', type: 'quantitative', axis: { title: 'Count' } },
            color: {
              field: 'type',
              type: 'nominal',
              scale: { domain: ['retention', 'attrition'], range: ['#1b2a3a', '#ef9f56'] }
            },
            row: { field: 'category', type: 'nominal' }
          }
        },
        data: chartData,
        fields: ['category', 'score', 'type', 'count'],
        description: 'Employee satisfaction survey scores across different categories, showing how satisfaction levels correlate with employee retention and attrition.',
        originalData: data
      };
    }
    
    case 'recent-attritions-widget': {
      const attritionEmployees = data.filter(emp => emp.Attrition === 'Yes').slice(0, 50);
      return {
        vegaSpec: {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          width: 280,
          height: 160,
          mark: 'point',
          encoding: {
            x: { field: 'JobSatisfaction', type: 'quantitative', title: 'Job Satisfaction' },
            y: { field: 'MonthlyIncome', type: 'quantitative', title: 'Monthly Income' },
            color: { field: 'Department', type: 'nominal' },
            size: { field: 'Age', type: 'quantitative' }
          }
        },
        data: attritionEmployees,
        fields: ['JobSatisfaction', 'MonthlyIncome', 'Department', 'Age', 'JobRole'],
        description: 'Recent employee attritions showing relationship between job satisfaction, income, department, and age.',
        originalData: data
      };
    }
    
    case 'attrition-rate-kpi':
    case 'total-attrition-kpi':
    case 'current-employees-kpi': {
      const kpis = HRAnalytics.calculateKPIMetrics(data);
      
      if (elementId === 'attrition-rate-kpi') {
        return {
          vegaSpec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 120, height: 120,
            mark: { type: 'arc', innerRadius: 20, outerRadius: 50 },
            encoding: {
              theta: { field: 'value', type: 'quantitative', scale: { range: [0, 6.28] } },
              color: { value: '#ef9f56' }
            }
          },
          data: [{ metric: 'Attrition Rate', value: parseFloat(kpis.attritionRate.toString()) }],
          fields: ['metric', 'value'],
          description: `Current attrition rate of ${kpis.attritionRate}% representing the percentage of employees who have left the organization.`,
          originalData: data
        };
      }
      
      if (elementId === 'total-attrition-kpi') {
        return {
          vegaSpec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 150, height: 100, mark: 'bar',
            encoding: {
              x: { field: 'category', type: 'nominal', axis: { labelAngle: -45 } },
              y: { field: 'count', type: 'quantitative' },
              color: { field: 'category', scale: { domain: ['Total Attrition', 'Current Employees'], range: ['#ef9f56', '#1b2a3a'] } }
            }
          },
          data: [
            { category: 'Total Attrition', count: kpis.totalAttrition },
            { category: 'Current Employees', count: kpis.currentEmployees }
          ],
          fields: ['category', 'count'],
          description: `Total of ${kpis.totalAttrition} employees who have left the organization out of the total workforce.`,
          originalData: data
        };
      }
        if (elementId === 'current-employees-kpi') {
          return {
          vegaSpec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 120, height: 120, mark: { type: 'arc' },
            encoding: {
              theta: { field: 'count', type: 'quantitative' },
              color: { field: 'status', scale: { domain: ['Current Employees', 'Attrition'], range: ['#1b2a3a', '#ef9f56'] } }
            }
          },
          data: [
            { status: 'Current Employees', count: kpis.currentEmployees },
            { status: 'Attrition', count: kpis.totalAttrition }
          ],
          fields: ['status', 'count'],
          description: `Current employee count of ${kpis.currentEmployees} representing active workforce members in the organization.`,
          originalData: data
        };
      }
      return null;
    }
    
    default:
      return null;
  }
}

export function DepartmentWidget({ data, onDepartmentClick, selectedDepartment }: DepartmentWidgetProps) {
  const departments = HRAnalytics.getUniqueDepartments(data);
  
  return (
    <div className="grid grid-cols-1 gap-2">
      {departments.map((dept) => {
        const chartData = HRAnalytics.processDepartmentRetentionData(data, dept);
        const spec = createDepartmentRetentionChart();
        const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

        return (
          <div key={dept} className="flex items-center justify-center">            
            <div>
              <VegaLite spec={{ ...spec, data: { values: chartData } }} actions={false} />
            </div>
            <div 
              className={`hover:bg-gray-100 p-2 w-28 rounded ml-2 cursor-pointer transition-colors 
                ${selectedDepartment === dept ? 'bg-blue-100 border border-blue-300' : ''}`}
              onClick={() => {
                // Toggle selection: if same department is clicked, clear filter
                if (selectedDepartment === dept) {
                  onDepartmentClick?.('all');
                } else {
                  onDepartmentClick?.(dept);
                }
              }}
            >
              <h4 className="font-medium text-sm">{dept.replace("Research & Development", "R & D").replace("Human Resources", "HR")}</h4>
              <div className="text-xs text-gray-600">Total: {totalCount}</div>
              <div className="flex gap-4 mt-1">
                {chartData.map((item) => (
                  <div key={item.type} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      item.type === 'retention' ? 'bg-gray-800' : 'bg-[#ef9f56]'
                    }`}></div>
                    <span className="text-xs">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function JobRoleWidget({ data, onJobRoleClick, selectedJobRole }: JobRoleWidgetProps) {
  const roleData = HRAnalytics.processJobRoleData(data);
  return (
    <div className="space-y-2">
      {roleData.map((item) => (
        <div key={item.role} className="flex items-center justify-between">
          <div 
            className={`flex items-center gap-2 mr-2 cursor-pointer transition-colors rounded p-1 ${
              selectedJobRole === item.role ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
            }`}
            onClick={() => {
              if (selectedJobRole === item.role) {
                onJobRoleClick?.('all');
              } else {
                onJobRoleClick?.(item.role);
              }
            }}
          >
            <div className="w-9 h-9 rounded flex items-center justify-center text-xs font-semibold">
              {item.rank}
            </div>
            <div className="w-full h-9 flex items-center px-2 rounded text-sm">{item.role}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#ef9f56] text-white px-2 py-1 rounded text-xs">{item.attrition}</div>
            <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs">{item.total - item.attrition}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GenderWidget({ data, onGenderClick, selectedGender }: GenderWidgetProps) {
  const maleData = HRAnalytics.processGenderAttritionData(data, 'Male');
  const femaleData = HRAnalytics.processGenderAttritionData(data, 'Female');
  const spec = createGenderAttritionDonutChart();

  return (
    <div className="flex flex-col justify-center items-center">
      {/* Male Attrition/Retention */}
      <div className="flex flex-row items-center">
        <VegaLite spec={{ ...spec, data: { values: maleData } }} actions={false} />
        <div 
          className={`p-2 w-20 rounded cursor-pointer transition-colors ${
            selectedGender === 'Male' ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
          }`}
          onClick={() => {
            if (selectedGender === 'Male') {
              onGenderClick?.('all');
            } else {
              onGenderClick?.('Male');
            }
          }}
        >
          <div className="text-sm font-semibold">Male</div>
          <div className="text-xs text-gray-600">Total: {maleData.reduce((sum, item) => sum + item.count, 0)}</div>
        </div>
      </div>

      {/* Female Attrition/Retention */}
      <div className="flex flex-row items-center">
        <VegaLite spec={{ ...spec, data: { values: femaleData } }} actions={false} />
        <div 
          className={`p-2 w-20 rounded cursor-pointer transition-colors ${
            selectedGender === 'Female' ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
          }`}
          onClick={() => {
            if (selectedGender === 'Female') {
              onGenderClick?.('all');
            } else {
              onGenderClick?.('Female');
            }
          }}
        >
          <div className="text-sm font-semibold">Female</div>
          <div className="text-xs text-gray-600">Total: {femaleData.reduce((sum, item) => sum + item.count, 0)}</div>
        </div>
      </div>
    </div>
  );
}

export function AgeGroupWidget({ data }: ChartWidgetProps) {
  const chartData = HRAnalytics.processAgeGroupData(data);
  const spec = createAgeGroupBarChart();
  
  return <VegaLite spec={{ ...spec, data: { values: chartData } }} actions={false} />;
}

export function EducationWidget({ data, showEducationField = false }: EducationWidgetProps) {
  const chartData = showEducationField 
    ? HRAnalytics.processEducationFieldData(data)
    : HRAnalytics.processEducationData(data);
  const spec = showEducationField 
    ? createEducationFieldBarChart()
    : createEducationBarChart();
  
  return (
    <div>
      <VegaLite spec={{ ...spec, data: { values: chartData } }} actions={false} />
    </div>
  );
}

export function SurveyScoreWidget({ data }: ChartWidgetProps) {
  const surveyData = HRAnalytics.processSurveyScoreData(data);

  return (
    <div className="space-y-8">
      {/* Score Header */}
      <div className="flex justify-between items-center">
        <div className='text-xs ml-2'>Score {'>>'}</div>
        <div className="flex text-center justify-center gap-1">
          {[1, 2, 3, 4].map((score) => (
            <div key={score} className="w-8 text-center text-xs">
              {score}
            </div>
          ))}
        </div>
      </div>
      {surveyData.map((item) => (
        <div key={item.category} className="flex justify-center items-center">
          <div className="text-sm mr-2 w-full h-12 px-2 rounded hover:bg-gray-200 flex items-center justify-start">
            {item.category}
          </div>
          <div className="flex justify-center gap-1">
            {item.scoreCounts.map((sc) => (
              <div key={sc.score} className="text-center">
                {/* Retention Count */}
                <div className="w-8 h-6 flex items-center justify-center text-white text-xs bg-gray-700 hover:bg-gray-600">
                  {sc.retention}
                </div>
                {/* Attrition Count */}
                <div className="w-8 h-6 flex items-center justify-center text-white text-xs bg-[#ef9f56] hover:bg-[#e58f46]">
                  {sc.attrition}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScrollableAttritionWidget({ data }: ChartWidgetProps) {
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [jobRoleFilter, setJobRoleFilter] = useState<string>('all');

  // Get all attrition employees
  const allAttritionEmployees = data
    .filter(emp => emp.Attrition === 'Yes')
    .map((emp) => ({
      id: `E_${emp.EmployeeNumber}`,
      role: emp.JobRole,
      department: emp.Department,
      satisfactionScore: emp.JobSatisfaction.toFixed(1),
      performanceRating: emp.PerformanceRating,
      monthlyIncome: `$${emp.MonthlyIncome.toLocaleString()}`,
      salaryHike: `${emp.PercentSalaryHike}%`,
      gender: emp.Gender,
      age: emp.Age
    }));

  // Apply filters
  const filteredEmployees = allAttritionEmployees.filter(emp => {
    if (departmentFilter !== 'all' && emp.department !== departmentFilter) return false;
    if (jobRoleFilter !== 'all' && emp.role !== jobRoleFilter) return false;
    return true;
  });

  // Get unique values for filter dropdowns
  const uniqueDepartments = [...new Set(allAttritionEmployees.map(emp => emp.department))];
  const uniqueJobRoles = [...new Set(allAttritionEmployees.map(emp => emp.role))];

  return (
    <div className="h-full flex flex-col">
      {/* Filter Controls */}
      <div className="flex gap-2 mb-4">
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {uniqueDepartments.map(dept => (
              <SelectItem key={dept} value={dept}>
                {dept === 'Research & Development' ? 'R&D' : dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={jobRoleFilter} onValueChange={setJobRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Job Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {uniqueJobRoles.map(role => (
              <SelectItem key={role} value={role}>
                {role.length > 15 ? `${role.substring(0, 12)}...` : role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-86">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => (
            <div key={emp.id} className="border-l-4 border-[#ef9f56] pl-3 bg-gray-50 p-2 rounded-r">
              <div className="text-sm font-semibold text-gray-700">{emp.id}</div>
              <div className="text-sm text-gray-600">Job Role: {emp.role}</div>
              <div className="flex justify-start gap-4 items-start mb-2">
                <div className="text-xs text-gray-500">
                  Dept: {emp.department === 'Research & Development' ? 'R & D' : emp.department}
                </div>
                <div className="text-xs text-gray-500">Age: {emp.age} | {emp.gender}</div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>
                  <span className="text-gray-500">Job Satisfaction: </span>
                  <span className="font-medium">{emp.satisfactionScore}</span>
                </div>
                <div>
                  <span className="text-gray-500">Performance: </span>
                  <span className="font-medium">{emp.performanceRating}</span>
                </div>
                <div>
                  <span className="text-gray-500">Monthly Income: </span>
                  <span className="font-medium">{emp.monthlyIncome}</span>
                </div>
                <div>
                  <span className="text-gray-500">Salary Hike: </span>
                  <span className="font-medium">{emp.salaryHike}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No attrition employees found with current filters
          </div>
        )}
      </div>
      
      {/* Results counter */}
      <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
        Showing {filteredEmployees.length} of {allAttritionEmployees.length} attrition employees
      </div>
    </div>
  );
}

export function DistanceFromHomeWidget({ data }: { data: HRData[] }) {
  const { processedData, sortedIntervals } = HRAnalytics.processDistanceFromHomeData(data);
  const spec = createDistanceFromHomeChart();

  // Update the chart spec with the sorted intervals for the x-axis sort order
  const updatedSpec = {
    ...spec,
    encoding: {
      ...spec.encoding,
      x: {
        ...spec.encoding.x,
        sort: sortedIntervals, // Use the sorted intervals for explicit sort order
      },
    },
    data: { values: processedData },
  };

  return <VegaLite spec={updatedSpec} actions={false} />;
}

/**
 * Function to render original dashboard widgets for sidebar display
 */
export function renderWidgetForSidebar(elementId: string, originalData?: HRData[], filterContext?: any): React.ReactNode {
  // If no data is provided, show a placeholder
  if (!originalData || originalData.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-sm">Widget Preview</div>
        <div className="text-xs mt-1">Data not available</div>
      </div>
    );
  }

  switch (elementId) {
    case 'department-widget':
      return (
        <div className="max-w-sm">
          <DepartmentWidget 
            data={originalData} 
            onDepartmentClick={() => {}} 
            selectedDepartment="all" 
          />
        </div>
      );
    
    case 'job-role-widget':
      return (
        <div className="max-w-sm">
          <JobRoleWidget 
            data={originalData} 
            onJobRoleClick={() => {}} 
            selectedJobRole="all" 
          />
        </div>
      );
    
    case 'gender-widget':
      return (
        <div className="max-w-sm">
          <GenderWidget 
            data={originalData} 
            onGenderClick={() => {}} 
            selectedGender="all" 
          />
        </div>
      );
    
    case 'age-group-widget':
      return (
        <div className="max-w-sm">
          <AgeGroupWidget data={originalData} />
        </div>
      );
    
    case 'education-widget':
      return (
        <div className="max-w-sm">
          <EducationWidget 
            data={originalData} 
            showEducationField={filterContext?.showEducationField || false}
          />
        </div>
      );
    
    case 'distance-widget':
      return (
        <div className="max-w-sm">
          <DistanceFromHomeWidget data={originalData} />
        </div>
      );
    
    case 'survey-score-widget':
      return (
        <div className="max-w-sm max-h-80 overflow-y-auto">
          <SurveyScoreWidget data={originalData} />
        </div>
      );
    
    case 'recent-attritions-widget':
      return (
        <div className="h-64">
          <ScrollableAttritionWidget data={originalData} />
        </div>
      );
    
    case 'attrition-rate-kpi':
    case 'total-attrition-kpi':
    case 'current-employees-kpi':
      const kpis = HRAnalytics.calculateKPIMetrics(originalData);
      
      if (elementId === 'attrition-rate-kpi') {
        return (
          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                <span className="text-lg">📊</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {kpis.attritionRate}%
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Attrition Rate</div>
          </div>
        );
      }
      
      if (elementId === 'total-attrition-kpi') {
        return (
          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white">
                <span className="text-lg">👥</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {kpis.totalAttrition}
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Total Attrition</div>
          </div>
        );
      }
      
      if (elementId === 'current-employees-kpi') {
        return (
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <span className="text-lg">👤</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {kpis.currentEmployees}
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Current Employees</div>
          </div>
        );
      }
      break;
    
    default:
      return (
        <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-4xl mb-2">❓</div>
          <div>Widget not found</div>
        </div>
      );
  }
}
