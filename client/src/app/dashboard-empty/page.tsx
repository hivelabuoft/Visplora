'use client';

import React, { useState } from 'react';
import TopNavbar from '../components/TopNavbar';

const EmptyDashboard: React.FC = () => {
  const [dashboardName, setDashboardName] = useState('Empty Dashboard');

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <TopNavbar projectName={dashboardName} onProjectNameChange={setDashboardName} />
      
      <main className="flex-1 overflow-hidden p-6">
        <div className="h-full bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg 
                className="mx-auto h-24 w-24 text-slate-300" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            
            <h1 className="text-2xl font-semibold text-slate-900 mb-3">
              Empty Dashboard
            </h1>
            
            <p className="text-slate-600 mb-8">
              This dashboard is ready for your data visualizations. 
              Start by adding charts, graphs, and other components to create your perfect dashboard.
            </p>
            
            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Add Chart
              </button>
              
              <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Import Data
              </button>
              
              <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Use Template
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-6 right-6">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span>Components: 0</span>
                <span>•</span>
                <span>Last updated: Just now</span>
                <span>•</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mr-2"></div>
                  <span>Empty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmptyDashboard;