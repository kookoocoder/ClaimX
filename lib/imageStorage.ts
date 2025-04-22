/**
 * Utility functions for handling image storage and retrieval
 */

// Default fallback image if the uploaded one fails to load
export const FALLBACK_IMAGE = "https://placehold.co/600x400/gray/white?text=Image+Not+Available"

// Maximum size for localStorage (approximately 5MB to be safe)
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

/**
 * Stores an image URL in localStorage with a backup copy
 * @param imageUrl The image URL to store
 * @param key The localStorage key to use (defaults to "uploadedImage")
 * @returns The stored image URL
 */
export function storeImage(imageUrl: string, key: string = "uploadedImage"): string {
  try {
    // For blob URLs, we can't store them directly as they won't persist
    // Try to convert to a data URL if it's not already
    if (imageUrl.startsWith('blob:')) {
      console.warn("Blob URL detected - this won't persist in localStorage. Consider using fileToDataUrl instead.");
    }
    
    // Store the image URL in localStorage
    localStorage.setItem(key, imageUrl);
    
    // Create a backup copy with timestamp
    localStorage.setItem(`${key}_backup`, imageUrl);
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    
    return imageUrl;
  } catch (error) {
    console.error("Failed to store image in localStorage:", error);
    return imageUrl;
  }
}

/**
 * Stores a file as a data URL in localStorage
 * This is more reliable than storing blob URLs
 * @param file The file to store
 * @param key The localStorage key to use
 * @returns Promise resolving to the data URL
 */
export async function storeFileAsDataUrl(file: File, key: string = "uploadedImageData"): Promise<string> {
  try {
    const dataUrl = await fileToDataUrl(file);
    
    // Check if the data URL is too large for localStorage
    if (dataUrl.length > MAX_STORAGE_SIZE) {
      console.warn("Data URL too large for localStorage, using compressed version");
      // Use a canvas to create a compressed version
      const compressedDataUrl = await compressImage(dataUrl, 0.7);
      localStorage.setItem(key, compressedDataUrl);
      localStorage.setItem(`${key}_backup`, compressedDataUrl);
    } else {
      localStorage.setItem(key, dataUrl);
      localStorage.setItem(`${key}_backup`, dataUrl);
    }
    
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    return dataUrl;
  } catch (error) {
    console.error("Failed to store file as data URL:", error);
    throw error;
  }
}

/**
 * Compresses an image using canvas
 * @param dataUrl The data URL to compress
 * @param quality The quality (0 to 1)
 * @returns Promise resolving to compressed data URL
 */
export function compressImage(dataUrl: string, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Convert to JPEG for better compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}

/**
 * Retrieves an image URL from localStorage with fallback mechanisms
 * @param key The localStorage key to retrieve from (defaults to "uploadedImage")
 * @returns The retrieved image URL or fallback if not found
 */
export function retrieveImage(key: string = "uploadedImage"): string | null {
  try {
    // First try with data URL (most reliable)
    if (key !== "uploadedImageData") {
      const dataUrl = localStorage.getItem("uploadedImageData");
      if (dataUrl && dataUrl.startsWith('data:image/')) {
        console.log("Using data URL from uploadedImageData");
        return dataUrl;
      }
    }
    
    // Try to get the primary image
    const imageUrl = localStorage.getItem(key);
    
    if (imageUrl) {
      console.log(`Retrieved image from ${key}`);
      // Don't return blob URLs as they might be invalid after page refresh
      if (imageUrl.startsWith('blob:')) {
        console.warn("Retrieved blob URL may be invalid after page refresh");
      }
      return imageUrl;
    }
    
    // If primary is missing, try backup
    const backupImageUrl = localStorage.getItem(`${key}_backup`);
    if (backupImageUrl) {
      console.warn(`Using backup image because primary was not found for ${key}`);
      localStorage.setItem(key, backupImageUrl); // Restore from backup
      return backupImageUrl;
    }
    
    // If all else fails, try the other key
    const otherKey = key === "uploadedImage" ? "uploadedImageData" : "uploadedImage";
    const otherImageUrl = localStorage.getItem(otherKey);
    if (otherImageUrl) {
      console.warn(`Using image from ${otherKey} as fallback`);
      return otherImageUrl;
    }
    
    console.error("No image found in any storage location");
    return null;
  } catch (error) {
    console.error("Failed to retrieve image from localStorage:", error);
    return null;
  }
}

/**
 * Validates if an image can be loaded
 * @param imageUrl URL of the image to validate
 * @returns Promise resolving to a boolean indicating if the image can be loaded
 */
export function validateImage(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    
    // Set crossOrigin to anonymous for CORS issues with external images
    if (!imageUrl.startsWith('data:')) {
      img.crossOrigin = "anonymous";
    }
    
    img.onload = () => {
      console.log("Image validated successfully");
      resolve(true);
    };
    
    img.onerror = () => {
      console.warn("Image validation failed", imageUrl?.substring(0, 50) + '...');
      resolve(false);
    };
    
    // Set a timeout in case the image load hangs
    const timeout = setTimeout(() => {
      console.warn("Image validation timed out");
      resolve(false);
    }, 3000);
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    
    img.src = imageUrl;
  });
}

/**
 * Gets a data URL from a File object
 * @param file The File object to convert
 * @returns Promise resolving to the data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Cleans up stored images from localStorage
 * @param key The localStorage key to clean up (defaults to "uploadedImage")
 */
export function cleanupStoredImage(key: string = "uploadedImage"): void {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_backup`);
    localStorage.removeItem(`${key}_timestamp`);
  } catch (error) {
    console.error("Failed to clean up stored image:", error);
  }
} 