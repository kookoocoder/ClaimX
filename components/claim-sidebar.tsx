"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

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
        setBody(emailData.body)
        
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
    // Open Gmail compose window with prefilled draft
    const to = "ip@instagram.com"
    const su = encodeURIComponent(subject)
    const bd = encodeURIComponent(body)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bd}`
    window.open(gmailUrl, '_blank')
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Copyright Claim Email
          </SheetTitle>
          <SheetDescription>
            Create a professional copyright claim email to send to Instagram.
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            {isGenerating ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input
                id="subject"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="resize-none"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Content</Label>
            {isGenerating ? (
              <div className="space-y-2">
                <Skeleton className="h-[200px] w-full" />
                <div className="text-sm text-muted-foreground animate-pulse">
                  Generating email content...
                </div>
              </div>
            ) : (
              <Textarea
                id="body"
                placeholder="Email content"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            )}
          </div>
        </div>

        <SheetFooter className="pt-2">
          <Button
            variant="outline"
            onClick={generateClaimEmail}
            disabled={isGenerating}
          >
            Regenerate
          </Button>
          <Button 
            variant="default"
            onClick={handleSend}
            disabled={isGenerating || !subject || !body}
            className="w-full mt-4"
          >
            <Send className="mr-2 h-4 w-4" />
            Send to Instagram Support
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
