import React from 'react';
import { VegaLite } from 'react-vega';
import { HRData, AttritionEmployee } from '../types/interfaces';
import { HRAnalytics } from './analytics';
import { 
  createDepartmentPieChart, 
  createGenderDonutChart, 
  createAgeGroupBarChart, 
  createAttritionTrendChart 
} from '../data/chartSpecs';

/**
 * Reusable dashboard widgets for HR visualizations
 */

interface ChartWidgetProps {
  data: HRData[];
}

export function DepartmentWidget({ data }: ChartWidgetProps) {
  const chartData = HRAnalytics.processDepartmentData(data);
  const spec = createDepartmentPieChart();
  
  return <VegaLite spec={{ ...spec, data: { values: chartData } }} />;
}

export function JobRoleWidget({ data }: ChartWidgetProps) {
  const roleData = HRAnalytics.processJobRoleData(data);

  return (
    <div className="space-y-3">
      {roleData.map((item) => (
        <div key={item.role} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-orange-400 rounded flex items-center justify-center text-white text-xs font-bold">
              {item.rank}
            </div>
            <span className="text-sm">{item.role}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-orange-400 text-white px-2 py-1 rounded text-xs">
              {item.attrition}
            </div>
            <div className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
              {item.total}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GenderWidget({ data }: ChartWidgetProps) {
  const chartData = HRAnalytics.processGenderData(data);
  const spec = createGenderDonutChart();
  
  return <VegaLite spec={{ ...spec, data: { values: chartData } }} />;
}

export function AgeGroupWidget({ data }: ChartWidgetProps) {
  const chartData = HRAnalytics.processAgeGroupData(data);
  const spec = createAgeGroupBarChart();
  
  return <VegaLite spec={{ ...spec, data: { values: chartData } }} />;
}

export function EducationWidget({ data }: ChartWidgetProps) {
  const educationData = HRAnalytics.processEducationData(data);

  return (
    <div className="space-y-2">
      {educationData.map((item) => (
        <div key={item.education} className="flex items-center justify-between">
          <span className="text-sm">{item.education}</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-4 bg-gray-200 rounded">
              <div 
                className="h-full bg-orange-400 rounded"
                style={{ width: `${(item.count / Math.max(...educationData.map(d => d.count))) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium w-8">{item.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SurveyScoreWidget({ data }: ChartWidgetProps) {
  const surveyData = HRAnalytics.processSurveyScoreData(data);

  return (
    <div className="space-y-4">
      {surveyData.map((item) => (
        <div key={item.category} className="text-center">
          <div className="text-xs mb-2">{item.category}</div>
          <div className="flex justify-center gap-1">
            {item.scoreCounts.map((sc) => (
              <div key={sc.score} className="text-center">
                <div className={`w-8 h-6 flex items-center justify-center text-white text-xs ${
                  sc.score === 1 ? 'bg-red-400' :
                  sc.score === 2 ? 'bg-orange-400' :
                  sc.score === 3 ? 'bg-yellow-400' : 'bg-green-400'
                }`}>
                  {sc.count}
                </div>
                <div className="text-xs mt-1">{sc.score}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentAttritionWidget({ data }: ChartWidgetProps) {
  const recentAttrition = HRAnalytics.getRecentAttritionEmployees(data);

  return (
    <div className="space-y-4">
      {recentAttrition.map((emp) => (
        <div key={emp.id} className="border-l-4 border-orange-400 pl-3">
          <div className="font-semibold text-sm">{emp.id}</div>
          <div className="text-xs text-gray-600">{emp.role}</div>
          <div className="text-xs text-gray-500">{emp.department}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Avg. Satisfaction Score: </span>
              <span className="font-medium">{emp.satisfactionScore}</span>
            </div>
            <div>
              <span className="text-gray-500">Performance Rating: </span>
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
      ))}
    </div>
  );
}

export function AttritionTrendWidget({ data }: ChartWidgetProps) {
  const trendData = HRAnalytics.generateAttritionTrendData();
  const spec = createAttritionTrendChart();

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-lg">▼ 85.5% vs. previous month</span>
        </div>
        <div className="text-sm text-gray-500">SELECT PERIOD: W M Q Y</div>
      </div>
      <VegaLite spec={{ ...spec, data: { values: trendData } }} />
    </div>
  );
}
