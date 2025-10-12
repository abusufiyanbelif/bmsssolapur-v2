
import { ensureCollectionsExist } from '@/services/firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Ensuring all essential Firestore collections exist...');
  try {
    const result = await ensureCollectionsExist();
    if(result.errors.length > 0) {
        console.error('\n❌ ERROR: One or more collections could not be created.');
        console.error(result.errors.join('\n'));
        process.exit(1);
    }
    console.log(`\n✅ SUCCESS: ${result.message || 'All collections are present.'}`);
    if (result.details && result.details.length > 0) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ FATAL ERROR: Failed to run collection check.');
    console.error(e.message);
  } finally {
    process.exit();
  }
}

run();
