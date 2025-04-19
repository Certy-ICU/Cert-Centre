import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getUserProfile } from "@/lib/gamification-service";

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return new NextResponse("Profile not found", { status: 404 });
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[GAMIFICATION_PROFILE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 