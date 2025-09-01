

/**
 * @fileOverview Service for managing inspirational quotes in Firestore.
 */

import { adminDb } from './firebase';
import type { Quote } from './types';
import { WriteBatch } from 'firebase-admin/firestore';

// Re-export type for backward compatibility
export type { Quote };

const QUOTES_COLLECTION = 'inspirationalQuotes';

const ALL_QUOTES: Omit<Quote, 'id'>[] = [
    // Quran
    { text: "Those who in charity spend of their goods by night and by day, in secret and in public, have their reward with their Lord: on them shall be no fear, nor shall they grieve.", source: "Quran 2:274", category: "Quran" },
    { text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran 2:110", category: "Quran" },
    { text: "By no means shall you attain righteousness unless you give (freely) of that which you love; and whatever you give, of a truth Allah knoweth it well.", source: "Quran 3:92", category: "Quran" },
    { text: "The parable of those who spend their substance in the way of Allah is that of a grain of corn: it groweth seven ears, and each ear Hath a hundred grains. Allah giveth manifold increase to whom He pleaseth.", source: "Quran 2:261", category: "Quran" },
    { text: "And spend of your substance in the cause of Allah, and make not your own hands contribute to your destruction; but do good; for Allah loveth those who do good.", source: "Quran 2:195", category: "Quran" },
    { text: "So fear Allah as much as you are able; and listen and obey and spend in charity; that is better for yourselves. And whosoever is saved from his own covetousness, then they are the successful ones.", source: "Quran 64:16", category: "Quran" },

    // Hadith
    { text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Sahih al-Bukhari 1422", category: "Hadith" },
    { text: "Protect yourself from hellfire even by giving a piece of a date as charity.", source: "Sahih al-Bukhari 1417", category: "Hadith" },
    { text: "Charity does not decrease wealth.", source: "Sahih Muslim 2588", category: "Hadith" },
    { text: "When a man dies, his deeds come to an end except for three things: Sadaqah Jariyah (ceaseless charity); a knowledge which is beneficial, or a virtuous descendant who prays for him.", source: "Sahih Muslim 1631", category: "Hadith" },
    { text: "A charity is due for every joint in each person on every day the sun comes up.", source: "Sahih al-Bukhari 2989", category: "Hadith" },
    { text: "The upper hand is better than the lower hand. The upper hand is the one that gives, and the lower hand is the one that takes.", source: "Sahih al-Bukhari 1429", category: "Hadith" },
    { text: "Every act of goodness is charity.", source: "Sahih Muslim 1005", category: "Hadith" },
    { text: "A man's giving in charity does not diminish his wealth.", source: "Tirmidhi", category: "Hadith" },
    { text: "The best charity is that which is practiced by a wealthy person. And start giving first to your dependents.", source: "Sahih al-Bukhari 1426", category: "Hadith" },

    // Scholars
    { text: "The best of people are those who are most beneficial to people.", source: "Prophet Muhammad (ﷺ)", category: "Scholar" },
    { text: "A man's true wealth is the good he does in this world.", source: "Imam Ali (RA)", category: "Scholar" },
    { text: "Do not feel ashamed if the amount of charity is small, because to refuse the needy is an act of greater shame.", source: "Imam Ali (RA)", category: "Scholar" },
    { text: "The wealth of a miser is as useless as a pebble.", source: "Umar ibn al-Khattab (RA)", category: "Scholar" },
    { text: "Generosity is not in giving me that which I need more than you, but it is in giving me that which you need more than I.", source: "Khalil Gibran", category: "Scholar" },
    { text: "Give charity without delay, for it stands in the way of calamity.", source: "Al-Tirmidhi", category: "Scholar" },
    { text: "Do not withhold your money from the poor, for if you do, Allah will withhold His blessings from you.", source: "Ibn Qayyim Al-Jawziyya", category: "Scholar" },
    { text: "The life of this world is nothing but a provision, and the Hereafter is the final destination.", source: "Hasan al-Basri", category: "Scholar" },
    { text: "The most beloved of deeds to Allah are the most consistent of them, even if they are few.", source: "Prophet Muhammad (ﷺ)", category: "Scholar" },
    { text: "If you are unable to do a good deed, then at least do not do a bad one.", source: "Abu Bakr (RA)", category: "Scholar" },
    { text: "Knowledge without action is arrogance.", source: "Imam Al-Ghazali", category: "Scholar" },
    { text: "Patience is a pillar of faith.", source: "Umar ibn al-Khattab (RA)", category: "Scholar" },
    { text: "Forgive people so that perhaps Allah may forgive you.", source: "Uthman ibn Affan (RA)", category: "Scholar" },
    { text: "Sincerity is to forget the creation by constantly looking at the Creator.", source: "Ibn Qayyim Al-Jawziyya", category: "Scholar" },
    { text: "The best richness is the richness of the soul.", source: "Prophet Muhammad (ﷺ)", category: "Scholar" },
    { text: "Seek knowledge from the cradle to the grave.", source: "Prophet Muhammad (ﷺ)", category: "Scholar" },
];


/**
 * Seeds the database with a large set of initial quotes if it's empty.
 * @returns A status message.
 */
export const seedInitialQuotes = async (): Promise<string> => {
  
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
    try {
        const quotesQuery = adminDb.collection(QUOTES_COLLECTION);
        const querySnapshot = await quotesQuery.get();
        const quotes: Quote[] = [];
        querySnapshot.forEach((doc) => {
            quotes.push({ id: doc.id, ...doc.data() } as Quote);
        });
        return quotes;
    } catch (error) {
        console.error("Error getting all quotes: ", error);
        return [];
    }
}


/**
 * Fetches a specified number of random quotes.
 * @param count The number of random quotes to fetch.
 * @returns An array of random quote objects.
 */
export const getRandomQuotes = async (count: number): Promise<Quote[]> => {
    try {
        let allQuotes: Quote[] = await getAllQuotes();
        
        // If DB is empty or not configured, use the hardcoded list
        if (allQuotes.length === 0) {
            allQuotes = ALL_QUOTES.map((q, i) => ({...q, id: `quote-${i}`}));
        }
        
        const shuffled = allQuotes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);

    } catch (error) {
        console.error("Error getting random quotes, falling back to hardcoded list: ", error);
        // Fallback to hardcoded quotes on any error
        const shuffled = ALL_QUOTES.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map((q, i) => ({...q, id: `quote-fallback-${i}`}));
    }
}
