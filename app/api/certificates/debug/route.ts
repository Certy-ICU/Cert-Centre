import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDirectPrismaClient } from '@/lib/db-direct';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs';

// Get a reliable database connection
const getDatabase = (): PrismaClient => {
  // Try the global DB instance first
  if (db && typeof db.certificate?.findUnique === 'function') {
    console.log("[CERTIFICATE_DEBUG] Using global DB instance");
    return db;
  }
  
  // Fall back to direct Prisma client
  console.log("[CERTIFICATE_DEBUG] Falling back to direct DB instance");
  return getDirectPrismaClient();
};

// Check if database is properly connected
const isDbConnected = () => {
  try {
    const client = getDatabase();
    return !!client && !!client.$connect;
  } catch (error) {
    console.error("DB connection check error:", error);
    return false;
  }
};

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const certificateId = searchParams.get('id');
    
    // Get Prisma client
    let prisma: PrismaClient;
    try {
      prisma = getDatabase();
      console.log("[CERTIFICATE_DEBUG] Database client initialized");
    } catch (dbInitError) {
      console.error("[CERTIFICATE_DEBUG] Database initialization error:", dbInitError);
      
      return NextResponse.json({
        status: "error",
        message: "Could not initialize database client",
        error: String(dbInitError),
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Test database connection
    const dbConnected = await testDbConnection(prisma);
    console.log("[CERTIFICATE_DEBUG] Database connected:", dbConnected);

    // If database isn't connected, return diagnostic info
    if (!dbConnected) {
      return NextResponse.json({
        status: "warning",
        dbConnected: false,
        message: "Database connection failed",
        dbObject: !!prisma,
        userId,
        prismaInfo: {
          hasDb: !!prisma,
          hasQueryRaw: !!(prisma && prisma.$queryRaw),
          hasCertificateModel: !!(prisma && prisma.certificate)
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Get schema info
    let tableInfo;
    try {
      tableInfo = await getTableInfo(prisma);
    } catch (schemaError) {
      console.error("Error getting schema info:", schemaError);
      tableInfo = { error: String(schemaError) };
    }
    
    let certificateData = null;
    
    if (certificateId) {
      try {
        // Try to fetch the specific certificate
        certificateData = await prisma.certificate.findUnique({
          where: { certificateId },
          include: {
            course: true
          }
        });
      } catch (error) {
        console.error("Error fetching certificate:", error);
        certificateData = { error: String(error) };
      }
    }
    
    // Get all certificates for the current user
    let userCertificates = [];
    try {
      userCertificates = await prisma.certificate.findMany({
        where: { userId },
        select: {
          id: true,
          certificateId: true,
          courseId: true,
          createdAt: true
        }
      });
    } catch (certError) {
      console.error("Error fetching user certificates:", certError);
    }
    
    // Fetch courses for each certificate
    let certificatesWithCourses = [];
    try {
      certificatesWithCourses = await Promise.all(
        userCertificates.map(async (cert) => {
          try {
            const course = await prisma.course.findUnique({
              where: { id: cert.courseId },
              select: { title: true }
            });
            
            return {
              ...cert,
              courseTitle: course?.title || 'Unknown Course'
            };
          } catch (error) {
            return {
              ...cert,
              courseTitle: 'Error fetching course',
              error: String(error)
            };
          }
        })
      );
    } catch (coursesError) {
      console.error("Error mapping certificates to courses:", coursesError);
    }
    
    // Try to get raw certificate count
    let rawCertificateCount = 0;
    try {
      const countResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Certificate WHERE userId = ${userId}`;
      if (Array.isArray(countResult) && countResult.length > 0) {
        rawCertificateCount = countResult[0].count;
      }
    } catch (countError) {
      console.error("Error getting raw certificate count:", countError);
    }
    
    return NextResponse.json({
      status: "success",
      dbConnected,
      tableInfo,
      certificateCount: userCertificates.length,
      rawCertificateCount,
      certificates: certificatesWithCourses,
      requestedCertificate: certificateData,
      userId,
      dbClientType: db === prisma ? "global" : "direct",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[CERTIFICATE_DEBUG]", error);
    return NextResponse.json({ 
      status: "error", 
      error: String(error),
      message: "An error occurred in the debug endpoint",
      dbAvailable: isDbConnected(),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function testDbConnection(prisma: PrismaClient) {
  if (!prisma) {
    return false;
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

async function getTableInfo(prisma: PrismaClient) {
  try {
    // Try to get Certificate table info
    const certificateColumns = await prisma.$queryRaw`
      SHOW COLUMNS FROM Certificate
    `;
    
    return {
      certificate: certificateColumns
    };
  } catch (error) {
    console.error("Error getting table info:", error);
    return { error: String(error) };
  }
} 