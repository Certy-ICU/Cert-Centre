# Implementing Dark Mode

This guide explains how to add a dark mode theme option to the Next.js LMS application using Tailwind CSS and `next-themes`.

## 1. Install Dependencies

```bash
npm install next-themes
```

## 2. Configure Tailwind CSS

Enable dark mode support in your `tailwind.config.js` file using the `class` strategy.

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Add this line
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

## 3. Create a Theme Provider

Create a context provider component that wraps the `ThemeProvider` from `next-themes`.

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

## 4. Apply the Theme Provider

Wrap your root layout (`app/layout.tsx`) with the `ThemeProvider`.

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
*Note*: We add `suppressHydrationWarning` to the `<html>` tag because `next-themes` updates the `class` attribute on the `html` element, which can cause a mismatch during hydration.

## 5. Apply Dark Mode Styles

Use the `dark:` prefix in Tailwind CSS classes to apply styles specifically for dark mode.

- **Backgrounds**: `bg-white dark:bg-black`
- **Text**: `text-gray-900 dark:text-gray-100`
- **Borders**: `border-gray-200 dark:border-gray-700`
- **Component Variants**: Many Shadcn UI components have built-in dark mode support. Review their documentation and ensure they adapt correctly. You might need to adjust custom components or override styles.

```jsx
// Example component
function MyComponent() {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Component Title
      </h2>
      <p className="text-slate-600 dark:text-slate-400">
        Some content here.
      </p>
    </div>
  );
}
```

## 6. Create a Theme Toggle Button

Create a component that allows users to switch between light, dark, and system themes using the `useTheme` hook from `next-themes`.

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

## 7. Integrate Theme Toggle

Add the `ThemeToggle` component to your application's layout, typically in the header or navigation bar (e.g., in `components/navbar-routes.tsx`).

## 8. Test Thoroughly

- Switch between light and dark modes and verify all components, text, and backgrounds adapt correctly.
- Check color contrast in both modes.
- Test the "system" theme setting to ensure it respects the OS preference. 