
import { seedAppSettings } from '@/services/seed-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Seeding Application Settings...');
  try {
    const result = await seedAppSettings();
    console.log('\n✅ SUCCESS: Application settings seeding complete!');
    if (result.details) {
        result.details.forEach(detail => console.log(`- ${detail}`));
    }
  } catch (e: any) {
    console.error('\n❌ ERROR: Failed to seed application settings.');
    console.error(e.message);
  } finally {
    process.exit();
  }
}

run();
