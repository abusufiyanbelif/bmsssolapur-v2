

import { getAdminDb } from '../services/firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
  console.log('Attempting to connect to Firestore using Application Default Credentials...');
  try {
    const adminDb = await getAdminDb();
    
    // Perform a simple read operation to confirm permissions.
    // This targets a potentially non-existent doc, which is a lightweight check.
    const nonExistentDocRef = adminDb.collection("permission-check-script").doc("heartbeat");
    await nonExistentDocRef.get();
    
    console.log('\n✅ SUCCESS: Connection to Firestore established successfully!');
    console.log('The environment has the necessary permissions to read from the database.');
  
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to connect to Firestore.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
    
    if (e.message && (e.message.includes('permission-denied') || e.message.includes('UNAUTHENTICATED') || e.message.includes('Could not load the default credentials'))) {
      console.log('\n[DIAGNOSIS] This is a permissions issue.');
      console.log('\nPossible causes:');
      console.log('1. You are running this locally and have not authenticated. Run `gcloud auth application-default login` in your terminal.');
      console.log('2. The service account used by your App Hosting backend is missing the "Cloud Datastore User" IAM role. Run `npm run verify:iam` to check.');
      console.log('3. The Firebase project ID might be misconfigured in your .env file.');
    } else {
        console.log('\n[DIAGNOSIS] This seems to be an unexpected error. Please check the server logs for more details.');
    }

  } finally {
      // Allow time for all logs to flush before exiting
      setTimeout(() => process.exit(), 100);
  }
}

testDatabaseConnection();
