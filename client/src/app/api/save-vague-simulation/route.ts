import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { data, filename } = await request.json();

    if (!data || !filename) {
      return NextResponse.json(
        { error: 'Data and filename are required' },
        { status: 400 }
      );
    }

    // Validate filename format (should be x.json where x is 1-5)
    if (!/^[1-5]\.json$/.test(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename format. Use: 1.json, 2.json, 3.json, 4.json, or 5.json' },
        { status: 400 }
      );
    }

    // Create the vague_simulations directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    const examplesDir = path.join(publicDir, 'examples');
    const vagueSimulationsDir = path.join(examplesDir, 'vague_simulations');

    // Ensure directories exist
    if (!fs.existsSync(examplesDir)) {
      fs.mkdirSync(examplesDir, { recursive: true });
    }
    
    if (!fs.existsSync(vagueSimulationsDir)) {
      fs.mkdirSync(vagueSimulationsDir, { recursive: true });
      console.log('📁 Created vague_simulations directory');
    }

    // Create the file path
    const filePath = path.join(vagueSimulationsDir, filename);
    const relativePath = `public/examples/vague_simulations/${filename}`;

    // Add metadata to the data
    const dataWithMetadata = {
      metadata: {
        generatedAt: new Date().toISOString(),
        sourceFile: `example100.${filename.split('.')[0]}_data.json`,
        model: 'gpt-4',
        version: '1.0'
      },
      sentences: data
    };

    // Write the file
    fs.writeFileSync(filePath, JSON.stringify(dataWithMetadata, null, 2), 'utf8');

    console.log(`✅ Successfully saved transformed data to: ${relativePath}`);

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      absolutePath: filePath,
      sentenceCount: data.length,
      chartCount: data.reduce((total: number, sentence: any) => total + (sentence.charts_display?.length || 0), 0)
    });

  } catch (error) {
    console.error('❌ Error saving vague simulation data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save transformed data',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}