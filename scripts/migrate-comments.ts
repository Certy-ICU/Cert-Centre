import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting comment migration...");

    // 1. Find all comments that have chapterId but no courseId
    const comments = await prisma.comment.findMany({
      where: {
        chapterId: { not: null },
        courseId: null,
      },
      include: {
        chapter: true,
      },
    });

    console.log(`Found ${comments.length} comments to migrate.`);

    // 2. Update each comment to add the course ID from its chapter
    for (const comment of comments) {
      if (!comment.chapter) {
        console.log(`Skipping comment ${comment.id}: Chapter not found.`);
        continue;
      }

      await prisma.comment.update({
        where: { id: comment.id },
        data: { courseId: comment.chapter.courseId },
      });

      console.log(`Migrated comment ${comment.id} to course ${comment.chapter.courseId}`);
    }

    // 3. Create user records for all user IDs in comments
    const userIds = await prisma.comment.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });

    console.log(`Found ${userIds.length} unique users to create.`);

    // 4. Create users (if they don't exist)
    for (const { userId } of userIds) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: userId,
            name: `User ${userId.substring(0, 4)}`, // Placeholder name
          },
        });
        console.log(`Created user record for ${userId}`);
      } else {
        console.log(`User ${userId} already exists`);
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("Script execution complete.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Script execution failed:", e);
    process.exit(1);
  }); 