import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { saveCertificateDirectly } from '@/lib/db-direct';

async function checkCourseCompletion(userId: string, courseId: string): Promise<Date | null> {
  try {
    // Get all published chapter IDs for the course
    const chapters = await db.chapter.findMany({
      where: { courseId: courseId, isPublished: true },
      select: { id: true },
    });
    
    if (!chapters || chapters.length === 0) {
      return null; // Cannot complete a course with no published chapters
    }
    
    const chapterIds = chapters.map(ch => ch.id);

    // Count completed chapters for the user in this course
    const completedCount = await db.userProgress.count({
      where: {
        userId: userId,
        chapterId: { in: chapterIds },
        isCompleted: true,
      },
    });

    // Check if all chapters are completed
    if (completedCount === chapterIds.length) {
      try {
        // Find the date of the last completed chapter
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
      } catch (error) {
        console.error("Error finding completion date:", error);
        return new Date(); // Return current date as fallback
      }
    } else {
      return null; // Not completed
    }
  } catch (error) {
    console.error("Error checking course completion:", error);
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const user = await currentUser();
    
    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const courseId = params.courseId;
    
    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 });
    }

    // Verify Course Completion
    const completionDate = await checkCourseCompletion(userId, courseId);
    if (!completionDate) {
      return new NextResponse("Course not completed or not found", { status: 403 });
    }

    // Generate certificate ID
    let certificateId: string = uuidv4();
    
    try {
      // Check if the certificate model exists
      if (db.certificate) {
        // Check if certificate already exists
        const existingCertificate = await db.certificate.findFirst({
          where: {
            userId,
            courseId
          }
        });

        if (existingCertificate) {
          certificateId = existingCertificate.certificateId;
        }
      } else {
        console.error("Certificate model is not available in the Prisma client. Please run 'npx prisma generate'");
      }
    } catch (error) {
      console.error("Error checking existing certificate:", error);
      // Continue with new certificate ID if there's an error
    }

    // Fetch Course Details
    let course;
    try {
      course = await db.course.findUnique({
        where: { id: courseId },
        select: { title: true },
      });

      if (!course) {
        return new NextResponse("Course not found", { status: 404 });
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      return new NextResponse("Error fetching course details", { status: 500 });
    }

    // Generate PDF using pdf-lib
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSizeTitle = 30;
      const fontSizeText = 14;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Student';

      // Draw Certificate Content
      // Title
      page.drawText('Certificate of Completion', {
        x: width / 2 - 180,
        y: height - 100,
        size: fontSizeTitle,
        font: font,
        color: rgb(0, 0.53, 0.71),
      });

      // Awarded to
      page.drawText('Awarded to:', {
        x: width / 2 - 45,
        y: height - 200,
        size: fontSizeText,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(userName, {
        x: width / 2 - (userName.length * 5),
        y: height - 230,
        size: fontSizeText * 1.5, // Larger name
        font: font,
        color: rgb(0, 0, 0),
      });

      // For successfully completing the course
      page.drawText('For successfully completing the course:', {
        x: width / 2 - 125,
        y: height - 300,
        size: fontSizeText,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(course.title, {
        x: width / 2 - (course.title.length * 4),
        y: height - 330,
        size: fontSizeText * 1.2, // Larger course title
        font: font,
        color: rgb(0, 0, 0),
      });

      // Date
      page.drawText(`Completion Date: ${completionDate.toLocaleDateString()}`, {
        x: width / 2 - 80,
        y: height - 400,
        size: fontSizeText * 0.8,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
        
      // Certificate ID and verification instructions
      page.drawText(`Certificate ID: ${certificateId}`, {
        x: 50,
        y: 50,
        size: fontSizeText * 0.7,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      const host = req.headers.get('host') || 'localhost:3000';
      page.drawText(`Verify at: ${host}/verify-certificate`, {
        x: width - 250,
        y: 50,
        size: fontSizeText * 0.7,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save();

      // Store Certificate Record if it doesn't already exist
      try {
        // Verify database connection first
        try {
          // Test basic connectivity with a simple query
          await db.$queryRaw`SELECT 1`;
          console.log("Database connection verified");
        } catch (dbConnError) {
          console.error("Database connection error:", dbConnError);
          throw new Error("Database connection failed");
        }
        
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
            // Return PDF Response after direct save
            const headers = new Headers();
            headers.set('Content-Type', 'application/pdf');
            headers.set('Content-Disposition', `inline; filename="${course.title}_certificate.pdf"`);

            return new NextResponse(pdfBytes, {
              status: 200,
              headers: headers,
            });
          }
          
          throw new Error("Certificate model is not available and direct save failed");
        }
        
        console.log("Saving certificate to database:", {
          certificateId,
          userId,
          courseId
        });

        // First check if the certificate exists to avoid unique constraint errors
        const existingCert = await db.certificate.findFirst({
          where: {
            userId,
            courseId,
          }
        });

        if (existingCert) {
          console.log("Certificate already exists, updating certificateId if needed");
          // Update the existing certificate with the new ID if it's different
          if (existingCert.certificateId !== certificateId) {
            await db.certificate.update({
              where: { id: existingCert.id },
              data: { certificateId }
            });
          }
        } else {
          console.log("Creating new certificate record");
          // Create a new certificate record
          const newCertificate = await db.certificate.create({
            data: {
              userId,
              courseId,
              certificateId
            }
          });
          
          console.log("New certificate created with ID:", newCertificate.id);
        }

        console.log("Certificate saved successfully");
      } catch (error) {
        console.error("Error saving certificate to database:", error);
        console.error("Error details:", JSON.stringify({
          code: (error as any)?.code,
          meta: (error as any)?.meta,
          message: (error as any)?.message
        }));
        
        // Try direct save method as last resort
        try {
          console.log("Attempting direct certificate save as fallback");
          const saveResult = await saveCertificateDirectly({
            userId,
            courseId,
            certificateId
          });
          
          if (saveResult) {
            console.log("Certificate saved with fallback method:", saveResult.id);
          } else {
            console.error("Fallback certificate save also failed");
          }
        } catch (fallbackError) {
          console.error("Error in fallback certificate save:", fallbackError);
        }
        
        // Continue to serve the PDF even if database save fails
      }

      // Return PDF Response
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `inline; filename="${course.title}_certificate.pdf"`);

      return new NextResponse(pdfBytes, {
        status: 200,
        headers: headers,
      });
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      return new NextResponse("Error generating certificate PDF", { status: 500 });
    }
  } catch (error) {
    console.error("[CERTIFICATE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 