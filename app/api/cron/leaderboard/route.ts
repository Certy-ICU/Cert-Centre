import { NextResponse } from 'next/server';
import { updateTimeBasedLeaderboards } from '@/lib/gamification-service';

export async function GET(req: Request) {
  try {
    // Add authentication for CRON jobs in production
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const result = await updateTimeBasedLeaderboards();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[LEADERBOARD_UPDATE_CRON]', error);
    return NextResponse.json({ error: 'Leaderboard update failed' }, { status: 500 });
  }
} 