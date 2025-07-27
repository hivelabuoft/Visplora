/**
 * Manual Interaction Logger
 * Use this to selectively track specific user interactions
 */

interface InteractionData {
  eventType: 'click' | 'drag' | 'view_change' | 'node_add' | 'node_delete' | 'node_edit' | 'connection_add' | 'connection_delete' | 'save' | 'navigation' | 'error';
  action: string;
  target: {
    type: 'dashboard' | 'chart' | 'widget' | 'button' | 'view' | 'canvas' | 'ui_element';
    id?: string;
    name?: string;
    position?: { x: number; y: number };
  };
  context?: {
    currentView?: string;
    viewName?: string;
    nodeCount?: number;
    connectionCount?: number;
    canvasState?: any;
  };
  timing?: {
    duration?: number;
    responseTime?: number;
  };
  metadata?: Record<string, any>;
}

interface UserContext {
  userId: string;
  participantId: string;
  sessionId: string;
}

class InteractionLogger {
  public userContext: UserContext | null = null;
  public isStudyMode: boolean = false;

  // Initialize the logger with user context
  initialize(userContext: UserContext, isStudyMode: boolean = false) {
    console.log('🔧 InteractionLogger - Initializing with:', { userContext, isStudyMode });
    
    // Validate required fields
    if (!userContext.userId || !userContext.participantId) {
      console.error('❌ InteractionLogger - Missing required fields:', userContext);
      return;
    }
    
    this.userContext = userContext;
    this.isStudyMode = isStudyMode;
    
    console.log('✅ InteractionLogger - Initialized successfully');
  }

  // Main function to log interactions manually
  async logInteraction(data: InteractionData) {
    // console.log('🎯 Attempting to log interaction:', {
    //   action: data.action,
    //   isStudyMode: this.isStudyMode,
    //   hasUserContext: !!this.userContext,
    //   userContext: this.userContext
    // });

    // // Only log if in study mode and context is available
    // if (!this.isStudyMode || !this.userContext) {
    //   console.log('❌ Interaction not logged - study mode disabled or no user context', {
    //     isStudyMode: this.isStudyMode,
    //     userContext: this.userContext
    //   });
    //   return;
    // }

    // // Validate user context has required fields
    // if (!this.userContext.userId || !this.userContext.participantId || !this.userContext.sessionId) {
    //   console.error('❌ Interaction not logged - missing required user context fields:', {
    //     userId: this.userContext.userId,
    //     participantId: this.userContext.participantId,
    //     sessionId: this.userContext.sessionId
    //   });
    //   return;
    // }

    // // Only run on client side
    // if (typeof window === 'undefined') {
    //   console.log('❌ Interaction not logged - server side');
    //   return;
    // }

    // try {
    //   const payload = {
    //     userId: this.userContext.userId,
    //     participantId: this.userContext.participantId,
    //     sessionId: this.userContext.sessionId,
    //     eventType: data.eventType,
    //     action: data.action,
    //     target: data.target,
    //     context: data.context || {},
    //     timing: data.timing || {},
    //     metadata: {
    //       ...data.metadata,
    //       timestamp: new Date().toISOString()
    //     },
    //   };

    //   console.log('📤 Sending interaction payload:', payload);

    //   const response = await fetch('/api/study/interaction', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${localStorage.getItem('narrativeToken')}`
    //     },
    //     body: JSON.stringify(payload)
    //   });
      
    //   console.log('📥 Response status:', response.status);
      
    //   if (!response.ok) {
    //     const errorText = await response.text();
    //     console.warn('❌ Failed to log interaction:', errorText);
    //   } else {
    //     const result = await response.json();
    //     console.log(`✅ Logged interaction successfully:`, result);
    //   }
    // } catch (error) {
    //   console.error('❌ Failed to log interaction:', error);
    // }
  }

  // Convenience methods for common interactions

  // Log button clicks
  async logButtonClick(buttonId: string, buttonName: string, additionalData?: any) {
    await this.logInteraction({
      eventType: 'click',
      action: 'button_clicked',
      target: {
        type: 'button',
        id: buttonId,
        name: buttonName
      },
      timing: {
        responseTime: Date.now()
      },
      metadata: additionalData
    });
  }

  // Log dashboard generation specifically
  async logDashboardGeneration(prompt: string, currentView: string = 'dataset_explorer') {
    await this.logInteraction({
      eventType: 'click',
      action: 'generate_dashboard',
      target: {
        type: 'button',
        id: 'generate_dashboard_button',
        name: 'Generate Dashboard'
      },
      context: {
        currentView,
        viewName: currentView.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      },
      timing: {
        responseTime: Date.now()
      },
      metadata: {
        prompt: prompt,
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Log view changes
  async logViewChange(fromView: string, toView: string) {
    await this.logInteraction({
      eventType: 'view_change',
      action: 'view_switched',
      target: {
        type: 'view',
        id: toView,
        name: toView
      },
      context: {
        currentView: toView,
        viewName: toView
      },
      metadata: {
        fromView,
        toView
      }
    });
  }

  // Log form submissions
  async logFormSubmission(formId: string, formData: any) {
    await this.logInteraction({
      eventType: 'click',
      action: 'form_submitted',
      target: {
        type: 'ui_element',
        id: formId,
        name: 'form'
      },
      metadata: {
        formData,
        fieldCount: Object.keys(formData).length
      }
    });
  }

  // Log custom events
  async logCustomEvent(action: string, details: any) {
    await this.logInteraction({
      eventType: 'click',
      action: action,
      target: {
        type: 'ui_element',
        id: 'custom_event',
        name: action
      },
      metadata: details
    });
  }

  // Check if logging is enabled
  isLoggingEnabled(): boolean {
    return this.isStudyMode && this.userContext !== null;
  }

  // Get current user context
  getUserContext(): UserContext | null {
    return this.userContext;
  }
}

// Create and export a singleton instance
export const interactionLogger = new InteractionLogger();

// Export types for use in other files
export type { InteractionData, UserContext };
