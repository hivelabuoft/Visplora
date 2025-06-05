"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HRData, FilterCriteria } from "../types/interfaces";
import { DataLoader } from "./dataLoader";
import { HRAnalytics } from "./analytics";
import { DepartmentWidget, JobRoleWidget, GenderWidget, AgeGroupWidget, EducationWidget, SurveyScoreWidget, ScrollableAttritionWidget, DistanceFromHomeWidget } from "./widgets";
import DashboardControls from "../components/DashboardControls";
import DashboardPlayground from "../components/DashboardPlayground";

export default function HRAttritionDashboard() {
  const [data, setData] = useState<HRData[]>([]);
  const [filteredData, setFilteredData] = useState<HRData[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedJobRole, setSelectedJobRole] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [showOnlyAttrition, setShowOnlyAttrition] = useState(false);
  const [showEducationField, setShowEducationField] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaygroundMode, setIsPlaygroundMode] = useState(false);

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
    setFilteredData(filtered);
  }, [data, selectedDepartment, selectedJobRole, selectedGender, showOnlyAttrition]);

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
    <div className="min-h-5/6 bg-[#f5f4f2] m-6 rounded-xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex flex-col sm:flex-row items-center gap-8">
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
              <div className="flex flex-col lg:flex-row gap-2 text-sm">
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
        <div className="col-span-12 lg:col-span-5 space-y-4 h-full">
          {/* Overview Cards */}
          <Card className="bg-white border-none shadow-sm gap-2">
            <CardHeader>
              <div className="flex items-center justify-start gap-4">
                <CardTitle className="text-lg font-bold text-gray-700 font-mono">OVERVIEW</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
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
              </div>
            </CardContent>
          </Card>

          <Card className="xl:flex-row justify-around">
            {/* Department Analysis */}
            <div className="bg-0 border-none shadow-none gap-2">
                <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="text-lg font-bold text-gray-700 font-mono mb-2">DEPARTMENT</CardTitle>
                      {selectedDepartment !== 'all' && (
                        <button
                          onClick={() => setSelectedDepartment('all')}
                          className="text-xs bg-blue-100 text-blue-700 ml-2 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                </CardHeader>
                <CardContent>
                    <DepartmentWidget data={filteredData} onDepartmentClick={setSelectedDepartment} selectedDepartment={selectedDepartment} />
                </CardContent>
            </div>
            {/* Job Role Analysis */}
            <div className="bg-0 border-none shadow-none gap-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-gray-700 font-mono">JOB ROLE</CardTitle>
                      {selectedJobRole !== 'all' && (
                        <button
                          onClick={() => setSelectedJobRole('all')}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                </CardHeader>
                <CardContent>
                    <JobRoleWidget 
                      data={filteredData} 
                      onJobRoleClick={setSelectedJobRole}
                      selectedJobRole={selectedJobRole}
                    />
                </CardContent>
            </div>
          </Card>
          {/* Bottom Row - Distance From Home */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-mono text-gray-700 font-mono">DISTANCE FROM HOME</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <DistanceFromHomeWidget data={filteredData} />
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Demographics, Survey Score & Recent Attrition */}
        <div className="col-span-12 lg:col-span-7 grid gap-4">
          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-700 font-mono">DEMOGRAPHICS</CardTitle>
                {selectedGender !== 'all' && (
                  <button
                    onClick={() => setSelectedGender('all')}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-row justify-center sm:justify-between text-center lg:text-start flex-wrap">
              {/* Gender Distribution */}
              <div className="pr-4 xl:border-r-2 border-gray-300">
                <h4 className="font-semibold text-gray-600 mb-3">GENDER</h4>
                <GenderWidget 
                  data={filteredData} 
                  onGenderClick={setSelectedGender}
                  selectedGender={selectedGender}
                />
              </div>
              {/* Age Group Distribution */}
              <div className="px-4 xl:border-r-2 border-gray-300">
                <h4 className="font-semibold text-gray-600 mb-3">AGE GROUP</h4>
                <AgeGroupWidget data={filteredData} />
              </div>
              {/* Education Distribution */}
              <div className="pl-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-600">{!showEducationField ? "EDUCATION" : "EDUCATION FIELD"}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Toggle Education</span>
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
            </CardContent>
          </Card>
        
          {/* Survey Score and Recent Attrition */}
          <div className="grid grid-cols-7 gap-4">
            <div className="col-span-7 xl:col-span-3">
              <Card className="bg-white border-none shadow-sm h-full gap-2">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-700 font-mono">SURVEY SCORE</CardTitle>
                </CardHeader>
                <CardContent>
                  <SurveyScoreWidget data={filteredData} />
                </CardContent>
              </Card>
            </div>
          
            <div className="col-span-7 xl:col-span-4">
              <Card className="bg-white border-none shadow-sm h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-700 font-mono">RECENT ATTRITIONS</CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                  <ScrollableAttritionWidget data={filteredData}/>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
        {/* Dashboard Controls for Canvas Integration */}
      {!isPlaygroundMode && (
        <DashboardControls 
          dashboardTitle="HR Attrition Dashboard"
          dashboardType="hr-attrition"
          onAddToCanvas={() => {
            console.log('Dashboard added to canvas');
          }}
          onPlaygroundMode={() => setIsPlaygroundMode(true)}
        />
      )}
    </div>
  );

  return (
    <>
      {dashboardContent}
        <DashboardPlayground
        isActive={isPlaygroundMode}
        onClose={() => setIsPlaygroundMode(false)}
        dashboardTitle="HR Attrition Dashboard"
        dashboardType="hr-attrition"
        onAddToCanvas={() => {
          console.log('Dashboard added to canvas from playground');
        }}
      >
        {dashboardContent}
      </DashboardPlayground>
    </>
  );
}
