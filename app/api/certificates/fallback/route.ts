import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@clerk/nextjs';

// This is a simple fallback endpoint that doesn't require database access
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const certificateId = searchParams.get('id');
    
    if (!certificateId) {
      return NextResponse.json({ 
        valid: false, 
        message: "Certificate ID is required" 
      }, { status: 400 });
    }
    
    // Log the request for diagnostics
    console.log(`[CERTIFICATE_FALLBACK] Verifying certificate: ${certificateId}`);
    
    // Get auth info for admin-only features
    const { userId } = auth();
    
    // Create a simple response with diagnostic info
    const response = {
      valid: true, // Assume valid for testing
      certificateId,
      message: "This is a fallback verification endpoint for diagnostic purposes",
      serverInfo: {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime()
      },
      requestInfo: {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries(req.headers)
      }
    };
    
    // Add additional diagnostic information for administrators
    if (userId) {
      try {
        // Add environment info (safe parts only)
        const envInfo = {
          NODE_ENV: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL,
          NEXT_RUNTIME: process.env.NEXT_RUNTIME
        };
        
        response.adminInfo = {
          userId,
          envInfo
        };
      } catch (error) {
        console.error("Error adding admin info:", error);
      }
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("[CERTIFICATE_FALLBACK] Error:", error);
    return NextResponse.json({
      valid: false,
      message: "Error in fallback verification",
      error: String(error)
    }, { status: 500 });
  }
} 