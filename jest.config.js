// jest.config.js
const nextJest = require('next/jest');

// Providing the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Setup file
  moduleNameMapper: {
    // Handle module aliases (automatically configured by next/jest based on tsconfig.json)
  },
  // Ignore node_modules, except for specific modules if needed
  transformIgnorePatterns: [
    '/node_modules/',
    // Add exceptions here if needed, e.g. for ESM modules
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig); 