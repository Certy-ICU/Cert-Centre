# Implementing Certificate Generation

This guide outlines steps to implement PDF certificate generation for students upon course completion.

## 1. Choose a PDF Generation Library

Select a library suitable for generating PDFs in a Node.js environment (server-side, likely within an API route).

- **`pdf-lib`**: A popular choice for creating and modifying PDFs with a low-level API. Good control over layout.
- **`Puppeteer`**: Headless Chrome automation. Can render an HTML template to PDF. Powerful but heavier dependency.
- **`PDFKit`**: Mature library specifically for PDF generation with a streaming API.

Let's use `pdf-lib` as an example due to its flexibility and reasonable footprint.

## 2. Install Dependencies

```bash
npm install pdf-lib
# Or using yarn
# yarn add pdf-lib
```

## 3. Design Certificate Template

- **Layout**: Plan the certificate layout: Course title, student name, completion date, unique certificate ID, issuing organization (Cert Centre), potentially a signature or logo.
- **Assets**: Prepare assets like logos or background images if needed.
- **Existing PDF Template (Optional)**: You can use `pdf-lib` to load an existing PDF template (e.g., with borders and background) and fill in the dynamic text fields.

## 4. Create Certificate Generation Service/API

Create an API route (e.g., `app/api/certificates/generate/route.ts` or `app/api/courses/[courseId]/certificate/route.ts`) responsible for generating the certificate PDF.

- **Trigger**: This API should only be callable when a user has actually completed the course.
- **Authentication**: Protect the endpoint, ensuring only the authenticated user who completed the course can request *their* certificate.
- **Data Fetching**: Fetch necessary data: course details (title), user details (name from Clerk), completion date (potentially from `UserProgress` or a dedicated `CourseCompletion` record).

```typescript
// Example API Route: app/api/courses/[courseId]/certificate/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid'; // For unique certificate ID

async function checkCourseCompletion(userId: string, courseId: string): Promise<Date | null> {
  // 1. Get all published chapter IDs for the course
  const chapters = await db.chapter.findMany({
    where: { courseId: courseId, isPublished: true },
    select: { id: true },
  });
  const chapterIds = chapters.map(ch => ch.id);

  if (chapterIds.length === 0) {
    return null; // Cannot complete a course with no published chapters
  }

  // 2. Count completed chapters for the user in this course
  const completedCount = await db.userProgress.count({
    where: {
      userId: userId,
      chapterId: { in: chapterIds },
      isCompleted: true,
    },
  });

  // 3. Check if all chapters are completed
  if (completedCount === chapterIds.length) {
    // Optional: Find the date of the last completed chapter
    const lastCompletion = await db.userProgress.findFirst({
        where: {
            userId: userId,
            chapterId: { in: chapterIds },
            isCompleted: true,
        },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
    });
    return lastCompletion?.updatedAt || new Date(); // Return completion date
  } else {
    return null; // Not completed
  }
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();
    const user = await currentUser(); // Get user details for name

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseId = params.courseId;

    // 1. Verify Course Completion
    const completionDate = await checkCourseCompletion(userId, courseId);
    if (!completionDate) {
      return new NextResponse("Course not completed or not found", { status: 403 });
    }

    // 2. Fetch Course Details
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // 3. Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSizeTitle = 30;
    const fontSizeText = 14;
    const certificateId = uuidv4();
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Student';

    // --- Draw Certificate Content (Example) ---
    // Title
    page.drawText('Certificate of Completion', {
      x: 50,
      y: height - 4 * fontSizeTitle,
      size: fontSizeTitle,
      font: font,
      color: rgb(0, 0.53, 0.71),
    });

    // Awarded to
    page.drawText('Awarded to:', {
      x: 50,
      y: height - 7 * fontSizeTitle,
      size: fontSizeText,
      font: font,
      color: rgb(0, 0, 0),
    });
    page.drawText(userName, {
      x: 50,
      y: height - 8 * fontSizeTitle,
      size: fontSizeText * 1.5, // Larger name
      font: font,
      color: rgb(0, 0, 0),
    });

    // For successfully completing the course
    page.drawText('For successfully completing the course:', {
        x: 50,
        y: height - 10 * fontSizeTitle,
        size: fontSizeText,
        font: font,
        color: rgb(0, 0, 0),
      });
    page.drawText(course.title, {
        x: 50,
        y: height - 11 * fontSizeTitle,
        size: fontSizeText * 1.2, // Larger course title
        font: font,
        color: rgb(0, 0, 0),
      });

    // Date
    page.drawText(`Completion Date: ${completionDate.toLocaleDateString()}`, {
        x: 50,
        y: height - 13 * fontSizeTitle,
        size: fontSizeText * 0.8,
        font: font,
        color: rgb(0, 0, 0),
      });
      
    // Certificate ID
    page.drawText(`Certificate ID: ${certificateId}`, {
        x: 50,
        y: 50,
        size: fontSizeText * 0.7,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
    });
    // --- End Drawing ---

    // 4. Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // 5. Optional: Store Certificate Record
    // Consider creating a Certificate model in Prisma to store the certificate ID,
    // userId, courseId, generation date for verification purposes.
    // await db.certificate.create({ data: { id: certificateId, userId, courseId } });

    // 6. Return PDF Response
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${course.title}_certificate.pdf"`); // Or 'attachment; ...' to force download

    return new NextResponse(pdfBytes, {
        status: 200,
        headers: headers,
    });

  } catch (error) {
    console.error("[CERTIFICATE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

```

## 5. Frontend Implementation

- **Certificate Button/Link**: On the course page or user dashboard, add a button/link ("Download Certificate") that becomes active *only* when the course is completed.
    - This button should link to or trigger a request to the certificate generation API endpoint (e.g., `/api/courses/[courseId]/certificate`).
- **Check Completion Status**: The frontend needs to know if the course is completed to enable the button. Fetch `UserProgress` data for all chapters or rely on a summary flag fetched from the backend.
- **Display**: Clicking the link/button will either open the PDF in a new tab (`Content-Disposition: inline`) or trigger a download (`Content-Disposition: attachment`), handled by the browser based on the API response headers.

```typescript
// Example Frontend Button (Conceptual)
'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, Download } from "lucide-react";

interface CertificateButtonProps {
  courseId: string;
  isCompleted: boolean; // This needs to be determined by fetching progress data
}

export const CertificateButton = ({ courseId, isCompleted }: CertificateButtonProps) => {

  const onDownload = () => {
    // Opens the PDF URL in a new tab
    window.open(`/api/courses/${courseId}/certificate`, '_blank');
  };

  if (!isCompleted) {
    return (
      <Button disabled size="sm" variant="outline">
        Complete Course for Certificate
      </Button>
    );
  }

  return (
    <Button onClick={onDownload} size="sm" variant="success"> {/* Assuming a success variant */} 
      <Download className="h-4 w-4 mr-2" />
      Download Certificate
    </Button>
  );
};
```

## 6. Verification (Optional)

- **Certificate ID**: Include a unique ID on the certificate.
- **Verification Page**: Create a public page where anyone can enter a certificate ID to verify its authenticity.
- **Verification API**: An API endpoint (`GET /api/certificates/verify?id=...`) that checks the stored certificate record (if implemented in step 4.5) and confirms its validity.

## 7. Testing

- Test the `checkCourseCompletion` logic thoroughly.
- Test the API endpoint with authenticated users who have and have not completed the course.
- Verify the generated PDF layout and content.
- Test the frontend button's enabled/disabled state based on completion status.
- Test the download/display functionality.
- Test verification if implemented. 