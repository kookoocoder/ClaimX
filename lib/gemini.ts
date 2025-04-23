import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fs from "fs"
import path from "path"

// Initialize the Gemini API
const apiKey = process.env.GOOGLE_AI_API_KEY || "your-api-key";
const genAI = new GoogleGenerativeAI(apiKey);

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Agent 1: Analyze the image or video
export async function analyzeMediaWithGemini(base64Data: string, mimeType: string) {
  try {
    // Use a model that supports video input
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = `
    You are an AI specialized in analyzing visual media (images or videos), particularly memes. Please examine this media and provide:
    
    1. A detailed description of what's shown or happens in the media
    2. Any text found (visual text or spoken words if applicable)
    3. Key visual elements present (people, objects, scenes, actions, etc.)
    4. The overall theme or joke of the media
    
    Format your response as structured JSON with the following fields:
    - description: A detailed paragraph describing the whole media content
    - textContent: All text found in the media (visual or transcribed)
    - visualElements: Array of key visual elements or actions
    - theme: The main subject or joke
    `;
    
    const mediaPart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
    
    const result = await model.generateContent([prompt, mediaPart]);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Failed to parse JSON from Gemini response (Agent 1)", { text, error });
      // Fallback to structured response based on text
      return {
        description: text || "Analysis failed or returned empty response.",
        textContent: "Text extraction failed",
        visualElements: ["Unknown"],
        theme: "Unknown",
      };
    }
  } catch (error) {
    console.error("Error in analyzeMediaWithGemini:", error);
    throw new Error("Failed to analyze media with Gemini");
  }
}

// Agent 2: Match description with dataset
export async function matchDescriptionWithDataset(description: string, dataset: any[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    
    const datasetSummary = dataset.map((item, index) => `
    Item ${index + 1}:
    - Creator: ${item.creator_username ?? 'Unknown'}
    - Description: ${item.description?.substring(0, 300) ?? 'No description available'}...
    - Upload Date: ${item.upload_date ?? 'Unknown'}
    `).join("\n");
    
    const prompt = `
    You are an AI specialized in matching meme descriptions. I have a meme description and a dataset of known memes.
    
    Here's the description of the meme we're trying to match:
    "${description}"
    
    Here's a summary of my dataset:
    ${datasetSummary}
    
    From this dataset, identify the 2-5 most likely matches based on similarity of content, style, and theme.
    Explain why each is a potential match.
    
    Format your response as structured JSON with the following fields:
    - matches: Array of indices (starting from 1) of the best matches
    - explanations: Object with indices as keys and explanation strings as values
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Ensure parsed.matches is an array and filter out invalid indices
      const validIndices = Array.isArray(parsed.matches) 
        ? parsed.matches.map(Number).filter((index: number) => !isNaN(index) && index > 0 && index <= dataset.length)
        : [];

      const matchesItems = validIndices.map((index: number) => dataset[index - 1]);
      const explanations = parsed.explanations || {}; // Ensure explanations is an object

      return {
        matches: matchesItems,
        explanations: explanations,
        matchCount: matchesItems.length
      };
    } catch (error) {
      console.error("Failed to parse JSON from Gemini response for matching (Agent 2)", { text, error });
      // Fallback to top 3 items
      return {
        matches: dataset.slice(0, 3),
        explanations: { "1": "Automatic fallback match due to processing error" },
        matchCount: Math.min(3, dataset.length)
      };
    }
  } catch (error) {
    console.error("Error in matchDescriptionWithDataset:", error);
    throw new Error("Failed to match description with dataset");
  }
}

// Agent 3: Find closest match
export async function findClosestMatch(originalDescription: string, matches: any[]) {
  // Handle case where no matches were found by Agent 2
  if (!matches || matches.length === 0) {
    console.warn("No matches provided to findClosestMatch. Returning fallback.");
    return {
      finalMatch: { // Provide a fallback structure matching expected output
          id: -1,
          creator_username: 'Unknown',
          description: 'No match found',
          upload_date: new Date().toISOString(),
          image_url: '',
          post_link: '',
      },
      explanation: "No potential matches were identified in the previous step.",
      similarityScore: 0
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    
    const matchesDetails = matches.map((item, index) => `
    Match ${index + 1}:
    - Creator: ${item.creator_username ?? 'Unknown'}
    - Description: ${item.description ?? 'No description'}
    - Upload Date: ${item.upload_date ?? 'Unknown'}
    - Image URL: ${item.image_url ?? 'N/A'}
    `).join("\n");
    
    const prompt = `
    You are an AI specialized in analyzing meme similarity. I have a meme description and several potential matches.
    
    Original meme description:
    "${originalDescription}"
    
    Potential matches:
    ${matchesDetails}
    
    Analyze these matches and determine which ONE is the closest match to the original.
    Consider visual elements, text content, theme, and style. Provide a detailed explanation of why this is the best match.
    
    Format your response as structured JSON with the following fields:
    - matchIndex: The index (starting from 1) of the best match from the list provided above.
    - explanation: Detailed explanation of why this is the best match.
    - similarityScore: A score from 0-100 representing how similar they are.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    try {
      const parsed = JSON.parse(jsonStr);
      const bestMatchIndex = Number(parsed.matchIndex) - 1; // Ensure it's a number

      // Validate index
      if (isNaN(bestMatchIndex) || bestMatchIndex < 0 || bestMatchIndex >= matches.length) {
         console.error(`Invalid matchIndex ${parsed.matchIndex} received from Agent 3. Falling back.`);
         throw new Error("Invalid match index from Agent 3");
      }

      const finalMatch = matches[bestMatchIndex];
      
      return {
        finalMatch,
        explanation: parsed.explanation || "No explanation provided.",
        similarityScore: Number(parsed.similarityScore) || 0 // Ensure score is a number
      };
    } catch (error) {
      console.error("Failed to parse JSON or invalid index from Gemini response for closest match (Agent 3)", { text, error });
      // Fallback to first match
      return {
        finalMatch: matches[0],
        explanation: "Automatic fallback to first match due to processing error.",
        similarityScore: 70
      };
    }
  } catch (error) {
    console.error("Error in findClosestMatch:", error);
    throw new Error("Failed to find closest match");
  }
}

