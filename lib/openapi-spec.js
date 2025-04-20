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
    ],
    components: {
      securitySchemes: {
        clerkAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Authentication using Clerk'
        },
      },
      schemas: {
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
            imageUrl: { type: 'string', format: 'uri' },
            price: { type: 'number', format: 'float' },
            isPublished: { type: 'boolean' },
            userId: { type: 'string' },
            categoryId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Chapter: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            videoUrl: { type: 'string', format: 'uri' },
            position: { type: 'integer' },
            isPublished: { type: 'boolean' },
            isFree: { type: 'boolean' },
            courseId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Certificate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            courseId: { type: 'string' },
            completedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        clerkAuth: [],
      },
    ],
  },
  apis: ['./app/api/**/*.ts', './app/api/**/*.js'],
};

const openapiSpecification = swaggerJsdoc(options);

module.exports = openapiSpecification;

// Generate a static JSON file
const fs = require('fs');
// Make sure the directory exists
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}
// Write the spec to the file
fs.writeFileSync('./public/swagger.json', JSON.stringify(openapiSpecification, null, 2)); 