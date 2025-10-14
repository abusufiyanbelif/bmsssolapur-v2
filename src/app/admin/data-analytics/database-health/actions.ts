
'use server';

import { getAdminDb } from '@/services/firebase-admin';
import type { Lead, Donation, User, CollectionStat, CollectionsMetadata } from '@/services/types';
import { collectionsMetadata } from '@/services/types';
import { Timestamp } from 'firebase-admin/firestore';


// Function to check for duplicate organizations
const checkDuplicates = async (name: string, registrationNumber: string): Promise<boolean> => {
    const adminDb = await getAdminDb();
    const nameQuery = adminDb.collection('organizations').where("name", "==", name).limit(1);
    const regQuery = adminDb.collection('organizations').where("registrationNumber", "==", registrationNumber).limit(1);

    const [nameSnapshot, regSnapshot] = await Promise.all([
        nameQuery.get(),
        regQuery.get()
    ]);

    return !nameSnapshot.empty || !regSnapshot.empty;
}


export async function getDatabaseHealthStats(): Promise<CollectionStat[]> {
    const adminDb = await getAdminDb();
    const stats: CollectionStat[] = [];
    
    try {
        const collections = await adminDb.listCollections();

        for (const collectionRef of collections) {
            const colId = collectionRef.id;
            const metadata = collectionsMetadata[colId] || { description: 'No description available.', type: 'Application Data' };

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
                    type: metadata.type,
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
                    type: metadata.type,
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
        // Ensure initialization before getting details
        const adminDb = await getAdminDb();
        return {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not Found',
        };
    } catch (error) {
        console.error("Error getting database details:", error);
        return null;
    }
}

/**
 * Manually triggers the function to ensure all core Firestore collections exist.
 * @returns An object with a list of created collections and any errors.
 */
export async function handleEnsureCollectionsExist(): Promise<{ success: boolean; created: string[]; errors: string[] }> {
    const { ensureCollectionsExist } = await import('@/services/firebase-admin');
    const result = await ensureCollectionsExist();
    return {
        success: result.success,
        created: result.created,
        errors: result.errors,
    }
}
