import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Define createClient function for server-side usage using Server Components/Route Handlers
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Provide only the 'get' method for Server Components/Route Handlers
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // 'set' and 'remove' are handled by the middleware
      },
    }
  )
} 