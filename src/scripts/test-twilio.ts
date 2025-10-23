
import { testTwilioConnection } from '../app/services/actions';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

async function runTest() {
  const startTime = performance.now();
  console.log('🧪 Running Test: Twilio SMS Service');
  console.log('------------------------------------------');
  console.log('Attempting to connect to Twilio using the TWILIO_* credentials from your environment...');
  try {
    const result = await testTwilioConnection();
    if (result.success) {
      console.log('\n✅ SUCCESS: Connection to Twilio established successfully!');
      console.log('This confirms your Account SID, Auth Token, and Verify Service SID are correct.');
    } else {
      console.error('\n❌ ERROR: Failed to connect to Twilio.');
      console.error('------------------------------------------');
      console.error('Error Details:', result.error);
      console.error('------------------------------------------');
      console.log('\n[DIAGNOSIS] This is likely a configuration issue. Please check the following:');
      console.log('1. Your TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_VERIFY_SID environment variables in `.env` are incorrect.');
      console.log('2. Your Twilio account may be suspended or lack funds.');
      console.log('3. The Verify Service SID might not exist or may be from a different project.');
      console.log('4. Ensure "OTP (SMS) Login" is enabled and Twilio is selected as the provider in your app\'s Notification Settings.');
    }
  } catch (e: any) {
    console.error('\n❌ UNEXPECTED SCRIPT ERROR:', e.message);
  } finally {
    const endTime = performance.now();
    console.log(`\n✨ Done in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
  }
}

runTest().finally(() => process.exit());
