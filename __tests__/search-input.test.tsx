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

  test('preserves category ID in URL when searching', async () => {
    render(<SearchInput />);
    
    const inputElement = screen.getByPlaceholderText(/search for a course/i);
    fireEvent.change(inputElement, { target: { value: 'javascript' } });
    
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/courses?categoryId=test-category&title=javascript');
    });
  });

  test('clears search and updates URL when input is cleared', async () => {
    render(<SearchInput />);
    
    const inputElement = screen.getByPlaceholderText(/search for a course/i);
    
    // First set a value
    fireEvent.change(inputElement, { target: { value: 'python' } });
    
    // Then clear it
    fireEvent.change(inputElement, { target: { value: '' } });
    
    await waitFor(() => {
      // The last call should be with just the categoryId
      expect(pushMock).toHaveBeenLastCalledWith('/courses?categoryId=test-category');
    });
  });
}); 