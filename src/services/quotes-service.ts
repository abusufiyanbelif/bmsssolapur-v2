/**
 * @fileOverview Service for managing inspirational quotes in Firestore.
 */

import { adminDb } from './firebase-admin';
import type { Quote } from './types';
import { WriteBatch } from 'firebase-admin/firestore';

// Re-export type for backward compatibility
export type { Quote };

const QUOTES_COLLECTION = 'inspirationalQuotes';

const ALL_QUOTES: Omit<Quote, 'id'>[] = [
    // Quran
    { number: 1, text: "Those who in charity spend of their goods by night and by day, in secret and in public, have their reward with their Lord: on them shall be no fear, nor shall they grieve.", source: "Quran 2:274", category: "Quran" },
    { number: 2, text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran 2:110", category: "Quran" },
    { number: 3, text: "By no means shall you attain righteousness unless you give (freely) of that which you love; and whatever you give, of a truth Allah knoweth it well.", source: "Quran 3:92", category: "Quran" },
    { number: 4, text: "The parable of those who spend their substance in the way of Allah is that of a grain of corn: it groweth seven ears, and each ear Hath a hundred grains. Allah giveth manifold increase to whom He pleaseth.", source: "Quran 2:261", category: "Quran" },
    { number: 5, text: "And spend of your substance in the cause of Allah, and make not your own hands contribute to your destruction; but do good; for Allah loveth those who do good.", source: "Quran 2:195", category: "Quran" },
    { number: 6, text: "So fear Allah as much as you are able; and listen and obey and spend in charity; that is better for yourselves. And whosoever is saved from his own covetousness, then they are the successful ones.", source: "Quran 64:16", category: "Quran" },
    { number: 7, text: "Zakat expenditures are only for the poor and for the needy and for those employed to collect [zakat] and for bringing hearts together [for Islam] and for freeing captives [or slaves] and for those in debt and for the cause of Allah and for the [stranded] traveler - an obligation [imposed] by Allah. And Allah is Knowing and Wise.", source: "Quran 9:60", category: "Quran" },
    { number: 8, text: "And in their wealth there is a known right for the beggar and the deprived.", source: "Quran 70:24-25", category: "Quran" },
    { number: 9, text: "If you disclose your charitable expenditures, they are good; but if you conceal them and give them to the poor, it is better for you, and He will remove from you some of your misdeeds. And Allah, with what you do, is [fully] Acquainted.", source: "Quran 2:271", category: "Quran" },
    { number: 10, text: "And whatever you spend of good, it is for yourselves. And you do not spend except seeking the countenance of Allah. And whatever you spend of good, it will be fully repaid to you, and you will not be wronged.", source: "Quran 2:272", category: "Quran" },
    { number: 11, text: "And cooperate in righteousness and piety, but do not cooperate in sin and aggression. And fear Allah; indeed, Allah is severe in penalty.", source: "Quran 5:2", category: "Quran" },

    // Hadith
    { number: 1, text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Tirmidhi", category: "Hadith" },
    { number: 2, text: "Protect yourself from hellfire even by giving a piece of a date as charity.", source: "Sahih al-Bukhari 1417", category: "Hadith" },
    { number: 3, text: "Charity does not decrease wealth.", source: "Sahih Muslim 2588", category: "Hadith" },
    { number: 4, text: "When a man dies, his deeds come to an end except for three things: Sadaqah Jariyah (ceaseless charity); a knowledge which is beneficial, or a virtuous descendant who prays for him.", source: "Sahih Muslim 1631", category: "Hadith" },
    { number: 5, text: "A charity is due for every joint in each person on every day the sun comes up.", source: "Sahih al-Bukhari 2989", category: "Hadith" },
    { number: 6, text: "The upper hand is better than the lower hand. The upper hand is the one that gives, and the lower hand is the one that takes.", source: "Sahih al-Bukhari 1429", category: "Hadith" },
    { number: 7, text: "Every act of goodness is charity.", source: "Sahih Muslim 1005", category: "Hadith" },
    { number: 8, text: "A man's giving in charity does not diminish his wealth.", source: "Tirmidhi", category: "Hadith" },
    { number: 9, text: "The best charity is that which is practiced by a wealthy person. And start giving first to your dependents.", source: "Sahih al-Bukhari 1426", category: "Hadith" },
    { number: 10, text: "Give charity without delay, for it stands in the way of calamity.", source: "Al-Tirmidhi", category: "Hadith" },
    { number: 11, text: "The best of people are those who are most beneficial to people.", source: "Prophet Muhammad (ﷺ), Musnad Ahmed", category: "Hadith" },
    { number: 12, text: "Allah is in the aid of His servant as long as the servant is in the aid of his brother.", source: "Sahih Muslim", category: "Hadith" },
    { number: 13, text: "Wealth is not diminished by charity. And a forgiving servant is not increased by Allah except in honor. And no one humbles himself for the sake of Allah but that Allah will raise his status.", source: "Sahih Muslim", category: "Hadith" },

    // Scholars
    { number: 1, text: "A man's true wealth is the good he does in this world.", source: "Imam Ali (RA)", category: "Scholar" },
    { number: 2, text: "Do not feel ashamed if the amount of charity is small, because to refuse the needy is an act of greater shame.", source: "Imam Ali (RA)", category: "Scholar" },
    { number: 3, text: "The wealth of a miser is as useless as a pebble.", source: "Umar ibn al-Khattab (RA)", category: "Scholar" },
    { number: 4, text: "Generosity is not in giving me that which I need more than you, but it is in giving me that which you need more than I.", source: "Khalil Gibran", category: "Scholar" },
    { number: 5, text: "Do not withhold your money from the poor, for if you do, Allah will withhold His blessings from you.", source: "Ibn Qayyim Al-Jawziyya", category: "Scholar" },
    { number: 6, text: "The life of this world is nothing but a provision, and the Hereafter is the final destination.", source: "Hasan al-Basri", category: "Scholar" },
    { number: 7, text: "The most beloved of deeds to Allah are the most consistent of them, even if they are few.", source: "Prophet Muhammad (ﷺ)", category: "Scholar" },
    { number: 8, text: "If you are unable to do a good deed, then at least do not do a bad one.", source: "Abu Bakr (RA)", category: "Scholar" },
    { number: 9, text: "Knowledge without action is arrogance.", source: "Imam Al-Ghazali", category: "Scholar" },
    { number: 10, text: "Patience is a pillar of faith.", source: "Umar ibn al-Khattab (RA)", category: "Scholar" },
    { number: 11, text: "Forgive people so that perhaps Allah may forgive you.", source: "Uthman ibn Affan (RA)", category: "Scholar" },
    { number: 12, text: "Sincerity is to forget the creation by constantly looking at the Creator.", source: "Ibn Qayyim Al-Jawziyya", category: "Scholar" },
    { number: 13, text: "The best richness is the richness of the soul.", source: "Prophet Muhammad (ﷺ)", category: "Scholar" },
    { number: 14, text: "Seek knowledge from the cradle to the grave.", source: "Prophet Muhammad (ﷺ)", category: "Scholar" },
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
        // Re-throw the error so the caller can handle it, e.g., by using a fallback.
        throw error;
    }
}
