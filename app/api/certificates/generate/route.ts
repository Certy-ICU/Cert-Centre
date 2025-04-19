import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { getDirectPrismaClient } from '@/lib/db-direct';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

async function checkCourseCompletion(userId: string, courseId: string) {
  const prisma = db || getDirectPrismaClient();

  // 1. Get all published chapter IDs for the course
  const chapters = await prisma.chapter.findMany({
    where: { courseId: courseId, isPublished: true },
    select: { id: true },
  });
  const chapterIds = chapters.map(ch => ch.id);

  if (chapterIds.length === 0) {
    return null; // Cannot complete a course with no published chapters
  }

  // 2. Count completed chapters for the user in this course
  const completedCount = await prisma.userProgress.count({
    where: {
      userId: userId,
      chapterId: { in: chapterIds },
      isCompleted: true,
    },
  });

  // 3. Check if all chapters are completed
  if (completedCount === chapterIds.length) {
    // Optional: Find the date of the last completed chapter
    const lastCompletion = await prisma.userProgress.findFirst({
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

    const url = new URL(req.url);
    const courseId = url.searchParams.get("courseId") || params.courseId;

    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 });
    }

    // Get a reliable database connection
    const prisma = db || getDirectPrismaClient();

    // 1. Verify Course Completion
    const completionDate = await checkCourseCompletion(userId, courseId);
    if (!completionDate) {
      return new NextResponse("Course not completed or not found", { status: 403 });
    }

    // 2. Fetch Course Details
    const course = await prisma.course.findUnique({
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

    // 5. Store Certificate Record
    try {
      await prisma.certificate.create({ 
        data: { 
          certificateId, 
          userId, 
          courseId 
        } 
      });
      console.log(`Certificate created with ID: ${certificateId}`);
    } catch (dbError) {
      console.error("Failed to store certificate in database:", dbError);
      // Continue to return the PDF even if db storage fails
    }

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