// Agent 4: Generate match analysis
export async function generateMatchAnalysis(originalDescription: string, finalMatch: any) {
  // Handle cases where finalMatch might be null or missing properties (e.g., from fallback)
  if (!finalMatch || !finalMatch.creator_username) {
    console.warn("Invalid finalMatch provided to generateMatchAnalysis. Returning fallback.");
    return {
        matchPercentage: 0,
        matchingFeatures: [],
        creatorStyle: "Unknown",
        confidenceExplanation: "Analysis could not be performed due to missing match data."
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    
    const prompt = `
    You are an AI specialized in analyzing meme attribution. I have a meme and a potential creator match.
    
    Original meme description:
    "${originalDescription}"
    
    Matched creator and post:
    - Creator: @${finalMatch.creator_username ?? 'Unknown'}
    - Post Description: ${finalMatch.description ?? 'No description'}
    - Upload Date: ${finalMatch.upload_date ?? 'Unknown'}
    
    Generate a detailed analysis of how well this meme matches the creator's style.
    Calculate a confident match percentage based on:
    - Visual style similarities
    - Text formatting and language patterns
    - Theme and humor approach
    - Any unique identifiers or watermarks
    
    Format your response as structured JSON with the following fields:
    - matchPercentage: A number between 0-100 representing confidence
    - matchingFeatures: Array of specific features that match
    - creatorStyle: Description of the creator's typical style
    - confidenceExplanation: Detailed explanation of the match confidence
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    try {
      const parsed = JSON.parse(jsonStr);
      return {
        matchPercentage: Number(parsed.matchPercentage) || 0,
        matchingFeatures: Array.isArray(parsed.matchingFeatures) ? parsed.matchingFeatures : [],
        creatorStyle: parsed.creatorStyle || "Style analysis unavailable.",
        confidenceExplanation: parsed.confidenceExplanation || "Confidence explanation unavailable."
      };
    } catch (error) {
      console.error("Failed to parse JSON from Gemini response for match analysis (Agent 4)", { text, error });
      // Fallback to structured response
      return {
        matchPercentage: 0,
        matchingFeatures: [],
        creatorStyle: "Analysis failed due to processing error.",
        confidenceExplanation: "Could not determine confidence due to processing error."
      };
    }
  } catch (error) {
    console.error("Error in generateMatchAnalysis:", error);
    throw new Error("Failed to generate match analysis");
  }
}

// System prompt for Gemini copyright claim email generation
const SYSTEM_PROMPT = `
You are an expert legal assistant specializing in copyright law and digital content protection. Your role is to draft highly professional, formal, and legally compliant copyright claim emails specifically for Instagram.

Reference the following official Instagram copyright and content policies:
- Only the copyright owner or their authorized representative may submit a claim.
- Instagram removes content that infringes copyright, as outlined in its Community Guidelines and Terms of Use.
- Claims must clearly identify both the original work and the allegedly infringing content (with links/usernames/descriptions).
- Claims must include a request for removal of the infringing content and a statement of ownership.
- Instagram may share the claimant's contact details with the alleged infringer.
- The claim should be polite, specific, and reference Instagram's official reporting process.
- The email must be in English, formal, and persuasive, suitable for submission to Instagram's copyright team.
- Reference Instagram's Community Guidelines: https://help.instagram.com/477434105621119 and Terms of Use: https://help.instagram.com/478745558852511

Always structure your response as valid JSON with exactly these fields:
{
  "subject": "A clear, concise email subject line",
  "body": "A complete, formal copyright claim email with all required legal details, referencing Instagram's policies and reporting requirements."
}
Do NOT include markdown formatting, code blocks, or any text outside the JSON structure.`

// Agent 5: Generate copyright claim email
export async function generateCopyrightClaimEmail(
  originalAnalysis: any,
  finalMatch: any
) {
  try {
    // Read the latest Instagram copyright policy from file
    const policyPath = path.join(process.cwd(), "lib", "instagram-copyright-policy.txt")
    const policyText = fs.readFileSync(policyPath, "utf-8")

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.4,
      },
    });

    const prompt = `INSTAGRAM COPYRIGHT POLICY (for reference):
${policyText}

Original Content:
Description: ${originalAnalysis.description || 'N/A'}
Text: ${originalAnalysis.textContent || 'N/A'}
Visual Elements: ${Array.isArray(originalAnalysis.visualElements) ? originalAnalysis.visualElements.join(', ') : 'N/A'}
Theme: ${originalAnalysis.theme || 'N/A'}

Matched Content Information:
Creator: @${finalMatch.creator || 'Unknown'}
Original Post URL: ${finalMatch.postLink || 'N/A'}
Upload Date: ${finalMatch.uploadDate || 'N/A'}
Similarity Score: ${finalMatch.similarityScore || 0}%

Please draft a formal, legally compliant copyright claim email to Instagram that references the policy and above details.

IMPORTANT: Respond only with JSON in this exact format:
{
  "subject": "A clear, concise plain-text email subject line",
  "body": "A complete, formal plain-text copyright claim email with all required legal details referencing Instagram's policies. The body must be plain text. No markdown or list formatting. Use paragraphs separated by single blank lines."
}
`

    // Use the non-streaming API for simplicity and better compatibility
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean the response text of any markdown code blocks
    const cleanText = text.replace(/```json\n/g, "").replace(/```/g, "");
    
    try {
      // Try to parse as JSON
      const parsedJson = JSON.parse(cleanText);
      
      // Validate the response has required fields
      if (parsedJson.subject && parsedJson.body) {
        return parsedJson;
      } else {
        throw new Error("Missing required fields in response");
      }
    } catch (jsonError) {
      // If JSON parsing fails, try to extract JSON using regex
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          if (extractedJson.subject && extractedJson.body) {
            return extractedJson;
          }
        } catch (extractError) {
          // Extraction failed, fall through to fallback
        }
      }
      
      // Fallback to using the text as the body
      return {
        subject: "Copyright Claim for Instagram Content",
        body: text.trim() || "We were unable to generate a proper email. Please try again."
      };
    }
  } catch (error) {
    console.error("Error in generateCopyrightClaimEmail:", error);
    throw new Error("Failed to generate copyright claim email");
  }
}