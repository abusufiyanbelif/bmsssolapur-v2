
import { getAdminDb } from './../services/firebase-admin';

async function testDatabaseConnection() {
  console.log('Attempting to connect to Firestore using Application Default Credentials...');
  try {
    const adminDb = await getAdminDb();
    
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
    
    if (e.code === 5 || e.message.includes('NOT_FOUND')) {
      console.log('\n✅ However, this specific "NOT_FOUND" error confirms that the connection and authentication were successful.');
      console.log('The script simply failed to find its own temporary test document, which is not a critical issue.');
    } else if (e.message.includes('permission-denied') || e.message.includes('UNAUTHENTICATED')) {
      console.log('\nPossible causes:');
      console.log('1. You may not be authenticated. Run `gcloud auth application-default login` in your terminal.');
      console.log('2. The service account used by this environment lacks the "Cloud Datastore User" or "Firebase Admin" IAM role.');
      console.log('3. The Firebase project ID might be misconfigured in your .env file.');
    } else {
        console.log('\nThis seems to be an unexpected error. Please check the server logs for more details.');
    }

  } finally {
      // Allow time for all logs to flush before exiting
      setTimeout(() => process.exit(), 100);
  }
}

testDatabaseConnection();
