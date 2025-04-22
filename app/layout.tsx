import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import SplineBackground from "@/components/SplineBackground"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ClaimX - AI-powered meme authorship attribution",
  description: "Attribute memes to their rightful creators using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className}`}>
        <SplineBackground />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
