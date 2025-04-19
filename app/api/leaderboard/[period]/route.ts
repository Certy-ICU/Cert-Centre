import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getLeaderboardByPeriod } from "@/lib/gamification-service";

export async function GET(
  req: Request,
  { params }: { params: { period: string } }
) {
  try {
    const { userId } = auth();
    
    // Don't require auth for viewing leaderboard
    // but it could be used for highlighting the current user
    
    const { period } = params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Validate period
    if (!["weekly", "monthly", "all-time"].includes(period)) {
      return new NextResponse("Invalid period", { status: 400 });
    }
    
    const leaderboard = await getLeaderboardByPeriod(period, limit);
    
    return NextResponse.json({
      currentUserId: userId,
      period,
      entries: leaderboard
    });
  } catch (error) {
    console.error("[LEADERBOARD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 