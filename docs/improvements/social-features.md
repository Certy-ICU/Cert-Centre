# Social Features Implementation Guide

This documentation covers the implementation of social features in the LMS platform, including comments, moderation, and social sharing capabilities.

## Table of Contents
1. [Comment System Implementation](#1-comment-system-implementation)
2. [API Endpoints for Comments](#2-api-endpoints-for-comments)
3. [Frontend Components](#3-frontend-components)
4. [Authentication and Authorization](#4-authentication-and-authorization)
5. [Moderation System](#5-moderation-system)
6. [Social Sharing Integration](#6-social-sharing-integration)
7. [Testing](#7-testing)

## 1. Comment System Implementation

### Data Model

The platform uses Prisma ORM with the following data model for comments:

```prisma
// prisma/schema.prisma

model Chapter {
  // ... existing fields
  comments Comment[] // Relation to comments
}

model Comment {
  id        String   @id @default(uuid())
  text      String   @db.Text
  userId    String   // ID from Clerk
  courseId  String
  chapterId String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  chapter   Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)

  parentId  String?   // For threaded replies
  parent    Comment?  @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  replies   Comment[] @relation("Replies")

  moderation Json?    // For storing moderation data 

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([chapterId])
  @@index([courseId])
  @@index([userId])
  @@index([parentId])
}

model User {
  id       String @id // Clerk User ID
  name     String?
  imageUrl String?
  // ... other fields
}
```

### Setting Up Migrations

After adding these models, apply the Prisma migrations:

```bash
npx prisma generate
npx prisma migrate dev --name add_comments_and_moderation
```

## 2. API Endpoints for Comments

The platform implements the following API endpoints for the comment system:

### Comment Management

- **Fetch Comments**: `GET /api/courses/:courseId/chapters/:chapterId/comments`
  - Optional query parameter: `parentId` for fetching replies
  - Includes user information and nested replies
  
- **Create Comment**: `POST /api/courses/:courseId/chapters/:chapterId/comments`
  ```typescript
  // Request body
  {
    "text": "Comment content",
    "parentId": "optional-parent-comment-id"
  }
  ```
  
- **Update Comment**: `PATCH /api/courses/:courseId/chapters/:chapterId/comments/:commentId`
  ```typescript
  // Request body
  {
    "text": "Updated comment content"
  }
  ```
  
- **Delete Comment**: `DELETE /api/courses/:courseId/chapters/:chapterId/comments/:commentId`

### Comment Moderation

- **Report Comment**: `POST /api/courses/:courseId/chapters/:chapterId/comments/:commentId/report`
  ```typescript
  // Request body
  {
    "reason": "Reason for reporting this comment"
  }
  ```

## 3. Frontend Components

### Comment Components

The platform implements several components for the comment system:

- **`<CommentSection>`** - The main container component for comments:
  ```tsx
  <CommentSection 
    courseId={courseId}
    chapterId={chapterId}
  />
  ```

- **`<CommentDisplay>`** - Component for displaying individual comments with nested replies:
  ```tsx
  <CommentDisplay
    comment={comment}
    courseId={courseId}
    chapterId={chapterId}
    currentUserId={userId}
    onDelete={handleDelete}
    onRefresh={fetchComments}
    depth={0}
  />
  ```

- **Comment Creation Form** - Within the `CommentSection` component, allowing users to add new comments or replies.

### Social Sharing Components

The platform includes a reusable `SocialShare` component that integrates with the `react-share` library:

```tsx
// components/social-share.tsx
"use client";

import { 
  FacebookShareButton, TwitterShareButton, 
  LinkedinShareButton, WhatsappShareButton,
  FacebookIcon, TwitterIcon, 
  LinkedinIcon, WhatsappIcon
} from "react-share";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  iconSize?: number;
  round?: boolean;
}

export const SocialShare = ({
  url,
  title,
  description = "",
  className = "",
  iconSize = 32,
  round = true
}: SocialShareProps) => {
  // Make sure we have the full URL with domain name
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}${url}`;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-1">
        Share:
      </span>
      
      <FacebookShareButton url={fullUrl} quote={title}>
        <FacebookIcon size={iconSize} round={round} />
      </FacebookShareButton>
      
      <TwitterShareButton url={fullUrl} title={title}>
        <TwitterIcon size={iconSize} round={round} />
      </TwitterShareButton>
      
      <LinkedinShareButton url={fullUrl} title={title} summary={description}>
        <LinkedinIcon size={iconSize} round={round} />
      </LinkedinShareButton>
      
      <WhatsappShareButton url={fullUrl} title={title}>
        <WhatsappIcon size={iconSize} round={round} />
      </WhatsappShareButton>
    </div>
  );
};
```

This component is integrated in:

1. **Course Cards** - For sharing individual courses:
   ```tsx
   <SocialShare 
     url={courseUrl}
     title={`Check out this course: ${title}`}
     description={`A course about ${category} with ${chaptersLength} chapters`}
     iconSize={24}
     className="justify-center"
   />
   ```

2. **Chapter Pages** - For sharing specific chapters:
   ```tsx
   <SocialShare 
     url={chapterUrl}
     title={`${course.title} - ${chapter.title}`}
     description={`Check out this chapter from ${course.title}`}
     iconSize={24}
   />
   ```

## 4. Authentication and Authorization

The platform uses Clerk for authentication and includes the following authorization rules:

- **Comment Creation**: Only authenticated users can create comments
- **Comment Editing/Deletion**: Users can only edit/delete their own comments
- **Comment Moderation**: Course owners/teachers can review and moderate all comments in their courses

Implementation examples:

```typescript
// Server-side auth check example
const { userId } = auth();
if (!userId) {
  return new NextResponse("Unauthorized", { status: 401 });
}

// Client-side permission check example
const isOwner = comment.userId === currentUserId;
```

## 5. Moderation System

The platform includes a moderation system for comments:

### Moderation Data Structure

```typescript
// Moderation data stored in the Comment model's moderation field
interface Moderation {
  isReported: boolean;
  reportReason?: string;
  reportedAt?: string;
  reportedBy?: string;
}
```

### Reporting Interface

1. Users can report inappropriate comments via a flag icon
2. A modal dialog collects the reason for the report
3. Report data is stored in the comment's moderation field
4. Teachers receive notifications of reported comments

### Moderation Dashboard

Teachers can review reported comments in a dedicated dashboard at:
`/teacher/reported-comments`

This dashboard includes:
- List of reported comments in their courses
- Options to dismiss reports or delete comments
- Display of original comment content and report reason

## 6. Social Sharing Integration

The platform integrates social sharing capabilities:

### Installation

```bash
npm install react-share
```

### Implementation

The `SocialShare` component allows sharing content to:
- Facebook
- Twitter
- LinkedIn
- WhatsApp

### Integration Points

Social sharing buttons are integrated at key points in the application:
- Course cards in search results/listings
- Individual chapter pages

This enables users to easily share course content on social media platforms, enhancing the platform's reach and engagement.

## 7. Testing

When testing the social features, cover the following areas:

### Comment System Testing

- **Creation**: Test adding comments and replies
- **Editing**: Test modifying your own comments
- **Deletion**: Test removing your own comments
- **Permissions**: Verify that users cannot edit/delete others' comments
- **Nested Replies**: Test the display and functionality of threaded discussions

### Moderation Testing

- **Reporting**: Test the report flow as a student
- **Review**: Test the moderation dashboard as a teacher
- **Actions**: Test dismissing reports and deleting reported comments

### Social Sharing Testing

- **URL Generation**: Verify that correct URLs are generated for sharing
- **Preview**: Test social media previews with OpenGraph tags
- **Cross-Platform**: Test sharing on different platforms

### Cross-Browser and Responsive Testing

- Test functionality on different browsers
- Verify responsive design on mobile devices 