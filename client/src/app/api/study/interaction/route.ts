import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import { InteractionLog } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const body = await request.json();
    const interaction = new InteractionLog(body);
    const savedInteraction = await interaction.save();

    return NextResponse.json({ 
      success: true, 
      interactionId: savedInteraction._id 
    });
  } catch (error) {
    console.error('Error saving interaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save interaction' },
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
