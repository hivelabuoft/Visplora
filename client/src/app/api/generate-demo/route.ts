// API endpoint to generate demo data
import { NextRequest, NextResponse } from 'next/server';
import { generateDemoData, saveDemoData } from '../../../vegaTemplates/travel_agent_simulator/demoGenerator';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting demo data generation...');
    
    // Generate demo data using AI agents
    const demoData = await generateDemoData();
    
    // Save to file
    const outputPath = await saveDemoData(demoData);
    
    return NextResponse.json({
      success: true,
      message: 'Demo data generated successfully',
      summary: {
        totalCharts: demoData.metadata.totalRequests,
        successful: demoData.metadata.successful,
        failed: demoData.metadata.failed,
        generatedAt: demoData.metadata.generatedAt,
        outputPath
      },
      data: demoData
    });
    
  } catch (error) {
    console.error('Demo generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to generate demo data',
    endpoint: '/api/generate-demo',
    description: 'Generates travel chart demo data using AI agents and saves to demo_output.json'
  });
}