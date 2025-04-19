import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getLeaderboard } from "@/lib/gamification-service";

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    const leaderboard = await getLeaderboard(limit);
    
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("[GAMIFICATION_LEADERBOARD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 