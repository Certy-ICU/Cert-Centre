# API Documentation (Swagger/OpenAPI)

This guide explains how Cert Centre LMS implements OpenAPI (Swagger) documentation for its Next.js API routes.

## Overview

The Cert Centre API is fully documented using OpenAPI (Swagger), providing an interactive documentation experience. This documentation is automatically generated from JSDoc annotations in the API route files and a central OpenAPI specification file.

## Accessing the API Documentation

Once the application is running, you can access the interactive API documentation by navigating to:

```
/api-docs
```

This page presents a Swagger UI interface where you can:
- Browse available API endpoints organized by tags (Courses, Chapters, Certificates, etc.)
- See required parameters, request bodies, and response schemas
- Test API calls directly from the documentation interface
- Understand authentication requirements

## How It Works

The API documentation consists of three main components:

1. **Base OpenAPI Specification** (`lib/openapi-spec.js`): Defines the overall structure, server information, schemas, and security requirements.
2. **JSDoc Annotations**: Each API route is documented with JSDoc comments that specify endpoints, methods, parameters, request/response formats, etc.
3. **Swagger UI Page** (`app/api-docs/page.tsx`): A client-side component that renders the Swagger UI interface using the generated specification.

### Implementation Details

#### 1. Dependencies

The implementation uses the following packages:
```bash
pnpm install swagger-jsdoc swagger-ui-react
```

#### 2. OpenAPI Specification

The base specification (`lib/openapi-spec.js`) defines:

- General API information (title, version, description)
- Server URLs
- Security schemes (Clerk authentication)
- Reusable schemas for common data types (Course, Chapter, Certificate, etc.)
- Pattern for scanning API route files

During the build process (or when running `generate-api-docs`), it:
- Scans API files for JSDoc annotations
- Combines them with the base specification
- Generates a `swagger.json` file in the `public` directory

#### 3. API Route Annotations

API routes are documented using JSDoc comments that follow the OpenAPI specification syntax. For example:

```typescript
/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the course
 *     responses:
 *       200:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 *     security:
 *       - clerkAuth: []
 */
export async function POST(req: Request) {
  // Implementation
}
```

#### 4. Documentation UI

The Swagger UI component (`app/api-docs/page.tsx`) renders the interactive documentation using the generated specification:

```typescript
// app/api-docs/page.tsx
'use client';

import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const ApiDocsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cert Centre LMS API Documentation</h1>
      <SwaggerUI url="/swagger.json" />
    </div>
  );
};

export default ApiDocsPage;
```

## Scripts and Commands

The following npm/pnpm scripts are available for working with API documentation:

```bash
# Generate API documentation
pnpm generate-api-docs

# Verify API documentation
pnpm verify-api-docs

# Generate documentation during build
pnpm build   # Includes generate-api-docs
```

The verification script (`scripts/verify-api-docs.js`) checks:
1. That the `swagger.json` exists
2. Contains valid OpenAPI specification
3. Lists all documented endpoints

## Adding Documentation to New API Routes

To document a new API route:

1. Add JSDoc annotations above each HTTP method handler (GET, POST, PATCH, DELETE)
2. Use the OpenAPI specification syntax in the comments
3. Reference common schemas where appropriate (`#/components/schemas/...`)
4. Include required parameters, request bodies, responses, and security requirements
5. Regenerate the documentation with `pnpm generate-api-docs`

Example annotation structure:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   [method]:
 *     summary: Brief summary
 *     tags: [Category]
 *     parameters:
 *       - name: paramName
 *         in: path/query
 *         required: true/false
 *         schema:
 *           type: string/number/etc
 *     requestBody: {}     // If needed
 *     responses: {}       // Status codes and formats
 *     security: []        // Auth requirements
 */
```

## Adding New Schemas

To add a new reusable schema:

1. Edit `lib/openapi-spec.js`
2. Add the schema to the `components.schemas` section
3. Use the schema in API annotations with `$ref: '#/components/schemas/YourSchema'`

## Currently Documented Endpoints

The API documentation includes the following endpoints:

- Courses API: Create, update, and delete courses
- Chapters API: Create and retrieve course chapters
- Certificates API: Verify certificate validity

## Considerations

- Keep JSDoc comments updated when API routes change
- Run `verify-api-docs` to ensure documentation is valid
- Add new schemas to the OpenAPI specification as needed
- The documentation is regenerated during each build 