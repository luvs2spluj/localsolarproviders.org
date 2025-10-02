import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Test different Supabase configurations
    const configs = [
      {
        name: 'EnergyDaddy JWT',
        url: 'https://qktumtzgbwsprueqqhsr.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdHVtdHpnYndzcHJ1ZXFxaHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MzQ4NzMsImV4cCI6MjA1MTMxMDg3M30.tQw1RTmzurTIYYbg7CnT9Q_3ZiNHEqm'
      },
      {
        name: 'EnergyDaddy Legacy',
        url: 'https://qktumtzgbwsprueqqhsr.supabase.co',
        anonKey: 'tQw1RTmzurTIYYbg7CnT9Q_3ZiNHEqm'
      },
      {
        name: 'Environment Variables',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    ]

    const results = []

    for (const config of configs) {
      if (!config.url || !config.anonKey) {
        results.push({
          name: config.name,
          success: false,
          error: 'Missing URL or key'
        })
        continue
      }

      try {
        const supabase = createClient(config.url, config.anonKey)
        
        // Test a simple query
        const { data, error } = await supabase
          .from('solar_providers')
          .select('count')
          .limit(1)

        results.push({
          name: config.name,
          success: !error,
          error: error?.message,
          data: data ? 'Query successful' : 'No data'
        })
      } catch (err) {
        results.push({
          name: config.name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      results,
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
