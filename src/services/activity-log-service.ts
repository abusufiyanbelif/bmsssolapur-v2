
'use server';
/**
 * @fileOverview Service for logging user activities.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';
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
  const adminDb = getAdminDb();
  try {
    const logWithTimestamp = {
      ...logData,
      timestamp: Timestamp.now(), // Use server timestamp for consistency
    };
    await adminDb.collection(ACTIVITY_LOG_COLLECTION).add(logWithTimestamp);
  } catch (error) {
    console.error(`Error logging activity for user ${logData.userId}:`, error);
    // We don't throw an error here because logging is a non-critical,
    // "fire-and-forget" operation. We don't want to block the main action.
  }
};


/**
 * Fetches all activity logs, ordered by most recent.
 * @returns An array of all activity log objects.
 */
export const getAllActivityLogs = async (): Promise<ActivityLog[]> => {
    const adminDb = getAdminDb();
    try {
        const q = adminDb.collection(ACTIVITY_LOG_COLLECTION).orderBy("timestamp", "desc");
        const querySnapshot = await q.get();
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
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a descending index on 'timestamp' for the 'activityLog' collection.");
             return [];
        }
        console.error("Error fetching all activity logs:", error);
        return [];
    }
};

/**
 * Fetches all activity logs for a specific user.
 * This fetches activities *performed by* the user.
 * @param userId The ID of the user.
 * @returns An array of activity log objects.
 */
export const getUserActivity = async (userId: string): Promise<ActivityLog[]> => {
    const adminDb = getAdminDb();
    try {
        // Query only by userId to avoid needing a composite index.
        const q = adminDb.collection(ACTIVITY_LOG_COLLECTION)
            .where("userId", "==", userId);
            
        const querySnapshot = await q.get();
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
        
        // Sort in code to avoid needing the index.
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return activities;
    } catch (error) {
        console.error("Error fetching user activity:", error);
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
    const adminDb = getAdminDb();
    try {
        const q = adminDb.collection(ACTIVITY_LOG_COLLECTION)
            .where("details.targetUserId", "==", targetUserId);

        const querySnapshot = await q.get();
        const activities: ActivityLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as ActivityLog);
        });

        // Sort in code to avoid needing a composite index
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        return activities;
    } catch (error) {
        console.error("Error fetching target user activity:", error);
        return [];
    }
}


/**
 * Fetches all activity logs for a specific donation.
 * @param donationId The ID of the donation.
 * @returns An array of activity log objects.
 */
export const getDonationActivity = async (donationId: string): Promise<ActivityLog[]> => {
    const adminDb = getAdminDb();
    try {
        const q = adminDb.collection(ACTIVITY_LOG_COLLECTION)
            .where("details.donationId", "==", donationId);
            
        const querySnapshot = await q.get();
        const activities: ActivityLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as ActivityLog);
        });
        
        // Sort in code to avoid needing a composite index
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return activities;
    } catch (error) {
        console.error("Error fetching donation activity:", error);
        return [];
    }
}

/**
 * Fetches all activity logs for a specific campaign.
 * @param campaignId The ID of the campaign.
 * @returns An array of activity log objects.
 */
export const getCampaignActivity = async (campaignId: string): Promise<ActivityLog[]> => {
    const adminDb = getAdminDb();
    try {
        const q = adminDb.collection(ACTIVITY_LOG_COLLECTION)
            .where("details.linkedCampaignId", "==", campaignId);
            
        const querySnapshot = await q.get();
        const activities: ActivityLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as ActivityLog);
        });
        
        // Sort in code to avoid needing a composite index
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return activities;
    } catch (error) {
        console.error("Error fetching campaign activity:", error);
        return [];
    }
}
