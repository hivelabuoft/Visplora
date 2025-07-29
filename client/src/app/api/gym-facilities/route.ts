import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FACILITY_TYPES = [
  'Budget Gym', 'Chain Gym', 'Boutique Fitness', 'Council Leisure Centre', 'Independent Gym', 'Premium Gym',
  'Swimming Pool', 'Sports Hall', 'Tennis Court', 'Football Pitch', 'Athletics Track', 'Climbing Wall', 'Dance Studio', 
  'Yoga Studio', 'Martial Arts Dojo', 'Squash Court', 'Table Tennis Centre', 'Cricket Nets', 'Rugby Pitch', 
  'Rowing Club', 'Cycling Track', 'Golf Course', 'Ice Rink', 'Skate Park', 'Bowling Alley', 'Badminton Court', 
  'Basketball Court', 'Volleyball Court', 'Multi-sport Centre', 'Community Sports Centre', 'Outdoor Gym', 'Playground', 
  'Recreation Ground', 'Parkour Park', 'Water Sports Centre', 'Sailing Club', 'Equestrian Centre', 'Archery Range', 
  'Shooting Range', 'Fencing Salle', 'Boxing Gym', 'Wrestling Gym', 'Table Football Club', 'Esports Arena'
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockGymsData(numTypes: number, minCount: number, maxCount: number) {
  const types = [...FACILITY_TYPES].sort(() => 0.5 - Math.random()).slice(0, numTypes);
  return types.map(type => ({
    facility_type: type,
    count: getRandomInt(minCount, maxCount)
  }));
}

function generateMockBoroughGymsData(numTypes: number) {
  // Boroughs have more facilities and higher counts per type
  const types = [...FACILITY_TYPES].sort(() => 0.5 - Math.random()).slice(0, numTypes);
  return types.map(type => ({
    facility_type: type,
    count: getRandomInt(15, 40)
  }));
}

const GYM_FACILITIES_DIR = path.join(process.cwd(), 'public/data/gym-facilities');
const LSOA_GYM_FILE = path.join(GYM_FACILITIES_DIR, 'lsoa-gym-facilities.json');
const BOROUGH_GYM_FILE = path.join(GYM_FACILITIES_DIR, 'borough-gym-facilities.json');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lsoa = searchParams.get('lsoa');
    const borough = searchParams.get('borough');
    let data = null;

    if (lsoa) {
      if (!fs.existsSync(GYM_FACILITIES_DIR)) {
        fs.mkdirSync(GYM_FACILITIES_DIR, { recursive: true });
      }
      let allLsoaData: Record<string, any> = {};
      if (fs.existsSync(LSOA_GYM_FILE)) {
        try {
          const fileContent = fs.readFileSync(LSOA_GYM_FILE, 'utf-8');
          allLsoaData = JSON.parse(fileContent);
        } catch (parseError) {
          console.error('Error parsing LSOA gym file:', parseError);
          allLsoaData = {};
        }
      }
      if (allLsoaData[lsoa]) {
        data = allLsoaData[lsoa];
      } else {
        data = generateMockGymsData(getRandomInt(3, 8), 1, 4);
        allLsoaData[lsoa] = data;
        try {
          fs.writeFileSync(LSOA_GYM_FILE, JSON.stringify(allLsoaData, null, 2), 'utf-8');
        } catch (writeError) {
          console.error('Error writing LSOA gym file:', writeError);
          // Continue without writing to file
        }
      }
    } else if (borough) {
      if (!fs.existsSync(GYM_FACILITIES_DIR)) {
        fs.mkdirSync(GYM_FACILITIES_DIR, { recursive: true });
      }
      let allBoroughData: Record<string, any> = {};
      if (fs.existsSync(BOROUGH_GYM_FILE)) {
        try {
          const fileContent = fs.readFileSync(BOROUGH_GYM_FILE, 'utf-8');
          allBoroughData = JSON.parse(fileContent);
        } catch (parseError) {
          console.error('Error parsing borough gym file:', parseError);
          allBoroughData = {};
        }
      }
      if (allBoroughData[borough]) {
        data = allBoroughData[borough];
      } else {
        data = generateMockBoroughGymsData(getRandomInt(8, 32));
        allBoroughData[borough] = data;
        try {
          fs.writeFileSync(BOROUGH_GYM_FILE, JSON.stringify(allBoroughData, null, 2), 'utf-8');
        } catch (writeError) {
          console.error('Error writing borough gym file:', writeError);
          // Continue without writing to file
        }
      }
    } else {
      return NextResponse.json({ error: 'Missing lsoa or borough parameter' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in gym facilities API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 