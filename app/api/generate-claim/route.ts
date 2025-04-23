import { NextRequest, NextResponse } from "next/server"
import { generateCopyrightClaimEmail } from "@/lib/gemini"

// Set the runtime to nodejs instead of edge
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  // Helper function to create a fallback response
  const createFallbackResponse = (originalError?: string) => {
    return {
      subject: "Copyright Claim for Instagram Content",
      body: `Dear Instagram Support Team,

I am writing to file a copyright claim regarding content that has been posted on your platform without my authorization.

The post in question appears to have been copied from my original content that was first published on [Original Upload Date] at [Original Post URL].

This unauthorized use violates my exclusive rights as the copyright owner. I request that you take immediate action to remove this infringing content.

Thank you for your prompt attention to this matter.

Sincerely,
[Your Name]`,
      _error: originalError || "Using fallback template due to API limitations"
    }
  }

  try {
    // Parse request
    const data = await req.json()
    const { originalAnalysis, finalMatch } = data

    // Validate the input data
    if (!originalAnalysis || !finalMatch) {
      return NextResponse.json(
        { 
          ...createFallbackResponse("Missing required data"),
          _error: "Missing required analysis data"
        },
        { status: 200 }
      )
    }

    // Check API key (just for logging purposes)
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.warn("Warning: GOOGLE_AI_API_KEY is not set")
      return NextResponse.json({
        ...createFallbackResponse("API key not configured"),
        _error: "Gemini API key not configured. Please add GOOGLE_AI_API_KEY to your environment variables."
      })
    }

    try {
      // Get Gemini response
      const result = await generateCopyrightClaimEmail(originalAnalysis, finalMatch)
      
      // If result has the expected structure, return it
      if (result && result.subject && result.body) {
        return NextResponse.json(result)
      } else {
        // If response is missing required fields, use fallback
        return NextResponse.json({
          ...createFallbackResponse("Invalid response format"),
          _error: "Gemini didn't return proper email format"
        })
      }
    } catch (apiError: any) {
      console.error("Gemini API error:", apiError)
      return NextResponse.json({
        ...createFallbackResponse(),
        _error: `API error: ${apiError?.message || "Unknown error"}`
      })
    }
  } catch (requestError: any) {
    console.error("Request parsing error:", requestError)
    return NextResponse.json({
      ...createFallbackResponse(),
      _error: `Request error: ${requestError?.message || "Invalid request format"}`
    })
  }
}
