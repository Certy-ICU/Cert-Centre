# Progressive Web App (PWA) Implementation

This document outlines the implementation of Progressive Web App (PWA) capabilities in the Cert Centre LMS application.

## Features Implemented

- **Offline Support**: The application can now work offline for previously visited pages and cached assets.
- **Installable**: Users can install the app on their devices (desktop and mobile).
- **App-like Experience**: Full-screen mode and splash screens on supported devices.
- **Optimized Caching**: Strategic caching for different types of content.

## Implementation Details

### 1. Dependencies

We've integrated `next-pwa` to enable PWA capabilities:

```bash
pnpm install next-pwa
```

### 2. Configuration

The Next.js configuration (`next.config.js`) has been updated to integrate PWA functionality with strategic caching rules:

- **Images Cache**: Images are cached with a "CacheFirst" strategy for 30 days.
- **API Cache**: API responses are cached with a "NetworkFirst" strategy for 1 day.

### 3. Web App Manifest

A manifest file (`public/manifest.json`) has been created to define:

- App name and short name
- Icons for various sizes and contexts (including maskable icons)
- Theme colors and display preferences
- Start URL and orientation

### 4. Icons

PWA icons are automatically generated from the application logo using a script:

```bash
pnpm generate-icons
```

The script uses Sharp to convert and resize the SVG logo to required PWA icon sizes (192x192 and 512x512).

### 5. Offline Page

A dedicated offline page (`app/offline.tsx`) has been created to provide feedback when users are offline. Features:

- Dynamic status detection (online/offline)
- Retry functionality when connection is restored
- User-friendly messaging

## Testing the PWA

To test the PWA functionality:

1. Build and start the application in production mode:
   ```bash
   pnpm build && pnpm start
   ```

2. Open Chrome DevTools and use:
   - Lighthouse to audit PWA features
   - Application tab to inspect service worker, manifest, and cache storage
   - Network tab (offline mode) to test offline functionality

3. Look for the "Install" icon in the address bar to test installation.

## Future Improvements

- **Enhanced Offline Data Sync**: Implement a more sophisticated offline data synchronization strategy.
- **Push Notifications**: Add push notification support for engagement.
- **Background Sync**: Enable background syncing for actions performed while offline.
- **Periodic Sync**: Implement periodic background updates when online.

## Resources

- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest Specification](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox) 