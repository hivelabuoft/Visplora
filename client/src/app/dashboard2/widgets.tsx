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
  EducationWidgetProps
} from '../types/interfaces';
import {
  createDepartmentRetentionChart,
  createAgeGroupBarChart, 
  createDistanceFromHomeChart,
  createGenderAttritionDonutChart,
  createEducationBarChart,
  createEducationFieldBarChart
} from '../data/chartSpecs';

/**
 * Reusable dashboard widgets for HR visualizations
 */
export function DepartmentWidget({ data, onDepartmentClick, selectedDepartment }: DepartmentWidgetProps) {
  const departments = HRAnalytics.getUniqueDepartments(data);
  
  return (
    <div className="grid grid-cols-1">
      {departments.map((dept) => {
        const chartData = HRAnalytics.processDepartmentRetentionData(data, dept);
        const spec = createDepartmentRetentionChart();
        const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

        return (
          <div key={dept} className="flex items-center">            
            <div>
              <VegaLite spec={{ ...spec, data: { values: chartData } }} actions={false} />
            </div>
            <div 
              className={`hover:bg-gray-100 p-2 rounded ml-2 cursor-pointer transition-colors 
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
    <div className="flex flex-col">
      {/* Male Attrition/Retention */}
      <div className="flex flex-row items-center">
        <VegaLite spec={{ ...spec, data: { values: maleData } }} actions={false} />
        <div 
          className={`p-2 rounded cursor-pointer transition-colors ${
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
          className={`p-2 rounded cursor-pointer transition-colors ${
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
    <div className="space-y-4">
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
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-64">
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
