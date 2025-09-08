import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ExampleFile {
  name: string;
  path: string;
  scenario: string;
  fullPath: string;
}

export async function GET() {
  try {
    const exampleFiles: ExampleFile[] = [];
    const publicDir = path.join(process.cwd(), 'public');
    const examplesDir = path.join(publicDir, 'examples');

    // Check if examples directory exists
    if (!fs.existsSync(examplesDir)) {
      return NextResponse.json({ error: 'Examples directory not found' }, { status: 404 });
    }

    // Read all scenario directories
    const scenarioDirs = fs.readdirSync(examplesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const scenarioDir of scenarioDirs) {
      const scenarioPath = path.join(examplesDir, scenarioDir);
      
      try {
        // Read all files in the scenario directory
        const files = fs.readdirSync(scenarioPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile())
          .map(dirent => dirent.name);

        // Filter for example JSON files without _data suffix
        const exampleJsonFiles = files.filter(file => {
          return file.endsWith('.json') && 
                 file.startsWith('example') && 
                 !file.includes('_data') && 
                 !file.includes('_output');
        });

        // Add to results
        for (const file of exampleJsonFiles) {
          exampleFiles.push({
            name: file,
            path: `public/examples/${scenarioDir}/${file}`,
            scenario: scenarioDir,
            fullPath: path.join(scenarioPath, file)
          });
        }

      } catch (error) {
        console.warn(`Could not read scenario directory ${scenarioDir}:`, error);
        continue;
      }
    }

    // Sort by scenario and then by file name
    exampleFiles.sort((a, b) => {
      if (a.scenario !== b.scenario) {
        return a.scenario.localeCompare(b.scenario);
      }
      return a.name.localeCompare(b.name);
    });

    console.log(`Found ${exampleFiles.length} example files:`, exampleFiles.map(f => f.path));

    return NextResponse.json(exampleFiles);

  } catch (error) {
    console.error('Error listing example files:', error);
    return NextResponse.json(
      { error: 'Failed to list example files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { validateFile } = await request.json();
    
    if (!validateFile) {
      return NextResponse.json({ error: 'File path is required for validation' }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), validateFile);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ 
        valid: false, 
        error: 'File does not exist',
        path: validateFile 
      });
    }

    // Try to read and parse the file
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(fileContent);

      // Validate structure - check for exploration_path
      if (!data.exploration_path || !Array.isArray(data.exploration_path)) {
        return NextResponse.json({
          valid: false,
          error: 'Invalid file format: exploration_path array not found',
          path: validateFile
        });
      }

      // Count sentences
      const sentenceCount = data.exploration_path.length;

      return NextResponse.json({
        valid: true,
        sentenceCount,
        hasDataStory: !!data.data_story,
        hasInquiries: !!data.inquiries,
        path: validateFile
      });

    } catch (parseError) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid JSON format',
        details: parseError instanceof Error ? parseError.message : 'JSON parse error',
        path: validateFile
      });
    }

  } catch (error) {
    console.error('Error validating file:', error);
    return NextResponse.json(
      { error: 'Failed to validate file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}