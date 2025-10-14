
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
  console.log('Attempting to log in as the default "admin" user...');
  try {
    // First, verify the admin user exists in the database.
    const adminUser = await getUser('admin');
    if (!adminUser) {
        throw new Error('The default "admin" user does not exist in the Firestore database. Please ensure the application has started correctly at least once to trigger its creation, or check for database connectivity issues.');
    }

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
    console.error('\n❌ UNEXPECTED SCRIPT ERROR:', e.message);
  } finally {
    setTimeout(() => process.exit(), 100);
  }
}

testAdminLogin();
