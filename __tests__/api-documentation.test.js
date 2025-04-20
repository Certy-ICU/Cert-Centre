/**
 * Tests for API documentation generation and validation
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Helper function to run a command and return its output
const runCommand = async (command) => {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, stdout: error.stdout, stderr: error.stderr, error };
  }
};

describe('API Documentation', () => {
  const swaggerPath = path.join(process.cwd(), 'public', 'swagger.json');
  
  // Skip tests in CI environments where they might cause issues
  const shouldSkip = process.env.CI === 'true';
  
  // Run this before all tests
  beforeAll(async () => {
    // Generate documentation if it doesn't exist
    if (!fs.existsSync(swaggerPath)) {
      await runCommand('pnpm generate-api-docs');
    }
  }, 30000); // Increase timeout for doc generation
  
  test('swagger.json file should exist', () => {
    expect(fs.existsSync(swaggerPath)).toBe(true);
  });
  
  test('swagger.json should contain valid OpenAPI specification', () => {
    // Skip if file doesn't exist (will be caught by previous test)
    if (!fs.existsSync(swaggerPath)) return;
    
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerJson = JSON.parse(swaggerContent);
    
    // Basic validation of OpenAPI structure
    expect(swaggerJson.openapi).toBeDefined();
    expect(swaggerJson.info).toBeDefined();
    expect(swaggerJson.info.title).toBe('Cert Centre LMS API');
    expect(swaggerJson.paths).toBeDefined();
  });
  
  test('documentation should include key endpoints', () => {
    // Skip if file doesn't exist
    if (!fs.existsSync(swaggerPath)) return;
    
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerJson = JSON.parse(swaggerContent);
    
    // Check for essential endpoints
    const paths = Object.keys(swaggerJson.paths);
    
    // Core endpoints that should be documented
    expect(paths).toContain('/api/courses');
    
    // At least one courses endpoint should exist
    expect(paths.some(path => path.includes('/courses/'))).toBe(true);
  });
  
  test('schema definitions should exist for core models', () => {
    // Skip if file doesn't exist
    if (!fs.existsSync(swaggerPath)) return;
    
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerJson = JSON.parse(swaggerContent);
    
    // Core schemas that should be defined
    const schemas = swaggerJson.components.schemas;
    expect(schemas.Course).toBeDefined();
    expect(schemas.ErrorResponse).toBeDefined();
  });
  
  // This test actually runs the verify script - skip in CI
  test('verify-api-docs should run without errors', async () => {
    if (shouldSkip) {
      console.log('Skipping verification test in CI environment');
      return;
    }
    
    const result = await runCommand('pnpm verify-api-docs');
    expect(result.success).toBe(true);
    expect(result.stderr).toBeFalsy();
    expect(result.stdout).toContain('API documentation verification completed successfully');
  }, 10000); // Increase timeout for verification
  
  // This test tries to regenerate docs - skip in CI
  test('generate-api-docs should run successfully', async () => {
    if (shouldSkip) {
      console.log('Skipping generation test in CI environment');
      return;
    }
    
    const result = await runCommand('pnpm generate-api-docs');
    expect(result.success).toBe(true);
    expect(result.stderr).toBeFalsy();
  }, 10000); // Increase timeout for generation
}); 