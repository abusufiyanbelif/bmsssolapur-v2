
import { syncUsersToFirebaseAuth } from '@/services/seed-service';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

async function run() {
  const startTime = performance.now();
  console.log('Syncing Firestore users to Firebase Authentication...');
  try {
    const result = await syncUsersToFirebaseAuth();
    console.log(`\n✅ SUCCESS: ${result.message}`);
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to sync users to Firebase Auth.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
    console.log('\nThis usually indicates a problem connecting to the database or a permissions issue, especially needing the `Firebase Admin` IAM role. Please run `npm run verify:iam` to diagnose.');
  } finally {
    const endTime = performance.now();
    console.log(`\n✨ Done in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
    process.exit();
  }
}

run();
