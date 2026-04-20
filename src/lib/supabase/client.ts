import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from '@/lib/demo/mock-client'

const isDemo =
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? '').trim() === 'true' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  if (isDemo) {
    return createMockClient()
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
