
'use server';

/**
 * Fetches an image from a URL and converts it to a Base64 data URI.
 * This is done on the server to avoid client-side CORS issues.
 * @param url The public URL of the image to fetch.
 * @returns A promise that resolves with the Base64 data URI or undefined.
 */
export async function getImageAsBase64(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const response = await fetch(url, { cache: 'no-store' }); // Disable cache for this fetch
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');
    return `data:${blob.type};base64,${base64}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    // Instead of throwing, return undefined so the client can handle it.
    return undefined;
  }
}
