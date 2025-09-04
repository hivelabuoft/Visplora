// API endpoint to serve demo data
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    // Try to load demo data from the vegaTemplates directory
    const demoPath = path.join(process.cwd(), 'src', 'vegaTemplates', 'travel_agent_simulator', 'demo_output.json');
    
    if (fs.existsSync(demoPath)) {
      const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
      
      return NextResponse.json({
        success: true,
        data: demoData,
        source: 'vegaTemplates directory',
        loadedAt: new Date().toISOString()
      });
    }
    
    // Fallback: try public directory
    const publicPath = path.join(process.cwd(), 'public', 'demo_output.json');
    
    if (fs.existsSync(publicPath)) {
      const demoData = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));
      
      return NextResponse.json({
        success: true,
        data: demoData,
        source: 'public directory',
        loadedAt: new Date().toISOString()
      });
    }
    
    // No demo data found
    return NextResponse.json({
      success: false,
      error: 'No demo data found. Please generate demo data first.',
      searchedPaths: [demoPath, publicPath]
    }, { status: 404 });
    
  } catch (error) {
    console.error('Error loading demo data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}