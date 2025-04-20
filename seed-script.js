const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const testCategory = await prisma.category.upsert({
      where: { name: 'Test Category' },
      update: {},
      create: {
        name: 'Test Category'
      }
    });
    console.log('Created category:', testCategory.name);

    const testUserId = 'user_2WJP4XUxc0s9meZ1AeGeA8gI806'; // Replace with a valid clerk user ID

    const testCourse = await prisma.course.create({
      data: {
        userId: testUserId,
        title: 'Test Course',
        description: 'Test description',
        imageUrl: 'https://via.placeholder.com/640x360',
        price: 19.99,
        isPublished: true,
        categoryId: testCategory.id,
        chapters: {
          create: [
            {
              title: 'Chapter 1',
              description: 'Chapter 1 desc',
              position: 1,
              isPublished: true,
              isFree: true
            }
          ]
        }
      }
    });
    console.log('Created course:', testCourse.title);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 