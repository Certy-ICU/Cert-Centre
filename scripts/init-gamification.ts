import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Extend PrismaClient to include the new types
type ExtendedPrismaClient = PrismaClient & {
  badge: {
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  };
  userProfile: {
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
  };
  userBadge: {
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  };
};

const prisma = new PrismaClient() as ExtendedPrismaClient;

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

async function main() {
  console.log('🔧 Initializing gamification system...');

  try {
    // First generate the Prisma client with the new models
    console.log('📝 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated successfully');

    // Push the schema changes directly to the database (no migrations)
    console.log('📊 Pushing schema changes to database...');
    await execAsync('npx prisma db push');
    console.log('✅ Schema changes applied successfully');

    // Check if badges already exist and create them if they don't
    console.log('🏆 Setting up badges...');
    
    for (const badge of badges) {
      const existingBadge = await prisma.badge.findUnique({
        where: { name: badge.name }
      });
      
      if (!existingBadge) {
        await prisma.badge.create({ data: badge });
        console.log(`✅ Created badge: ${badge.name}`);
      } else {
        console.log(`ℹ️ Badge already exists: ${badge.name}`);
      }
    }
    
    console.log('🎮 Gamification system initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing gamification system:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 