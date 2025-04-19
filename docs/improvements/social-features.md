# Implementing Social Features (Discussions/Comments)

This guide covers adding discussion forums or comment sections to courses or chapters within the LMS.

## 1. Data Model Changes (Prisma)

- **Define Models**: Add new models to `prisma/schema.prisma` for discussions/comments. Choose one approach:
    - **A) Course-Level Discussions**: A single discussion thread per course.
    - **B) Chapter-Level Comments**: Comment threads per chapter.
    - **C) General Forum**: Separate forum structure potentially linked to courses.

    Let's assume **Chapter-Level Comments (B)** for this example:

  ```prisma
  // prisma/schema.prisma

  model Chapter {
    // ... existing fields
    comments Comment[] // Add relation to comments
  }

  model Comment {
    id        String   @id @default(uuid())
    text      String   @db.Text
    userId    String   // ID from Clerk
    chapterId String
    chapter   Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)

    parentId  String?   // For threaded replies
    parent    Comment?  @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade, onUpdate: NoAction)
    replies   Comment[] @relation("Replies")

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([chapterId])
    @@index([userId])
    @@index([parentId])
  }

  // Optional: Add user details (consider privacy)
  // If you need to display user names/avatars with comments often,
  // consider syncing minimal public Clerk user data to a local User model.
  // model User {
  //   id String @id // Clerk User ID
  //   username String?
  //   imageUrl String?
  //   // ... other fields if needed
  // }
  ```

- **Apply Migrations**: Run `npx prisma generate` and `npx prisma db push` (or `migrate dev`).

## 2. API Endpoints

Create API routes (e.g., within `app/api/courses/[courseId]/chapters/[chapterId]/comments`) to handle:

- **Fetching Comments**: `GET /api/.../comments?parentId=[parentId]`
    - Fetch comments for a specific chapter, potentially filtering by `parentId` for replies.
    - Include user information (either fetching from Clerk server-side based on `userId` or from a synced local `User` table).
    - Implement pagination.
- **Creating Comments**: `POST /api/.../comments`
    - Takes `text` and potentially `parentId` in the request body.
    - Validates user authentication (using Clerk).
    - Creates a new `Comment` record in the database.
    - Perform validation (e.g., non-empty text).
- **Updating Comments**: `PATCH /api/.../comments/[commentId]`
    - Takes `text` in the body.
    - Validates that the logged-in user is the owner of the comment.
    - Updates the comment text.
- **Deleting Comments**: `DELETE /api/.../comments/[commentId]`
    - Validates user ownership or teacher/admin permissions.
    - Deletes the comment (consider soft delete by adding an `isDeleted` flag if needed).

## 3. Frontend Implementation

- **Comment Section Component**: Create a reusable React component (`<CommentSection>`) to display comments and the input form.
    - Place this component within the relevant chapter view page (e.g., `app/(course)/courses/[courseId]/chapters/[chapterId]/page.tsx`).
- **Displaying Comments (`<CommentDisplay>`)**: Component to render a single comment and its replies recursively.
    - Fetch comments using a server component or a client component with data fetching (e.g., SWR or React Query - see Performance Optimization guide).
    - Display comment text, author (fetch user details from Clerk or local cache), timestamp.
    - Include buttons for Reply, Edit, Delete (conditionally rendered based on user permissions).
- **Comment Input Form (`<CommentForm>`)**: Component with a text area and submit button.
    - Handles submitting new comments or replies via API calls.
    - Includes state management for the input text.
    - Provide user feedback (loading states, error messages).
- **User Experience**: 
    - Implement loading states while fetching/posting.
    - Add pagination or a "Load More" button for long threads.
    - Consider real-time updates (see Real-time Collaboration guide) for new comments.

## 4. Authentication and Authorization

- **Clerk Integration**: Use Clerk's helpers (`auth()`, `currentUser()`, `<SignedIn>`, `<SignedOut>`) to ensure only logged-in users can post comments.
- **Permissions**: Implement logic in API routes and frontend components:
    - Users can edit/delete their *own* comments.
    - Course teachers/admins might need permissions to moderate (delete any comment).
    - Store the `userId` (from Clerk) with each comment to check ownership.

## 5. Moderation (Optional but Recommended)

- **Reporting**: Add a feature for users to report inappropriate comments.
    - Add a `Report` model or a flag on the `Comment` model.
    - Create an admin/teacher interface to review reported comments.
- **Content Filtering**: Implement basic profanity filtering if necessary.

## 6. Social Sharing

- **Add Sharing Buttons**: Integrate libraries like `react-share` to add buttons for sharing course links (not individual comments) on social media platforms.
    - Place these buttons on the main course page or search results.

## 7. Testing

- Test fetching, creating, editing, and deleting comments and replies.
- Verify permissions logic (ownership, moderation).
- Test pagination and loading states.
- Test different user roles (student, teacher, admin). 