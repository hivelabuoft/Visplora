'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheckCircle } from 'react-icons/fi';

const DashboardDesignPage = () => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  
  const handleConfirmation = () => {
    setIsCreating(true);
    
    // Simulate a short loading delay
    setTimeout(() => {
      // Get current dashboard count from localStorage
      const currentCount = localStorage.getItem('dashboardCount');
      const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
      
      // Update the count in localStorage
      localStorage.setItem('dashboardCount', newCount.toString());
      
      // Create a new dashboard with ID
      const dashboardId = `dashboard-${newCount}`;
      
      // Store dashboard info in localStorage
      const dashboards = JSON.parse(localStorage.getItem('dashboards') || '[]');
      dashboards.push({
        id: dashboardId,
        name: `Dashboard ${newCount}`,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('dashboards', JSON.stringify(dashboards));
      
      // Navigate back to main page
      router.push('/');
    }, 800);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Create New Dashboard</h1>
        
        <p className="text-slate-600 mb-8">
          Your dashboard will be created with default settings. You can customize it later.
        </p>
        
        <button
          onClick={handleConfirmation}
          disabled={isCreating}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 
            ${isCreating 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'} 
            text-white font-medium transition-colors`}
        >
          {isCreating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating Dashboard...</span>
            </>
          ) : (
            <>
              <FiCheckCircle size={20} />
              <span>Confirm Creation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardDesignPage;
