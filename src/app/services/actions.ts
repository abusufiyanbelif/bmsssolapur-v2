
'use server';

import { getAdminDb } from '@/services/firebase-admin';
import { testTwilioConnection as testTwilio } from '@/services/twilio';
import { testNodemailerConnection as testNodemailer } from '@/services/email';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';


/**
 * Performs a lightweight, low-cost read operation against Firestore using the Admin SDK
 * to check if the current environment has the necessary permissions.
 * This function is designed to be called from a server-side context.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function checkDatabaseConnection(): Promise<{success: boolean, error?: string}> {
    try {
        const adminDb = await getAdminDb();
        // Attempt to access a non-existent document. This is a lightweight operation.
        const nonExistentDocRef = adminDb.collection("permission-check-script").doc("heartbeat");
        await nonExistentDocRef.get();
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            // Specifically check for the default credentials error message.
            if (e.message.includes("Could not load the default credentials") || e.message.includes("Could not refresh access token") || e.message.includes("UNAUTHENTICATED")) {
                 return { success: false, error: 'permission-denied' };
            }
             // Return the specific error message for other cases.
            return { success: false, error: e.message };
        }
        console.error("An unexpected error occurred during permission check:", e);
        return { success: false, error: "An unexpected error occurred during the initial permission check." };
    }
};


export async function testTwilioConnection(): Promise<{success: boolean, error?: string}> {
    try {
        await testTwilio();
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: "An unknown error occurred while testing Twilio." };
    }
}

export async function testNodemailerConnection(): Promise<{success: boolean, error?: string}> {
    try {
        await testNodemailer();
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: "An unknown error occurred while testing Nodemailer." };
    }
}

export async function testGeminiConnection(apiKey?: string): Promise<{success: boolean, error?: string}> {
    try {
        // If a key is provided, create a temporary Genkit instance with it for testing.
        const testAi = apiKey ? genkit({ plugins: [googleAI({ apiKey })] }) : ai;
        
        await testAi.generate({
            model: googleAI.model('gemini-1.5-flash'),
            prompt: 'Test prompt',
            config: { temperature: 0 },
        });
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
             if(e.message.includes("API key not valid")) {
                const errorMessage = `The provided API Key is invalid or expired. You can generate a new one at https://aistudio.google.com/app/apikey.`;
                return { success: false, error: errorMessage };
            }
            return { success: false, error: e.message };
        }
        return { success: false, error: "An unknown error occurred while testing Gemini." };
    }
}

export async function testGatewayConnection(gatewayName: 'razorpay'): Promise<{success: boolean, error?: string}> {
    const { testRazorpayConnection } = await import('@/services/razorpay-service');
    try {
        if (gatewayName === 'razorpay') {
            await testRazorpayConnection();
            return { success: true };
        }
        return { success: false, error: `Testing for ${gatewayName} is not yet implemented.` };
    } catch (e) {
        const error = e instanceof Error ? e.message : `An unknown error occurred while testing ${gatewayName}.`;
        console.error(`Error testing ${gatewayName} connection:`, error);
        return { success: false, error: error };
    }
}
