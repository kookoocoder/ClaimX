'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

export default function AuthPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/') // Redirect to home page if already logged in
      }
    }

    checkSession()

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN') {
        router.push('/') // Redirect to home on sign in
      } else if (event === 'SIGNED_OUT') {
        // Optionally handle sign out, e.g., redirect to login
        // router.push('/auth') // Stay on auth page or redirect as needed
      }
    })

    // Cleanup the listener on component unmount
    return () => {
      authListener?.unsubscribe()
    }
  }, [supabase, router])

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-gray-100 p-4 animate-gradient-x">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          theme="light"
          view="sign_in" // Can be 'sign_in' or 'sign_up' initially
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`}
          onlyThirdPartyProviders={false}
          // You can add social providers like this:
          // providers={['google', 'github']}
        />
      </div>
    </div>
  )
} 