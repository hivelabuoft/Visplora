"use client";

import React, { useState, useEffect } from "react";
import { HRData, FilterCriteria } from "../types/interfaces";
import { DataLoader } from "./dataLoader";
import { HRAnalytics } from "./analytics";
import { 
  DepartmentWidget,
  JobRoleWidget,
  GenderWidget,
  AgeGroupWidget,
  EducationWidget,
  SurveyScoreWidget,
  ScrollableAttritionWidget,
  DistanceFromHomeWidget,
  getWidgetDataForSidebar
} from "./widgets";
import DashboardPlayground from "../components/DashboardPlayground";
import { LinkableCard } from "@/components/ui/card-linkable";
import { useSelectedElements, SelectedElementsProvider } from "../../components/context/SelectedElementsContext";

function HRAttritionDashboardContent() {
  const [data, setData] = useState<HRData[]>([]);
  const [filteredData, setFilteredData] = useState<HRData[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedJobRole, setSelectedJobRole] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [showOnlyAttrition, setShowOnlyAttrition] = useState(false);
  const [showEducationField, setShowEducationField] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardHeight, setDashboardHeight] = useState<number>(0);
  const dashboardContentRef = React.useRef<HTMLDivElement>(null);
  const { addElement, isElementSelected } = useSelectedElements();
  
  // Handle adding element to sidebar
  const handleAddToSidebar = (elementId: string, elementName: string, elementType: string) => {
    if (isElementSelected(elementId)) {
      return; // Already selected
    }
    const elementData = getWidgetDataForSidebar(
      elementId, 
      filteredData,
      { showEducationField }
    );
    if (elementData) {
      addElement({
        id: elementId,
        name: elementName,
        type: elementType,
        description: elementData.description,
        dashboardSource: 'HR Attrition Dashboard',
        fields: elementData.fields,
        filterContext: {
          selectedDepartment,
          selectedJobRole,
          selectedGender,
          showOnlyAttrition,
          showEducationField
        },
        metadata: {
          createdAt: new Date(),
          filterContext: {
            selectedDepartment,
            selectedJobRole,
            selectedGender,
            showOnlyAttrition,
            showEducationField
          }
        }
      });
    }
  };

  // Helper function to check if any filters are active
  const hasActiveFilters = () => {
    return selectedDepartment !== 'all' || selectedJobRole !== 'all' || selectedGender !== 'all';
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setSelectedDepartment('all');
    setSelectedJobRole('all');
    setSelectedGender('all');
  };

  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        const parsed = await DataLoader.loadEmployeeData();
        if (DataLoader.validateData(parsed)) {
          setData(parsed);
          setFilteredData(parsed);
        } else {
          console.error('Invalid data structure');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter data based on selected criteria
  useEffect(() => {
    const criteria: FilterCriteria = {
      department: selectedDepartment,
      jobRole: selectedJobRole,
      gender: selectedGender,
      showOnlyAttrition
    };
    const filtered = HRAnalytics.filterEmployeeData(data, criteria);
    setFilteredData(filtered);  }, [data, selectedDepartment, selectedJobRole, selectedGender, showOnlyAttrition]);
  // Measure dashboard height when content changes
  useEffect(() => {
    if (dashboardContentRef.current) {
      const height = dashboardContentRef.current.scrollHeight;
      setDashboardHeight(height);
    }
  }, [data, filteredData]);

  // Get unique departments and KPIs
  const kpis = HRAnalytics.calculateKPIMetrics(data);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading HR Attrition Dashboard...</div>
      </div>
    );
  }
  const dashboardContent = (
    <div ref={dashboardContentRef} className="min-h-screen bg-[#f5f4f2] m-6 rounded-xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex flex-row gap-4">
            <h1 className="text-3xl font-bold text-gray-800 tracking-wide">HR ATTRITION DASHBOARD</h1>
            {/* Clear All Filters Button */}
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
          <div className="flex flex-row items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">SHOW ONLY ATTRITION</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyAttrition}
                  onChange={(e) => setShowOnlyAttrition(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${ showOnlyAttrition ? "bg-[#ef9f56]" : "bg-gray-300"}`}>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${ showOnlyAttrition ? "translate-x-5" : "" }`}/>
                </div>
              </label>
            </div>
            
            <div className="text-right">
              <div className="flex flex-row gap-2 text-sm">
                <span className="flex items-center gap-1 mr-2">
                  <div className="w-4 h-4 bg-black rounded-full"></div>
                  RETENTION
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-[#ef9f56] rounded-full"></div>
                  ATTRITION
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column - Overview & Department */}
        <div className="col-span-5 space-y-4 h-full">
          {/* Overview Cards - Make each KPI its own linkable element */}
          <div className="grid grid-cols-3 gap-4">
            <LinkableCard 
              elementId="attrition-rate-kpi"
              className="bg-white border-none shadow-sm rounded-lg p-4"
              elementName="Attrition Rate KPI"
              elementType="KPI Metric"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-sm">📊</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {kpis.attritionRate}%
                </div>
                <div className="text-xs text-gray-500 uppercase">Attrition Rate</div>
              </div>
            </LinkableCard>
            
            <LinkableCard 
              elementId="total-attrition-kpi"
              className="bg-white border-none shadow-sm rounded-lg p-4"
              elementName="Total Attrition KPI"
              elementType="KPI Metric"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-sm">👥</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {kpis.totalAttrition}
                </div>
                <div className="text-xs text-gray-500 uppercase">Total Attrition</div>
              </div>
            </LinkableCard>
            
            <LinkableCard 
              elementId="current-employees-kpi"
              className="bg-white border-none shadow-sm rounded-lg p-4"
              elementName="Current Employees KPI"
              elementType="KPI Metric"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {kpis.currentEmployees}
                </div>
                <div className="text-xs text-gray-500 uppercase">Current Employees</div>
              </div>
            </LinkableCard>
          </div>
          
          {/* Department and Job Role Analysis - Separate LinkableCards */}
          <div className="grid grid-cols-2 gap-4">
            <LinkableCard 
              elementId="department-widget"
              className="bg-white border-none shadow-sm rounded-lg"
              elementName="Department Analysis"
              elementType="Chart Widget"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="p-4">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-700 font-mono">DEPARTMENT</h3>
                  {selectedDepartment !== 'all' && (
                    <button
                      onClick={() => setSelectedDepartment('all')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <DepartmentWidget data={filteredData} onDepartmentClick={setSelectedDepartment} selectedDepartment={selectedDepartment} />
              </div>
            </LinkableCard>
            
            <LinkableCard 
              elementId="job-role-widget"
              className="bg-white border-none shadow-sm rounded-lg"
              elementName="Job Role Analysis"
              elementType="Chart Widget"
              onAddToSidebar={handleAddToSidebar}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-700 font-mono">JOB ROLE</h3>
                  {selectedJobRole !== 'all' && (
                    <button
                      onClick={() => setSelectedJobRole('all')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <JobRoleWidget 
                  data={filteredData} 
                  onJobRoleClick={setSelectedJobRole}
                  selectedJobRole={selectedJobRole}
                />
              </div>
            </LinkableCard>
          </div>
          
          {/* Distance From Home */}
          <LinkableCard 
            elementId="distance-widget"
            className="bg-white shadow-sm rounded-lg"
            elementName="Distance From Home"
            elementType="Chart Widget"
            onAddToSidebar={handleAddToSidebar}
          >
            <div className="p-4">
              <h3 className="text-lg font-bold font-mono text-gray-700 mb-4">DISTANCE FROM HOME</h3>
              <div className="text-center">
                <DistanceFromHomeWidget data={filteredData} />
              </div>
            </div>
          </LinkableCard>
        </div>
        {/* Right Side - Demographics, Survey Score & Recent Attrition */}
        <div className="col-span-7 space-y-4">
          {/* Demographics - Split into individual linkable widgets */}
          <div className="grid grid-cols-3 gap-4">
            <LinkableCard 
              elementId="gender-widget"
              className="bg-white border-none shadow-sm rounded-lg"
              elementName="Gender Analysis"
              elementType="Chart Widget"
              onAddToSidebar={handleAddToSidebar}
              >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold font-mono text-gray-700">GENDER</h4>
                  {selectedGender !== 'all' && (
                    <button
                    onClick={() => setSelectedGender('all')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <GenderWidget 
                  data={filteredData} 
                  onGenderClick={setSelectedGender}
                  selectedGender={selectedGender}
                />
              </div>
            </LinkableCard>
            
            <LinkableCard 
              elementId="age-group-widget"
              className="bg-white border-none shadow-sm rounded-lg"
              elementName="Age Group Analysis"
              elementType="Chart Widget"
              onAddToSidebar={handleAddToSidebar}
              >
              <div className="p-4">
                <h4 className="text-lg font-bold font-mono text-gray-700 mb-4">AGE GROUP</h4>
                <AgeGroupWidget data={filteredData} />
              </div>
            </LinkableCard>
            
            <LinkableCard 
              elementId="education-widget"
              className="bg-white border-none shadow-sm rounded-lg"
              elementName="Education Analysis"
              elementType="Chart Widget"
              onAddToSidebar={handleAddToSidebar}
              >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold font-mono text-gray-700">{!showEducationField ? "EDUCATION" : "EDUCATION FIELD"}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Toggle</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showEducationField}
                        onChange={(e) => setShowEducationField(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-8 h-4 rounded-full transition-colors ${showEducationField ? "bg-[#ef9f56]" : "bg-gray-300"}`}>
                        <div className={`dot absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${showEducationField ? "translate-x-4" : ""}`}/>
                      </div>
                    </label>
                  </div>
                </div>
                <EducationWidget data={filteredData} showEducationField={showEducationField} />
              </div>
            </LinkableCard>
          </div>
          
          {/* Survey Score and Recent Attrition - As separate widgets */}
          <div className="grid grid-cols-2 gap-4">
            <LinkableCard 
              elementId="survey-score-widget"
              className="bg-white border-none shadow-sm rounded-lg h-full"
              elementName="Survey Score Analysis"
              elementType="Chart Widget"
              onAddToSidebar={handleAddToSidebar}
              >
              <div className="p-4 h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-700 font-mono mb-4">SURVEY SCORE</h3>
                <div className="h-full">
                  <SurveyScoreWidget data={filteredData} />
                </div>
              </div>
            </LinkableCard>
            
            <LinkableCard 
              elementId="recent-attritions-widget"
              className="bg-white border-none shadow-sm rounded-lg h-full"
              elementName="Recent Attritions"
              elementType="Data Widget"
              onAddToSidebar={handleAddToSidebar}
              >
              <div className="p-4 h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-700 font-mono mb-4">RECENT ATTRITIONS</h3>
                <div className="flex-1">
                  <ScrollableAttritionWidget data={filteredData}/>
                </div>
              </div>
            </LinkableCard>
          </div>
        </div>
      </div>
    </div>
  );  
  
  return (    
  <DashboardPlayground
      isActive={true}
      dashboardTitle="HR Attrition Dashboard"
      dashboardType="hr-attrition"
      onAddToCanvas={() => {
        console.log('Dashboard added to canvas from playground');
      }}
    >
      {dashboardContent}
    </DashboardPlayground>
  );
}

export default function HRAttritionDashboard() {
  return (
    <SelectedElementsProvider>
      <HRAttritionDashboardContent />
    </SelectedElementsProvider>
  );
}
