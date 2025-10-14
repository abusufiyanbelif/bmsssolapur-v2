

import { seedInitialUsersAndQuotes, seedOrganizationProfile } from '@/services/seed-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Seeding Initial Data (Organization Profile & Quotes)...');
  try {
    // Now this script seeds both org and quotes, as it should have.
    const orgResult = await seedOrganizationProfile();
    const quotesResult = await seedInitialUsersAndQuotes();
    
    console.log(`\n✅ SUCCESS: Initial data has been seeded.`);
    if (orgResult.details) {
        orgResult.details.forEach(detail => console.log(`- ${detail}`));
    }
    if (quotesResult.details) {
        quotesResult.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed initial data.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
    console.log('\nThis usually indicates a problem connecting to the database or a permissions issue. Please run `npm run test:db` to diagnose.');
  } finally {
    process.exit();
  }
}

run();

    