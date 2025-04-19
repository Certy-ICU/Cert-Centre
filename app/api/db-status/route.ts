import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDirectPrismaClient } from '@/lib/db-direct';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    // Check standard db instance
    let globalDbStatus = 'unavailable';
    let globalDbError = null;
    
    if (db) {
      try {
        // Test simple connection
        globalDbStatus = 'initialized';
        
        if (typeof db.$queryRaw === 'function') {
          await db.$queryRaw`SELECT 1`;
          globalDbStatus = 'connected';
        }
      } catch (error) {
        globalDbError = String(error);
        globalDbStatus = 'error';
      }
    }
    
    // Check direct db instance
    let directDbStatus = 'unavailable';
    let directDbError = null;
    let directDb = null;
    
    try {
      directDb = getDirectPrismaClient();
      directDbStatus = 'initialized';
      
      if (directDb && typeof directDb.$queryRaw === 'function') {
        await directDb.$queryRaw`SELECT 1`;
        directDbStatus = 'connected';
      }
    } catch (error) {
      directDbError = String(error);
      directDbStatus = 'error';
    }
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      global: {
        status: globalDbStatus,
        error: globalDbError,
        initialized: !!db,
        hasQueryRaw: !!db && typeof db.$queryRaw === 'function',
        hasCertificateModel: !!db && !!db.certificate
      },
      direct: {
        status: directDbStatus,
        error: directDbError,
        initialized: !!directDb,
        hasQueryRaw: !!directDb && typeof directDb.$queryRaw === 'function',
        hasCertificateModel: !!directDb && !!directDb.certificate
      },
      recommendation: directDbStatus === 'connected' ? 'direct' : 
                      globalDbStatus === 'connected' ? 'global' : 'none'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: String(error)
    }, { status: 500 });
  }
} 