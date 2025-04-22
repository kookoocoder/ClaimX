import React from "react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-purple-900/50 backdrop-blur-sm border-t border-purple-800/30 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-xl font-bold text-purple-300">
              claimX
            </Link>
            <p className="text-purple-200 text-sm mt-1">
              AI-powered meme authorship attribution
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-8 text-center md:text-left">
            <Link href="/privacy" className="text-purple-200 hover:text-white text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-purple-200 hover:text-white text-sm">
              Terms of Service
            </Link>
            <Link href="/about" className="text-purple-200 hover:text-white text-sm">
              About
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-purple-800/30 text-center">
          <p className="text-purple-300 text-xs">
            &copy; {new Date().getFullYear()} ClaimX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 