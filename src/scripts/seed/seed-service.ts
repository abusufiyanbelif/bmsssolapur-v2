/**
 * @fileOverview A service to seed the database with initial data.
 */

// This file has been deprecated and its contents moved to `src/services/seed-service.ts`.
// It is kept for backward compatibility with older scripts but should not be used for new development.

export { 
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
} from '@/services/seed-service';

export { handleEnsureSingleCollection as ensureCollectionsExist } from '@/services/firebase-admin';
