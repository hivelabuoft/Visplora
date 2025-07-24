import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    await connectToDatabase();

    // Dynamic import to avoid SSR issues
    const { User } = await import('@/models');

    // Validate required fields
    const { username, password, firstName, lastName } = userData;
    
    if (!username || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username: username.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      participantId: userData.participantId || `participant_${Date.now()}`,
      registrationDate: new Date(),
      lastLoginDate: new Date(),
      isActive: true
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id,
        participantId: newUser.participantId,
        username: newUser.username 
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    
    return NextResponse.json({ 
      user: userWithoutPassword,
      token,
      message: 'Account created successfully' 
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
