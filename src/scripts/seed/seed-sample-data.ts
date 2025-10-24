import { seedSampleData as doSeed } from '@/services/seed-service';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';
import { getAdminDb, ensureCollectionExists } from '@/services/firebase-admin';
import { CORE_COLLECTIONS } from '@/services/constants';

dotenv.config();

async function run() {
  const startTime = performance.now();
  console.log('Seeding Sample Data (Campaigns, Leads, Donations)...');
  try {
    // Ensure all collections exist before trying to seed data into them.
    console.log('\n- Step 1: Ensuring all collections exist...');
    const adminDb = await getAdminDb(); // Get the initialized instance once.
    for (const collectionName of CORE_COLLECTIONS) {
        await ensureCollectionExists(adminDb, collectionName);
    }
    console.log('- ✅ Step 1 Complete.\n');

    console.log('- Step 2: Seeding sample data...');
    const result = await doSeed();
    console.log(`\n✅ SUCCESS: ${result.message}`);
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed sample data.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
    console.log('\nThis usually indicates a problem connecting to the database or a permissions issue. Please run `npm run test:db` to diagnose.');
  } finally {
    const endTime = performance.now();
    console.log(`\n✨ Done in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
    process.exit();
  }
}

run();
