'use server';

/**
 * @fileOverview A service to dynamically find and return a safe, supported Gemini model.
 */

// This function must be in its own file to avoid circular dependencies
// if it were to be used by other server-side services in the future.

/**
 * Fetches the list of available models from the Google AI API and returns the
 * best available supported model name based on a preferred order.
 * @param preferred - The preferred model to use if available.
 * @returns A promise that resolves with the string name of a safe model to use.
 * @throws An error if no supported models can be found.
 */
export async function getSafeGeminiModel(
  preferred = "gemini-1.5-flash-latest"
): Promise<string> {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY! } }
    );
    
    if (!res.ok) {
        // If the listModels call fails, we can't determine a safe model, so we fallback to a known stable one.
        console.error(`Failed to list models, falling back to ${preferred}. Status: ${res.status}`);
        return preferred;
    }

    const data = await res.json();
    const available = data.models.map((m: any) => m.name);

    if (available.includes(preferred)) return preferred;
    // Fallback order
    if (available.includes("models/gemini-1.5-flash-latest")) return "models/gemini-1.5-flash-latest";
    if (available.includes("models/gemini-pro-latest")) return "models/gemini-pro-latest";
    if (available.includes("models/gemini-pro")) return "models/gemini-pro";

    throw new Error("No supported Gemini model available from the listModels endpoint.");
  } catch (e) {
      console.error("Error in getSafeGeminiModel, falling back to default.", e);
      // Fallback to a known stable model in case of any unexpected error (e.g., network issue)
      return preferred;
  }
}
