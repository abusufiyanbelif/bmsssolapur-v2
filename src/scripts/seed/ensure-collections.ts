import { getAdminDb } from '@/services/firebase-admin';
import dotenv from 'dotenv';
import { ensureCollectionsExist as ensureCollections } from '@/services/firebase-admin';

dotenv.config();

async function run() {
  console.log('Ensuring all essential Firestore collections exist...');
  try {
    // This now correctly awaits the promise from ensureCollections
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
        process.exit(1);
    }
  } catch (e: any) {
    console.error('\n❌ FATAL ERROR: Failed to run collection check.');
    console.error(e.message);
  } finally {
    process.exit();
  }
}

run();
