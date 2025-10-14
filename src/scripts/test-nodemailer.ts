

import { testNodemailerConnection } from '../app/services/actions';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  console.log('Attempting to connect to SMTP server via Nodemailer...');
  try {
    const result = await testNodemailerConnection();
     if (result.success) {
      console.log('\n✅ SUCCESS: Connection to SMTP server verified!');
    } else {
      console.error('\n❌ ERROR: Failed to connect to SMTP server.');
      console.error('------------------------------------------');
      console.error('Error Details:', result.error);
      console.error('------------------------------------------');
      console.log('\n[DIAGNOSIS] This is likely a configuration issue.');
      console.log('\nPossible causes:');
      console.log('1. SMTP_* environment variables in `.env` are incorrect (host, port, user, or password).');
      console.log('2. If using Gmail, you may need an "App Password" instead of your regular password if 2FA is enabled.');
      console.log('3. Your network or firewall might be blocking the connection to the SMTP port.');
    }
  } catch (e: any) {
    console.error('\n❌ UNEXPECTED ERROR:', e.message);
  } finally {
    process.exit();
  }
}

runTest();
