import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';

// Export study data for analysis
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exportType = searchParams.get('type') || 'all';
  const participantId = searchParams.get('participantId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    await connectToDatabase();

    // Dynamic import to avoid SSR issues
    const { User, UserSession, InteractionLog, DashboardSnapshot } = await import('@/models');

    // Build query filters
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const participantFilter: any = {};
    if (participantId) participantFilter.participantId = participantId;

    let data: any = {};

    switch (exportType) {
      case 'interactions':
        data.interactions = await InteractionLog.find({
          ...participantFilter,
          ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter })
        }).sort({ timestamp: 1 });
        break;

      case 'sessions':
        data.sessions = await UserSession.find({
          ...participantFilter,
          ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter })
        }).sort({ startTime: 1 });
        break;

      case 'snapshots':
        data.snapshots = await DashboardSnapshot.find({
          ...participantFilter,
          ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter })
        }).sort({ timestamp: 1 });
        break;

      case 'users':
        data.users = await User.find(participantFilter).select('-password');
        break;

      case 'summary':
        // Generate summary statistics
        const totalUsers = await User.countDocuments(participantFilter);
        const totalSessions = await UserSession.countDocuments(participantFilter);
        const totalInteractions = await InteractionLog.countDocuments(participantFilter);
        const totalSnapshots = await DashboardSnapshot.countDocuments(participantFilter);

        // Average session duration
        const sessions = await UserSession.find({
          ...participantFilter,
          endTime: { $exists: true }
        });
        
        const avgSessionDuration = sessions.length > 0 
          ? sessions.reduce((sum, session) => {
              const duration = session.endTime!.getTime() - session.startTime.getTime();
              return sum + duration;
            }, 0) / sessions.length
          : 0;

        // Most common interactions
        const interactionCounts = await InteractionLog.aggregate([
          { $match: participantFilter },
          { $group: { _id: '$eventType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);

        data.summary = {
          totalUsers,
          totalSessions,
          totalInteractions,
          totalSnapshots,
          avgSessionDurationMs: avgSessionDuration,
          avgSessionDurationMinutes: Math.round(avgSessionDuration / (1000 * 60) * 100) / 100,
          interactionCounts,
          dateRange: {
            start: startDate,
            end: endDate
          }
        };
        break;

      default: // 'all'
        data.users = await User.find(participantFilter).select('-password');
        data.sessions = await UserSession.find({
          ...participantFilter,
          ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter })
        }).sort({ startTime: 1 });
        data.interactions = await InteractionLog.find({
          ...participantFilter,
          ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter })
        }).sort({ timestamp: 1 });
        data.snapshots = await DashboardSnapshot.find({
          ...participantFilter,
          ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter })
        }).sort({ timestamp: 1 });
        break;
    }

    // Add metadata
    data.exportInfo = {
      exportType,
      timestamp: new Date().toISOString(),
      filters: {
        participantId,
        startDate,
        endDate
      },
      recordCounts: {
        users: Array.isArray(data.users) ? data.users.length : 0,
        sessions: Array.isArray(data.sessions) ? data.sessions.length : 0,
        interactions: Array.isArray(data.interactions) ? data.interactions.length : 0,
        snapshots: Array.isArray(data.snapshots) ? data.snapshots.length : 0,
      }
    };

    return NextResponse.json(data);

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// Create new user (for study registration)
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    await connectToDatabase();

    // Dynamic import to avoid SSR issues
    const { User } = await import('@/models');

    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Return user without password
    const { password, ...userWithoutPassword } = user.toObject();
    
    return NextResponse.json({ 
      user: userWithoutPassword,
      message: 'User created successfully' 
    });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
