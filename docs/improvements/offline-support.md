# Implementing Offline Support (Progressive Web App - PWA)

This guide outlines how to add basic offline support and PWA capabilities to the Next.js LMS application using `next-pwa`.

## 1. Install Dependencies

```bash
pnpm install next-pwa
# Or if using Yarn
# yarn add next-pwa
```

## 2. Configure `next.config.js`

Wrap your Next.js configuration with `withPWA`.

```javascript
// next.config.js
const withPWA = require("next-pwa")({
  dest: "public", // Destination directory for the PWA files
  register: true, // Register the service worker
  skipWaiting: true, // Skip waiting for service worker activation
  // disable: process.env.NODE_ENV === "development", // Optional: Disable PWA in development
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config
  images: {
    domains: ["utfs.io"]
  },
};

module.exports = withPWA(nextConfig);
```

*Note*: If you have multiple wrappers (e.g., for `next-intl`), you'll need to compose them correctly.

## 3. Create a Web App Manifest

Create a `manifest.json` file in the `public` directory. This file provides information about your application (name, icons, start URL, display mode).

```json
// public/manifest.json
{
  "name": "Cert Centre - LMS",
  "short_name": "CertCentre",
  "description": "Your gateway to limitless learning.",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
    // Add more icon sizes if needed
  ],
  "start_url": "/",
  "display": "standalone", // Or "minimal-ui", "fullscreen"
  "background_color": "#ffffff",
  "theme_color": "#020817" // Example theme color (match your design)
}
```

- **Create Icons**: Generate necessary app icons (e.g., 192x192, 512x512) and place them in a `public/icons` directory.

## 4. Link the Manifest in Root Layout

Add a link to the `manifest.json` file in the `<head>` section of your root layout (`app/layout.tsx`).

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
// ... other imports

export const metadata: Metadata = {
  title: "Cert Centre",
  description: "Your gateway to limitless learning.",
  manifest: "/manifest.json", // Add this line
};

export default function RootLayout({ /* ... */ }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        {/* <head> content is handled by Next.js Metadata API */}
        <body className={/* ... */}>
          {/* ... providers and children */}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

## 5. Service Worker Strategy

`next-pwa` uses Workbox.js under the hood and defaults to a cache-first strategy for most assets, which is suitable for PWAs aiming for offline capabilities. Static assets (JS, CSS, images defined in `public`) and Next.js page chunks will be cached automatically.

- **Runtime Caching**: You might need to configure runtime caching for API requests (e.g., course data, user progress) if you want that data available offline or to load faster from the cache. This is done in the `next.config.js` PWA options.

  ```javascript
  // next.config.js (inside withPWA options)
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.+\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      urlPattern: /^https?:\/\/yourapi\.com\/api\/.*/, // Adjust to your API endpoints
      handler: 'NetworkFirst', // Or 'StaleWhileRevalidate'
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 Day
        },
        networkTimeoutSeconds: 10, // Timeout for network request
      },
    },
    // Add more caching strategies as needed
  ],
  ```

- **Offline Fallback**: Consider defining an offline fallback page that gets displayed when the user is offline and tries to access a non-cached page.

## 6. Test PWA Functionality

- **Build for Production**: PWA features typically work best in production builds (`npm run build && npm start`).
- **Lighthouse**: Use the Lighthouse audit tool in Chrome DevTools. Check the "Progressive Web App" category.
- **Application Tab**: In Chrome DevTools, use the "Application" tab to inspect the manifest, service workers, and storage.
- **Offline Simulation**: Use the "Offline" checkbox in the DevTools Network or Service Worker tabs to simulate offline conditions and test if cached resources load.
- **Install Prompt**: Check if the browser offers an install prompt (Add to Home Screen).

## 7. Handle Application Updates

`next-pwa` with `skipWaiting: true` and `register: true` helps ensure the latest version of the service worker is activated quickly. You might want to implement a UI notification to inform users when an update has been installed and prompt them to reload.

## Considerations

- **Cache Invalidation**: Be mindful of how you cache API data, especially dynamic content. Strategies like `NetworkFirst` or `StaleWhileRevalidate` are often better for data that changes.
- **Storage Limits**: Browsers have storage limits for caches. Keep track of cache sizes, especially for images and videos.
- **User Experience**: Design a clear offline experience. Indicate when content is served from cache or when the user is truly offline. Prevent actions that require network connectivity when offline. 