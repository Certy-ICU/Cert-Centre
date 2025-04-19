import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { syncUserProfile } from "@/lib/gamification-service";
import { clerkClient } from "@clerk/nextjs";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    
    // Check if user is admin (you should implement proper admin checks)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get the request body to check for a secret key
    const body = await req.json();
    
    // Basic security check - in production, implement proper admin role checks
    if (body.adminSecret !== process.env.ADMIN_SECRET) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get all user profiles
    const profiles = await db.userProfile.findMany({
      select: { userId: true }
    });
    
    // Sync each profile with a delay to avoid rate limits
    const results = [];
    const limit = body.limit ? parseInt(body.limit) : profiles.length;
    
    for (let i = 0; i < Math.min(profiles.length, limit); i++) {
      try {
        const profile = await syncUserProfile(profiles[i].userId);
        if (profile) {
          results.push({
            userId: profiles[i].userId,
            username: profile.username,
            success: true
          });
        } else {
          results.push({
            userId: profiles[i].userId,
            success: false,
            error: "Failed to sync profile"
          });
        }
        
        // Add a small delay to avoid Clerk rate limits
        if (i < Math.min(profiles.length, limit) - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        results.push({
          userId: profiles[i].userId,
          success: false,
          error: "Error syncing profile"
        });
      }
    }
    
    return NextResponse.json({
      totalSynced: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error("[SYNC_USERS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 