"use server";

import { cookies, headers } from "next/headers";
import { updateUserStreak } from "@/lib/streak-service";
import { auth } from "@clerk/nextjs";

/**
 * Server action to check if a user visit was recorded and update the streak if needed
 * This should be called from a server component that renders on pages where streak updates should occur
 */
export async function processUserVisit() {
  try {
    const { userId } = auth();
    if (!userId) return null;
    
    // Check if this is a user visit (set by middleware)
    const headersList = headers();
    const isUserVisit = headersList.get('X-User-Visit') === 'true';
    
    // Get the last streak update from cookie to prevent multiple updates in a single session
    const lastUpdate = cookies().get('last-streak-update')?.value;
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Only update streak once per day
    if (isUserVisit && (!lastUpdate || lastUpdate !== today)) {
      // Set a cookie to prevent multiple streak updates in a day
      cookies().set('last-streak-update', today, {
        expires: new Date(now.setHours(24, 0, 0, 0)), // Expires at midnight
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
      });
      
      // Update the streak
      return await updateUserStreak(userId);
    }
    
    return null;
  } catch (error) {
    console.error("Error processing user visit:", error);
    return null;
  }
} 