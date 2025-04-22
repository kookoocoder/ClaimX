'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, UserCheck } from 'lucide-react'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { motion } from 'framer-motion'

export default function AuthPage() {
  const supabase = createClient()
  const router = useRouter()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
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

  const goBack = () => {
    router.push('/')
  }

  // Determine the auth theme based on the site theme
  const authTheme = !mounted ? 'dark' : theme === 'dark' ? 'dark' : 'dark'

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <div className="absolute inset-0 bg-slate-900/30 pointer-events-none z-[-5]"></div>
      <Header />
      <main className="flex-1 flex flex-col pt-20 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-7xl mx-auto"
          >
            <Button 
              variant="ghost" 
              className="mb-8 text-slate-300 hover:bg-slate-800/40 hover:text-white"
              onClick={goBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>

            <div className="flex justify-center items-center min-h-[50vh]">
              <Card className="w-full max-w-md border-0 shadow-xl rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
                <CardHeader className="text-center border-b border-slate-700/30 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-700/80 to-slate-900/80 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                    <Lock className="h-8 w-8 text-slate-200" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-100 mb-2">
                    Welcome to ClaimX
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-base">
                    Sign in to access content attribution tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 relative z-10">
                  <Auth
                    supabaseClient={supabase}
                    appearance={{ 
                      theme: ThemeSupa,
                      variables: {
                        default: {
                          colors: {
                            brand: '#334155',
                            brandAccent: '#475569',
                            inputBackground: 'rgba(30, 41, 59, 0.5)',
                            inputBorder: '#475569',
                            inputBorderFocus: '#94a3b8',
                            inputBorderHover: '#94a3b8',
                            inputText: '#e2e8f0',
                            inputLabelText: '#e2e8f0',
                            inputPlaceholder: '#94a3b8',
                            messageText: '#e2e8f0',
                            messageTextDanger: '#f87171',
                            anchorTextColor: '#94a3b8',
                            anchorTextHoverColor: '#e2e8f0',
                          },
                          borderWidths: {
                            buttonBorderWidth: '1px',
                            inputBorderWidth: '1px',
                          },
                          radii: {
                            borderRadiusButton: '0.5rem',
                            buttonBorderRadius: '0.5rem',
                            inputBorderRadius: '0.5rem',
                          },
                          space: {
                            inputPadding: '0.75rem',
                            buttonPadding: '0.75rem',
                          },
                          fontSizes: {
                            baseButtonSize: '0.925rem',
                            baseInputSize: '0.925rem',
                            baseLabelSize: '0.875rem',
                          },
                        }
                      },
                      className: {
                        button: 'bg-gradient-to-r from-slate-700/80 to-slate-800/80 backdrop-blur-sm hover:from-slate-600/80 hover:to-slate-700/80 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] rounded-lg',
                        label: 'text-slate-300',
                        input: 'bg-slate-800/50 text-slate-200 placeholder:text-slate-500 focus:border-slate-500',
                        loader: 'text-slate-300',
                        anchor: 'text-slate-400 hover:text-slate-300',
                        divider: 'bg-slate-700/50',
                        message: 'text-slate-300',
                      }
                    }}
                    providers={[]}
                    theme={authTheme}
                    view="sign_in"
                    redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`}
                    onlyThirdPartyProviders={false}
                  />
                </CardContent>
                <CardFooter className="text-center text-sm text-slate-400 border-t border-slate-700/30 py-4">
                  Protected by ClaimX Authentication
                </CardFooter>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 