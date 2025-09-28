'use server';

interface Model {
    name: string;
    version: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    supportedGenerationMethods: string[];
}

export async function listAvailableModels(): Promise<{ models: Model[], error?: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { models: [], error: 'GEMINI_API_KEY is not set in the environment.' };
    }

    try {
        const res = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models",
            { headers: { "x-goog-api-key": apiKey } }
        );

        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(`Failed to fetch models: ${errorBody.error.message}`);
        }
        
        const data = await res.json();
        // Filter for models that support 'generateContent' as those are the most common
        const filteredModels = data.models.filter((m: any) => 
            m.supportedGenerationMethods.includes('generateContent')
        );

        return { models: filteredModels };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown network error occurred.";
        return { models: [], error };
    }
}
