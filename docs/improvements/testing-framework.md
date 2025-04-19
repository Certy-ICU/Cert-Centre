# Implementing a Testing Framework (Jest & React Testing Library)

This guide outlines how to set up Jest and React Testing Library (RTL) for unit and integration testing in your Next.js application.

## 1. Install Dependencies

Install Jest, RTL, and necessary helper libraries:

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest
# Or using yarn
# yarn add --dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest
```

## 2. Configure Jest

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
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // <-- Setup file
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured by next/jest)
    // Example: '@/components/(.*)': '<rootDir>/components/$1' 
    // next/jest handles this automatically based on tsconfig.json
  },
  // Ignore node_modules, except for specific modules if needed
  transformIgnorePatterns: [
    '/node_modules/',
    // Add exceptions here if needed, e.g. for ESM modules
    // '[/\\]node_modules[/\\].+\\.(js|jsx|mjs|cjs|ts|tsx)$' 
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

Create a Jest setup file (`jest.setup.ts` or `.js`) referenced in `jest.config.js`:

```typescript
// jest.setup.ts
// Optional: configure or set up a testing framework before each test
// Used for importing jest-dom matchers
import '@testing-library/jest-dom/extend-expect';

// Mock environment variables if needed (e.g., for client-side Pusher)
// process.env.NEXT_PUBLIC_PUSHER_KEY = 'test-key';
// process.env.NEXT_PUBLIC_PUSHER_CLUSTER = 'test-cluster';

// Mock Next.js router if needed (though RTL generally encourages not mocking deeply)
// jest.mock('next/navigation', () => ({
//   useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
//   useSearchParams: () => ({ get: jest.fn() }),
//   usePathname: () => '/'
// }));

// Mock Clerk if needed (especially for components relying on auth state)
// jest.mock('@clerk/nextjs', () => ({
//   ClerkProvider: ({ children }) => <div>{children}</div>,
//   SignedIn: ({ children }) => <div>{children}</div>, // Mock as always signed in
//   SignedOut: () => null, // Mock as never signed out
//   UserButton: () => <button>User Button</button>,
//   auth: () => ({ userId: 'test-user-id', sessionId: 'test-session-id', getToken: jest.fn() }),
//   currentUser: () => ({ id: 'test-user-id', firstName: 'Test', lastName: 'User' /* ... other fields */ }),
// }));
```

## 3. Configure `tsconfig.json` (If using TypeScript)

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

## 4. Add Test Script

Add a test script to your `package.json`:

```json
// package.json
{
  // ... other scripts
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "test": "jest", // Add this
    "test:watch": "jest --watch" // Add this for watch mode
  },
  // ... dependencies
}
```

## 5. Write Tests

Create test files alongside your components or in a dedicated `__tests__` directory (e.g., `components/ui/button.test.tsx` or `__tests__/button.test.tsx`).

**Example: Testing a simple Button component (`components/ui/button.tsx`)**

```typescript
// components/ui/button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './button'; // Adjust import path

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    // screen.debug(); // Helper to see the rendered DOM in console
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn(); // Create a mock function
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(buttonElement);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies correct variant class', () => {
    render(<Button variant="destructive">Delete</Button>);
    const buttonElement = screen.getByRole('button', { name: /delete/i });
    // Check for a class specific to the destructive variant
    expect(buttonElement).toHaveClass('bg-destructive'); 
  });

  test('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /disabled button/i });
    expect(buttonElement).toBeDisabled();
  });
});
```

**Example: Testing a component using hooks (e.g., `ThemeToggle`)**

```typescript
// components/theme-toggle.test.tsx 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeToggle } from './theme-toggle'; // Adjust import
import { ThemeProvider } from './providers/theme-provider'; // Adjust import

// Mock the useTheme hook from next-themes
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: () => ({ 
    setTheme: mockSetTheme, 
    theme: 'light', // Mock initial theme
    themes: ['light', 'dark', 'system'] 
  }),
}));

// Helper to render with ThemeProvider
const renderWithThemeProvider = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {ui}
    </ThemeProvider>
  );
};

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockSetTheme.mockClear();
  });

  test('renders the toggle button', () => {
    renderWithThemeProvider(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    // Check for initial icons (Sun visible, Moon hidden)
    expect(screen.getByRole('img', { name: /sun/i })).toBeVisible(); // Assuming lucide icons have role=img and accessible names
    // Note: Testing visibility of the Moon icon might require checking styles/classes applied by dark mode
  });

  test('opens dropdown menu on click', () => {
    renderWithThemeProvider(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(button);

    // Check if menu items appear
    expect(screen.getByRole('menuitem', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /system/i })).toBeInTheDocument();
  });

  test('calls setTheme with \'dark\' when Dark menu item is clicked', () => {
    renderWithThemeProvider(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /dark/i }));
    
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    expect(mockSetTheme).toHaveBeenCalledTimes(1);
  });

  // Add similar tests for Light and System options
});
```

## 6. Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

## Considerations

- **Mocking**: Mock external dependencies (APIs, libraries like Clerk, Pusher, database) to isolate the component under test. Use Jest's mocking capabilities (`jest.fn()`, `jest.mock()`).
- **Integration vs. Unit**: Write unit tests for individual components and utility functions. Write integration tests for components that interact with each other or involve data fetching/state management.
- **Data Fetching**: For components fetching data, you might mock the fetch call (`global.fetch`) or the specific data fetching hook/function used.
- **Coverage**: Configure Jest to report test coverage to identify untested code paths. 