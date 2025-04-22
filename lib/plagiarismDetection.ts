/**
 * This file contains utility functions for detecting plagiarism/similarities between images
 * In a real implementation, this would use computer vision APIs or ML models
 */

// Interface for detected plagiarism regions
export interface PlagiarismRegion {
  x: number;      // x position in percentage (0-100)
  y: number;      // y position in percentage (0-100)
  width: number;  // width in percentage (0-100)
  height: number; // height in percentage (0-100)
  confidence: number; // confidence score (0-100)
  description?: string; // description of what was detected
}

/**
 * Simulates detection of plagiarized regions between two images
 * In a real implementation, this would use image comparison algorithms
 * 
 * @param originalImageUrl URL of the original image
 * @param comparisonImageUrl URL of the image being compared
 * @param confidenceScore Overall confidence score for the match
 * @returns Array of detected plagiarism regions
 */
export async function detectPlagiarismRegions(
  originalImageUrl: string,
  comparisonImageUrl: string,
  confidenceScore: number
): Promise<PlagiarismRegion[]> {
  // In a real implementation, this would analyze the images using computer vision
  // For the demo, we'll simulate detection based on the image URLs and confidence score
  
  // Simulate API processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create a hash of the image URLs to generate consistent but different regions for different images
  const combinedHash = hashString(originalImageUrl + comparisonImageUrl);
  
  // Number of regions based on confidence score
  const numberOfRegions = confidenceScore > 90 ? 3 : confidenceScore > 70 ? 2 : 1;
  
  const regions: PlagiarismRegion[] = [];
  
  // Generate regions based on the combined hash and confidence score
  for (let i = 0; i < numberOfRegions; i++) {
    // Use the hash to create "deterministic" regions
    const seed = (combinedHash + i * 1000) % 10000;
    const seedValue = seed / 10000;
    
    // Each region corresponds to a common element type in memes
    let region: PlagiarismRegion;
    
    switch (i) {
      case 0:
        // Text/caption area - typically on top of image
        region = {
          x: 5 + seedValue * 20,
          y: 5 + seedValue * 10,
          width: 70 + seedValue * 20,
          height: 15 + seedValue * 10,
          confidence: 85 + seedValue * 15,
          description: "Text caption and formatting"
        };
        break;
      case 1:
        // Main visual element - central area
        region = {
          x: 25 + seedValue * 25,
          y: 30 + seedValue * 20,
          width: 50 - seedValue * 10,
          height: 40 - seedValue * 10,
          confidence: 90 + seedValue * 10,
          description: "Central visual element"
        };
        break;
      case 2:
        // Bottom element - bottom text or watermark
        region = {
          x: 10 + seedValue * 30,
          y: 75 + seedValue * 5,
          width: 80 - seedValue * 30,
          height: 15 + seedValue * 5,
          confidence: 80 + seedValue * 15,
          description: "Bottom text or watermark"
        };
        break;
      default:
        // Fallback region
        region = {
          x: 20 + seedValue * 20,
          y: 20 + seedValue * 40,
          width: 30 + seedValue * 20,
          height: 30 + seedValue * 10,
          confidence: 75 + seedValue * 20,
          description: "Shared visual pattern"
        };
    }
    
    // Adjust confidence based on overall similarity score
    region.confidence = Math.min(
      region.confidence,
      region.confidence * (confidenceScore / 100)
    );
    
    regions.push(region);
  }
  
  return regions;
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
  // Calculate opacity based on confidence - higher confidence is more opaque
  const opacityBase = 0.5;
  const opacityVariation = 0.4;
  const opacity = opacityBase + (opacityVariation * (region.confidence / 100));
  
  // Use different border styles based on confidence
  const borderWidth = region.confidence > 90 ? 3 : 2;
  const borderStyle = region.confidence > 85 ? 'solid' : 'dashed';
  
  return {
    position: 'absolute',
    top: `${region.y}%`,
    left: `${region.x}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
    border: `${borderWidth}px ${borderStyle} red`,
    borderRadius: '2px',
    opacity: opacity,
    pointerEvents: 'none',
    boxShadow: '0 0 10px rgba(255, 0, 0, 0.3)',
    zIndex: 10
  };
} 