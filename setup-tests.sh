#!/bin/bash

# Script to set up Jest and React Testing Library in a Next.js project

echo "Setting up Jest and React Testing Library for your Next.js project..."

# Install dependencies
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest

# Create jest.config.js if it doesn't exist
if [ ! -f jest.config.js ]; then
  echo "Creating jest.config.js..."
  cat > jest.config.js << 'EOL'
const nextJest = require('next/jest');

// Providing the path to your Next.js app to load next.config.js and .env files
const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
EOL
fi

# Create jest.setup.ts if it doesn't exist
if [ ! -f jest.setup.ts ]; then
  echo "Creating jest.setup.ts..."
  cat > jest.setup.ts << 'EOL'
// jest.setup.ts
import '@testing-library/jest-dom/extend-expect';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ 
    push: jest.fn(), 
    replace: jest.fn(), 
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn() 
  }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => '/'
}));
EOL
fi

# Create __tests__ directory if it doesn't exist
if [ ! -d __tests__ ]; then
  echo "Creating __tests__ directory..."
  mkdir -p __tests__
fi

# Add test scripts to package.json if they don't exist
if ! grep -q "\"test\":" package.json; then
  echo "Adding test scripts to package.json..."
  sed -i.bak 's/"scripts": {/"scripts": {\n    "test": "jest",\n    "test:watch": "jest --watch",/g' package.json
  rm package.json.bak
fi

# Update tsconfig.json to include Jest types
if [ -f tsconfig.json ]; then
  echo "Updating tsconfig.json to include Jest types..."
  
  # Check if types array exists
  if grep -q "\"types\":" tsconfig.json; then
    # Add Jest to existing types array if not already there
    if ! grep -q "\"types\": \[[^\]]*\"jest\"" tsconfig.json; then
      sed -i.bak 's/"types": \[/"types": \["jest", /g' tsconfig.json
      rm tsconfig.json.bak
    fi
  else
    # Add types array with Jest if it doesn't exist
    sed -i.bak 's/"compilerOptions": {/"compilerOptions": {\n    "types": ["jest", "node"],/g' tsconfig.json
    rm tsconfig.json.bak
  fi
  
  # Add jest.setup.ts to include if not already there
  if ! grep -q "jest.setup.ts" tsconfig.json; then
    sed -i.bak 's/"include": \[/"include": \[\n    "jest.setup.ts",/g' tsconfig.json
    rm tsconfig.json.bak
  fi
fi

echo "Setup complete! You can now run 'npm test' to run your tests."
echo "Check the TESTING.md file for more details on writing tests." 