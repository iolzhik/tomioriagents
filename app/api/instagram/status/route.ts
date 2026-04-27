import { NextResponse } from 'next/server';
import { resolveIgBusinessAccountId } from '@/lib/instagram-graph';

export async function POST(req: Request) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Access Token is required' }, { status: 400 });
    }

    // Attempt to resolve the business account ID as a way to verify the token
    const igId = await resolveIgBusinessAccountId(accessToken);

    return NextResponse.json({ 
      success: true, 
      message: 'Token verified successfully',
      igAccountId: igId
    });

  } catch (error: any) {
    console.error('[Verify IG Token Error]', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to verify token' 
    }, { status: 401 });
  }
}
