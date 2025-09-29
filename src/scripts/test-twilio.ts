import { testTwilioConnection } from '../services/twilio';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  console.log('Attempting to connect to Twilio...');
  try {
    await testTwilioConnection();
    console.log('\n✅ SUCCESS: Connection to Twilio established successfully!');
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to connect to Twilio.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
  } finally {
    process.exit();
  }
}

runTest();
