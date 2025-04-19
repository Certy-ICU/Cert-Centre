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