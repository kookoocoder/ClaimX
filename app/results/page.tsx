"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, User, Calendar, Hash, Info, Download, Share2, Link, Mail, Loader2, Copy, FileSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { retrieveMediaUrl, validateMediaUrl, FALLBACK_MEDIA_URL, FALLBACK_IMAGE_URL, FALLBACK_VIDEO_URL } from "@/lib/mediaStorage"
import ReactMarkdown from "react-markdown"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { motion } from "framer-motion"
import { ClaimSidebar } from "@/components/claim-sidebar"
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, ExternalHyperlink, AlignmentType, WidthType, Table, TableRow, TableCell, VerticalAlign } from "docx"
import { saveAs } from 'file-saver'

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

interface PlagiarismRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
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

// Custom media component with fallback handling
const MediaWithFallback = ({ 
  src, 
  alt, 
  className = "",
  priority = false,
  onLoad,
  onError
}: { 
  src: string | null; 
  alt: string; 
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}) => {
  const [error, setError] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown');
  const [currentSrc, setCurrentSrc] = useState<string | null>(src);
  
  useEffect(() => {
    // Determine media type based on src
    if (src) {
      if (src.startsWith('data:video') || src.endsWith('.mp4')) {
        setMediaType('video');
      } else if (src.startsWith('data:image') || src.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        setMediaType('image');
      } else {
        // Basic check failed, attempt validation to determine type
        validateMediaUrl(src).then((isValid: boolean) => {
          if (isValid) {
             // How to determine type if basic check failed but validates?
             // Assume image for now, might need more robust type detection
             console.warn(`Could not determine media type for ${src.substring(0,30)}, assuming image.`);
             setMediaType('image');
          } else {
             setMediaType('unknown');
             handleError(); // Treat as error if validation fails
          }
        });
      }
    } else {
      setMediaType('unknown');
    }
    setCurrentSrc(src); // Update current source when src prop changes
    setError(false); // Reset error state when src changes
  }, [src]);
  
  const handleError = () => {
    console.warn(`Media failed to load: ${currentSrc?.substring(0, 30)}...`);
    setError(true);
    onError?.();
  };
  
  const handleLoad = () => {
    console.log(`Media loaded successfully: ${alt}`);
    setError(false); // Reset error on successful load
    onLoad?.();
  };
  
  const fallbackSrc = mediaType === 'video' ? FALLBACK_VIDEO_URL : FALLBACK_IMAGE_URL;
  const finalSrc = error || !currentSrc ? fallbackSrc : currentSrc;
  const finalAlt = error || !currentSrc ? `${alt} (fallback)` : alt;

  if (mediaType === 'video') {
    return (
      <video
        src={finalSrc}
        // controls // Add controls if needed
        autoPlay
        muted // Muted autoplay is usually allowed
        loop
        playsInline
        className={className}
        onLoadedData={handleLoad} // Use onLoadedData for video
        onError={handleError}
        // title={finalAlt} // Use title attribute for accessibility
      />
    );
  } else if (mediaType === 'image') {
    return (
      <Image
        src={finalSrc}
        alt={finalAlt}
        fill
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        priority={priority}
      />
    );
  } else {
    // Render fallback image if type is unknown or there was an initial error
    return (
       <Image
         src={FALLBACK_MEDIA_URL}
         alt={`${alt} (fallback - unknown type)`}
         fill
         className={className}
         priority={priority}
      />
    )
  }
};

// Results component wrapper with Suspense
function ResultsPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <Results />
    </Suspense>
  )
}

