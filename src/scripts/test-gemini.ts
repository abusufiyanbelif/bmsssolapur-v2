import { testGeminiConnection } from '../app/services/actions';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  console.log('Attempting to connect to Google AI (Gemini)...');
  try {
    const result = await testGeminiConnection();
    if (result.success) {
      console.log('\n✅ SUCCESS: Connection to Gemini established successfully!');
    } else {
      console.error('\n❌ ERROR: Failed to connect to Gemini.');
      console.error('------------------------------------------');
      console.error('Error Details:', result.error);
      console.error('------------------------------------------');
    }
  } catch (e: any) {
    console.error('\n❌ UNEXPECTED ERROR:', e.message);
  } finally {
    process.exit();
  }
}

runTest();
