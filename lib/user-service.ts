import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";

/**
 * Ensures the current authenticated user exists in our database
 * Syncs minimal user data from Clerk to our local database
 */
export const syncCurrentUser = async () => {
  const user = await currentUser();
  
  if (!user) {
    return null;
  }
  
  // Find or create user in our database
  const dbUser = await db.user.upsert({
    where: {
      id: user.id,
    },
    update: {
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
      email: user.emailAddresses[0]?.emailAddress || null,
      imageUrl: user.imageUrl || null,
    },
    create: {
      id: user.id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
      email: user.emailAddresses[0]?.emailAddress || null,
      imageUrl: user.imageUrl || null,
    },
  });
  
  return dbUser;
};

/**
 * Get user data from our database by Clerk user ID
 */
export const getUserById = async (userId: string) => {
  return db.user.findUnique({
    where: {
      id: userId,
    },
  });
}; 