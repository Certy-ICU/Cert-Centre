import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { syncUserProfile } from "@/lib/gamification-service";

// POST endpoint to sync user data from Clerk to our database
export async function POST() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const profile = await syncUserProfile(userId);
    
    if (!profile) {
      return new NextResponse("Failed to sync profile", { status: 500 });
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[USER_SYNC]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 