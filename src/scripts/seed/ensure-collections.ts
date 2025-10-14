

import { ensureCollectionsExist } from '@/services/seed-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Ensuring all essential Firestore collections exist...');
  try {
    const result = await ensureCollectionsExist();
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
