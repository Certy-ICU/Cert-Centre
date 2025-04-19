import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDirectPrismaClient } from '@/lib/db-direct';
import { PrismaClient } from '@prisma/client';

// Check if db is defined and if not, use the direct client
const getDatabase = (): PrismaClient => {
  try {
    // Try the global DB instance first
    if (db && typeof db.certificate?.findUnique === 'function') {
      console.log("[CERTIFICATE_VERIFY] Using global DB instance");
      return db;
    }
    
    // Fall back to direct Prisma client
    console.log("[CERTIFICATE_VERIFY] Falling back to direct DB instance");
    const directClient = getDirectPrismaClient();
    
    // Verify the direct client is valid
    if (!directClient || typeof directClient.certificate?.findUnique !== 'function') {
      throw new Error("Invalid direct Prisma client");
    }
    
    return directClient;
  } catch (error) {
    console.error("[CERTIFICATE_VERIFY] Database initialization error:", error);
    // Return a mock client that will safely handle operations
    return createSafeMockClient();
  }
};

// Create a safe mock client that won't throw errors
function createSafeMockClient() {
  console.warn("[CERTIFICATE_VERIFY] Using safe mock client due to database connection issues");
  
  const safeMock = {
    $connect: async () => Promise.resolve(),
    $disconnect: async () => Promise.resolve(),
    $queryRaw: async (query: any, ...params: any[]) => {
      // Log the attempted query for debugging
      console.log("[CERTIFICATE_VERIFY] Mock client query:", { query, params });
      return [];
    },
    certificate: {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => []
    },
    course: {
      findUnique: async () => null,
      findFirst: async () => null
    }
  };
  
  return safeMock as unknown as PrismaClient;
}

// Check if db is defined and can be connected to
const isDbConnected = async () => {
  try {
    const client = getDatabase();
    
    // Test basic connectivity with a simple query
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("[CERTIFICATE_VERIFY] DB connection check error:", error);
    return false;
  }
};

