

'use server';
/**
 * @fileOverview Service for logging user activities.
 */

import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, Timestamp, FieldValue } from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import type { ActivityLog } from './types';

// Re-export type
export type { ActivityLog };

const ACTIVITY_LOG_COLLECTION = 'activityLog';

/**
 * Logs an activity for a specific user.
 * This is a "fire-and-forget" operation.
 * @param logData The data to be logged.
 */
export const logActivity = async (logData: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> => {
    if (!isConfigValid) {
        console.log("Firebase not configured. Skipping activity log.");
        return;
    }
  try {
    const logWithTimestamp: Omit<ActivityLog, 'id'> = {
      ...logData,
      timestamp: serverTimestamp(), // Use server timestamp for consistency
    };
    await addDoc(collection(db, ACTIVITY_LOG_COLLECTION), logWithTimestamp);
  } catch (error) {
    console.error(`Error logging activity for user ${logData.userId}:`, error);
    // We don't throw an error here because logging is a non-critical,
    // "fire-and-forget" operation. We don't want to block the main action.
  }
};


/**
 * Fetches all activity logs for a specific user.
 * This fetches activities *performed by* the user.
 * @param userId The ID of the user.
 * @returns An array of activity log objects.
 */
export const getUserActivity = async (userId: string): Promise<ActivityLog[]> => {
    if (!isConfigValid) {
        console.log("Firebase not configured. Skipping activity fetch.");
        return [];
    }
    try {
        const q = query(
            collection(db, ACTIVITY_LOG_COLLECTION),
            where("userId", "==", userId),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const activities: ActivityLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                ...data,
                // Ensure timestamp is a plain JS Date object for serialization
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as ActivityLog);
        });
        return activities;
    } catch (error) {
        console.error("Error fetching user activity:", error);
        // This could be due to a missing index. Log a helpful message.
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a composite index in Firestore on the 'activityLog' collection for 'userId' (ascending) and 'timestamp' (descending).");
        }
        return [];
    }
}


/**
 * Fetches all activity logs where a specific user was the target of the action.
 * e.g., get all logs where `details.targetUserId` is the given user.
 * @param targetUserId The ID of the user who was the subject of the action.
 * @returns An array of activity log objects.
 */
export const getTargetUserActivity = async (targetUserId: string): Promise<ActivityLog[]> => {
    if (!isConfigValid) {
        console.log("Firebase not configured. Skipping activity fetch.");
        return [];
    }
    try {
        const q = query(
            collection(db, ACTIVITY_LOG_COLLECTION),
            where("details.targetUserId", "==", targetUserId),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const activities: ActivityLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as ActivityLog);
        });
        return activities;
    } catch (error) {
        console.error("Error fetching target user activity:", error);
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a composite index in Firestore on the 'activityLog' collection for 'details.targetUserId' (ascending) and 'timestamp' (descending).");
        }
        return [];
    }
}


/**
 * Fetches all activity logs for a specific donation.
 * @param donationId The ID of the donation.
 * @returns An array of activity log objects.
 */
export const getDonationActivity = async (donationId: string): Promise<ActivityLog[]> => {
    if (!isConfigValid) {
        console.log("Firebase not configured. Skipping activity fetch.");
        return [];
    }
    try {
        const q = query(
            collection(db, ACTIVITY_LOG_COLLECTION),
            where("details.donationId", "==", donationId),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const activities: ActivityLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as ActivityLog);
        });
        return activities;
    } catch (error) {
        console.error("Error fetching donation activity:", error);
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a composite index in Firestore on the 'activityLog' collection for 'details.donationId' (ascending) and 'timestamp' (descending).");
        }
        return [];
    }
}
