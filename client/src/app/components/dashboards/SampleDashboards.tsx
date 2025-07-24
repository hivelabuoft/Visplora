import React from 'react';

export const SampleDashboard: React.FC = () => {
  return (
    <div className="w-full h-full p-4 bg-gradient-to-br from-blue-50 to-white">
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Revenue</h4>
          <div className="text-lg font-bold text-blue-600">$45,231</div>
          <div className="text-xs text-green-500">+12.5%</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Users</h4>
          <div className="text-lg font-bold text-purple-600">8,459</div>
          <div className="text-xs text-green-500">+8.2%</div>
        </div>
        <div className="col-span-2 bg-white rounded-lg p-3 shadow-sm border">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Activity Chart</h4>
          <div className="h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded flex items-end justify-around p-2">
            <div className="w-2 bg-blue-400 h-8 rounded-t"></div>
            <div className="w-2 bg-blue-500 h-12 rounded-t"></div>
            <div className="w-2 bg-blue-600 h-6 rounded-t"></div>
            <div className="w-2 bg-purple-400 h-10 rounded-t"></div>
            <div className="w-2 bg-purple-500 h-14 rounded-t"></div>
            <div className="w-2 bg-purple-600 h-8 rounded-t"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SampleChart: React.FC = () => {
  return (
    <div className="w-full h-full p-3 bg-gradient-to-br from-orange-50 to-white">
      <div className="bg-white rounded-lg p-3 h-full shadow-sm border">
        <h4 className="text-xs font-semibold text-gray-700 mb-3">Sales Trend</h4>
        <div className="h-full flex items-end justify-around">
          <div className="flex flex-col items-center">
            <div className="w-4 bg-orange-400 h-16 rounded-t mb-1"></div>
            <span className="text-xs text-gray-500">Jan</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 bg-orange-500 h-20 rounded-t mb-1"></div>
            <span className="text-xs text-gray-500">Feb</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 bg-orange-600 h-12 rounded-t mb-1"></div>
            <span className="text-xs text-gray-500">Mar</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 bg-orange-700 h-24 rounded-t mb-1"></div>
            <span className="text-xs text-gray-500">Apr</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SampleWidget: React.FC = () => {
  return (
    <div className="w-full h-full p-2 bg-gradient-to-br from-green-50 to-white">
      <div className="bg-white rounded-lg p-3 h-full shadow-sm border flex flex-col justify-center items-center">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Performance</h4>
        <div className="relative w-16 h-16 mb-2">
          <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-green-500 border-r-transparent border-b-transparent transform rotate-45"></div>
        </div>
        <div className="text-lg font-bold text-green-600">87%</div>
        <div className="text-xs text-green-500">Excellent</div>
      </div>
    </div>
  );
};