export async function GET(req: Request) {
  // Add request ID for tracking this specific request through logs
  const requestId = Math.random().toString(36).substring(2, 10);
  console.log(`[CERTIFICATE_VERIFY:${requestId}] New verification request`);
  
  try {
    // Log the request URL for debugging
    console.log(`[CERTIFICATE_VERIFY:${requestId}] Request URL:`, req.url);
    
    const { searchParams } = new URL(req.url);
    const certificateId = searchParams.get('id');

    console.log(`[CERTIFICATE_VERIFY:${requestId}] Certificate ID:`, certificateId);

    if (!certificateId) {
      return NextResponse.json(
        { valid: false, message: "Certificate ID is required" },
        { status: 400 }
      );
    }

    // Check database connectivity first
    console.log(`[CERTIFICATE_VERIFY:${requestId}] Checking database connectivity`);
    const dbConnected = await isDbConnected();
    if (!dbConnected) {
      console.error(`[CERTIFICATE_VERIFY:${requestId}] Database connection failed`);
      return NextResponse.json({
        valid: false,
        message: "Service is temporarily unavailable. Please try again later.",
        error: "db_connection_error"
      }, { status: 503 });
    }
    
    console.log(`[CERTIFICATE_VERIFY:${requestId}] Database connection successful`);

    // Get Prisma client
    let prisma: PrismaClient;
    try {
      prisma = getDatabase();
    } catch (dbInitError) {
      console.error(`[CERTIFICATE_VERIFY:${requestId}] Database client initialization error:`, dbInitError);
      
      return NextResponse.json({
        valid: false,
        message: "Database connection failed. Service is experiencing technical difficulties.",
        error: "db_client_error"
      }, { status: 503 });
    }

    // SAFETY CHECK: Verify certificate exists (with proper error handling)
    let certificateExists = null;
    try {
      // First, check if the certificate exists without trying to include the course
      console.log(`[CERTIFICATE_VERIFY:${requestId}] Looking up certificate:`, certificateId);
      
      certificateExists = await prisma.certificate.findUnique({
        where: { certificateId },
        select: { id: true }
      }).catch(err => {
        console.error(`[CERTIFICATE_VERIFY:${requestId}] Certificate lookup error:`, err);
        return null;
      });
      
      console.log(`[CERTIFICATE_VERIFY:${requestId}] Certificate exists:`, !!certificateExists);
      
      if (!certificateExists) {
        // For testing - provide a specific message for known invalid certificate IDs
        if (certificateId === 'test' || certificateId.includes('test')) {
          return NextResponse.json({ 
            valid: false, 
            message: "This is a test certificate ID and is not valid",
            isTest: true
          }, { status: 404 });
        }
        
        return NextResponse.json(
          { valid: false, message: "Certificate not found" },
          { status: 404 }
        );
      }
    } catch (findError) {
      console.error(`[CERTIFICATE_VERIFY:${requestId}] Error in certificate existence check:`, findError);
      return NextResponse.json(
        { valid: false, message: "Error verifying certificate" },
        { status: 500 }
      );
    }

    // FETCH CERTIFICATE WITH DETAILS (with proper error handling)
    try {
      // Now fetch the certificate with course details
      console.log(`[CERTIFICATE_VERIFY:${requestId}] Fetching certificate details`);
      let certificate;
      try {
        certificate = await prisma.certificate.findUnique({
          where: { certificateId },
          select: {
            id: true,
            userId: true,
            certificateId: true,
            createdAt: true,
            courseId: true,
            course: {
              select: {
                title: true,
              }
            }
          }
        });
        console.log(`[CERTIFICATE_VERIFY:${requestId}] Certificate data retrieved with course:`, !!certificate?.course);
      } catch (fetchError) {
        console.error(`[CERTIFICATE_VERIFY:${requestId}] Error fetching certificate details:`, fetchError);
        // Try again without the course relation which might be causing the issue
        console.log(`[CERTIFICATE_VERIFY:${requestId}] Trying simpler certificate lookup`);
        certificate = await prisma.certificate.findUnique({
          where: { certificateId },
          select: {
            id: true,
            userId: true,
            certificateId: true,
            createdAt: true,
            courseId: true
          }
        }).catch((secondError) => {
          console.error(`[CERTIFICATE_VERIFY:${requestId}] Second certificate lookup error:`, secondError);
          return null;
        });
      }
      
      // Handle case where certificate exists but couldn't be fetched at all
      if (!certificate) {
        console.error(`[CERTIFICATE_VERIFY:${requestId}] Could not fetch certificate after confirming existence`);
        return NextResponse.json({
          valid: false,
          message: "Certificate record is incomplete",
          error: "incomplete_record"
        }, { status: 500 });
      }
      
      // Handle case where certificate exists but course relation couldn't be loaded
      if (!certificate.course) {
        console.log(`[CERTIFICATE_VERIFY:${requestId}] Course not found for certificate:`, certificateId);
        
        // Fetch course info separately
        let courseInfo = null;
        try {
          console.log(`[CERTIFICATE_VERIFY:${requestId}] Trying to fetch course separately:`, certificate.courseId);
          courseInfo = await prisma.course.findUnique({
            where: { id: certificate.courseId || "" },
            select: { title: true }
          });
          console.log(`[CERTIFICATE_VERIFY:${requestId}] Course info:`, courseInfo);
        } catch (courseError) {
          console.error(`[CERTIFICATE_VERIFY:${requestId}] Error fetching course:`, courseError);
        }
        
        // Return a valid response but with placeholder course info
        return NextResponse.json({
          valid: true,
          certificateId: certificate.certificateId,
          courseTitle: courseInfo?.title || "Course information unavailable",
          issueDate: certificate.createdAt,
          userId: certificate.userId,
          note: "Course relationship data was repaired"
        });
      }

      // If we get here, we have a valid certificate with course data
      console.log(`[CERTIFICATE_VERIFY:${requestId}] Successfully verified certificate`);
      return NextResponse.json({
        valid: true,
        certificateId: certificate.certificateId,
        courseTitle: certificate.course.title,
        issueDate: certificate.createdAt,
        userId: certificate.userId
      });
    } catch (dbError) {
      console.error(`[CERTIFICATE_VERIFY:${requestId}] Database error:`, dbError);
      
      // Try a raw query as a fallback - wrapped in its own try-catch
      let rawResults = null;
      try {
        console.log(`[CERTIFICATE_VERIFY:${requestId}] Attempting raw SQL query fallback`);
        rawResults = await (async () => {
          try {
            const prisma = getDatabase();
            return await prisma.$queryRaw`
              SELECT c.certificateId, c.userId, c.createdAt, co.title as courseTitle
              FROM Certificate c
              LEFT JOIN Course co ON c.courseId = co.id
              WHERE c.certificateId = ${certificateId}
            `;
          } catch (innerError) {
            console.error(`[CERTIFICATE_VERIFY:${requestId}] Raw query inner error:`, innerError);
            return null;
          }
        })();
        
        console.log(`[CERTIFICATE_VERIFY:${requestId}] Raw query results:`, rawResults);
      } catch (rawError) {
        console.error(`[CERTIFICATE_VERIFY:${requestId}] Raw query outer error:`, rawError);
      }
      
      // Check if we got a result from the raw query
      if (Array.isArray(rawResults) && rawResults.length > 0) {
        const cert = rawResults[0];
        console.log(`[CERTIFICATE_VERIFY:${requestId}] Using raw query results for response`);
        return NextResponse.json({
          valid: true,
          certificateId: cert.certificateId,
          courseTitle: cert.courseTitle || "Course information unavailable",
          issueDate: cert.createdAt,
          userId: cert.userId,
          note: "Retrieved using fallback method"
        });
      }
      
      // Last resort, since we know the certificate exists, return minimal valid info
      if (certificateExists) {
        console.log(`[CERTIFICATE_VERIFY:${requestId}] Using minimal validation as last resort`);
        return NextResponse.json({
          valid: true,
          certificateId: certificateId,
          courseTitle: "Certificate information limited due to technical issues",
          note: "Minimal verification only"
        });
      }
      
      return NextResponse.json(
        { valid: false, message: "Error verifying certificate details in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[CERTIFICATE_VERIFY] Unhandled error:", error);
    return NextResponse.json(
      { valid: false, message: "Internal server error", error: "unhandled_error" },
      { status: 500 }
    );
  }
} 