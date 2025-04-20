# Testing Guide for Cert-Centre

This project uses Jest and React Testing Library (RTL) for unit and integration testing.

## Getting Started

1. **Run the tests**:

```bash
# Run all tests
npm test

# Run tests in watch mode (automatic re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm test -- --coverage
```

2. **Test file location**:
   - Tests should be placed in the `__tests__` directory or co-located with your components using a `.test.tsx` or `.spec.tsx` extension.

## Writing Tests

### Basic Component Test

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  test('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('handles click events', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByRole('button', { name: /click me/i }));
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Asynchronous Code

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { SearchInput } from '@/components/search-input';

test('async test example', async () => {
  render(<SearchInput />);
  
  // Wait for an element to appear or a condition to be true
  await waitFor(() => {
    expect(screen.getByText('Results')).toBeInTheDocument();
  });
});
```

### Mocking Dependencies

```tsx
// Mock a hook
jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value) => value,
}));

// Mock Next.js routing
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    // Other router methods
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));
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

## Common Testing Patterns

### Testing Form Submissions

```tsx
test('form submission', async () => {
  const handleSubmit = jest.fn();
  render(<MyForm onSubmit={handleSubmit} />);
  
  fireEvent.change(screen.getByLabelText(/username/i), { 
    target: { value: 'testuser' } 
  });
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(handleSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ username: 'testuser' })
  );
});
```

### Testing Context Providers

```tsx
// Create a wrapper with the necessary providers
const AllTheProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (ui, options) => 
  render(ui, { wrapper: AllTheProviders, ...options });

// Use like this:
test('component with context', () => {
  customRender(<MyComponent />);
  // assertions...
});
```

## Testing API Documentation

The API documentation can be tested using the following approaches:

1. **Verify API Documentation Generation**:

```bash
# Generate API documentation
pnpm generate-api-docs

# Verify documentation is valid
pnpm verify-api-docs
```

2. **Manually Test Swagger UI**:
   - Start the development server: `pnpm dev`
   - Navigate to `/api-docs` in your browser
   - Verify all expected endpoints are documented
   - Test the "Try it out" functionality for key endpoints

3. **Check Documentation Coverage**:
   - The `verify-api-docs` script will list all documented endpoints
   - Compare against your API routes to ensure full coverage

4. **Testing JSDoc Annotations**:
   
   When adding or modifying API routes, ensure your JSDoc annotations are correct:
   - Paths match the actual API routes
   - Required parameters are properly documented
   - Response schemas accurately reflect what the API returns
   - Security requirements are correctly specified

5. **Automated Testing**:

```javascript
// Example test for API documentation
describe('API Documentation', () => {
  test('swagger.json is generated and valid', async () => {
    // This could be run as part of your CI pipeline
    const { execSync } = require('child_process');
    
    // Generate the docs
    execSync('pnpm generate-api-docs');
    
    // Read the generated file
    const fs = require('fs');
    const path = require('path');
    const swaggerPath = path.join(process.cwd(), 'public', 'swagger.json');
    
    expect(fs.existsSync(swaggerPath)).toBe(true);
    
    // Parse and validate content
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerJson = JSON.parse(swaggerContent);
    
    expect(swaggerJson.openapi).toBeDefined();
    expect(swaggerJson.paths).toBeDefined();
    expect(Object.keys(swaggerJson.paths).length).toBeGreaterThan(0);
  });
});
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro)
- [Common Testing-Library Queries](https://testing-library.com/docs/queries/about) 