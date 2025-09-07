// API endpoint to list available files in scenario folders
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const publicPath = path.join(process.cwd(), 'public', 'examples');
    const scenarioFiles: Array<{
      name: string;
      path: string;
      scenario: string;
    }> = [];

    // Check scenario1 folder
    const scenario1Path = path.join(publicPath, 'scenario1');
    if (fs.existsSync(scenario1Path)) {
      const scenario1Files = fs.readdirSync(scenario1Path)
        .filter(file => file.endsWith('_data.json'))
        .map(file => ({
          name: file,
          path: `public/examples/scenario1/${file}`,
          scenario: 'scenario1'
        }));
      scenarioFiles.push(...scenario1Files);
    }

    // Check scenario2 folder
    const scenario2Path = path.join(publicPath, 'scenario2');
    if (fs.existsSync(scenario2Path)) {
      const scenario2Files = fs.readdirSync(scenario2Path)
        .filter(file => file.endsWith('_data.json'))
        .map(file => ({
          name: file,
          path: `public/examples/scenario2/${file}`,
          scenario: 'scenario2'
        }));
      scenarioFiles.push(...scenario2Files);
    }

    return NextResponse.json(scenarioFiles);
    
  } catch (error) {
    console.error('Error listing scenario files:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}