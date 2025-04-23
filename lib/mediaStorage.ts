/**
 * Utility functions for handling media storage and retrieval (images and videos)
 */

// Default fallback URLs
export const FALLBACK_IMAGE_URL = "https://placehold.co/600x400/gray/white?text=Image+Not+Available"
export const FALLBACK_VIDEO_URL = "https://placehold.co/600x400/gray/white?text=Video+Not+Available" // Placeholder
export const FALLBACK_MEDIA_URL = FALLBACK_IMAGE_URL // Default to image fallback

// Maximum size for localStorage (approximately 5MB to be safe)
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

/**
 * Stores a media URL (image or video) in localStorage with a backup copy
 * @param mediaUrl The media URL to store
 * @param key The localStorage key to use (defaults to "uploadedMedia")
 * @returns The stored media URL
 */
export function storeMediaUrl(mediaUrl: string, key: string = "uploadedMedia"): string {
  try {
    // For blob URLs, we can't store them directly as they won't persist
    if (mediaUrl.startsWith('blob:')) {
      console.warn("Blob URL detected - this won't persist in localStorage. Consider using fileToDataUrl instead.");
    }
    
    localStorage.setItem(key, mediaUrl);
    localStorage.setItem(`${key}_backup`, mediaUrl);
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    
    return mediaUrl;
  } catch (error) {
    console.error("Failed to store media in localStorage:", error);
    return mediaUrl;
  }
}

/**
 * Stores a file as a data URL in localStorage
 * For images, attempts compression if too large.
 * For videos, stores directly if possible, warns if too large.
 * @param file The file to store
 * @param key The localStorage key to use
 * @returns Promise resolving to the data URL or original file blob URL if too large
 */
