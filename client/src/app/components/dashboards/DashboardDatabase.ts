// Dashboard state management types
export interface DashboardState {
  id: string;
  name: string;
  type: 'dashboard' | 'chart' | 'widget';
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any; // Dashboard specific data
  config: any; // Dashboard configuration
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardView {
  id: string;
  name: string;
  description?: string;
  dashboards: DashboardState[];
  connections: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
  }>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    tags?: string[];
  };
}

// Mock database for dashboard views with localStorage persistence
class DashboardDatabase {
  private views: Map<string, DashboardView> = new Map();
  private currentViewId: string | null = null;
  private storageKey = 'narrative-dashboard-views';
  private currentViewKey = 'narrative-current-view';

  constructor() {
    this.loadFromStorage();
    
    // Skip creating default views since we use custom default dashboard system
    // if (this.views.size === 0) {
    //   this.createDefaultViews();
    // }
  }

  // Load data from localStorage
  private loadFromStorage(): void {
    // Check if we're in the browser (localStorage is only available client-side)
    if (typeof window === 'undefined') {
      return; // Skip loading on server-side
    }
    
    try {
      // Load views
      const storedViews = localStorage.getItem(this.storageKey);
      if (storedViews) {
        const viewsData = JSON.parse(storedViews);
        this.views.clear();
        Object.entries(viewsData).forEach(([id, viewData]: [string, any]) => {
          // Convert date strings back to Date objects
          const view = {
            ...viewData,
            metadata: {
              ...viewData.metadata,
              createdAt: new Date(viewData.metadata.createdAt),
              updatedAt: new Date(viewData.metadata.updatedAt),
            },
            dashboards: viewData.dashboards.map((dashboard: any) => ({
              ...dashboard,
              createdAt: new Date(dashboard.createdAt),
              updatedAt: new Date(dashboard.updatedAt),
            }))
          };
          this.views.set(id, view);
        });
      }

      // Load current view ID
      const currentView = localStorage.getItem(this.currentViewKey);
      if (currentView && this.views.has(currentView)) {
        this.currentViewId = currentView;
      }
    } catch (error) {
      console.warn('Failed to load dashboard data from localStorage:', error);
      this.views.clear();
      this.currentViewId = null;
    }
  }

  // Save data to localStorage
  private saveToStorage(): void {
    // Check if we're in the browser (localStorage is only available client-side)
    if (typeof window === 'undefined') {
      return; // Skip saving on server-side
    }
    
    try {
      // Convert Map to object for JSON serialization
      const viewsObject: { [key: string]: DashboardView } = {};
      this.views.forEach((view, id) => {
        viewsObject[id] = view;
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(viewsObject));
      
      if (this.currentViewId) {
        localStorage.setItem(this.currentViewKey, this.currentViewId);
      }
    } catch (error) {
      console.warn('Failed to save dashboard data to localStorage:', error);
    }
  }

  // Create default sample views
  private createDefaultViews(): void {
    const sampleView1 = this.createView(
      "Sales Analytics View",
      "Overview of sales performance and metrics"
    );

    const sampleView2 = this.createView(
      "User Engagement View", 
      "User behavior and engagement analytics"
    );

    // Add sample dashboards to the first view
    this.addDashboardToView(sampleView1.id, {
      id: "dash_1",
      name: "Sales Dashboard",
      type: "dashboard",
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 },
      data: { revenue: 45231, growth: 12.5 },
      config: { theme: "blue", showTrends: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.addDashboardToView(sampleView1.id, {
      id: "chart_1", 
      name: "Revenue Chart",
      type: "chart",
      position: { x: 520, y: 100 },
      size: { width: 300, height: 200 },
      data: { chartType: "line", period: "monthly" },
      config: { color: "orange", animated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Set the first view as current
    this.setCurrentView(sampleView1.id);
  }

  // Create a new dashboard view
  createView(name: string, description?: string): DashboardView {
    const id = `view_${Date.now()}`;
    const view: DashboardView = {
      id,
      name,
      description,
      dashboards: [],
      connections: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    };
    
    this.views.set(id, view);
    this.saveToStorage(); // Save to localStorage
    return view;
  }

  // Get all views
  getAllViews(): DashboardView[] {
    return Array.from(this.views.values());
  }

  // Get a specific view
  getView(id: string): DashboardView | undefined {
    return this.views.get(id);
  }

  // Update a view
  updateView(id: string, updates: Partial<DashboardView>): DashboardView | undefined {
    const view = this.views.get(id);
    if (view) {
      const updatedView = {
        ...view,
        ...updates,
        metadata: {
          ...view.metadata,
          updatedAt: new Date(),
        }
      };
      this.views.set(id, updatedView);
      this.saveToStorage(); // Save to localStorage
      return updatedView;
    }
    return undefined;
  }

  // Delete a view
  deleteView(id: string): boolean {
    const deleted = this.views.delete(id);
    if (deleted) {
      // If we deleted the current view, clear current view
      if (this.currentViewId === id) {
        this.currentViewId = null;
      }
      this.saveToStorage(); // Save to localStorage
    }
    return deleted;
  }

  // Set current view
  setCurrentView(id: string): void {
    if (this.views.has(id)) {
      this.currentViewId = id;
      this.saveToStorage(); // Save to localStorage
    }
  }

  // Get current view
  getCurrentView(): DashboardView | undefined {
    return this.currentViewId ? this.views.get(this.currentViewId) : undefined;
  }

  // Add dashboard to view
  addDashboardToView(viewId: string, dashboard: DashboardState): boolean {
    const view = this.views.get(viewId);
    if (view) {
      view.dashboards.push(dashboard);
      view.metadata.updatedAt = new Date();
      this.saveToStorage(); // Save to localStorage
      return true;
    }
    return false;
  }

  // Update dashboard in view
  updateDashboardInView(viewId: string, dashboardId: string, updates: Partial<DashboardState>): boolean {
    const view = this.views.get(viewId);
    if (view) {
      const dashboardIndex = view.dashboards.findIndex(d => d.id === dashboardId);
      if (dashboardIndex !== -1) {
        view.dashboards[dashboardIndex] = {
          ...view.dashboards[dashboardIndex],
          ...updates,
          updatedAt: new Date(),
        };
        view.metadata.updatedAt = new Date();
        this.saveToStorage(); // Save to localStorage
        return true;
      }
    }
    return false;
  }

  // Remove dashboard from view
  removeDashboardFromView(viewId: string, dashboardId: string): boolean {
    const view = this.views.get(viewId);
    if (view) {
      const initialLength = view.dashboards.length;
      view.dashboards = view.dashboards.filter(d => d.id !== dashboardId);
      if (view.dashboards.length < initialLength) {
        view.metadata.updatedAt = new Date();
        this.saveToStorage(); // Save to localStorage
        return true;
      }
    }
    return false;
  }

  // Clear all data (useful for debugging/reset)
  clearAllData(): void {
    this.views.clear();
    this.currentViewId = null;
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.currentViewKey);
    // Recreate default views
    this.createDefaultViews();
  }
}

// Export singleton instance
export const dashboardDB = new DashboardDatabase();
