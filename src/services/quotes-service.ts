/**
 * @fileOverview Service for managing inspirational quotes in Firestore.
 */

import {
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import { getBulkInspirationalQuotes, Quote } from '@/ai/flows/get-bulk-quotes-flow';

const QUOTES_COLLECTION = 'inspirationalQuotes';

export type { Quote };

/**
 * Seeds the database with a large set of initial quotes if it's empty.
 * @returns A status message.
 */
export const seedInitialQuotes = async (): Promise<string> => {
  if (!isConfigValid) {
    return "Firebase not configured. Skipped quote seeding.";
  }
  
  const quotesCollection = collection(db, QUOTES_COLLECTION);
  const snapshot = await getDocs(query(quotesCollection, limit(1)));

  if (!snapshot.empty) {
    const msg = "Quotes collection is not empty. Skipped seeding.";
    console.log(msg);
    return msg;
  }

  console.log("Quotes collection is empty. Seeding initial quotes from AI...");
  try {
    const quotesToSeed = await getBulkInspirationalQuotes();
    if (!quotesToSeed || quotesToSeed.length === 0) {
        throw new Error("AI flow returned no quotes to seed.");
    }
    
    // Use a batch write for efficiency
    const batch = writeBatch(db);
    quotesToSeed.forEach((quote) => {
      const quoteRef = doc(quotesCollection);
      batch.set(quoteRef, quote);
    });

    await batch.commit();
    const successMsg = `Successfully seeded ${quotesToSeed.length} quotes.`;
    console.log(successMsg);
    return successMsg;
  } catch (error) {
    const errorMsg = "Failed to seed quotes from AI flow.";
    console.error(errorMsg, error);
    throw new Error(errorMsg);
  }
};

/**
 * Fetches all quotes from the database.
 * @returns An array of all quote objects.
 */
export const getAllQuotes = async (): Promise<Quote[]> => {
    if (!isConfigValid) return [];
    try {
        const quotesQuery = query(collection(db, QUOTES_COLLECTION));
        const querySnapshot = await getDocs(quotesQuery);
        const quotes: Quote[] = [];
        querySnapshot.forEach((doc) => {
            quotes.push({ id: doc.id, ...doc.data() } as Quote);
        });
        return quotes;
    } catch (error) {
        console.error("Error getting all quotes: ", error);
        throw new Error('Failed to get all quotes.');
    }
}

const hardcodedQuotes: Quote[] = [
    {
        text: "The believer's shade on the Day of Resurrection will be their charity.",
        source: "Sahih al-Bukhari 1422",
        category: "Hadith"
    },
    {
        text: "Those who in charity spend of their goods by night and by day, in secret and in public, have their reward with their Lord: on them shall be no fear, nor shall they grieve.",
        source: "Quran 2:274",
        category: "Quran"
    },
    {
        text: "A man's true wealth is the good he does in this world.",
        source: "Imam Ali",
        category: "Scholar"
    },
    {
        text: "Every act of goodness is charity.",
        source: "Sahih Muslim 1004",
        category: "Hadith"
    }
];

/**
 * Fetches a specified number of random quotes from the database.
 * @param count The number of random quotes to fetch.
 * @returns An array of random quote objects.
 */
export const getRandomQuotes = async (count: number): Promise<Quote[]> => {
    // For now, return hardcoded quotes to ensure the UI is stable.
    const shuffled = hardcodedQuotes.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);

    // The database logic can be restored later for production.
    /*
    if (!isConfigValid) return [];
    try {
        const allQuotes = await getAllQuotes();
        if (allQuotes.length === 0) {
            return [];
        }
        
        // Simple shuffle and slice algorithm for random selection
        const shuffled = allQuotes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);

    } catch (error) {
        console.error("Error getting random quotes: ", error);
        throw new Error('Failed to get random quotes.');
    }
    */
}
