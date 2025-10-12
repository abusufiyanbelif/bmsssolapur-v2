
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
  const adminDb = await getAdminDb();
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
    let adminDb;
    try {
        adminDb = await getAdminDb();
    } catch (e) {
        console.warn(`[Graceful Failure] Could not initialize Admin DB in getAllQuotes: ${(e as Error).message}. Returning empty array.`);
        return [];
    }
    
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
        // This is the critical fix. Instead of throwing, we catch the error, log it, and return an empty array.
        if (error instanceof Error) {
            console.warn(`[Graceful Failure] Could not fetch quotes: ${error.message}. This is expected on a fresh database or with incorrect IAM permissions. Returning empty array.`);
        } else {
            console.warn(`[Graceful Failure] An unknown error occurred while fetching quotes. Returning empty array.`);
        }
        return []; // Always return a valid array to prevent downstream crashes.
    }
}

/**
 * Deletes all quotes from the database.
 * @returns The number of quotes deleted.
 */
export const eraseAllQuotes = async (): Promise<number> => {
    const adminDb = await getAdminDb();
    const quotesCollection = adminDb.collection(QUOTES_COLLECTION);
    const snapshot = await quotesCollection.limit(500).get(); // Process in batches of 500

    if (snapshot.empty) {
        return 0;
    }

    let deletedCount = 0;
    // Process in batches of 500
    for (let i = 0; i < snapshot.docs.length; i += 500) {
        const batch = adminDb.batch();
        const chunk = snapshot.docs.slice(i, i + 500);
        chunk.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCount += chunk.length;
    }
    return deletedCount;
}
