# Implementing API Documentation (Swagger/OpenAPI)

This guide explains how to automatically generate OpenAPI (Swagger) documentation for your Next.js API routes.

*Self-documenting API routes in Next.js App Router isn't as straightforward as with frameworks like NestJS or using dedicated libraries with Pages Router. We can leverage JSDoc comments and a build-time script or a dedicated library compatible with App Router.*

Let's explore an approach using `swagger-jsdoc` which reads JSDoc annotations.

## 1. Install Dependencies

```bash
pnpm install swagger-jsdoc swagger-ui-react
# Or using yarn
# yarn add swagger-jsdoc swagger-ui-react
```

## 2. Define Base OpenAPI Specification

Create a base OpenAPI definition file or define it within a script. This provides the overall structure (info, servers, etc.).

```javascript
// lib/openapi-spec.js (or .ts if using TypeScript for scripts)

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cert Centre LMS API',
      version: '1.0.0',
      description: 'API documentation for the Cert Centre Learning Management System',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      // Add production server if applicable
    ],
    components: {
      // Define reusable components like securitySchemes, schemas, etc.
      // securitySchemes: {
      //   bearerAuth: { // Example for JWT/Clerk - Adjust if needed
      //     type: 'http',
      //     scheme: 'bearer',
      //     bearerFormat: 'JWT',
      //   },
      // },
      schemas: {
        // Define reusable schemas for request/response bodies
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'float' },
            isPublished: { type: 'boolean' },
            // ... other Course fields from Prisma
          }
        },
        // ... Add other schemas (Chapter, Comment, etc.)
      }
    },
    // security: [
    //   {
    //     bearerAuth: [], // Apply security globally if needed
    //   },
    // ],
  },
  // Path to the API docs
  // Use glob patterns to scan your API route files
  apis: ['./app/api/**/*.ts', './app/api/**/*.js'], // Adjust pattern as needed
};

const openapiSpecification = swaggerJsdoc(options);

module.exports = openapiSpecification;

// Optional: Script to generate a static JSON file during build
// const fs = require('fs');
// fs.writeFileSync('./public/swagger.json', JSON.stringify(openapiSpecification, null, 2));
```

## 3. Annotate API Routes with JSDoc

Add JSDoc comments following the OpenAPI specification syntax to your API route handlers (`GET`, `POST`, `PATCH`, `DELETE` functions in `app/api/.../route.ts`).

```typescript
// Example: app/api/courses/[courseId]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/courses/{courseId}:
 *   get:
 *     summary: Get a specific course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course to retrieve
 *     responses:
 *       200:
 *         description: Course details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course' # Reference your defined schema
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  // ... your route logic
}

/**
 * @swagger
 * /api/courses/{courseId}:
 *   patch:
 *     summary: Update a specific course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: number, format: float }
 *               # ... other updatable fields
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized (User not logged in or not owner/admin)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: [] # If authentication is required for this endpoint
 */
export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
   // Requires auth check (e.g., userId must match course.userId)
  const { userId } = auth();
  const values = await req.json();
  // ... your route logic
}

// Add similar JSDoc annotations for DELETE, POST, etc.
// Define tags: [Courses], [Chapters], [Comments], [Users], etc. for organization.
```

## 4. Create API Documentation Page

Create a new route (e.g., `app/api-docs/page.tsx`) to display the Swagger UI.

```typescript
// app/api-docs/page.tsx
'use client'; // Swagger UI component needs to be client-side

import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

// Option 1: Fetch the generated spec if you created a static file
// const specUrl = "/swagger.json";

// Option 2: Import the spec directly (if not using a static file)
// Note: This might increase client bundle size significantly.
// Consider fetching or generating dynamically if it becomes too large.
import spec from '@/lib/openapi-spec'; // Adjust path if needed

const ApiDocsPage = () => {
  // return <SwaggerUI url={specUrl} />;
  return <SwaggerUI spec={spec} />;
};

export default ApiDocsPage;
```

*Note*: Choose Option 1 (fetching `/swagger.json`) if you generate the spec file during build (`node ./lib/openapi-spec.js` added to your `package.json` build script) or Option 2 (importing) for simplicity if the spec isn't huge.

## 5. Run and Test

- Run your development server (`npm run dev`).
- Navigate to `/api-docs` (or the route you created).
- You should see the Swagger UI displaying your annotated API routes.
- Test the "Try it out" functionality within Swagger UI (this will make actual API calls).

## Considerations

- **Maintenance**: Keep JSDoc comments updated as your API evolves.
- **Schema Definitions**: Defining reusable schemas (`#/components/schemas/...`) makes the documentation cleaner and more maintainable.
- **Authentication**: Clearly document how authentication works (e.g., using Clerk) and mark protected endpoints using the `security` field in JSDoc.
- **Build Process**: Generating a static `swagger.json` during the build (`npm run build`) is generally preferred for performance, especially for large APIs.
- **Alternative Libraries**: Explore other libraries like `next-swagger-doc` (might have better App Router support evolving) or framework-specific solutions if you migrate parts of the API to something like NestJS. 