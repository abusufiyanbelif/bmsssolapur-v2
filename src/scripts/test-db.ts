import { getAdminDb, ensureFirebaseAdminInitialized } from '../services/firebase-admin';

async function testDatabaseConnection() {
  console.log('Attempting to connect to Firestore using Application Default Credentials...');
  try {
    // Await the initialization to ensure everything is ready
    await ensureFirebaseAdminInitialized();
    
    // Now that initialization is complete, we can safely get the DB instance.
    const adminDb = getAdminDb();
    
    // Perform a simple read operation to confirm permissions.
    const nonExistentDocRef = adminDb.collection("permission-check-script").doc("heartbeat");
    await nonExistentDocRef.get();
    
    console.log('\n✅ SUCCESS: Connection to Firestore established successfully!');
    console.log('The environment has the necessary permissions to read from the database.');
  
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to connect to Firestore.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
    console.log('\nPossible causes:');
    console.log('1. You may not be authenticated. Run `gcloud auth application-default login` in your terminal.');
    console.log('2. The service account used by this environment lacks the "Cloud Datastore User" or "Firebase Admin" IAM role.');
    console.log('3. The Firebase project ID might be misconfigured in your .env file.');
  } finally {
      // Allow time for all logs to flush before exiting
      setTimeout(() => process.exit(), 100);
  }
}

testDatabaseConnection();
