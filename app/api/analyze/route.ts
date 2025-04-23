import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  analyzeMediaWithGemini,
  matchDescriptionWithDataset, 
  findClosestMatch, 
  generateMatchAnalysis 
} from "@/lib/gemini";

// Define types for dataset items
interface DatasetItem {
  id: number;
  creator_username: string;
  upload_date: string;
  image_url: string;
  post_link: string;
  description: string;
  created_at: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vwtdxwcxsqqsrikuyaxf.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Convert file to base64 for analysis
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = file.type;
    
    // Step 1: Agent 1 - Analyze media and generate description
    console.log(`Starting Agent 1: Media Analysis (${mimeType})`);
    const agent1Result = await analyzeMediaWithGemini(base64, mimeType);
    console.log("Agent 1 Analysis completed");
    
    // Step 2: Agent 2 - Match description against dataset
    console.log("Starting Agent 2: Dataset Matching");
    // Fetch dataset from Supabase
    const { data: dataset, error } = await supabase
      .from("dataset")
      .select("*");
    
    if (error) throw error;
    
    const agent2Result = await matchDescriptionWithDataset(agent1Result.description, dataset || []);
    console.log("Agent 2 Matching completed, found", agent2Result.matchCount, "potential matches");
    
    // Step 3: Agent 3 - Analyze matches to find the closest one
    console.log("Starting Agent 3: Finding Closest Match");
    const agent3Result = await findClosestMatch(agent1Result.description, agent2Result.matches);
    console.log("Agent 3 Closest match identified with similarity score:", agent3Result.similarityScore);
    
    // Step 4: Agent 4 - Generate match percentage and description
    console.log("Starting Agent 4: Generating Match Analysis");
    const agent4Result = await generateMatchAnalysis(agent1Result.description, agent3Result.finalMatch);
    console.log("Agent 4 Analysis completed with match percentage:", agent4Result.matchPercentage);
    
    // Return the final result
    return NextResponse.json({
      success: true,
      originalAnalysis: agent1Result,
      matches: agent2Result.matches.map((match: DatasetItem) => ({
        id: match.id,
        creator: match.creator_username,
        uploadDate: match.upload_date,
        imageUrl: match.image_url,
        postLink: match.post_link
      })),
      finalMatch: {
        id: agent3Result.finalMatch.id,
        creator: agent3Result.finalMatch.creator_username,
        description: agent3Result.finalMatch.description,
        uploadDate: agent3Result.finalMatch.upload_date,
        imageUrl: agent3Result.finalMatch.image_url,
        postLink: agent3Result.finalMatch.post_link,
        explanation: agent3Result.explanation,
        similarityScore: agent3Result.similarityScore
      },
      matchResult: {
        percentage: agent4Result.matchPercentage,
        features: agent4Result.matchingFeatures,
        creatorStyle: agent4Result.creatorStyle,
        explanation: agent4Result.confidenceExplanation
      }
    });
    
  } catch (error) {
    console.error("Error processing media:", error);
    return NextResponse.json(
      { error: "Failed to process media", details: (error as Error).message },
      { status: 500 }
    );
  }
} 