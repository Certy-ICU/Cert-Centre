# API Documentation Developer Guide

This guide provides detailed instructions for developers on how to add, update, and maintain API documentation in the Cert Centre LMS project.

## Overview

Cert Centre uses Swagger/OpenAPI for API documentation, implemented with:

- `swagger-jsdoc` - Extracts JSDoc annotations from API routes
- `swagger-ui-react` - Renders interactive documentation UI
- Custom scripts for generating and verifying documentation

## Adding Documentation to a New API Endpoint

### 1. Write JSDoc Annotations

Add OpenAPI-compatible JSDoc comments above each HTTP method handler in your API route file:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Short summary of what the endpoint does
 *     description: More detailed explanation if needed
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: paramName
 *         required: true
 *         schema:
 *           type: string
 *         description: Description of the parameter
 *     responses:
 *       200:
 *         description: Success response description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourResponseSchema'
 *       400:
 *         description: Bad request response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - clerkAuth: []
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Your implementation here
}
```

### 2. HTTP Methods

Document each HTTP method separately:

- `GET` - For retrieving resources
- `POST` - For creating resources
- `PATCH` - For partial updates
- `PUT` - For full updates
- `DELETE` - For removing resources

### 3. Request Body Documentation

For endpoints that accept request bodies (POST, PATCH, PUT):

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     // ... other properties
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fieldName
 *             properties:
 *               fieldName:
 *                 type: string
 *                 description: Description of the field
 *               optionalField:
 *                 type: number
 *                 description: Description of optional field
 */
```

### 4. Common Data Types

Use these OpenAPI data types:

- `string` - Text values
- `number` - Numeric values
- `integer` - Whole numbers
- `boolean` - True/false values
- `array` - Lists of items
- `object` - Composite structures

For strings with specific formats:

- `format: 'date-time'` - ISO 8601 date-time
- `format: 'uuid'` - UUID string
- `format: 'uri'` - URI/URL string
- `format: 'email'` - Email address

### 5. Common Response Patterns

Use consistent responses:

```typescript
/**
 * responses:
 *   200:
 *     description: Success
 *     content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/SuccessSchema'
 *   400:
 *     description: Bad request - validation error
 *     content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/ErrorResponse'
 *   401:
 *     description: Unauthorized - authentication required
 *   403:
 *     description: Forbidden - insufficient permissions
 *   404:
 *     description: Not found - resource doesn't exist
 *   500:
 *     description: Internal server error
 */
```

## Adding New Schemas

For reusable data structures, add schemas to `lib/openapi-spec.js`:

1. Open `lib/openapi-spec.js`
2. Locate the `components.schemas` section
3. Add your new schema:

```javascript
// In lib/openapi-spec.js
components: {
  schemas: {
    // ...existing schemas
    
    YourNewSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        status: { 
          type: 'string',
          enum: ['active', 'pending', 'cancelled']
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              quantity: { type: 'integer', minimum: 1 }
            }
          }
        }
      }
    }
  }
}
```

Then reference this schema in your route JSDoc:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     // ... other properties
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourNewSchema'
 */
```

## Tags and Grouping

Use tags to group related endpoints:

```typescript
/**
 * @swagger
 * /api/courses:
 *   get:
 *     tags: [Courses]
 *     // ...
 */
```

Common tags in Cert Centre:

- `Courses` - Course management
- `Chapters` - Chapter management
- `Certificates` - Certificate operations
- `Users` - User management
- `Authentication` - Auth-related endpoints

## Authentication Documentation

Most endpoints require authentication. Document it with:

```typescript
/**
 * @swagger
 * /api/protected-endpoint:
 *   get:
 *     // ... other properties
 *     security:
 *       - clerkAuth: []
 */
```

## Generating Documentation

After adding or updating annotations:

```bash
pnpm generate-api-docs
```

This will:
1. Scan all API routes in `app/api/**/*.ts` for JSDoc annotations
2. Combine them with the base specification in `lib/openapi-spec.js`
3. Generate `public/swagger.json`

## Verifying Documentation

To check that your documentation is valid:

```bash
pnpm verify-api-docs
```

This will:
1. Verify that `swagger.json` exists
2. Check that it contains valid OpenAPI specification
3. List all documented endpoints
4. Report any issues

## Best Practices

1. **Be Thorough**: Document all parameters, request bodies, and responses
2. **Be Consistent**: Use the same patterns across all endpoints
3. **Reference Schemas**: Use `$ref` to avoid duplication
4. **Keep Updated**: Update docs when API changes
5. **Include Examples**: Add examples for complex structures
6. **Document Errors**: Be explicit about possible error responses
7. **Group Related Endpoints**: Use consistent tags

## Advanced Features

### Enumerations

For properties with fixed values:

```typescript
/**
 * properties:
 *   status:
 *     type: string
 *     enum: ['active', 'pending', 'archived']
 *     description: Current status of the item
 */
```

### Array Responses

For endpoints that return arrays:

```typescript
/**
 * responses:
 *   200:
 *     description: List of items
 *     content:
 *       application/json:
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemSchema'
 */
```

### Query Parameters

For endpoints with query params:

```typescript
/**
 * parameters:
 *   - in: query
 *     name: page
 *     schema:
 *       type: integer
 *       default: 1
 *       minimum: 1
 *     description: Page number for pagination
 *   - in: query
 *     name: limit
 *     schema:
 *       type: integer
 *       default: 10
 *       minimum: 1
 *       maximum: 100
 *     description: Number of items per page
 */
```

## Troubleshooting

### Documentation Not Updating

1. Make sure you've run `pnpm generate-api-docs`
2. Check for syntax errors in your JSDoc comments
3. Verify the path pattern in `lib/openapi-spec.js` includes your file

### Missing Endpoints

1. Ensure the route file is located in `app/api/**/*.ts`
2. Check that JSDoc comments use the correct `@swagger` tag
3. Make sure the path matches your actual API endpoint

### Invalid Schema References

1. Check that referenced schemas exist in `lib/openapi-spec.js`
2. Verify the schema name in `$ref` matches exactly
3. Make sure the reference format is correct: `#/components/schemas/SchemaName`

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI React Documentation](https://github.com/swagger-api/swagger-ui/tree/master/flavors/swagger-ui-react) 