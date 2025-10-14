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
      console.log('\n[DIAGNOSIS] This is a permissions issue. The application server cannot authenticate with Google Cloud.');
      console.log('\nTo fix this:');
      console.log('1. If running locally: Run `gcloud auth application-default login` in your terminal and restart the server.');
      console.log('2. If this is a deployed App Hosting backend: The service account is missing the "Cloud Datastore User" IAM role. Run `npm run fix:iam` to grant it automatically.');
    } else {
        console.log('\n[DIAGNOSIS] An unexpected error occurred. Please check the error details above and your network connection.');
    }

  } finally {
      // Allow time for all logs to flush before exiting
      setTimeout(() => process.exit(), 100);
  }
}

testDatabaseConnection();