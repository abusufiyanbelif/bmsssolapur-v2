import { getAdminDb } from '@/services/firebase-admin';
import dotenv from 'dotenv';
import { ensureCollectionsExist as ensureCollections } from '@/services/firebase-admin';
import { performance } from 'perf_hooks';

dotenv.config();

async function run() {
  const startTime = performance.now();
  console.log('Ensuring all essential Firestore collections exist...');
  try {
    const result = await ensureCollections();
    
    if(result.success) {
      console.log(`\n✅ SUCCESS: ${result.message}`);
      if (result.details && result.details.length > 0) {
          result.details.forEach(detail => console.log(`- ${detail}`));
      }
    } else {
        console.error('\n❌ ERROR: One or more collections could not be created.');
        if(result.errors) {
            result.errors.forEach(err => console.error(`- ${err}`));
        }
    }
  } catch (e: any) {
    console.error('\n❌ FATAL ERROR: Failed to run collection check.');
    console.error(e.message);
  } finally {
    const endTime = performance.now();
    console.log(`\n✨ Done in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
    process.exit();
  }
}

run();
