/**
 * @fileOverview Service for managing inspirational quotes in Firestore.
 */

import { getAdminDb } from './firebase-admin';
import type { Quote } from './types';
import { WriteBatch } from 'firebase-admin/firestore';
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
 * @returns An array of all quote objects.
 */
export const getAllQuotes = async (): Promise<Quote[]> => {
    const adminDb = getAdminDb();
    try {
        const quotesQuery = adminDb.collection(QUOTES_COLLECTION);
        const querySnapshot = await quotesQuery.get();
        if (querySnapshot.empty) {
            console.log("Quotes collection is empty, attempting to seed initial data.");
            await seedInitialQuotes();
            // Re-fetch after seeding
            const newSnapshot = await quotesQuery.get();
             const quotes: Quote[] = [];
            newSnapshot.forEach((doc) => {
                quotes.push({ id: doc.id, ...doc.data() } as Quote);
            });
            return quotes;
        }
        const quotes: Quote[] = [];
        querySnapshot.forEach((doc) => {
            quotes.push({ id: doc.id, ...doc.data() } as Quote);
        });
        return quotes;
    } catch (error) {
        // Specifically check for the access token error and fall back gracefully.
        if (error instanceof Error && error.message.includes('Could not refresh access token')) {
            console.warn("Could not refresh access token for quotes, falling back to hardcoded list.");
        } else {
            console.error("Error getting all quotes, falling back to hardcoded list: ", error);
        }

        // Fallback to a simple list if any service fails
        return [
            { id: 'fb1', number: 1, text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
            { id: 'fb2', number: 2, text: "Charity does not decrease wealth.", source: "Sahih Muslim", category: "Hadith", categoryTypeNumber: 2 },
            { id: 'fb3', number: 3, text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran 2:110", category: "Quran", categoryTypeNumber: 1 },
        ];
    }
}
