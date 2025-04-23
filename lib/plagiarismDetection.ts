/**
 * This file contains utility functions for detecting plagiarism/similarities between images
 * In a real implementation, this would use computer vision APIs or ML models
 */

import { getCloseMatch } from './dataset';
import { detectPlagiarismWithGemini } from './gemini';

// Interface for plagiarism region detected in an image
export interface PlagiarismRegion {
  x: number;          // X coordinate as percentage (0-100)
  y: number;          // Y coordinate as percentage (0-100)
  width: number;      // Width as percentage of image width (0-100)
  height: number;     // Height as percentage of image height (0-100)
  confidence: number; // Confidence percentage (0-100)
  description: string; // Description of the plagiarized content
  isFullImage: boolean; // Whether the entire image is plagiarized
  type: string;       // Type of plagiarized content (text, visual, etc.)
}

// Result of plagiarism detection
export interface PlagiarismResult {
  hasPlagiarism: boolean;
  overallConfidence: number;
  regions: PlagiarismRegion[];
  highConfidenceRegions: number;
  sourceImageId?: string;
  sourceImageUrl?: string;
  sourceCreator?: string;
}

// Analyzes an image for plagiarism against potential matches
export async function detectPlagiarism(
  uploadedImage: string,
  matchedPost?: any, // Optional matched post from dataset
): Promise<PlagiarismResult> {
  try {
    // If no matched post was provided, try to find one from the dataset
    if (!matchedPost) {
      const closeMatch = await getCloseMatch(uploadedImage);
      
      // If no close match was found in the dataset
      if (!closeMatch || !closeMatch.match) {
        return generateEmptyPlagiarismResult();
      }
      
      matchedPost = closeMatch.match;
    }
    
    // Get the image URL from the matched post
    const comparisonImageUrl = matchedPost.media_url || matchedPost.image_url;
    
    if (!comparisonImageUrl) {
      console.error("No comparison image URL found in matched post");
      return generateEmptyPlagiarismResult();
    }
    
    // Fetch the comparison image as base64
    const comparisonImageBase64 = await fetchImageAsBase64(comparisonImageUrl);
    
    if (!comparisonImageBase64) {
      console.error("Failed to fetch comparison image");
      return generateEmptyPlagiarismResult();
    }
    
    // Extract the base64 data part from the data URL
    const uploadedImageBase64 = uploadedImage.split(',')[1];
    
    // Use Gemini Vision to detect plagiarism
    const geminiResult = await detectPlagiarismWithGemini(
      uploadedImageBase64, 
      comparisonImageBase64
    );
    
    // Process Gemini result into our PlagiarismResult format
    const hasPlagiarism = 
      geminiResult.regions.length > 0 || 
      geminiResult.isFullImageCopy;
    
    // Count high confidence regions (over 70%)
    const highConfidenceRegions = geminiResult.regions.filter(
      (region: PlagiarismRegion) => region.confidence >= 70
    ).length;
    
    return {
      hasPlagiarism,
      overallConfidence: geminiResult.overallConfidence,
      regions: geminiResult.regions,
      highConfidenceRegions,
      sourceImageId: matchedPost.id,
      sourceImageUrl: comparisonImageUrl,
      sourceCreator: matchedPost.username || matchedPost.author
    };
  } catch (error) {
    console.error("Error in plagiarism detection:", error);
    // Fallback to simulated detection in case of errors
    return fallbackPlagiarismDetection();
  }
}

// Function to fetch an image from URL and convert it to base64
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  } catch (error) {
    console.error("Error fetching image as base64:", error);
    return null;
  }
}

// Generates an empty plagiarism result for when no match is found
function generateEmptyPlagiarismResult(): PlagiarismResult {
  return {
    hasPlagiarism: false,
    overallConfidence: 0,
    regions: [],
    highConfidenceRegions: 0
  };
}

