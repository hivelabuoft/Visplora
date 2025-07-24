import React, { useState, useEffect } from 'react';
import { dashboardDB, DashboardView, DashboardState } from './DashboardDatabase';

interface DashboardViewManagerProps {
  onViewChange: (view: DashboardView | null) => void;
  currentView: DashboardView | null;
}

export const DashboardViewManager: React.FC<DashboardViewManagerProps> = ({ 
  onViewChange, 
  currentView 
}) => {
  const [views, setViews] = useState<DashboardView[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');

  useEffect(() => {
    // Load all views
    setViews(dashboardDB.getAllViews());
  }, []);

  const handleViewSelect = (viewId: string) => {
    const view = dashboardDB.getView(viewId);
    if (view) {
      dashboardDB.setCurrentView(viewId);
      onViewChange(view);
    }
  };

  const handleCreateView = () => {
    if (newViewName.trim()) {
      const newView = dashboardDB.createView(newViewName.trim(), newViewDescription.trim());
      setViews(dashboardDB.getAllViews());
      setNewViewName('');
      setNewViewDescription('');
      setShowCreateModal(false);
      onViewChange(newView);
    }
  };

  const handleDeleteView = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this view?')) {
      dashboardDB.deleteView(viewId);
      setViews(dashboardDB.getAllViews());
      if (currentView?.id === viewId) {
        onViewChange(null);
      }
    }
  };

  const handleResetAll = () => {
    if (confirm('⚠️ This will clear ALL dashboard data and reset to defaults. Are you sure?')) {
      dashboardDB.clearAllData();
      setViews(dashboardDB.getAllViews());
      const firstView = dashboardDB.getAllViews()[0];
      if (firstView) {
        dashboardDB.setCurrentView(firstView.id);
        onViewChange(firstView);
      } else {
        onViewChange(null);
      }
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Dashboard Views</h2>
        <div className="flex gap-2">
          <button
            onClick={handleResetAll}
            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
            title="Reset all data to defaults"
          >
            🔄 Reset
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-colors"
          >
            + New View
          </button>
        </div>
      </div>

      {/* Views List */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {views.map((view) => (
          <div
            key={view.id}
            onClick={() => handleViewSelect(view.id)}
            className={`min-w-48 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              currentView?.id === view.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 text-sm truncate">{view.name}</h3>
                {view.description && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{view.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{view.dashboards.length} dashboards</span>
                  <span>{view.connections.length} connections</span>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteView(view.id, e)}
                className="ml-2 w-6 h-6 text-gray-400 hover:text-red-500 flex items-center justify-center rounded transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Dashboard View</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  View Name
                </label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter view name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newViewDescription}
                  onChange={(e) => setNewViewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter description..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateView}
                disabled={!newViewName.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-md transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
