import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

// Sample badges data
const sampleBadges = [
  {
    name: "Course Completer",
    description: "Completed your first course",
    iconUrl: "/badges/course-completed.svg",
    criteria: "Complete all chapters in any course",
    tier: "BRONZE"
  },
  {
    name: "Knowledge Explorer",
    description: "Completed 5 different courses",
    iconUrl: "/badges/knowledge-explorer.svg",
    criteria: "Complete 5 different courses",
    tier: "SILVER"
  },
  {
    name: "Learning Master",
    description: "Completed 10 different courses",
    iconUrl: "/badges/course-completed.svg",
    criteria: "Complete 10 different courses",
    tier: "GOLD"
  },
  {
    name: "Engaged Learner",
    description: "Posted your first comment",
    iconUrl: "/badges/engaged-learner.svg",
    criteria: "Post a comment on any course content",
    tier: "BRONZE"
  },
  {
    name: "Community Contributor",
    description: "Posted 10 comments",
    iconUrl: "/badges/engaged-learner.svg",
    criteria: "Post 10 comments across the platform",
    tier: "SILVER"
  },
  {
    name: "Discussion Leader",
    description: "Posted 50 comments",
    iconUrl: "/badges/engaged-learner.svg",
    criteria: "Post 50 comments across the platform",
    tier: "GOLD"
  },
  {
    name: "Fast Learner",
    description: "Completed a course in under 24 hours",
    iconUrl: "/badges/fast-learner.svg",
    criteria: "Complete all chapters of a course within 24 hours of starting",
    tier: "SILVER"
  },
  {
    name: "Streak: Bronze",
    description: "Logged in for 3 consecutive days",
    iconUrl: "/badges/streak-master.svg",
    criteria: "Log in to the platform for 3 days in a row",
    tier: "BRONZE"
  },
  {
    name: "Streak: Silver",
    description: "Logged in for 7 consecutive days",
    iconUrl: "/badges/streak-master.svg",
    criteria: "Log in to the platform for 7 days in a row",
    tier: "SILVER"
  },
  {
    name: "Streak: Gold",
    description: "Logged in for 30 consecutive days",
    iconUrl: "/badges/streak-master.svg",
    criteria: "Log in to the platform for 30 days in a row",
    tier: "GOLD"
  }
];

// GET /api/gamification/badges/seed - Create sample badges
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if any badges already exist
    const existingBadgesCount = await db.badge.count();
    
    // Skip admin check in development or if no badges exist yet
    const isSetupRequired = existingBadgesCount === 0;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Only check for admin if we're not in development and already have badges
    if (!isDevelopment && !isSetupRequired) {
      const adminCheck = await isAdmin(userId);
      
      if (!adminCheck) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    
    if (existingBadgesCount > 0) {
      return NextResponse.json({
        message: `${existingBadgesCount} badges already exist in the database. No new badges created.`
      });
    }
    
    // Create the sample badges
    const createdBadges = await Promise.all(
      sampleBadges.map(badge => 
        db.badge.create({
          data: badge
        })
      )
    );
    
    return NextResponse.json({
      message: `Created ${createdBadges.length} sample badges.`,
      badges: createdBadges
    });
  } catch (error) {
    console.error("[BADGES_SEED]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 