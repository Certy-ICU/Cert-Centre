/**
 * This script allows you to create a demo teacher with a fixed ID
 * for consistent testing with the analytics dashboard.
 * 
 * Usage:
 * ts-node --compiler-options {\"module\":\"CommonJS\"} scripts/generate-demo-teacher.ts
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configure your demo teacher ID here
// This should match the ID of a teacher in your authentication system
const DEMO_TEACHER_ID = 'user_2WJP4XUxc0s9meZ1AeGeA8gI806';

// Configuration
const COURSES_PER_TEACHER = 8;
const CHAPTERS_PER_COURSE = 10;
const NUM_STUDENTS = 100;
const MAX_PURCHASES_PER_STUDENT = 5;
const COMPLETION_RATE = 0.7;

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

// Helper to create a date on a specific day
const getDateOnDay = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

async function main() {
  console.log('🔍 Checking if demo teacher data already exists...');
  
  // Check if teacher already has courses
  const existingCourses = await prisma.course.findMany({
    where: { userId: DEMO_TEACHER_ID }
  });
  
  if (existingCourses.length > 0) {
    console.log(`⚠️ Demo teacher already has ${existingCourses.length} courses. Cleaning up...`);
    
    // Get all course IDs
    const courseIds = existingCourses.map(course => course.id);
    
    // Delete all related data
    await prisma.userProgress.deleteMany({
      where: { chapter: { courseId: { in: courseIds } } }
    });
    
    await prisma.purchase.deleteMany({
      where: { courseId: { in: courseIds } }
    });
    
    await prisma.muxData.deleteMany({
      where: { chapter: { courseId: { in: courseIds } } }
    });
    
    await prisma.chapter.deleteMany({
      where: { courseId: { in: courseIds } }
    });
    
    await prisma.attachment.deleteMany({
      where: { courseId: { in: courseIds } }
    });
    
    await prisma.course.deleteMany({
      where: { id: { in: courseIds } }
    });
    
    console.log('✅ Previous demo data cleaned');
  }
  
  console.log(`🌱 Starting to seed demo data for teacher: ${DEMO_TEACHER_ID}`);
  
  // Get or create categories
  let categories = await prisma.category.findMany();
  
  if (categories.length === 0) {
    const categoryNames = [
      'Computer Science', 'Marketing', 'Accounting', 
      'Music', 'Photography', 'Fitness'
    ];
    
    categories = await Promise.all(
      categoryNames.map(name => 
        prisma.category.create({ data: { name } })
      )
    );
    
    console.log(`✅ Created ${categories.length} categories`);
  } else {
    console.log(`✅ Using ${categories.length} existing categories`);
  }
  
  // Create varied priced courses for the demo teacher
  const courses = [];
  const coursePrices = [19.99, 49.99, 99.99, 149.99, 29.99, 79.99, 9.99, 199.99];
  
  for (let i = 0; i < COURSES_PER_TEACHER; i++) {
    const category = faker.helpers.arrayElement(categories);
    const price = coursePrices[i] || faker.number.float({ min: 9.99, max: 199.99, fractionDigits: 2 });
    
    const course = await prisma.course.create({
      data: {
        userId: DEMO_TEACHER_ID,
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
          isFree: j === 0,
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
    
    // Create attachments
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
  
  console.log(`✅ Created ${courses.length} courses with chapters and attachments`);
  
  // Generate random students
  const students = Array.from({ length: NUM_STUDENTS }).map(() => faker.string.uuid());
  console.log(`✅ Generated ${students.length} test students`);
  
  // Create varied course purchase patterns
  const purchases = [];
  
  // Create spike in purchases for a specific day to demonstrate time-based analytics
  // Day 1: Normal purchases
  // Day 15: 3x increase in purchases
  // Day 30: 1.5x increase in purchases
  
  const purchaseDays = [
    // Recent purchases (last 7 days)
    ...Array.from({ length: 20 }).map(() => faker.number.int({ min: 0, max: 7 })),
    
    // Sales spike (15 days ago)
    ...Array.from({ length: 60 }).map(() => 15),
    
    // Moderate increase (30 days ago)
    ...Array.from({ length: 30 }).map(() => 30),
    
    // Random other purchases
    ...Array.from({ length: 90 }).map(() => faker.number.int({ min: 8, max: 90 }))
  ];
  
  // Assign purchase days to students
  for (const studentId of students) {
    // Each student purchases 1-5 random courses
    const numPurchases = faker.number.int({ min: 1, max: MAX_PURCHASES_PER_STUDENT });
    const purchasedCourses = faker.helpers.arrayElements(courses, numPurchases);
    
    for (const course of purchasedCourses) {
      // Pick a purchase day
      const purchaseDay = purchaseDays.pop() || faker.number.int({ min: 0, max: 90 });
      
      const purchase = await prisma.purchase.create({
        data: {
          userId: studentId,
          courseId: course.id,
          createdAt: getDateOnDay(purchaseDay),
        }
      });
      
      purchases.push(purchase);
      
      // Create progress for chapters in purchased courses
      const chapters = await prisma.chapter.findMany({
        where: { courseId: course.id, isPublished: true },
      });
      
      // Create varied completion patterns
      // Higher-priced courses may have lower completion rates
      const courseSpecificCompletionRate = 
        course.price && course.price > 100 
          ? COMPLETION_RATE * 0.8 
          : course.price && course.price < 30
            ? COMPLETION_RATE * 1.2
            : COMPLETION_RATE;
      
      for (const chapter of chapters) {
        // First chapters have higher completion rates
        const chapterPosition = chapter.position;
        const positionFactor = 
          chapterPosition <= 3 ? 1.3 : 
          chapterPosition >= 8 ? 0.7 : 1;
        
        const isCompleted = Math.random() < (courseSpecificCompletionRate * positionFactor);
        
        if (isCompleted) {
          await prisma.userProgress.create({
            data: {
              userId: studentId,
              chapterId: chapter.id,
              isCompleted: true,
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
  
  console.log(`✅ Created ${purchases.length} purchases with varied patterns`);
  console.log('🌱 Demo teacher data seeding completed successfully!');
  console.log(`\n📊 To view the analytics dashboard, log in as user ${DEMO_TEACHER_ID}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 