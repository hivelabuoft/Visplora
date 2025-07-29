import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import { StudySession } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const body = await request.json();
    console.log('Session POST body:', body);
    
    const { 
      userId, 
      participantId,
      sessionId,
      studyPhase,
      startTime,
      progress,
      metadata
    } = body;

    // Validate required fields
    if (!userId || !participantId || !sessionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          details: { userId: !!userId, participantId: !!participantId, sessionId: !!sessionId }
        },
        { status: 400 }
      );
    }

    const session = new StudySession({
      userId,
      participantId,
      sessionId,
      studyPhase: studyPhase || 'main_task',
      startTime: startTime || new Date(),
      progress: progress || { tasksCompleted: 0, totalTasks: 0 },
      metadata: metadata || {}
    });

    const savedSession = await session.save();

    return NextResponse.json({ 
      success: true, 
      sessionId: savedSession._id 
    });
  } catch (error) {
    console.error('Error creating study session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create study session', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const body = await request.json();
    const { sessionId, ...updateData } = body;

    const session = await StudySession.findOneAndUpdate(
      { sessionId: sessionId },  // Find by sessionId field, not _id
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
