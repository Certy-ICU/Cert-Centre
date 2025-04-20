import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configuration
const NUM_TEACHERS = 2;
const NUM_STUDENTS = 50;
const COURSES_PER_TEACHER = 5;
const CHAPTERS_PER_COURSE = 10;
const MAX_PURCHASES_PER_STUDENT = 5;
const COMPLETION_RATE = 0.7; // 70% chance a student completes a chapter they've started

// Helper to create a random date within the last 3 months
const getRandomRecentDate = () => {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  
  return new Date(
    threeMonthsAgo.getTime() + 
    Math.random() * (now.getTime() - threeMonthsAgo.getTime())
  );
};

async function main() {
  try {
    console.log('Starting seeding process...');

    // Create or find test category
    const testCategory = await prisma.category.upsert({
      where: { name: 'Test Category' },
      update: {},
      create: {
        name: 'Test Category',
      },
    });
    console.log('Created or found test category:', testCategory.name);

    // Create test course with a userId that exists in your system
    // Change this to a valid Clerk user ID in your system
    const testUserId = 'user_2WJP4XUxc0s9meZ1AeGeA8gI806'; // Replace with a valid userId
    
    const testCourse = await prisma.course.create({
      data: {
        userId: testUserId,
        title: 'Test Course for Search',
        description: 'This is a test course to verify search functionality',
        imageUrl: 'https://via.placeholder.com/640x360.png?text=Test+Course',
        price: 29.99,
        isPublished: true,
        categoryId: testCategory.id,
        chapters: {
          create: [
            {
              title: 'Introduction',
              description: 'An introduction to the test course',
              position: 1,
              isPublished: true,
              isFree: true,
            },
            {
              title: 'Getting Started',
              description: 'Getting started with testing',
              position: 2,
              isPublished: true,
              isFree: false,
            }
          ]
        }
      }
    });
    console.log('Created test course:', testCourse.title);

    // Clear existing data
    await Promise.all([
      prisma.userProgress.deleteMany({}),
      prisma.purchase.deleteMany({}),
      prisma.muxData.deleteMany({}),
      prisma.attachment.deleteMany({}),
      prisma.chapter.deleteMany({}),
      prisma.course.deleteMany({}),
      prisma.category.deleteMany({}),
      prisma.userBadge.deleteMany({}),
      prisma.badge.deleteMany({}),
      prisma.userProfile.deleteMany({}),
    ]);

    console.log('✅ Database cleared');

    // Create badge definitions
    const badges = [
      {
        name: "First Course Completed",
        description: "Completed your first course",
        iconUrl: "/badges/course-completed.svg",
        criteria: "Complete all chapters in a course"
      },
      {
        name: "Knowledge Explorer",
        description: "Completed 5 different courses",
        iconUrl: "/badges/knowledge-explorer.svg",
        criteria: "Complete 5 different courses"
      },
      {
        name: "Engaged Learner",
        description: "Posted your first comment",
        iconUrl: "/badges/engaged-learner.svg",
        criteria: "Post a comment on any course content"
      },
      {
        name: "Fast Learner",
        description: "Completed a course in under 24 hours",
        iconUrl: "/badges/fast-learner.svg",
        criteria: "Complete all chapters of a course within 24 hours of purchase"
      },
      {
        name: "Streak Master",
        description: "Logged in for 7 consecutive days",
        iconUrl: "/badges/streak-master.svg", 
        criteria: "Log in to the platform for 7 days in a row"
      }
    ];

    const createdBadges = await Promise.all(
      badges.map(badge => 
        prisma.badge.create({ data: badge })
      )
    );

    console.log(`✅ Created ${createdBadges.length} badge definitions`);

    // Create categories
    const categories = [
      { name: 'Computer Science' },
      { name: 'Marketing' },
      { name: 'Accounting' },
      { name: 'Music' },
      { name: 'Photography' },
      { name: 'Fitness' },
    ];

    const createdCategories = await Promise.all(
      categories.map(category => 
        prisma.category.create({ data: category })
      )
    );

    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create teachers
    const teachers = Array.from({ length: NUM_TEACHERS }).map(() => faker.string.uuid());
    console.log(`✅ Created ${teachers.length} teachers`);

    // Create students
    const students = Array.from({ length: NUM_STUDENTS }).map(() => faker.string.uuid());
    console.log(`✅ Created ${students.length} students`);

    // Create courses for each teacher
    const courses = [];

    for (const teacherId of teachers) {
      for (let i = 0; i < COURSES_PER_TEACHER; i++) {
        const category = faker.helpers.arrayElement(createdCategories);
        const price = faker.number.float({ min: 9.99, max: 99.99, precision: 2 });
        
        const course = await prisma.course.create({
          data: {
            userId: teacherId,
            title: faker.company.catchPhrase(),
            description: faker.lorem.paragraphs(2),
            imageUrl: `https://picsum.photos/seed/${faker.string.alphanumeric(5)}/800/600`,
            price,
            isPublished: true,
            categoryId: category.id,
          }
        });
        
        courses.push(course);
        
        // Create chapters for this course
        const chapters = [];
        
        for (let j = 0; j < CHAPTERS_PER_COURSE; j++) {
          const chapter = await prisma.chapter.create({
            data: {
              title: faker.company.buzzPhrase(),
              description: faker.lorem.paragraph(),
              position: j + 1,
              isPublished: true,
              isFree: j === 0, // First chapter is free
              courseId: course.id,
            }
          });
          
          chapters.push(chapter);
          
          // Add MuxData
          await prisma.muxData.create({
            data: {
              chapterId: chapter.id,
              assetId: faker.string.alphanumeric(10),
              playbackId: faker.string.alphanumeric(10),
            }
          });
        }
        
        // Create 1-3 attachments per course
        const numAttachments = faker.number.int({ min: 1, max: 3 });
        for (let k = 0; k < numAttachments; k++) {
          await prisma.attachment.create({
            data: {
              name: `${faker.system.fileName()}.pdf`,
              url: `https://example.com/files/${faker.string.uuid()}.pdf`,
              courseId: course.id,
            }
          });
        }
      }
    }

    console.log(`✅ Created ${courses.length} courses with chapters and attachments`);

    // Create purchases with varying dates
    const purchases = [];

    for (const studentId of students) {
      // Each student purchases 1-5 random courses
      const numPurchases = faker.number.int({ min: 1, max: MAX_PURCHASES_PER_STUDENT });
      const purchasedCourses = faker.helpers.arrayElements(courses, numPurchases);
      
      for (const course of purchasedCourses) {
        const purchase = await prisma.purchase.create({
          data: {
            userId: studentId,
            courseId: course.id,
            createdAt: getRandomRecentDate(),
          }
        });
        
        purchases.push(purchase);
        
        // Create progress for chapters in purchased courses
        const chapters = await prisma.chapter.findMany({
          where: { courseId: course.id, isPublished: true },
        });
        
        for (const chapter of chapters) {
          // Random completion with a certain probability
          const isCompleted = Math.random() < COMPLETION_RATE;
          
          if (isCompleted) {
            await prisma.userProgress.create({
              data: {
                userId: studentId,
                chapterId: chapter.id,
                isCompleted: true,
                // Progress is created between purchase date and now
                createdAt: new Date(
                  purchase.createdAt.getTime() + 
                  Math.random() * (new Date().getTime() - purchase.createdAt.getTime())
                ),
              }
            });
          }
        }
      }
    }

    console.log(`✅ Created ${purchases.length} purchases with progress data`);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 