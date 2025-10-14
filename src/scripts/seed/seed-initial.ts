

import { seedInitialUsersAndQuotes } from '@/services/seed-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Seeding Initial Data (Inspirational Quotes)...');
  try {
    const result = await seedInitialUsersAndQuotes();
    console.log(`\n✅ SUCCESS: ${result.message}`);
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed initial data.');
    console.error('------------------------------------------');
    console.error('Error Details:', e.message);
    console.error('------------------------------------------');
    console.log('\nThis usually indicates a problem connecting to the database or a permissions issue. Please run `npm run test:db` to diagnose.');
  } finally {
    process.exit();
  }
}

run();
