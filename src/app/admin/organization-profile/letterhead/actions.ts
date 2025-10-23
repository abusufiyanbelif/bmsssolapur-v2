

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
    // Validate URL format before fetching
    new URL(url);

    const response = await fetch(url, { cache: 'no-store' }); // Disable cache for this fetch
    if (!response.ok) {
      // Log the server-side error but don't throw to the client
      console.error(`Failed to fetch image from URL: ${url}. Status: ${response.status} ${response.statusText}`);
      return undefined;
    }
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');
    return `data:${blob.type};base64,${base64}`;
  } catch (error) {
    // Catch errors like invalid URL format or network issues
    if (error instanceof TypeError) { // Often indicates an invalid URL
      console.error(`Invalid URL provided for image: ${url}`);
    } else {
      console.error("Error converting image to Base64:", error);
    }
    // Instead of throwing, return undefined so the client can handle it.
    return undefined;
  }
}
