import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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

// Agent 1: Analyze the image
export async function analyzeImageWithGemini(base64Image: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    You are an AI specialized in analyzing memes. Please examine this image and provide:
    
    1. A detailed description of what's in the image
    2. Any text found in the image
    3. Visual elements present (people, objects, etc.)
    4. The overall theme or joke of the meme
    
    Format your response as structured JSON with the following fields:
    - description: A detailed paragraph describing the whole meme
    - textContent: All text found in the image
    - visualElements: Array of key visual elements
    - theme: The main subject or joke of the meme
    `;
    
    const image = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg",
      },
    };
    
    const result = await model.generateContent([prompt, image]);
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
    console.error("Error in analyzeImageWithGemini:", error);
    throw new Error("Failed to analyze image with Gemini");
  }
}

// Agent 2: Match description with dataset
export async function matchDescriptionWithDataset(description: string, dataset: any[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    You are an AI specialized in analyzing meme attribution. I have a meme and a potential creator match.
    
    Original meme description:
    "${originalDescription}"
    
    Matched creator and post:
    - Creator: ${finalMatch.creator_username ?? 'Unknown'}
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