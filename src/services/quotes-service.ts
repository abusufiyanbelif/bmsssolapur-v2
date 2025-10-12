
/**
 * @fileOverview Service for managing inspirational quotes in Firestore.
 */

import { getAdminDb } from './firebase-admin';
import type { Quote } from './types';
import { WriteBatch, Timestamp } from 'firebase-admin/firestore';
import { quranQuotes } from './quotes/quran';
import { hadithQuotes } from './quotes/hadith';
import { scholarQuotes } from './quotes/scholars';

// Re-export type for backward compatibility
export type { Quote };

const QUOTES_COLLECTION = 'inspirationalQuotes';

const ALL_QUOTES: Omit<Quote, 'id'>[] = [
    ...quranQuotes,
    ...hadithQuotes,
    ...scholarQuotes,
];


/**
 * Seeds the database with a large set of initial quotes if it's empty.
 * @returns A status message.
 */
export const seedInitialQuotes = async (): Promise<string> => {
  const adminDb = getAdminDb();
  const quotesCollection = adminDb.collection(QUOTES_COLLECTION);
  const snapshot = await quotesCollection.limit(1).get();

  if (!snapshot.empty) {
    const msg = "Quotes collection is not empty. Skipped seeding.";
    console.log(msg);
    return msg;
  }

  console.log("Quotes collection is empty. Seeding initial quotes from hardcoded list...");
  try {
    const batch: WriteBatch = adminDb.batch();
    ALL_QUOTES.forEach((quote) => {
      const quoteRef = quotesCollection.doc();
      batch.set(quoteRef, quote);
    });

    await batch.commit();
    const successMsg = `Successfully seeded ${ALL_QUOTES.length} quotes.`;
    console.log(successMsg);
    return successMsg;
  } catch (error) {
    const errorMsg = "Failed to seed quotes from hardcoded list.";
    console.error(errorMsg, error);
    throw new Error(errorMsg);
  }
};

/**
 * Fetches all quotes from the database.
 * This function is now resilient to missing collections and permission errors.
 * @returns An array of all quote objects.
 */
export const getAllQuotes = async (): Promise<Quote[]> => {
    const adminDb = getAdminDb();
    try {
        const quotesQuery = adminDb.collection(QUOTES_COLLECTION);
        const querySnapshot = await quotesQuery.get();
        if (querySnapshot.empty) {
            console.log("Quotes collection is empty, returning empty array.");
            return [];
        }
        const quotes: Quote[] = [];
        querySnapshot.forEach((doc) => {
            quotes.push({ id: doc.id, ...doc.data() } as Quote);
        });
        return quotes;
    } catch (error) {
        if (error instanceof Error) {
            // Gracefully handle common "not found" or "permission" errors without crashing.
            const errMsg = error.message.toLowerCase();
            if (errMsg.includes('permission-denied') || errMsg.includes('unauthenticated') || errMsg.includes('collection not found') || errMsg.includes('resource not found') || errMsg.includes('not_found')) {
                console.warn(`[Graceful Failure] Could not fetch quotes: ${error.message}. This is expected on a fresh database or with incorrect IAM permissions. Returning empty array.`);
                return []; // <<<<<<<<<<< THE CRITICAL FIX
            }
        }
        // For any other, more serious error, log it and re-throw to be caught by the server action.
        console.error("An unexpected error occurred in getAllQuotes:", error);
        throw error;
    }
}

/**
 * Deletes all quotes from the database.
 * @returns The number of quotes deleted.
 */
export const eraseAllQuotes = async (): Promise<number> => {
    const adminDb = getAdminDb();
    const quotesCollection = adminDb.collection(QUOTES_COLLECTION);
    const snapshot = await quotesCollection.limit(500).get(); // Process in batches of 500

    if (snapshot.empty) {
        return 0;
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // If there might be more than 500, recurse
    if (snapshot.size === 500) {
        return snapshot.size + await eraseAllQuotes();
    }

    return snapshot.size;
}
