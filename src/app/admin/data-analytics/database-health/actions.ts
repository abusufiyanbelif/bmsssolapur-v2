
'use server';

import { getAdminDb } from '@/services/firebase-admin';
import type { Lead, Donation, User } from '@/services/types';

export interface CollectionStat {
    name: string;
    description: string;
    count: number;
    lastModified?: Date;
    orphanCheck?: {
        checked: boolean;
        orphanCount: number;
        details?: string;
    }
}

// This map provides metadata for known collections.
// Any new collections will be discovered automatically and given a default description.
const collectionsMetadata: Record<string, { description: string; timestampField?: string; orphanField?: string, orphanCollection?: string }> = {
    users: { description: 'Stores all user profiles, including donors, beneficiaries, and admins.', timestampField: 'updatedAt' },
    leads: { description: 'Contains all help requests (cases) for beneficiaries.', timestampField: 'updatedAt', orphanField: 'beneficiaryId', orphanCollection: 'users' },
    donations: { description: 'Holds all donation records, both online and manually entered.', timestampField: 'updatedAt', orphanField: 'donorId', orphanCollection: 'users' },
    campaigns: { description: 'Stores fundraising campaign details.', timestampField: 'updatedAt' },
    activityLog: { description: 'A log of all significant user and system actions.', timestampField: 'timestamp', orphanField: 'userId', orphanCollection: 'users' },
    organizations: { description: 'Stores the main organization profile details.' },
    settings: { description: 'Contains global application configurations.' },
    publicLeads: { description: 'Sanitized, public-facing copies of leads marked for publication.' },
    publicCampaigns: { description: 'Public-facing copies of active and upcoming campaigns.' },
    publicData: { description: 'Stores other public data like the main organization profile.' },
    inspirationalQuotes: { description: 'A collection of quotes used throughout the application.' },
};

export async function getDatabaseHealthStats(): Promise<CollectionStat[]> {
    const adminDb = getAdminDb();
    const stats: CollectionStat[] = [];
    
    try {
        const collections = await adminDb.listCollections();

        for (const collectionRef of collections) {
            const colId = collectionRef.id;
            const metadata = collectionsMetadata[colId] || { description: 'No description available.' };

            try {
                // Fetch count and last modified doc in parallel
                const [countSnapshot, lastModifiedSnapshot] = await Promise.all([
                    collectionRef.count().get(),
                    metadata.timestampField 
                        ? collectionRef.orderBy(metadata.timestampField, 'desc').limit(1).get() 
                        : Promise.resolve(null)
                ]);
                
                const count = countSnapshot.data().count;
                let lastModified: Date | undefined;
                if (lastModifiedSnapshot && !lastModifiedSnapshot.empty) {
                    const lastDoc = lastModifiedSnapshot.docs[0].data();
                    const timestamp = lastDoc[metadata.timestampField!];
                    if (timestamp && typeof timestamp.toDate === 'function') {
                        lastModified = timestamp.toDate();
                    }
                }

                const stat: CollectionStat = {
                    name: colId,
                    description: metadata.description,
                    count,
                    lastModified,
                };
                
                // Perform orphan check if configured in metadata
                if (metadata.orphanField && metadata.orphanCollection && count > 0) {
                    const orphanCheckResult = await checkForOrphans(adminDb, colId, metadata.orphanField, metadata.orphanCollection);
                    stat.orphanCheck = {
                        checked: true,
                        orphanCount: orphanCheckResult.orphanCount,
                        details: `${orphanCheckResult.orphanCount} record(s) in '${colId}' have a '${metadata.orphanField}' that does not exist in '${metadata.orphanCollection}'.`
                    };
                }

                stats.push(stat);

            } catch (error) {
                console.error(`Failed to analyze collection '${colId}':`, error);
                stats.push({
                    name: colId,
                    description: metadata.description,
                    count: 0,
                    orphanCheck: { checked: false, orphanCount: 0, details: `Error analyzing collection: ${error instanceof Error ? error.message : 'Unknown error'}` }
                });
            }
        }
        
        // Sort alphabetically by collection name for consistent ordering
        stats.sort((a, b) => a.name.localeCompare(b.name));

    } catch (e) {
        console.error("Failed to list Firestore collections:", e);
        throw new Error("Could not retrieve the list of database collections. Please check server logs and permissions.");
    }
    
    return stats;
}

async function checkForOrphans(db: FirebaseFirestore.Firestore, collectionName: string, foreignKey: string, parentCollection: string): Promise<{ orphanCount: number }> {
    // This is a simplified check. A full check on large datasets would require more complex batching.
    const snapshot = await db.collection(collectionName).limit(500).get(); // Limit to 500 for performance
    if (snapshot.empty) {
        return { orphanCount: 0 };
    }

    const parentIds = new Set<string>();
    const parentSnapshot = await db.collection(parentCollection).select().get();
    parentSnapshot.forEach(doc => parentIds.add(doc.id));
    
    let orphanCount = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        const parentId = data[foreignKey];
        if (parentId && !parentIds.has(parentId)) {
            orphanCount++;
        }
    });

    return { orphanCount };
}

/**
 * Gets basic details about the current Firebase project.
 * @returns An object with the project ID.
 */
export async function getDatabaseDetails(): Promise<{ projectId: string } | null> {
    try {
        const adminDb = getAdminDb();
        return {
            projectId: adminDb.project.id,
        };
    } catch (error) {
        console.error("Error getting database details:", error);
        return null;
    }
}
