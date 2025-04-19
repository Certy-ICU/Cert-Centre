# Certificate Generation in Cert Centre

This document outlines the implementation of PDF certificate generation for students upon course completion, including the design decisions, implementation process, and technical challenges encountered.

## Overview

Certificates serve as proof of course completion for students. When a user completes all chapters in a course, they can download a personalized certificate with:
- Student name
- Course title 
- Completion date
- Unique certificate ID for verification

## 1. Technical Architecture

### PDF Generation Library
We selected `pdf-lib` for certificate generation due to its:
- Small footprint (lightweight dependency)
- Client-side compatibility
- Flexible API for custom layouts
- No external dependencies like browser engines

### Database Storage
Certificates are stored in a dedicated `Certificate` model with:
- `id`: Unique record identifier 
- `userId`: The student who earned the certificate
- `courseId`: The completed course
- `certificateId`: Public-facing unique identifier for verification
- `createdAt`: Certificate issue date

```typescript
// Prisma model
model Certificate {
  id String @id @default(uuid())
  userId String
  certificateId String @unique @default(uuid())
  
  courseId String
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@index([courseId])
  @@unique([userId, courseId])
}
```

## 2. Implementation Components

### Certificate Generation API

The API route `/api/courses/[courseId]/certificate` handles the PDF generation with these steps:

1. **Authentication & Authorization**: Verifies the user is authenticated and restricts access to their own certificates
2. **Course Completion Verification**: Checks that all published chapters are completed
3. **Certificate Record**: Creates or retrieves an existing certificate record in the database
4. **PDF Generation**: Creates a PDF with the certificate layout and dynamic data
5. **Response**: Returns the PDF directly to the browser

### Certificate Verification

Users can verify certificates at `/verify-certificate` by entering a certificate ID. The backend validates the certificate against database records and returns the course and student information.

### Frontend Integration

A download button appears on the course page only when the course is completed. When clicked, it:
1. Opens a new tab with the certificate API route
2. Displays the certificate for immediate viewing or download
3. Provides visual feedback with a success toast message

## 3. Implementation Challenges & Solutions

### Challenge: Database Integration

When implementing the certificate storage, we encountered issues with the Prisma client not properly recognizing the Certificate model, causing the error:

```
Cannot read properties of undefined (reading 'findFirst')
```

#### Solution

1. **Model Validation**: Added runtime checks to verify if `db.certificate` exists before attempting operations
2. **Fallback Mechanism**: Implemented a direct database connection utility (`saveCertificateDirectly`) as a failsafe:

```typescript
// Check if the certificate model exists in the db client
if (!db.certificate) {
  console.error("Certificate model is not available in the Prisma client");
  // Use direct save as fallback
  const saveResult = await saveCertificateDirectly({
    userId,
    courseId,
    certificateId
  });
  
  if (saveResult) {
    console.log("Certificate saved using direct client:", saveResult.id);
    // Continue with PDF delivery...
  }
}
```

3. **Error Resilience**: Enhanced error handling to ensure PDF delivery even if database operations fail
4. **Regenerate Prisma Client**: Added documentation for resolving model availability issues with `npx prisma generate`

### Challenge: Certificate Layout

Positioning elements in the PDF required precise calculations for different text lengths and visual balance.

#### Solution

Used relative positioning based on page dimensions:

```typescript
page.drawText('Certificate of Completion', {
  x: width / 2 - 180, // Center horizontally
  y: height - 100,    // Top margin
  size: fontSizeTitle,
  font: font,
  color: rgb(0, 0.53, 0.71),
});
```

## 4. Usage

### For Students
1. Complete all chapters in a course
2. Click the "Download Certificate" button that appears
3. View/download the certificate in PDF format
4. Share certificate ID for verification purposes

### For Certificate Verification
1. Visit the verification page at `/verify-certificate`
2. Enter the certificate ID
3. System confirms authenticity and displays course information

## 5. Future Enhancements

- **Certificate Templates**: Add multiple design templates
- **Digital Signatures**: Implement cryptographic signatures for stronger verification
- **Email Delivery**: Automatically email certificates upon course completion
- **Social Sharing**: Add functionality to share achievements on social media
- **Bulk Generation**: Admin tools for generating certificates for multiple students

## 6. Technical Reference

### API Routes
- `/api/courses/[courseId]/certificate`: Generate certificate for a specific course
- `/api/certificates/verify`: Verify certificate authenticity
- `/api/test/certificate`: Diagnostic endpoint for certificate functionality

### Key Files
- `app/api/courses/[courseId]/certificate/route.ts`: Certificate generation endpoint
- `app/verify-certificate/page.tsx`: Certificate verification page
- `components/certificate-button.tsx`: UI component for certificate download
- `lib/db-direct.ts`: Database utilities for certificate persistence
- `prisma/schema.prisma`: Database schema including Certificate model

### Libraries
- `pdf-lib`: PDF generation
- `uuid`: Unique certificate ID generation
- `next/server`: API response handling
- `clerk/nextjs`: Authentication 