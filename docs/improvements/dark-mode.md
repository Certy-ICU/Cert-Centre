# Dark Mode Implementation Documentation

## Table of Contents
- [Overview](#overview)
- [Benefits](#benefits)
- [Prerequisites](#prerequisites)
- [Implementation Steps](#implementation-steps)
  - [1. Install Dependencies](#1-install-dependencies)
  - [2. Configure Tailwind CSS](#2-configure-tailwind-css)
  - [3. Create a Theme Provider](#3-create-a-theme-provider)
  - [4. Apply the Theme Provider](#4-apply-the-theme-provider)
  - [5. Apply Dark Mode Styles](#5-apply-dark-mode-styles)
  - [6. Create a Theme Toggle Button](#6-create-a-theme-toggle-button)
  - [7. Integrate Theme Toggle](#7-integrate-theme-toggle)
- [Component-Specific Adaptations](#component-specific-adaptations)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Further Improvements](#further-improvements)

## Overview

This documentation explains how to implement dark mode in the Cert Centre application using Tailwind CSS and the `next-themes` library. The implementation follows best practices for Next.js applications and provides a seamless user experience with smooth transitions between themes.

Dark mode is implemented using the "class strategy" in Tailwind CSS, which applies different styles based on the presence of a `dark` class on the HTML element. The `next-themes` library handles the theme switching, persistence, and system preference detection.

## Benefits

Implementing dark mode provides several advantages:

1. **Improved User Experience**: Users can choose their preferred theme based on environmental conditions or personal preference.
2. **Reduced Eye Strain**: Dark mode can reduce eye strain in low-light environments.
3. **Battery Savings**: Dark mode can save battery life on devices with OLED or AMOLED screens.
4. **Accessibility**: Provides alternative viewing options for users with light sensitivity.
5. **Modern Aesthetics**: Gives the application a modern, professional appearance.

## Prerequisites

- Next.js 13+ application using the App Router
- Tailwind CSS configured
- Node.js 16.8.0+
- pnpm, npm, or yarn package manager

## Implementation Steps

### 1. Install Dependencies

Install the `next-themes` package to handle theme switching:

```bash
pnpm install next-themes
```

### 2. Configure Tailwind CSS

Enable dark mode support in your `tailwind.config.js` file using the `class` strategy:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Enable class-based dark mode
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    // ... your existing theme config
  },
  plugins: [
    require("tailwindcss-animate")
    // ... other plugins
  ],
}
```

### 3. Create a Theme Provider

Create a context provider component that wraps the `ThemeProvider` from `next-themes`:

```typescript
// components/providers/theme-provider.tsx
"use client"
 
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
 
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### 4. Apply the Theme Provider

Wrap your root layout (`app/layout.tsx`) with the `ThemeProvider`:

```typescript
// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/providers/toaster-provider'
import { ConfettiProvider } from '@/components/providers/confetti-provider'
import { ThemeProvider } from "@/components/providers/theme-provider"

// ... (rest of imports and config)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning> {/* Add suppressHydrationWarning */} 
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConfettiProvider />
            <ToastProvider />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

**Important Note**: The `suppressHydrationWarning` attribute is necessary because `next-themes` updates the `class` attribute on the `html` element during client-side hydration, which can cause React hydration warnings. This attribute suppresses those warnings without affecting functionality.

### 5. Apply Dark Mode Styles

Use the `dark:` prefix in Tailwind CSS classes to apply styles specifically for dark mode:

#### Common Dark Mode Patterns

| Element Type | Light Mode | Dark Mode | Combined Class |
|--------------|------------|-----------|----------------|
| Backgrounds  | bg-white   | bg-slate-950 | `bg-white dark:bg-slate-950` |
| Text         | text-slate-900 | text-slate-100 | `text-slate-900 dark:text-slate-100` |
| Muted Text   | text-slate-500 | text-slate-400 | `text-slate-500 dark:text-slate-400` |
| Borders      | border-slate-200 | border-slate-700 | `border-slate-200 dark:border-slate-700` |
| Inputs       | bg-white | bg-slate-900 | `bg-white dark:bg-slate-900` |
| Cards        | bg-white | bg-slate-800 | `bg-white dark:bg-slate-800` |
| Hover States | hover:bg-slate-100 | hover:bg-slate-800 | `hover:bg-slate-100 dark:hover:bg-slate-800` |

#### Example Component with Dark Mode Support

```jsx
// Example component
function ExampleCard() {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Component Title
      </h2>
      <p className="text-slate-600 dark:text-slate-400">
        Some content here.
      </p>
      <button className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded">
        Action Button
      </button>
    </div>
  );
}
```

### 6. Create a Theme Toggle Button

Create a component that allows users to switch between light, dark, and system themes using the `useTheme` hook from `next-themes`:

```typescript
// components/theme-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 7. Integrate Theme Toggle

Add the `ThemeToggle` component to your application's layout, typically in the header or navigation bar. For example, in `components/navbar-routes.tsx`:

```typescript
// Simplified example for components/navbar-routes.tsx
import { ThemeToggle } from "@/components/theme-toggle";

export const NavbarRoutes = () => {
  return (
    <div className="flex items-center gap-x-2">
      {/* Other navbar items */}
      <ThemeToggle />
      <UserButton afterSignOutUrl="/" />
    </div>
  );
};
```

## Component-Specific Adaptations

When adapting components for dark mode, follow these guidelines for consistency:

### Dashboard Components

- Navbars: `bg-white dark:bg-slate-950`
- Sidebars: `bg-white dark:bg-slate-950`
- Content areas: `bg-white dark:bg-slate-950`
- Cards: `bg-white dark:bg-slate-800`

### Buttons and Interactive Elements

- Primary buttons: Keep the primary color, but adjust for dark mode visibility
- Outline buttons: `border-slate-200 dark:border-slate-700`
- Icons: Adjust opacity or color for dark mode

### Data Display Elements

- Table headers: `bg-slate-50 dark:bg-slate-800`
- Table rows: `hover:bg-slate-100 dark:hover:bg-slate-700`
- Badges: Use appropriate background colors that work in both modes

## Testing

Thoroughly test the dark mode implementation:

1. **Theme Switching**: Verify seamless transitions between light, dark, and system themes.
2. **Component Adaptation**: Check that all components adapt correctly to theme changes.
3. **Contrast Ratios**: Ensure text remains readable in both themes (WCAG AA compliance).
4. **System Preference**: Test that the "system" theme correctly responds to OS preferences.
5. **Theme Persistence**: Verify theme selection persists across page refreshes and sessions.
6. **Mobile Responsiveness**: Test dark mode on various device sizes.

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Theme not switching | Client-side rendering issues | Ensure components using `useTheme` are client components with `"use client"` directive |
| Hydration errors | Server/client mismatch | Check that `suppressHydrationWarning` is added to the HTML tag |
| Flash of incorrect theme | Initial render before client hydration | Use `defaultTheme="system"` and ensure CSS loads quickly |
| Components not adapting | Missing dark mode classes | Add appropriate `dark:` prefixed classes to components |
| Theme not persisting | Storage issues | Check browser's local storage permissions |
| Inconsistent colors | Undefined dark mode variants | Define consistent colors for both light and dark modes in your design system |

## Further Improvements

Consider these enhancements to the dark mode implementation:

1. **Animated Transitions**: Add smoother transitions between themes.
2. **Color Palette Refinement**: Fine-tune the dark mode color palette for better aesthetics.
3. **User Preference API**: Store user theme preferences in your database for cross-device consistency.
4. **Time-Based Switching**: Automatically switch themes based on time of day.
5. **Custom Themes**: Expand beyond light/dark to offer additional theme options.
6. **Accessibility Improvements**: Enhance contrast and readability in both themes.

---

**Last Updated**: October 2023 