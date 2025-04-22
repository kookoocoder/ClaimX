import React from "react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-800/50 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-xl font-bold text-slate-200">
              ClaimX
            </Link>
            <p className="text-slate-400 text-sm mt-1">
              AI-powered content authorship attribution
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-8 text-center md:text-left">
            <Link href="/privacy" className="text-slate-400 hover:text-white text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white text-sm">
              Terms of Service
            </Link>
            <Link href="/about" className="text-slate-400 hover:text-white text-sm">
              About
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-slate-800/30 text-center">
          <p className="text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} ClaimX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 