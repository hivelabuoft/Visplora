import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('Test endpoint called!');
  return NextResponse.json({ message: 'Test endpoint works!' });
}

export async function POST() {
  console.log('Test POST endpoint called!');
  return NextResponse.json({ message: 'Test POST endpoint works!' });
}
