import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import { StudySession } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const body = await request.json();
    const { 
      userId, 
      username, 
      sessionStartTime, 
      userAgent, 
      screenResolution, 
      viewport,
      referrer 
    } = body;

    const session = new StudySession({
      userId,
      username,
      sessionStartTime,
      userAgent,
      screenResolution,
      viewport,
      referrer,
      interactions: [],
      snapshots: []
    });

    const savedSession = await session.save();

    return NextResponse.json({ 
      success: true, 
      sessionId: savedSession._id 
    });
  } catch (error) {
    console.error('Error creating study session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create study session' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const body = await request.json();
    const { sessionId, ...updateData } = body;

    const session = await StudySession.findByIdAndUpdate(
      sessionId,
      updateData,
      { new: true }
    );

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error updating study session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update study session' },
      { status: 500 }
    );
  }
}
