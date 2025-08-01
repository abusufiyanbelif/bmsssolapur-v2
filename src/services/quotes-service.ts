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

const QUOTES_COLLECTION = 'inspirationalQuotes';

export interface Quote {
  id?: string;
  text: string;
  source: string;
  category: 'Quran' | 'Hadith' | 'Scholar';
}

const hardcodedQuotes: Omit<Quote, 'id'>[] = [
    // Quran
    { text: "Those who in charity spend of their goods by night and by day, in secret and in public, have their reward with their Lord: on them shall be no fear, nor shall they grieve.", source: "Quran 2:274", category: "Quran" },
    { text: "By no means shall you attain righteousness unless you give (freely) of that which you love.", source: "Quran 3:92", category: "Quran" },
    { text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran 2:110", category: "Quran" },
    { text: "The likeness of those who spend their wealth in the way of Allah is as the likeness of a grain of corn; it grows seven ears, and each ear has a hundred grains. Allah gives manifold increase to whom He pleases.", source: "Quran 2:261", category: "Quran" },
    { text: "If you give charity openly, it is good, but if you keep it secret and give it to the needy, it is better for you.", source: "Quran 2:271", category: "Quran" },
    
    // Hadith
    { text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Sahih al-Bukhari 1422", category: "Hadith" },
    { text: "Every act of goodness is charity.", source: "Sahih Muslim 1004", category: "Hadith" },
    { text: "Give charity without delay, for it stands in the way of calamity.", source: "Al-Tirmidhi 589", category: "Hadith" },
    { text: "The best among you are those who bring greatest benefits to many others.", source: "Daraqutni, Hasan", category: "Hadith" },
    { text: "He who removes from a believer a difficulty of this world, Allah will remove one of his difficulties on the Day of Judgement.", source: "Sahih Muslim 2699", category: "Hadith"},
    { text: "Protect yourself from hell-fire even by giving a piece of a date as charity.", source: "Sahih al-Bukhari 1417", category: "Hadith" },
    { text: "The upper hand (the one that gives) is better than the lower hand (the one that receives).", source: "Sahih al-Bukhari 1429", category: "Hadith" },
    { text: "When a man dies, his deeds come to an end except for three things: Sadaqah Jariyah (ceaseless charity); a knowledge which is beneficial, or a virtuous descendant who prays for him.", source: "Sahih Muslim 1631", category: "Hadith" },
    { text: "A charity is due for every joint in each person on every day the sun comes up.", source: "Sahih al-Bukhari 2707", category: "Hadith" },
    { text: "Allah will deprive usury of all blessing, but will give increase for deeds of charity.", source: "Sahih al-Bukhari 2051", category: "Hadith" },

    // Scholars
    { text: "A man's true wealth is the good he does in this world.", source: "Imam Ali (RA)", category: "Scholar" },
    { text: "Do not show lethargy or negligence in giving charity and doing good deeds. Verily, the calamitous horrors of hell-fire can be averted only by the charity which you give.", source: "Imam Al-Ghazali", category: "Scholar" },
    { text: "Knowledge is the life of the mind.", source: "Imam Abu Hanifa", category: "Scholar"},
    { text: "The most beloved of people to Allah is the one who is most beneficial to the people.", source: "Imam Al-Tabarani", category: "Scholar" },
    { text: "Patience is a pillar of faith, and charity is a proof.", source: "Ibn Qayyim al-Jawziyya", category: "Scholar" },
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

  console.log("Quotes collection is empty. Seeding initial quotes from hardcoded list...");
  try {
    const quotesToSeed = hardcodedQuotes;
    
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
 * For now, it uses a hardcoded list to ensure UI stability.
 * @param count The number of random quotes to fetch.
 * @returns An array of random quote objects.
 */
export const getRandomQuotes = async (count: number): Promise<Quote[]> => {
    // Simple shuffle and slice algorithm for random selection from the hardcoded list
    const shuffled = hardcodedQuotes.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);

    // The database logic can be restored later for production.
    /*
    if (!isConfigValid) return [];
    try {
        const allQuotes = await getAllQuotes();
        if (allQuotes.length === 0) {
            // Fallback to hardcoded quotes if DB is empty
            const shuffled = hardcodedQuotes.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        }
        
        const shuffled = allQuotes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);

    } catch (error) {
        console.error("Error getting random quotes: ", error);
        // Fallback to hardcoded quotes on error
        const shuffled = hardcodedQuotes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    */
}
