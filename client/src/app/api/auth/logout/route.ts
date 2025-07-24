import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

async function logoutHandler(request: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    // Dynamic import to avoid SSR issues
    const { UserSession } = await import('@/models');

    const user = request.user;
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Update user session end time
    if (user.sessionId) {
      const existingSession = await UserSession.findById(user.sessionId);
      await UserSession.findByIdAndUpdate(user.sessionId, {
        endTime: new Date(),
        metadata: {
          ...(existingSession?.metadata || {}),
          logoutMethod: 'manual'
        }
      });
    }

    return NextResponse.json({ 
      message: 'Logout successful',
      sessionEnded: !!user.sessionId
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(logoutHandler);
