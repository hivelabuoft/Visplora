import connectToDatabase from '@/lib/mongodb';

export interface UserStudyContext {
  userId: string;
  participantId: string;
  sessionId: string;
  studyPhase: 'tutorial' | 'practice' | 'main_task' | 'survey' | 'completed';
}

export class UserStudyTracker {
  private context: UserStudyContext | null = null;
  private startTime: number = Date.now();

  // Initialize tracking for a user session
  async initializeSession(context: UserStudyContext) {
    this.context = context;
    this.startTime = Date.now();
    
    // Only run on client side
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }
    
    try {
      // Use API endpoint instead of direct DB connection
      const response = await fetch('/api/study/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('narrativeToken')}`
        },
        body: JSON.stringify({
          sessionId: context.sessionId,
          userId: context.userId,
          participantId: context.participantId,
          studyPhase: context.studyPhase,
          startTime: new Date(),
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to initialize session via API');
      }
    } catch (error) {
      console.warn('Failed to initialize session:', error);
    }
  }

  // Log user interactions
  async logInteraction(
    eventType: 'click' | 'drag' | 'view_change' | 'node_add' | 'node_delete' | 'node_edit' | 'connection_add' | 'connection_delete' | 'save' | 'navigation' | 'error',
    action: string,
    target: {
      type: 'dashboard' | 'chart' | 'widget' | 'button' | 'view' | 'canvas' | 'ui_element';
      id?: string;
      name?: string;
      position?: { x: number; y: number };
    },
    context?: {
      currentView?: string;
      viewName?: string;
      nodeCount?: number;
      connectionCount?: number;
      canvasState?: any;
    },
    timing?: {
      duration?: number;
      responseTime?: number;
    },
    metadata?: Record<string, any>
  ) {
    if (!this.context) {
      console.warn('UserStudyTracker not initialized');
      return;
    }

    // Only run on client side
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    try {
      // Use API endpoint instead of direct DB connection
      const response = await fetch('/api/study/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('narrativeToken')}`
        },
        body: JSON.stringify({
          userId: this.context.userId,
          participantId: this.context.participantId,
          sessionId: this.context.sessionId,
          eventType,
          action,
          target,
          context: context || {},
          timing: timing || {},
          metadata: metadata || {},
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to log interaction via API');
      }
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  }

  // Save dashboard state snapshot
  async saveDashboardSnapshot(
    viewId: string,
    viewName: string,
    dashboardState: {
      nodes: any[];
      edges: any[];
      metadata: Record<string, any>;
    },
    triggerEvent: 'manual_save' | 'auto_save' | 'task_completion' | 'view_switch'
  ) {
    if (!this.context) return;

    // Only run on client side
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    try {
      // Use API endpoint instead of direct DB connection
      const response = await fetch('/api/study/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('narrativeToken')}`
        },
        body: JSON.stringify({
          userId: this.context.userId,
          participantId: this.context.participantId,
          sessionId: this.context.sessionId,
          viewId,
          viewName,
          dashboardState,
          triggerEvent,
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to save dashboard snapshot via API');
      }
    } catch (error) {
      console.error('Failed to save dashboard snapshot:', error);
    }
  }

  // Update session progress
  async updateProgress(
    tasksCompleted: number,
    totalTasks: number,
    currentView?: string,
    currentTask?: string
  ) {
    if (!this.context) return;

    // Only run on client side
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    try {
      await connectToDatabase();
      
      // Dynamic import to avoid SSR issues
      const { UserSession } = await import('@/models');
      
      await UserSession.findOneAndUpdate(
        { sessionId: this.context.sessionId },
        {
          'progress.tasksCompleted': tasksCompleted,
          'progress.totalTasks': totalTasks,
          'progress.currentView': currentView,
          currentTask,
        }
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }

  // End session
  async endSession() {
    if (!this.context) return;

    // Only run on client side
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    try {
      await connectToDatabase();
      
      // Dynamic import to avoid SSR issues
      const { UserSession } = await import('@/models');
      
      await UserSession.findOneAndUpdate(
        { sessionId: this.context.sessionId },
        {
          endTime: new Date(),
          studyPhase: 'completed',
        }
      );

      // Log session end
      await this.logInteraction(
        'navigation',
        'session_ended',
        { type: 'ui_element', id: 'session', name: 'study_session' },
        {},
        { duration: Date.now() - this.startTime }
      );
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Quick logging methods for common actions
  async logClick(elementId: string, elementName: string, position?: { x: number; y: number }) {
    await this.logInteraction(
      'click',
      'element_clicked',
      { type: 'ui_element', id: elementId, name: elementName, position },
      {},
      { responseTime: Date.now() - this.startTime }
    );
  }

  async logViewChange(oldView: string, newView: string) {
    await this.logInteraction(
      'view_change',
      'view_switched',
      { type: 'view', id: newView, name: newView },
      { currentView: newView }
    );
  }

  async logNodeAdd(nodeType: string, nodeId: string, position: { x: number; y: number }) {
    await this.logInteraction(
      'node_add',
      `${nodeType}_added`,
      { type: nodeType as any, id: nodeId, position }
    );
  }

  async logNodeDrag(nodeId: string, fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }) {
    await this.logInteraction(
      'drag',
      'node_moved',
      { type: 'ui_element', id: nodeId, position: toPosition },
      {},
      {},
      { fromPosition, toPosition }
    );
  }
}

// Create a singleton instance
export const userStudyTracker = new UserStudyTracker();
