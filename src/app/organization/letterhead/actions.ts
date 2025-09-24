
"use server";

/**
 * Fetches an image from a URL and converts it to a Base64 data URI.
 * This is done on the server to avoid client-side CORS issues.
 * @param url The public URL of the image to fetch.
 * @returns A promise that resolves with the Base64 data URI.
 */
export async function getImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');
    return `data:${blob.type};base64,${base64}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    // Return a placeholder or re-throw, depending on desired error handling
    throw new Error("Could not convert image for PDF generation.");
  }
}
