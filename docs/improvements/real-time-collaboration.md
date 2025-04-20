# Real-time Collaboration Features

This document outlines the real-time collaboration features implemented in our learning platform using Pusher for WebSockets functionality.

## Configuration and Setup

### Environment Variables
The following environment variables are required for Pusher integration:

```env
# Pusher configuration
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

### Dependencies
The project uses the following Pusher-related packages:
```bash
pnpm install pusher pusher-js
```

## Core Implementation

### Server-Side Setup (lib/pusher.ts)
The server-side Pusher instance handles channel authorization for private and presence channels:

```typescript
import Pusher from "pusher";
import { auth } from "@clerk/nextjs";

// Initialize Pusher server instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const authorizeUser = async (socketId: string, channelName: string) => {
  const { userId } = auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Handle presence channels
  if (channelName.startsWith("presence-")) {
    const user = { id: userId };
    const authResponse = pusherServer.authorizeChannel(
      socketId,
      channelName,
      { user_id: userId, user_info: user }
    );
    return new Response(JSON.stringify(authResponse));
  }

  // Handle private channels
  if (channelName.startsWith("private-")) {
    const authResponse = pusherServer.authorizeChannel(
      socketId,
      channelName,
      { user_id: userId }
    );
    return new Response(JSON.stringify(authResponse));
  }

  return new Response("Unauthorized", { status: 401 });
};
```

### Client-Side Setup (lib/pusher-client.ts)
The client-side Pusher instance is used by components to subscribe to channels:

```typescript
import PusherClient from "pusher-js";

// Ensure environment variables are loaded correctly client-side
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
  console.error("Pusher client environment variables not set!");
}

export const pusherClient = new PusherClient(
  pusherKey!, 
  {
    cluster: pusherCluster!,
    authEndpoint: "/api/pusher/auth",
  }
);
```

### Authentication Endpoint (app/api/pusher/auth/route.ts)
This endpoint handles authentication for private and presence channels:

```typescript
import { NextResponse } from "next/server";
import { authorizeUser } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { socket_id, channel_name } = data;

    if (!socket_id || !channel_name) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    return await authorizeUser(socket_id, channel_name);
  } catch (error) {
    console.error("PUSHER_AUTH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
```

## Implemented Components

### 1. ActiveViewersCounter
Displays the number of users currently viewing a specific chapter with a tooltip showing their names.

**Key Features:**
- Uses presence channels (`presence-chapter-{chapterId}`)
- Shows count with visual indicators
- Displays list of viewers in tooltip
- Updates in real-time as users join/leave

```typescript
// Usage in chapter page:
<ActiveViewersCounter chapterId={params.chapterId} className="mb-2 md:mb-0" />
```

### 2. ActiveViewersNotification
Shows a notification when new users join the current chapter.

**Key Features:**
- Animated notification that appears for 5 seconds
- Shows user avatars
- Displays join messages
- Handles multiple concurrent viewers

### 3. LiveCollaborationBanner
Displays a banner at the top of the chapter showing who else is viewing the content.

**Key Features:**
- Persistent presence indicator
- Shows avatars of active users
- Displays count for additional users
- Live activity indicator

### 4. ActiveUsersGlobalCounter
Shows the total number of users active across the entire platform.

**Key Features:**
- Uses a global presence channel
- Displays in the navbar for site-wide visibility
- Updates in real-time

## Push Notifications

The platform also includes Web Push Notifications for user engagement:

- Supports subscription management with `PushSubscription` model
- Service worker implementation for receiving push events
- Admin/instructor controlled notification sending
- User preference controls

## Implementation Best Practices

1. **Channel Naming Conventions:**
   - Presence channels: `presence-chapter-{chapterId}`
   - Global presence: `presence-global`
   - Private channels: `private-user-{userId}`

2. **Event Binding:**
   - Use `pusher:subscription_succeeded` for initial data
   - Handle `pusher:member_added` and `pusher:member_removed` for user presence
   - Create custom events like `user:active` for specific interactions

3. **Performance Considerations:**
   - Unbind events and unsubscribe from channels on component unmount
   - Use `setTimeout` for temporary UI elements
   - Filter duplicates when processing user lists

## Testing

- Open multiple browser windows/tabs for the same chapter
- Verify user counts and notifications appear correctly
- Test presence indicators with different user accounts
- Test network disconnection recovery

## Extending the Implementation

To add real-time features to other parts of the application:

1. Create presence channels with appropriate naming
2. Subscribe to these channels in client components
3. Handle member events for user presence
4. Add UI components to display real-time information
5. Implement any necessary server-side authorization 