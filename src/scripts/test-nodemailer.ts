import { testNodemailerConnection } from '../services/email';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  console.log('Attempting to connect to SMTP server via Nodemailer...');
  try {
    await testNodemailerConnection();
    console.log('\n✅ SUCCESS: Connection to SMTP server verified!');
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to connect to SMTP server.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
  } finally {
    process.exit();
  }
}

runTest();
