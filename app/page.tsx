"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, X, FileUp, AlertCircle, Shield, Database, Workflow, Sparkles, Lock, LogIn } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

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
  const [isLoading, setIsLoading] = useState(true)
  const [highlightUpload, setHighlightUpload] = useState(false)
  const analysisTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setIsLoading(false)
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
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
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

  const scrollToUploadWithHighlight = () => {
    // Highlight the upload card
    setHighlightUpload(true);
    
    // Scroll to it
    document.getElementById('upload-card')?.scrollIntoView({ behavior: 'smooth' });
    
    // Clear any existing timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    // Remove the highlight after 2 seconds
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightUpload(false);
    }, 2000);
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
      <div className="absolute inset-0 bg-slate-900/30 pointer-events-none z-[-5]"></div>
      <Header />
      <main className="flex-1 flex flex-col pt-16 pb-16">


        {/* Hero Section */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20 flex flex-col md:flex-row items-center animate-in fade-in duration-1000">
          <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0 relative z-10">
            <Badge className="mb-4 bg-slate-700/60 hover:bg-slate-700/80 text-slate-100 py-1 px-3 rounded-full text-xs" variant="outline">
              AI-Powered Digital Attribution
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-100 tracking-tight mb-4 animate-in slide-in-from-left duration-1000">
              ClaimX
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mt-2 mb-8 max-w-xl animate-in slide-in-from-left duration-1000 delay-200">
              {session 
                ? "Ready to analyze your content? Upload an image to check for potential plagiarism." 
                : "Verify content ownership and detect plagiarism with state-of-the-art AI technology."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center mt-8 mb-6 animate-in slide-in-from-bottom duration-1000 delay-300">
              <Button 
                className="bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 shadow-sm rounded-full px-8 py-6 text-lg"
                onClick={scrollToUploadWithHighlight}
              >
                {session ? "Upload Content" : "Get Started"}
              </Button>
              {session ? (
                <Button 
                  variant="outline" 
                  className="bg-transparent text-slate-200 border-slate-600 hover:bg-slate-800/50 rounded-full px-8 py-6 text-lg"
                  onClick={() => router.push('/results')}
                >
                  View Results
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="bg-transparent text-slate-200 border-slate-600 hover:bg-slate-800/50 rounded-full px-8 py-6 text-lg"
                  onClick={() => {
                    // Scroll to features section
                    const featuresSection = document.querySelector('#features-section');
                    if (featuresSection) {
                      featuresSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Learn More
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-3 mt-10 text-slate-400 text-sm animate-in fade-in duration-1000 delay-500">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-slate-300" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-slate-300" />
                <span>Vast Content Library</span>
              </div>
              <div className="flex items-center">
                <Workflow className="h-5 w-5 mr-2 text-slate-300" />
                <span>Real-Time Results</span>
              </div>
            </div>
          </div>
          
          <div id="upload-card" className="md:w-1/2 relative animate-in fade-in slide-in-from-right duration-1000 delay-200">
            <motion.div
              animate={highlightUpload ? { 
                scale: [1, 1.02, 1],
                boxShadow: ["0 0 0 rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.5)", "0 0 0 rgba(255,255,255,0)"]
              } : {}}
              transition={{ duration: 1.5 }}
              className="w-full relative"
            >
              <Card className={`w-full shadow-xl border-0 rounded-xl bg-slate-800/40 backdrop-blur-sm border transition-all overflow-hidden ${
                highlightUpload ? "border-slate-400/80" : "border-slate-700/50"
              }`}>
                <CardHeader className="text-center pb-4 relative z-10 border-b border-slate-700/30">
                  <div className={`mx-auto mb-4 w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 ${
                    highlightUpload ? "from-blue-600/80 to-blue-800/80 animate-pulse" : "from-slate-700/80 to-slate-900/80"
                  }`}>
                    <FileUp className="h-8 w-8 text-slate-200" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-100 mb-2">
                    {isLoading ? "Loading..." : session ? "Upload your content" : "Login Required"}
                  </CardTitle>
                  <CardDescription className="text-slate-300 mt-1 mb-1 text-base">
                    {isLoading ? "Please wait..." : session 
                      ? "We'll determine its rightful creator with our AI technology" 
                      : "Please login to use our plagiarism detection tool"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 relative z-10 pt-6">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-300"></div>
                    </div>
                  ) : session ? (
                    <>
                      <div
                        className={`relative mt-1 rounded-xl border-2 border-dashed p-6 transition-all duration-300 ease-in-out backdrop-blur-sm overflow-hidden ${
                          isDragging
                            ? "border-slate-400 bg-slate-700/30 scale-[1.01]"
                            : file
                              ? "border-slate-600/70 bg-slate-800/30"
                              : "border-slate-600/50 hover:border-slate-500/70 bg-slate-800/20 hover:bg-slate-800/30"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-center relative z-10">
                          {!file ? (
                            <>
                              <div className="p-4 rounded-full bg-slate-700/40 mb-3 shadow-lg transform transition-all duration-300 hover:scale-110">
                                <Upload className={`h-8 w-8 ${isDragging ? "text-slate-300" : "text-slate-400"}`} />
                              </div>
                              <div className="flex flex-col items-center">
                                <p className="text-base font-medium text-slate-200">Drag & drop your content here</p>
                                <p className="text-sm text-slate-400 mb-2">or</p>
                                <label
                                  htmlFor="file-upload"
                                  className="mt-1 cursor-pointer rounded-lg bg-gradient-to-br from-slate-700/70 to-slate-800/70 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-slate-200 shadow-lg ring-1 ring-inset ring-slate-600/50 hover:bg-slate-700/60 transition-all duration-300 hover:shadow-xl hover:scale-105"
                                >
                                  Choose file
                                </label>
                              </div>
                              <p className="text-xs text-slate-400 mt-4">(Max file size: 10 MB)</p>
                            </>
                          ) : (
                            <div className="flex flex-col items-center w-full pt-3">
                              <div className="relative w-full max-w-[320px] aspect-square mb-5 overflow-hidden rounded-lg shadow-lg border border-slate-700/50">
                                <Image
                                  src={previewUrl || "/placeholder.svg"}
                                  alt="Preview"
                                  fill
                                  className="object-contain rounded-lg"
                                />
                              </div>
                              <div className="flex items-center justify-between w-full bg-slate-800/40 backdrop-blur-sm rounded-lg p-4 shadow-md border border-slate-700/50">
                                <div className="truncate flex-1 mr-3">
                                  <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                                  <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={removeFile}
                                  className="h-8 w-8 text-slate-400 hover:text-red-400 transition-colors"
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
                        <div className="mt-6">
                          <div className="flex justify-between text-xs mb-2 font-medium text-slate-300">
                            <span>{uploadStatusText}</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2.5 bg-slate-700/30" aria-label="Upload progress" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="p-4 rounded-full bg-slate-700/40 mb-5 shadow-lg">
                        <Lock className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-slate-300 mb-6 text-center max-w-md">
                        You need to be logged in to use our plagiarism detection tool. Login to access all features and start analyzing your content.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="relative z-10 border-t border-slate-700/30 p-6">
                  {isLoading ? (
                    <Button 
                      className="w-full bg-slate-700/60 text-slate-400 cursor-not-allowed shadow-lg h-12 text-base rounded-lg"
                      disabled
                    >
                      Loading...
                    </Button>
                  ) : session ? (
                    <Button
                      className="w-full bg-gradient-to-r from-slate-700/80 to-slate-800/80 backdrop-blur-sm hover:from-slate-600/80 hover:to-slate-700/80 text-white shadow-lg h-12 text-base rounded-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]"
                      disabled={!file || isUploading}
                      onClick={handleAnalyze}
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      <span className="relative z-10">{isUploading ? "Analyzing..." : "Analyze Content"}</span>
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-gradient-to-r from-slate-700/80 to-slate-800/80 backdrop-blur-sm hover:from-slate-600/80 hover:to-slate-700/80 text-white shadow-lg h-12 text-base rounded-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]"
                      onClick={handleLoginRedirect}
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      <span className="relative z-10">Login to Continue</span>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-20 mb-16 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 md:p-6 text-center">
              <div className="text-4xl md:text-5xl font-bold text-slate-100 mb-2">99%</div>
              <p className="text-slate-400 text-sm">Detection Accuracy</p>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 md:p-6 text-center">
              <div className="text-4xl md:text-5xl font-bold text-slate-100 mb-2">5M+</div>
              <p className="text-slate-400 text-sm">Content Analyzed</p>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 md:p-6 text-center">
              <div className="text-4xl md:text-5xl font-bold text-slate-100 mb-2">3s</div>
              <p className="text-slate-400 text-sm">Average Analysis Time</p>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 md:p-6 text-center">
              <div className="text-4xl md:text-5xl font-bold text-slate-100 mb-2">24/7</div>
              <p className="text-slate-400 text-sm">System Availability</p>
            </div>
          </div>
        </div>
        
        <FeatureSection />
      </main>
      <Footer />
    </div>
  )
}
