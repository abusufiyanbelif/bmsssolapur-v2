

import { testTwilioConnection } from '../app/services/actions';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  console.log('Attempting to connect to Twilio...');
  try {
    const result = await testTwilioConnection();
    if (result.success) {
      console.log('\n✅ SUCCESS: Connection to Twilio established successfully!');
    } else {
      console.error('\n❌ ERROR: Failed to connect to Twilio.');
      console.error('------------------------------------------');
      console.error('Error Details:', result.error);
      console.error('------------------------------------------');
      console.log('\n[DIAGNOSIS] This is likely a configuration issue.');
      console.log('\nPossible causes:');
      console.log('1. Your TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_VERIFY_SID environment variables in `.env` are incorrect.');
      console.log('2. Your Twilio account may be suspended or lack funds.');
      console.log('3. The Verify Service SID might not exist or may be from a different project.');
    }
  } catch (e: any) {
    console.error('\n❌ UNEXPECTED ERROR:', e.message);
  } finally {
    process.exit();
  }
}

runTest();
