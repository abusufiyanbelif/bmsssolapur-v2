
import { handleLogin } from '@/app/login/actions';
import dotenv from 'dotenv';
import { getUser } from '@/services/user-service';
import { getAdminDb } from '@/services/firebase-admin';
import { performance } from 'perf_hooks';

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
  const startTime = performance.now();
  console.log('🧪 Running Test: Default Admin Login');
  console.log('------------------------------------------');
  console.log('This test verifies that the default "admin" user exists and is accessible.');
  
  try {
    // Step 1: Verify basic database connectivity first.
    console.log('\n- Step 1: Checking for basic database connectivity...');
    const adminDb = await getAdminDb();
    await adminDb.listCollections();
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
    const endTime = performance.now();
    console.log(`\n✨ Done in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
    process.exit(0);
  }
}

testAdminLogin();
