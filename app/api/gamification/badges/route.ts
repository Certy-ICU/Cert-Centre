import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getAllBadges } from "@/lib/gamification-service";

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const badges = await getAllBadges();
    
    return NextResponse.json(badges);
  } catch (error) {
    console.error("[GAMIFICATION_BADGES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 