
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
    { number: 1, text: "And be steadfast in prayer and regular in charity: And whatever good ye send forth for your souls before you, ye shall find it with Allah.", source: "Quran 2:110", category: "Quran", categoryTypeNumber: 1 },
    { number: 2, text: "And spend of your substance in the cause of Allah, and make not your own hands contribute to your destruction; but do good; for Allah loveth those who do good.", source: "Quran 2:195", category: "Quran", categoryTypeNumber: 1 },
    { number: 3, text: "The parable of those who spend their substance in the way of Allah is that of a grain of corn: it groweth seven ears, and each ear Hath a hundred grains. Allah giveth manifold increase to whom He pleaseth.", source: "Quran 2:261", category: "Quran", categoryTypeNumber: 1 },
    { number: 4, text: "Those who in charity spend of their goods by night and by day, in secret and in public, have their reward with their Lord: on them shall be no fear, nor shall they grieve.", source: "Quran 2:274", category: "Quran", categoryTypeNumber: 1 },
    { number: 5, text: "If you disclose your charitable expenditures, they are good; but if you conceal them and give them to the poor, it is better for you, and He will remove from you some of your misdeeds. And Allah, with what you do, is [fully] Acquainted.", source: "Quran 2:271", category: "Quran", categoryTypeNumber: 1 },
    { number: 6, text: "And whatever you spend of good, it is for yourselves. And you do not spend except seeking the countenance of Allah. And whatever you spend of good, it will be fully repaid to you, and you will not be wronged.", source: "Quran 2:272", category: "Quran", categoryTypeNumber: 1 },
    { number: 7, text: "By no means shall you attain righteousness unless you give (freely) of that which you love; and whatever you give, of a truth Allah knoweth it well.", source: "Quran 3:92", category: "Quran", categoryTypeNumber: 1 },
    { number: 8, text: "And cooperate in righteousness and piety, but do not cooperate in sin and aggression. And fear Allah; indeed, Allah is severe in penalty.", source: "Quran 5:2", category: "Quran", categoryTypeNumber: 1 },
    { number: 9, text: "Zakat expenditures are only for the poor and for the needy and for those employed to collect [zakat] and for bringing hearts together [for Islam] and for freeing captives [or slaves] and for those in debt and for the cause of Allah and for the [stranded] traveler - an obligation [imposed] by Allah. And Allah is Knowing and Wise.", source: "Quran 9:60", category: "Quran", categoryTypeNumber: 1 },
    { number: 10, text: "Take, [O, Muhammad], from their wealth a charity by which you purify them and cause them increase, and invoke [Allah's blessings] upon them. Indeed, your invocations are reassurance for them. And Allah is Hearing and Knowing.", source: "Quran 9:103", category: "Quran", categoryTypeNumber: 1 },
    { number: 11, text: "And in their wealth there is a known right for the beggar and the deprived.", source: "Quran 70:24-25", category: "Quran", categoryTypeNumber: 1 },
    { number: 12, text: "So fear Allah as much as you are able; and listen and obey and spend in charity; that is better for yourselves. And whosoever is saved from his own covetousness, then they are the successful ones.", source: "Quran 64:16", category: "Quran", categoryTypeNumber: 1 },
    { number: 13, text: "So he who is given his record in his right hand will say, 'Here, read my record! Indeed, I was certain that I would be meeting my account.' So he will be in a pleasant life...", source: "Quran 69:19-21", category: "Quran", categoryTypeNumber: 1 },
    { number: 14, text: "And they give food in spite of love for it to the needy, the orphan, and the captive, [Saying], 'We feed you only for the countenance of Allah. We wish not from you reward or gratitude.'", source: "Quran 76:8-9", category: "Quran", categoryTypeNumber: 1 },
    { number: 15, text: "Believe in Allah and His Messenger and spend out of that of which He has made you successors. For those who have believed among you and spent, there will be a great reward.", source: "Quran 57:7", category: "Quran", categoryTypeNumber: 1 },

    // Hadith
    { number: 1, text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
    { number: 2, text: "Charity does not decrease wealth.", source: "Sahih Muslim 2588", category: "Hadith", categoryTypeNumber: 2 },
    { number: 3, text: "Protect yourself from hellfire even by giving a piece of a date as charity.", source: "Sahih al-Bukhari 1417", category: "Hadith", categoryTypeNumber: 2 },
    { number: 4, text: "When a man dies, his deeds come to an end except for three things: Sadaqah Jariyah (ceaseless charity); a knowledge which is beneficial, or a virtuous descendant who prays for him.", source: "Sahih Muslim 1631", category: "Hadith", categoryTypeNumber: 2 },
    { number: 5, text: "The upper hand is better than the lower hand. The upper hand is the one that gives, and the lower hand is the one that takes.", source: "Sahih al-Bukhari 1429", category: "Hadith", categoryTypeNumber: 2 },
    { number: 6, text: "Every act of goodness is charity.", source: "Sahih Muslim 1005", category: "Hadith", categoryTypeNumber: 2 },
    { number: 7, text: "Give charity without delay, for it stands in the way of calamity.", source: "Al-Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
    { number: 8, text: "The best charity is that which is practiced by a wealthy person. And start giving first to your dependents.", source: "Sahih al-Bukhari 1426", category: "Hadith", categoryTypeNumber: 2 },
    { number: 9, text: "Allah is in the aid of His servant as long as the servant is in the aid of his brother.", source: "Sahih Muslim", category: "Hadith", categoryTypeNumber: 2 },
    { number: 10, text: "Wealth is not diminished by charity. And a forgiving servant is not increased by Allah except in honor. And no one humbles himself for the sake of Allah but that Allah will raise his status.", source: "Sahih Muslim", category: "Hadith", categoryTypeNumber: 2 },
    { number: 11, text: "A charity is due for every joint in each person on every day the sun comes up.", source: "Sahih al-Bukhari 2989", category: "Hadith", categoryTypeNumber: 2 },
    { number: 12, text: "The best of people are those who are most beneficial to people.", source: "Prophet Muhammad (ﷺ), Musnad Ahmed", category: "Hadith", categoryTypeNumber: 2 },
    { number: 13, text: "Charity extinguishes sins just as water extinguishes fire.", source: "Al-Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
    { number: 14, text: "Whoever relieves a believer’s distress of the distressful aspects of this world, Allah will rescue him from a difficulty of the difficulties of the Hereafter.", source: "Sahih Muslim", category: "Hadith", categoryTypeNumber: 2 },
    { number: 15, text: "The best charity is to satisfy a hungry person.", source: "Prophet Muhammad (ﷺ), Bayhaqi", category: "Hadith", categoryTypeNumber: 2 },
    { number: 16, text: "A man giving a dirham in his lifetime is better than giving one hundred dirhams when he is dying.", source: "Sunan Abi Dawud", category: "Hadith", categoryTypeNumber: 2 },
    { number: 17, text: "The best charity is giving water to drink.", source: "Ahmad", category: "Hadith", categoryTypeNumber: 2 },
    { number: 18, text: "Smiling in the face of your brother is charity.", source: "Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
    { number: 19, text: "Every Muslim has to give in charity. The people asked, 'O Allah's Messenger! If someone has nothing to give, what will he do?' He said, 'He should work with his hands and benefit himself and also give in charity (from what he earns).'", source: "Sahih al-Bukhari 1445", category: "Hadith", categoryTypeNumber: 2 },
    { number: 20, text: "The most beloved deed to Allah is the most regular and constant even if it were little.", source: "Sahih al-Bukhari", category: "Hadith", categoryTypeNumber: 2 },
    { number: 21, text: "Visit the sick, feed the hungry, and free the captive.", source: "Sahih al-Bukhari", category: "Hadith", categoryTypeNumber: 2 },
    { number: 22, text: "There is a reward for kindness to every living thing.", source: "Sahih al-Bukhari", category: "Hadith", categoryTypeNumber: 2 },
    { number: 23, text: "He is not a believer who eats his fill while his neighbor beside him is hungry.", source: "Bayhaqi", category: "Hadith", categoryTypeNumber: 2 },
    { number: 24, text: "Allah said, 'O son of Adam! Spend, and I shall spend on you.'", source: "Sahih al-Bukhari 5352", category: "Hadith", categoryTypeNumber: 2 },
    { number: 25, text: "Let he who has a spare mount lend it to him who has none, and let he who has a surplus of provisions give it to him who has none.", source: "Sahih Muslim", category: "Hadith", categoryTypeNumber: 2 },


    // Scholars
    { number: 1, text: "A man's true wealth is the good he does in this world.", source: "Imam Ali (RA)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 2, text: "Do not feel ashamed if the amount of charity is small, because to refuse the needy is an act of greater shame.", source: "Imam Ali (RA)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 3, text: "The wealth of a miser is as useless as a pebble.", source: "Umar ibn al-Khattab (RA)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 4, text: "Knowledge without action is arrogance.", source: "Imam Al-Ghazali", category: "Scholar", categoryTypeNumber: 3 },
    { number: 5, text: "Do not withhold your money from the poor, for if you do, Allah will withhold His blessings from you.", source: "Ibn Qayyim Al-Jawziyya", category: "Scholar", categoryTypeNumber: 3 },
    { number: 6, text: "If you are unable to do a good deed, then at least do not do a bad one.", source: "Abu Bakr (RA)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 7, text: "Sincerity is to forget the creation by constantly looking at the Creator.", source: "Ibn Qayyim Al-Jawziyya", category: "Scholar", categoryTypeNumber: 3 },
    { number: 8, text: "The best richness is the richness of the soul.", source: "Prophet Muhammad (ﷺ)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 9, text: "Seek knowledge from the cradle to the grave.", source: "Prophet Muhammad (ﷺ)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 10, text: "Generosity is not in giving me that which I need more than you, but it is in giving me that which you need more than I.", source: "Khalil Gibran", category: "Scholar", categoryTypeNumber: 3 },
    { number: 11, text: "Patience is a pillar of faith.", source: "Umar ibn al-Khattab (RA)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 12, text: "Forgive people so that perhaps Allah may forgive you.", source: "Uthman ibn Affan (RA)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 13, text: "The most beloved of deeds to Allah are the most consistent of them, even if they are few.", source: "Prophet Muhammad (ﷺ)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 14, text: "The life of this world is nothing but a provision, and the Hereafter is the final destination.", source: "Hasan al-Basri", category: "Scholar", categoryTypeNumber: 3 },
    { number: 15, text: "Whoever is not grateful to people is not grateful to Allah.", source: "Prophet Muhammad (ﷺ), Abu Dawud", category: "Scholar", categoryTypeNumber: 3 },
    { number: 16, text: "Give the gift of knowledge, it is the highest of all charities.", source: "Imam Ali (RA)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 17, text: "Do not look down upon any good deed, even if it be only meeting your brother with a cheerful face.", source: "Prophet Muhammad (ﷺ)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 18, text: "The best way to find yourself is to lose yourself in the service of others.", source: "Mahatma Gandhi", category: "Scholar", categoryTypeNumber: 3 },
    { number: 19, text: "Your wealth is not yours, but it is a trust from Allah, so spend it in His way.", source: "Uthman ibn Affan (RA)", category: "Scholar", categoryTypeNumber: 3 },
    { number: 20, text: "The best among you are those who have the best manners and character.", source: "Prophet Muhammad (ﷺ)", category: "Scholar", categoryTypeNumber: 3 }
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
