import { db } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs";

/**
 * Check if a user has admin privileges
 * @param userId The Clerk user ID
 * @returns Promise<boolean> True if user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    // Get admin emails from environment variable
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    // For security, if no admin emails are configured but we're in production,
    // deny admin access to everyone
    if (adminEmails.length === 0 && process.env.NODE_ENV === 'production') {
      return false;
    }
    
    // For development: if no admin is configured, make everyone an admin
    if (adminEmails.length === 0 && process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Get user email from Clerk
    try {
      const user = await clerkClient.users.getUser(userId);
      
      // Check if any of user's email addresses are in the admin list
      const userEmails = user.emailAddresses.map(email => email.emailAddress.toLowerCase());
      
      return userEmails.some(email => 
        adminEmails.map(adminEmail => adminEmail.toLowerCase()).includes(email)
      );
    } catch (error) {
      console.error("Error fetching user from Clerk:", error);
      return false;
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
} 