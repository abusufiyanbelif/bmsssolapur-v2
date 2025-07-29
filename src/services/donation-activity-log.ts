
/**
 * @fileOverview Service for logging donation-related activities.
 * @deprecated This file is deprecated. Use the centralized activity-log-service.ts instead.
 */

import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const DONATION_ACTIVITY_LOG_COLLECTION = 'donationActivityLogs';

interface ActivityLog {
  donationId: string;
  timestamp: Timestamp;
  activity: string; // e.g., 'Created', 'Status Changed', 'Allocated'
  details: Record<string, any>;
  performedBy?: string; // User ID of the admin who performed the action
}

/**
 * Logs an activity for a specific donation.
 * This is a "fire-and-forget" operation.
 * @param donationId The ID of the donation.
 * @param activity A short description of the activity.
 * @param details An object containing details about the activity.
 * @param performedBy The ID of the user performing the action.
 * @deprecated Use logActivity from activity-log-service.ts
 */
export const logDonationActivity = async (
  donationId: string,
  activity: string,
  details: Record<string, any>,
  performedBy?: string
) => {
  try {
    const log: Omit<ActivityLog, 'timestamp'> & { timestamp: any } = {
      donationId,
      activity,
      details,
      timestamp: serverTimestamp(), // Use server timestamp for consistency
    };
    if (performedBy) {
      log.performedBy = performedBy;
    }

    await addDoc(collection(db, DONATION_ACTIVITY_LOG_COLLECTION), log);
  } catch (error) {
    console.error(`Error logging donation activity for donation ${donationId}:`, error);
    // We don't throw an error here because logging is a non-critical,
    // "fire-and-forget" operation. We don't want to block the main action.
  }
};
