# Implementing Internationalization (i18n)

This guide details the steps to add multi-language support to the Next.js LMS application using `next-intl`.

## 1. Install Dependencies

```bash
npm install next-intl
```

## 2. Configure `next.config.js`

Wrap your Next.js config with `createNextIntlPlugin`.

```javascript
// next.config.js
const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin();
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config here
  images: { // Example of existing config
    domains: ["utfs.io"]
  },
};
 
module.exports = withNextIntl(nextConfig);
```

## 3. Create Locale Files

- Create a `messages` directory in your project root (or `src`).
- Inside `messages`, create JSON files for each supported language (e.g., `en.json`, `es.json`).
- Populate these files with key-value pairs for your translations.

```json
// messages/en.json
{
  "HomePage": {
    "title": "Welcome to Cert Centre",
    "description": "Your gateway to limitless learning."
  },
  "Navbar": {
    "search": "Search Courses",
    "teacherMode": "Teacher Mode",
    "exit": "Exit"
  }
  // ... other keys
}
```

```json
// messages/es.json
{
  "HomePage": {
    "title": "Bienvenido a Cert Centre",
    "description": "Tu puerta de entrada al aprendizaje ilimitado."
  },
  "Navbar": {
    "search": "Buscar Cursos",
    "teacherMode": "Modo Profesor",
    "exit": "Salir"
  }
  // ... other keys
}
```

## 4. Configure Middleware

Create a `middleware.ts` file in your project root (or `src`) to handle locale detection and routing.

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es'],
 
  // Used when no locale matches
  defaultLocale: 'en'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|es)/:path*']
};
```

*Note*: You already have a `middleware.ts` for Clerk. You will need to integrate the `next-intl` middleware logic with your existing Clerk middleware. Refer to the `next-intl` documentation for examples on integrating with authentication middleware.

## 5. Set up `i18n.ts`

Create an `i18n.ts` file to configure `next-intl`.

```typescript
// i18n.ts
import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
```

## 6. Update Root Layout

Modify `app/layout.tsx` to include the locale and provide messages.

```typescript
// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/providers/toaster-provider'
import { ConfettiProvider } from '@/components/providers/confetti-provider'
import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
 
const inter = Inter({ subsets: ['latin'] })
 
export function generateStaticParams() {
  return [{locale: 'en'}, {locale: 'es'}];
}
 
export const metadata: Metadata = {
  title: "Cert Centre",
  description: "Your gateway to limitless learning.",
};
 
export default async function RootLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
 
  return (
    <ClerkProvider>
      <html lang={locale}> {/* Use locale here */}
        <body className={inter.className}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ConfettiProvider />
            <ToastProvider />
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

*Note*: Ensure the path in `import()` correctly points to your `messages` directory.

## 7. Use Translations in Components

Use the `useTranslations` hook in Client Components or `getTranslations` in Server Components.

**Client Component Example:**

```typescript
// components/some-client-component.tsx
'use client';
 
import {useTranslations} from 'next-intl';
 
export default function SomeClientComponent() {
  const t = useTranslations('Navbar');
  return <button>{t('search')}</button>;
}
```

**Server Component Example:**

```typescript
// app/[locale]/page.tsx
import {useTranslations} from 'next-intl';
 
export default function HomePage() {
  const t = useTranslations('HomePage');
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

## 8. Implement Locale Switcher

Create a component that allows users to switch between supported locales. This typically involves using `useRouter` from `next/navigation` and `usePathname` from `next-intl/client` to change the locale prefix in the URL.

## 9. Translate Content

- Go through all user-facing text in the application.
- Replace hardcoded strings with calls to the translation function `t()` using appropriate keys.
- Populate the locale JSON files (`en.json`, `es.json`, etc.) with the translations.

## 10. Testing

- Test the application thoroughly in all supported languages.
- Verify that the locale switcher works correctly.
- Ensure all text is translated and displayed correctly. 