import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import { InteractionLog } from '@/models';

export async function POST(request: NextRequest) {
  console.log('🔵 Interaction API - Request received');
  
  try {
    await connectMongoDB();
    console.log('🔵 Interaction API - MongoDB connected');
    
    const body = await request.json();
    console.log('🔵 Interaction API - Received data:', {
      userId: body.userId,
      participantId: body.participantId,
      sessionId: body.sessionId,
      action: body.action,
      eventType: body.eventType
    });
    
    // Validate required fields
    if (!body.userId || !body.participantId || !body.sessionId) {
      console.log('❌ Interaction API - Missing required fields:', {
        userId: body.userId,
        participantId: body.participantId,
        sessionId: body.sessionId
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          details: { 
            userId: !!body.userId, 
            participantId: !!body.participantId, 
            sessionId: !!body.sessionId 
          }
        },
        { status: 400 }
      );
    }
    
    const interaction = new InteractionLog(body);
    console.log('🔵 Interaction API - Creating interaction log:', interaction);
    
    const savedInteraction = await interaction.save();
    console.log('✅ Interaction API - Successfully saved:', savedInteraction._id);

    // Verify the save worked
    const verification = await InteractionLog.findById(savedInteraction._id);
    console.log('🔍 Interaction API - Verification query result:', verification ? 'Found' : 'Not found');

    return NextResponse.json({ 
      success: true, 
      interactionId: savedInteraction._id,
      verified: !!verification
    });
  } catch (error) {
    console.error('❌ Interaction API - Error saving interaction:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save interaction',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const userId = url.searchParams.get('userId');
    
    let query: any = {};
    if (sessionId) query.sessionId = sessionId;
    if (userId) query.userId = userId;

    const interactions = await InteractionLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100); // Limit to last 100 interactions

    return NextResponse.json({ 
      success: true, 
      interactions 
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}
