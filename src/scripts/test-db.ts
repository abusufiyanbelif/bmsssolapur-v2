
/**
 * @fileOverview A script to test the database connection and core data integrity.
 */

import { getAdminDb } from '../services/firebase-admin';
import { getUser } from '../services/user-service';
import { checkDatabaseConnection } from '../app/services/actions';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

async function testDatabase() {
  const startTime = performance.now();
  console.log('🧪 Running Test: Firestore Database & Core Data');
  console.log('------------------------------------------');
  console.log('This test verifies database connectivity and the presence of critical system users.');
  
  try {
    // Step 1: Verify basic database connectivity.
    console.log('\n- Step 1: Checking for basic database connectivity...');
    const dbConnection = await checkDatabaseConnection();

    if (!dbConnection.success) {
      console.error('\n❌ ERROR: Could not connect to the database.');
      console.error('------------------------------------------');
      console.error('Error Details:', dbConnection.error);
      console.error('------------------------------------------');
      if (dbConnection.error === 'permission-denied') {
        console.log('\n[DIAGNOSIS] The application server cannot authenticate with Google Cloud.');
        console.log('This is the most likely reason the "admin" user was not created automatically.');
        console.log('\n[SOLUTION] Run `npm run fix:iam` to grant the necessary permissions and then restart your application server.');
      } else {
        console.log('\n[DIAGNOSIS] An unexpected network or configuration error occurred. Please review the error details above.');
      }
      return; // Stop the test if we can't even connect.
    }
    console.log('  - ✅ OK: Database connection and permissions are valid.');
    

    // Step 2: Verify the admin user exists in the database.
    console.log('\n- Step 2: Checking for "admin" user in Firestore...');
    const adminUser = await getUser('admin');
    
    if (!adminUser) {
        console.error('\n❌ ERROR: The default "admin" user does not exist in the Firestore database.');
        console.error('------------------------------------------');
        console.log('\n[DIAGNOSIS] The "admin" user should be created automatically when the server starts.');
        console.log('Since the database connection is working, this implies the server might not have had the correct permissions on its very first startup, so the automatic creation failed.');
        console.log('\n[SOLUTION] Run `npm run fix:iam` to ensure all permissions are correct, then restart your application server. The user should be created on the next startup.');
        return;
    }
    console.log(`  - ✅ OK: Found "admin" user in Firestore.`);

    console.log('\n✅ SUCCESS: Database test passed!');
    console.log('This confirms the server can connect to the database and essential system data is present.');

  } catch (e: any) {
    console.error('\n❌ UNEXPECTED SCRIPT ERROR during database test.');
    console.error(e.message);
  } finally {
    const endTime = performance.now();
    console.log(`\n✨ Done in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
    setTimeout(() => process.exit(), 100);
  }
}

testDatabase();
