import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { syncCurrentUser } from "@/lib/user-service";

// POST endpoint to sync user data from Clerk to our database
export async function POST() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Sync user data
    const user = await syncCurrentUser();
    
    if (!user) {
      return new NextResponse("Failed to sync user", { status: 500 });
    }
    
    // Return minimal response for performance
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[USER_SYNC]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 