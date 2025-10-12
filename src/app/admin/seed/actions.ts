
"use server";

import { 
    seedInitialUsersAndQuotes, 
    seedCoreTeam, 
    seedOrganizationProfile, 
    seedPaymentGateways,
    seedSampleData,
    eraseInitialUsersAndQuotes,
    eraseCoreTeam,
    eraseOrganizationProfile,
    erasePaymentGateways,
    eraseSampleData,
    seedAppSettings,
    eraseAppSettings,
    syncUsersToFirebaseAuth,
    eraseFirebaseAuthUsers,
    type SeedResult,
    ensureCollectionsExist as ensureCollectionsExistService
} from "@/services/seed-service";

type SeedTask = 'initial' | 'coreTeam' | 'organization' | 'paymentGateways' | 'sampleData' | 'appSettings' | 'syncFirebaseAuth' | 'ensureCollections';

export async function handleSeedAction(task: SeedTask): Promise<{success: boolean; data?: SeedResult; error?: string}> {
    try {
        let result: SeedResult;
        switch(task) {
            case 'initial':
                result = await seedInitialUsersAndQuotes();
                break;
            case 'coreTeam':
                result = await seedCoreTeam();
                break;
            case 'organization':
                result = await seedOrganizationProfile();
                break;
            case 'paymentGateways':
                result = await seedPaymentGateways();
                break;
            case 'sampleData':
                result = await seedSampleData();
                break;
            case 'appSettings':
                result = await seedAppSettings();
                break;
            case 'syncFirebaseAuth':
                result = await syncUsersToFirebaseAuth();
                break;
            case 'ensureCollections':
                const collectionResult = await ensureCollectionsExistService();
                 result = {
                    message: collectionResult.created.length > 0
                        ? `Successfully created ${collectionResult.created.length} missing collection(s).`
                        : "All essential collections already exist.",
                    details: collectionResult.created.length > 0
                        ? [`Created: ${collectionResult.created.join(', ')}`]
                        : []
                };
                if (!collectionResult.success) {
                    throw new Error(collectionResult.errors.join(', '));
                }
                break;
            default:
                throw new Error("Invalid seed task provided.");
        }
        return { success: true, data: result };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during seeding.";
        console.error(`Seeding task '${task}' failed:`, error);
        return { success: false, error };
    }
}


export async function handleEraseAction(task: SeedTask): Promise<{success: boolean; data?: SeedResult; error?: string}> {
    try {
        let result: SeedResult;
        switch(task) {
            case 'initial':
                result = await eraseInitialUsersAndQuotes();
                break;
            case 'coreTeam':
                result = await eraseCoreTeam();
                break;
            case 'organization':
                result = await eraseOrganizationProfile();
                break;
            case 'paymentGateways':
                result = await erasePaymentGateways();
                break;
            case 'sampleData':
                result = await eraseSampleData();
                break;
            case 'appSettings':
                result = await eraseAppSettings();
                break;
            case 'syncFirebaseAuth':
                result = await eraseFirebaseAuthUsers();
                break;
            default:
                throw new Error("Invalid erase task provided.");
        }
        return { success: true, data: result };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during erasing.";
        console.error(`Erasing task '${task}' failed:`, error);
        return { success: false, error };
    }
}
