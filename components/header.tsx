"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error logging out:", error)
    }
    router.push('/auth')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-purple-900/50 backdrop-blur-md border-b border-purple-800/30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-purple-300 mr-8">
            claimX
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-purple-100 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/analyze" className="text-purple-100 hover:text-white transition-colors">
              Analyze
            </Link>
          </nav>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="text-purple-100 hover:text-white hover:bg-purple-800/50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  )
} 