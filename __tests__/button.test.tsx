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