"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, User, Calendar, Hash, Percent, Info, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function Results() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [confidenceScore, setConfidenceScore] = useState(0)

  useEffect(() => {
    // Simulate loading and animating the confidence score
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    const scoreInterval = setInterval(() => {
      setConfidenceScore((prev) => {
        if (prev >= 97) {
          clearInterval(scoreInterval)
          return 97
        }
        return prev + 1
      })
    }, 20)

    return () => {
      clearTimeout(timer)
      clearInterval(scoreInterval)
    }
  }, [])

  const getConfidenceColor = (score: number) => {
    if (score < 50) return "text-red-500"
    if (score < 80) return "text-yellow-500"
    return "text-green-500"
  }

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
                <Image
                  src="/placeholder.svg?height=400&width=400"
                  alt="Analyzed meme"
                  fill
                  className="object-contain"
                />
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
              <CardDescription>We found a high confidence match for this meme</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                  <TabsTrigger value="similarity">Similarity</TabsTrigger>
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
                          <p className="text-base font-semibold">@CreatorX</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date & Time</p>
                          <p className="text-base font-semibold">04/22/2025 14:30 IST</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Hash className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Mentions</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-700">
                              @CreatorX
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-700">
                              #meme
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-700">
                              #trending
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-full">
                          <Percent className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Match Type</p>
                          <p className="text-base font-semibold text-green-600">Exact Match</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-full">
                          <Info className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Description</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">
                          This meme was created by @CreatorX and first posted on April 22, 2025. The image contains
                          unique watermarking patterns and stylistic elements that match the creator's signature style
                          with 97% confidence.
                        </p>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Technical Details</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="font-medium">Format:</span> PNG
                          </div>
                          <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="font-medium">Size:</span> 1.98 MB
                          </div>
                          <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="font-medium">Dimensions:</span> 1200x800
                          </div>
                          <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="font-medium">Created:</span> 04/22/2025
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="heatmap" className="pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Feature Heatmap</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-sm">
                              This heatmap shows areas of the image that contributed most to the attribution decision.
                              Brighter areas had more influence on the final result.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-yellow-500/40 to-red-500/60 rounded-lg" />
                      <Image
                        src="/placeholder.svg?height=400&width=600"
                        alt="Heatmap visualization"
                        fill
                        className="object-cover mix-blend-overlay"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Key Features Detected</h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            Watermark pattern
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                            Text styling
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            Color palette
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            Image composition
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Confidence by Feature</h4>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs">
                              <span>Watermark</span>
                              <span>98%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full animate-grow-width origin-left transition-all duration-1000"
                                style={{ width: "98%" }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs">
                              <span>Text Style</span>
                              <span>95%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-500 rounded-full animate-grow-width origin-left transition-all duration-1000 delay-100"
                                style={{ width: "95%" }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs">
                              <span>Color Palette</span>
                              <span>92%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full animate-grow-width origin-left transition-all duration-1000 delay-200"
                                style={{ width: "92%" }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs">
                              <span>Composition</span>
                              <span>89%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full animate-grow-width origin-left transition-all duration-1000 delay-300"
                                style={{ width: "89%" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="similarity" className="pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Similarity Analysis</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Your Uploaded Meme</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src="/placeholder.svg?height=300&width=300"
                              alt="Uploaded meme"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Original by @CreatorX</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src="/placeholder.svg?height=300&width=300"
                              alt="Original meme"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium mb-2">Similarity Metrics</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Visual Similarity</span>
                            <span className="font-medium">97%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-grow-width origin-left transition-all duration-1000"
                              style={{ width: "97%" }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Text Content</span>
                            <span className="font-medium">100%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-grow-width origin-left transition-all duration-1000 delay-100"
                              style={{ width: "100%" }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Metadata Match</span>
                            <span className="font-medium">94%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-grow-width origin-left transition-all duration-1000 delay-200"
                              style={{ width: "94%" }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Style Fingerprint</span>
                            <span className="font-medium">98%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-grow-width origin-left transition-all duration-1000 delay-300"
                              style={{ width: "98%" }}
                            />
                          </div>
                        </div>
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
