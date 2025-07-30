
/**
 * @fileOverview Service for managing inspirational quotes in Firestore.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';

const QUOTES_COLLECTION = 'inspirationalQuotes';

export type QuoteCategory = 'Quran' | 'Hadith';

export interface Quote {
  id?: string;
  text: string;
  source: string;
  category: QuoteCategory;
}

const quotesToSeed: Omit<Quote, 'id'>[] = [
    { text: "Indeed, those who believe and do righteous deeds and establish prayer and give zakah will have their reward with their Lord, and there will be no fear concerning them, nor will they grieve.", source: "Quran, 2:277", category: "Quran"},
    { text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran, 2:110", category: "Quran"},
    { text: "You will never attain righteousness until you donate some of what you cherish. And whatever you give is certainly known to Allah.", source: "Quran, 3:92", category: "Quran"},
    { text: "Those who in charity spend of their goods by night and by day, in secret and in public, have their reward with their Lord: on them shall be no fear, nor shall they grieve.", source: "Quran, 2:274", category: "Quran" },
    { text: "Allah is in the assistance of His servant as long as His servant is in the assistance of his brother.", source: "Hadith, Sahih Muslim", category: "Hadith"},
    { text: "The believer's shade on the Day of Resurrection will be his charity.", source: "Hadith, Tirmidhi", category: "Hadith" },
    { text: "When a man dies, his deeds come to an end except for three things: Sadaqah Jariyah (ceaseless charity); a knowledge which is beneficial, or a virtuous descendant who prays for him (for the deceased).", source: "Hadith, Muslim", category: "Hadith"},
    { text: "Protect yourself from hell-fire even by giving a piece of a date as charity.", source: "Hadith, Al-Bukhari and Muslim", category: "Hadith" },
];


/**
 * Fetches quotes from the database.
 * @param count The number of quotes to fetch. If not provided, all are fetched.
 * @returns An array of quote objects.
 */
export const getQuotes = async (count?: number): Promise<Quote[]> => {
    if (!isConfigValid) {
        console.warn("Firebase not configured, skipping quotes fetch.");
        return [];
    }
    try {
        const quotesQuery = count ? query(collection(db, QUOTES_COLLECTION), limit(count)) : query(collection(db, QUOTES_COLLECTION));
        const querySnapshot = await getDocs(quotesQuery);
        const quotes: Quote[] = [];
        querySnapshot.forEach((doc) => {
            quotes.push({ id: doc.id, ...(doc.data() as Omit<Quote, 'id'>) });
        });
        return quotes;
    } catch (error) {
        console.error("Error getting quotes: ", error);
        throw new Error('Failed to get quotes from database.');
    }
}

/**
 * Seeds the database with the initial set of quotes.
 * This function is designed to be run once.
 */
export const seedInitialQuotes = async (): Promise<string> => {
    if (!isConfigValid) {
        throw new Error("Firebase is not configured. Cannot seed quotes.");
    }
    const quotesCollection = collection(db, QUOTES_COLLECTION);
    const snapshot = await getDocs(query(quotesCollection, limit(1)));
    
    if (!snapshot.empty) {
        const msg = 'Quotes collection is not empty. Skipped seeding.';
        console.log(msg);
        return msg;
    }

    try {
        console.log('Seeding quotes...');
        const batch = writeBatch(db);
        quotesToSeed.forEach(quote => {
            const docRef = doc(quotesCollection);
            batch.set(docRef, quote);
        });
        await batch.commit();
        const msg = `Successfully seeded ${quotesToSeed.length} quotes.`;
        console.log(msg);
        return msg;
    } catch (error) {
        console.error("Error seeding quotes: ", error);
        throw new Error('Failed to seed quotes.');
    }
};
