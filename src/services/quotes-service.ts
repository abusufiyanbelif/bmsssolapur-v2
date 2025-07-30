
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
  where,
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';

const QUOTES_COLLECTION = 'inspirationalQuotes';

export type QuoteCategory = 'Quran' | 'Hadith' | 'Scholar';

export interface Quote {
  id?: string;
  text: string;
  source: string;
  category: QuoteCategory;
}

const quotesToSeed: Omit<Quote, 'id'>[] = [
    // --- Quran ---
    { text: "Indeed, those who believe and do righteous deeds and establish prayer and give zakah will have their reward with their Lord, and there will be no fear concerning them, nor will they grieve.", source: "Quran, 2:277", category: "Quran"},
    { text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran, 2:110", category: "Quran"},
    { text: "You will never attain righteousness until you donate some of what you cherish. And whatever you give is certainly known to Allah.", source: "Quran, 3:92", category: "Quran"},
    { text: "Those who in charity spend of their goods by night and by day, in secret and in public, have their reward with their Lord: on them shall be no fear, nor shall they grieve.", source: "Quran, 2:274", category: "Quran" },
    { text: "And they give food in spite of love for it to the needy, the orphan, and the captive, [Saying], 'We feed you only for the countenance of Allah. We wish not from you reward or gratitude.'", source: "Quran, 76:8-9", category: "Quran"},
    { text: "The example of those who spend their wealth in the way of Allah is like a seed [of grain] which grows seven spikes; in each spike is a hundred grains. And Allah multiplies [His reward] for whom He wills. And Allah is all-Encompassing and Knowing.", source: "Quran, 2:261", category: "Quran"},
    { text: "And in their wealth there is a known right for the petitioner and the deprived.", source: "Quran, 70:24-25", category: "Quran"},

    // --- Hadith ---
    { text: "Allah is in the assistance of His servant as long as His servant is in the assistance of his brother.", source: "Hadith, Sahih Muslim", category: "Hadith"},
    { text: "The believer's shade on the Day of Resurrection will be his charity.", source: "Hadith, Tirmidhi", category: "Hadith" },
    { text: "When a man dies, his deeds come to an end except for three things: Sadaqah Jariyah (ceaseless charity); a knowledge which is beneficial, or a virtuous descendant who prays for him (for the deceased).", source: "Hadith, Muslim", category: "Hadith"},
    { text: "Protect yourself from hell-fire even by giving a piece of a date as charity.", source: "Hadith, Al-Bukhari and Muslim", category: "Hadith" },
    { text: "Give charity without delay, for it stands in the way of calamity.", source: "Hadith, Tirmidhi", category: "Hadith"},
    { text: "Every act of kindness is a charity.", source: "Hadith, Bukhari, Muslim", category: "Hadith"},
    { text: "A man's true wealth is the good he does in this world.", source: "Hadith", category: "Hadith"},
    { text: "The upper hand is better than the lower hand. The upper hand is that of the giver and the lower hand is that of the beggar.", source: "Hadith, Bukhari", category: "Hadith"},
    { text: "A charity is due for every joint in each person on every day the sun comes up: to act justly between two people is a charity; to help a man with his mount, lifting him onto it or hoisting up his belongings onto it, is a charity; a good word is a charity; and removing a harmful thing from the road is a charity.", source: "Hadith, Bukhari, Muslim", category: "Hadith"},
    { text: "The best of you are those who are best to their families.", source: "Prophet Muhammad (ﷺ), narrated by Aisha (R.A)", category: "Hadith"},


    // --- Islamic Scholars ---
    { text: "The dunya is like a shadow. If you try to catch it, you will never be able to do so. If you turn your back towards it, it has no choice but to follow you.", source: "Ibn Qayyim Al-Jawziyya", category: "Scholar"},
    { text: "What is destined for you will reach you, even if it be underneath two mountains. What is not destined for you will not reach you, even if it be between your two lips.", source: "Imam Al-Ghazali", category: "Scholar"},
    { text: "Do not belittle any good deed, even meeting your brother with a cheerful face.", source: "Imam Nawawi", category: "Scholar"},
    { text: "Generosity is not in giving me that which I need more than you, but it is in giving me that which you need more than I.", source: "Kahlil Gibran", category: "Scholar"},
    { text: "Patience is a pillar of faith.", source: "Umar ibn al-Khattab (R.A)", category: "Scholar"},
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
 * Fetches one random quote from each category.
 * @returns An array of three quote objects, one for each category.
 */
export async function getRandomQuotesFromEachCategory(): Promise<Quote[]> {
  if (!isConfigValid) {
    console.warn("Firebase not configured, skipping random quotes fetch.");
    return [];
  }

  const categories: QuoteCategory[] = ['Quran', 'Hadith', 'Scholar'];
  const randomQuotes: Quote[] = [];

  try {
    for (const category of categories) {
      const q = query(collection(db, QUOTES_COLLECTION), where("category", "==", category));
      const snapshot = await getDocs(q);
      const quotesFromCategory: Quote[] = [];
      snapshot.forEach(doc => quotesFromCategory.push({ id: doc.id, ...doc.data() as Omit<Quote, 'id'> }));
      
      if (quotesFromCategory.length > 0) {
        const randomIndex = Math.floor(Math.random() * quotesFromCategory.length);
        randomQuotes.push(quotesFromCategory[randomIndex]);
      }
    }
    return randomQuotes;
  } catch (error) {
    console.error("Error fetching random quotes:", error);
    // It's likely a composite index is missing if another error occurs.
    if (error instanceof Error && error.message.includes('requires an index')) {
        console.error("Firestore composite index missing. Please create a composite index on 'inspirationalQuotes' collection with 'category' (ascending).");
    }
    return []; // Return empty array on error
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
