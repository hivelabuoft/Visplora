import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import { DashboardSnapshot } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const body = await request.json();
    
    // Get the current version number for this view
    const lastSnapshot = await DashboardSnapshot
      .findOne({ 
        userId: body.userId, 
        viewId: body.viewId 
      })
      .sort({ version: -1 });
    
    const nextVersion = lastSnapshot ? lastSnapshot.version + 1 : 1;
    
    const snapshot = new DashboardSnapshot({
      ...body,
      version: nextVersion
    });
    
    const savedSnapshot = await snapshot.save();

    return NextResponse.json({ 
      success: true, 
      snapshotId: savedSnapshot._id,
      version: nextVersion
    });
  } catch (error) {
    console.error('Error saving snapshot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save snapshot' },
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
    const viewId = url.searchParams.get('viewId');
    
    let query: any = {};
    if (sessionId) query.sessionId = sessionId;
    if (userId) query.userId = userId;
    if (viewId) query.viewId = viewId;

    const snapshots = await DashboardSnapshot.find(query)
      .sort({ timestamp: -1 })
      .limit(50); // Limit to last 50 snapshots

    return NextResponse.json({ 
      success: true, 
      snapshots 
    });
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}
