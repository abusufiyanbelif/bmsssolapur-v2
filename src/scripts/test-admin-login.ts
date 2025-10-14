

import { handleLogin } from '@/app/login/actions';
import dotenv from 'dotenv';
import { getUser } from '@/services/user-service';

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
  console.log('This test verifies that the default "admin" user exists in Firestore and that the login logic for this special case is functional.');
  
  try {
    // First, verify the admin user exists in the database.
    console.log('\n- Step 1: Checking for "admin" user in Firestore...');
    const adminUser = await getUser('admin');
    if (!adminUser) {
        throw new Error('The default "admin" user does not exist in the Firestore database. This user should be created automatically on the first run. Please check database connectivity (`npm run test:db`) and server logs.');
    }
    console.log('  - OK: Found "admin" user in Firestore.');

    console.log('\n- Step 2: Simulating login with default credentials ("admin" / "admin")...');
    const formData = new MockFormData();
    formData.append('identifier', 'admin');
    formData.append('password', 'admin'); // Default password

    const result = await handleLogin(formData);
    
    if (result.success && result.userId === 'admin') {
      console.log('\n✅ SUCCESS: Default admin user login test passed.');
      console.log('This confirms the "admin" user exists and the login action is working correctly.');
    } else {
      console.error('\n❌ ERROR: Failed to log in as admin user.');
      console.error('------------------------------------------');
      console.error('Error Details:', result.error || 'The login action did not return a success status or the correct user ID.');
      console.error('------------------------------------------');
      console.log('\n[DIAGNOSIS] This indicates a problem with the admin user account or the login logic itself.');
      console.log('\nPossible causes:');
      console.log('1. The password for the "admin" user has been changed from the default ("admin").');
      console.log('2. There is a bug in the `handleLogin` server action in `src/app/login/actions.ts`.');
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

    