export async function storeFileAsDataUrl(file: File, key: string = "uploadedMediaData"): Promise<string> {
  try {
    const dataUrl = await fileToDataUrl(file);
    const isImage = file.type.startsWith("image/");
    
    // Check if the data URL is too large for localStorage
    if (dataUrl.length > MAX_STORAGE_SIZE) {
      if (isImage) {
        console.warn("Data URL too large for localStorage, using compressed version");
        const compressedDataUrl = await compressImage(dataUrl, 0.7);
        localStorage.setItem(key, compressedDataUrl);
        localStorage.setItem(`${key}_backup`, compressedDataUrl);
        localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        return compressedDataUrl; // Return the compressed URL
      } else {
        // For videos or other large files, we can't easily compress/store the data URL
        console.warn(`Data URL for ${file.type} is too large (${(dataUrl.length / 1024 / 1024).toFixed(2)}MB) for localStorage. Analysis might rely on temporary blob URL.`);
        // Store a reference or indicator that the data URL was too large?
        localStorage.setItem(key, "DATA_URL_TOO_LARGE"); 
        localStorage.setItem(`${key}_type`, file.type);
        localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        // Return the original blob URL as a fallback, though it might not work reliably on results page
        return URL.createObjectURL(file); 
      }
    } else {
      // Store the data URL directly if it fits
      localStorage.setItem(key, dataUrl);
      localStorage.setItem(`${key}_backup`, dataUrl);
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
      return dataUrl; // Return the stored data URL
    }
  } catch (error) {
    console.error("Failed to store file as data URL:", error);
    // Return blob URL as a last resort
    try {
      return URL.createObjectURL(file);
    } catch (blobError) {
       console.error("Failed to create blob URL as fallback:", blobError);
       throw error; // Re-throw original error
    }
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
 * Retrieves a media URL from localStorage with fallback mechanisms
 * @param key The localStorage key to retrieve from (defaults to "uploadedMediaData")
 * @returns The retrieved media URL or null if not found
 */
export function retrieveMediaUrl(key: string = "uploadedMediaData"): string | null {
  try {
    // Try primary key
    const mediaUrl = localStorage.getItem(key);

    if (mediaUrl && mediaUrl !== "DATA_URL_TOO_LARGE") {
        if (mediaUrl.startsWith('data:') || mediaUrl.startsWith('http')) {
            console.log(`Retrieved media URL from ${key}`);
            return mediaUrl;
        } else if (mediaUrl.startsWith('blob:')) {
             console.warn(`Retrieved blob URL from ${key} - may be invalid.`);
             // Attempt to return anyway, but validation is needed
             return mediaUrl;
        }
    }
    
    if (mediaUrl === "DATA_URL_TOO_LARGE") {
        console.warn(`Media data URL was too large for key ${key}. Cannot retrieve reliably.`);
        // Can we retrieve the temporary blob URL stored elsewhere?
        // For now, return null as we can't guarantee retrieval.
        return null;
    }

    // Try backup key
    const backupMediaUrl = localStorage.getItem(`${key}_backup`);
    if (backupMediaUrl && backupMediaUrl !== "DATA_URL_TOO_LARGE") {
      if (backupMediaUrl.startsWith('data:') || backupMediaUrl.startsWith('http')) {
          console.warn(`Using backup media URL because primary was not found or invalid for ${key}`);
          localStorage.setItem(key, backupMediaUrl); // Restore from backup
          return backupMediaUrl;
      }
    }

    console.error(`No valid media URL found in localStorage for key: ${key} or its backup.`);
    return null;
  } catch (error) {
    console.error("Failed to retrieve media from localStorage:", error);
    return null;
  }
}

/**
 * Validates if a media URL (image or video) can be loaded
 * @param mediaUrl URL of the media to validate
 * @returns Promise resolving to a boolean indicating if the media can be loaded
 */
export function validateMediaUrl(mediaUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!mediaUrl || mediaUrl === "DATA_URL_TOO_LARGE") {
        resolve(false);
        return;
    }

    let element: HTMLImageElement | HTMLVideoElement;
    const isDataUrl = mediaUrl.startsWith('data:');
    const isVideo = mediaUrl.startsWith('data:video/') || mediaUrl.endsWith('.mp4'); // Basic check

    if (isVideo) {
      element = document.createElement('video');
      element.onloadeddata = () => { // Use onloadeddata for video
        cleanup();
        resolve(true);
      };
    } else {
      element = document.createElement('img');
      element.onload = () => {
        cleanup();
        resolve(true);
      };
    }

    // Set crossOrigin for non-data URLs
    if (!isDataUrl) {
      element.crossOrigin = "anonymous";
    }

    const onError = () => {
      console.warn(`Media validation failed for ${mediaUrl.substring(0, 50)}...`);
      cleanup();
      resolve(false);
    };

    element.onerror = onError;

    // Set a timeout
    const timeoutId = setTimeout(() => {
      console.warn("Media validation timed out");
      cleanup(true); // Pass true to indicate timeout
      resolve(false);
    }, 5000); // Increased timeout for potentially larger media

    // Cleanup function to remove listeners and element
    const cleanup = (isTimeout = false) => {
      clearTimeout(timeoutId);
      if (element) {
         element.onload = null;
         element.onerror = null;
         if ('onloadeddata' in element) element.onloadeddata = null;
         if (!isTimeout) element.src = ''; // Stop loading if not timed out
         // Optionally remove element from DOM if it was added
      }
    };

    element.src = mediaUrl;
    
    // For video, also check if it starts playing a bit (optional, more robust check)
    // if (isVideo) { element.play().catch(onError); }
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
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Removes stored media URLs and backups from localStorage
 * @param key The base localStorage key (defaults to "uploadedMediaData")
 */
export function cleanupStoredMedia(key: string = "uploadedMediaData"): void {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_backup`);
    localStorage.removeItem(`${key}_timestamp`);
    localStorage.removeItem(`${key}_type`);
    console.log(`Cleaned up stored media for key: ${key}`);
  } catch (error) {
    console.error("Failed to cleanup stored media:", error);
  }
} 