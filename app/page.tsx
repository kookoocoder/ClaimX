"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, X, FileUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import type { Session } from '@supabase/supabase-js'
import Header from "@/components/header"
import Footer from "@/components/footer"
import FeatureSection from "@/components/feature-section"
import { storeImage, fileToDataUrl, storeFileAsDataUrl } from "@/lib/imageStorage"

// Helper function for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatusText, setUploadStatusText] = useState("Uploading...")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const analysisTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription?.unsubscribe()
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [supabase, previewUrl])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleLoginRedirect = () => {
    router.push('/auth')
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    validateAndSetFile(droppedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    setError(null)

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, GIF)")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit")
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const newPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(newPreviewUrl)
    setFile(file)
  }

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setFile(null)
    setError(null)
    setIsUploading(false)
    setUploadProgress(0)
    setUploadStatusText("Uploading...")
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
    else return (bytes / 1048576).toFixed(2) + " MB"
  }

  const handleAnalyze = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)
    setUploadStatusText("Initiating analysis...")

    if (analysisTimeoutRef.current) {
       clearTimeout(analysisTimeoutRef.current);
    }

    try {
      // Store the image for reliable access in results page
      // Store as data URL (most reliable method)
      if (file) {
        try {
          // Primary storage as data URL
          await storeFileAsDataUrl(file, "uploadedImageData")
          console.log("Image stored as data URL successfully")
          
          // Backup storage as blob URL
          if (previewUrl) {
            storeImage(previewUrl)
          }
        } catch (err) {
          console.error("Failed to store image:", err)
          // Continue anyway, the analysis can still work
        }
      }

      const formData = new FormData()
      formData.append("file", file)

      analysisTimeoutRef.current = window.setTimeout(() => {
        setUploadProgress(5);
        setUploadStatusText("Uploading image...");
        analysisTimeoutRef.current = window.setTimeout(() => {
          setUploadProgress(25);
          setUploadStatusText("Analyzing image content (Agent 1)... ");
          analysisTimeoutRef.current = window.setTimeout(() => {
            setUploadProgress(50);
            setUploadStatusText("Matching against dataset (Agent 2)...");
            analysisTimeoutRef.current = window.setTimeout(() => {
              setUploadProgress(75);
              setUploadStatusText("Finding closest match (Agent 3)...");
               analysisTimeoutRef.current = window.setTimeout(() => {
                  setUploadProgress(90);
                  setUploadStatusText("Generating final analysis (Agent 4)...");
               }, 4000);
            }, 5000);
          }, 3000);
        }, 500);
      }, 100);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (analysisTimeoutRef.current) {
         clearTimeout(analysisTimeoutRef.current);
      }

      if (!response.ok) {
        setUploadProgress(0) 
        setUploadStatusText("Error")
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || "Failed to analyze image")
      }

      const result = await response.json()
      localStorage.setItem("analysisResult", JSON.stringify(result))
      
      setUploadProgress(100)
      setUploadStatusText("Analysis complete!")
      
      analysisTimeoutRef.current = window.setTimeout(() => {
        router.push("/results")
      }, 700)

    } catch (err) {
      console.error("Error analyzing image:", err)
      setError((err as Error).message || "An unexpected error occurred during analysis")
      setIsUploading(false)
      setUploadProgress(0)
      setUploadStatusText("Error during analysis")
      if (analysisTimeoutRef.current) {
         clearTimeout(analysisTimeoutRef.current);
      }
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <Header />
      <main className="flex-1 flex flex-col pt-28 pb-16">
        <div className="absolute top-4 right-8">
          {session ? (
            <Button
              variant="outline"
              className="h-7 rounded-full bg-transparent border border-purple-300/50 hover:bg-purple-500/10 text-purple-200 px-3 text-xs"
              onClick={handleLogout}
              aria-label="Logout"
            >
              Logged In (Login)
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-7 rounded-full bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-red-200 px-3 text-xs"
              onClick={handleLoginRedirect}
              aria-label="Login"
            >
              Logged Out (Login)
            </Button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center w-full px-4 flex-1">
          <div className="text-center mb-10 relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200 bg-clip-text text-transparent tracking-tight mb-2">
              ClaimX
            </h1>
            <p className="text-xl text-purple-100/90 mt-2">AI-powered meme authorship attribution</p>
          </div>
          
          <Card className="w-full max-w-2xl shadow-xl border-0 rounded-xl bg-white/40 relative overflow-hidden backdrop-blur-md mx-auto transform transition-all mt-64 mb-1">
            <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/30 to-white/10 pointer-events-none"></div>
            <div className="absolute -inset-1 bg-gradient-to-b from-white/30 to-transparent rounded-xl blur-sm"></div>
            <CardHeader className="text-center pb-2 relative z-10">
              <div className="mx-auto mb-4 w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                <FileUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Upload your meme
              </CardTitle>
              <CardDescription className="text-gray-500 mt-1">We'll determine its rightful creator</CardDescription>
            </CardHeader>
            <CardContent className="pb-3 relative z-10">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div
                className={`relative mt-1 rounded-xl border-2 border-dashed p-6 transition-all duration-200 ease-in-out backdrop-blur-md overflow-hidden ${
                  isDragging
                    ? "border-purple-400 bg-purple-50"
                    : file
                      ? "border-purple-300 bg-white/50"
                      : "border-gray-300 hover:border-purple-400 bg-white/40"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/20 to-transparent pointer-events-none"></div>
                <div className="flex flex-col items-center justify-center gap-2 text-center relative z-10">
                  {!file ? (
                    <>
                      <Upload className={`h-10 w-10 ${isDragging ? "text-purple-500" : "text-gray-400"}`} />
                      <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-gray-700">Drag & drop your meme here</p>
                        <p className="text-xs text-gray-500">or</p>
                        <label
                          htmlFor="file-upload"
                          className="mt-1 cursor-pointer rounded-md bg-white px-3 py-1 text-xs font-semibold text-purple-500 shadow-sm ring-1 ring-inset ring-purple-200 hover:bg-purple-50"
                        >
                          Choose file
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">(Max file size: 10 MB)</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center w-full pt-6">
                      <div className="relative w-full max-w-[300px] aspect-square mb-3">
                        <Image
                          src={previewUrl || "/placeholder.svg"}
                          alt="Preview"
                          fill
                          className="object-contain rounded-md"
                        />
                      </div>
                      <div className="flex items-center justify-between w-full bg-white/70 rounded-md p-2 shadow-sm border border-white/50">
                        <div className="truncate flex-1 mr-3">
                          <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={removeFile}
                          className="h-8 w-8 text-gray-500 hover:text-red-500"
                          aria-label="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1 font-medium text-gray-600">
                    <span>{uploadStatusText}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" aria-label="Upload progress" />
                </div>
              )}
            </CardContent>
            <CardFooter className="relative z-10">
              <Button
                className="w-full bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white shadow-md relative overflow-hidden group px-6 py-3 text-base font-medium"
                disabled={!file || isUploading}
                onClick={handleAnalyze}
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10">{isUploading ? "Analyzing..." : "Analyze Meme"}</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <FeatureSection />
      </main>
      <Footer />
    </div>
  )
}
