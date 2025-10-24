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
  const snapshot = await quotesCollection.get();

  // FIX: Check if the collection is truly empty by ignoring the _init_ doc
  if (!snapshot.empty && (snapshot.size > 1 || (snapshot.size === 1 && snapshot.docs[0].id !== '_init_'))) {
    const msg = "Quotes collection is not empty. Skipped seeding.";
    console.log(msg);
    return msg;
  }

  console.log("Quotes collection is empty or contains only init doc. Seeding initial quotes...");
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
    try {
        const adminDb = await getAdminDb();
        const quotesQuery = adminDb.collection(QUOTES_COLLECTION);
        const querySnapshot = await quotesQuery.get();
        if (querySnapshot.empty) {
            console.log("Quotes collection is empty, returning empty array.");
            return [];
        }
        const quotes: Quote[] = [];
        querySnapshot.forEach((doc) => {
            // CRITICAL FIX: Ignore the placeholder document.
            if (doc.id === '_init_') {
                return;
            }
            quotes.push({ id: doc.id, ...doc.data() } as Quote);
        });
        return quotes;
    } catch (error) {
        if (error instanceof Error) {
            console.warn(`[Graceful Fallback] Could not fetch quotes: ${error.message}. Returning empty array.`);
        } else {
            console.warn(`[Graceful Fallback] An unknown error occurred while fetching quotes. Returning empty array.`);
        }
        // This is a critical change: always return a valid array to prevent downstream crashes.
        return []; 
    }
}
