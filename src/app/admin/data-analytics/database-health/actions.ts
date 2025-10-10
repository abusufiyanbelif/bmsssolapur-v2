
'use server';

import { getAdminDb } from '@/services/firebase-admin';
import type { Lead, Donation } from '@/services/types';

export interface CollectionStat {
    name: string;
    description: string;
    count: number;
    orphanCheck?: {
        checked: boolean;
        orphanCount: number;
        details?: string;
    }
}

const collectionsToAnalyze: { name: string; description: string; orphanField?: string, orphanCollection?: string }[] = [
    { name: 'users', description: 'Stores all user profiles, including donors, beneficiaries, and admins.' },
    { name: 'leads', description: 'Contains all help requests (cases) for beneficiaries.', orphanField: 'beneficiaryId', orphanCollection: 'users' },
    { name: 'donations', description: 'Holds all donation records, both online and manually entered.', orphanField: 'donorId', orphanCollection: 'users' },
    { name: 'campaigns', description: 'Stores fundraising campaign details.' },
    { name: 'activityLog', description: 'A log of all significant user and system actions.', orphanField: 'userId', orphanCollection: 'users' },
    { name: 'organizations', description: 'Stores the main organization profile details.' },
    { name: 'settings', description: 'Contains global application configurations.' },
    { name: 'publicLeads', description: 'Sanitized, public-facing copies of leads marked for publication.' },
    { name: 'publicCampaigns', description: 'Public-facing copies of active and upcoming campaigns.' },
    { name: 'publicData', description: 'Stores other public data like the main organization profile.' },
    { name: 'inspirationalQuotes', description: 'A collection of quotes used throughout the application.' },
];

export async function getDatabaseHealthStats(): Promise<CollectionStat[]> {
    const adminDb = getAdminDb();
    const stats: CollectionStat[] = [];

    for (const col of collectionsToAnalyze) {
        try {
            const collectionRef = adminDb.collection(col.name);
            const snapshot = await collectionRef.count().get();
            const count = snapshot.data().count;

            const stat: CollectionStat = {
                name: col.name,
                description: col.description,
                count,
            };
            
            // Perform orphan check if configured
            if (col.orphanField && col.orphanCollection && count > 0) {
                const orphanCheckResult = await checkForOrphans(adminDb, col.name, col.orphanField, col.orphanCollection);
                stat.orphanCheck = {
                    checked: true,
                    orphanCount: orphanCheckResult.orphanCount,
                    details: `${orphanCheckResult.orphanCount} record(s) in '${col.name}' have a '${col.orphanField}' that does not exist in '${col.orphanCollection}'.`
                }
            }

            stats.push(stat);

        } catch (error) {
            console.error(`Failed to analyze collection '${col.name}':`, error);
            stats.push({
                name: col.name,
                description: col.description,
                count: 0,
                orphanCheck: { checked: false, orphanCount: 0, details: `Error analyzing collection: ${error instanceof Error ? error.message : 'Unknown error'}` }
            });
        }
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
