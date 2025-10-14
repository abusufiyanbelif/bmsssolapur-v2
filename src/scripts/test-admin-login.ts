
import { handleLogin } from '@/app/login/actions';
import dotenv from 'dotenv';

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
    const formData = new MockFormData();
    formData.append('identifier', 'admin');
    formData.append('password', 'admin'); // Default password

    const result = await handleLogin(formData);
    
    if (result.success && result.userId === 'admin') {
      console.log('\n✅ SUCCESS: Admin user login successful!');
    } else {
      console.error('\n❌ ERROR: Failed to log in as admin user.');
      console.error('------------------------------------------');
      console.error('Error Details:', result.error || 'The login action did not return a success status or the correct user ID.');
      console.error('------------------------------------------');
      console.log('\n[DIAGNOSIS] This indicates a problem with the admin user account or the login logic itself.');
      console.log('\nPossible causes:');
      console.log('1. The default "admin" user has not been created in the Firestore database.');
      console.log('2. The password for the "admin" user has been changed from the default.');
      console.log('3. There is a bug in the `handleLogin` server action or `user-service`.');
    }
  } catch (e: any) {
    console.error('\n❌ UNEXPECTED ERROR:', e.message);
  } finally {
    process.exit();
  }
}

testAdminLogin();
