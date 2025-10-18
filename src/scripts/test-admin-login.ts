
import { handleLogin } from '@/app/login/actions';
import dotenv from 'dotenv';
import { getUser } from '@/services/user-service';
import { checkDatabaseConnection } from '@/app/services/actions';

dotenv.config();

// Mock FormData for server action
class MockFormData {
  private data: Map<string, string> = new Map();
  append(name: string, value: string) {
    this.data.set(name, value);
  }
  get(name: string) {
    return this.data.get(name) || null;
  }
}

async function testAdminLogin() {
  console.log('🧪 Running Test: Default Admin Login');
  console.log('------------------------------------------');
  console.log('This test verifies that the default "admin" user exists and is accessible.');
  
  try {
    // Step 1: Verify basic database connectivity first.
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
    console.log('  - ✅ OK: Database connection successful.');
    

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
    console.log(`  - ✅ OK: Found "admin" user in Firestore. (Name: ${adminUser.name}, Active: ${adminUser.isActive})`);

    // Step 3: Simulate login with default credentials.
    console.log('\n- Step 3: Simulating login with default credentials ("admin" / "password")...');
    const formData = new MockFormData();
    formData.append('identifier', 'admin');
    formData.append('password', 'password');

    const result = await handleLogin(formData);
    
    if (result.success && result.userId === 'admin') {
      console.log('\n✅ SUCCESS: Default admin user login test passed.');
      console.log('This confirms the "admin" user exists and the login action is working correctly.');
    } else {
      console.error('\n❌ ERROR: Failed to log in as admin user.');
      console.error('------------------------------------------');
      console.error('Error Details:', result.error || 'The login action did not return a success status or the correct user ID.');
      console.error('------------------------------------------');

      if(result.error?.includes("Incorrect password")) {
        console.log('\n[DIAGNOSIS] The login attempt was rejected due to an incorrect password.');
        console.log('This means the password for the "admin" user has been changed from the default ("password"). If this was intentional, the test is behaving correctly. If not, you may need to reset the data.');
      } else {
        console.log('\n[DIAGNOSIS] An unexpected error occurred in the login logic. Please review the error details.');
      }
    }
  } catch (e: any) {
    console.error('\n❌ UNEXPECTED SCRIPT ERROR during admin login test.');
    console.error(e.message);
  } finally {
    // Allow time for all logs to flush before exiting
    setTimeout(() => process.exit(), 100);
  }
}

testAdminLogin();
