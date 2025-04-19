import { NextResponse } from 'next/server';

/**
 * @route GET /api/notifications/vapid-public-key
 * @description Get the VAPID public key for web push subscription
 */
export async function GET() {
  try {
    // The VAPID public key should be stored in an environment variable
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'VAPID public key not configured' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ publicKey });
    
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 