# Implementing Real-time Collaboration (WebSockets)

This guide outlines how to add real-time features (like live comment updates or presence indicators) to the LMS using WebSockets, potentially with a service like Pusher or a self-hosted solution.

We'll use Pusher (via `pusher` and `pusher-js`) as an example due to its ease of integration with Next.js.

## 1. Set Up Pusher Account

- Create an account on [Pusher.com](https://pusher.com/).
- Create a new "Channels" app and note down your app ID, key, secret, and cluster.
- Add these credentials to your `.env` file:

```env
# .env (add these)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_KEY=your_key # Public key for client-side
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster # Public cluster for client-side
```

## 2. Install Dependencies

```bash
npm install pusher pusher-js
```

## 3. Initialize Pusher Server-Side

Create a utility file to initialize the Pusher server instance.

```typescript
// lib/pusher.ts
import PusherServer from "pusher";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
```

## 4. Trigger Events from Backend

Modify your API endpoints (e.g., the comment creation endpoint) to trigger Pusher events after successful database operations.

```typescript
// Example: app/api/courses/[courseId]/chapters/[chapterId]/comments/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db'; // Assuming db is your prisma client instance
import { pusherServer } from '@/lib/pusher'; // Import pusher server

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();
    const { text, parentId } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const newComment = await db.comment.create({
      data: {
        text,
        userId,
        chapterId: params.chapterId,
        parentId,
      },
      // Include necessary relations if needed for the event payload
      include: {
        // Potentially include minimal user info if you have a local User model
      }
    });

    // Trigger Pusher event
    // Channel name: e.g., "chapter-comments-{chapterId}"
    // Event name: e.g., "comment:new"
    const channelName = `chapter-${params.chapterId}-comments`;
    const eventName = 'comment:new';

    await pusherServer.trigger(channelName, eventName, {
      comment: newComment, // Send the newly created comment data
    });

    return NextResponse.json(newComment);

  } catch (error) {
    console.error("[COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Similarly, trigger events like 'comment:update' and 'comment:delete'
// in the PATCH and DELETE handlers.
```

## 5. Initialize Pusher Client-Side

Create a utility file for the client-side Pusher instance.

```typescript
// lib/pusher-client.ts (Note: Separate from server file)
import PusherClient from "pusher-js";

// Ensure environment variables are loaded correctly client-side
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
  console.error("Pusher client environment variables not set!");
  // Handle the error appropriately - maybe return a dummy client or throw
}

export const pusherClient = new PusherClient(
  pusherKey!, // Add non-null assertion or handle error
  {
    cluster: pusherCluster!, // Add non-null assertion or handle error
    // Add authEndpoint if using private/presence channels
    // authEndpoint: '/api/pusher/auth',
  }
);
```

## 6. Subscribe to Events in Frontend

In the relevant client component (e.g., `<CommentSection>`), use `useEffect` to subscribe to the Pusher channel and bind to events.

```typescript
// components/comment-section.tsx (Example)
'use client';

import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher-client';
import { Comment } from '@prisma/client'; // Assuming Comment type

interface CommentSectionProps {
  chapterId: string;
  initialComments: Comment[]; // Pass initial comments from server component
}

export default function CommentSection({ chapterId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);

  useEffect(() => {
    // Ensure pusherClient is initialized before subscribing
    if (!pusherClient) return;

    const channelName = `chapter-${chapterId}-comments`;
    const channel = pusherClient.subscribe(channelName);

    // Bind to the 'comment:new' event
    channel.bind('comment:new', (data: { comment: Comment }) => {
      // Add the new comment to the state
      // Consider fetching user details if not included in the event payload
      setComments((prevComments) => [...prevComments, data.comment]);
      // Optionally scroll to the new comment or show a notification
    });

    // Bind to 'comment:update' and 'comment:delete' events similarly
    channel.bind('comment:update', (data: { comment: Comment }) => {
      setComments((prevComments) =>
        prevComments.map((c) => (c.id === data.comment.id ? data.comment : c))
      );
    });

    channel.bind('comment:delete', (data: { commentId: string }) => {
      setComments((prevComments) =>
        prevComments.filter((c) => c.id !== data.commentId)
      );
    });

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      pusherClient.unsubscribe(channelName);
      // Consider unbinding specific events if necessary
      // channel.unbind('comment:new');
    };

  }, [chapterId]); // Re-run effect if chapterId changes

  // ... Rest of the component rendering comments and form ...

  return (
    <div>
      {/* Render comments state */}
      {comments.map((comment) => (
        <div key={comment.id}>{comment.text}</div> // Replace with actual CommentDisplay
      ))}
      {/* Render CommentForm */}
    </div>
  );
}

```

## 7. Private and Presence Channels (Optional)

- **Private Channels**: If you need to broadcast events only to authenticated users (e.g., user-specific notifications), use private channels (prefixed with `private-`). This requires an authentication endpoint on your server (`/api/pusher/auth`) that verifies the user (using Clerk) and authorizes their subscription.
- **Presence Channels**: For features like showing who is currently viewing a chapter (prefixed with `presence-`), use presence channels. These also require an authentication endpoint and allow tracking subscribed users.

## 8. Alternative: Self-Hosted WebSockets

- **Libraries**: Use libraries like `socket.io` or `ws` with your Node.js backend (potentially as a separate microservice or integrated into the Next.js custom server if needed, though API routes are generally preferred).
- **Infrastructure**: Requires managing the WebSocket server, handling connections, scaling, and potentially using Redis for pub/sub across multiple instances.
- **Complexity**: More complex to set up and manage than using a service like Pusher.

## 9. Testing

- Open multiple browser windows/tabs for the same chapter.
- Post a new comment in one window and verify it appears in real-time in the others.
- Test updating and deleting comments similarly.
- Test edge cases like network interruptions and reconnections.
- Test authentication for private/presence channels if implemented. 