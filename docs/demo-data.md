# Analytics Dashboard Demo Data

This guide explains how to generate and use demo data for showcasing the enhanced analytics dashboard.

## Prerequisites

Before running the seed script, make sure you have installed the necessary dependencies:

```bash
npm install --save-dev @faker-js/faker ts-node
# or
yarn add --dev @faker-js/faker ts-node
# or
pnpm add --save-dev @faker-js/faker ts-node
```

## Generating Demo Data

### Option 1: General Seed Data

The main seed script will populate your database with realistic demo data to showcase all features of the analytics dashboard. This includes:

- 2 teacher accounts
- 5 courses per teacher
- 10 chapters per course
- 50 student accounts
- 1-5 course purchases per student
- Varied chapter completion rates
- Purchases spread over the last 3 months

#### Warning

⚠️ **This script will clear existing data in the database.** Make sure to back up your production data or run this in a development environment only.

#### Running the Seed Script

Run the script using:

```bash
npm run seed
# or 
yarn seed
# or
pnpm seed
```

### Option 2: Demo Teacher with Fixed ID (Recommended)

For demonstration purposes, it's often better to use a known teacher ID that matches an existing account. The demo teacher script creates data specifically for a single teacher ID and doesn't delete other data in the database.

Features:
- Creates 8 courses with varied pricing
- Generates 100 student accounts
- Creates purchase patterns with deliberate spikes on certain days (for compelling time-series visualization)
- Varies completion rates based on course price and chapter position
- Only replaces data for the specific demo teacher

#### Running the Demo Teacher Script

First, configure the demo teacher ID in `scripts/generate-demo-teacher.ts`:

```typescript
// Configure your demo teacher ID here
// This should match the ID of a teacher in your authentication system
const DEMO_TEACHER_ID = 'user_2WJP4XUxc0s9meZ1AeGeA8gI806'; // Already set to your teacher ID
```

Then run:

```bash
npm run seed:demo-teacher
# or 
yarn seed:demo-teacher
# or
pnpm seed:demo-teacher
```

If you need to run the script directly with ts-node, use:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/generate-demo-teacher.ts
```

Note: Be sure to use single quotes around the compiler options JSON (which itself contains double quotes).

## Configuration

You can modify the following variables in the seed scripts to adjust the amount and characteristics of the generated data:

**In prisma/seed.ts:**
```typescript
const NUM_TEACHERS = 2;
const NUM_STUDENTS = 50;
const COURSES_PER_TEACHER = 5;
const CHAPTERS_PER_COURSE = 5;
const MAX_PURCHASES_PER_STUDENT = 5;
const COMPLETION_RATE = 0.7; // 70% chance a student completes a chapter they've started
```

**In scripts/generate-demo-teacher.ts:**
```typescript
const DEMO_TEACHER_ID = 'demo-teacher-123';
const COURSES_PER_TEACHER = 8;
const CHAPTERS_PER_COURSE = 5;
const NUM_STUDENTS = 100;
const MAX_PURCHASES_PER_STUDENT = 5;
const COMPLETION_RATE = 0.7;
```

## How the Data Demonstrates Analytics Features

The generated demo data is specifically designed to showcase all aspects of the enhanced analytics dashboard:

1. **Course Performance**
   - Courses have varying prices and enrollment numbers
   - Total revenue varies between courses

2. **Student Engagement**
   - Chapter completion rates vary between courses and chapter positions
   - First chapters have higher completion rates than later ones
   - Higher-priced courses have slightly lower completion rates

3. **Time-Based Analytics**
   - The demo teacher script creates specific purchase patterns:
     - A large spike 15 days ago (3x normal volume)
     - A moderate spike 30 days ago (1.5x normal volume)
     - Recent purchases in the last week
   - This creates visually interesting time-series charts

## Customizing for Specific Scenarios

The demo teacher script creates data patterns that highlight specific analytics features:

1. **Price-based completion correlation** - More expensive courses have lower completion rates
2. **Chapter position effect** - Earlier chapters have higher completion rates
3. **Revenue spikes** - Clear revenue patterns in time-series data
4. **Course variety** - Wide price range from $9.99 to $199.99

You can modify these patterns in the script to emphasize different analytics insights.

## Troubleshooting

If you encounter issues:

1. Make sure Prisma is properly configured with your database
2. Check that all dependencies are installed
3. Ensure your database is accessible and that you have the appropriate permissions

For more help, check the [Prisma documentation](https://www.prisma.io/docs/) on database seeding. 