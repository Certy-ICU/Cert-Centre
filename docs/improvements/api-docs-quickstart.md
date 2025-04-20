# API Documentation Quickstart Guide

This guide provides a quick overview of how to use the API documentation in Cert Centre LMS.

## 📚 Accessing Documentation

1. Start the application:
   ```bash
   pnpm dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/api-docs
   ```

3. You'll see the Swagger UI interface with all documented API endpoints.

## 🔍 Using the Documentation

### Browsing Endpoints

Endpoints are organized by tags (Courses, Chapters, Certificates). Click on a section to expand it and see the available operations.

### Testing Endpoints

1. Click on an endpoint to expand it
2. Click the "Try it out" button
3. Fill in required parameters and request body (if applicable)
4. Click "Execute"
5. View the response below

### Authentication

Most endpoints require authentication through Clerk. For testing:

1. Make sure you're logged in to the application in another tab
2. The authentication will be handled automatically through cookies

## 🛠️ Maintaining Documentation

### Updating Documentation

If you make changes to the API:

1. Update the JSDoc annotations in your API route files
2. Run the documentation generator:
   ```bash
   pnpm generate-api-docs
   ```

3. Verify your changes:
   ```bash
   pnpm verify-api-docs
   ```

### Key Files

- `lib/openapi-spec.js` - Base OpenAPI specification and generator
- `app/api-docs/page.tsx` - Swagger UI component
- `scripts/verify-api-docs.js` - Documentation verification tool

## 📝 Documentation Examples

### Courses API

```
/api/courses
POST - Create a new course
```

```
/api/courses/{courseId}
PATCH - Update a course
DELETE - Delete a course and its associated resources
```

### Chapters API

```
/api/courses/{courseId}/chapters
GET - Get all published chapters for a course
POST - Create a new chapter for a course
```

### Certificates API

```
/api/certificates/verify
GET - Verify a certificate by ID
```

## 🔄 Troubleshooting

If you encounter issues:

1. Make sure you've regenerated the documentation after changes:
   ```bash
   pnpm generate-api-docs
   ```

2. Check that your JSDoc annotations follow the OpenAPI specification
3. Run the verification tool to identify issues:
   ```bash
   pnpm verify-api-docs
   ```

For more detailed information, refer to the [full API Documentation guide](./api-documentation.md). 