import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs';
import { v4 as uuidv4 } from 'uuid';

// Test endpoint to check certificate database operations
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const dbStatus = {
      connection: {
        ok: false,
        error: null
      }
    };
    
    // Test database connection
    try {
      await db.$queryRaw`SELECT 1`;
      dbStatus.connection.ok = true;
    } catch (error) {
      console.error("Database connection error:", error);
      dbStatus.connection.error = String(error);
    }
    
    // Get the certificate table structure
    const certificateModelInfo = {
      fields: ["id", "userId", "courseId", "certificateId", "createdAt"]
    };
    
    let certificateCount = 0;
    let userCertificates = [];
    let testCertificateError = null;
    let testCertificate = null;
    
    // Only continue with tests if connection is OK
    if (dbStatus.connection.ok) {
      try {
        // Count certificates
        certificateCount = await db.certificate.count();
        
        // Get all certificates for the current user
        userCertificates = await db.certificate.findMany({
          where: {
            userId
          },
          include: {
            course: {
              select: {
                title: true
              }
            }
          }
        });
        
        // Test certificate creation with a test ID
        const testCertificateId = uuidv4();
        
        try {
          // Create a test certificate (we'll delete it afterward)
          testCertificate = await db.certificate.create({
            data: {
              userId,
              courseId: userCertificates[0]?.courseId || "test-course-id",
              certificateId: testCertificateId
            }
          });
          
          console.log("Test certificate created:", testCertificate);
          
          // Clean up the test certificate
          if (testCertificate) {
            await db.certificate.delete({
              where: { id: testCertificate.id }
            });
            console.log("Test certificate deleted");
          }
        } catch (error) {
          console.error("Error in test certificate creation:", error);
          testCertificateError = {
            message: String(error),
            code: (error as any)?.code,
            meta: (error as any)?.meta
          };
        }
      } catch (error) {
        console.error("Error in certificate tests:", error);
      }
    }
    
    return NextResponse.json({
      dbStatus,
      certificateModel: certificateModelInfo,
      certificateCount,
      userCertificates,
      testResult: {
        success: !!testCertificate,
        error: testCertificateError
      }
    });
  } catch (error) {
    console.error("[TEST_CERTIFICATE]", error);
    return NextResponse.json({
      error: "Internal server error",
      message: String(error)
    }, { status: 500 });
  }
} 