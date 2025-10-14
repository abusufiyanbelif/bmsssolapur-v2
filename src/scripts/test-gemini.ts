
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
      if (result.error?.includes('API key not valid')) {
        console.log('\n[DIAGNOSIS] Your GEMINI_API_KEY is invalid.');
        console.log('Please obtain a valid key from Google AI Studio and add it as a secret to your project.');
      } else if(result.error?.includes('permission_denied')) {
        console.log('\n[DIAGNOSIS] The API key is likely valid, but the Google AI API may not be enabled for your project.');
        console.log('Please visit the Google Cloud Console for your project and enable the "Generative Language API".');
      }
    }
  } catch (e: any) {
    console.error('\n❌ UNEXPECTED ERROR:', e.message);
  } finally {
    process.exit();
  }
}

runTest();
