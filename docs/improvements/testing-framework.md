# Implementing a Testing Framework (Jest & React Testing Library)

This guide outlines how to set up Jest and React Testing Library (RTL) for unit and integration testing in your Next.js application. The implementation includes both manual setup steps and an automated script.

## Quick Setup (Automated)

For quick setup, you can use the provided script:

```bash
# Make the script executable
chmod +x setup-tests.sh

# Run the script
./setup-tests.sh
```

The script will:
1. Install all necessary dependencies
2. Create configuration files (jest.config.js, jest.setup.ts)
3. Update tsconfig.json with Jest types
4. Add test scripts to package.json
5. Create a tests directory

## Manual Setup Steps

### 1. Install Dependencies

Install Jest, RTL, and necessary helper libraries:

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest
# Or using yarn
# yarn add --dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest
```

### 2. Configure Jest

Create a `jest.config.js` file in your project root:

```javascript
// jest.config.js
const nextJest = require('next/jest');

// Providing the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
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
```

Create a Jest setup file (`jest.setup.ts`) referenced in `jest.config.js`:

```typescript
// jest.setup.ts
// Configure or set up testing framework before each test
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

// Add any global mocks, setup, or tear-down needed for your tests here
```

### 3. Configure `tsconfig.json` (If using TypeScript)

Ensure your `tsconfig.json` includes Jest types:

```json
// tsconfig.json
{
  "compilerOptions": {
    // ... other options
    "types": ["jest", "node"], // Add "jest"
    "esModuleInterop": true // Recommended for Jest compatibility
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "jest.setup.ts" // Include setup file
  ],
  "exclude": ["node_modules"]
}
```

### 4. Add Test Scripts

Add test scripts to your `package.json`:

```json
// package.json
{
  // ... other scripts
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest", // Add this
    "test:watch": "jest --watch" // Add this for watch mode
  },
  // ... dependencies
}
```

## Writing Tests

Tests in this project are organized in the `__tests__` directory. You can also co-locate tests with components using a `.test.tsx` or `.spec.tsx` extension.

### Unit Test Example: Button Component

Here's an example of a unit test for the Button component:

```typescript
// __tests__/button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(buttonElement);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies correct variant class', () => {
    render(<Button variant="destructive">Delete</Button>);
    const buttonElement = screen.getByRole('button', { name: /delete/i });
    // Check for classes that should be applied based on the variant
    expect(buttonElement.className).toContain('bg-destructive');
  });

  test('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /disabled button/i });
    expect(buttonElement).toBeDisabled();
  });

  test('renders with different sizes', () => {
    render(<Button size="sm">Small Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /small button/i });
    expect(buttonElement.className).toContain('h-9');
  });

  test('renders as child when asChild is true', () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    );
    
    const linkElement = screen.getByRole('link', { name: /link button/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement.tagName).toBe('A');
    expect(linkElement).toHaveAttribute('href', 'https://example.com');
  });
});
```

### Integration Test Example: SearchInput Component

For components that use hooks or require context, we need integration tests with proper mocking:

```typescript
// __tests__/search-input.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchInput } from '@/components/search-input';

// Mock the debounce hook
jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value, // No debounce in tests
}));

// Mock the router and navigation hooks
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockImplementation((param) => {
      if (param === 'categoryId') return 'test-category';
      return null;
    }),
  }),
  usePathname: () => '/courses',
}));

describe('SearchInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search input with placeholder', () => {
    render(<SearchInput />);
    
    const inputElement = screen.getByPlaceholderText(/search for a course/i);
    expect(inputElement).toBeInTheDocument();
    
    // Check if search icon is rendered
    const searchIcon = document.querySelector('.lucide-search');
    expect(searchIcon).toBeInTheDocument();
  });

  test('updates URL with search query when typing', async () => {
    render(<SearchInput />);
    
    const inputElement = screen.getByPlaceholderText(/search for a course/i);
    fireEvent.change(inputElement, { target: { value: 'react' } });
    
    // Since we disabled debounce, the router.push should be called immediately
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/courses?categoryId=test-category&title=react');
    });
  });
});
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm test -- --coverage
```

## Best Practices

1. **Test behavior, not implementation details**:
   - Focus on testing what the user sees and experiences.
   - Avoid testing component state directly unless necessary.

2. **Use semantic queries**:
   - Prefer queries like `getByRole`, `getByLabelText`, and `getByText` over `getByTestId`.
   - This ensures your components are accessible.

3. **Cleanup after tests**:
   - React Testing Library automatically cleans up after each test, so you typically don't need to call `cleanup()`.

4. **Isolate tests**:
   - Each test should be independent and not rely on the state from other tests.
   - Use `beforeEach` to reset mocks.

5. **Mock external dependencies**:
   - Mock API calls, Router, Auth, etc., to isolate the component being tested.

## Troubleshooting

### Type Definition Errors

If you encounter type definition errors for Jest:

```
Cannot find type definition file for 'jest'.
```

Make sure:
1. You've installed `@types/jest`
2. The version is compatible with your Jest version
3. Your tsconfig.json correctly includes the types

## Documentation

For more detailed testing patterns and guidelines, refer to the project's `TESTING.md` file, which includes:

- Detailed examples for different test scenarios
- Common testing patterns
- Guidelines for mocking dependencies
- Testing context providers and hooks

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro)
- [Common Testing-Library Queries](https://testing-library.com/docs/queries/about) 