// Loading UI component
function LoadingUI() {
  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <div className="absolute inset-0 bg-slate-900/30 pointer-events-none z-[-5]"></div>
      <main className="flex-1 flex flex-col pt-20 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-[70vh]">
              <p className="text-xl text-slate-300">Loading results...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper function to fetch image data as ArrayBuffer
async function fetchImageBuffer(url: string): Promise<ArrayBuffer | undefined> {
  try {
    if (url.startsWith('data:image')) {
      // Handle data URLs
      const base64 = url.split(',')[1];
      if (!base64) return undefined;
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } else if (url.startsWith('http')) {
       // Handle regular URLs (potential CORS issues)
       // Using a proxy might be needed for external URLs if CORS blocks direct fetch
      console.log("Fetching image from URL:", url);
      const response = await fetch(url); // Consider adding { mode: 'cors' } or needing a proxy
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.statusText}`);
        return undefined;
      }
      return await response.arrayBuffer();
    } else {
       console.warn("Unsupported image URL format:", url);
       return undefined;
    }
  } catch (error) {
    console.error("Error fetching image buffer:", error);
    return undefined;
  }
}

function Results() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoaded, setIsLoaded] = useState(false)
  const [plagiarismScore, setPlagiarismScore] = useState(0)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaFallback, setMediaFallback] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [plagiarismRegions, setPlagiarismRegions] = useState<PlagiarismRegion[]>([])
  const [isPlagiarismLoading, setIsPlagiarismLoading] = useState(false)
  const [isClaimOpen, setIsClaimOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // Function to handle media load errors
  const handleMediaError = () => {
    console.warn("Media failed to load, using fallback")
    setMediaFallback(true)
  }

  useEffect(() => {
    // Get the analysis result from local storage
    const storedResult = localStorage.getItem("analysisResult")
    if (storedResult) {
      const parsedResult = JSON.parse(storedResult)
      setAnalysisResult(parsedResult)
      
      // Get the uploaded media using our utility
      const loadMedia = async () => {
        try {
          console.log("Attempting to load uploaded media")
          
          // Retrieve media URL (handles data/blob/too_large)
          let uploadedMedia = retrieveMediaUrl("uploadedMediaData")
          
          if (uploadedMedia) {
            console.log(`Found media URL: ${uploadedMedia.substring(0, 30)}...`)
            setMediaUrl(uploadedMedia)
            
            // Validate the URL
            if (uploadedMedia !== "DATA_URL_TOO_LARGE") {
              const isValid = await validateMediaUrl(uploadedMedia)
              if (!isValid) {
                console.warn("Retrieved media failed validation, using fallback")
                setMediaFallback(true)
                setMediaUrl(FALLBACK_MEDIA_URL) // Explicitly set fallback URL
              } else {
                setMediaFallback(false)
              }
            } else {
               // Handle case where data URL was too large
               console.warn("Media data was too large for storage, using fallback display.");
               setMediaFallback(true);
               setMediaUrl(FALLBACK_MEDIA_URL);
            }

          } else {
            console.warn("No media URL found in storage, using fallback")
            setMediaFallback(true)
            setMediaUrl(FALLBACK_MEDIA_URL)
          }
        } catch (error) {
          console.error("Error loading media:", error)
          setMediaFallback(true)
          setMediaUrl(FALLBACK_MEDIA_URL)
        }
      }
      
      loadMedia()
      
      // Simulate loading and animating the plagiarism score
      const score = parsedResult.matchResult.percentage || 97
      const timer = setTimeout(() => {
        setIsLoaded(true)
        setIsLoading(false)
      }, 500)

      const scoreInterval = setInterval(() => {
        setPlagiarismScore((prev) => {
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

  const getPlagiarismColor = (score: number) => {
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

  // --- Export Functionality ---
  const handleExport = async () => {
    if (!analysisResult) return;
    setIsExporting(true);
    console.log("Starting export...");

    try {
      const { finalMatch, matchResult, originalAnalysis } = analysisResult;
      const uploadedMediaType = mediaUrl?.startsWith('data:video') || mediaUrl?.endsWith('.mp4') ? 'video' : 'image';
      // Determine original media type (assuming image if imageUrl is present)
      const originalMediaType = finalMatch.imageUrl ? (finalMatch.imageUrl.endsWith('.mp4') ? 'video' : 'image') : 'unknown'; 
      
      // --- Define Document Structure ---
      const docSections = [];

      // Title
      docSections.push(
        new Paragraph({ 
          heading: HeadingLevel.TITLE, 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "ClaimX Analysis Report", bold: true, size: 44 })],
          spacing: { after: 400 },
        })
      );

      // Summary Table
      docSections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("Analysis Summary")],
          spacing: { before: 300, after: 200 },
        })
      );
      const summaryTable = new Table({
         width: { size: 100, type: WidthType.PERCENTAGE },
         rows: [
            new TableRow({
               children: [
                  new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({children: [new TextRun({ text: "Plagiarism Score:", bold: true })]})] }),
                  new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph(`${plagiarismScore}%`)] }),
               ],
            }),
            new TableRow({
               children: [
                  new TableCell({ children: [new Paragraph({children: [new TextRun({ text: "Original Creator:", bold: true })]})] }),
                  new TableCell({ children: [new Paragraph(`@${finalMatch.creator}`)] }),
               ],
            }),
             new TableRow({
               children: [
                  new TableCell({ children: [new Paragraph({children: [new TextRun({ text: "Original Upload Date:", bold: true })]})] }),
                  new TableCell({ children: [new Paragraph(formatDate(finalMatch.uploadDate))] }),
               ],
            }),
            new TableRow({
               children: [
                  new TableCell({ children: [new Paragraph({children: [new TextRun({ text: "Original Source:", bold: true })]})] }),
                  new TableCell({ children: [
                     new Paragraph({ children: [
                         finalMatch.postLink ? new ExternalHyperlink({
                            children: [ new TextRun({ text: finalMatch.postLink, style: "Hyperlink" }) ],
                            link: finalMatch.postLink,
                         }) : new TextRun("N/A"),
                     ]}),
                  ]}),
               ],
            }),
         ],
      });
      docSections.push(summaryTable);

      // Media Comparison Section
      docSections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("Media Comparison")],
          spacing: { before: 400, after: 200 },
        })
      );
      
      const comparisonTable = new Table({
         columnWidths: [4500, 4500],
         width: { size: 100, type: WidthType.PERCENTAGE },
         rows: [
            // Headers
            new TableRow({
               children: [
                  new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Your Uploaded Content", bold: true })] })] }),
                  new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Detected Original Content", bold: true })] })] }),
               ]
            }),
            // Media Row (Text Placeholders and Links)
            new TableRow({
               children: [
                  // Uploaded Media Cell
                  new TableCell({
                      verticalAlign: VerticalAlign.TOP,
                      children: [
                          new Paragraph(`(${uploadedMediaType === 'video' ? 'Video' : 'Image'} Uploaded)`),
                          // Add link if mediaUrl exists
                          mediaUrl && !mediaUrl.startsWith('data:') ? new Paragraph({ 
                              alignment: AlignmentType.CENTER,
                              children: [ new ExternalHyperlink({ children: [ new TextRun({ text: "View Uploaded Media", style: "Hyperlink" }) ], link: mediaUrl }) ]
                          }) : new Paragraph("(Preview not available)") 
                      ]
                  }),
                  // Original Media Cell
                  new TableCell({
                     verticalAlign: VerticalAlign.TOP,
                     children: [
                          new Paragraph(`(Original ${originalMediaType === 'video' ? 'Video' : originalMediaType === 'image' ? 'Image' : 'Media'})`),
                          // Add link if imageUrl exists
                          finalMatch.imageUrl && !finalMatch.imageUrl.startsWith('data:') ? new Paragraph({ 
                              alignment: AlignmentType.CENTER,
                              children: [ new ExternalHyperlink({ children: [ new TextRun({ text: "View Original Media", style: "Hyperlink" }) ], link: finalMatch.imageUrl }) ]
                          }) : new Paragraph("(Preview not available)"),
                          // Add link to post source
                          finalMatch.postLink ? new Paragraph({ 
                              alignment: AlignmentType.CENTER,
                              children: [ new TextRun("Source Post: "), new ExternalHyperlink({ children: [ new TextRun({ text: "Link", style: "Hyperlink" }) ], link: finalMatch.postLink }) ]
                          }) : new Paragraph("") 
                     ]
                  }),
               ]
            })
         ]
      });
      docSections.push(comparisonTable);
      
       // Detailed Analysis Section
      docSections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("Detailed Analysis")],
          spacing: { before: 400, after: 200 },
        })
      );
      docSections.push(new Paragraph({ children: [new TextRun({ text: "Plagiarism Details:", bold: true })], spacing: { after: 100 } }));
      docSections.push(new Paragraph(originalAnalysis.description || "No description provided."));
      docSections.push(new Paragraph({ children: [new TextRun({ text: "Plagiarized Elements:", bold: true })], spacing: { before: 200, after: 100 } }));
      matchResult.features.forEach((feature: string) => docSections.push(new Paragraph({ text: `- ${feature}`, bullet: { level: 0 } })));
      docSections.push(new Paragraph({ children: [new TextRun({ text: "Original Creator Style:", bold: true })], spacing: { before: 200, after: 100 } }));
      docSections.push(new Paragraph(matchResult.creatorStyle || "N/A"));
      docSections.push(new Paragraph({ children: [new TextRun({ text: "Theme Analysis:", bold: true })], spacing: { before: 200, after: 100 } }));
      docSections.push(new Paragraph(originalAnalysis.theme || "N/A"));
      docSections.push(new Paragraph({ children: [new TextRun({ text: "Text Content:", bold: true })], spacing: { before: 200, after: 100 } }));
      docSections.push(new Paragraph(originalAnalysis.textContent || "N/A"));
       docSections.push(new Paragraph({ children: [new TextRun({ text: "Visual Elements Detected:", bold: true })], spacing: { before: 200, after: 100 } }));
      originalAnalysis.visualElements.forEach((element: string) => docSections.push(new Paragraph({ text: `- ${element}`, bullet: { level: 0 } })));
      docSections.push(new Paragraph({ children: [new TextRun({ text: "Match Explanation:", bold: true })], spacing: { before: 200, after: 100 } }));
      docSections.push(new Paragraph(finalMatch.explanation || "N/A"));
      docSections.push(new Paragraph({ children: [new TextRun({ text: "Confidence Explanation:", bold: true })], spacing: { before: 200, after: 100 } }));
      docSections.push(new Paragraph(matchResult.explanation || "N/A"));

      // --- Generate Document --- 
      console.log("Generating document content...");
      const doc = new Document({
        sections: [{ 
          properties: { }, // Add page margins, etc. if needed
          children: docSections 
        }],
        styles: {
           paragraphStyles: [
              {
                  id: "aside",
                  name: "Aside",
                  basedOn: "Normal",
                  next: "Normal",
                  run: { size: 20, italics: true, color: "555555" },
                  paragraph: { indent: { left: 720 }, spacing: { line: 276 } },
              },
           ]
        }
      });

      // --- Save Document ---
      console.log("Packing document...");
      const blob = await Packer.toBlob(doc);
      console.log("Triggering download...");
      saveAs(blob, "claimx_analysis_report.docx");

    } catch (error) {
      console.error("Export failed:", error);
      // Add user feedback here (e.g., toast notification)
    } finally {
      setIsExporting(false);
      console.log("Export finished.");
    }
  }
  // --- End Export Functionality ---

  if (isLoading) {
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
              <Button variant="ghost" className="mb-6 text-slate-300 hover:bg-slate-800/40 hover:text-white" onClick={() => router.push("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
              </Button>
              
              <Card className="border-0 shadow-xl rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
                <CardHeader className="pb-4 relative z-10 border-b border-slate-700/30">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-700/80 to-slate-900/80 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                    <Hash className="h-7 w-7 text-slate-200" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-100 text-center mb-1">ClaimX Analysis Dashboard</CardTitle>
                  <CardDescription className="text-slate-300 text-center">Processing your content analysis</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-white">Content Analysis</h3>
                      <Skeleton className="relative aspect-square w-full mb-4 bg-slate-700/50 rounded-lg" />
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-white">Plagiarism Score</span>
                          <Skeleton className="h-6 w-16 bg-slate-700/50" />
                        </div>
                        <Skeleton className="h-2.5 w-full bg-slate-700/50 rounded-full" />
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-6">
                      <h3 className="text-md font-medium text-white">Attribution Results</h3>
                      <div className="space-y-6">
                        <Skeleton className="h-6 w-3/4 bg-slate-700/50" />
                        <Skeleton className="h-6 w-full bg-slate-700/50" />
                        <Skeleton className="h-6 w-5/6 bg-slate-700/50" />
                        <Skeleton className="h-6 w-full bg-slate-700/50" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!analysisResult) return null

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
            <div className="flex justify-between items-center mb-6">
              <Button variant="ghost" className="text-slate-300 hover:bg-slate-800/40 hover:text-white" onClick={() => router.push("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/40 border-slate-700/50 text-slate-200 hover:bg-slate-700/50 hover:text-white"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
                <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700/50 text-slate-200 hover:bg-slate-700/50 hover:text-white">
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
                <Button variant="destructive" size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={() => setIsClaimOpen(true)}>
                  <Mail className="h-4 w-4 mr-1" /> Send Claim
                </Button>
              </div>
            </div>

            <Card className="border-0 shadow-xl rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 overflow-hidden mb-6">
              <CardHeader className="pb-4 border-b border-slate-700/30 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-100">
                    ClaimX Analysis Dashboard
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    {plagiarismScore > 90 
                      ? "High plagiarism detected" 
                      : plagiarismScore > 70 
                        ? "Substantial plagiarism detected" 
                        : "Potential plagiarism identified"}
                  </CardDescription>
                </div>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex items-center gap-2"
                >
                  <div className="text-sm font-medium text-slate-300">Plagiarism Score:</div>
                  <div className={`text-lg font-bold px-3 py-1 rounded-full ${
                    plagiarismScore > 90 ? "bg-red-900/20 text-red-400" : 
                    plagiarismScore > 70 ? "bg-yellow-900/20 text-yellow-400" : 
                    "bg-green-900/20 text-green-400"
                  }`}>
                    {plagiarismScore}%
                  </div>
                </motion.div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                  <div className="md:col-span-1 p-6 border-r border-slate-700/30">
                    <div className="space-y-6">
                      <div className="relative aspect-square w-full mb-4 bg-slate-700/30 rounded-lg overflow-hidden shadow-lg border border-slate-700/50">
                        <MediaWithFallback
                          src={mediaUrl}
                          alt="Analyzed content"
                          className="object-contain"
                          onError={handleMediaError}
                          priority
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-300">Plagiarism Level</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-700/40 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ 
                                width: `${plagiarismScore}%`, 
                                opacity: 1 
                              }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className={`h-full rounded-full ${
                                plagiarismScore > 90 ? "bg-red-500" : 
                                plagiarismScore > 70 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-slate-700/30 pt-4 mt-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-900/30 p-2 rounded-full">
                              <User className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-400">Original Creator</p>
                              <p className="text-sm font-semibold text-slate-200">@{analysisResult.finalMatch.creator}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="bg-purple-900/30 p-2 rounded-full">
                              <Calendar className="h-4 w-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-400">Original Date</p>
                              <p className="text-sm font-semibold text-slate-200">{formatDate(analysisResult.finalMatch.uploadDate)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-900/30 p-2 rounded-full">
                              <Link className="h-4 w-4 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-400">Original Source</p>
                              <a 
                                href={analysisResult.finalMatch.postLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                View Source
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3 border-t md:border-t-0">
                    <Tabs defaultValue="details" className="w-full">
                      <div className="border-b border-slate-700/30">
                        <div className="px-6">
                          <TabsList className="grid w-full grid-cols-3 mt-1 bg-slate-800/50">
                            <TabsTrigger value="details" className="data-[state=active]:bg-slate-700/80 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-blue-400 text-slate-300 hover:text-white transition-all">Details</TabsTrigger>
                            <TabsTrigger value="comparison" className="data-[state=active]:bg-slate-700/80 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-blue-400 text-slate-300 hover:text-white transition-all">Comparison</TabsTrigger>
                            <TabsTrigger value="analysis" className="data-[state=active]:bg-slate-700/80 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-blue-400 text-slate-300 hover:text-white transition-all">Analysis</TabsTrigger>
                          </TabsList>
                        </div>
                      </div>

                      <TabsContent value="details" className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3 text-slate-100">Plagiarism Details</h3>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-amber-900/40 to-amber-700/30 p-2.5 rounded-full shadow-lg shadow-amber-900/10 border border-amber-600/20 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                                  <Copy className={`h-5 w-5 drop-shadow-sm ${
                                    plagiarismScore > 90 ? "text-red-400" : 
                                    plagiarismScore > 70 ? "text-yellow-400" : "text-green-400"
                                  }`} />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-400">Plagiarism Type</p>
                                  <p className={`text-sm font-semibold ${
                                    plagiarismScore > 90 ? "text-red-400" : 
                                    plagiarismScore > 70 ? "text-yellow-400" : "text-green-400"
                                  }`}>
                                    {plagiarismScore > 90 
                                      ? "Direct Copy" 
                                      : plagiarismScore > 70 
                                        ? "Major Plagiarism" 
                                        : "Minor Plagiarism"}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg border border-slate-700/50 shadow-md">
                                <p className="text-sm font-medium text-slate-200 mb-2">Plagiarism Assessment</p>
                                <div className="prose prose-sm max-w-none text-slate-300 prose-headings:text-slate-200 prose-strong:text-slate-200">
                                  <ReactMarkdown>
                                    {analysisResult.originalAnalysis.description || 
                                      `## Key Findings
                                      
* **Plagiarism Level**: ${plagiarismScore > 90 ? "**Direct Copy**" : plagiarismScore > 70 ? "**Substantial Plagiarism**" : "**Minor Plagiarism**"}
* **Similarity**: ${plagiarismScore}% match to original
${analysisResult.matchResult.features?.length > 0 ? 
`* **Plagiarized Elements**:
  * ${analysisResult.matchResult.features[0] || "Visual composition matches original"}
  ${analysisResult.matchResult.features[1] ? `* ${analysisResult.matchResult.features[1]}` : ''}
  ${analysisResult.matchResult.features[2] ? `* ${analysisResult.matchResult.features[2]}` : ''}` : 
`* **Detected Pattern**: Similar visual composition and style`}`}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-3 text-slate-100">Plagiarized Elements</h3>
                            <div className="space-y-2">
                              {analysisResult.matchResult.features.map((feature, index) => (
                                <motion.div 
                                  key={index} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                                  className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-lg border border-slate-700/50 shadow-md"
                                >
                                  <span className="text-sm text-slate-300">{feature}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="comparison" className="p-6">
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-100">Visual Comparison</h3>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-700/50">
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                                  <p className="max-w-xs text-sm">
                                    This comparison shows your uploaded content alongside the original content to help visualize the similarities.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-slate-300 mb-2">Your Uploaded Content</p>
                              <div className="relative aspect-video w-full bg-slate-800/60 backdrop-blur-sm rounded-lg overflow-hidden shadow-md border border-slate-700/50">
                                <MediaWithFallback
                                  src={mediaUrl}
                                  alt="Your uploaded content"
                                  className="object-contain"
                                  onError={handleMediaError}
                                  priority
                                />
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-slate-300 mb-2">Original Content</p>
                              <div className="relative aspect-video w-full bg-slate-800/60 backdrop-blur-sm rounded-lg overflow-hidden shadow-md border border-slate-700/50">
                                <MediaWithFallback
                                  src={analysisResult.finalMatch.imageUrl}
                                  alt="Original content"
                                  className="object-contain"
                                  priority
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg border border-slate-700/50 shadow-md">
                            <p className="text-sm font-medium text-slate-200 mb-2">Plagiarism Assessment</p>
                            <div className="prose prose-sm max-w-none text-slate-300 prose-headings:text-slate-200 prose-strong:text-slate-200">
                              <ReactMarkdown>
                                {analysisResult.finalMatch.explanation || 
                                  `## Key Findings
                                  
* **Plagiarism Level**: ${plagiarismScore > 90 ? "**Direct Copy**" : plagiarismScore > 70 ? "**Substantial Plagiarism**" : "**Minor Plagiarism**"}
* **Similarity**: ${plagiarismScore}% match to original
${analysisResult.matchResult.features?.length > 0 ? 
`* **Plagiarized Elements**:
  * ${analysisResult.matchResult.features[0] || "Visual composition matches original"}
  ${analysisResult.matchResult.features[1] ? `* ${analysisResult.matchResult.features[1]}` : ''}
  ${analysisResult.matchResult.features[2] ? `* ${analysisResult.matchResult.features[2]}` : ''}` : 
`* **Detected Pattern**: Similar visual composition and style`}`}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="analysis" className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3 text-slate-100">Original Creator Style</h3>
                            <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg border border-slate-700/50 shadow-md">
                              <p className="text-sm text-slate-300">
                                {analysisResult.matchResult.creatorStyle || 
                                  `@${analysisResult.finalMatch.creator}'s style typically features distinctive visual elements and text formatting.`}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-3 text-slate-100">Theme Analysis</h3>
                            <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg border border-slate-700/50 shadow-md">
                              <p className="text-sm text-slate-300">
                                {analysisResult.originalAnalysis.theme || "The theme could not be determined."}
                              </p>
                            </div>
                          </div>

                          <div className="lg:col-span-2">
                            <h3 className="text-lg font-semibold mb-3 text-slate-100">Visual Elements Detected</h3>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.originalAnalysis.visualElements.map((element, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 + 0.2 }}
                                >
                                  <Badge key={index} variant="outline" className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50 py-1.5">
                                    {element}
                                  </Badge>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          <div className="lg:col-span-2">
                            <h3 className="text-lg font-semibold mb-3 text-slate-100">Text Content</h3>
                            <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg border border-slate-700/50 shadow-md">
                              <p className="text-sm text-slate-300">
                                {analysisResult.originalAnalysis.textContent || "No text content was detected in this content."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-700/30 p-6">
                <div className="w-full flex justify-between items-center">
                  <p className="text-sm text-slate-400">
                    Analysis performed on {new Date().toLocaleDateString()}
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-slate-700/80 to-slate-800/80 backdrop-blur-sm hover:from-slate-600/80 hover:to-slate-700/80 text-white shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]"
                    onClick={() => router.push("/")}
                  >
                    Analyze New Content
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
      {analysisResult && (
        <ClaimSidebar
          open={isClaimOpen}
          setOpen={setIsClaimOpen}
          originalAnalysis={analysisResult.originalAnalysis}
          finalMatch={analysisResult.finalMatch}
        />
      )}
      <Footer />
    </div>
  )
}

// Export the wrapper component instead
export default ResultsPage;
