import mongoose, { Document, Schema } from 'mongoose';

// User Model
export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  participantId: string; // For anonymized study tracking
  role: 'participant' | 'researcher' | 'admin';
  studyGroup?: string; // A/B testing group
  registrationDate: Date;
  lastLoginDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  participantId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['participant', 'researcher', 'admin'], default: 'participant' },
  studyGroup: { type: String },
  registrationDate: { type: Date, default: Date.now },
  lastLoginDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// User Study Session Model
export interface IUserSession extends Document {
  userId: string;
  participantId: string;
  sessionId: string;
  studyPhase: 'tutorial' | 'practice' | 'main_task' | 'survey' | 'completed';
  startTime: Date;
  endTime?: Date;
  currentTask?: string;
  progress: {
    tasksCompleted: number;
    totalTasks: number;
    currentView?: string;
  };
  metadata: Record<string, any>;
}

const UserSessionSchema = new Schema<IUserSession>({
  userId: { type: String, required: true },
  participantId: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  studyPhase: { 
    type: String, 
    enum: ['tutorial', 'practice', 'main_task', 'survey', 'completed'],
    default: 'tutorial'
  },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  currentTask: String,
  progress: {
    tasksCompleted: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    currentView: String,
  },
  metadata: { type: Map, of: Schema.Types.Mixed },
}, {
  timestamps: true,
});

// Interaction Log Model - Core for user study analysis
export interface IInteractionLog extends Document {
  userId: string;
  participantId: string;
  sessionId: string;
  timestamp: Date;
  eventType: 'click' | 'drag' | 'view_change' | 'node_add' | 'node_delete' | 'node_edit' | 'connection_add' | 'connection_delete' | 'save' | 'navigation' | 'error';
  action: string; // Specific action taken
  target: {
    type: 'dashboard' | 'chart' | 'widget' | 'button' | 'view' | 'canvas' | 'ui_element';
    id?: string;
    name?: string;
    position?: { x: number; y: number };
  };
  context: {
    currentView?: string;
    viewName?: string;
    nodeCount?: number;
    connectionCount?: number;
    canvasState?: any;
  };
  timing: {
    duration?: number; // For actions with duration
    responseTime?: number; // Time from stimulus to action
  };
  metadata: Record<string, any>;
}

const InteractionLogSchema = new Schema<IInteractionLog>({
  userId: { type: String, required: true },
  participantId: { type: String, required: true },
  sessionId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  eventType: { 
    type: String, 
    required: true,
    enum: ['click', 'drag', 'view_change', 'node_add', 'node_delete', 'node_edit', 'connection_add', 'connection_delete', 'save', 'navigation', 'error']
  },
  action: { type: String, required: true },
  target: {
    type: { 
      type: String, 
      required: true,
      enum: ['dashboard', 'chart', 'widget', 'button', 'view', 'canvas', 'ui_element']
    },
    id: String,
    name: String,
    position: {
      x: Number,
      y: Number,
    },
  },
  context: {
    currentView: String,
    viewName: String,
    nodeCount: Number,
    connectionCount: Number,
    canvasState: Schema.Types.Mixed,
  },
  timing: {
    duration: Number,
    responseTime: Number,
  },
  metadata: { type: Map, of: Schema.Types.Mixed },
}, {
  timestamps: false, // We use our own timestamp field
});

// Dashboard State Snapshot Model - For version control and analysis
export interface IDashboardSnapshot extends Document {
  userId: string;
  participantId: string;
  sessionId: string;
  viewId: string;
  viewName: string;
  timestamp: Date;
  dashboardState: {
    nodes: any[];
    edges: any[];
    metadata: Record<string, any>;
  };
  triggerEvent: 'manual_save' | 'auto_save' | 'task_completion' | 'view_switch';
  version: number;
}

const DashboardSnapshotSchema = new Schema<IDashboardSnapshot>({
  userId: { type: String, required: true },
  participantId: { type: String, required: true },
  sessionId: { type: String, required: true },
  viewId: { type: String, required: true },
  viewName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  dashboardState: {
    nodes: [Schema.Types.Mixed],
    edges: [Schema.Types.Mixed],
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  triggerEvent: {
    type: String,
    enum: ['manual_save', 'auto_save', 'task_completion', 'view_switch'],
    required: true
  },
  version: { type: Number, default: 1 },
}, {
  timestamps: true,
});

// Export models with proper type checking to avoid SSR issues
export const User = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export const UserSession = (mongoose.models.UserSession as mongoose.Model<IUserSession>) || mongoose.model<IUserSession>('UserSession', UserSessionSchema);
export const InteractionLog = (mongoose.models.InteractionLog as mongoose.Model<IInteractionLog>) || mongoose.model<IInteractionLog>('InteractionLog', InteractionLogSchema);
export const DashboardSnapshot = (mongoose.models.DashboardSnapshot as mongoose.Model<IDashboardSnapshot>) || mongoose.model<IDashboardSnapshot>('DashboardSnapshot', DashboardSnapshotSchema);

// StudySession is an alias for UserSession for API compatibility
export const StudySession = UserSession;
