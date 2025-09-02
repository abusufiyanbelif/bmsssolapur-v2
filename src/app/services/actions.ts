
'use server';

import { adminDb } from '@/services/firebase-admin';
import { testTwilioConnection as testTwilio } from '@/services/twilio';
import { testNodemailerConnection as testNodemailer } from '@/services/email';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';


/**
 * Performs a lightweight, low-cost read operation against Firestore using the Admin SDK
 * to check if the current environment has the necessary permissions.
 * This function is designed to be called from a server-side context.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function checkDatabaseConnection(): Promise<{success: boolean, error?: string}> {
    try {
        // Attempt to access a non-existent document. This is a lightweight operation.
        const nonExistentDocRef = adminDb.collection("permission-check").doc("heartbeat");
        await nonExistentDocRef.get();
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            // Specifically check for the default credentials error message.
            if (e.message.includes("Could not refresh access token")) {
                 return { success: false, error: `Authentication failed: ${e.message}. This usually indicates a permissions issue with the service account.` };
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

export async function testGeminiConnection(): Promise<{success: boolean, error?: string}> {
    try {
        await ai.generate({
            model: googleAI.model('gemini-1.5-flash-latest'),
            prompt: 'Test prompt',
            config: { temperature: 0 },
        });
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            return { success: false, error: e.message };
        }
        return { success: false, error: "An unknown error occurred while testing Gemini." };
    }
}
