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
import { getBulkInspirationalQuotes } from '@/ai/flows/get-bulk-quotes-flow';

const QUOTES_COLLECTION = 'inspirationalQuotes';

export interface Quote {
  id?: string;
  text: string;
  source: string;
  category: 'Quran' | 'Hadith' | 'Scholar';
}

const hardcodedFallbackQuotes: Omit<Quote, 'id'>[] = [
    { text: "Those who in charity spend of their goods by night and by day, in secret and in public, have their reward with their Lord: on them shall be no fear, nor shall they grieve.", source: "Quran 2:274", category: "Quran" },
    { text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Sahih al-Bukhari 1422", category: "Hadith" },
    { text: "A man's true wealth is the good he does in this world.", source: "Imam Ali (RA)", category: "Scholar" },
];

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

  console.log("Quotes collection is empty. Seeding initial quotes from AI flow...");
  try {
    const quotesToSeed = await getBulkInspirationalQuotes();
    
    // Use a batch write for efficiency
    const batch = writeBatch(db);
    quotesToSeed.forEach((quote) => {
      const quoteRef = doc(quotesCollection);
      batch.set(quoteRef, quote);
    });

    await batch.commit();
    const successMsg = `Successfully seeded ${quotesToSeed.length} quotes from AI flow.`;
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


/**
 * Fetches a specified number of random quotes.
 * @param count The number of random quotes to fetch.
 * @returns An array of random quote objects.
 */
export const getRandomQuotes = async (count: number): Promise<Quote[]> => {
    try {
        if (!isConfigValid) {
            // If firebase is not set up, return from hardcoded list.
            const shuffled = hardcodedFallbackQuotes.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        };
        const allQuotes = await getAllQuotes();
        if (allQuotes.length === 0) {
            // Fallback to hardcoded quotes if DB is empty
            const shuffled = hardcodedFallbackQuotes.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        }
        
        const shuffled = allQuotes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);

    } catch (error) {
        console.error("Error getting random quotes: ", error);
        // Fallback to hardcoded quotes on error
        const shuffled = hardcodedFallbackQuotes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}
