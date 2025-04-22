"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, User, Calendar, Hash, Percent, Info, Download, Share2, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

interface MatchResult {
  percentage: number;
  features: string[];
  creatorStyle: string;
  explanation: string;
}

interface FinalMatch {
  id: number;
  creator: string;
  description: string;
  uploadDate: string;
  imageUrl: string;
  postLink: string;
  explanation: string;
  similarityScore: number;
}

interface AnalysisResult {
  originalAnalysis: {
    description: string;
    textContent: string;
    visualElements: string[];
    theme: string;
  };
  matches: any[];
  finalMatch: FinalMatch;
  matchResult: MatchResult;
}

export default function Results() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoaded, setIsLoaded] = useState(false)
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get the analysis result from local storage
    const storedResult = localStorage.getItem("analysisResult")
    if (storedResult) {
      const parsedResult = JSON.parse(storedResult)
      setAnalysisResult(parsedResult)
      
      // Get the uploaded image from local storage
      const uploadedImage = localStorage.getItem("uploadedImage")
      if (uploadedImage) {
        setImageUrl(uploadedImage)
      }
      
      // Simulate loading and animating the confidence score
      const score = parsedResult.matchResult.percentage || 97
      const timer = setTimeout(() => {
        setIsLoaded(true)
        setIsLoading(false)
      }, 500)

      const scoreInterval = setInterval(() => {
        setConfidenceScore((prev) => {
          if (prev >= score) {
            clearInterval(scoreInterval)
            return score
          }
          return prev + 1
        })
      }, 20)

      return () => {
        clearTimeout(timer)
        clearInterval(scoreInterval)
      }
    } else {
      // If no analysis result, redirect to home
      router.push("/")
    }
  }, [router])

  const getConfidenceColor = (score: number) => {
    if (score < 50) return "text-red-500"
    if (score < 80) return "text-yellow-500"
    return "text-green-500"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date"
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-gray-100 p-4 md:p-8 animate-gradient-x">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 shadow-xl border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Meme Analysis</CardTitle>
                <CardDescription>AI-powered attribution results</CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="relative aspect-square w-full mb-4 bg-gray-200 rounded-lg" />
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-500">Confidence Score</span>
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-2.5 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Processing Results
                </CardTitle>
                <CardDescription>Analyzing your uploaded meme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  if (!analysisResult) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-gray-100 p-4 md:p-8 animate-gradient-x">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 shadow-xl border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">Meme Analysis</CardTitle>
              <CardDescription>AI-powered attribution results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square w-full mb-4 bg-gray-100 rounded-lg overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Analyzed meme"
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-400">No image available</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-500">Confidence Score</span>
                    <span className={`text-lg font-bold ${getConfidenceColor(confidenceScore)}`}>
                      {confidenceScore}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-1000 ease-out"
                      style={{
                        width: `${confidenceScore}%`,
                        opacity: isLoaded ? 1 : 0,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Share2 className="h-4 w-4 mr-1" /> Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Attribution Results
              </CardTitle>
              <CardDescription>
                {confidenceScore > 90 
                  ? "We found a high confidence match for this meme" 
                  : confidenceScore > 70 
                    ? "We found a good match for this meme" 
                    : "We found a possible match for this meme"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="comparison">Comparison</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Creator</p>
                          <p className="text-base font-semibold">@{analysisResult.finalMatch.creator}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date & Time</p>
                          <p className="text-base font-semibold">{formatDate(analysisResult.finalMatch.uploadDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-full">
                          <Link className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Original Post</p>
                          <a 
                            href={analysisResult.finalMatch.postLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-base font-semibold text-blue-600 hover:underline"
                          >
                            View Source
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-full">
                          <Percent className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Match Type</p>
                          <p className={`text-base font-semibold ${getConfidenceColor(confidenceScore)}`}>
                            {confidenceScore > 90 
                              ? "Exact Match" 
                              : confidenceScore > 70 
                                ? "Strong Match" 
                                : "Possible Match"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Matching Features</p>
                        <div className="space-y-2">
                          {analysisResult.matchResult.features.map((feature, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded border border-gray-200">
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="comparison" className="pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Visual Comparison</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-sm">
                              This comparison shows the uploaded meme alongside the matched meme to help visualize the similarities.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Your Uploaded Meme</p>
                        <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt="Your uploaded meme"
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="text-gray-400">No image available</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Matched Meme</p>
                        <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={analysisResult.finalMatch.imageUrl}
                            alt="Matched meme"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 font-medium mb-2">Similarity Assessment</p>
                      <p className="text-sm text-gray-700">
                        {analysisResult.finalMatch.explanation || 
                          "The analysis shows significant similarities between your uploaded meme and the matched original."}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Creator Style Analysis</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">
                          {analysisResult.matchResult.creatorStyle || 
                            `@${analysisResult.finalMatch.creator}'s meme style typically features distinctive visual elements and text formatting.`}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Visual Elements Detected</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.originalAnalysis.visualElements.map((element, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-700">
                            {element}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Text Content</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">
                          {analysisResult.originalAnalysis.textContent || "No text content was detected in this meme."}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Theme Analysis</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">
                          {analysisResult.originalAnalysis.theme || "The theme could not be determined."}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="pt-6">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => router.push("/")}
              >
                Analyze Another Meme
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