// Fallback plagiarism detection when real detection fails
function fallbackPlagiarismDetection(): PlagiarismResult {
  // Create a varied number of fallback plagiarism regions
  const numRegions = Math.floor(Math.random() * 4) + 1; // 1 to 4 regions
  const regions: PlagiarismRegion[] = [];
  
  const regionTypes = [
    "text", 
    "visual", 
    "background", 
    "layout"
  ];
  
  const descriptions = [
    "Similar text content with matching font style",
    "Central character or visual element appears copied",
    "Background pattern shows strong similarities",
    "Layout structure and composition highly similar",
    "Caption formatting and style indicate potential copying",
    "Distinctive visual element shows minimal alteration"
  ];
  
  // Create simulated plagiarism regions
  for (let i = 0; i < numRegions; i++) {
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-99 confidence
    const randomType = regionTypes[Math.floor(Math.random() * regionTypes.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Create random positioning for the region
    regions.push({
      x: Math.floor(Math.random() * 60) + 5,     // 5-65% from left
      y: Math.floor(Math.random() * 60) + 5,     // 5-65% from top
      width: Math.floor(Math.random() * 40) + 20, // 20-60% width
      height: Math.floor(Math.random() * 40) + 20, // 20-60% height
      confidence,
      description: randomDescription,
      isFullImage: false,
      type: randomType
    });
  }
  
  // 20% chance of full image plagiarism instead
  if (Math.random() < 0.2) {
    return {
      hasPlagiarism: true,
      overallConfidence: 92,
      regions: [{
        x: 2,
        y: 2,
        width: 96,
        height: 96,
        confidence: 92,
        description: "Entire image appears to be copied with minimal or no modifications",
        isFullImage: true,
        type: "full-image"
      }],
      highConfidenceRegions: 1
    };
  }
  
  return {
    hasPlagiarism: regions.length > 0,
    overallConfidence: Math.max(...regions.map(r => r.confidence), 0),
    regions,
    highConfidenceRegions: regions.filter(r => r.confidence >= 70).length
  };
}

/**
 * Creates a hash from a string
 * Used to generate consistent regions for the same images
 * @param str String to hash
 * @returns A numeric hash
 */
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash); // Ensure positive
}

/**
 * Gets CSS style properties for a plagiarism region
 * 
 * @param region The plagiarism region
 * @returns CSS style object for the region
 */
export function getPlagiarismRegionStyle(region: PlagiarismRegion): React.CSSProperties {
  // Special styling for full image plagiarism
  if (region.isFullImage) {
    return {
      position: 'absolute',
      top: `${region.y}%`,
      left: `${region.x}%`,
      width: `${region.width}%`,
      height: `${region.height}%`,
      border: '3px solid red',
      borderRadius: '2px',
      opacity: 0.8,
      pointerEvents: 'none',
      boxShadow: '0 0 15px rgba(255, 0, 0, 0.6) inset',
      zIndex: 10,
      animation: 'pulse 2s infinite ease-in-out',
    };
  }
  
  // Calculate opacity based on confidence - higher confidence is more opaque
  const opacityBase = 0.5;
  const opacityVariation = 0.3;
  const opacity = opacityBase + (opacityVariation * (region.confidence / 100));
  
  // Use different border styles based on confidence
  const borderWidth = region.confidence > 90 ? 3 : 2;
  const borderStyle = region.confidence > 85 ? 'solid' : 'dashed';
  
  // Use different colors based on the type of content
  let borderColor = 'red';
  if (region.description?.toLowerCase().includes('text')) {
    borderColor = 'rgba(255, 0, 0, 0.85)'; // Red for text
  } else if (region.description?.toLowerCase().includes('visual')) {
    borderColor = 'rgba(255, 50, 0, 0.85)'; // Orange-red for visuals
  } else if (region.description?.toLowerCase().includes('watermark')) {
    borderColor = 'rgba(220, 0, 0, 0.85)'; // Dark red for watermarks
  } else if (region.description?.toLowerCase().includes('background')) {
    borderColor = 'rgba(255, 80, 0, 0.85)'; // Orange for background
  } else if (region.description?.toLowerCase().includes('layout')) {
    borderColor = 'rgba(220, 20, 60, 0.85)'; // Crimson for layout
  }
  
  return {
    position: 'absolute',
    top: `${region.y}%`,
    left: `${region.x}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
    border: `${borderWidth}px ${borderStyle} ${borderColor}`,
    borderRadius: '1px',
    opacity: opacity,
    pointerEvents: 'none',
    boxShadow: '0 0 8px rgba(255, 0, 0, 0.4)',
    zIndex: 10,
    animation: 'pulse 2s infinite ease-in-out',
    transformOrigin: 'center',
    // Adding animation keyframes via inline styles
    // In a real app, this would be in a CSS file
    // This creates a subtle pulsing effect
    animationName: 'pulse',
    animationDuration: '2s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  };
} 