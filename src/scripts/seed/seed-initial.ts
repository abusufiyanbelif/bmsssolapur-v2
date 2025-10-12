
import { seedInitialUsersAndQuotes } from '@/services/seed-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Seeding Initial Data (Organization & Quotes)...');
  try {
    const result = await seedInitialUsersAndQuotes();
    console.log('\n✅ SUCCESS: Initial data seeding complete!');
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed initial data.');
    console.error(e.message);
  } finally {
    process.exit();
  }
}

run();
