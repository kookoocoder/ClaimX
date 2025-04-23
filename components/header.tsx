"use client"

import React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut, User, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [email, setEmail] = useState<string | null>(null)
  
  // Check if we're on the auth page
  const isAuthPage = pathname === '/auth'

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setEmail(session.user.email || null)
      } else {
        setEmail(null)
      }
    }
    
    getSession()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email || null)
    })
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error logging out:", error)
    }
    router.push('/auth')
  }

  const handleLogin = () => {
    router.push('/auth')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-slate-200 mr-8">
            ClaimX
          </Link>
        </div>
        
        {/* Hide auth buttons on auth page */}
        {!isAuthPage && (
          <div className="flex items-center gap-4">
            {email ? (
              <>
                <div className="flex items-center text-slate-300 text-sm">
                  <User className="h-4 w-4 mr-2 opacity-70" />
                  <span className="max-w-[200px] truncate">{email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout} 
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                onClick={handleLogin} 
                className="text-slate-300 hover:text-white hover:bg-slate-800/50"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  )
} 