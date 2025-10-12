
import { syncUsersToFirebaseAuth } from '@/services/seed-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Syncing Firestore users to Firebase Authentication...');
  try {
    const result = await syncUsersToFirebaseAuth();
    console.log(`\n✅ SUCCESS: ${result.message}`);
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to sync users to Firebase Auth.');
    console.error(e.message);
  } finally {
    process.exit();
  }
}

run();
