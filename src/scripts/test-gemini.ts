
import { testGeminiConnection } from '../app/services/actions';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

async function runTest() {
  const startTime = performance.now();
  console.log('🧪 Running Test: Google Gemini AI API');
  console.log('------------------------------------------');
  console.log('Attempting to connect to Google AI (Gemini) using the GEMINI_API_KEY from your environment...');
  try {
    const result = await testGeminiConnection();
    if (result.success) {
      console.log('\n✅ SUCCESS: Connection to Gemini established successfully!');
      console.log('This confirms your API key is valid and the Generative Language API is enabled.');
    } else {
      console.error('\n❌ ERROR: Failed to connect to Gemini.');
      console.error('------------------------------------------');
      console.error('Error Details:', result.error);
      console.error('------------------------------------------');
      
      if (result.error?.includes('API key not valid')) {
        console.log('\n[DIAGNOSIS] Your GEMINI_API_KEY is invalid or missing.');
        console.log('\nTo fix this:');
        console.log('1. Go to Google AI Studio to generate a new API key: https://aistudio.google.com/app/apikey');
        console.log('2. In your Firebase project, go to App Hosting -> Your Backend -> Edit backend.');
        console.log('3. Add a new secret with the name `GEMINI_API_KEY` and paste your key as the value.');
        console.log('4. For local development, also add this key to your `.env` file.');

      } else if (result.error?.includes('permission_denied') || result.error?.includes('API has not been used')) {
        console.log('\n[DIAGNOSIS] The API key is likely valid, but the Google AI API may not be enabled for your project.');
        console.log('\nTo fix this:');
        console.log('1. Go to the Google Cloud Console for your project: https://console.cloud.google.com/');
        console.log('2. In the search bar, type "Generative Language API" and select it.');
        console.log('3. Click the "Enable" button if it is not already enabled.');
      } else {
        console.log('\n[DIAGNOSIS] An unknown error occurred. Please check the error details above and your network connection.');
      }
    }
  } catch (e: any) {
    console.error('\n❌ UNEXPECTED SCRIPT ERROR:', e.message);
  } finally {
    const endTime = performance.now();
    console.log(`\n✨ Done in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
  }
}

runTest().finally(() => process.exit());
