import { db } from "@/lib/db";

type PointActivityType = 
  | "ACCOUNT_CREATION"
  | "COURSE_COMPLETION" 
  | "QUIZ_COMPLETION"
  | "CERTIFICATE_EARNED"
  | "COMMUNITY_CONTRIBUTION"
  | "DAILY_LOGIN"
  | "ADMIN_ADJUSTMENT"
  | "OTHER";

interface AwardPointsParams {
  userId: string;
  points: number;
  reason: string;
  activityType: PointActivityType;
  idempotencyKey?: string; // Optional idempotency key to prevent duplicate awards
}

/**
 * Awards points to a user and records the activity
 * 
 * @param params - The parameters for awarding points
 * @returns The updated user profile
 */
export const awardPoints = async ({
  userId,
  points,
  reason,
  activityType,
  idempotencyKey
}: AwardPointsParams) => {
  try {
    if (points <= 0) {
      throw new Error("Points must be a positive number");
    }

    // If idempotency key is provided, check if this award was already processed
    if (idempotencyKey) {
      const existingActivity = await db.pointActivity.findFirst({
        where: {
          userId,
          idempotencyKey,
        }
      });

      if (existingActivity) {
        // Award was already processed, return current profile
        const profile = await db.userProfile.findUnique({
          where: {
            userId
          }
        });
        return profile;
      }
    }

    // Create a transaction to update points and record activity
    const result = await db.$transaction(async (tx) => {
      // Record point activity
      const activity = await tx.pointActivity.create({
        data: {
          userId,
          points,
          reason,
          activityType,
          idempotencyKey,
          createdAt: new Date()
        }
      });
      
      // Update user profile points
      const updatedProfile = await tx.userProfile.update({
        where: {
          userId
        },
        data: {
          points: {
            increment: points
          },
          totalPointsEarned: {
            increment: points
          }
        }
      });
      
      return updatedProfile;
    });
    
    return result;
  } catch (error) {
    console.error("[AWARD_POINTS_ACTION]", error);
    throw new Error("Failed to award points");
  }
};

/**
 * Award points for completing a course
 */
export const awardCourseCompletionPoints = async (userId: string, courseId: string, courseName: string) => {
  // Standard points for course completion
  const COURSE_COMPLETION_POINTS = 100;
  
  return awardPoints({
    userId,
    points: COURSE_COMPLETION_POINTS,
    reason: `Completed course: ${courseName}`,
    activityType: "COURSE_COMPLETION",
    idempotencyKey: `course_completion_${userId}_${courseId}`
  });
};

/**
 * Award points for completing a quiz
 */
export const awardQuizCompletionPoints = async (userId: string, quizId: string, quizName: string, score: number) => {
  // Base points for quiz completion
  const BASE_QUIZ_POINTS = 50;
  
  // Additional points based on score (up to 50 more points for 100% score)
  const bonusPoints = Math.floor((score / 100) * 50);
  const totalPoints = BASE_QUIZ_POINTS + bonusPoints;
  
  return awardPoints({
    userId,
    points: totalPoints,
    reason: `Completed quiz: ${quizName} with score ${score}%`,
    activityType: "QUIZ_COMPLETION",
    idempotencyKey: `quiz_completion_${userId}_${quizId}`
  });
};

/**
 * Award points for daily login
 */
export const awardDailyLoginPoints = async (userId: string) => {
  const DAILY_LOGIN_POINTS = 10;
  
  // Create idempotency key based on userId and current date (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const idempotencyKey = `daily_login_${userId}_${today}`;
  
  return awardPoints({
    userId,
    points: DAILY_LOGIN_POINTS,
    reason: "Daily login bonus",
    activityType: "DAILY_LOGIN",
    idempotencyKey
  });
};

/**
 * Award points for earning a certificate
 */
export const awardCertificatePoints = async (userId: string, certificateId: string, certificateName: string) => {
  const CERTIFICATE_POINTS = 200;
  
  return awardPoints({
    userId,
    points: CERTIFICATE_POINTS,
    reason: `Earned certificate: ${certificateName}`,
    activityType: "CERTIFICATE_EARNED",
    idempotencyKey: `certificate_earned_${userId}_${certificateId}`
  });
}; 