/**
 * Health Check API Endpoint
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import { db } from '../../../services/database.js';

export async function GET() {
  try {
    // Check database connection
    const dbHealth = await db.healthCheck();
    
    // Check OpenAI API key
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    
    // Check Supabase configuration
    const hasSupabaseConfig = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.status === 'connected' ? 'healthy' : 'unhealthy',
        openai: hasOpenAIKey ? 'configured' : 'missing',
        supabase: hasSupabaseConfig ? 'configured' : 'missing',
      },
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
    
    // Determine overall health
    const isHealthy = 
      dbHealth.status === 'connected' && 
      hasOpenAIKey && 
      hasSupabaseConfig;
    
    if (!isHealthy) {
      health.status = 'degraded';
    }
    
    return NextResponse.json(health, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}