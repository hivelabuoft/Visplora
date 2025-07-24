import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    await connectToDatabase();

    // Dynamic import to avoid SSR issues
    const { User, UserSession } = await import('@/models');

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login date
    user.lastLoginDate = new Date();
    await user.save();

    // Create new user session
    const userSession = new UserSession({
      participantId: user.participantId,
      userId: user._id,
      sessionId: `session_${user.participantId}_${Date.now()}`,
      startTime: new Date(),
      studyPhase: 'main_task',
      metadata: {
        loginMethod: 'email',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    await userSession.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        participantId: user.participantId,
        username: user.username,
        sessionId: userSession._id
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    return NextResponse.json({ 
      user: {
        ...userWithoutPassword,
        sessionId: userSession._id
      },
      token,
      message: 'Login successful' 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
