import { getAdminDb } from '../services/firebase-admin';

async function testDatabaseConnection() {
  console.log('Attempting to connect to Firestore...');
  try {
    const adminDb = getAdminDb();
    // This is a very lightweight operation that confirms the connection and permissions.
    const nonExistentDocRef = adminDb.collection("permission-check").doc("heartbeat");
    await nonExistentDocRef.get();
    
    console.log('\n✅ SUCCESS: Connection to Firestore established successfully!');
    console.log('The service account has the necessary permissions to read from the database.');
  
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to connect to Firestore.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
    console.log('\nPossible causes:');
    console.log('1. The backend server might not have internet access.');
    console.log('2. The service account used by this environment lacks the "Cloud Datastore User" or "Firebase Admin" IAM role.');
    console.log('3. The Firebase project ID might be misconfigured.');
  } finally {
      // Force exit the process, otherwise it may hang
      process.exit();
  }
}

testDatabaseConnection();
