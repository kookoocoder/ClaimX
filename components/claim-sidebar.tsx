"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Mail, Send, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface ClaimSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  originalAnalysis: any
  finalMatch: any
}

export function ClaimSidebar({ open, setOpen, originalAnalysis, finalMatch }: ClaimSidebarProps) {
  const [subject, setSubject] = useState<string>("")
  const [body, setBody] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generationComplete, setGenerationComplete] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Generate claim email when sidebar opens
  useEffect(() => {
    if (open && !generationComplete && !isGenerating) {
      generateClaimEmail()
    }
  }, [open])

  const generateClaimEmail = async () => {
    setError(null)
    setIsGenerating(true)
    setGenerationComplete(false)

    try {
      const response = await fetch("/api/generate-claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalAnalysis,
          finalMatch
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate claim email")
      }

      // Parse the JSON response
      const emailData = await response.json()
      
      // Update state with the email content
      if (emailData.subject && emailData.body) {
        setSubject(emailData.subject)
        
        // Add instructions about the image attachment
        const imageNote = "\n\n[IMPORTANT: I have attached the image in question to this email. The analysis performed by ClaimX confirms a plagiarism score of " + 
          (finalMatch?.similarityScore || "high") + "% match to the original content.]\n";
        
        setBody(emailData.body + imageNote)
        
        // If there was an error but we have fallback content, show a warning
        if (emailData._error) {
          setError(emailData._error)
        }
      } else {
        throw new Error("Invalid response format")
      }

      setGenerationComplete(true)
    } catch (error) {
      console.error("Error generating claim email:", error)
      setError(typeof error === 'object' && error !== null && 'message' in error 
        ? String(error.message) 
        : "Failed to generate claim email. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSend = () => {
    // Get the image from local storage for attachment reminder
    const uploadedImage = localStorage.getItem("uploadedImageData") || localStorage.getItem("uploadedImage")
    
    // Open Gmail compose window with prefilled draft
    const to = "ip@instagram.com"
    const su = encodeURIComponent(subject)
    const bd = encodeURIComponent(body)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bd}`
    window.open(gmailUrl, '_blank')
    
    toast({
      title: "Email draft opened",
      description: "Remember to manually attach your image before sending",
      variant: "default",
    })
    
    // Show additional detailed toast with instructions
    setTimeout(() => {
      toast({
        title: "Attachment reminder",
        description: "Gmail can't automatically attach files. Please manually add your uploaded image to the email before sending.",
        variant: "default",
        duration: 6000,
      })
    }, 500)
    
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="sm:max-w-md bg-slate-800/40 backdrop-blur-sm text-slate-200 border border-slate-700/50 p-6 rounded-lg shadow-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <SheetHeader className="pb-4 border-b border-slate-700/30 mb-4">
            <SheetTitle className="flex items-center gap-2 text-xl font-semibold text-slate-100">
              <div className="p-2 bg-gradient-to-br from-slate-700/80 to-slate-900/80 rounded-lg shadow-md">
                <Mail className="h-5 w-5 text-slate-200" />
              </div>
              Copyright Claim Email
            </SheetTitle>
            <SheetDescription className="text-slate-300 text-sm">
              Create a professional copyright claim email to send to Instagram.
            </SheetDescription>
          </SheetHeader>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 flex items-center gap-2 bg-red-900/20 border border-red-500/20 text-red-400 p-3 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 text-red-400" />
              <div className="text-sm">{error}</div>
            </motion.div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-slate-300 text-sm font-medium">Subject</Label>
              {isGenerating ? (
                <Skeleton className="h-10 w-full bg-slate-700/40 rounded-lg" />
              ) : (
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="resize-none bg-slate-800/50 text-slate-200 placeholder:text-slate-500 border border-slate-700/50 focus:border-slate-500 rounded-lg shadow-inner"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="body" className="text-slate-300 text-sm font-medium">Email Content</Label>
              {isGenerating ? (
                <div className="space-y-2">
                  <Skeleton className="h-[200px] w-full bg-slate-700/40 rounded-lg" />
                  <div className="text-sm text-slate-400 flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-4 w-4" />
                    </motion.div>
                    Generating email content...
                  </div>
                </div>
              ) : (
                <Textarea
                  id="body"
                  placeholder="Email content"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[200px] resize-none bg-slate-800/50 text-slate-200 placeholder:text-slate-500 border border-slate-700/50 focus:border-slate-500 rounded-lg shadow-inner"
                />
              )}
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-slate-700/30 flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              className="border-slate-700/50 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 hover:text-white transition-all duration-300"
              onClick={generateClaimEmail}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.div>
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
            <Button 
              variant="default"
              onClick={handleSend}
              disabled={isGenerating || !subject || !body}
              className="bg-gradient-to-r from-slate-700/80 to-slate-800/80 backdrop-blur-sm hover:from-slate-600/80 hover:to-slate-700/80 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] rounded-lg"
            >
              <Send className="mr-2 h-4 w-4" />
              Send to Instagram Support
            </Button>
          </SheetFooter>
          
          <div className="mt-4 text-xs text-slate-400 border-t border-slate-700/30 pt-4">
            <div className="flex items-center">
              <AlertCircle className="h-3 w-3 mr-2 text-amber-400" />
              <span>Important: You'll need to manually attach your image to the email before sending.</span>
            </div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}

