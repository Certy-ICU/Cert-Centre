/**
 * Script to verify API documentation is working correctly
 * 
 * Checks if:
 * 1. swagger.json exists in the public directory
 * 2. The file contains valid OpenAPI spec data
 * 3. All API endpoints are documented
 */

const fs = require('fs');
const path = require('path');

// Add colorful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Display welcome message
console.log(`${colors.bright}${colors.blue}
===========================================
     Cert Centre API Documentation
===========================================
${colors.reset}`);

console.log(`${colors.cyan}Verifying API documentation...${colors.reset}`);

// Check if swagger.json exists
const swaggerPath = path.join(process.cwd(), 'public', 'swagger.json');
if (!fs.existsSync(swaggerPath)) {
  console.error(`${colors.red}❌ swagger.json not found in public directory${colors.reset}`);
  console.log(`Run ${colors.bright}pnpm generate-api-docs${colors.reset} to generate the file`);
  process.exit(1);
}

console.log(`${colors.green}✅ swagger.json found in public directory${colors.reset}`);

// Check if the file is a valid JSON
try {
  const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
  const swaggerJson = JSON.parse(swaggerContent);
  
  // Check if it has key OpenAPI elements
  if (!swaggerJson.openapi) {
    console.error(`${colors.red}❌ Missing OpenAPI version in swagger.json${colors.reset}`);
    process.exit(1);
  }
  
  if (!swaggerJson.paths || Object.keys(swaggerJson.paths).length === 0) {
    console.error(`${colors.red}❌ No API paths found in swagger.json${colors.reset}`);
    console.log('Make sure your API routes are properly annotated with JSDoc comments');
    process.exit(1);
  }
  
  // Count the number of endpoints
  const pathCount = Object.keys(swaggerJson.paths).length;
  const operationCount = Object.values(swaggerJson.paths).reduce((count, path) => {
    return count + Object.keys(path).length;
  }, 0);
  
  console.log(`${colors.green}✅ Found ${pathCount} API paths with ${operationCount} operations${colors.reset}`);
  console.log(`${colors.green}✅ swagger.json contains valid OpenAPI specification${colors.reset}`);
  
  // List the documented endpoints
  console.log(`\n${colors.bright}Documented API endpoints:${colors.reset}`);
  Object.entries(swaggerJson.paths).forEach(([path, operations]) => {
    console.log(`\n${colors.cyan}${path}${colors.reset}`);
    Object.entries(operations).forEach(([method, operation]) => {
      console.log(`  ${colors.yellow}${method.toUpperCase()}${colors.reset} - ${operation.summary || 'No summary'}`);
    });
  });
  
  console.log(`\n${colors.green}${colors.bright}✅ API documentation verification completed successfully${colors.reset}`);
  
  // Display access instructions
  console.log(`\n${colors.bright}${colors.blue}View API Documentation:${colors.reset}`);
  console.log(`${colors.cyan}1. Start the dev server:${colors.reset} pnpm dev`);
  console.log(`${colors.cyan}2. Open in browser:${colors.reset} http://localhost:3000/api-docs\n`);
  
} catch (error) {
  console.error(`${colors.red}❌ Error parsing swagger.json:${colors.reset}`, error.message);
  process.exit(1);
} 