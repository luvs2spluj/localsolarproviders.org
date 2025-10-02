import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Test the exact Supabase URL and keys from the linter output
    const supabaseUrl = 'https://qktumtzgbwsprueqqhsr.supabase.co'
    
    // Test with the new anon key
    const testAnonKey = 'tQw1RTmzurTIYYbg7CnT9Q_3ZiNHEqm'
    
    const supabase = createClient(supabaseUrl, testAnonKey)
    
    // Test a simple query to see what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .limit(10)
    
    // Test querying the solar_providers table
    const { data: providers, error: providersError } = await supabase
      .from('solar_providers')
      .select('*')
      .limit(1)
    
    // Test querying with schema prefix
    const { data: providersSchema, error: providersSchemaError } = await supabase
      .from('solarreviews.solar_providers')
      .select('*')
      .limit(1)

    return NextResponse.json({
      supabaseUrl,
      testAnonKey: testAnonKey.substring(0, 20) + '...',
      tables: {
        data: tables,
        error: tablesError?.message
      },
      solar_providers: {
        data: providers,
        error: providersError?.message
      },
      solarreviews_solar_providers: {
        data: providersSchema,
        error: providersSchemaError?.message
      },
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
