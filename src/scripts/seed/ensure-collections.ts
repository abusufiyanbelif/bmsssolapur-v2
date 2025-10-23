import { getAdminDb } from '@/services/firebase-admin';
import dotenv from 'dotenv';
import { ensureCollectionExists } from '@/services/firebase-admin';
import { CORE_COLLECTIONS } from '@/services/constants';
import { performance } from 'perf_hooks';

dotenv.config();

async function run() {
  const startTime = performance.now();
  console.log('Ensuring all essential Firestore collections exist...');
  try {
    const created: string[] = [];
    const errors: string[] = [];
    
    for (const collectionName of CORE_COLLECTIONS) {
        const result = await ensureCollectionExists(collectionName);
        if(result.created) created.push(collectionName);
    }
    
    if (errors.length > 0) {
        console.error('\n❌ ERROR: Some collections could not be verified.');
        errors.forEach(err => console.error(`- ${err}`));
    } else if (created.length > 0) {
        console.log('\n✅ SUCCESS: Successfully created missing collections.');
        created.forEach(name => console.log(`- Created '${name}' collection.`));
    } else {
        console.log('\n✅ SUCCESS: All essential collections already exist.');
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
