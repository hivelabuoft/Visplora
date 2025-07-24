import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    participantId: string;
    username: string;
    sessionId?: string;
  };
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                   request.headers.get('x-auth-token');

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication token required' },
          { status: 401 }
        );
      }

      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
      
      // Add user info to request
      (request as AuthenticatedRequest).user = {
        userId: decoded.userId,
        participantId: decoded.participantId,
        username: decoded.username,
        sessionId: decoded.sessionId
      };

      return await handler(request as AuthenticatedRequest);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
  };
}

export default withAuth;
